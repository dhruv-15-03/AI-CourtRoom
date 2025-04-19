import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ForumIcon from '@mui/icons-material/Forum';
import ChatIcon from '@mui/icons-material/Chat'; 
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ mode, setMode }) {
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
      }}
    >
      <List>
        <ListItemButton onClick={() => navigate('/')}> 
          <ListItemIcon><GavelIcon /></ListItemIcon>
          <ListItemText primary="Find a Lawyer" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/ai-assistant')}>
          <ListItemIcon><SmartToyIcon /></ListItemIcon>
          <ListItemText primary="AI Assistant" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/chatbot')}>
          <ListItemIcon><ForumIcon /></ListItemIcon>
          <ListItemText primary="Legal Chatbot" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/my-profile')}>
          <ListItemIcon><AccountCircleIcon /></ListItemIcon>
          <ListItemText primary="My Profile" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/chats')}> 
          <ListItemIcon><ChatIcon /></ListItemIcon>
          <ListItemText primary="Chats" />
        </ListItemButton>
        <ListItemButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
          <ListItemIcon><Brightness4Icon /></ListItemIcon>
          <ListItemText primary={mode === 'light' ? 'Dark Mode' : 'Light Mode'} />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
