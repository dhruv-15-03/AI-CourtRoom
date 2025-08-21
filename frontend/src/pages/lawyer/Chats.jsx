import React from 'react';
import LawyerLayout from '../../components/LawyerLayout';
import ChatInterface from '../../components/ChatInterface';
import { Box, Typography } from '@mui/material';

export default function Chats({ mode, setMode }) { 
  return (
    <LawyerLayout mode={mode} setMode={setMode}>
      <Box sx={{ height: 'calc(100vh - 100px)', p: 2 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Client Messages
        </Typography>
        <ChatInterface userRole="lawyer" />
      </Box>
    </LawyerLayout>
  ); 
}