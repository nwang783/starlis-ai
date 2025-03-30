# Starlis Call Handling API

This service provides an API for making outbound calls using Twilio and ElevenLabs for voice AI integration.

## Base URL
```
https://voip.starlis.tech
```

## Authentication
All endpoints require user authentication through Firebase. The user ID must be provided in the requests.

## API Endpoints

### Health Check
```bash
GET /
```
Checks if the server is running.

**Response:**
```json
{
    "message": "Server is running"
}
```

### Make Outbound Call
```bash
POST /outbound-call
```

Initiates an outbound call to a specified phone number.

**Request Body:**
```json
{
    "user_id": "string",      // Required: Firebase user ID
    "number": "string",       // Required: Phone number to call (E.164 format)
    "prompt": "string",       // Optional: Initial prompt for the AI
    "first_message": "string" // Optional: First message to say
}
```

**Curl Command:**
```bash
curl -X POST https://voip.starlis.tech/outbound-call \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "number": "+1234567890",
    "prompt": "You are a helpful assistant",
    "first_message": "Hello, this is an automated call"
  }'
```

**Response:**
```json
{
    "success": true,
    "message": "Call initiated",
    "callSid": "CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

### End Call
```bash
POST /end-call
```

Ends an ongoing call.

**Request Body:**
```json
{
    "callSid": "string",  // Required: Twilio Call SID
    "user_id": "string"   // Required: Firebase user ID
}
```

**Curl Command:**
```bash
curl -X POST https://voip.starlis.tech/end-call \
  -H "Content-Type: application/json" \
  -d '{
    "callSid": "CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "user_id": "your-user-id"
  }'
```

**Response:**
```json
{
    "success": true,
    "message": "Call ended successfully"
}
```

### Check Call Status
```bash
GET /call-status
```

Retrieves the current status of a call.

**Query Parameters:**
- `callSid`: string (Required) - Twilio Call SID
- `user_id`: string (Required) - Firebase user ID

**Curl Command:**
```bash
curl "https://voip.starlis.tech/call-status?callSid=CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&user_id=your-user-id"
```

**Response:**
```json
{
    "success": true,
    "callSid": "CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "status": "in-progress",
    "startTime": "2024-03-21T10:00:00Z",
    "endTime": null,
    "duration": "120"
}
```

## WebSocket Streaming

### Media Stream Connection
```bash
WebSocket: wss://voip.starlis.tech/outbound-media-stream
```

The WebSocket endpoint handles real-time media streaming between Twilio and ElevenLabs.

**Query Parameters:**
- `user_id`: string (Required) - Firebase user ID
- `prompt`: string (Optional) - Initial prompt for the AI
- `first_message`: string (Optional) - First message to say

**Example WebSocket Connection:**
```javascript
const ws = new WebSocket('wss://voip.starlis.tech/outbound-media-stream?user_id=your-user-id&prompt=Your prompt&first_message=Your first message');

ws.onopen = () => {
    console.log('Connected to media stream');
};

ws.onmessage = (event) => {
    console.log('Received message:', event.data);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('Disconnected from media stream');
};
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
    "error": "User ID and phone number are required"
}
```

**500 Internal Server Error:**
```json
{
    "success": false,
    "error": "Error message description"
}
```

## Prerequisites

Before using the API, ensure you have:

1. **Firebase Setup**
   - A Firebase project with user authentication
   - Service account credentials

2. **Twilio Account**
   - Account SID
   - Auth Token
   - Phone Number

3. **ElevenLabs Account**
   - Agent ID
   - API Key

## Environment Variables

Required environment variables in `.env`:
```env
ELEVENLABS_AGENT_ID=your-elevenlabs-agent-id
ELEVENLABS_API_KEY=your-elevenlabs-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-service-account-json
```

## Important Notes

1. Phone numbers must be in E.164 format (e.g., +1234567890)
2. The WebSocket connection is used for real-time media streaming
3. Call status updates are available through the `/call-status` endpoint
4. All HTTP endpoints use HTTPS
5. WebSocket connections use WSS (secure WebSocket)
6. All responses are in JSON format except for TwiML responses which are in XML

## Example Usage Flow

1. **Initiate a Call:**
```bash
curl -X POST https://voip.starlis.tech/outbound-call \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "number": "+1234567890",
    "prompt": "You are a helpful assistant",
    "first_message": "Hello, this is an automated call"
  }'
```

2. **Check Call Status:**
```bash
curl "https://voip.starlis.tech/call-status?callSid=CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&user_id=your-user-id"
```

3. **End the Call:**
```bash
curl -X POST https://voip.starlis.tech/end-call \
  -H "Content-Type: application/json" \
  -d '{
    "callSid": "CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "user_id": "your-user-id"
  }'
```
