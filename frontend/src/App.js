import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// User Components
import Sidebar from './components/Sidebar';
import FindLawyer from './pages/FindLawyer';
import AIAssistant from './pages/AIAssistant';
import Chatbot from './pages/Chatbot';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

// Lawyer Routes
import LawyerRoutes from './routes/LawyerRoutes';

// Judge Components
import JudgeLayout from './components/JudgeLayout';
import JudgeDashboard from './pages/judge/JudgeDashboard.jsx';
import PendingCases from './pages/judge/PendingCases.jsx';
import CaseDetails from './pages/judge/CaseDetails.jsx';
import Judgments from './pages/judge/Judgments.jsx';
import JudgeProfile from './pages/judge/JudgeProfile.jsx';

// Auth Components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  const [mode, setMode] = useState('light');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userRole, setUserRole] = useState('user'); 

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          background: { default: mode === 'light' ? '#f4f6f8' : '#121212' },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {isLoggedIn ? (
          <>
            {userRole === 'user' && <Sidebar mode={mode} setMode={setMode} />}

            <div style={{ marginLeft: userRole === 'user' ? 240 : 0, padding: '1rem' }}>
              <Routes>
                {}
                {userRole === 'user' && (
                  <>
                    <Route path="/" element={<FindLawyer />} />
                    <Route path="/ai-assistant" element={<AIAssistant />} />
                    <Route path="/chatbot" element={<Chatbot />} />
                    <Route path="/my-profile" element={<ProfilePage />} />
                    <Route path="/chats" element={<ChatPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}

                {}
                {userRole === 'lawyer' && (
                  <Route path="/lawyer/*" element={<LawyerRoutes mode={mode} setMode={setMode} />} />
                )}

                {}
                {userRole === 'judge' && (
                  <Route path="/judge/*" element={<JudgeLayout mode={mode} setMode={setMode} />}>                    
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<JudgeDashboard />} />
                    <Route path="pending-cases" element={<PendingCases />} />
                    <Route path="case-details/:id" element={<CaseDetails />} />
                    <Route path="judgments" element={<Judgments />} />
                    <Route path="profile" element={<JudgeProfile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Route>
                )}
              </Routes>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </Router>
    </ThemeProvider>
  );
}
