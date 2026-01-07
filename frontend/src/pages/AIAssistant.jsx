
import { useState, useEffect } from "react"
import {
  Card,
  Typography,
  Button,
  Box,
  useTheme,
  alpha,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material"
import { Psychology, Chat, AutoAwesome } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { userService } from "../services/api"

export default function AIAssistant() {
  const theme = useTheme()
  const [attemptsLeft, setAttemptsLeft] = useState(0)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userService.getProfile()
        setAttemptsLeft(response.data.freeTrialAttempts !== undefined ? response.data.freeTrialAttempts : 0)
      } catch (error) {
        console.error("Error fetching profile:", error)
        setError("Failed to load profile data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleStart = async () => {
    if (attemptsLeft > 0) {
      setActionLoading(true)
      try {
        const response = await userService.decrementAttempts()
        if (response.data.success) {
            setAttemptsLeft(response.data.attemptsLeft)
            navigate("/ai-chat")
        }
      } catch (error) {
        console.error("Error decrementing attempts:", error)
        setError("Failed to start consultation. Please try again.")
      } finally {
        setActionLoading(false)
      }
    } else {
        setError("You have exhausted your free trial attempts.")
    }
  }

  const handleCloseError = () => {
    setError(null)
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 600, margin: "0 auto", mt: 4, px: 2 }}>
      <Card
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${alpha("#1e3a8a", 0.05)} 0%, ${alpha("#d97706", 0.05)} 100%)`,
          border: `1px solid ${alpha("#1e3a8a", 0.1)}`,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`,
            color: "white",
            p: 4,
            textAlign: "center",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fillRule="evenodd"%3E%3Cg fill="%23ffffff" fillOpacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat',
              opacity: 0.1,
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Psychology sx={{ fontSize: 48, mb: 2, color: "#d97706" }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontFamily: "serif" }}>
              AI Legal Assistant
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Get Instant Legal Guidance & Case Analysis
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                backgroundColor: alpha("#d97706", 0.1),
                borderRadius: 2,
                border: `1px solid ${alpha("#d97706", 0.2)}`,
                mb: 3,
              }}
            >
              <AutoAwesome sx={{ color: "#d97706", fontSize: 24 }} />
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1e3a8a",
                  fontWeight: 600,
                  fontFamily: "serif",
                }}
              >
                Free Consultations Remaining
              </Typography>
              <Chip
                label={attemptsLeft}
                sx={{
                  backgroundColor: "#d97706",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  minWidth: 40,
                  height: 32,
                }}
              />
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
                mb: 4,
                fontSize: "1.1rem",
                lineHeight: 1.6,
                maxWidth: 400,
                mx: "auto",
              }}
            >
              Get personalized legal advice powered by advanced AI. Ask questions about your case, understand legal
              procedures, and receive expert guidance.
            </Typography>

            <Button
              variant="contained"
              onClick={handleStart}
              disabled={attemptsLeft === 0 || actionLoading}
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <Chat />}
              sx={{
                background:
                  attemptsLeft > 0 ? `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)` : alpha("#64748b", 0.3),
                color: "white",
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                boxShadow: attemptsLeft > 0 ? `0 4px 12px ${alpha("#1e3a8a", 0.3)}` : "none",
                "&:hover":
                  attemptsLeft > 0
                    ? {
                        background: `linear-gradient(135deg, #1e40af 0%, #2563eb 100%)`,
                        transform: "translateY(-2px)",
                        boxShadow: `0 6px 20px ${alpha("#1e3a8a", 0.4)}`,
                      }
                    : {},
                "&:disabled": {
                  color: alpha("#ffffff", 0.7),
                  transform: "none",
                },
                transition: "all 0.3s ease",
                mb: 2,
              }}
            >
              {actionLoading ? "Starting..." : "Start Legal Consultation"}
            </Button>

            {attemptsLeft === 0 && (
              <Box
                sx={{
                  p: 3,
                  backgroundColor: alpha("#ef4444", 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha("#ef4444", 0.2)}`,
                  mt: 3,
                }}
              >
                <Typography
                  sx={{
                    color: "#ef4444",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                >
                  You have used all free consultations. Please subscribe for unlimited access to our AI legal assistant.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Card>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}
