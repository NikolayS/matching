import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { MatchingPage } from './pages/MatchingPage';
import { MatchProfilePage } from './pages/MatchProfilePage';
import { NotificationTestPage } from './pages/NotificationTestPage';
import { SupabaseTest } from './SupabaseTest';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  color: white;
  font-size: 18px;
`;

// Route guard component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <LoadingContainer>
        Loading...
      </LoadingContainer>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Public route component (redirects authenticated users)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <LoadingContainer>
        Loading...
      </LoadingContainer>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
};

// Profile setup guard (redirects if profile is already completed)
const ProfileSetupRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, profile, loading } = useAuth();

  if (loading) {
    return (
      <LoadingContainer>
        Loading...
      </LoadingContainer>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If profile is completed, redirect to matching
  if (user?.profile_completed && profile) {
    return <Navigate to="/matching" replace />;
  }

  return <>{children}</>;
};

// Matching route guard (requires completed profile)
const MatchingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, profile, loading } = useAuth();

  if (loading) {
    return (
      <LoadingContainer>
        Loading...
      </LoadingContainer>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If profile is not completed, redirect to profile setup
  if (!user?.profile_completed || !profile) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } 
      />
      
      {/* Profile setup route */}
      <Route 
        path="/profile-setup" 
        element={
          <ProfileSetupRoute>
            <ProfileSetupPage />
          </ProfileSetupRoute>
        } 
      />
      
      {/* Protected routes requiring completed profile */}
      <Route 
        path="/matching" 
        element={
          <MatchingRoute>
            <MatchingPage />
          </MatchingRoute>
        } 
      />
      <Route 
        path="/match/:id" 
        element={
          <MatchingRoute>
            <MatchProfilePage />
          </MatchingRoute>
        } 
      />
      
      {/* Development/test routes */}
      <Route 
        path="/test" 
        element={
          <ProtectedRoute>
            <SupabaseTest />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/test-notifications" 
        element={<NotificationTestPage />} 
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContainer>
        <Router>
          <AppRoutes />
        </Router>
      </AppContainer>
    </AuthProvider>
  );
}

export default App;
