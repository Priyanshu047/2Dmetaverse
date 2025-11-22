import React, { useState } from 'react';
import { submitQuestion } from '../api/stageApi';
import type { Question } from '@metaverse/shared';

interface QnAPanelProps {
    roomId: string;
    userId: string;
    username: string;
    questions: Question[];
    isPresenter: boolean;
}

/**
 * QnAPanel Component
 * Q&A interface for submitting and viewing questions
 */
const QnAPanel: React.FC<QnAPanelProps> = ({
    roomId,
    userId,
    username,
    questions,
    isPresenter,
}) => {
    const [questionText, setQuestionText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!questionText.trim()) return;

        setSubmitting(true);
        setError('');

        try {
            await submitQuestion(roomId, userId, username, questionText);
            setQuestionText('');
        } catch (err: any) {
            console.error('Error submitting question:', err);
            setError(err.response?.data?.message || 'Failed to submit question');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold">Q&A</h2>
                <p className="text-sm text-gray-400">{questions.length} questions</p>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {questions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">💬</div>
                        <p>No questions yet.</p>
                        <p className="text-sm">Be the first to ask!</p>
                    </div>
                ) : (
                    questions.map((q) => (
                        <div
                            key={q._id}
                            className={`p-3 rounded-lg ${q.userId === userId
                                    ? 'bg-blue-900/30 border border-blue-700'
                                    : 'bg-gray-700'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className="font-semibold text-sm">{q.username}</span>
                                <span
                                    className={`text-xs px-2 py-1 rounded ${q.status === 'pending'
                                            ? 'bg-yellow-600'
                                            : q.status === 'answered'
                                                ? 'bg-green-600'
                                                : 'bg-gray-600'
                                        }`}
                                >
                                    {q.status}
                                </span>
                            </div>
                            <p className="text-sm">{q.questionText}</p>
                            <p className="text-xs text-gray-400 mt-2">
                                {new Date(q.createdAt).toLocaleTimeString()}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Submit Form */}
            {!isPresenter && (
                <div className="p-4 border-t border-gray-700">
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Ask a question..."
                            className="w-full bg-gray-700 text-white p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            disabled={submitting}
                        />

                        {error && (
                            <div className="text-red-400 text-sm mt-2">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={!questionText.trim() || submitting}
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            {submitting ? 'Submitting...' : 'Submit Question'}
                        </button>
                    </form>
                </div>
            )}

            {isPresenter && (
                <div className="p-4 border-t border-gray-700 text-center text-gray-400 text-sm">
                    Viewing as presenter
                </div>
            )}
        </div>
    );
};

export default QnAPanel;
