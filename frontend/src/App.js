import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';

// User Components
import Sidebar from './components/Sidebar';
import FindLawyer from './pages/FindLawyer';
import AIAssistant from './pages/AIAssistant';
import AIQuestionare from './pages/AIQuestionare.jsx'
import Chatbot from './pages/Chatbot';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

// Lawyer Routes
import LawyerRoutes from './routes/LawyerRoutes';

// Judge Components
import JudgeLayout from './components/JudgeLayout';
import JudgeDashboard from './pages/judge/JudgeDashboard.jsx';
import PendingCases from './pages/judge/PendingCases.jsx';
import JudgeCaseDetails from './pages/judge/CaseDetails.jsx';
import Judgments from './pages/judge/Judgments.jsx';
import JudgeProfile from './pages/judge/JudgeProfile.jsx';
import JudgeChats from './pages/judge/Chats.jsx';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Cases from './pages/Cases.jsx';
import CreateCase from './pages/CreateCase.jsx';
import CaseDetails from './pages/CaseDetails.jsx';

// Common Components
import { FullScreenLoader } from './components/common/UIComponents';

function AppContent() {
  const [mode, setMode] = useState(localStorage.getItem('theme') || 'light');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const { isAuthenticated, user, loading } = useAuth(); 

  // One-time JWT cleanup as requested (clears any stale tokens once per browser)
  React.useEffect(() => {
    const alreadyCleared = localStorage.getItem('jwtClearedOnce') === '1';
    if (!alreadyCleared) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      localStorage.setItem('jwtClearedOnce', '1');
    }
  }, []);

  // Helper: basic JWT expiry check (treat malformed as expired)
  const isTokenExpired = (token) => {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return true;
      const json = JSON.parse(atob(payloadBase64));
      if (!json || !json.exp) return false; // if no exp, assume not expired
      return Date.now() >= json.exp * 1000;
    } catch (e) {
      return true;
    }
  };

  // Current token validity
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const tokenIsValid = token ? !isTokenExpired(token) : false;
  const authed = isAuthenticated && tokenIsValid;

  // Save theme preference
  React.useEffect(() => {
    localStorage.setItem('theme', mode);
  }, [mode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9',
          },
          secondary: {
            main: mode === 'light' ? '#dc004e' : '#f48fb1',
          },
          background: { 
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 500,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'light' 
                  ? '0 2px 8px rgba(0,0,0,0.1)' 
                  : '0 2px 8px rgba(0,0,0,0.3)',
              },
            },
          },
        },
      }),
    [mode]
  );

  const userRole = user?.role || 'user';

  // Landing redirect: if user visits root '/', send them to login when no token
  // or to their role-specific home when token exists.
  function LandingRedirect() {
    const token = localStorage.getItem('authToken');
    // Redirect to login when missing or expired/invalid token
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      return <Navigate to="/login" replace />;
    }

    // Use the mapped userRole instead of raw localStorage value
    if (userRole === 'lawyer') return <Navigate to="/lawyer/dashboard" replace />;
    if (userRole === 'judge') return <Navigate to="/judge/dashboard" replace />;
    return <Navigate to="/home" replace />; // default for normal users
  }

  // Show loading screen while checking auth
  if (loading) {
    return <FullScreenLoader message="Loading application..." />;
  }

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const hideNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
  {authed ? (
          <>
            {userRole === 'user' && <Sidebar mode={mode} setMode={setMode} />}

      <div style={{ 
              marginLeft: userRole === 'user' ? 280 : 0, 
              padding: '1rem',
              minHeight: '100vh',
              backgroundColor: theme.palette.background.default 
            }}>
              <Routes>
                {/* User Routes */}
                {userRole === 'user' && (
                  <>
        <Route path="/home" element={<FindLawyer />} />
                    <Route path="/ai-assistant" element={<AIAssistant />} />
                    <Route path="/chatbot" element={<Chatbot />} />
                    <Route path="/cases" element={<Cases />} />
                    <Route path="/cases/create" element={<CreateCase />} />
                    <Route path="/cases/:id" element={<CaseDetails />} />
                    <Route path="/my-profile" element={<ProfilePage />} />
                    <Route path="/chats" element={<ChatPage />} />
                    <Route path="/ai-chat" element={<AIQuestionare />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
                  </>
                )}

                {/* Lawyer Routes */}
                {userRole === 'lawyer' && (
                  <Route path="/lawyer/*" element={<LawyerRoutes mode={mode} setMode={setMode} />} />
                )}

                {/* Judge Routes */}
                {userRole === 'judge' && (
                  <Route path="/judge/*" element={<JudgeLayout mode={mode} setMode={setMode} />}>                    
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<JudgeDashboard />} />
                    <Route path="chats" element={<JudgeChats />} />
                    <Route path="pending-cases" element={<PendingCases />} />
                    <Route path="case-details/:id" element={<JudgeCaseDetails />} />
                    <Route path="judgments" element={<Judgments />} />
                    <Route path="profile" element={<JudgeProfile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Route>
                )}

                {/* Redirect based on role for any unmatched route */}
                <Route path="*" element={
                  <Navigate to={
                    userRole === 'lawyer' ? '/lawyer/dashboard' :
                    userRole === 'judge' ? '/judge/dashboard' : '/home'
                  } replace />
                } />
              </Routes>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/" element={<LandingRedirect />} />
            <Route path="/login" element={<LoginPage showNotification={showNotification} />} />
            <Route path="/register" element={<RegisterPage showNotification={showNotification} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}

        {/* Global Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={5000}
          onClose={hideNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={hideNotification} severity={notification.severity}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Router>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
