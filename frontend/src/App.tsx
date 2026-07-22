import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeLanguageProvider } from './context/ThemeLanguageContext';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { PositionsPage } from './pages/PositionsPage';
import { PositionDetailPage } from './pages/PositionDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { CVDetailPage } from './pages/CVDetailPage';
import { AttributeLibraryPage } from './pages/AttributeLibraryPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeLanguageProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/positions" element={<PositionsPage />} />
                <Route path="/positions/:id" element={<PositionDetailPage />} />
                <Route
                  path="/profile/:id"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/cv/:id" element={<CVDetailPage />} />
                <Route
                  path="/attributes"
                  element={
                    <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                      <AttributeLibraryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Routes>
            </main>

            <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>© 2026 Recroot CV Management System. All rights reserved.</div>
                <div className="font-mono text-[11px]">Relational Attribute Library • Dynamic Template Binding • Optimistic Locking</div>
              </div>
            </footer>
          </div>
        </Router>
      </ThemeLanguageProvider>
    </AuthProvider>
  );
};

export default App;
