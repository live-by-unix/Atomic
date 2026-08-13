# Atomic Chat

A full-stack, real-time chat application with WebRTC audio/video calling, voicemail, and comprehensive channel management. Built with modern technologies and designed for scalability.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure JWT-based registration and login system
- **Channel Management**: Create, join, and leave channels with public/private options
- **Real-time Messaging**: Instant text messaging with WebSocket support
- **Message Editing**: Edit and delete your own messages
- **Typing Indicators**: See when other users are typing
- **Presence System**: Track online/offline/idle status of users
- **Voicemail**: Record, upload, and play audio messages
- **WebRTC Calling**: Audio and video calls with peer-to-peer connections
- **Initialization Flow**: Seamless client bootstrap with user data sync

### Technical Features
- **Rate Limiting**: Protect against API abuse
- **Logging**: Comprehensive request logging
- **Type Safety**: Full TypeScript support across the stack
- **Database**: PostgreSQL with Prisma ORM
- **Docker Support**: Containerized deployment with Docker Compose
- **Responsive Design**: Mobile-friendly interface

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: WebSocket (ws library)
- **WebRTC**: Signaling server for peer-to-peer calls
- **File Upload**: Multer for voicemail storage
- **Security**: bcryptjs for password hashing, express-rate-limit

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router v6
- **Styling**: CSS with modern features
- **Real-time**: WebSocket client integration
- **Media**: WebRTC for audio/video calls, MediaRecorder for voicemail

### Shared
- **TypeScript**: Shared type definitions across client and server

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v15 or higher
- **npm**: v9 or higher
- **Docker** (optional, for containerized deployment): v20 or higher
- **Docker Compose** (optional): v2 or higher

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd atomic-chat
```

### 2. Install Dependencies

```bash
npm run install:all
```

This will install dependencies for all workspaces (shared, server, client).

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/atomic_chat?schema=public
JWT_SECRET=your-secret-key-here
PORT=3001
NODE_ENV=development
```

### 4. Set Up PostgreSQL Database

Make sure PostgreSQL is running and create a database:

```bash
# Using psql
createdb atomic_chat

# Or using Docker
docker run --name atomic-chat-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=atomic_chat \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 5. Run Database Migrations

```bash
cd server
npx prisma migrate dev
cd ..
```

This will create all necessary tables in your database.

### 6. Build Shared Types

```bash
cd shared
npm run build
cd ..
```

## 🏃 Development

### Quick Start

Use the provided development script to start both server and client:

```bash
npm run dev
```

This will:
1. Build shared TypeScript types
2. Start the Express server on port 3001
3. Start the Vite dev server on port 5173
4. Configure API proxy from client to server

### Manual Development

To run services individually:

**Server:**
```bash
cd server
npm run dev
```

**Client:**
```bash
cd client
npm run dev
```

**Shared Types (watch mode):**
```bash
cd shared
npm run dev
```

### Database Management

**Generate Prisma Client:**
```bash
cd server
npx prisma generate
```

**Run Migrations:**
```bash
cd server
npx prisma migrate dev
```

**Open Prisma Studio:**
```bash
cd server
npx prisma studio
```

## 🐳 Docker Deployment

### Using Docker Compose

The easiest way to deploy the entire application:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Express server
- Nginx (serving the React client)

### Access the Application

- **Client**: http://localhost
- **Server API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001/ws

### Docker Commands

**Build and start:**
```bash
docker-compose up -d --build
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop services:**
```bash
docker-compose down
```

**Stop and remove volumes:**
```bash
docker-compose down -v
```

## 🏗 Production Build

### Build for Production

```bash
npm run build
```

This will:
1. Build shared types
2. Build server TypeScript
3. Build client React application

### Production Deployment

**Server:**
```bash
cd server
NODE_ENV=production npm start
```

**Client:**
```bash
cd client
npm run preview
```

## 📡 API Documentation

### Authentication

**Register:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Get Current User:**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Channels

**List Channels:**
```http
GET /api/channels
Authorization: Bearer <token>
```

**Create Channel:**
```http
POST /api/channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "general",
  "description": "General discussion",
  "isPrivate": false
}
```

**Join Channel:**
```http
POST /api/channels/:channelId/join
Authorization: Bearer <token>
```

**Leave Channel:**
```http
POST /api/channels/:channelId/leave
Authorization: Bearer <token>
```

**Get Messages:**
```http
GET /api/channels/:channelId/messages?limit=50&before=timestamp
Authorization: Bearer <token>
```

### Messages

**Send Message:**
```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": "channel-id",
  "content": "Hello, world!",
  "type": "text"
}
```

**Edit Message:**
```http
PUT /api/messages/:messageId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated message"
}
```

**Delete Message:**
```http
DELETE /api/messages/:messageId
Authorization: Bearer <token>
```

### Voicemail

**Upload Voicemail:**
```http
POST /api/voicemail
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: <audio-file>
channelId: "channel-id"
duration: 30
```

**Get Voicemail:**
```http
GET /api/voicemail/:filename
Authorization: Bearer <token>
```

### Calls

**Call Offer:**
```http
POST /api/calls/offer
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": "channel-id",
  "calleeId": "user-id",
  "type": "video",
  "sdp": {
    "type": "offer",
    "sdp": "sdp-string"
  }
}
```

**Call Answer:**
```http
POST /api/calls/answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "callId": "call-id",
  "sdp": {
    "type": "answer",
    "sdp": "sdp-string"
  }
}
```

**ICE Candidate:**
```http
POST /api/calls/ice
Authorization: Bearer <token>
Content-Type: application/json

{
  "callId": "call-id",
  "candidate": {
    "candidate": "candidate-string",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

**End Call:**
```http
POST /api/calls/:callId/end
Authorization: Bearer <token>
```

### Initialization

**Get Initial Data:**
```http
GET /api/init
Authorization: Bearer <token>
```

## 🔌 WebSocket Events

### Client → Server

**Join Channel:**
```json
{
  "type": "join_channel",
  "payload": {
    "channelId": "channel-id"
  }
}
```

**Leave Channel:**
```json
{
  "type": "leave_channel",
  "payload": {
    "channelId": "channel-id"
  }
}
```

**Typing Indicator:**
```json
{
  "type": "typing",
  "payload": {
    "channelId": "channel-id",
    "isTyping": true
  }
}
```

**Presence Update:**
```json
{
  "type": "presence_update",
  "payload": {
    "status": "online"
  }
}
```

### Server → Client

**New Message:**
```json
{
  "type": "new_message",
  "payload": {
    "id": "message-id",
    "content": "Hello",
    "userId": "user-id",
    "channelId": "channel-id",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Message Edited:**
```json
{
  "type": "message_edited",
  "payload": {
    "id": "message-id",
    "content": "Updated content",
    "edited": true
  }
}
```

**Message Deleted:**
```json
{
  "type": "message_deleted",
  "payload": {
    "messageId": "message-id"
  }
}
```

**Voicemail Created:**
```json
{
  "type": "voicemail_created",
  "payload": {
    "id": "voicemail-id",
    "filename": "voicemail.webm",
    "duration": 30
  }
}
```

**Call Offer:**
```json
{
  "type": "call_offer",
  "payload": {
    "callId": "call-id",
    "callerId": "user-id",
    "type": "video",
    "sdp": {
      "type": "offer",
      "sdp": "sdp-string"
    }
  }
}
```

**Call Answer:**
```json
{
  "type": "call_answer",
  "payload": {
    "callId": "call-id",
    "sdp": {
      "type": "answer",
      "sdp": "sdp-string"
    }
  }
}
```

**Call ICE Candidate:**
```json
{
  "type": "call_ice_candidate",
  "payload": {
    "callId": "call-id",
    "candidate": {
      "candidate": "candidate-string",
      "sdpMid": "0",
      "sdpMLineIndex": 0
    }
  }
}
```

**Call Ended:**
```json
{
  "type": "call_ended",
  "payload": {
    "callId": "call-id"
  }
}
```

**Presence Update:**
```json
{
  "type": "presence_update",
  "payload": {
    "userId": "user-id",
    "status": "online"
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `PORT` | Server port | 3001 | No |
| `NODE_ENV` | Environment (development/production) | development | No |
| `CORS_ORIGIN` | CORS allowed origin | * | No |

### Rate Limiting

Default rate limits:
- **API**: 100 requests per 15 minutes per IP
- **Auth**: 5 requests per 15 minutes per IP

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL

**Solution**:
1. Check if PostgreSQL is running: `psql -U postgres`
2. Verify DATABASE_URL in .env file
3. Ensure database exists: `createdb atomic_chat`

### Migration Errors

**Problem**: Prisma migration fails

**Solution**:
1. Reset database: `cd server && npx prisma migrate reset`
2. Regenerate client: `npx prisma generate`
3. Check schema.prisma for syntax errors

### WebSocket Connection Issues

**Problem**: WebSocket won't connect

**Solution**:
1. Check if server is running on correct port
2. Verify JWT token is valid
3. Check browser console for errors
4. Ensure firewall allows WebSocket connections

### WebRTC Call Issues

**Problem**: Audio/video calls not working

**Solution**:
1. Check browser permissions for camera/microphone
2. Ensure STUN servers are accessible
3. Verify both users are in the same channel
4. Check network connectivity

### Docker Issues

**Problem**: Docker containers won't start

**Solution**:
1. Check Docker is running: `docker ps`
2. Remove old containers: `docker-compose down -v`
3. Rebuild: `docker-compose up -d --build`
4. Check logs: `docker-compose logs`

## � Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** - Detailed system architecture, data flow, and technology choices
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation with examples
- **[Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Development setup, workflow, and best practices
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deployment options and procedures

## �📝 Project Structure

```
atomic-chat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and WebSocket services
│   │   ├── store/         # Zustand state management
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   ├── prisma/           # Database schema
│   ├── voicemail/        # Voicemail storage
│   └── package.json
├── shared/               # Shared TypeScript types
│   ├── src/
│   │   └── index.ts      # Type definitions
│   └── package.json
├── scripts/              # Build and dev scripts
│   ├── dev.sh           # Development script
│   └── build.sh         # Production build script
├── docker-compose.yml    # Docker orchestration
├── .env.example         # Environment template
└── README.md            # This file
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by popular chat applications
- Thanks to the open-source community

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

**Note**: This is a demonstration project. For production use, ensure proper security measures, monitoring, and scaling strategies are implemented.
