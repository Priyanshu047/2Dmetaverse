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
    type: RoomType;
    description?: string;
    isPublic: boolean;
    maxUsers?: number;
    layout?: RoomLayout;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface AvatarPosition {
    x: number;
    y: number;
    userId?: string;
    username?: string;
    direction?: string;
}
export type SocketEvents = string;
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}
export interface RoomDTO {
    _id: string;
    name: string;
    slug: string;
    type: RoomType;
    description?: string;
    isPublic: boolean;
    maxUsers?: number;
}
export type UserRole = 'user' | 'moderator' | 'admin';
export type ModerationAction = 'mute' | 'unmute' | 'kick' | 'ban' | 'lockRoom' | 'unlockRoom' | 'roleChange';
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
export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: string;
}
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
export type GameZoneType = "quiz" | "puzzle" | "board";
export interface GameZoneConfig {
    id: string;
    type: GameZoneType;
    gameId: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface RoomLayout {
    layoutJson: any;
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
//# sourceMappingURL=types.d.ts.map