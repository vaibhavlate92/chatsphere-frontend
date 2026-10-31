import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import { Login, Forgot } from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Payments from './pages/Payments';
import TextChat from './pages/TextChat';
import VideoChat from './pages/VideoChat';

export default function App() {
  return (
    <Routes>
      {/* the video page is full-screen and renders without the navbar */}
      <Route path="/video" element={<ProtectedRoute><VideoChat /></ProtectedRoute>} />
      <Route path="*" element={
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/text" element={<ProtectedRoute><TextChat /></ProtectedRoute>} />
            <Route path="*" element={<div className="container py-5 text-center"><h3>Page not found</h3></div>} />
          </Routes>
        </>
      } />
    </Routes>
  );
}
