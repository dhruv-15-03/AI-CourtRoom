import React, { memo, useState, useCallback } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import LawyerSidebar from './LawyerSidebar';

const drawerWidth = 280;

const LawyerLayout = memo(function LawyerLayout({ mode, setMode, children }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = useCallback(() => setMobileOpen((prev) => !prev), []);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top App Bar to match user look on narrow screens */}
      <AppBar
        position="fixed"
        color="primary"
        elevation={isMdUp ? 0 : 2}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          display: { md: 'none', xs: 'block' },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Lawyer Panel
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="lawyer navigation">
        <LawyerSidebar
          mode={mode}
          setMode={setMode}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          drawerWidth={drawerWidth}
          sx={{ display: { xs: 'block', md: 'none' } }}
        />
        {/* Desktop Persistent Drawer */}
        <LawyerSidebar
          mode={mode}
          setMode={setMode}
          variant="permanent"
          open
          drawerWidth={drawerWidth}
          sx={{ display: { xs: 'none', md: 'block' } }}
        />
      </Box>

      {/* Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          pt: { xs: 8, md: 3 },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        {children ?? <Outlet />}
      </Box>
    </Box>
  );
});

export default LawyerLayout;