import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { AdminRoute } from './components/routes/AdminRoute';
import { Navbar } from './components/common/Navbar';
import { AuthPage } from './components/auth/AuthPage';
import { SessionsPage } from './components/sessions/SessionsPage';
import { MyBookingsPage } from './components/bookings/MyBookingsPage';
import { AdminPage } from './components/admin/AdminPage';

// Default redirect based on auth status
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/sessions" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
            <Routes>
              {/* Public Auth Route */}
              <Route path="/login" element={<AuthPage />} />

              {/* Protected Member Routes */}
              <Route
                path="/sessions"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main className="flex-1 pb-16">
                      <SessionsPage />
                    </main>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main className="flex-1 pb-16">
                      <MyBookingsPage />
                    </main>
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Route */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Navbar />
                    <main className="flex-1 pb-16">
                      <AdminPage />
                    </main>
                  </AdminRoute>
                }
              />

              {/* Fallback routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
