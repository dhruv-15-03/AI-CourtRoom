import React from 'react';
import { Typography, Card, CardContent, Grid, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import LawyerLayout from '../../components/LawyerLayout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { useNavigate } from 'react-router-dom';


export default function Dashboard({mode,setMode}) {
    const navigate=useNavigate();
  return (
    <LawyerLayout  mode={mode} setMode={setMode}>
      <Typography variant="h4" gutterBottom>Lawyer Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card onClick={() => navigate('/lawyer/case-requests')} sx={{cursor:'pointer'}}><CardContent><Typography>Total Requests: 5</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent><Typography>Accepted Cases: 2</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card onClick={() => navigate('/lawyer/chats')} sx={{cursor:'pointer'}}><CardContent><Typography>Chats: 3</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card onClick={() => navigate('/lawyer/cases')} sx={{cursor:'pointer'}} ><CardContent><Typography>Past Cases: 4</Typography></CardContent></Card>
        </Grid>
        <ListItemButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
          <ListItemIcon><Brightness4Icon /></ListItemIcon>
          <ListItemText primary={mode === 'light' ? 'Dark Mode' : 'Light Mode'} />
        </ListItemButton>
      </Grid>
    </LawyerLayout>
  );
}