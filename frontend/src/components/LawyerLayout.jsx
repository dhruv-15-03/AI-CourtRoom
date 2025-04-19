import React from 'react';
import { Box } from '@mui/material';
import LawyerSidebar from './LawyerSidebar';

export default function LawyerLayout({mode,setMode, children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <LawyerSidebar mode={mode} setMode={setMode}/>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}