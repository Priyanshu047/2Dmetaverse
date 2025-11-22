# 2D Metaverse Web App

A full-stack, real-time multiplayer 2D metaverse application built with React, Phaser 3, Node.js, Socket.io, and MongoDB.

## 🚀 Features

- **Real-time Multiplayer**: Socket.io for instant player synchronization
- **2D Game World**: Phaser 3 game engine with player movement and collisions
- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Chat System**: Real-time chat within rooms
- **Room Management**: Admin panel for creating and managing rooms
- **MongoDB Database**: User and room data persistence
- **TypeScript**: Full type safety across frontend and backend
- **Monorepo Structure**: Clean separation with npm workspaces

## 📁 Project Structure

```
Minar_Project/
├── apps/
│   ├── client/          # React + Vite + Phaser 3 frontend
│   └── server/          # Node.js + Express + Socket.io backend
├── packages/
│   └── shared/          # Shared TypeScript types
├── package.json         # Root workspace configuration
├── tsconfig.base.json   # Base TypeScript config
└── README.md
```

## 🛠️ Tech Stack

### Frontend (apps/client)
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Phaser 3** - 2D game engine
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time communication
- **React Router** - Client-side routing

### Backend (apps/server)
- **Node.js + Express** - HTTP server
- **Socket.io** - WebSocket server
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **TypeScript** - Type safety

### Shared (packages/shared)
- Common TypeScript types and interfaces

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)

### Setup

1. **Clone the repository**
   ```bash
   cd Minar_Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env` file in `apps/server/`:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/metaverse
   JWT_SECRET=your-super-secret-key-change-this
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # If running locally
   mongod
   ```

5. **Run the application**
   
   Development mode (runs both client and server):
   ```bash
   npm run dev
   ```
   
   Or run separately:
   ```bash
   # Terminal 1 - Server
   npm run dev:server
   
   # Terminal 2 - Client
   npm run dev:client
   ```

6. **Open in browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 🎮 Usage

### For Users

1. **Create Account**: Register with username, email, and password
2. **Login**: Sign in to access the lobby
3. **Join Room**: Select a room from the lobby
4. **Move Around**: Use arrow keys to move your avatar
5. **Chat**: Send messages to other players in the room

### For Admins

1. **Access Admin Panel**: After login, click "Admin Panel"
2. **Create Rooms**: Add new rooms with custom names and slugs
3. **Manage Rooms**: Delete existing rooms
4. **Set Privacy**: Mark rooms as public or private

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Run both client and server in parallel
- `npm run dev:client` - Run only the frontend
- `npm run dev:server` - Run only the backend
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier

### Client (apps/client)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Server (apps/server)
- `npm run dev` - Start with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run production build

## 🔐 API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/me` - Get current user (Protected)

### Rooms
- **GET** `/api/rooms` - List all public rooms
- **GET** `/api/rooms/:id` - Get room by ID or slug
- **POST** `/api/rooms` - Create room (Admin only)
- **PUT** `/api/rooms/:id` - Update room (Admin only)
- **DELETE** `/api/rooms/:id` - Delete room (Admin only)

### Health
- **GET** `/health` - Server health check

## 🔌 Socket.io Events

### Client → Server
- `room:join` - Join a room
- `room:leave` - Leave a room
- `avatar:move` - Send player position
- `chat:message` - Send chat message

### Server → Client
- `room:joined` - Room join confirmation
- `user:joined` - Another user joined
- `user:left` - User left room
- `avatar:moved` - Player position update
- `chat:message` - Chat message broadcast

## 🎨 Pages

- **/** - Login/Register page
- **/lobby** - Room selection lobby
- **/room/:roomId** - Game room with Phaser canvas and chat
- **/admin** - Admin panel for room management

## 🗂️ Database Models

###  User
- username (unique, required)
- email (unique, required)
- passwordHash (bcrypt)
- role (user | admin)
- avatarId (optional)
- timestamps

### Room
- name (required)
- slug (unique, auto-generated)
- layoutJson (room configuration)
- isPrivate (boolean)
- createdBy (User reference)
- timestamps

## 🚧 Future Enhancements

- [ ] WebRTC video/audio chat
- [ ] Spatial audio based on avatar position
- [ ] AI NPCs with chat capabilities
- [ ] Visual room editor
- [ ] Avatar customization
- [ ] Inventory system
- [ ] Private messaging
- [ ] Friend system
- [ ] Room capacity limits
- [ ] Analytics dashboard

## 📝 Development Notes

- Frontend runs on port **5173** (Vite default)
- Backend runs on port **3001**
- MongoDB default: **27017**
- Vite proxy configured for `/api` routes to backend
- Socket.io CORS configured for client URL

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` and `npm run format`
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC

## 🆘 Troubleshooting

### MongoDB Connection Error
```
❌ Failed to connect to MongoDB
```
**Solution**: Ensure MongoDB is running (`mongod` command) or check your `MONGODB_URI` in `.env`

### Port Already in Use
```
❌ EADDRINUSE: address already in use
```
**Solution**: Change port in config or kill the process using that port

### Socket.io Connection Failed
```
🔴 Socket disconnected
```
**Solution**: Check that backend server is running on port 3001 and CORS is properly configured

### TypeScript Errors
```
❌ Type errors during build
```
**Solution**: Run `npm install` in root, client, and server directories

---

**Built with ❤️ for the metaverse**
