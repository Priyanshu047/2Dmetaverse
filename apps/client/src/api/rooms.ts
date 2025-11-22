import axios from 'axios';
import { Room } from '@metaverse/shared';

const API_URL = 'http://localhost:3001/api';

export const getRooms = async (): Promise<Room[]> => {
    const response = await axios.get<{ rooms: Room[] }>(`${API_URL}/rooms`);
    return response.data.rooms;
};

export const getRoom = async (idOrSlug: string): Promise<Room> => {
    const response = await axios.get<Room>(`${API_URL}/rooms/${idOrSlug}`);
    return response.data;
};
