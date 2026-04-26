import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';

// User Components
import Sidebar from './components/Sidebar';

// Common Components
import { FullScreenLoader } from './components/common/UIComponents';
import ErrorBoundary from './components/common/ErrorBoundary';

// Judge Components
import JudgeLayout from './components/JudgeLayout';

// Lazy load pages for performance optimization
const FindLawyer = React.lazy(() => import('./pages/FindLawyer'));
const AIAssistant = React.lazy(() => import('./pages/AIAssistant'));
const AIQuestionare = React.lazy(() => import('./pages/AIQuestionare.jsx'));
const AILawyer = React.lazy(() => import('./pages/AILawyer'));
const AILawyerChat = React.lazy(() => import('./pages/AILawyerChat'));
const DocumentGenerator = React.lazy(() => import('./pages/DocumentGenerator'));
const Chatbot = React.lazy(() => import('./pages/Chatbot'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));

// Lawyer Routes
const LawyerRoutes = React.lazy(() => import('./routes/LawyerRoutes'));

// Judge Pages
const JudgeDashboard = React.lazy(() => import('./pages/judge/JudgeDashboard.jsx'));
const PendingCases = React.lazy(() => import('./pages/judge/PendingCases.jsx'));
const JudgeCaseDetails = React.lazy(() => import('./pages/judge/CaseDetails.jsx'));
const Judgments = React.lazy(() => import('./pages/judge/Judgments.jsx'));
const JudgeProfile = React.lazy(() => import('./pages/judge/JudgeProfile.jsx'));
const JudgeChats = React.lazy(() => import('./pages/judge/Chats.jsx'));
const ActiveLearningReview = React.lazy(() => import('./pages/judge/ActiveLearningReview.jsx'));
const JudgeHearings = React.lazy(() => import('./pages/judge/JudgeHearings.jsx'));
const JudgeAuditLog = React.lazy(() => import('./pages/judge/JudgeAuditLog.jsx'));
const VirtualCourtroom = React.lazy(() => import('./pages/judge/VirtualCourtroom.jsx'));

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const VerificationPage = React.lazy(() => import('./pages/VerificationPage'));
const Cases = React.lazy(() => import('./pages/Cases.jsx'));
const CreateCase = React.lazy(() => import('./pages/CreateCase.jsx'));
const CaseDetails = React.lazy(() => import('./pages/CaseDetails.jsx'));
const NotFound = React.lazy(() => import('./pages/NotFound.jsx'));

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
              <React.Suspense fallback={<FullScreenLoader message="Loading page..." />}>
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
                      <Route path="/ai-lawyer" element={<AILawyer />} />
                      <Route path="/ai-lawyer/chat" element={<AILawyerChat />} />
                      <Route path="/ai-lawyer/documents" element={<DocumentGenerator />} />
                      <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
                    </>
                  )}

                  {/* Lawyer Routes */}
                  {userRole === 'lawyer' && (
                    <>
                      <Route path="/lawyer/*" element={<LawyerRoutes mode={mode} setMode={setMode} />} />
                      <Route path="/subscription" element={<SubscriptionPage />} />
                    </>
                  )}

                  {/* Judge Routes */}
                  {userRole === 'judge' && (
                    <>
                    <Route path="/judge/*" element={<JudgeLayout mode={mode} setMode={setMode} />}>                    
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<JudgeDashboard />} />
                      <Route path="chats" element={<JudgeChats />} />
                      <Route path="pending-cases" element={<PendingCases />} />
                      <Route path="case-details/:id" element={<JudgeCaseDetails />} />
                      <Route path="judgments" element={<Judgments />} />
                      <Route path="active-learning" element={<ActiveLearningReview />} />
                      <Route path="hearings" element={<JudgeHearings />} />
                      <Route path="audit" element={<JudgeAuditLog />} />
                      <Route path="virtual-courtroom/:hearingId" element={<VirtualCourtroom />} />
                      <Route path="profile" element={<JudgeProfile />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Route>
                    <Route path="/subscription" element={<SubscriptionPage />} />
                    </>
                  )}

                  {/* 404 for any unmatched route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </React.Suspense>
            </div>
          </>
        ) : (
          <React.Suspense fallback={<FullScreenLoader message="Loading..." />}>
            <Routes>
              <Route path="/" element={<LandingRedirect />} />
              <Route path="/login" element={<LoginPage showNotification={showNotification} />} />
              <Route path="/register" element={<RegisterPage showNotification={showNotification} />} />
              <Route path="/verify" element={<VerificationPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </React.Suspense>
        )}
        
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
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
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
