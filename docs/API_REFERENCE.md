# Atomic Chat API Reference

## Base URL

**Development**: `http://localhost:3001/api`
**Production**: `https://your-domain.com/api`

## Authentication

All API endpoints (except registration and login) require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "error": "Error message (if applicable)"
}
```

## Endpoints

### Authentication

#### Register User
Create a new user account.

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Validation Rules**:
- `username`: 3-50 characters, alphanumeric and underscores only
- `password`: Minimum 6 characters

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "status": "offline",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses**:
- `400`: Invalid input or username already exists
- `500`: Internal server error

#### Login User
Authenticate with existing credentials.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "status": "online",
      "lastSeen": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses**:
- `400`: Missing credentials
- `401`: Invalid credentials
- `500`: Internal server error

#### Get Current User
Get information about the authenticated user.

**Endpoint**: `GET /auth/me`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "username": "john_doe",
    "status": "online",
    "lastSeen": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses**:
- `401`: Invalid or missing token
- `404`: User not found
- `500`: Internal server error

### Channels

#### List Channels
Get all channels the authenticated user is a member of.

**Endpoint**: `GET /channels`

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "channel-uuid",
      "name": "general",
      "description": "General discussion",
      "isPrivate": false,
      "createdBy": "user-uuid",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Error Responses**:
- `401`: Invalid or missing token
- `500`: Internal server error

#### Create Channel
Create a new channel.

**Endpoint**: `POST /channels`

**Request Body**:
```json
{
  "name": "general",
  "description": "General discussion channel",
  "isPrivate": false
}
```

**Validation Rules**:
- `name`: 3-100 characters, required
- `description`: Optional, max 500 characters
- `isPrivate`: Boolean, defaults to false

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "channel-uuid",
    "name": "general",
    "description": "General discussion channel",
    "isPrivate": false,
    "createdBy": "user-uuid",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses**:
- `400`: Invalid input
- `401`: Invalid or missing token
- `500`: Internal server error

#### Join Channel
Join an existing channel.

**Endpoint**: `POST /channels/:channelId/join`

**URL Parameters**:
- `channelId`: UUID of the channel to join

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Joined channel successfully"
  }
}
```

**Error Responses**:
- `400`: Already a member
- `401`: Invalid or missing token
- `403`: Private channel (if access restrictions apply)
- `404`: Channel not found
- `500`: Internal server error

#### Leave Channel
Leave a channel.

**Endpoint**: `POST /channels/:channelId/leave`

**URL Parameters**:
- `channelId`: UUID of the channel to leave

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Left channel successfully"
  }
}
```

**Error Responses**:
- `401`: Invalid or missing token
- `404`: Channel not found
- `500`: Internal server error

#### Get Channel Messages
Retrieve messages from a channel.

**Endpoint**: `GET /channels/:channelId/messages`

**URL Parameters**:
- `channelId`: UUID of the channel

**Query Parameters**:
- `limit`: Number of messages to retrieve (default: 50, max: 100)
- `before`: ISO timestamp to get messages before this time

**Example**: `GET /channels/channel-uuid/messages?limit=20&before=2024-01-01T00:00:00Z`

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "message-uuid",
      "channelId": "channel-uuid",
      "userId": "user-uuid",
      "content": "Hello, world!",
      "type": "text",
      "voicemailId": null,
      "edited": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-uuid",
        "username": "john_doe",
        "status": "online"
      },
      "voicemail": null
    }
  ]
}
```

**Error Responses**:
- `401`: Invalid or missing token
- `403`: Not a member of the channel
- `404`: Channel not found
- `500`: Internal server error

### Messages

#### Send Message
Send a message to a channel.

**Endpoint**: `POST /messages`

**Request Body**:
```json
{
  "channelId": "channel-uuid",
  "content": "Hello, world!",
  "type": "text",
  "voicemailId": null
}
```

**Validation Rules**:
- `channelId`: Required, valid channel UUID
- `content`: Required for text messages
- `type`: "text" or "voicemail"
- `voicemailId`: Required for voicemail messages

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "channelId": "channel-uuid",
    "userId": "user-uuid",
    "content": "Hello, world!",
    "type": "text",
    "voicemailId": null,
    "edited": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "status": "online"
    },
    "voicemail": null
  }
}
```

**Error Responses**:
- `400`: Invalid input
- `401`: Invalid or missing token
- `403`: Not a member of the channel
- `500`: Internal server error

#### Edit Message
Edit an existing message.

**Endpoint**: `PUT /messages/:messageId`

**URL Parameters**:
- `messageId`: UUID of the message to edit

**Request Body**:
```json
{
  "content": "Updated message content"
}
```

**Validation Rules**:
- `content`: Required, non-empty string

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "channelId": "channel-uuid",
    "userId": "user-uuid",
    "content": "Updated message content",
    "type": "text",
    "voicemailId": null,
    "edited": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:01:00Z",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "status": "online"
    },
    "voicemail": null
  }
}
```

**Error Responses**:
- `400`: Invalid input
- `401`: Invalid or missing token
- `403`: Not the message owner
- `404`: Message not found
- `500`: Internal server error

#### Delete Message
Delete a message.

**Endpoint**: `DELETE /messages/:messageId`

**URL Parameters**:
- `messageId`: UUID of the message to delete

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Message deleted successfully"
  }
}
```

**Error Responses**:
- `401`: Invalid or missing token
- `403`: Not the message owner
- `404`: Message not found
- `500`: Internal server error

### Voicemail

#### Upload Voicemail
Upload an audio voicemail.

**Endpoint**: `POST /voicemail`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `audio`: Audio file (WebM, OGG, WAV, MP3)
- `channelId`: Target channel UUID
- `duration`: Audio duration in seconds

**File Constraints**:
- Max size: 10MB
- Allowed types: audio/webm, audio/ogg, audio/wav, audio/mpeg

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "voicemail-uuid",
    "channelId": "channel-uuid",
    "userId": "user-uuid",
    "filename": "voicemail-1234567890.webm",
    "duration": 30,
    "mimeType": "audio/webm",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses**:
- `400`: Invalid file or missing required fields
- `401`: Invalid or missing token
- `403`: Not a member of the channel
- `413`: File too large
- `500`: Internal server error

#### Get Voicemail
Download a voicemail file.

**Endpoint**: `GET /voicemail/:filename`

**URL Parameters**:
- `filename`: Voicemail filename

**Success Response** (200):
- Returns the audio file with appropriate content-type

**Error Responses**:
- `401`: Invalid or missing token
- `404`: File not found
- `500`: Internal server error

### Calls

#### Call Offer
Initiate a WebRTC call.

**Endpoint**: `POST /calls/offer`

**Request Body**:
```json
{
  "channelId": "channel-uuid",
  "callerId": "caller-uuid",
  "calleeId": "callee-uuid",
  "type": "video",
  "sdp": {
    "type": "offer",
    "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
  }
}
```

**Validation Rules**:
- `channelId`: Required, valid channel UUID
- `callerId`: Required, caller's user UUID
- `calleeId`: Required, callee's user UUID
- `type`: "audio" or "video"
- `sdp`: WebRTC SDP offer

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "callId": "call-uuid",
    "callerId": "caller-uuid",
    "calleeId": "callee-uuid",
    "type": "video",
    "sdp": {
      "type": "offer",
      "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
    }
  }
}
```

**Error Responses**:
- `400`: Invalid input
- `401`: Invalid or missing token
- `403`: Not a member of the channel
- `404`: Callee not found
- `500`: Internal server error

#### Call Answer
Answer an incoming call.

**Endpoint**: `POST /calls/answer`

**Request Body**:
```json
{
  "callId": "call-uuid",
  "calleeId": "callee-uuid",
  "sdp": {
    "type": "answer",
    "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
  }
}
```

**Validation Rules**:
- `callId`: Required, valid call UUID
- `calleeId`: Required, callee's user UUID
- `sdp`: WebRTC SDP answer

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "callId": "call-uuid",
    "calleeId": "callee-uuid",
    "sdp": {
      "type": "answer",
      "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
    }
  }
}
```

**Error Responses**:
- `400`: Invalid input
- `401`: Invalid or missing token
- `403`: Not the call recipient
- `404`: Call not found
- `500`: Internal server error

#### ICE Candidate
Exchange ICE candidates for WebRTC connection.

**Endpoint**: `POST /calls/ice`

**Request Body**:
```json
{
  "callId": "call-uuid",
  "candidate": {
    "candidate": "candidate:1 1 UDP 2130706431 192.168.1.1 54400 typ host",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

**Validation Rules**:
- `callId`: Required, valid call UUID
- `candidate`: WebRTC ICE candidate

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "callId": "call-uuid",
    "candidate": {
      "candidate": "candidate:1 1 UDP 2130706431 192.168.1.1 54400 typ host",
      "sdpMid": "0",
      "sdpMLineIndex": 0
    }
  }
}
```

**Error Responses**:
- `400`: Invalid input
- `401`: Invalid or missing token
- `403`: Not a call participant
- `404`: Call not found
- `500`: Internal server error

#### End Call
Terminate an active call.

**Endpoint**: `POST /calls/:callId/end`

**URL Parameters**:
- `callId`: UUID of the call to end

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Call ended successfully"
  }
}
```

**Error Responses**:
- `401`: Invalid or missing token
- `403`: Not a call participant
- `404`: Call not found
- `500`: Internal server error

### Initialization

#### Get Initial Data
Bootstrap client with initial application state.

**Endpoint**: `GET /init`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "status": "online",
      "lastSeen": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "channels": [
      {
        "id": "channel-uuid",
        "name": "general",
        "description": "General discussion",
        "isPrivate": false,
        "createdBy": "user-uuid",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "unreadCounts": {
      "channel-uuid": 5
    },
    "users": [
      {
        "id": "user-uuid",
        "username": "john_doe",
        "status": "online",
        "lastSeen": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- `401`: Invalid or missing token
- `404`: User not found
- `500`: Internal server error

### Health Check

#### Health Status
Check server health status.

**Endpoint**: `GET /health`

**Success Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **General API**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 413 | Payload Too Large |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## WebSocket Events

### Client → Server Events

#### Join Channel
```json
{
  "type": "join_channel",
  "payload": {
    "channelId": "channel-uuid"
  }
}
```

#### Leave Channel
```json
{
  "type": "leave_channel",
  "payload": {
    "channelId": "channel-uuid"
  }
}
```

#### Typing Indicator
```json
{
  "type": "typing",
  "payload": {
    "channelId": "channel-uuid",
    "isTyping": true
  }
}
```

#### Presence Update
```json
{
  "type": "presence_update",
  "payload": {
    "status": "online"
  }
}
```

### Server → Client Events

#### New Message
```json
{
  "type": "new_message",
  "payload": {
    "id": "message-uuid",
    "channelId": "channel-uuid",
    "userId": "user-uuid",
    "content": "Hello, world!",
    "type": "text",
    "createdAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "status": "online"
    }
  }
}
```

#### Message Edited
```json
{
  "type": "message_edited",
  "payload": {
    "id": "message-uuid",
    "content": "Updated content",
    "edited": true
  }
}
```

#### Message Deleted
```json
{
  "type": "message_deleted",
  "payload": {
    "messageId": "message-uuid"
  }
}
```

#### Voicemail Created
```json
{
  "type": "voicemail_created",
  "payload": {
    "id": "voicemail-uuid",
    "channelId": "channel-uuid",
    "userId": "user-uuid",
    "filename": "voicemail.webm",
    "duration": 30,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Call Offer
```json
{
  "type": "call_offer",
  "payload": {
    "callId": "call-uuid",
    "callerId": "caller-uuid",
    "type": "video",
    "sdp": {
      "type": "offer",
      "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
    }
  }
}
```

#### Call Answer
```json
{
  "type": "call_answer",
  "payload": {
    "callId": "call-uuid",
    "calleeId": "callee-uuid",
    "sdp": {
      "type": "answer",
      "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
    }
  }
}
```

#### Call ICE Candidate
```json
{
  "type": "call_ice_candidate",
  "payload": {
    "callId": "call-uuid",
    "candidate": {
      "candidate": "candidate:1 1 UDP 2130706431 192.168.1.1 54400 typ host",
      "sdpMid": "0",
      "sdpMLineIndex": 0
    }
  }
}
```

#### Call Ended
```json
{
  "type": "call_ended",
  "payload": {
    "callId": "call-uuid"
  }
}
```

#### Presence Update
```json
{
  "type": "presence_update",
  "payload": {
    "userId": "user-uuid",
    "status": "online"
  }
}
```

## WebSocket Connection

### Connection URL
```
ws://localhost:3001/ws?token=<your-jwt-token>
```

### Connection States
- **Connected**: Successfully authenticated and connected
- **Disconnected**: Connection lost, will attempt reconnection
- **Error**: Connection error, check token and network

### Reconnection Logic
The client automatically attempts to reconnect every 5 seconds if the connection is lost.

## Testing

### Using cURL

#### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

#### Get Channels
```bash
curl -X GET http://localhost:3001/api/channels \
  -H "Authorization: Bearer <your-token>"
```

### Using Postman

1. Import the API endpoints
2. Set base URL to `http://localhost:3001/api`
3. Add authentication token to headers
4. Test endpoints individually

## SDK Integration

### JavaScript/TypeScript

```typescript
import { api } from './services/api';

// Login
const response = await api.auth.login({
  username: 'john_doe',
  password: 'password123'
});

// Get channels
const channels = await api.channels.list();

// Send message
const message = await api.messages.send({
  channelId: 'channel-uuid',
  content: 'Hello, world!',
  type: 'text'
});
```

### WebSocket Integration

```typescript
import { wsService } from './services/websocket';

// Connect
wsService.connect(token);

// Listen for events
wsService.on('new_message', (message) => {
  console.log('New message:', message);
});

// Send events
wsService.send('typing', {
  channelId: 'channel-uuid',
  isTyping: true
});
```

## Best Practices

1. **Always validate tokens** before making authenticated requests
2. **Handle rate limiting** gracefully with exponential backoff
3. **Use WebSocket** for real-time features instead of polling
4. **Cache initialization data** to reduce API calls
5. **Implement proper error handling** for all API calls
6. **Use pagination** for large message lists
7. **Clean up WebSocket connections** when user logs out
8. **Implement token refresh** (to be added)

## Changelog

### Version 1.0.0
- Initial API release
- Authentication endpoints
- Channel management
- Real-time messaging
- Voicemail support
- WebRTC calling
- Presence system
