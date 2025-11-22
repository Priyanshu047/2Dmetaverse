/**
 * Type definitions for the 2D room and player system
 */

export interface RoomPlayer {
    id: string;
    name: string;
    avatarColor: string;
    x: number;
    y: number;
}

export interface PlayerMoveData {
    x: number;
    y: number;
    direction?: string;
}

export interface RoomStateData {
    players: RoomPlayer[];
}

export interface PlayerJoinedData {
    id: string;
    name: string;
    avatarColor: string;
    x: number;
    y: number;
}

export interface PlayerMovedData {
    playerId: string;
    x: number;
    y: number;
}

export interface PlayerLeftData {
    playerId: string;
}
