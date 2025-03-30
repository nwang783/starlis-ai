# Starlis Call Handling System

A robust system for handling outbound calls using Twilio, ElevenLabs, and Firebase.

## Overview

This system enables automated outbound calling with AI-powered voice responses using ElevenLabs' conversational AI. It handles call initiation, media streaming, and call management through a RESTful API and WebSocket connections.

## Prerequisites

- Node.js (v14 or higher)
- Firebase project with Firestore database
- Twilio account with:
  - Account SID
  - Auth Token
  - Phone Number
- ElevenLabs account with:
  - Agent ID
  - API Key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd starlis-callhandling
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Security
JWT_SECRET=your-secure-jwt-secret-key
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-backend-domain.com

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-service-account-json
```

4. Start the server:
```bash
npm start
```

## API Documentation

### Base URL
```
https://voip.starlis.tech
```

### Authentication

All endpoints require two levels of authentication:

1. **Origin Validation**: Requests must come from allowed domains specified in `ALLOWED_ORIGINS`
2. **JWT Token**: A valid JWT token must be included in the request

#### Generating JWT Tokens

To generate a valid JWT token, use the following format:

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { 
    source: 'frontend', // or 'backend'
    timestamp: Date.now()
  },
  'your-secure-jwt-secret-key',
  { expiresIn: '1h' }
);
```

#### Using JWT Tokens

Include the token in the Authorization header for HTTP requests:
```bash
Authorization: Bearer your-jwt-token
```

For WebSocket connections, include the token as a query parameter:
```javascript
const ws = new WebSocket(`wss://voip.starlis.tech/outbound-media-stream?token=your-jwt-token`);
```

### Endpoints

#### 1. Health Check
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

#### 2. Initiate Outbound Call
```bash
POST /outbound-call
```

**Headers:**
```bash
Authorization: Bearer your-jwt-token
Origin: https://your-frontend-domain.com
```

**Request Body:**
```json
{
    "user_id": "string",      // Required: Firebase user ID
    "number": "string",       // Required: Phone number to call (E.164 format)
    "prompt": "string",       // Optional: Initial prompt for the AI
    "first_message": "string" // Optional: First message to say
}
```

**Example:**
```bash
curl -X POST https://voip.starlis.tech/outbound-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Origin: https://your-frontend-domain.com" \
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

#### 3. End Call
```bash
POST /end-call
```

**Headers:**
```bash
Authorization: Bearer your-jwt-token
Origin: https://your-frontend-domain.com
```

**Request Body:**
```json
{
    "callSid": "string",  // Required: Twilio Call SID
    "user_id": "string"   // Required: Firebase user ID
}
```

**Example:**
```bash
curl -X POST https://voip.starlis.tech/end-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Origin: https://your-frontend-domain.com" \
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

#### 4. Check Call Status
```bash
GET /call-status
```

**Headers:**
```bash
Authorization: Bearer your-jwt-token
Origin: https://your-frontend-domain.com
```

**Query Parameters:**
- `callSid`: string (Required) - Twilio Call SID
- `user_id`: string (Required) - Firebase user ID

**Example:**
```bash
curl "https://voip.starlis.tech/call-status?callSid=CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&user_id=your-user-id" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Origin: https://your-frontend-domain.com"
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

### WebSocket Endpoint

#### Media Stream
```bash
WebSocket: wss://voip.starlis.tech/outbound-media-stream?token=your-jwt-token
```

**Example WebSocket Connection:**
```javascript
const ws = new WebSocket(`wss://voip.starlis.tech/outbound-media-stream?token=your-jwt-token`);
```

### Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
    "error": "No token provided"
}
```
or
```json
{
    "error": "Invalid token"
}
```

**403 Forbidden:**
```json
{
    "error": "Unauthorized origin"
}
```

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

## Firebase Configuration

The system uses Firebase to store user credentials. Each user document in Firestore should have the following structure:

```json
{
    "voice": {
        "elevenLabsAgentId": "string",
        "elevenLabsApiKey": "string",
        "twilioApiKey": "string",
        "twilioPhoneNumber": "string",
        "twilioSid": "string"
    }
}
```

## Security Considerations

1. All API endpoints are served over HTTPS
2. WebSocket connections use WSS (secure WebSocket)
3. User authentication is required for all endpoints
4. Sensitive credentials are stored in Firebase and not exposed in API responses
5. Environment variables should be kept secure and never committed to version control
6. JWT tokens expire after 1 hour
7. Only requests from allowed origins are accepted
8. All requests must include a valid JWT token

## Support

For support or questions, please contact the development team or create an issue in the repository.
