import mongoose, { Schema, Document } from 'mongoose';
import { NpcConfig as INpcConfig, NpcTriggerZone } from '@metaverse/shared';

const TriggerZoneSchema = new Schema<NpcTriggerZone>({
    id: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
}, { _id: false });

const NpcConfigSchema = new Schema<INpcConfig & Document>({
    roomSlug: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    displayName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['GUIDE', 'MODERATOR', 'HOST', 'ASSISTANT'],
        required: true
    },
    systemPrompt: {
        type: String,
        required: true
    },
    triggerZones: [TriggerZoneSchema],
    maxMessagesPerMinute: {
        type: Number,
        default: 5,
        min: 1,
        max: 20
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for efficient lookups
NpcConfigSchema.index({ roomSlug: 1, name: 1 }, { unique: true });

export const NpcConfig = mongoose.model<INpcConfig & Document>('NpcConfig', NpcConfigSchema);
