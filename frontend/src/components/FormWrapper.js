import React from 'react';
import { Card, useTheme } from '@mui/material';

const FormWrapper = ({ children }) => {
  const theme = useTheme();

  const borderStyle =
    theme.palette.mode === 'dark'
      ? {
          border: '2px solid',
          borderImage: 'linear-gradient(135deg, #9c27b0, #ce93d8) 1',
          boxShadow: '0 0 12px rgba(156, 39, 176, 0.7)',
        }
      : {
          border: '2px solid',
          borderImage: 'linear-gradient(135deg, #81d4fa, #b2ebf2) 1',
          boxShadow: '0 0 8px rgba(129, 212, 250, 0.4)',
        };

  return (
    <Card
      sx={{
        ...borderStyle,
        borderRadius: '20px',
        maxWidth: 500,
        mx: 'auto',
        my: 4,
        p: 3,
        backdropFilter: 'blur(10px)',
        background: theme.palette.mode === 'dark' ? '#1e1e2f' : '#fff',
      }}
    >
      {children}
    </Card>
  );
};

export default FormWrapper;
