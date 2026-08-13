# Atomic Chat Development Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Debugging](#debugging)
- [Code Style Guidelines](#code-style-guidelines)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: v15 or higher
- **Git**: Latest version

### Optional but Recommended
- **Docker**: v20 or higher
- **Docker Compose**: v2 or higher
- **VS Code**: With recommended extensions
- **Postman**: For API testing

### Recommended VS Code Extensions
- ESLint
- Prettier
- TypeScript Importer
- GitLens
- Docker
- Prisma

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd atomic-chat
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm run install:all

# Or install individually
cd shared && npm install
cd ../server && npm install
cd ../client && npm install
```

### 3. Set Up PostgreSQL

#### Option A: Local PostgreSQL
```bash
# Start PostgreSQL service
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Start PostgreSQL service

# Create database
createdb atomic_chat
```

#### Option B: Docker PostgreSQL
```bash
docker run --name atomic-chat-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=atomic_chat \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 4. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit with your configuration
# .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/atomic_chat?schema=public
JWT_SECRET=your-development-secret-key
PORT=3001
NODE_ENV=development
```

### 5. Run Database Migrations

```bash
cd server
npx prisma migrate dev
cd ..
```

### 6. Build Shared Types

```bash
cd shared
npm run build
cd ..
```

### 7. Start Development Servers

```bash
# Option A: Use the dev script (recommended)
npm run dev

# Option B: Start servers individually
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

### 8. Verify Setup

1. Open browser to `http://localhost:5173`
2. Register a new account
3. Create a channel
4. Send a test message

## Project Structure

```
atomic-chat/
├── client/                    # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── CallPanel.tsx
│   │   │   ├── ChannelSidebar.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── UserStatusIndicator.tsx
│   │   │   ├── VoicemailPlayer.tsx
│   │   │   └── VoicemailRecorder.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── ChatPage.tsx
│   │   │   ├── InitializePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── services/         # API and WebSocket services
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── store/            # Zustand state management
│   │   │   ├── authStore.ts
│   │   │   ├── callStore.ts
│   │   │   └── chatStore.ts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx           # Root component
│   │   └── main.tsx          # Entry point
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                   # Express backend
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── middleware/      # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── logger.ts
│   │   │   └── rateLimit.ts
│   │   ├── routes/          # API routes
│   │   │   ├── auth.ts
│   │   │   ├── calls.ts
│   │   │   ├── channels.ts
│   │   │   ├── init.ts
│   │   │   ├── messages.ts
│   │   │   └── voicemail.ts
│   │   ├── services/        # Business logic
│   │   │   └── websocket.ts
│   │   ├── utils/           # Utility functions
│   │   │   ├── auth.ts
│   │   │   └── database.ts
│   │   └── index.ts         # Server entry point
│   ├── voicemail/           # Voicemail storage
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── shared/                   # Shared TypeScript types
│   ├── src/
│   │   └── index.ts         # Type definitions
│   ├── package.json
│   └── tsconfig.json
├── scripts/                  # Build and development scripts
│   ├── dev.sh              # Development startup script
│   └── build.sh            # Production build script
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── DEPLOYMENT.md
├── docker-compose.yml        # Docker orchestration
├── .env.example             # Environment template
├── .gitignore
├── package.json             # Root package.json
└── README.md                # Main documentation
```

## Development Workflow

### Feature Development

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Update code in appropriate directories
   - Update shared types if needed
   - Add tests (when test framework is added)

3. **Build shared types**
   ```bash
   cd shared && npm run build
   ```

4. **Test locally**
   ```bash
   npm run dev
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Bug Fixing

1. **Create bug fix branch**
   ```bash
   git checkout -b fix/bug-description
   ```

2. **Implement fix**
   - Identify and fix the issue
   - Add regression tests if applicable

3. **Test thoroughly**
   - Verify the fix works
   - Check for side effects

4. **Commit and push**
   ```bash
   git add .
   git commit -m "fix: describe the bug fix"
   git push origin fix/bug-description
   ```

### Database Changes

1. **Modify Prisma schema**
   ```prisma
   // server/prisma/schema.prisma
   model YourModel {
     // Add new fields
   }
   ```

2. **Create migration**
   ```bash
   cd server
   npx prisma migrate dev --name your_migration_name
   ```

3. **Regenerate Prisma client**
   ```bash
   npx prisma generate
   ```

4. **Update shared types** if needed
   ```bash
   cd shared
   # Update type definitions
   npm run build
   ```

## Testing

### Running Tests (To Be Implemented)

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- auth

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Manual Testing Checklist

#### Authentication
- [ ] User registration with valid credentials
- [ ] User registration with invalid credentials
- [ ] User login with valid credentials
- [ ] User login with invalid credentials
- [ ] Token expiration handling
- [ ] Logout functionality

#### Channels
- [ ] Create public channel
- [ ] Create private channel
- [ ] Join channel
- [ ] Leave channel
- [ ] List user's channels
- [ ] Channel member management

#### Messages
- [ ] Send text message
- [ ] Edit own message
- [ ] Delete own message
- [ ] Receive real-time messages
- [ ] Message pagination
- [ ] Typing indicators

#### Voicemail
- [ ] Record voicemail
- [ ] Upload voicemail
- [ ] Play voicemail
- [ ] Delete voicemail
- [ ] File size validation
- [ ] File type validation

#### WebRTC Calls
- [ ] Initiate audio call
- [ ] Initiate video call
- [ ] Answer incoming call
- [ ] Reject incoming call
- [ ] Mute/unmute audio
- [ ] Toggle camera
- [ ] End call
- [ ] Handle connection failures

#### Presence
- [ ] User goes online
- [ ] User goes offline
- [ ] User goes idle
- [ ] Presence updates in real-time

## Debugging

### Server Debugging

#### Enable Debug Logging
```bash
# Set NODE_ENV to development for detailed logs
NODE_ENV=development npm run dev
```

#### Use Prisma Studio
```bash
cd server
npx prisma studio
```

#### Check Database Connection
```bash
# Test PostgreSQL connection
psql -U postgres -d atomic_chat -h localhost
```

### Client Debugging

#### Browser DevTools
1. Open Developer Tools (F12)
2. Check Console for errors
3. Monitor Network tab for API calls
4. Check Application tab for localStorage

#### React DevTools
1. Install React DevTools extension
2. Inspect component state
3. Monitor component re-renders
4. Check Zustand store state

#### WebSocket Debugging
```javascript
// In browser console
wsService.on('*', (data) => {
  console.log('WebSocket event:', data);
});
```

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Restart PostgreSQL
brew services restart postgresql  # macOS
sudo systemctl restart postgresql  # Linux
```

#### TypeScript Errors
```bash
# Clean build artifacts
rm -rf node_modules dist
npm install
npm run build
```

## Code Style Guidelines

### TypeScript/JavaScript

#### Naming Conventions
- **Variables**: camelCase (`userName`, `isLoading`)
- **Functions**: camelCase (`getUserData`, `handleClick`)
- **Classes**: PascalCase (`UserService`, `MessageComponent`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Interfaces/Types**: PascalCase (`User`, `Message`)

#### File Organization
- One component per file
- Group related imports
- Separate concerns (UI, logic, types)
- Use barrel exports for related modules

#### Error Handling
```typescript
// Good
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('API call failed:', error);
  throw new Error('Failed to fetch data');
}

// Bad
const result = await apiCall(); // No error handling
```

#### Async/Await
```typescript
// Good
async function getData() {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    handle error;
  }
}

// Bad
function getData() {
  apiCall().then(result => {
    return result;
  });
}
```

### React

#### Component Structure
```typescript
// Good
function MyComponent({ prop1, prop2 }: Props) {
  // Hooks first
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = () => {
    // Handle event
  };
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Render
  return <div>{/* JSX */}</div>;
}

// Bad
function MyComponent({ prop1, prop2 }: Props) {
  const handleClick = () => {
    const [state, setState] = useState(); // Hook inside event handler
  };
  return <div>{/* JSX */}</div>;
}
```

#### Props Interface
```typescript
// Good
interface Props {
  title: string;
  count?: number;
  onAction: (id: string) => void;
}

// Bad
function MyComponent({ title, count, onAction }: any) {
  // Missing type definitions
}
```

### CSS

#### Naming Conventions
- Use kebab-case for class names
- Use BEM methodology when appropriate
- Component-scoped styles

```css
/* Good */
.message-input {
  /* styles */
}

.message-input__button {
  /* styles */
}

.message-input--disabled {
  /* styles */
}

/* Bad */
.messageInput {
  /* styles */
}
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Define types in shared**
   ```typescript
   // shared/src/index.ts
   export interface NewFeature {
     id: string;
     name: string;
   }
   ```

2. **Build shared types**
   ```bash
   cd shared && npm run build
   ```

3. **Create route handler**
   ```typescript
   // server/src/routes/newFeature.ts
   import { Router } from 'express';
   import { NewFeature } from '@atomic-chat/shared';
   
   const router = Router();
   
   router.get('/', async (req, res) => {
     // Implementation
   });
   
   export default router;
   ```

4. **Register route**
   ```typescript
   // server/src/index.ts
   import newFeatureRoutes from './routes/newFeature';
   app.use('/api/new-feature', newFeatureRoutes);
   ```

5. **Add API client method**
   ```typescript
   // client/src/services/api.ts
   newFeature: {
     list: async (): Promise<ApiResponse<NewFeature[]>> => {
       return request('/new-feature');
     }
   }
   ```

### Adding a New React Component

1. **Create component file**
   ```typescript
   // client/src/components/NewComponent.tsx
   import React from 'react';
   import './NewComponent.css';
   
   interface Props {
     title: string;
   }
   
   export default function NewComponent({ title }: Props) {
     return <div className="new-component">{title}</div>;
   }
   ```

2. **Create styles**
   ```css
   /* client/src/components/NewComponent.css */
   .new-component {
     /* styles */
   }
   ```

3. **Export and use**
   ```typescript
   import NewComponent from './components/NewComponent';
   
   function ParentComponent() {
     return <NewComponent title="Hello" />;
   }
   ```

### Adding a New WebSocket Event

1. **Define event type**
   ```typescript
   // shared/src/index.ts
   export interface NewEvent {
     type: 'new_event';
     payload: {
       data: string;
     };
   }
   ```

2. **Server handler**
   ```typescript
   // server/src/services/websocket.ts
   async function handleNewEvent(ws, payload, clients) {
     // Handle event
     broadcastToChannel(payload.channelId, {
       type: 'new_event',
       payload
     }, clients);
   }
   ```

3. **Client listener**
   ```typescript
   // client/src/pages/ChatPage.tsx
   wsService.on('new_event', (data) => {
     console.log('New event:', data);
   });
   ```

## Troubleshooting

### Build Issues

#### TypeScript Compilation Errors
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Vite Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Runtime Issues

#### Server Won't Start
1. Check if port 3001 is available
2. Verify PostgreSQL is running
3. Check environment variables
4. Review server logs

#### Client Won't Connect
1. Verify server is running
2. Check proxy configuration
3. Review browser console for errors
4. Ensure shared types are built

#### WebSocket Connection Fails
1. Verify JWT token is valid
2. Check WebSocket URL
3. Review network tab in DevTools
4. Check server WebSocket logs

### Database Issues

#### Migration Fails
```bash
# Reset database (WARNING: Deletes data)
cd server
npx prisma migrate reset

# Or resolve migration conflicts manually
npx prisma migrate resolve --applied "migration_name"
```

#### Prisma Client Issues
```bash
# Regenerate Prisma client
cd server
npx prisma generate
```

### Performance Issues

#### Slow Development Server
1. Disable unnecessary extensions
2. Increase Node.js memory limit
3. Use production build for testing

#### Slow Database Queries
1. Add indexes to frequently queried columns
2. Use Prisma's `select` to limit returned fields
3. Implement query caching

## Best Practices

### Security
- Never commit sensitive data
- Use environment variables for secrets
- Validate all user inputs
- Implement proper error handling
- Keep dependencies updated

### Performance
- Implement lazy loading for components
- Use React.memo for expensive components
- Optimize re-renders with proper dependency arrays
- Implement pagination for large datasets
- Use CDN for static assets in production

### Maintainability
- Write clear, descriptive comments
- Follow consistent code style
- Keep functions small and focused
- Use meaningful variable names
- Write tests for critical functionality

### Collaboration
- Write clear commit messages
- Use meaningful branch names
- Update documentation for changes
- Review code before merging
- Communicate breaking changes

## Resources

### Documentation
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vitejs.dev)

### Tools
- [Prisma Studio](https://www.prisma.io/studio)
- [Postman](https://www.postman.com)
- [Docker Documentation](https://docs.docker.com)
- [Git Documentation](https://git-scm.com/doc)

### Community
- [Stack Overflow](https://stackoverflow.com)
- [GitHub Issues](https://github.com)
- [Discord/Slack communities](https://discord.com)
