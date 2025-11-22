# RBAC & Moderation Tools - README

## Overview

This system implements Role-Based Access Control (RBAC) with three roles and comprehensive moderation tools.

## Roles

1. **user** (default) - Regular users with standard permissions
2. **moderator** - Can mute/unmute users, kick users, and lock/unlock rooms
3. **admin** - Full access to all moderation tools plus ability to change user roles and view moderation logs

## Creating the First Admin

Since all users start as "user" role by default, you'll need to manually promote the first admin using MongoDB.

### Method 1: MongoDB Shell

```javascript
use metaverse
db.users.updateOne(
  { email: "youradmin@example.com" },
  { $set: { role: "admin" } }
)
```

### Method 2: MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `users` collection
4. Find your user document
5. Edit the `role` field to "admin"
6. Save changes

### Method 3: Create Admin Script

Create a file `apps/server/src/scripts/createAdmin.ts`:

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const createAdmin = async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: ts-node createAdmin.ts <email>');
        process.exit(1);
    }

    const user = await User.findOneAndUpdate(
        { email },
        { role: 'admin' },
        { new: true }
    );

    if (user) {
        console.log(`✅ ${user.username} is now an admin`);
    } else {
        console.log('❌ User not found');
    }

    await mongoose.disconnect();
};

createAdmin();
```

Run: `ts-node src/scripts/createAdmin.ts admin@example.com`

## API Endpoints

### User Management (Moderator+)

- `GET /api/admin/users` - List all users
- `POST /api/admin/users/:userId/mute` - Mute a user
- `POST /api/admin/users/:userId/unmute` - Unmute a user
- `POST /api/admin/users/:userId/kick` - Ban user from a room

### Role Management (Admin Only)

- `POST /api/admin/users/:userId/role` - Change user role
  ```json
  { "role": "user" | "moderator" | "admin" }
  ```

### Room Management (Moderator+)

- `POST /api/admin/rooms/:roomId/lock` - Lock room (no new joins except mods/admins)
- `POST /api/admin/rooms/:roomId/unlock` - Unlock room

### Moderation Logs (Admin Only)

- `GET /api/admin/moderation-logs` - View moderation history
  - Query params: `?roomId=ID&userId=ID`

## Socket.io Events

### Moderation Events (Moderator+)

Server receives:
- `admin:mute` - Real-time mute user
- `admin:unmute` - Real-time unmute user
- `admin:kick` - Real-time kick user from room

Server emits:
- `admin:success` - Moderation action succeeded
- `admin:error` - Moderation action failed
- `system:kicked` - Notify user they were kicked
- `user:muted` - User was muted
- `user:unmuted` - User was unmuted
- `system:message` - System notification to room

## Frontend Components

### Admin Dashboard

Access: `/admin` (requires moderator or admin role)

Features:
- **Users Tab**: View all users, change roles, mute/unmute, kick
- **Moderation Logs Tab**: View recent moderation actions (admin only)

### In-Room Moderation Panel

Location: Appears to moderators/admins inside any room

Features:
- View room users
- Quick mute button
- Quick kick button
- Collapsible panel (bottom-right corner)

### Usage in RoomPage

```typescript
import InRoomModPanel from '../components/InRoomModPanel';

// Inside RoomPage component
<InRoomModPanel 
    roomId={roomId}
    currentUserId={userId}
    currentUserRole={userRole}
/>
```

## Moderation Workflow

### Muting a User

1. **From Admin Dashboard**:
   - Go to `/admin`
   - Find user in table
   - Click "Mute" button

2. **From In-Room Panel**:
   - Open mod panel in room
   - Click mute icon (🔇) next to user

3. **Effect**: User's `isMuted` flag is set to `true`, preventing them from sending chat messages

### Kicking a User

1. **From Admin Dashboard**:
   - Click "Kick" button
   - Enter room ID when prompted
   - Optionally enter reason

2. **From In-Room Panel**:
   - Click kick icon (🚫) next to user
   - Confirm action

3. **Effect**: 
   - User's `bannedRooms` array updated
   - User receives `system:kicked` event
   - User should be redirected out of room (implement in RoomPage)

### Locking a Room

- **REST API**: `POST /api/admin/rooms/:roomId/lock`
- **Effect**: Room's `locked` flag set to `true`
- **Enforcement**: Socket.io checks on `room:join` event - regular users cannot join locked rooms

### Changing User Role

1. **Admin Dashboard** → Users tab
2. Use dropdown to select new role (user/moderator/admin)
3. Change is immediate and logged

## Implementation Notes

### Enforcing Chat Mute

In `apps/server/src/sockets/index.ts`, before processing `chat:message`:

```typescript
socket.on('chat:message', async (data) => {
    const user = await User.findById(socketData.userId);
    
    if (user?.isMuted) {
        socket.emit('error', { message: 'You are muted' });
        return;
    }
    
    // ... process chat message
});
```

### Enforcing Room Lock

In `apps/server/src/sockets/index.ts`, in `room:join` handler:

```typescript
socket.on('room:join', async (data) => {
    const room = await Room.findById(data.roomId);
    const user = await User.findById(socketData.userId);
    
    if (room.locked && user.role === 'user') {
        socket.emit('room:joinDenied', { 
            reason: 'Room is locked' 
        });
        return;
    }
    
    // ... process join
});
```

### Handling Kick Events (Client)

In `RoomPage.tsx`:

```typescript
useEffect(() => {
    if (!socket) return;
    
    const handleKicked = (data: { userId: string; roomId: string; reason: string }) => {
        if (data.userId === currentUserId) {
            alert('You have been removed from this room: ' + data.reason);
            navigate('/rooms');
        }
    };
    
    socket.on('system:kicked', handleKicked);
    
    return () => {
        socket.off('system:kicked', handleKicked);
    };
}, [socket, currentUserId, navigate]);
```

## Security Considerations

1. **Authentication Required**: All admin routes use `authenticate` middleware
2. **Role Verification**: Routes check user role via `requireRole` middleware
3. **Socket Authorization**: Socket event handlers verify role before executing actions
4. **Audit Trail**: All moderation actions logged to `ModerationLog` collection

## Testing

1. Create 3 test users
2. Promote one to admin via MongoDB
3. Login as admin → go to `/admin`
4. Change another user's role to "moderator"
5. Test mute/unmute functionality
6. Test kick functionality
7. Login as moderator and verify limited permissions
8. Test in-room moderation panel

## Files Modified/Created

### Backend
- ✅ `models/User.ts` - Added role, isMuted, bannedRooms
- ✅ `models/Room.ts` - Added locked field
- ✅ `models/ModerationLog.ts` - New model
- ✅ `middleware/rolesMiddleware.ts` - New middleware
- ✅ `controllers/adminController.ts` - New controller
- ✅ `routes/adminRoutes.ts` - New routes
- ✅ `sockets/moderationHandlers.ts` - New handlers
- ✅ `sockets/index.ts` - Integrated moderation
- ✅ `server.ts` - Added admin routes

### Frontend
- ✅ `api/adminApi.ts` - New API client
- ✅ `pages/AdminDashboard.tsx` - New page
- ✅ `components/InRoomModPanel.tsx` - New component
- ✅ `App.tsx` - Added /admin route

### Shared
- ✅ `types.ts` - Added UserRole, ModerationAction, ModerationLog types
