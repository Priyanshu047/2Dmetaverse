import { useState, useEffect, useCallback } from 'react';
import { SpatialAudioManager } from '../audio/SpatialAudioManager';

interface UseSpatialAudioReturn {
    isEnabled: boolean;
    setIsEnabled: (enabled: boolean) => void;
    masterVolume: number;
    setMasterVolume: (volume: number) => void;
    isSupported: boolean;
}

const STORAGE_KEY_ENABLED = 'spatialAudio.enabled';
const STORAGE_KEY_VOLUME = 'spatialAudio.volume';

/**
 * React hook for managing spatial audio settings
 */
export const useSpatialAudio = (): UseSpatialAudioReturn => {
    // Check browser support
    const isSupported = SpatialAudioManager.isSupported();

    // Load persisted settings from localStorage
    const [isEnabled, setIsEnabledState] = useState<boolean>(() => {
        if (!isSupported) return false;
        const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
        return stored !== null ? stored === 'true' : true; // Default: enabled
    });

    const [masterVolume, setMasterVolumeState] = useState<number>(() => {
        if (!isSupported) return 100;
        const stored = localStorage.getItem(STORAGE_KEY_VOLUME);
        return stored !== null ? parseInt(stored, 10) : 75; // Default: 75%
    });

    /**
     * Enable or disable spatial audio
     */
    const setIsEnabled = useCallback((enabled: boolean) => {
        setIsEnabledState(enabled);
        localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));

        // Update spatial audio manager
        SpatialAudioManager.getInstance().setEnabled(enabled);
    }, []);

    /**
     * Set master volume (0-100)
     */
    const setMasterVolume = useCallback((volume: number) => {
        const clampedVolume = Math.max(0, Math.min(100, volume));
        setMasterVolumeState(clampedVolume);
        localStorage.setItem(STORAGE_KEY_VOLUME, String(clampedVolume));

        // Update spatial audio manager (convert to 0-1 range)
        SpatialAudioManager.getInstance().setMasterVolume(clampedVolume / 100);
    }, []);

    // Initialize spatial audio manager on mount
    useEffect(() => {
        if (!isSupported) {
            console.warn('Spatial audio not supported in this browser');
            return;
        }

        const manager = SpatialAudioManager.getInstance();

        // Apply initial settings
        manager.setEnabled(isEnabled);
        manager.setMasterVolume(masterVolume / 100);

        console.log('🎵 Spatial audio hook initialized', {
            enabled: isEnabled,
            volume: masterVolume,
        });
    }, []); // Only run once on mount

    return {
        isEnabled,
        setIsEnabled,
        masterVolume,
        setMasterVolume,
        isSupported,
    };
};
