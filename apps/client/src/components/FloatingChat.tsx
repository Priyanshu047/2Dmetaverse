import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, NpcMessage } from '@metaverse/shared';

interface ExtendedChatMessage extends ChatMessage {
    type?: 'user' | 'npc' | 'system';
    npcName?: string;
    displayName?: string;
}

interface FloatingChatProps {
    messages: ExtendedChatMessage[];
    onSendMessage: (text: string) => void;
    username: string;
    isNpcThinking?: boolean;
}

const FloatingChat: React.FC<FloatingChatProps> = ({ messages, onSendMessage, username, isNpcThinking }) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        // Increment unread count if chat is closed or minimized
        if (!isOpen || isMinimized) {
            setUnreadCount(prev => prev + 1);
        }
    }, [messages, isOpen, isMinimized]);

    useEffect(() => {
        // Reset unread count when opening chat
        if (isOpen && !isMinimized) {
            setUnreadCount(0);
        }
    }, [isOpen, isMinimized]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    const renderMessage = (message: ExtendedChatMessage) => {
        const isNpc = message.type === 'npc';
        const isOwn = message.senderId === username || message.senderName === username;
        const isSystem = message.type === 'system';

        if (isSystem) {
            return (
                <div key={message.id} className="text-center text-gray-400 text-sm italic py-1">
                    {message.text}
                </div>
            );
        }

        if (isNpc) {
            return (
                <div key={message.id} className="flex items-start gap-2 mr-auto max-w-[85%] animate-slideIn">
                    {/* NPC Icon */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-xs font-bold">🤖</span>
                    </div>

                    {/* Message bubble */}
                    <div className="flex-1">
                        <div className="bg-gradient-to-r from-blue-900/70 to-purple-900/70 backdrop-blur-sm border border-blue-700/50 p-3 rounded-lg shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-blue-300">
                                    {message.displayName || message.senderName}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-blue-700/50 rounded-full text-blue-200">
                                    AI NPC
                                </span>
                            </div>
                            <div className="text-white text-sm">{message.text}</div>
                        </div>
                    </div>
                </div>
            );
        }

        // Regular user message
        return (
            <div
                key={message.id}
                className={`p-3 rounded-lg shadow-md animate-slideIn ${isOwn
                        ? 'bg-blue-600 ml-auto max-w-[80%]'
                        : 'bg-gray-700 mr-auto max-w-[80%]'
                    }`}
            >
                <div className="text-xs text-gray-300 font-semibold mb-1">
                    {message.senderName || message.senderId}
                </div>
                <div className="text-white text-sm">{message.text}</div>
            </div>
        );
    };

    // Floating chat button
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 z-50 flex items-center gap-2"
            >
                💬
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-700 overflow-hidden z-50 transition-all ${isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
                }`}
        >
            {/* Chat header */}
            <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Chat</h3>
                        <p className="text-xs text-gray-400">Use @NpcName to talk to NPCs</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-gray-400 hover:text-white transition p-1"
                        title={isMinimized ? 'Maximize' : 'Minimize'}
                    >
                        {isMinimized ? '⬆️' : '⬇️'}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white transition p-1"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/50 backdrop-blur-sm" style={{ height: 'calc(600px - 140px)' }}>
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-8">
                                <p className="text-4xl mb-2">💬</p>
                                <p>No messages yet</p>
                                <p className="text-sm mt-2">Try typing @GuideBot hello!</p>
                            </div>
                        )}

                        {messages.map(renderMessage)}

                        {/* NPC thinking indicator */}
                        {isNpcThinking && (
                            <div className="flex items-start gap-2 mr-auto max-w-[85%]">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold">🤖</span>
                                </div>
                                <div className="bg-gradient-to-r from-blue-900/70 to-purple-900/70 backdrop-blur-sm border border-blue-700/50 p-3 rounded-lg shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                        <span className="text-sm text-blue-300">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 bg-gray-900 border-t border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a message or @NpcName..."
                                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className={`px-6 py-3 rounded-lg font-semibold transition ${inputValue.trim()
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/50'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default FloatingChat;
