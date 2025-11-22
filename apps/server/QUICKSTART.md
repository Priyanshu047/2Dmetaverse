# Backend Server Quick Start Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd apps/server
npm install
```

### 2. Set Up Environment
Create a `.env` file (or copy from `.env.example`):
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/metaverse
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Start MongoDB
```bash
# Windows (if installed as service)
# Check: services.msc → MongoDB Server

# Or manually
mongod

# Or use MongoDB Atlas (cloud)
# Get connection string from atlas.mongodb.com
```

### 4. Run the Server
```bash
npm run dev
```

Server will start on http://localhost:3001

## 📡 Quick API Test

### Health Check
```powershell
Invoke-RestMethod http://localhost:3001/health
```

### Register User
```powershell
$user = @{
    username = "testuser"
    email = "test@example.com"  
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method POST -Body $user -ContentType "application/json"
```

### Create Admin User
```powershell
$admin = @{
    username = "admin"
    email = "admin@example.com"
    password = "admin123"
    role = "admin"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method POST -Body $admin -ContentType "application/json"

$token = $response.data.token
```

### Create a Room (Admin)
```powershell
$room = @{
    name = "Main Lobby"
    slug = "main-lobby"
    layoutJson = @{}
    isPrivate = $false
} | ConvertTo-Json

$headers = @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Uri "http://localhost:3001/api/rooms" `
    -Method POST -Body $room -Headers $headers -ContentType "application/json"
```

### Get All Rooms
```powershell
Invoke-RestMethod http://localhost:3001/api/rooms
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## 📁 Project Structure

```
apps/server/
├── src/
│   ├── server.ts              # Entry point
│   ├── config/                # Configuration
│   ├── models/                # MongoDB models
│   ├── controllers/           # Request handlers
│   ├── routes/                # API routes
│   ├── middleware/            # Auth & errors
│   ├── sockets/               # Socket.io events
│   └── types/                 # TypeScript types
├── package.json
└── tsconfig.json
```

## 🔌 Socket.io Connection

```javascript
const socket = io('http://localhost:3001');

socket.emit('room:join', {
  roomId: 'lobby',
  userId: 'user-123',
  username: 'Player1'
});

socket.on('chat:message', (msg) => {
  console.log(msg.username + ': ' + msg.text);
});

socket.emit('chat:message', {
  text: 'Hello world!'
});
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
❌ Failed to connect to MongoDB
```
**Fix**: Make sure MongoDB is running
```bash
# Check if MongoDB service is running
services.msc  # Windows

# Or start MongoDB
mongod
```

### Port Already in Use
```
❌ EADDRINUSE: address already in use
```
**Fix**: Kill process on port 3001
```powershell
# Find process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess

# Kill it
Stop-Process -Id <ProcessId> -Force

# Or change PORT in .env
```

## 📚 Documentation

- [README.md](README.md) - Full documentation
- [API_TESTING.md](API_TESTING.md) - API testing examples
- [Walkthrough](../../.gemini/antigravity/brain/.../walkthrough.md) - Implementation details

## 🎯 Next Steps

1. **Frontend Integration**: Connect React client with Socket.io
2. **WebRTC**: Implement video/audio using signaling events
3. **Room Editor**: Build visual layout editor
4. **AI NPCs**: Add NPC model and AI integration
5. **File Upload**: Add avatar image upload
6. **Analytics**: Track user metrics

---

**Server is ready! 🎉**

All endpoints are functional and Socket.io is live.
Ready to connect with the frontend client.
