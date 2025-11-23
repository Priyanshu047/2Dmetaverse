import { Request, Response } from 'express';
import { Room } from '../models/Room';
import { generateSlug } from '../utils/slug';

// Helper to generate 6-digit alphanumeric code
const generateRoomId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const createRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, type, isPublic } = req.body;
        const userId = (req as any).user?.userId; // Assumes auth middleware populates this

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Generate unique room ID
        let roomId = generateRoomId();
        let isUnique = false;
        while (!isUnique) {
            const existing = await Room.findOne({ roomId });
            if (!existing) isUnique = true;
            else roomId = generateRoomId();
        }

        const slug = generateSlug(name);

        const newRoom = await Room.create({
            name,
            slug: `${slug}-${Date.now()}`, // Ensure unique slug
            roomId,
            ownerId: userId,
            type: type || 'LOBBY',
            description,
            isPublic: isPublic !== undefined ? isPublic : true,
            layout: {
                layoutJson: { walls: [], furniture: [] }, // Default empty layout
                spawnPoints: [{ name: 'spawn', x: 400, y: 300 }],
                gameZones: []
            }
        });

        res.status(201).json(newRoom);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: 'Server error creating room' });
    }
};

export const getRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const rooms = await Room.find({}, { layout: 0 }); // Exclude layout to keep response lightweight
        res.json({ rooms });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Server error fetching rooms' });
    }
};

export const getRoom = async (req: Request, res: Response): Promise<void> => {
    const { idOrSlug } = req.params;
    try {
        let room;
        if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
            room = await Room.findById(idOrSlug);
        } else if (idOrSlug.length === 6 && /^[A-Z0-9]+$/.test(idOrSlug)) {
            // Check for 6-digit room ID
            room = await Room.findOne({ roomId: idOrSlug });
        } else {
            room = await Room.findOne({ slug: idOrSlug });
        }

        if (!room) {
            res.status(404).json({ message: 'Room not found' });
            return;
        }

        res.json(room);
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ message: 'Server error fetching room' });
    }
};
