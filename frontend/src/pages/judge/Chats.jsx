import React from 'react';
import ChatInterface from '../../components/ChatInterface';
import { Box, Typography } from '@mui/material';

export default function JudgeChats({ mode, setMode }) { 
  return (
    <Box sx={{ height: 'calc(100vh - 100px)', p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Court Communications
      </Typography>
      <ChatInterface userRole="judge" />
    </Box>
  ); 
}
