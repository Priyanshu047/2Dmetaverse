import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/auth/LoginModal';
import { useAuth } from '../contexts/AuthContext';

/**
 * LandingPage Component
 * Beautiful, responsive landing page for 2D Metaverse Web App
 */
const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleEnterMetaverse = () => {
        setIsLoginModalOpen(true);
    };

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                2D-Metaverse
                            </h1>
                        </div>

                        {/* Nav Links */}
                        <div className="hidden md:flex items-center space-x-8">
                            <button
                                onClick={() => scrollToSection('features')}
                                className="text-slate-300 hover:text-white transition-colors"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollToSection('how-it-works')}
                                className="text-slate-300 hover:text-white transition-colors"
                            >
                                How It Works
                            </button>
                            <button
                                onClick={() => scrollToSection('use-cases')}
                                className="text-slate-300 hover:text-white transition-colors"
                            >
                                Use Cases
                            </button>
                            <button
                                onClick={() => scrollToSection('for-teams')}
                                className="text-slate-300 hover:text-white transition-colors"
                            >
                                For Teams
                            </button>
                            <button
                                onClick={handleEnterMetaverse}
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                            >
                                Enter Metaverse
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={handleEnterMetaverse}
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                            >
                                Enter
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                                Bring your team into a{' '}
                                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                                    2D Metaverse Office
                                </span>
                            </h1>
                            <p className="text-xl text-slate-400 leading-relaxed">
                                A browser-based 2D world for remote work, virtual events, networking, and
                                real-time collaboration. Move avatars, talk over spatial audio, and connect
                                like never before.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleEnterMetaverse}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-cyan-500/50"
                                >
                                    Enter Metaverse →
                                </button>
                                <button
                                    onClick={() => scrollToSection('how-it-works')}
                                    className="border-2 border-slate-700 hover:border-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
                                >
                                    Watch Demo
                                </button>
                            </div>
                        </div>

                        {/* Right - Mock UI Illustration */}
                        <div className="relative">
                            <div className="rounded-2xl border-2 border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl">
                                {/* Mock Minimap */}
                                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs text-slate-500 font-semibold">MINIMAP</span>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-12 rounded ${i % 3 === 0
                                                    ? 'bg-cyan-500/20 border border-cyan-500/50'
                                                    : 'bg-slate-700/30'
                                                    }`}
                                            ></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mock Video Thumbnails */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="relative bg-slate-800/50 rounded-lg aspect-video flex items-center justify-center border border-slate-700"
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full ${i === 1
                                                    ? 'bg-cyan-400'
                                                    : i === 2
                                                        ? 'bg-purple-400'
                                                        : 'bg-pink-400'
                                                    }`}
                                            ></div>
                                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Mock Chat Bubbles */}
                                <div className="space-y-2">
                                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-6 rounded-full bg-cyan-400"></div>
                                            <span className="text-xs font-semibold text-cyan-400">User</span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Hey! Welcome to the metaverse 👋
                                        </p>
                                    </div>
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-6 rounded-full bg-purple-400"></div>
                                            <span className="text-xs font-semibold text-purple-400">
                                                AI Guide
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">Need help? Just ask me!</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl opacity-20 blur-xl animate-pulse"></div>
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl opacity-20 blur-xl animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                            Powerful Features for Modern Teams
                        </h2>
                        <p className="text-xl text-slate-400">
                            Everything you need for remote collaboration in one place
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg hover:shadow-cyan-500/10 transition-all hover:border-cyan-500/50">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4">
                                🗺️
                            </div>
                            <h3 className="text-xl font-bold mb-2">Avatar-Based 2D World</h3>
                            <p className="text-slate-400">
                                Move your avatar through different rooms like Lobby, Networking Lounge, Stage,
                                and Game Rooms. Navigate naturally like in real life.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg hover:shadow-purple-500/10 transition-all hover:border-purple-500/50">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl mb-4">
                                📹
                            </div>
                            <h3 className="text-xl font-bold mb-2">Real-time Audio & Video</h3>
                            <p className="text-slate-400">
                                WebRTC-powered high-quality audio and video calls. See and hear your teammates
                                as you collaborate in real-time.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg hover:shadow-green-500/10 transition-all hover:border-green-500/50">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-4">
                                🔊
                            </div>
                            <h3 className="text-xl font-bold mb-2">Spatial Audio</h3>
                            <p className="text-slate-400">
                                Volume and panning based on avatar proximity. Conversations feel natural with
                                distance-based audio just like in person.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg hover:shadow-yellow-500/10 transition-all hover:border-yellow-500/50">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl mb-4">
                                🤖
                            </div>
                            <h3 className="text-xl font-bold mb-2">AI Chatbot NPCs</h3>
                            <p className="text-slate-400">
                                GPT-powered AI guides and moderators in each room. Get help, information, and
                                assistance from intelligent virtual assistants.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg hover:shadow-red-500/10 transition-all hover:border-red-500/50">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-2xl mb-4">
                                🎮
                            </div>
                            <h3 className="text-xl font-bold mb-2">Mini Multiplayer Games</h3>
                            <p className="text-slate-400">
                                Break the ice with quiz games, puzzles, and board-game style challenges. Team
                                building made fun and engaging.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg hover:shadow-blue-500/10 transition-all hover:border-blue-500/50">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4">
                                🛠️
                            </div>
                            <h3 className="text-xl font-bold mb-2">Admin Tools & Room Editor</h3>
                            <p className="text-slate-400">
                                Drag-and-drop room layouts, role-based permissions, and comprehensive moderation
                                tools. Full control over your metaverse.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
                        <p className="text-xl text-slate-400">Get started in three simple steps</p>
                    </div>

                    <div className="space-y-8">
                        {/* Step 1 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-cyan-500/50">
                                1
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold mb-2">Enter the Lobby</h3>
                                <p className="text-slate-400 text-lg">
                                    Sign in with your account and you'll appear in the virtual lobby. Choose
                                    your avatar and see other users already connected in real-time.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-500/50">
                                2
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold mb-2">Join Rooms</h3>
                                <p className="text-slate-400 text-lg">
                                    Walk into different rooms like the Networking Lounge for casual chats, the
                                    Stage for presentations, or the Game Room for team building activities.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-green-500/50">
                                3
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold mb-2">Talk, Play, Collaborate</h3>
                                <p className="text-slate-400 text-lg">
                                    Start video/audio chats with spatial audio, play mini-games, chat with AI
                                    guide NPCs, and collaborate naturally like you're in the same physical
                                    space.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section id="use-cases" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold mb-4">Perfect For Every Occasion</h2>
                        <p className="text-xl text-slate-400">
                            From conferences to casual hangouts, OrbitHub adapts to your needs
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Use Case 1 */}
                        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-lg">
                            <div className="text-5xl mb-4">🎤</div>
                            <h3 className="text-2xl font-bold mb-3">Virtual Conferences & Meetups</h3>
                            <p className="text-slate-400">
                                Host presentations on the Stage, network in the Lounge, and engage attendees
                                with interactive Q&A powered by spatial audio and video streaming.
                            </p>
                        </div>

                        {/* Use Case 2 */}
                        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-lg">
                            <div className="text-5xl mb-4">💼</div>
                            <h3 className="text-2xl font-bold mb-3">Remote Team Workshops</h3>
                            <p className="text-slate-400">
                                Run brainstorming sessions, team exercises, and collaborative workshops. Use
                                mini-games for icebreakers and AI assistants for facilitation.
                            </p>
                        </div>

                        {/* Use Case 3 */}
                        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-lg">
                            <div className="text-5xl mb-4">🎉</div>
                            <h3 className="text-2xl font-bold mb-3">Networking Lounges & Community Hangouts</h3>
                            <p className="text-slate-400">
                                Create persistent virtual spaces for your community. Members can drop in
                                anytime, chat casually, and build authentic connections.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Teams Section */}
            <section id="for-teams" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-3xl border-2 border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-12 shadow-2xl">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                                Built for Teams & Organizations
                            </h2>
                            <p className="text-xl text-slate-400">
                                Enterprise-ready features that work on any device
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                    ✓
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">Browser-Based, No Installs</h4>
                                    <p className="text-slate-400 text-sm">
                                        Works on low-end devices. Just open your browser – no VR headset, no
                                        heavy downloads, no barriers.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    ✓
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">Role-Based Permissions</h4>
                                    <p className="text-slate-400 text-sm">
                                        Admin, moderator, and participant roles with fine-grained access control
                                        and comprehensive moderation tools.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    ✓
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">Configurable Rooms</h4>
                                    <p className="text-slate-400 text-sm">
                                        Drag-and-drop room editor. Create custom layouts for Stage rooms,
                                        Networking Lounges, Game Rooms, and more.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                    ✓
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">Analytics & Insights</h4>
                                    <p className="text-slate-400 text-sm">
                                        Activity logs, time-lapse replay, and moderation history to understand
                                        engagement and improve experiences.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-5xl sm:text-6xl font-bold mb-6">
                        Ready to enter the 2D Metaverse?
                    </h2>
                    <p className="text-2xl text-slate-400 mb-12">
                        Transform your remote collaboration experience today. No credit card required.
                    </p>
                    <button
                        onClick={handleEnterMetaverse}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-12 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl shadow-cyan-500/50"
                    >
                        Enter Metaverse Now →
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                                OrbitHub
                            </h3>
                            <p className="text-slate-400 text-sm">
                                The future of remote work and virtual collaboration.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>
                                    <a href="#features" className="hover:text-white transition-colors">
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a href="#how-it-works" className="hover:text-white transition-colors">
                                        How It Works
                                    </a>
                                </li>
                                <li>
                                    <a href="#use-cases" className="hover:text-white transition-colors">
                                        Use Cases
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">Resources</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Documentation
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        GitHub
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Support
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Terms of Service
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8">
                        <p className="text-center text-sm text-slate-500">
                            Built with React, WebRTC, Phaser & AI-powered NPCs. © 2025 OrbitHub. All rights
                            reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
