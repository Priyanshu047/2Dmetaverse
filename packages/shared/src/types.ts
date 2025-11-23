export type RoomType = 'LOBBY' | 'NETWORKING_LOUNGE' | 'STAGE' | 'GAME_ROOM';

export interface SpawnPoint {
    name: string;
    x: number;
    y: number;
}



export interface Room {
    _id: string;
    name: string;
    slug: string;
    roomId: string; // 6-digit code
    ownerId: string; // User ID of the creator
    type: RoomType;
    description?: string;
    isPublic: boolean;
    maxUsers?: number;
    layout?: RoomLayout;
    createdAt?: Date;
    updatedAt?: Date;
}

// Avatar position for multiplayer tracking
export interface AvatarPosition {
    x: number;
    y: number;
    userId?: string;
    username?: string;
    direction?: string;
}

// Socket events type mapping - allow any string
export type SocketEvents = string;


// API response generic interface
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

// RoomDTO for list responses (without layout)
export interface RoomDTO {
    _id: string;
    name: string;
    slug: string;
    type: RoomType;
    description?: string;
    isPublic: boolean;
    maxUsers?: number;
}


// --- RBAC & Moderation Types ---

export type UserRole = 'user' | 'moderator' | 'admin';

export type ModerationAction =
    | 'mute'
    | 'unmute'
    | 'kick'
    | 'ban'
    | 'lockRoom'
    | 'unlockRoom'
    | 'roleChange';

export interface ModerationLog {
    _id: string;
    action: ModerationAction;
    targetUserId?: string;
    issuedByUserId: string;
    roomId?: string;
    reason?: string;
    createdAt: Date;
    updatedAt?: Date;
}



// New ChatMessage type for chat functionality
export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: string; // ISO string
}

// User and Auth types
export interface UserDTO {
    id: string;
    username: string;
    email: string;
    role?: string;
}

export interface AuthResponse {
    user: UserDTO;
    token: string;
}

// NPC Types for AI Chatbot NPCs
export type NpcRole = 'GUIDE' | 'MODERATOR' | 'HOST' | 'ASSISTANT';

export interface NpcTriggerZone {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface NpcConfig {
    _id: string;
    roomSlug: string;
    name: string;
    displayName: string;
    role: NpcRole;
    systemPrompt: string;
    triggerZones: NpcTriggerZone[];
    maxMessagesPerMinute: number;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface NpcChatContext {
    recentMessages?: Array<{
        from: string;
        text: string;
        timestamp: number;
    }>;
    roomType?: RoomType;
    timeOfDay?: string;
}

export interface NpcChatRequest {
    roomSlug: string;
    npcName: string;
    userId: string;
    username: string;
    message: string;
    context?: NpcChatContext;
}

export interface NpcChatResponse {
    npcName: string;
    displayName: string;
    text: string;
    roomSlug: string;
}

export interface NpcMessage extends ChatMessage {
    npcName: string;
    displayName: string;
    role: NpcRole;
}

// --- Mini-Game Types ---

export type GameZoneType = "quiz" | "puzzle" | "board";

export interface GameZoneConfig {
    id: string;
    type: GameZoneType;
    gameId: string; // e.g. "quiz-1"
    x: number;
    y: number;
    width: number;
    height: number;
}

// Extended RoomLayout
export interface RoomLayout {
    layoutJson: any; // Full JSON to send directly to Phaser
    spawnPoints: SpawnPoint[];
    gameZones?: GameZoneConfig[];
}

export interface GamePlayer {
    userId: string;
    socketId: string;
    name: string;
    score: number;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
}

export interface GameSession {
    sessionId: string;
    roomId: string;
    zoneId: string;
    gameId: string;
    type: GameZoneType;
    players: GamePlayer[];
    state: "waiting" | "in-progress" | "finished";
    questions?: QuizQuestion[];
    currentQuestionIndex?: number;
    startTime?: number;
}

// Game Events
export interface GameJoinPayload {
    roomId: string;
    zoneId: string;
    gameId: string;
    userId: string;
    username: string;
}

export interface GameActionPayload {
    gameSessionId: string;
    actionType: string;
    payload: any;
}

// --- Virtual Stage / Conference Room Types ---

export type StageUserRole = 'presenter' | 'audience';

export interface StageSession {
    _id: string;
    roomId: string;
    presenterId: string | null;
    isLive: boolean;
    startedAt?: Date;
    endedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Question {
    _id: string;
    stageSessionId: string;
    roomId: string;
    userId: string;
    username: string;
    questionText: string;
    status: 'pending' | 'answered' | 'dismissed';
    createdAt: Date;
    updatedAt?: Date;
}

export interface LiveKitTokenResponse {
    token: string;
    url: string;
}

export interface StageMessageQuestion {
    _id: string;
    username: string;
    questionText: string;
    status: 'pending' | 'answered' | 'dismissed';
    createdAt: Date;
}

