import React from 'react';
import { Box, Typography } from '@mui/material';
import ChatInterface from '../components/ChatInterface';
import { useAuth } from '../contexts/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Messages
      </Typography>
      <ChatInterface userRole={userRole} />
    </Box>
  );
}
