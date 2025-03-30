import fastifyFormBody from '@fastify/formbody';
import fastifyWs from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import Twilio from 'twilio';
import WebSocket from 'ws';
import admin from 'firebase-admin';
import { verifyToken, generateToken } from './jwtUtils.js';

// Load environment variables from .env file
dotenv.config();

// Debug environment variables
console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const firestore = admin.firestore();

// Initialize Fastify server
const fastify = Fastify();

// Register plugins
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);
fastify.register(fastifyCors, {
  origin: (origin, cb) => {
    // Allow requests with no origin
    if (!origin) return cb(null, true);
    
    // Allow localhost during development
    if (origin === 'http://localhost:3000' || 
        origin === 'http://localhost:5173' || 
        origin === 'https://kzmqjg22ogdq7cd0q4bw.lite.vusercontent.net') {
      return cb(null, true);
    }
    
    // Check if the origin is in the allowed list
    const ALLOWED_ORIGINS = [
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
      'https://kzmqjg22ogdq7cd0q4bw.lite.vusercontent.net', // Vite preview origin
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];
    if (ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      console.error('Unauthorized origin:', origin);
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
  exposedHeaders: ['Content-Type', 'Authorization'],
  hideOptionsRoute: true,
  strictPreflight: true
});

const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  'https://kzmqjg22ogdq7cd0q4bw.lite.vusercontent.net', // Vite preview origin
  ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
];

// Authentication middleware
const authenticateRequest = async (request, reply) => {
  try {
    // Check origin
    const origin = request.headers.origin;
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return reply.code(403).send({ error: 'Unauthorized origin' });
    }

    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token using our utility function
    const decoded = verifyToken(token);
    
    // Add decoded token to request for later use
    request.user = decoded;
    
    return;
  } catch (error) {
    if (error.message === 'Token has already been used') {
      return reply.code(401).send({ 
        error: 'Token has already been used. Please generate a new token.' 
      });
    }
    return reply.code(401).send({ error: error.message || 'Invalid token' });
  }
};

// Root route for health check
fastify.get('/', async (_, reply) => {
  reply.send({ message: 'Server is running' });
});

// Helper function to get credentials from Firestore
async function getUserCredentials(userId) {
  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error(`User document not found for user ID: ${userId}`);
    }

    const voiceData = userDoc.data().onboarding?.voice || {};
    const {
      elevenLabsAgentId,
      elevenLabsApiKey,
      twilioApiKey,
      twilioPhoneNumber,
      twilioSid
    } = voiceData;

    // Validate all required credentials
    if (!elevenLabsAgentId || !elevenLabsApiKey || 
        !twilioApiKey || !twilioPhoneNumber || !twilioSid) {
      throw new Error('Missing required credentials in Firestore document');
    }

    return {
      elevenLabsAgentId,
      elevenLabsApiKey,
      twilioClient: new Twilio(twilioSid, twilioApiKey),
      twilioPhoneNumber
    };
  } catch (error) {
    console.error('Error fetching user credentials:', error);
    throw error;
  }
}

// Helper function to get signed URL for authenticated conversations
async function getSignedUrl(elevenLabsAgentId, elevenLabsApiKey) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${elevenLabsAgentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsApiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get signed URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.signed_url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}

// Route to initiate outbound calls
fastify.post('/outbound-call', { preHandler: authenticateRequest }, async (request, reply) => {
  const { user_id, number, prompt, first_message } = request.body;

  if (!user_id || !number) {
    return reply.code(400).send({ 
      error: 'User ID and phone number are required' 
    });
  }

  try {
    // Fetch user credentials from Firestore
    const { 
      twilioClient, 
      twilioPhoneNumber 
    } = await getUserCredentials(user_id);

    const call = await twilioClient.calls.create({
      from: twilioPhoneNumber,
      to: number,
      url: `https://${request.headers.host}/outbound-call-twiml?user_id=${encodeURIComponent(user_id)}&prompt=${encodeURIComponent(
        prompt
      )}&first_message=${encodeURIComponent(first_message)}`,
    });

    reply.send({
      success: true,
      message: 'Call initiated',
      callSid: call.sid,
    });
  } catch (error) {
    console.error('Error initiating outbound call:', error);
    reply.code(500).send({
      success: false,
      error: error.message || 'Failed to initiate call',
    });
  }
});

// TwiML route for outbound calls
fastify.all('/outbound-call-twiml', async (request, reply) => {
  const user_id = request.query.user_id || '';
  const prompt = request.query.prompt || '';
  const first_message = request.query.first_message || '';

  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Connect>
        <Stream url="wss://${request.headers.host}/outbound-media-stream">
            <Parameter name="user_id" value="${user_id}" />
            <Parameter name="prompt" value="${prompt}" />
            <Parameter name="first_message" value="${first_message}" />
        </Stream>
        </Connect>
    </Response>`;

  reply.type('text/xml').send(twimlResponse);
});

// Route to end an ongoing call
fastify.post('/end-call', { preHandler: authenticateRequest }, async (request, reply) => {
  const { callSid, user_id } = request.body;

  if (!callSid || !user_id) {
    return reply.code(400).send({ 
      error: 'Call SID and User ID are required' 
    });
  }

  try {
    // Fetch user credentials from Firestore
    const { twilioClient } = await getUserCredentials(user_id);

    // Update the call status to 'completed' to end the call
    await twilioClient.calls(callSid).update({ status: 'completed' });

    reply.send({
      success: true,
      message: 'Call ended successfully',
    });
  } catch (error) {
    console.error('Error ending call:', error);
    reply.code(500).send({
      success: false,
      error: error.message || 'Failed to end call',
    });
  }
});

// Route to check the status of a call
fastify.get('/call-status', { preHandler: authenticateRequest }, async (request, reply) => {
  const { callSid, user_id } = request.query;

  if (!callSid || !user_id) {
    return reply.code(400).send({ 
      error: 'Call SID and User ID are required' 
    });
  }

  try {
    // Fetch user credentials from Firestore
    const { twilioClient } = await getUserCredentials(user_id);

    // Fetch call details from Twilio
    const callDetails = await twilioClient.calls(callSid).fetch();

    reply.send({
      success: true,
      callSid: callDetails.sid,
      status: callDetails.status, // e.g., queued, ringing, in-progress, completed, etc.
      startTime: callDetails.startTime,
      endTime: callDetails.endTime,
      duration: callDetails.duration,
    });
  } catch (error) {
    console.error('Error fetching call status:', error);
    reply.code(500).send({
      success: false,
      error: error.message || 'Failed to fetch call status',
    });
  }
});

// WebSocket route for handling media streams
fastify.register(async (fastifyInstance) => {
  fastifyInstance.get('/outbound-media-stream', { 
    websocket: true,
    preHandler: async (request, reply) => {
      try {
        // Check origin
        const origin = request.headers.origin;
        if (!ALLOWED_ORIGINS.includes(origin)) {
          return reply.code(403).send({ error: 'Unauthorized origin' });
        }

        // Get token from query parameters
        const token = request.query.token;
        if (!token) {
          return reply.code(401).send({ error: 'No token provided' });
        }

        // Verify token
        const decoded = verifyToken(token);
        request.user = decoded;
      } catch (error) {
        return reply.code(401).send({ error: 'Invalid token' });
      }
    }
  }, (ws, req) => {
    console.info('[Server] Twilio connected to outbound media stream');

    // Variables to track the call
    let streamSid = null;
    let callSid = null;
    let elevenLabsWs = null;
    let customParameters = null;
    let userCredentials = null;

    // Set up ElevenLabs connection
    const setupElevenLabs = async () => {
      try {
        // Fetch user credentials from Firestore
        userCredentials = await getUserCredentials(customParameters.user_id);
        
        const signedUrl = await getSignedUrl(
          userCredentials.elevenLabsAgentId, 
          userCredentials.elevenLabsApiKey
        );

        console.log('[ElevenLabs] Signed URL obtained:', signedUrl);

        elevenLabsWs = new WebSocket(signedUrl);

        elevenLabsWs.on('open', () => {
          console.log('[ElevenLabs] Connected to Conversational AI');

          // Send initial configuration with prompt and first message
          const initialConfig = {
            type: 'conversation_initiation_client_data',
            dynamic_variables: {
              user_name: customParameters.user_id,
              user_id: customParameters.user_id,
            },
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt: customParameters?.prompt || 'you are a gary from the phone store',
                },
                first_message:
                  customParameters?.first_message || 'hey there! how can I help you today?',
              },
            },
          };

          console.log(
            '[ElevenLabs] Sending initial config with prompt:',
            initialConfig.conversation_config_override.agent.prompt.prompt
          );

          // Send the configuration to ElevenLabs
          elevenLabsWs.send(JSON.stringify(initialConfig));
        });

        elevenLabsWs.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            console.log('[ElevenLabs] Raw Received Message:', JSON.stringify(message, null, 2));

            switch (message.type) {
              case 'conversation_initiation_metadata':
                console.log('[ElevenLabs] Received initiation metadata');
                console.log('[ElevenLabs] Initiation Metadata Details:', JSON.stringify(message, null, 2));
                break;

              case 'audio':
                console.log('[ElevenLabs] Received Audio Message');
                console.log('[ElevenLabs] Audio Message Details:', {
                  chunkExists: !!message.audio?.chunk,
                  base64Exists: !!message.audio_event?.audio_base_64,
                  chunkLength: message.audio?.chunk?.length,
                  base64Length: message.audio_event?.audio_base_64?.length
                });

                if (streamSid) {
                  if (message.audio?.chunk) {
                    console.log('[ElevenLabs] Sending Audio Chunk via Twilio Stream');
                    const audioData = {
                      event: 'media',
                      streamSid,
                      media: {
                        payload: message.audio.chunk,
                      },
                    };
                    ws.send(JSON.stringify(audioData));
                  } else if (message.audio_event?.audio_base_64) {
                    console.log('[ElevenLabs] Sending Base64 Audio via Twilio Stream');
                    const audioData = {
                      event: 'media',
                      streamSid,
                      media: {
                        payload: message.audio_event.audio_base_64,
                      },
                    };
                    ws.send(JSON.stringify(audioData));
                  } else {
                    console.log('[ElevenLabs] No audio payload found');
                  }
                } else {
                  console.log('[ElevenLabs] Received audio but no StreamSid yet');
                }
                break;

              case 'interruption':
                console.log('[ElevenLabs] Received Interruption');
                if (streamSid) {
                  ws.send(
                    JSON.stringify({
                      event: 'clear',
                      streamSid,
                    })
                  );
                }
                break;

              case 'ping':
                console.log('[ElevenLabs] Received Ping');
                if (message.ping_event?.event_id) {
                  elevenLabsWs.send(
                    JSON.stringify({
                      type: 'pong',
                      event_id: message.ping_event.event_id,
                    })
                  );
                }
                break;

              case 'agent_response':
                console.log(
                  `[ElevenLabs] Agent Response: ${message.agent_response_event?.agent_response}`
                );
                break;

              case 'user_transcript':
                console.log(
                  `[ElevenLabs] User Transcript: ${message.user_transcription_event?.user_transcript}`
                );
                break;

              default:
                console.log(`[ElevenLabs] Unhandled message type: ${message.type}`);
            }
          } catch (error) {
            console.error('[ElevenLabs] Error processing message:', error);
          }
        });

        elevenLabsWs.on('error', (error) => {
          console.error('[ElevenLabs] WebSocket error:', error);
        });

        elevenLabsWs.on('close', () => {
          console.log('[ElevenLabs] Disconnected');
        });
      } catch (error) {
        console.error('[ElevenLabs] Setup error:', error);
      }
    };

    // Handle messages from Twilio
    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message);
        if (msg.event !== 'media') {
          console.log(`[Twilio] Received event: ${msg.event}`);
        }

        switch (msg.event) {
          case 'start':
            streamSid = msg.start.streamSid;
            callSid = msg.start.callSid;
            customParameters = msg.start.customParameters; // Store parameters
            console.log(`[Twilio] Stream started - StreamSid: ${streamSid}, CallSid: ${callSid}`);
            console.log('[Twilio] Start parameters:', customParameters);
            
            // Set up ElevenLabs connection after receiving start parameters
            setupElevenLabs();
            break;

          case 'media':
            console.log('[Twilio] Received Media Event');
            console.log('[Twilio] Media Payload Length:', msg.media.payload.length);
            
            if (elevenLabsWs?.readyState === WebSocket.OPEN) {
              const audioMessage = {
                user_audio_chunk: Buffer.from(msg.media.payload, 'base64').toString('base64'),
              };
              console.log('[Twilio] Sending Audio to ElevenLabs');
              console.log('[Twilio] Audio Chunk Length:', audioMessage.user_audio_chunk.length);
              elevenLabsWs.send(JSON.stringify(audioMessage));
            } else {
              console.log('[Twilio] ElevenLabs WebSocket not open');
            }
            break;

          case 'stop':
            console.log(`[Twilio] Stream ${streamSid} ended`);
            if (elevenLabsWs?.readyState === WebSocket.OPEN) {
              elevenLabsWs.close();
            }
            break;

          default:
            console.log(`[Twilio] Unhandled event: ${msg.event}`);
        }
      } catch (error) {
        console.error('[Twilio] Error processing message:', error);
      }
    });

    // Handle WebSocket closure
    ws.on('close', () => {
      console.log('[Twilio] Client disconnected');
      if (elevenLabsWs?.readyState === WebSocket.OPEN) {
        elevenLabsWs.close();
      }
    });
  });
});

// WebSocket route for front-end streaming
fastify.register(async (fastifyInstance) => {
  fastifyInstance.get('/frontend-stream', { 
    websocket: true,
    preHandler: async (request, reply) => {
      try {
        // Check origin
        const origin = request.headers.origin;
        if (!ALLOWED_ORIGINS.includes(origin)) {
          console.error('[WebSocket] Unauthorized origin:', origin);
          return reply.code(403).send({ error: 'Unauthorized origin' });
        }

        // Get token from query parameters
        const token = request.query.token;
        if (!token) {
          console.error('[WebSocket] No token provided');
          return reply.code(401).send({ error: 'No token provided' });
        }

        // Verify token
        try {
          const decoded = verifyToken(token);
          request.user = decoded;
          console.log('[WebSocket] Token verified successfully');
        } catch (error) {
          console.error('[WebSocket] Token verification failed:', error.message);
          return reply.code(401).send({ error: 'Invalid token' });
        }
      } catch (error) {
        console.error('[WebSocket] Pre-handler error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  }, (ws, req) => {
    console.info('[Server] Front-end WebSocket connected');

    // Extract query parameters
    const { callSid, user_id } = req.query;

    if (!callSid || !user_id) {
      console.error('[Front-end] Missing callSid or user_id in WebSocket request');
      ws.close(1008, 'Missing callSid or user_id');
      return;
    }

    console.log(`[Front-end] WebSocket connected with callSid: ${callSid}, user_id: ${user_id}`);

    // Store the WebSocket connection for streaming
    let twilioWs = null;

    // Handle messages from the front-end
    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message);
        console.log('[Front-end] Received message:', msg);

        if (msg.event === 'connect-twilio') {
          // Connect to Twilio media stream WebSocket
          const wsUrl = `wss://${req.headers.host}/outbound-media-stream?callSid=${callSid}&user_id=${user_id}`;
          console.log('[Front-end] Connecting to Twilio WebSocket:', wsUrl);
          
          twilioWs = new WebSocket(wsUrl);

          twilioWs.on('open', () => {
            console.log('[Twilio] Connected to Twilio media stream');
          });

          twilioWs.on('message', (data) => {
            try {
              const twilioMessage = JSON.parse(data);
              console.log('[Twilio] Received message type:', twilioMessage.event);

              // Forward Twilio media and transcription events to the front-end
              if (twilioMessage.event === 'media') {
                ws.send(
                  JSON.stringify({
                    event: 'audio',
                    payload: twilioMessage.media.payload,
                  })
                );
              } else if (twilioMessage.event === 'transcription') {
                ws.send(
                  JSON.stringify({
                    event: 'transcription',
                    text: twilioMessage.transcription.text,
                  })
                );
              }
            } catch (error) {
              console.error('[Twilio] Error processing message:', error);
            }
          });

          twilioWs.on('close', (code, reason) => {
            console.log(`[Twilio] Disconnected from Twilio media stream. Code: ${code}, Reason: ${reason}`);
          });

          twilioWs.on('error', (error) => {
            console.error('[Twilio] WebSocket error:', error);
          });
        }
      } catch (error) {
        console.error('[Front-end] Error processing message:', error);
      }
    });

    // Handle WebSocket closure
    ws.on('close', (code, reason) => {
      console.log(`[Front-end] WebSocket disconnected. Code: ${code}, Reason: ${reason}`);
      if (twilioWs?.readyState === WebSocket.OPEN) {
        twilioWs.close();
      }
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error('[Front-end] WebSocket error:', error);
    });
  });
});

// Token generation endpoint
fastify.post('/generate-token', async (request, reply) => {
  const { source } = request.body;

  if (!source || !['frontend', 'backend'].includes(source)) {
    return reply.code(400).send({ 
      error: 'Invalid source. Must be either "frontend" or "backend"' 
    });
  }

  try {
    const token = generateToken(source);
    reply.send({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    reply.code(500).send({
      error: 'Failed to generate token'
    });
  }
});

// Start the Fastify server
fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`[Server] Listening on port ${PORT}`);
});