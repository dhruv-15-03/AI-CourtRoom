import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const drawerWidth = 240;
const links = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: 'dashboard' },
  { text: 'Pending Cases', icon: <AssignmentIcon />, path: 'pending-cases' },
  { text: 'Judgments', icon: <HistoryIcon />, path: 'judgments' },
  { text: 'Profile', icon: <PersonIcon />, path: 'profile' },
];

export default function JudgeLayout({ mode, setMode }) {
  const theme = useTheme();
  const location = useLocation();

  const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light');

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}
      >
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <GavelIcon fontSize="large" />
          <Typography variant="h6">Judge Panel</Typography>
        </Box>
        <List>
          {links.map((link) => {
            const to = `/judge/${link.path}`;
            return (
              <ListItem key={link.text} disablePadding>
                <ListItemButton
                  component={Link}
                  to={to}
                  selected={location.pathname === to}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    {link.icon}
                  </ListItemIcon>
                  <ListItemText primary={link.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ mt: 'auto', textAlign: 'center', pb: 2 }}>
          <Typography variant="body2">Theme</Typography>
          <IconButton onClick={toggleMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
