# 2D Metaverse Web App - Backend Server

A scalable Node.js + TypeScript backend server with JWT authentication, MongoDB, Socket.io real-time communication, and RESTful API for the 2D Metaverse Web App.

## 🚀 Features

- **JWT Authentication** - Secure token-based authentication with bcrypt password hashing
- **Role-Based Access Control** - User and admin roles with protected routes
- **MongoDB Integration** - NoSQL database with Mongoose ODM
- **Real-time Communication** - Socket.io for live chat, avatar movement, and presence
- **RESTful API** - Clean REST endpoints for users and rooms
- **WebRTC Ready** - Placeholder signaling events for future video/audio implementation
- **TypeScript** - Full type safety with strict mode
- **Error Handling** - Centralized error handling with custom error classes
- **Security** - CORS, input validation, and secure password storage

## 📋 Prerequisites

Before running this server, ensure you have:

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn** package manager

## 🛠️ Installation

1. **Navigate to the server directory:**
   ```bash
   cd apps/server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your configuration:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/metaverse
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Windows (run as service or):
   mongod
   
   # On Linux
   sudo systemctl start mongod
   ```

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```
This starts the server with hot-reload using `ts-node-dev`.

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

#### Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Room Routes (`/api/rooms`)

#### Get All Rooms
```http
GET /api/rooms
```
Returns all public rooms. If authenticated as admin, returns all rooms.

#### Get Room by ID or Slug
```http
GET /api/rooms/:identifier
```

#### Create Room (Admin Only)
```http
POST /api/rooms
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Main Lobby",
  "slug": "main-lobby",
  "layoutJson": {},
  "isPrivate": false
}
```

#### Update Room (Admin Only)
```http
PUT /api/rooms/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Room Name",
  "isPrivate": true
}
```

#### Delete Room (Admin Only)
```http
DELETE /api/rooms/:id
Authorization: Bearer <admin-token>
```

## 🔌 Socket.io Events

### Client → Server Events

#### Join a Room
```javascript
socket.emit('room:join', {
  roomId: 'room-123',
  userId: 'user-456',
  username: 'john_doe'
});
```

#### Leave a Room
```javascript
socket.emit('room:leave', {
  roomId: 'room-123'
});
```

#### Send Avatar Movement
```javascript
socket.emit('avatar:move', {
  userId: 'user-456',
  x: 100,
  y: 200,
  direction: 'right'
});
```

#### Send Chat Message
```javascript
socket.emit('chat:message', {
  text: 'Hello everyone!'
});
```

### Server → Client Events

#### Room Joined Confirmation
```javascript
socket.on('room:joined', (data) => {
  console.log(data.message); // "Successfully joined room: room-123"
});
```

#### User Joined Room
```javascript
socket.on('user:joined', (data) => {
  console.log(`${data.username} joined at ${data.timestamp}`);
});
```

#### User Left Room
```javascript
socket.on('user:left', (data) => {
  console.log(`${data.username} left at ${data.timestamp}`);
});
```

#### Avatar Moved
```javascript
socket.on('avatar:moved', (data) => {
  // Update avatar position
  updateAvatar(data.userId, data.x, data.y, data.direction);
});
```

#### Chat Message Received
```javascript
socket.on('chat:message', (message) => {
  console.log(`${message.username}: ${message.text}`);
});
```

## 📁 Project Structure

```
apps/server/
├── src/
│   ├── server.ts              # Entry point
│   ├── config/
│   │   ├── env.ts             # Environment configuration
│   │   └── db.ts              # MongoDB connection
│   ├── models/
│   │   ├── User.ts            # User model with password hashing
│   │   └── Room.ts            # Room model
│   ├── controllers/
│   │   ├── authController.ts  # Authentication logic
│   │   └── roomController.ts  # Room CRUD operations
│   ├── routes/
│   │   ├── authRoutes.ts      # Auth endpoints
│   │   └── roomRoutes.ts      # Room endpoints
│   ├── middleware/
│   │   ├── authMiddleware.ts  # JWT verification & role checks
│   │   └── errorMiddleware.ts # Error handling
│   ├── sockets/
│   │   └── index.ts           # Socket.io event handlers
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔐 Security Features

1. **Password Hashing** - Passwords are hashed using bcrypt with salt rounds
2. **JWT Tokens** - Stateless authentication with configurable expiration
3. **Role-Based Access** - Middleware to restrict admin-only routes
4. **Input Validation** - Mongoose schema validation for all data
5. **CORS Protection** - Configured to only allow requests from client URL
6. **Error Sanitization** - Sensitive error details hidden in production

## 🎯 Future Enhancements

This backend is designed to support the following future features:

### 1. WebRTC Integration
The Socket.io server includes placeholder events for WebRTC signaling:
- `webrtc:offer` - Send WebRTC offer to peer
- `webrtc:answer` - Send WebRTC answer to peer
- `webrtc:ice-candidate` - Exchange ICE candidates

To implement WebRTC:
1. Implement peer-to-peer connection logic in the client
2. Use the existing signaling events to exchange SDP offers/answers
3. Add STUN/TURN server configuration

### 2. Spatial Audio
Add position-based audio attenuation:
1. Calculate distance between avatars
2. Adjust audio volume based on proximity
3. Use Web Audio API for spatial audio effects

### 3. AI NPC System
Create interactive AI-powered NPCs:
1. Add `NPC` model to database
2. Integrate OpenAI API or similar for conversation
3. Emit NPC messages through Socket.io
4. Add NPC movement algorithms

### 4. Room Editor
Build a visual room layout editor:
1. Store room layouts as JSON in `layoutJson` field
2. Add endpoints for saving/loading layouts
3. Support object placement, walls, spawn points
4. Real-time collaboration via Socket.io

### 5. Analytics & Metrics
Track user engagement:
1. Add `Analytics` model
2. Log user sessions, room visits, messages
3. Create admin dashboard endpoints
4. Generate reports and insights

### 6. File Upload
Support avatar customization and assets:
1. Add file upload middleware (multer)
2. Store files in cloud storage (S3, Cloudinary)
3. Add `Media` model for tracking uploads
4. Implement avatar image upload

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error: MongoServerError: connect ECONNREFUSED**
- Ensure MongoDB is running: `brew services list` or `systemctl status mongod`
- Check connection string in `.env`
- For Atlas, whitelist your IP address

### Port Already in Use

**Error: EADDRINUSE: address already in use**
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9
# Or change PORT in .env
```

### TypeScript Compilation Errors
```bash
# Clean and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## 📝 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3001 | No |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/metaverse | Yes |
| `JWT_SECRET` | Secret key for JWT signing | - | Yes |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:5173 | Yes |
| `NODE_ENV` | Environment mode | development | No |

## 🤝 Contributing

1. Follow TypeScript strict mode guidelines
2. Use async/await for asynchronous operations
3. Add error handling with try/catch or asyncHandler
4. Document new endpoints in this README
5. Run linter before committing: `npm run lint`

## 📄 License

ISC

---

**Built with ❤️ for the 2D Metaverse Web App**
