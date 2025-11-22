import mongoose, { Schema, Document } from 'mongoose';
import { RoomLayout, SpawnPoint } from '@metaverse/shared';

// Define RoomType locally
type RoomType = 'LOBBY' | 'NETWORKING_LOUNGE' | 'STAGE' | 'GAME_ROOM';

// Define IRoom interface with locked field
export interface IRoom extends Document {
    name: string;
    slug: string;
    type: RoomType;
    description?: string;
    isPublic: boolean;
    maxUsers?: number;
    locked?: boolean;
    layout?: RoomLayout;
    createdAt?: Date;
    updatedAt?: Date;
}

const SpawnPointSchema = new Schema<SpawnPoint>({
    name: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true }
}, { _id: false });

const GameZoneSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String, required: true },
    gameId: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
}, { _id: false });

const RoomLayoutSchema = new Schema<RoomLayout>({
    layoutJson: { type: Schema.Types.Mixed, required: true },
    spawnPoints: [SpawnPointSchema],
    gameZones: [GameZoneSchema]
}, { _id: false });

const RoomSchema = new Schema<IRoom>({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: {
        type: String,
        enum: ['LOBBY', 'NETWORKING_LOUNGE', 'STAGE', 'GAME_ROOM'],
        required: true
    },
    description: { type: String },
    isPublic: { type: Boolean, default: true },
    maxUsers: { type: Number },
    locked: { type: Boolean, default: false },
    layout: RoomLayoutSchema
}, {
    timestamps: true
});

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
