import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, NpcMessage } from '@metaverse/shared';

interface ExtendedChatMessage extends ChatMessage {
    type?: 'user' | 'npc' | 'system';
    npcName?: string;
    displayName?: string;
}

interface ChatProps {
    messages: ExtendedChatMessage[];
    onSendMessage: (text: string) => void;
    username: string;
    isNpcThinking?: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, username, isNpcThinking }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isNpcThinking]);

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
                <div key={message.id} className="flex items-start gap-2 mr-auto max-w-[85%]">
                    {/* NPC Icon */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-xs font-bold">🤖</span>
                    </div>

                    {/* Message bubble */}
                    <div className="flex-1">
                        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700/50 p-3 rounded-lg">
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
                className={`p-3 rounded-lg ${isOwn
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

    return (
        <div className="flex flex-col h-full bg-gray-800">
            {/* Chat header */}
            <div className="p-4 bg-gray-900 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Chat</h3>
                <p className="text-xs text-gray-400 mt-1">
                    Tip: Use @NpcName to talk to NPCs
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(renderMessage)}

                {/* NPC thinking indicator */}
                {isNpcThinking && (
                    <div className="flex items-start gap-2 mr-auto max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold">🤖</span>
                        </div>
                        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700/50 p-3 rounded-lg">
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
                        placeholder="Type a message or @NpcName to talk to NPC..."
                        className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className={`px-6 py-2 rounded-lg font-semibold transition ${inputValue.trim()
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
