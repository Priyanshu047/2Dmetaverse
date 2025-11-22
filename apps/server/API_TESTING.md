# API Testing Guide

Quick guide to test the backend API endpoints using PowerShell or any REST client.

## Prerequisites

Make sure the server is running:
```bash
cd apps/server
npm run dev
```

## Test Endpoints with PowerShell

### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
```

### 2. Register a New User
```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

Save the token from the response for future requests.

### 3. Login
```powershell
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$token = $response.data.token
Write-Host "Token: $token"
```

### 4. Get Current User
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" `
    -Method GET `
    -Headers $headers
```

### 5. Get All Rooms
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/rooms" -Method GET
```

### 6. Create a Room (Admin Only)

First, create an admin user manually in MongoDB or change existing user role to "admin":

```powershell
$roomBody = @{
    name = "Main Lobby"
    slug = "main-lobby"
    layoutJson = @{}
    isPrivate = $false
} | ConvertTo-Json

$adminHeaders = @{
    Authorization = "Bearer $adminToken"
}

Invoke-RestMethod -Uri "http://localhost:3001/api/rooms" `
    -Method POST `
    -Body $roomBody `
    -Headers $adminHeaders `
    -ContentType "application/json"
```

## Test with cURL

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Rooms
```bash
curl http://localhost:3001/api/rooms
```

## Socket.io Testing

You can test Socket.io events using a Socket.io client library or tools like:
- Postman (supports WebSockets)
- Socket.io client library in browser console
- Node.js script with socket.io-client

### Example Socket.io Client Test (Node.js)

Create a file `test-socket.js`:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to server');
  
  // Join a room
  socket.emit('room:join', {
    roomId: 'test-room',
    userId: 'user-123',
    username: 'TestUser'
  });
});

socket.on('room:joined', (data) => {
  console.log('Joined room:', data);
  
  // Send a chat message
  socket.emit('chat:message', {
    text: 'Hello from test client!'
  });
});

socket.on('chat:message', (message) => {
  console.log('Chat message:', message);
});

socket.on('user:joined', (data) => {
  console.log('User joined:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

Run with:
```bash
node test-socket.js
```

## Expected Responses

### Successful Registration
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    },
    "token": "eyJhbGc..."
  }
}
```

### Successful Login
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGc..."
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description here"
}
```

## MongoDB Connection

If you see "Failed to connect to MongoDB", make sure:

1. MongoDB is running:
   ```bash
   # Windows (if installed as service)
   services.msc  # Check if MongoDB service is running
   
   # Or start manually
   mongod
   ```

2. Connection string is correct in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/metaverse
   ```

3. If using MongoDB Atlas:
   - Whitelist your IP address
   - Use the connection string from Atlas dashboard
   - Include username and password in connection string
