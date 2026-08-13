# Atomic Chat Architecture

## System Overview

Atomic Chat is a full-stack real-time chat application built with a monorepo structure. The system consists of three main components:

- **Server**: Express.js backend with WebSocket support
- **Client**: React frontend with Vite
- **Shared**: TypeScript type definitions shared between client and server

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Auth Store │  │  Chat Store  │  │  Call Store  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│           │                    │                    │  │
│           └────────────────────┼────────────────────┘  │
│                                │                       │
│  ┌─────────────────────────────┴─────────────────────┐ │
│  │              WebSocket Client & API Layer         │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/WebSocket
                           │
┌─────────────────────────────────────────────────────────┐
│                  Server (Express)                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │              WebSocket Server                      │ │
│  │  - Real-time messaging                            │ │
│  │  - Presence tracking                              │ │
│  │  - Call signaling                                 │ │
│  └───────────────────────────────────────────────────┘ │
│           │                    │                    │  │
│  ┌────────┴────────┐  ┌───────┴────────┐  ┌────────┴───┐ │
│  │   Auth Routes  │  │  Channel Routes│  │ Call Routes│ │
│  └────────────────┘  └────────────────┘  └────────────┘ │
│           │                    │                    │  │
│  ┌────────┴────────────────────┴────────────────────┐ │
│  │              Service Layer                        │ │
│  │  - Business logic                                 │ │
│  │  - Data validation                                │ │
│  └───────────────────────────────────────────────────┘ │
│           │                                             │
│  ┌────────┴─────────────────────────────────────────┐ │
│  │              Data Access Layer (Prisma)            │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ SQL
                           │
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Users   │  │ Channels │  │ Messages │  │ Calls  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Component Details

### Client Architecture

#### State Management
- **Zustand** is used for lightweight state management
- Separate stores for different concerns:
  - `authStore`: User authentication state
  - `chatStore`: Channels, messages, users
  - `callStore`: WebRTC call state

#### Real-time Communication
- **WebSocket Client**: Handles real-time events
- **API Layer**: RESTful API calls with axios-like fetch wrapper
- **Event Handling**: Subscription-based event system

#### UI Components
- **Pages**: Route-level components (Login, Chat, Settings)
- **Components**: Reusable UI elements
- **CSS Modules**: Component-scoped styling

### Server Architecture

#### Layered Architecture
1. **Routes Layer**: HTTP endpoint definitions
2. **Middleware Layer**: Authentication, rate limiting, logging
3. **Service Layer**: Business logic
4. **Data Access Layer**: Prisma ORM

#### WebSocket Implementation
- **Connection Management**: User authentication via JWT
- **Event Broadcasting**: Channel-based message distribution
- **Presence Tracking**: Online/offline status management
- **Call Signaling**: WebRTC peer connection coordination

#### Security
- **JWT Authentication**: Token-based user authentication
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Data sanitization
- **Password Hashing**: bcrypt for secure password storage

### Database Schema

#### Users Table
```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String
  status    String   @default("offline")
  lastSeen  DateTime?
  createdAt DateTime @default(now())
}
```

#### Channels Table
```prisma
model Channel {
  id          String   @id @default(uuid())
  name        String
  description String?
  isPrivate   Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
}
```

#### Messages Table
```prisma
model Message {
  id          String   @id @default(uuid())
  channelId   String
  userId      String
  content     String
  type        String   @default("text")
  voicemailId String?
  edited      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Data Flow

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Server validates credentials and generates JWT
3. Client stores token and user data
4. WebSocket connection established with token
5. User status updated to "online"

### Message Flow
1. User sends message via WebSocket or HTTP
2. Server validates and stores message in database
3. Server broadcasts message to channel members via WebSocket
4. Clients update message list in real-time

### Call Flow
1. Caller initiates call via `/api/calls/offer`
2. Server stores call and signals callee via WebSocket
3. Callee receives offer and answers via `/api/calls/answer`
4. WebRTC peer connection established directly between clients
5. Server facilitates ICE candidate exchange
6. Call ended via `/api/calls/:id/end`

## Technology Choices

### Why This Stack?

#### Backend
- **Express.js**: Minimal, flexible, widely adopted
- **PostgreSQL**: Robust relational database with JSON support
- **Prisma**: Type-safe ORM with excellent developer experience
- **WebSocket**: Native support for real-time features
- **JWT**: Stateless authentication, scalable

#### Frontend
- **React**: Component-based, large ecosystem
- **Vite**: Fast development server, optimized builds
- **Zustand**: Simple state management, no boilerplate
- **TypeScript**: Type safety across the stack

#### Infrastructure
- **Docker**: Consistent deployment environments
- **Docker Compose**: Easy local development setup

## Scalability Considerations

### Current Limitations
- Single server deployment
- In-memory WebSocket connections
- File-based voicemail storage

### Future Scalability
- **Horizontal Scaling**: Load balancer + multiple server instances
- **Redis**: Session storage and pub/sub for WebSocket scaling
- **CDN**: Static asset delivery
- **Object Storage**: S3-compatible storage for voicemails
- **Database Sharding**: Partition data across multiple databases

## Security Architecture

### Authentication
- JWT tokens with 7-day expiration
- Secure password hashing with bcrypt
- Token refresh mechanism (to be implemented)

### Authorization
- Channel membership verification
- Message ownership validation
- Role-based access control (admin/member)

### Data Protection
- Input validation and sanitization
- SQL injection prevention via Prisma
- XSS protection via React
- CORS configuration

### Rate Limiting
- API rate limiting (100 requests/15min)
- Auth rate limiting (5 requests/15min)
- Per-IP tracking

## Performance Optimizations

### Database
- Indexed columns for common queries
- Connection pooling via Prisma
- Query optimization with selective field loading

### Frontend
- Code splitting via Vite
- Lazy loading of components
- Optimized bundle size
- Asset compression

### WebSocket
- Binary message support for large payloads
- Connection pooling
- Efficient event broadcasting

## Monitoring and Logging

### Server Logging
- Request/response logging
- Error tracking
- WebSocket connection events
- Performance metrics

### Client Logging
- Error boundary logging
- WebSocket connection status
- API call failures

## Development Workflow

### Local Development
1. Start PostgreSQL database
2. Run database migrations
3. Start development servers
4. Hot module replacement for rapid development

### Code Organization
- Shared types in `shared/` directory
- Feature-based component organization
- Utility functions in dedicated folders
- Clear separation of concerns

## Testing Strategy

### Unit Testing (To Be Implemented)
- Component testing with React Testing Library
- Service layer testing
- Utility function testing

### Integration Testing (To Be Implemented)
- API endpoint testing
- WebSocket event testing
- Database operation testing

### E2E Testing (To Be Implemented)
- User flow testing
- Cross-browser testing
- Performance testing

## Deployment Architecture

### Development
- Local development with hot reload
- Proxy configuration for API calls
- Separate server and client processes

### Production
- Docker containerization
- Nginx reverse proxy
- Static file serving
- WebSocket proxying
- Process management (PM2 or similar)

## Future Enhancements

### Planned Features
- Message reactions
- File attachments
- Push notifications
- Message search
- User profiles
- Threaded conversations
- Message encryption
- Voice activity detection
- Screen sharing
- Recording calls

### Technical Improvements
- Redis for session management
- Message queue for async processing
- GraphQL API
- Microservices architecture
- Real-time analytics
- A/B testing framework
