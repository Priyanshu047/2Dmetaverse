# Metaverse 2D - Frontend Client

React + TypeScript + Vite frontend for the 2D Metaverse Web App with Phaser 3 game engine integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The client will run on **http://localhost:5173**

## 📁 File Structure

```
apps/client/
├── src/
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component
│   │
│   ├── routes/                # Routing configuration
│   │   └── AppRoutes.tsx      # All route definitions
│   │
│   ├── pages/                 # Page components

│   │   ├── LoginPage.tsx      # Login/Register page
│   │   ├── LobbyPage.tsx      # Room selection lobby
│   │   ├── RoomPage.tsx       # Game room with Phaser + Chat
│   │   └── AdminPage.tsx      # Admin room management
│   │
│   ├── components/            # Reusable components
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx # Main layout wrapper
│   │   │   └── Header.tsx     # Navigation header
│   │   │
│   │   ├── phaser/            # Phaser game integration
│   │   │   ├── PhaserCanvas.tsx  # React wrapper for Phaser
│   │   │   └── game/
│   │   │       ├── config.ts     # Phaser game configuration
│   │   │       └── scenes/
│   │   │           ├── BootScene.ts   # Asset loading scene
│   │   │           └── MainScene.ts   # Main game scene
│   │   │
│   │   └── Chat.tsx           # Chat component
│   │
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Authentication state
│   │
│   ├── hooks/                 # Custom hooks
│   │   └── useSocket.ts       # Socket.io connection hook
│   │
│   ├── api/                   # API layer
│   │   └── http.ts            # Axios instance with interceptors
│   │
│   └── styles/                # Global styles
│       └── tailwind.css       # Tailwind CSS directives
│
├── index.html                 # HTML entry point
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 🎮 Phaser 3 Integration

### Architecture

The Phaser game is organized into separate scenes for better modularity:

#### BootScene (`src/components/phaser/game/scenes/BootScene.ts`)
- Preloads game assets (sprites, images, audio)
- Displays loading screen
- Transitions to MainScene when complete

#### MainScene (`src/components/phaser/game/scenes/MainScene.ts`)
- Main game logic and rendering
- Player movement with arrow keys
- Multiplayer avatar synchronization
- Methods:
  - `setMoveCallback(callback)` - Register movement callback
  - `updateOtherPlayer(userId, username, x, y)` - Update/create other player avatar
  - `removeOtherPlayer(userId)` - Remove disconnected player

#### Game Config (`src/components/phaser/game/config.ts`)
- Phaser game configuration object
- Physics settings (Arcade physics, no gravity)
- Scene registration
- Scaling configuration

### Adding New Scenes

1. Create scene file in `src/components/phaser/game/scenes/`
2. Extend `Phaser.Scene`
3. Add to `scenes` array in `config.ts`

Example:
```typescript
// NewScene.ts
import Phaser from 'phaser';

export class NewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NewScene' });
  }

  create() {
    // Scene logic
  }
}

// config.ts
import { NewScene } from './scenes/NewScene';

export const gameConfig = {
  // ...
  scene: [BootScene, MainScene, NewScene],
};
```

### Extending Player Movement

To add custom movement logic, modify `MainScene.update()`:

```typescript
update() {
  // Custom movement logic
  if (this.input.keyboard.addKey('W').isDown) {
    // Handle W key
  }

  // Call movement callback
  if (moved && this.onMove) {
    this.onMove({ userId, x, y, direction });
  }
}
```

## 🔌 Real-time Communication

### Socket.io Integration

The `useSocket` hook provides type-safe Socket.io communication:

```typescript
const { emit, on, off, isConnected } = useSocket(roomId, userId, username);

// Send events
emit('chat:message', { text: 'Hello!' });
emit('avatar:move', { userId, x, y, direction });

// Listen to events
useEffect(() => {
  const handler = (data) => console.log(data);
  on('chat:message', handler);
  
  return () => off('chat:message', handler);
}, [on, off]);
```

### Adding New Socket Events

1. Define event in `@metaverse/shared/src/index.ts`
2. Implement server handler in `apps/server/src/sockets/index.ts`
3. Use in client via `useSocket` hook

## 🌐 API Integration

### HTTP Client

The Axios instance (`src/api/http.ts`) automatically:
- Attaches JWT token to requests
- Handles 401 (unauthorized) redirects
- Provides error messages

Usage:
```typescript
import http from '../api/http';

// GET request
const { data } = await http.get('/rooms');

// POST request
await http.post('/rooms', { name: 'New Room' });

// Token is automatically included if user is logged in
```

### Adding New API Endpoints

Use the http instance for all API calls:

```typescript
// In a component or hook
const fetchRooms = async () => {
  try {
    const response = await http.get('/rooms');
    setRooms(response.data.data.rooms);
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
  }
};
```

## 🎨 Styling

### Tailwind CSS

All styles use Tailwind CSS utility classes. Configuration in `tailwind.config.js`.

Custom color palette:
```javascript
colors: {
  primary: {
    50: '#eff6ff',
    // ... blue color scale
    900: '#1e3a8a',
  },
}
```

### Adding Custom Styles

For component-specific styles not covered by Tailwind:
```css
/* In src/styles/tailwind.css */
@layer components {
  .custom-class {
    @apply bg-blue-500 text-white rounded-lg;
  }
}
```

## 🔐 Authentication

### Protected Routes

Routes are protected via the `useAuth` hook:

```typescript
const { user, isAuthenticated } = useAuth();

useEffect(() => {
  if (!isAuthenticated) {
    navigate('/login');
  }
}, [isAuthenticated]);
```

### User Roles

Admin-only features check user role:
```typescript
{user?.role === 'admin' && (
  <Link to="/admin">Admin Panel</Link>
)}
```

## 📹 WebRTC Audio/Video Integration

### Architecture

The app uses **simple-peer** library for WebRTC peer-to-peer connections with Socket.io for signaling.

#### useWebRTC Hook (`src/hooks/useWebRTC.ts`)

Manages all WebRTC functionality:
- Gets user media (camera + microphone)
- Creates SimplePeer instances for each remote user
- Handles WebRTC signaling (offer/answer/ICE candidates)
- Provides local stream and peer streams
- Toggle functions for mute/video

```typescript
const {
  localStream,
  peers,
  isMuted,
  isVideoOff,
  toggleMute,
  toggleVideo,
  isInitialized
} = useWebRTC(socket, roomId, userId);
```

#### Video Components

**VideoTile** - Displays individual video streams
- Auto-plays video
- Mutes local video (prevents echo)
- Shows peer ID label
- "No video" placeholder

**VideoGrid** - Layout for all video tiles
- Local video always first
- Remote videos sorted by peer ID
- Responsive scrollable layout
- Participant count display

### WebRTC Signaling Flow

1. **User A joins room**
   - Gets media (`getUserMedia`)
   - Joins Socket.io room
   - Server broadcasts `webrtc:peer-joined` to others

2. **User B (already in room) receives peer-joined**
   - Creates SimplePeer with `initiator: true`
   - Sends `webrtc:offer` to server → forwarded to User A

3. **User A receives offer**
   - Creates SimplePeer with `initiator: false`
   - Sends `webrtc:answer` to server → forwarded to User B

4. **ICE Candidate Exchange**
   - Both peers exchange ICE candidates via `webrtc:candidate`
   - Connection established

5. **Streams Connected**
   - SimplePeer emits 'stream' event
   - Video tiles display remote streams

### Socket.io Events

**Client → Server:**
- `webrtc:offer` - Send WebRTC offer to target peer
- `webrtc:answer` - Send WebRTC answer to target peer
- `webrtc:candidate` - Send ICE candidate to target peer

**Server → Client:**
- `webrtc:peer-joined` - New peer joined room
- `webrtc:offer` - Receive offer from initiator
- `webrtc:answer` - Receive answer from receiver
- `webrtc:candidate` - Receive ICE candidate

### STUN/TURN Servers

**Default Configuration (Public Google STUN):**
```typescript
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
```

**Adding TURN Servers:**

For production or NAT traversal, add TURN servers in `useWebRTC.ts`:

```typescript
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'username',
    credential: 'password'
  }
];
```

Popular TURN server providers:
- **Twilio** - https://www.twilio.com/stun-turn
- **Xirsys** - https://xirsys.com/
- **CoTURN** - Self-hosted open source

### Usage in Components

```typescript
import { useWebRTC } from '../hooks/useWebRTC';
import VideoGrid from '../components/webrtc/VideoGrid';

const RoomPage = () => {
  const { socket } = useSocket(roomId, userId, username);
  const {
    localStream,
    peers,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo
  } = useWebRTC(socket, roomId, userId);

  return (
    <div>
      {/* Video Grid */}
      <VideoGrid
        localStream={localStream}
        peers={peers}
        localPeerId={userId}
      />

      {/* Controls */}
      <button onClick={toggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
      <button onClick={toggleVideo}>
        {isVideoOff ? 'Start Video' : 'Stop Video'}
      </button>
    </div>
  );
};
```

### Camera/Microphone Permissions

The browser will request permissions when joining a room:
- **Camera**: Required for video streaming
- **Microphone**: Required for audio

**Permission Denial Handling:**
If user denies permissions, `localStream` will be null and video tiles show placeholder.

### Troubleshooting WebRTC

**No video appears:**
- Check browser console for `getUserMedia` errors
- Verify camera/microphone permissions granted
- Check that HTTPS is used (required for getUserMedia in production)

**Peer connection fails:**
- Verify STUN servers are reachable
- Add TURN server for NAT traversal
- Check firewall/network restrictions
- Monitor browser console for WebRTC errors

**Audio echo:**
- Local video is always muted automatically (prevents feedback)
- Use headphones for better experience

**One-way video:**
- Check if both peers have granted media permissions  
- Verify firewall allows UDP traffic (used by WebRTC)

**High bandwidth usage:**
- WebRTC uses mesh topology (each peer connects to all others)
- For >5 users, consider SFU (Selective Forwarding Unit) architecture

### Performance Tips

1. **Limit video quality** for bandwidth constraints:
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 15 }
  },
  audio: true
});
```

2. **Disable video when not needed** to reduce CPU usage

3. **For production with many users**, implement SFU server (e.g., mediasoup, Janus)

### Spatial Audio

Can be integrated with Phaser avatar positions:
```typescript
// In MainScene
const distance = Phaser.Math.Distance.Between(
  player.x, player.y,
  otherPlayer.x, otherPlayer.y
);

// Adjust audio volume based on distance
audioGain.value = 1 / (distance / 100);
```

### Spatial Audio

Can be integrated with Phaser avatar positions:
```typescript
// In MainScene
const distance = Phaser.Math.Distance.Between(
  player.x, player.y,
  otherPlayer.x, otherPlayer.y
);

// Adjust audio volume based on distance
audioGain.value = 1 / (distance / 100);
```

### AI NPCs

Add NPC sprites and logic in MainScene:
```typescript
// In MainScene.create()
const npc = this.add.sprite(x, y, 'npc-sprite');

// Listen for chat events with NPC
socket.on('npc:message', (data) => {
  displayChatBubble(npc, data.message);
});
```

## 🛠️ Development

### Hot Reload

Vite provides instant hot module replacement. Changes to:
- React components → instant update
- Phaser scenes → game restarts
- Tailwind classes → instant update

### TypeScript

Strict mode is enabled. All files must pass type checking:
```bash
# Check types without building
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## 📦 Building for Production

```bash
# Build optimized bundle
npm run build

# Output in dist/

# Preview production build locally
npm run preview
```

### Environment Variables

Create `.env.production` for production settings:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

## 🔧 Configuration

### Vite Proxy

API requests to `/api/*` are proxied to the backend server during development:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

### Path Aliases

Import shortcuts are configured:
```typescript
import Component from '@/components/Component';
// Instead of: '../../../components/Component'
```

## 🐛 Troubleshooting

### Phaser game not loading
- Check browser console for errors
- Verify BootScene and MainScene are imported in `config.ts`
- Ensure `phaser-container` div exists

### Socket.io connection failed
- Verify backend server is running on port 3001
- Check CORS configuration in server
- Monitor browser Network tab for WebSocket connection

### Build errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## 📝 Notes

- Frontend runs on port **5173** (Vite default)
- Backend should

 run on port **3001**
- WebSocket connection uses same port as backend
- JWT tokens stored in localStorage
- Auto-redirect to login on 401 responses

---

**Ready to build the metaverse! 🚀**
