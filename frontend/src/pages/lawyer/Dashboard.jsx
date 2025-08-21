"use client"

import React from "react"
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  IconButton,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material"
import LawyerLayout from "../../components/LawyerLayout"
import Brightness4Icon from "@mui/icons-material/Brightness4"
import Brightness7Icon from "@mui/icons-material/Brightness7"
import GavelIcon from "@mui/icons-material/Gavel"
import ChatIcon from "@mui/icons-material/Chat"
import HistoryIcon from "@mui/icons-material/History"
import TrendingUpIcon from "@mui/icons-material/TrendingUp"
import AssignmentIcon from "@mui/icons-material/Assignment"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import PendingIcon from "@mui/icons-material/Pending"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@mui/material/styles"
import { useLawyerDashboard } from "../../hooks/useLawyerData"

export default function Dashboard({ mode, setMode }) {
  const navigate = useNavigate()
  const theme = useTheme()
  const { dashboardData, loading, error, refetch } = useLawyerDashboard()

  if (loading) {
    return (
      <LawyerLayout mode={mode} setMode={setMode}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </LawyerLayout>
    )
  }

  if (error) {
    return (
      <LawyerLayout mode={mode} setMode={setMode}>
        <Alert severity="error" action={
          <IconButton onClick={refetch} size="small">
            <TrendingUpIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </LawyerLayout>
    )
  }

  const dashboardCards = [
    {
      title: "Total Requests",
      value: dashboardData.totalRequests?.toString() || "0",
      subtitle: `${dashboardData.newRequestsThisWeek || 0} new this week`,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: "#1e3a8a",
      bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
      onClick: () => navigate("/lawyer/case-requests"),
      progress: Math.min((dashboardData.totalRequests || 0) * 15, 100),
    },
    {
      title: "Accepted Cases",
      value: dashboardData.acceptedCases?.toString() || "0",
      subtitle: "Active cases",
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: "#059669",
      bgGradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
      onClick: () => navigate("/lawyer/cases"),
      progress: Math.min((dashboardData.acceptedCases || 0) * 20, 100),
    },
    {
      title: "Active Chats",
      value: dashboardData.activeChats?.toString() || "0",
      subtitle: `${dashboardData.unreadMessages || 0} unread message${dashboardData.unreadMessages !== 1 ? 's' : ''}`,
      icon: <ChatIcon sx={{ fontSize: 40 }} />,
      color: "#d97706",
      bgGradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
      onClick: () => navigate("/lawyer/chats"),
      progress: Math.min((dashboardData.activeChats || 0) * 20, 100),
    },
    {
      title: "Past Cases",
      value: dashboardData.pastCases?.toString() || "0",
      subtitle: "Completed successfully",
      icon: <HistoryIcon sx={{ fontSize: 40 }} />,
      color: "#7c3aed",
      bgGradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
      onClick: () => navigate("/lawyer/cases"),
      progress: Math.min((dashboardData.pastCases || 0) * 10, 100),
    },
  ]

  return (
    <LawyerLayout mode={mode} setMode={setMode}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          p: 3,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)"
              : "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          borderRadius: 3,
          color: "white",
          boxShadow: "0 8px 32px rgba(30, 58, 138, 0.3)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.2)",
              width: 56,
              height: 56,
              backdropFilter: "blur(10px)",
            }}
          >
            <GavelIcon sx={{ fontSize: 28, color: "#fbbf24" }} />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(45deg, #ffffff 30%, #fbbf24 90%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              Lawyer Dashboard
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                opacity: 0.9,
                fontWeight: 500,
              }}
            >
              Welcome back, manage your legal practice efficiently
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={() => setMode(mode === "light" ? "dark" : "light")}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.2)",
              transform: "scale(1.05)",
            },
            transition: "all 0.3s ease",
          }}
        >
          {mode === "light" ? (
            <Brightness4Icon sx={{ color: "#fbbf24" }} />
          ) : (
            <Brightness7Icon sx={{ color: "#fbbf24" }} />
          )}
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              onClick={card.onClick}
              sx={{
                cursor: card.onClick ? "pointer" : "default",
                height: "100%",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                border: `1px solid ${theme.palette.mode === "dark" ? "#334155" : "#e2e8f0"}`,
                borderRadius: 3,
                boxShadow:
                  theme.palette.mode === "dark" ? "0 8px 32px rgba(0, 0, 0, 0.3)" : "0 8px 32px rgba(30, 58, 138, 0.1)",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                "&:hover": card.onClick
                  ? {
                      transform: "translateY(-4px)",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 12px 40px rgba(0, 0, 0, 0.4)"
                          : "0 12px 40px rgba(30, 58, 138, 0.2)",
                      "&::before": {
                        opacity: 1,
                      },
                    }
                  : {},
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: card.bgGradient,
                  opacity: card.onClick ? 0.7 : 1,
                  transition: "opacity 0.3s ease",
                },
              }}
            >
              <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        color: card.color,
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      {card.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: "0.875rem",
                      }}
                    >
                      {card.subtitle}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${card.color}15`,
                      width: 64,
                      height: 64,
                      ml: 2,
                    }}
                  >
                    {React.cloneElement(card.icon, {
                      sx: { ...card.icon.props.sx, color: card.color },
                    })}
                  </Avatar>
                </Box>

                <Box sx={{ mt: "auto" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                      }}
                    >
                      Progress
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: card.color,
                        fontWeight: 600,
                      }}
                    >
                      {card.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={card.progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: theme.palette.mode === "dark" ? "#374151" : "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        background: card.bgGradient,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Card
          sx={{
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            border: `1px solid ${theme.palette.mode === "dark" ? "#334155" : "#e2e8f0"}`,
            borderRadius: 3,
            boxShadow:
              theme.palette.mode === "dark" ? "0 8px 32px rgba(0, 0, 0, 0.3)" : "0 8px 32px rgba(30, 58, 138, 0.1)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: "#1e3a8a",
                  width: 48,
                  height: 48,
                }}
              >
                <TrendingUpIcon sx={{ color: "#fbbf24" }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                >
                  Practice Overview
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                  }}
                >
                  Your legal practice performance summary
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3, borderColor: theme.palette.mode === "dark" ? "#374151" : "#e5e7eb" }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Chip
                    label="Active"
                    icon={<PendingIcon />}
                    sx={{
                      bgcolor: "#fef3c7",
                      color: "#92400e",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Current workload status
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Chip
                    label={`${Math.round(dashboardData.successRate || 85)}% Success Rate`}
                    icon={<CheckCircleIcon />}
                    sx={{
                      bgcolor: "#d1fae5",
                      color: "#065f46",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Case success percentage
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Chip
                    label={`${dashboardData.totalCasesHandled || 0} Cases Handled`}
                    icon={<GavelIcon />}
                    sx={{
                      bgcolor: "#dbeafe",
                      color: "#1e40af",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Total cases in career
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </LawyerLayout>
  )
}
