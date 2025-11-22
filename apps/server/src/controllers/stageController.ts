import { Request, Response } from 'express';
import { StageSession } from '../models/StageSession';
import { Question } from '../models/Question';
import { Room } from '../models/Room';
import { createStageToken, createCoPresenterToken } from '../services/livekitService';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

/**
 * Stage Controller
 * Handles all stage-related operations including presenter control,
 * LiveKit token generation, and Q&A management
 */

// Store io instance for socket emissions
let io: Server;

export const setSocketIO = (socketIO: Server) => {
    io = socketIO;
};

/**
 * Start a presentation session
 * POST /api/stage/:roomId/presenter/start
 */
export const startPresenting = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }

        // Validate room exists and is a stage room
        const room = await Room.findById(roomId);
        if (!room) {
            res.status(404).json({
                success: false,
                message: 'Room not found',
            });
            return;
        }

        if (room.type !== 'STAGE') {
            res.status(400).json({
                success: false,
                message: 'This room is not a stage room',
            });
        }

        // Check if there's already an active session
        const existingSession = await StageSession.findOne({
            roomId: new mongoose.Types.ObjectId(roomId),
            isLive: true,
        });

        if (existingSession) {
            res.status(409).json({
                success: false,
                message: 'A presentation is already in progress',
            });
        }

        // Create new stage session
        const session = await StageSession.create({
            roomId: new mongoose.Types.ObjectId(roomId),
            presenterId: new mongoose.Types.ObjectId(userId),
            isLive: true,
            startedAt: new Date(),
        });

        // Emit socket event to notify room members
        if (io) {
            io.to(roomId).emit('stage:presenter-started', {
                sessionId: session!._id,
                presenterId: userId,
                timestamp: new Date().toISOString(),
            });
        }

        res.status(200).json({
            success: true,
            message: 'Presentation started successfully',
            data: {
                sessionId: session!._id,
                presenterId: session.presenterId,
                isLive: session!.isLive,
            },
        });
    } catch (error: any) {
        console.error('Error starting presentation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start presentation',
            error: error.message,
        });
    }
};

/**
 * Stop a presentation session
 * POST /api/stage/:roomId/presenter/stop
 */
export const stopPresenting = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }

        // Find active session
        const session = await StageSession.findOne({
            roomId: new mongoose.Types.ObjectId(roomId),
            isLive: true,
        });

        if (!session) {
            res.status(404).json({
                success: false,
                message: 'No active presentation found',
            });
        }

        // Verify user is the presenter
        if (!session?.presenterId || session.presenterId.toString() !== userId) {
            res.status(403).json({
                success: false,
                message: 'Only the presenter can stop the presentation',
            });
            return;
        }

        // Update session
        session!.isLive = false;
        session!.endedAt = new Date();
        await session!.save();

        // Emit socket event
        if (io) {
            io.to(roomId).emit('stage:presenter-stopped', {
                sessionId: session!._id,
                timestamp: new Date().toISOString(),
            });
        }

        res.status(200).json({
            success: true,
            message: 'Presentation stopped successfully',
        });
    } catch (error: any) {
        console.error('Error stopping presentation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop presentation',
            error: error.message,
        });
    }
};

/**
 * Get current stage state
 * GET /api/stage/:roomId/state
 */
export const getStageState = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;

        const session = await StageSession.findOne({
            roomId: new mongoose.Types.ObjectId(roomId),
            isLive: true,
        }).populate('presenterId', 'username');

        res.status(200).json({
            success: true,
            data: {
                roomId,
                presenterId: session?.presenterId || null,
                isLive: session?.isLive || false,
                sessionId: session?._id || null,
            },
        });
    } catch (error: any) {
        console.error('Error getting stage state:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stage state',
            error: error.message,
        });
    }
};

/**
 * Request LiveKit access token
 * POST /api/stage/:roomId/token
 */
export const getStageToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;
        const { userId, role, username } = req.body;

        if (!userId || !role) {
            res.status(400).json({
                success: false,
                message: 'userId and role are required',
            });
        }

        if (role !== 'presenter' && role !== 'audience') {
            res.status(400).json({
                success: false,
                message: 'Invalid role. Must be "presenter" or "audience"',
            });
        }

        // If requesting presenter role, verify they are the current presenter
        if (role === 'presenter') {
            const session = await StageSession.findOne({
                roomId: new mongoose.Types.ObjectId(roomId),
                isLive: true,
            });

            if (!session || session.presenterId?.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'You are not authorized to present',
                });
            }
        }

        // Generate LiveKit token
        const tokenData = await createStageToken({
            userId,
            roomId,
            role,
            username,
        });

        res.status(200).json({
            success: true,
            data: tokenData,
        });
    } catch (error: any) {
        console.error('Error generating stage token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate stage token',
            error: error.message,
        });
    }
};

/**
 * Submit a Q&A question
 * POST /api/stage/:roomId/questions
 */
export const submitQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;
        const { userId, username, questionText } = req.body;

        if (!userId || !username || !questionText) {
            res.status(400).json({
                success: false,
                message: 'userId, username, and questionText are required',
            });
        }

        // Get active stage session
        const session = await StageSession.findOne({
            roomId: new mongoose.Types.ObjectId(roomId),
            isLive: true,
        });

        if (!session) {
            res.status(404).json({
                success: false,
                message: 'No active presentation to submit questions to',
            });
        }

        // Create question
        const question = await Question.create({
            stageSessionId: session!._id,
            roomId: new mongoose.Types.ObjectId(roomId),
            userId: new mongoose.Types.ObjectId(userId),
            username,
            questionText,
            status: 'pending',
        });

        // Emit socket event
        if (io) {
            io.to(roomId).emit('stage:question-added', {
                question: {
                    _id: question._id,
                    username: question.username,
                    questionText: question.questionText,
                    status: question.status,
                    createdAt: question.createdAt,
                },
            });
        }

        res.status(201).json({
            success: true,
            message: 'Question submitted successfully',
            data: question,
        });
    } catch (error: any) {
        console.error('Error submitting question:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit question',
            error: error.message,
        });
    }
};

/**
 * Get Q&A questions for a stage session
 * GET /api/stage/:roomId/questions
 */
export const getQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;

        // Get active stage session
        const session = await StageSession.findOne({
            roomId: new mongoose.Types.ObjectId(roomId),
            isLive: true,
        });

        if (!session) {
            res.status(200).json({
                success: true,
                data: [],
            });
        }

        // Get questions for this session
        const questions = await Question.find({
            stageSessionId: session!._id,
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: questions,
        });
    } catch (error: any) {
        console.error('Error getting questions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get questions',
            error: error.message,
        });
    }
};
