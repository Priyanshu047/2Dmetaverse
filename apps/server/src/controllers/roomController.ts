import { Request, Response } from 'express';
import { Room } from '../models/Room';

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
