import React, { useState, useEffect } from 'react';
import { UserProfile, LinkItem, UpdateProfilePayload } from '../../api/types/networking';
import { getProfile, updateMyProfile } from '../../api/profile';

interface ProfileSettingsPanelProps {
    userId: string;
    onSave?: () => void;
}

const ProfileSettingsPanel: React.FC<ProfileSettingsPanelProps> = ({
    userId,
    onSave,
}) => {
    const [profile, setProfile] = useState<UserProfile>({
        userId,
        headline: '',
        skills: [],
        links: [],
        bio: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Temporary states for editing
    const [skillInput, setSkillInput] = useState('');
    const [newLink, setNewLink] = useState<LinkItem>({ label: '', url: '' });

    // Fetch profile on mount
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                const data = await getProfile(userId);
                setProfile(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [userId]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const payload: UpdateProfilePayload = {
                headline: profile.headline,
                skills: profile.skills,
                links: profile.links,
                bio: profile.bio,
            };

            const updated = await updateMyProfile(payload);
            setProfile(updated);
            setSuccess(true);

            if (onSave) {
                onSave();
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
            setProfile({
                ...profile,
                skills: [...profile.skills, skillInput.trim()],
            });
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setProfile({
            ...profile,
            skills: profile.skills.filter((s) => s !== skill),
        });
    };

    const addLink = () => {
        if (newLink.label.trim() && newLink.url.trim()) {
            // Basic URL validation
            if (!newLink.url.match(/^https?:\/\/.+/)) {
                setError('URL must start with http:// or https://');
                return;
            }

            setProfile({
                ...profile,
                links: [...profile.links, { ...newLink }],
            });
            setNewLink({ label: '', url: '' });
            setError(null);
        }
    };

    const removeLink = (index: number) => {
        setProfile({
            ...profile,
            links: profile.links.filter((_, i) => i !== index),
        });
    };

    if (loading) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg">
                <p className="text-gray-400">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-3xl">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

            {/* Error/Success Messages */}
            {error && (
                <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border border-red-600 rounded text-red-300">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-600 bg-opacity-20 border border-green-600 rounded text-green-300">
                    Profile saved successfully!
                </div>
            )}

            {/* Headline */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Headline
                </label>
                <input
                    type="text"
                    value={profile.headline}
                    onChange={(e) =>
                        setProfile({ ...profile, headline: e.target.value })
                    }
                    placeholder="e.g., Full Stack Developer | TypeScript Enthusiast"
                    maxLength={200}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                    {profile.headline.length}/200 characters
                </p>
            </div>

            {/* Skills */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Skills
                </label>
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addSkill();
                            }
                        }}
                        placeholder="Add a skill (press Enter)"
                        className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={addSkill}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 bg-opacity-20 text-blue-300 rounded-full text-sm font-medium border border-blue-600"
                        >
                            {skill}
                            <button
                                onClick={() => removeSkill(skill)}
                                className="ml-2 text-blue-300 hover:text-white"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                {profile.skills.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No skills added yet</p>
                )}
            </div>

            {/* Links */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Links
                </label>
                <div className="space-y-2 mb-3">
                    <input
                        type="text"
                        value={newLink.label}
                        onChange={(e) =>
                            setNewLink({ ...newLink, label: e.target.value })
                        }
                        placeholder="Label (e.g., LinkedIn, GitHub)"
                        maxLength={50}
                        className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={newLink.url}
                            onChange={(e) =>
                                setNewLink({ ...newLink, url: e.target.value })
                            }
                            placeholder="URL (e.g., https://linkedin.com/in/username)"
                            className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={addLink}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        >
                            Add Link
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    {profile.links.map((link, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                        >
                            <div>
                                <p className="text-white font-medium">{link.label}</p>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                    {link.url}
                                </a>
                            </div>
                            <button
                                onClick={() => removeLink(index)}
                                className="text-red-400 hover:text-red-300"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
                {profile.links.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No links added yet</p>
                )}
            </div>

            {/* Bio */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Bio
                </label>
                <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    maxLength={1000}
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                    {profile.bio?.length || 0}/1000 characters
                </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </div>
    );
};

export default ProfileSettingsPanel;
