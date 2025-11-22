import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../pages/LoginPage';
import LobbyPage from '../pages/LobbyPage';
import RoomPage from '../pages/RoomPage';
import AdminPage from '../pages/AdminPage';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Root redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Login page - no layout */}
            <Route path="/login" element={<LoginPage />} />

            {/* Lobby page - with layout */}
            <Route
                path="/lobby"
                element={
                    <MainLayout>
                        <LobbyPage />
                    </MainLayout>
                }
            />

            {/* Room page - no layout (full screen game) */}
            <Route path="/room/:roomId" element={<RoomPage />} />

            {/* Admin page - with layout */}
            <Route
                path="/admin"
                element={
                    <MainLayout>
                        <AdminPage />
                    </MainLayout>
                }
            />
        </Routes>
    );
};

export default AppRoutes;
