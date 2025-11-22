import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import RoomsListPage from './pages/RoomsListPage';
import StageRoomPage from './pages/StageRoomPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';
import LandingPage from './pages/LandingPage';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/lobby" element={<Navigate to="/rooms" replace />} />
                <Route path="/rooms" element={<RoomsListPage />} />
                <Route path="/rooms/:roomId" element={<RoomPage />} />
                <Route path="/stage/:roomId" element={<StageRoomPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
