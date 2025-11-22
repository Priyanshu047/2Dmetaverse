import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) {
        return null; // Don't show header on login page
    }

    return (
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/lobby" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Metaverse 2D</h1>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="flex items-center gap-6">
                        <Link
                            to="/lobby"
                            className="text-gray-300 hover:text-white transition font-medium"
                        >
                            Lobby
                        </Link>

                        {user?.role === 'admin' && (
                            <Link
                                to="/admin"
                                className="text-gray-300 hover:text-white transition font-medium"
                            >
                                Admin
                            </Link>
                        )}

                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
