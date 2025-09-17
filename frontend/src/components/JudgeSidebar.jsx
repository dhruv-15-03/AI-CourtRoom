"use client"

import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Divider } from "@mui/material"
import GavelIcon from "@mui/icons-material/Gavel"
import DashboardIcon from "@mui/icons-material/Dashboard"
import AssignmentIcon from "@mui/icons-material/Assignment"
import HistoryIcon from "@mui/icons-material/History"
import PersonIcon from "@mui/icons-material/Person"
import Brightness4Icon from "@mui/icons-material/Brightness4"
import ChatIcon from "@mui/icons-material/Chat"
import { useNavigate, useLocation } from "react-router-dom"

export default function JudgeSidebar({ mode, setMode, variant = "permanent", open, onClose, drawerWidth = 280, sx = {} }) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { path: "/judge/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { path: "/judge/pending-cases", label: "Pending Cases", icon: <AssignmentIcon /> },
    { path: "/judge/chats", label: "Chats", icon: <ChatIcon /> },
    { path: "/judge/judgments", label: "Judgments", icon: <HistoryIcon /> },
    { path: "/judge/profile", label: "Profile", icon: <PersonIcon /> },
  ]

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: drawerWidth,
        display: sx.display,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          background:
            mode === "light"
              ? "linear-gradient(180deg, #1e3a8a 0%, #1e40af 30%, #3b82f6 100%)"
              : "linear-gradient(180deg, #0f172a 0%, #1e293b 30%, #334155 100%)",
          color: "white",
          borderRight: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fillRule="evenodd"%3E%3Cg fill="%23ffffff" fillOpacity="0.03"%3E%3Cpath d="M30 30c0-8.284-6.716-15-15-15s-15 6.716-15 15 6.716 15 15 15 15-6.716 15-15zm15 0c0-8.284-6.716-15-15-15s-15 6.716-15 15 6.716 15 15 15 15-6.716 15-15z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.6,
          },
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          mb: 2,
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 70,
            height: 70,
            borderRadius: "50%",
            bgcolor: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            backdropFilter: "blur(10px)",
            mb: 2,
            border: "3px solid rgba(255,255,255,0.3)",
            boxShadow: "0 8px 24px rgba(251, 191, 36, 0.3)",
          }}
        >
          <GavelIcon sx={{ fontSize: 32, color: "#1e3a8a" }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)", letterSpacing: "1px", fontFamily: "'Playfair Display', serif" }}>
          Court Panel
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 400, letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "0.75rem" }}>
          Judiciary Workspace
        </Typography>
      </Box>

      <List sx={{ pt: 1, px: 2, position: "relative", zIndex: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              mb: 1.5,
              borderRadius: 3,
              minHeight: 56,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255,255,255,0.08)",
                transform: "translateX(-100%)",
                transition: "transform 0.3s ease",
              },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.12)",
                transform: "translateX(6px)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                "&::before": { transform: "translateX(0)" },
              },
              "&.Mui-selected": {
                backgroundColor: "rgba(251, 191, 36, 0.15)",
                boxShadow: "0 6px 20px rgba(251, 191, 36, 0.2)",
                transform: "translateX(8px)",
                border: "1px solid rgba(251, 191, 36, 0.3)",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 4,
                  height: 32,
                  backgroundColor: "#fbbf24",
                  borderRadius: "0 4px 4px 0",
                  boxShadow: "0 0 8px rgba(251, 191, 36, 0.5)",
                },
                "&:hover": {
                  backgroundColor: "rgba(251, 191, 36, 0.2)",
                  transform: "translateX(8px)",
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? "#fbbf24" : "white", minWidth: 48, transition: "all 0.3s ease" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 2, bgcolor: location.pathname === item.path ? "rgba(251, 191, 36, 0.2)" : "transparent", transition: "all 0.3s ease", border: location.pathname === item.path ? "1px solid rgba(251, 191, 36, 0.3)" : "none" }}>
                {item.icon}
              </Box>
            </ListItemIcon>
            <ListItemText primary={item.label} sx={{ "& .MuiListItemText-primary": { fontSize: "0.95rem", fontWeight: location.pathname === item.path ? 600 : 400, letterSpacing: "0.3px", transition: "all 0.3s ease", color: location.pathname === item.path ? "#fbbf24" : "white" } }} />
          </ListItemButton>
        ))}

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.2)", "&::before, &::after": { borderColor: "rgba(255,255,255,0.2)" } }} />

        <ListItemButton
          onClick={() => setMode(mode === "light" ? "dark" : "light")}
          sx={{ borderRadius: 3, minHeight: 56, position: "relative", overflow: "hidden", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", "&:hover": { backgroundColor: "rgba(255,255,255,0.12)", transform: "translateX(6px)", boxShadow: "0 6px 20px rgba(0,0,0,0.2)" } }}
        >
          <ListItemIcon sx={{ color: "white", minWidth: 48 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(255,255,255,0.08)", transition: "all 0.3s ease" }}>
              <Brightness4Icon />
            </Box>
          </ListItemIcon>
          <ListItemText primary={mode === "light" ? "Dark Mode" : "Light Mode"} sx={{ "& .MuiListItemText-primary": { fontSize: "0.95rem", fontWeight: 400, letterSpacing: "0.3px" } }} />
        </ListItemButton>
      </List>

      <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.15)", background: "linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%)" }}>
        <Typography variant="caption" sx={{ color: mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.8)", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.5px" }}>
          © 2025 AI-Court Platform
        </Typography>
        <Typography variant="caption" sx={{ color: mode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.6)", fontSize: "0.65rem", display: "block", mt: 0.5 }}>
          Judicial Excellence
        </Typography>
      </Box>
    </Drawer>
  )
}
