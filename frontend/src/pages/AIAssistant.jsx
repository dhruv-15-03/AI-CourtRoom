
import { useState } from "react"
import {
  Card,
  Typography,
  Button,
  TextField,
  Modal,
  Box,
  List,
  ListItem,
  useTheme,
  alpha,
  Chip,
  Avatar,
  IconButton,
  Divider,
} from "@mui/material"
import { Psychology, Chat, Send, Close, AutoAwesome, AccountCircle, SmartToy } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "800px",
  maxHeight: "85vh",
  bgcolor: "background.paper",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  borderRadius: 3,
  overflow: "hidden",
  border: "1px solid",
  borderColor: "divider",
}

export default function AIAssistant() {
  const theme = useTheme()
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [conversation, setConversation] = useState([])
  const navigate = useNavigate()
  const [input, setInput] = useState("")
  const [open, setOpen] = useState(false)

  const handleStart = () => {
    navigate("/ai-chat")
    // if (attemptsLeft > 0) {
    //   setAttemptsLeft(attemptsLeft - 1);

    //   setOpen(true);
    // }
  }

  const handleSend = () => {
    if (input.trim()) {
      setConversation((prev) => [
        ...prev,
        { sender: "user", text: input },
        { sender: "ai", text: "Dummy AI response for: " + input },
      ])
      setInput("")
    }
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
              disabled={attemptsLeft === 0}
              startIcon={<Chat />}
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
              Start Legal Consultation
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

        <Modal open={open} onClose={() => {}}>
          <Box sx={modalStyle}>
            {/* Modal Header */}
            <Box
              sx={{
                background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`,
                color: "white",
                p: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <SmartToy sx={{ fontSize: 32, color: "#d97706" }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: "serif" }}>
                    AI Legal Assistant
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Live Case Consultation
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setOpen(false)}
                sx={{
                  color: "white",
                  "&:hover": { backgroundColor: alpha("#ffffff", 0.1) },
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Chat Messages */}
            <Box sx={{ height: "400px", overflowY: "auto", p: 2, backgroundColor: theme.palette.background.default }}>
              {conversation.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <SmartToy sx={{ fontSize: 64, color: alpha("#1e3a8a", 0.3), mb: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
                      mb: 1,
                    }}
                  >
                    Welcome to AI Legal Assistant
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#64748b" : "#9ca3af",
                    }}
                  >
                    Ask me anything about your legal case
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {conversation.map((msg, idx) => (
                    <ListItem
                      key={idx}
                      sx={{
                        display: "flex",
                        justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                        px: 0,
                        py: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                          maxWidth: "75%",
                          flexDirection: msg.sender === "user" ? "row-reverse" : "row",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: msg.sender === "user" ? "#1e3a8a" : "#d97706",
                            fontSize: "0.875rem",
                          }}
                        >
                          {msg.sender === "user" ? <AccountCircle /> : <SmartToy />}
                        </Avatar>
                        <Box
                          sx={{
                            backgroundColor:
                              msg.sender === "user" ? "#1e3a8a" : theme.palette.mode === "dark" ? "#374151" : "#f3f4f6",
                            color:
                              msg.sender === "user" ? "white" : theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                            p: 2,
                            borderRadius: 2,
                            fontSize: "0.95rem",
                            lineHeight: 1.5,
                          }}
                        >
                          {msg.text}
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Divider />

            {/* Input Area */}
            <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
              <Box display="flex" gap={2} alignItems="flex-end">
                <TextField
                  fullWidth
                  placeholder="Type your legal question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  multiline
                  maxRows={3}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: alpha("#1e3a8a", 0.3),
                      },
                      "&:hover fieldset": {
                        borderColor: "#1e3a8a",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1e3a8a",
                        borderWidth: 2,
                      },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  sx={{
                    background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`,
                    minWidth: 56,
                    height: 56,
                    borderRadius: 2,
                    "&:hover": {
                      background: `linear-gradient(135deg, #1e40af 0%, #2563eb 100%)`,
                    },
                    "&:disabled": {
                      background: alpha("#64748b", 0.3),
                    },
                  }}
                >
                  <Send />
                </Button>
              </Box>

              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button
                  onClick={() => setOpen(false)}
                  variant="outlined"
                  sx={{
                    borderColor: alpha("#ef4444", 0.5),
                    color: "#ef4444",
                    "&:hover": {
                      borderColor: "#ef4444",
                      backgroundColor: alpha("#ef4444", 0.05),
                    },
                  }}
                >
                  End Consultation
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>
      </Card>
    </Box>
  )
}
