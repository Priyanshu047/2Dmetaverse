import { useEffect, useState } from 'react';

interface AudioEnablerProps {
    onEnable: () => void;
}

/**
 * Component to enable audio playback via user interaction
 * Bypasses browser autoplay restrictions
 */
const AudioEnabler: React.FC<AudioEnablerProps> = ({ onEnable }) => {
    const [isEnabled, setIsEnabled] = useState(false);

    const handleEnable = () => {
        // Resume all audio elements on the page
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.play().catch(err => console.log('Audio play failed:', err));
        });

        // Resume AudioContext if it exists
        const audioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (audioContext) {
            const ctx = new audioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
        }

        setIsEnabled(true);
        onEnable();

        console.log('✅ Audio enabled via user interaction');
    };

    if (isEnabled) return null;

    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
            <button
                onClick={handleEnable}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg animate-pulse flex items-center gap-2"
            >
                <span className="text-xl">🔊</span>
                <span>Click to Enable Audio</span>
            </button>
        </div>
    );
};

export default AudioEnabler;
