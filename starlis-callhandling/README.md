# Starlis Call Handling System

A system for handling outbound calls with real-time audio streaming and transcription.

## API Documentation

### Endpoints

#### 1. Initiate Outbound Call
```bash
POST https://voip.starlis.tech/outbound-call
Content-Type: application/json

{
  "user_id": "user123",
  "number": "+1234567890",
  "prompt": "You are a helpful customer service agent",
  "first_message": "Hello! How can I help you today?"
}
```

Response:
```json
{
  "success": true,
  "message": "Call initiated",
  "callSid": "CA123456789"
}
```

#### 2. End Call
```bash
POST https://voip.starlis.tech/end-call
Content-Type: application/json

{
  "callSid": "CA123456789",
  "user_id": "user123"
}
```

Response:
```json
{
  "success": true,
  "message": "Call ended successfully"
}
```

#### 3. Check Call Status
```bash
GET https://voip.starlis.tech/call-status?callSid=CA123456789&user_id=user123
```

Response:
```json
{
  "success": true,
  "callSid": "CA123456789",
  "status": "in-progress",
  "startTime": "2024-03-20T10:00:00Z",
  "endTime": null,
  "duration": 120
}
```

### WebSocket Endpoints

#### 1. Frontend Media Stream
```javascript
// Connect to WebSocket
const ws = new WebSocket(`wss://voip.starlis.tech/frontend-stream?callSid=${callSid}&user_id=${userId}`);

// Send connect-twilio event
ws.send(JSON.stringify({
  event: 'connect-twilio',
  callSid: callSid,
  user_id: userId
}));

// Handle incoming messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.event) {
    case 'audio':
      // Handle audio data
      console.log('Received audio data');
      break;
    case 'transcription':
      // Handle transcription
      console.log('Received transcription:', data.text);
      break;
  }
};
```

### Example Usage

#### 1. Making a Call
```javascript
// 1. Initiate call
const callResponse = await fetch('https://voip.starlis.tech/outbound-call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'user123',
    number: '+1234567890',
    prompt: 'You are a helpful customer service agent',
    first_message: 'Hello! How can I help you today?'
  })
});
const { callSid } = await callResponse.json();

// 2. Connect to WebSocket for audio streaming
const ws = new WebSocket(`wss://voip.starlis.tech/frontend-stream?callSid=${callSid}&user_id=user123`);

// 3. Handle WebSocket events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === 'audio') {
    // Handle audio playback
  } else if (data.event === 'transcription') {
    // Update UI with transcription
  }
};

// 4. End call when needed
const endCallResponse = await fetch('https://voip.starlis.tech/end-call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    callSid,
    user_id: 'user123'
  })
});
```

### Error Handling

All endpoints may return the following error responses:

```json
// 400 Bad Request
{
  "error": "User ID and phone number are required"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to initiate call"
}
```

### WebSocket Events

#### Frontend to Server
- `connect-twilio`: Connect to Twilio media stream
  ```json
  {
    "event": "connect-twilio",
    "callSid": "CA123456789",
    "user_id": "user123"
  }
  ```

#### Server to Frontend
- `audio`: Audio data from the call
  ```json
  {
    "event": "audio",
    "payload": "base64_encoded_audio_data"
  }
  ```
- `transcription`: Transcription of the conversation
  ```json
  {
    "event": "transcription",
    "text": "Transcribed text"
  }
  ```

### Rate Limiting

- Call initiation: 5 requests per minute
- WebSocket connections: 3 concurrent connections per user

### Best Practices

1. **Error Handling**:
   - Implement proper error handling for all API calls
   - Handle WebSocket disconnections gracefully
   - Implement reconnection logic for WebSocket connections

2. **WebSocket Usage**:
   - Clean up WebSocket connections when done
   - Handle connection errors appropriately
   - Implement heartbeat mechanism for long connections

3. **Audio Handling**:
   - Buffer audio data appropriately
   - Handle audio format conversion if needed
   - Implement proper audio playback controls
