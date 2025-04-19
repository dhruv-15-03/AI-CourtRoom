import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HistoryIcon from '@mui/icons-material/History';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';


export default function LawyerSidebar({ mode , setMode }) {
  const navigate = useNavigate();
  return (
    <Drawer variant="permanent" sx={{ width: 240, [`& .MuiDrawer-paper`]: { width: 240 } }}>
      <List>
        <ListItemButton onClick={() => navigate('/dashboard')}> <ListItemIcon><HomeIcon/></ListItemIcon><ListItemText primary="Home"/></ListItemButton>
        <ListItemButton onClick={() => navigate('/lawyer/profile')}><ListItemIcon><AccountCircleIcon/></ListItemIcon><ListItemText primary="My Profile"/></ListItemButton>
        <ListItemButton onClick={() => navigate('/lawyer/case-requests')}><ListItemIcon><ListAltIcon/></ListItemIcon><ListItemText primary="Case Requests"/></ListItemButton>
        <ListItemButton onClick={() => navigate('/lawyer/cases')}><ListItemIcon><HistoryIcon/></ListItemIcon><ListItemText primary="My Cases"/></ListItemButton>
        <ListItemButton onClick={() => navigate('/lawyer/chats')}><ListItemIcon><ChatIcon/></ListItemIcon><ListItemText primary="Chats"/></ListItemButton>
        {/* <ListItemButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
          <ListItemIcon><Brightness4Icon /></ListItemIcon>
          <ListItemText primary={mode === 'light' ? 'Dark Mode' : 'Light Mode'} />
        </ListItemButton> */}
      </List>
    </Drawer>
  );
}