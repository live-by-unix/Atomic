# Atomic Chat FAQ

## General Questions

### What is Atomic Chat?

Atomic Chat is a full-stack, real-time chat application built with modern web technologies. It features text messaging, voice/video calls, voicemail, channel management, and real-time presence tracking.

### What technologies does Atomic Chat use?

- **Backend**: Node.js, Express.js, PostgreSQL, Prisma ORM
- **Frontend**: React, Vite, TypeScript, Zustand
- **Real-time**: WebSocket (ws library)
- **WebRTC**: Peer-to-peer audio/video calling
- **Deployment**: Docker, Docker Compose

### Is Atomic Chat free to use?

Yes, Atomic Chat is open-source and free to use under the MIT license. You can modify, distribute, and use it for both personal and commercial projects.

### Can I use Atomic Chat for commercial purposes?

Yes, the MIT license allows commercial use. However, you must include the original copyright and license notice in any substantial portions of the software.

## Installation and Setup

### How do I install Atomic Chat?

Follow the installation guide in the main README.md:

1. Clone the repository
2. Install dependencies: `npm run install:all`
3. Set up PostgreSQL database
4. Configure environment variables
5. Run migrations: `cd server && npx prisma migrate dev`
6. Start development: `npm run dev`

### What are the system requirements?

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: v15 or higher
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk**: Minimum 20GB free space

### Can I run Atomic Chat without Docker?

Yes, you can run Atomic Chat manually without Docker. See the Deployment Guide for manual deployment instructions.

### How do I set up the database?

You can use either a local PostgreSQL installation or Docker:

**Local PostgreSQL:**
```bash
createdb atomic_chat
```

**Docker:**
```bash
docker run --name atomic-chat-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=atomic_chat \
  -p 5432:5432 \
  -d postgres:15-alpine
```

## Features

### Does Atomic Chat support file sharing?

Currently, Atomic Chat supports voicemail (audio) uploads. File sharing for documents, images, and other file types is planned for future releases.

### Can I make group calls?

Currently, Atomic Chat supports 1-on-1 audio and video calls. Group calling functionality is planned for future releases.

### Is there a mobile app?

Atomic Chat currently has a web-based interface that is mobile-responsive. Native mobile apps for iOS and Android are planned for future development.

### Can I integrate Atomic Chat with other apps?

Yes, Atomic Chat provides a REST API and WebSocket interface that can be integrated with other applications. See the API Reference documentation for details.

### Does Atomic Chat support end-to-end encryption?

Currently, Atomic Chat does not implement end-to-end encryption. Messages are encrypted in transit (HTTPS/WSS) but stored in the database. End-to-end encryption is planned for future releases.

## Configuration

### How do I change the port?

Edit the `.env` file in the server directory:

```env
PORT=3001
```

### How do I configure JWT secret?

Generate a secure random string and set it in `.env`:

```env
JWT_SECRET=your-secure-random-secret-key
```

### Can I use a different database?

Atomic Chat uses PostgreSQL with Prisma ORM. While PostgreSQL is recommended, you could potentially use other databases by modifying the Prisma schema and provider configuration.

### How do I enable/disable rate limiting?

Rate limiting is configured in `server/src/middleware/rateLimit.ts`. You can modify the limits or disable it by removing the middleware from the application.

## Troubleshooting

### The server won't start

**Common causes:**
1. Port already in use
2. Database connection issues
3. Missing dependencies

**Solutions:**
```bash
# Check if port is in use
lsof -i :3001

# Kill the process
kill -9 <PID>

# Check database connection
psql -U postgres -d atomic_chat -h localhost

# Reinstall dependencies
rm -rf node_modules
npm install
```

### WebSocket connection fails

**Common causes:**
1. Invalid JWT token
2. Network issues
3. Server not running

**Solutions:**
1. Verify your JWT token is valid
2. Check server logs for WebSocket errors
3. Ensure WebSocket URL is correct
4. Check network connectivity

### Database migration fails

**Common causes:**
1. Database doesn't exist
2. Incorrect database credentials
3. Schema conflicts

**Solutions:**
```bash
# Reset database (WARNING: Deletes data)
cd server
npx prisma migrate reset

# Or resolve conflicts manually
npx prisma migrate resolve --applied "migration_name"
```

### Build errors

**Common causes:**
1. TypeScript compilation errors
2. Missing dependencies
3. Shared types not built

**Solutions:**
```bash
# Build shared types first
cd shared && npm run build && cd ..

# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Security

### Is Atomic Chat secure for production use?

Atomic Chat includes several security features:
- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS configuration

However, for production use, you should:
- Use strong JWT secrets
- Enable HTTPS
- Implement proper monitoring
- Regularly update dependencies
- Follow security best practices

### How do I enable HTTPS?

For production deployment, use a reverse proxy (Nginx) with SSL certificates. See the Deployment Guide for detailed instructions.

### How do I secure the JWT secret?

1. Use a cryptographically secure random string (minimum 32 characters)
2. Store it in environment variables or a secret manager
3. Never commit it to version control
4. Rotate it periodically

### Can I add additional authentication methods?

Yes, you can extend the authentication system to support OAuth, SAML, or other authentication methods by modifying the authentication middleware and routes.

## Performance

### How many concurrent users can Atomic Chat support?

The current implementation can handle hundreds of concurrent users. For larger scale, you would need to:
- Implement horizontal scaling
- Use Redis for session management
- Optimize database queries
- Implement connection pooling

### How do I optimize performance?

- Enable production mode
- Use CDN for static assets
- Implement caching (Redis)
- Optimize database queries
- Use lazy loading for components
- Implement message pagination

### What are the memory requirements?

- **Development**: 4GB RAM minimum
- **Production**: 8GB RAM recommended
- **Large scale**: 16GB+ RAM with horizontal scaling

## Customization

### Can I customize the UI?

Yes, the entire frontend is built with React and can be customized. The styling uses standard CSS that can be modified or replaced with a CSS framework.

### Can I add new features?

Yes, Atomic Chat is designed to be extensible. You can:
- Add new API endpoints
- Create new WebSocket events
- Add new UI components
- Extend the database schema
- Integrate third-party services

### How do I add a new message type?

1. Update the shared types in `shared/src/index.ts`
2. Add handling in the server routes
3. Update the client to handle the new type
4. Add UI components if needed

## Deployment

### Can I deploy Atomic Chat to shared hosting?

Shared hosting is not recommended due to:
- WebSocket support limitations
- Node.js requirements
- Database access limitations

VPS or cloud hosting is recommended.

### Which cloud providers are supported?

Atomic Chat can be deployed to any cloud provider that supports:
- Node.js applications
- PostgreSQL databases
- Docker containers

Popular options include AWS, DigitalOcean, Heroku, and Google Cloud Platform.

### How do I set up automatic backups?

Configure automated database backups using cron jobs or cloud provider backup services. See the Deployment Guide for detailed instructions.

## Development

### How do I contribute to Atomic Chat?

See the Contributing Guide for detailed instructions on how to contribute to the project.

### What coding standards should I follow?

Follow the coding standards outlined in the Development Guide:
- TypeScript/JavaScript conventions
- React best practices
- CSS organization
- Testing guidelines

### How do I run tests?

Currently, tests are being implemented. Once complete, you can run tests with:
```bash
npm test
```

## Licensing

### Can I remove the MIT license notice?

No, the MIT license requires that the copyright notice and license text be included in all copies or substantial portions of the software.

### Can I sell Atomic Chat as a product?

Yes, you can sell Atomic Chat or modified versions as a product, provided you include the original copyright and license notice.

### Do I need to contribute my changes back?

No, the MIT license does not require you to contribute your changes back to the original project. However, contributions are welcome!

## Support

### Where can I get help?

- Check the documentation in the `docs/` directory
- Search existing GitHub issues
- Ask questions in GitHub Discussions
- Contact the maintainers

### How do I report a bug?

Report bugs using the GitHub issue tracker with:
- Detailed description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Relevant logs/error messages

### How do I request a feature?

Request features using the GitHub issue tracker with:
- Clear description of the feature
- Use case and benefits
- Suggested implementation approach
- Priority level

## Future Development

### What features are planned?

See the project README and GitHub issues for planned features including:
- File sharing
- Group calling
- End-to-end encryption
- Mobile apps
- Message search
- User profiles
- And more

### When will the next release be?

Release schedules depend on contributor availability and feature complexity. Check the GitHub milestones for estimated timelines.

### How can I influence the roadmap?

You can influence the roadmap by:
- Contributing to the project
- Participating in discussions
- Voting on GitHub issues
- Suggesting features with detailed proposals

## Miscellaneous

### Is there a demo available?

You can run Atomic Chat locally following the installation guide. A public demo may be available in the future.

### Can I use Atomic Chat for educational purposes?

Yes, Atomic Chat is excellent for educational purposes to learn about:
- Full-stack development
- Real-time applications
- WebRTC
- Database design
- API development

### How do I stay updated with Atomic Chat?

- Star the GitHub repository
- Watch the repository for updates
- Follow the project on social media (if available)
- Subscribe to release notifications

---

Still have questions? Feel free to open an issue on GitHub or contact the maintainers.
