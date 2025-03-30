import fastifyFormBody from '@fastify/formbody';
import fastifyWs from '@fastify/websocket';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import Twilio from 'twilio';
import WebSocket from 'ws';
import admin from 'firebase-admin';

// Load environment variables from .env file
dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const firestore = admin.firestore();

// Initialize Fastify server
const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

const PORT = process.env.PORT || 8000;

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

    const voiceData = userDoc.data().voice || {};
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
fastify.post('/outbound-call', async (request, reply) => {
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

// WebSocket route for handling media streams
fastify.register(async (fastifyInstance) => {
  fastifyInstance.get('/outbound-media-stream', { websocket: true }, (ws, req) => {
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

// Start the Fastify server
fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`[Server] Listening on port ${PORT}`);
});