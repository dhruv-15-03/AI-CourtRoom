
import { useState, useEffect } from "react"
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  useTheme,
  Chip,
  IconButton,
  Fade,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Skeleton,
  Paper,
  Stack,
} from "@mui/material"
import {
  Edit,
  Person,
  Email,
  Phone,
  Work,
  Gavel,
  School,
  Save,
  Cancel,
  Verified,
  TrendingUp,
  Logout,
} from "@mui/icons-material"
import { userService } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const presetAvatars = ["/avatars/avatar1.png", "/avatars/avatar2.png", "/avatars/avatar3.png"]

export default function UnifiedProfile() {
  const theme = useTheme()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadProfile()
    }
  }, [mounted])

  const loadProfile = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("authToken")

      const { data } = await userService.getProfile()
      setProfile(data)
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        mobile: data.mobile || "",
        image: data.image || presetAvatars[0],
        // Lawyer specific fields
        description: data.description || "",
        specialisation: data.specialisation || "",
        fees: data.fees || "",
        // Judge specific fields
        bench: data.bench || "",
        court: data.court || "",
        years: data.years || "",
      })
    } catch (e) {
      console.error("Profile load error:", e)
      setError(e.response?.data?.error || e.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      const { data } = await userService.updateProfile(payload)
      setProfile(data)
      setIsEditing(false)
      setToast({ open: true, message: "Profile updated successfully!", severity: "success" })
    } catch (e) {
      console.error("Profile update error:", e)
      setToast({
        open: true,
        message: e.response?.data?.error || e.message || "Failed to update profile",
        severity: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form to original profile data
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      mobile: profile.mobile || "",
      image: profile.image || presetAvatars[0],
      description: profile.description || "",
      specialisation: profile.specialisation || "",
      fees: profile.fees || "",
      bench: profile.bench || "",
      court: profile.court || "",
      years: profile.years || "",
    })
  }

  const handleLogout = async () => {
    try {
      await logout()
      setToast({ 
        open: true, 
        message: "Logged out successfully!", 
        severity: "success" 
      })
    } catch (e) {
      console.error("Logout error:", e)
      setToast({
        open: true,
        message: "Error during logout, but you have been logged out.",
        severity: "warning",
      })
    }
  }

  const getRoleDisplay = () => {
    if (profile?.isLawyer) return "Lawyer"
    if (profile?.isJudge) return "Judge"
    return "User"
  }

  const getRoleColor = () => {
    if (profile?.isLawyer) return "primary"
    if (profile?.isJudge) return "secondary"
    return "default"
  }

  const getRoleIcon = () => {
    if (profile?.isLawyer) return <Work />
    if (profile?.isJudge) return <Gavel />
    return <Person />
  }

  const getProfileCompleteness = () => {
    const fields = [
      form.firstName,
      form.lastName,
      form.email,
      form.mobile,
      ...(profile?.isLawyer ? [form.specialisation, form.description, form.fees] : []),
      ...(profile?.isJudge ? [form.court, form.bench, form.years] : []),
    ]
    const filledFields = fields.filter((field) => field && field.toString().trim()).length
    return Math.round((filledFields / fields.length) * 100)
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, mb: 3 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Paper
          sx={{
            p: 6,
            borderRadius: 4,
            border: "2px solid",
            borderColor: theme.palette.mode === "dark" ? "error.dark" : "error.light",
            bgcolor: theme.palette.mode === "dark" ? "rgba(211, 47, 47, 0.05)" : "rgba(211, 47, 47, 0.02)",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              mb: 2,
              fontWeight: "bold",
              color: theme.palette.mode === "dark" ? "error.light" : "error.main",
            }}
          >
            Unable to Load Profile
          </Typography>
          <Typography
            sx={{
              mb: 4,
              color: theme.palette.mode === "dark" ? "text.secondary" : "text.primary",
            }}
          >
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={loadProfile}
            sx={{
              bgcolor: "#1e3a8a",
              "&:hover": { bgcolor: "#1e40af" },
              borderRadius: 2,
              px: 4,
              py: 1.5,
            }}
          >
            Try Again
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Professional Header Section */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)"
              : "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)",
          border: `1px solid ${theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 58, 138, 0.1)"}`,
          boxShadow:
            theme.palette.mode === "dark" ? "0 20px 40px rgba(0, 0, 0, 0.3)" : "0 20px 40px rgba(30, 58, 138, 0.15)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            py: { xs: 4, sm: 5, md: 6 },
            px: { xs: 2, sm: 3, md: 4 },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fillRule="evenodd"%3E%3Cg fill="%23ffffff" fillOpacity="0.03"%3E%3Cpath d="M30 30c0-8.284-6.716-15-15-15s-15 6.716-15 15 6.716 15 15 15 15-6.716 15-15zm15 0c0-8.284-6.716-15-15-15s-15 6.716-15 15 6.716 15 15 15 15-6.716 15-15z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            },
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={form.image}
                  sx={{
                    width: { xs: 120, sm: 140, md: 160 },
                    height: { xs: 120, sm: 140, md: 160 },
                    border: "4px solid rgba(255,255,255,0.95)",
                    boxShadow: "0 16px 32px rgba(0,0,0,0.25)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "scale(1.02)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                    },
                  }}
                />
                {(profile?.isLawyer || profile?.isJudge) && (
                  <Verified
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      color: "#fbbf24",
                      bgcolor: "white",
                      borderRadius: "50%",
                      fontSize: { xs: 24, sm: 28, md: 32 },
                      p: 0.5,
                      boxShadow: "0 4px 12px rgba(251, 191, 36, 0.4)",
                    }}
                  />
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                <Typography
                  variant="h3"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    mb: 2,
                    textShadow: "0 4px 8px rgba(0,0,0,0.4)",
                    fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                    fontFamily: "'Playfair Display', serif",
                    lineHeight: 1.2,
                  }}
                >
                  {form.firstName} {form.lastName}
                </Typography>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ mb: 3, justifyContent: { xs: "center", md: "flex-start" }, flexWrap: "wrap", gap: 1 }}
                >
                  <Chip
                    icon={getRoleIcon()}
                    label={getRoleDisplay()}
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      height: 40,
                      px: 2,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                      bgcolor: profile?.isLawyer || profile?.isJudge ? "#fbbf24" : "rgba(255,255,255,0.2)",
                      color: profile?.isLawyer || profile?.isJudge ? "#1e3a8a" : "white",
                      border: "1px solid rgba(255,255,255,0.2)",
                      "& .MuiChip-icon": {
                        fontSize: 20,
                        color: profile?.isLawyer || profile?.isJudge ? "#1e3a8a" : "white",
                      },
                    }}
                  />
                  {form.email && (
                    <Chip
                      icon={<Email />}
                      label={form.email}
                      variant="outlined"
                      sx={{
                        color: "white",
                        borderColor: "rgba(255,255,255,0.3)",
                        "& .MuiChip-icon": { color: "white" },
                      }}
                    />
                  )}
                </Stack>

                <Box sx={{ maxWidth: 400 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
                      Profile Completeness
                    </Typography>
                    <Typography variant="h6" sx={{ color: "#fbbf24", fontWeight: "bold" }}>
                      {getProfileCompleteness()}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getProfileCompleteness()}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "rgba(255,255,255,0.2)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#fbbf24",
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ position: "absolute", top: 20, right: 20 }}>
            <Stack direction="row" spacing={1}>
              {/* Logout Button */}
              <Tooltip title="Logout">
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(239, 68, 68, 0.2)",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  <Logout />
                </IconButton>
              </Tooltip>
              
              {/* Edit Profile Button */}
              {!isEditing ? (
                <Tooltip title="Edit Profile">
                  <IconButton
                    onClick={() => setIsEditing(true)}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(10px)",
                      color: "white",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.25)",
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Save Changes">
                    <IconButton
                      onClick={handleSave}
                      disabled={saving}
                      sx={{
                        bgcolor: "#fbbf24",
                        color: "#1e3a8a",
                        "&:hover": { bgcolor: "#f59e0b" },
                        "&:disabled": { bgcolor: "rgba(251, 191, 36, 0.5)" },
                      }}
                    >
                      {saving ? <CircularProgress size={20} sx={{ color: "#1e3a8a" }} /> : <Save />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      onClick={handleCancel}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.15)",
                        color: "white",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                      }}
                    >
                      <Cancel />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </Stack>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Fade in={true} timeout={800}>
        <Grid container spacing={4}>
          {/* Basic Information */}
          <Grid item xs={12} lg={8}>
            <Paper
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 8px 24px rgba(0, 0, 0, 0.2)"
                    : "0 8px 24px rgba(30, 58, 138, 0.08)",
                border: `1px solid ${theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 58, 138, 0.1)"}`,
                bgcolor: theme.palette.mode === "dark" ? "background.paper" : "background.paper",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                    color: "white",
                    mr: 2,
                    boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
                  }}
                >
                  <Person />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    color: theme.palette.mode === "dark" ? "text.primary" : "#1e3a8a",
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  Personal Information
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    sx={{
                      "& .MuiFilledInput-root": {
                        bgcolor: theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                        "&:hover": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                        },
                      },
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                      },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                      "& .MuiInputBase-input": {
                        color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                      },
                    }}
                    InputProps={{
                      startAdornment: !isEditing && (
                        <Person
                          sx={{
                            color: theme.palette.mode === "dark" ? "#3b82f6" : "#1e3a8a",
                            fontSize: 20,
                            mr: 1,
                            mt: 2,
                            // alignSelf: "flex-start",
                          }}
                        />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    sx={{
                      "& .MuiFilledInput-root": {
                        bgcolor: theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                        "&:hover": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                        },
                      },
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                      },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                      "& .MuiInputBase-input": {
                        color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    sx={{
                      "& .MuiFilledInput-root": {
                        bgcolor: theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                        "&:hover": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                        },
                      },
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                      },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                      "& .MuiInputBase-input": {
                        color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <Email
                          sx={{
                            color: theme.palette.mode === "dark" ? "#3b82f6" : "#1e3a8a",
                            fontSize: 20,
                            mr: 1,
                            mt: 2,
                            // alignSelf: "flex-start",
                          }}
                        />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    sx={{
                      "& .MuiFilledInput-root": {
                        bgcolor: theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                        "&:hover": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                        },
                      },
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                      },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                      "& .MuiInputBase-input": {
                        color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <Phone
                          sx={{
                            color: theme.palette.mode === "dark" ? "#3b82f6" : "#1e3a8a",
                            fontSize: 20,
                            mr: 1,
                            mt: 2,
                          }}
                        />
                      ),
                    }}
                  />
                </Grid>
                {isEditing && (
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Profile Picture"
                      name="image"
                      value={form.image}
                      onChange={handleChange}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                      }}
                    >
                      {presetAvatars.map((url, i) => (
                        <MenuItem key={i} value={url}>
                          <Box display="flex" alignItems="center">
                            <Avatar src={url} sx={{ mr: 2, width: 40, height: 40 }} />
                            <Typography>Avatar {i + 1}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Professional Information */}
          <Grid item xs={12} lg={4}>
            <Paper
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 8px 24px rgba(0, 0, 0, 0.2)"
                    : "0 8px 24px rgba(30, 58, 138, 0.08)",
                border: `1px solid ${theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 58, 138, 0.1)"}`,
                bgcolor: theme.palette.mode === "dark" ? "background.paper" : "background.paper",
                height: "fit-content",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                    color: "white",
                    mr: 2,
                    boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
                  }}
                >
                  {profile?.isLawyer ? <Work /> : profile?.isJudge ? <Gavel /> : <School />}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: theme.palette.mode === "dark" ? "text.primary" : "#1e3a8a",
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  Professional Details
                </Typography>
              </Box>

              {profile?.isLawyer && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Specialization"
                      name="specialisation"
                      value={form.specialisation}
                      onChange={handleChange}
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "filled"}
                      placeholder="e.g., Criminal Law, Corporate Law"
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                          },
                        },
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                        "& .MuiInputBase-input": {
                          color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Professional Description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "filled"}
                      placeholder="Brief description of your practice and expertise"
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                          },
                        },
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                        "& .MuiInputBase-input": {
                          color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Consultation Fees"
                      name="fees"
                      type="number"
                      value={form.fees}
                      onChange={handleChange}
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "filled"}
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                          },
                        },
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                        "& .MuiInputBase-input": {
                          color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                        },
                      }}
                      InputProps={{
                        startAdornment: <Typography sx={{ color: "#1e3a8a", fontWeight: "bold", mr: 1 }}>₹</Typography>,
                      }}
                    />
                  </Grid>
                </Grid>
              )}

              {profile?.isJudge && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Court"
                      name="court"
                      value={form.court}
                      onChange={handleChange}
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "filled"}
                      placeholder="e.g., Supreme Court, High Court"
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                          },
                        },
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                        "& .MuiInputBase-input": {
                          color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bench"
                      name="bench"
                      value={form.bench}
                      onChange={handleChange}
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "filled"}
                      placeholder="e.g., Criminal Bench, Civil Bench"
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                          },
                        },
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                        "& .MuiInputBase-input": {
                          color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Years of Experience"
                      name="years"
                      type="number"
                      value={form.years}
                      onChange={handleChange}
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "filled"}
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                          },
                        },
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": { borderColor: "#1e3a8a" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#1e3a8a" },
                        "& .MuiInputBase-input": {
                          color: theme.palette.mode === "dark" ? "text.primary" : "text.primary",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              )}

              {!profile?.isLawyer && !profile?.isJudge && (
                <Box textAlign="center" py={4}>
                  <Paper
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      bgcolor: theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 58, 138, 0.02)",
                      border: `2px dashed ${theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 58, 138, 0.2)"}`,
                    }}
                  >
                    <School
                      sx={{
                        fontSize: 60,
                        color: theme.palette.mode === "dark" ? "#3b82f6" : "#1e3a8a",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        fontWeight: "bold",
                        color: theme.palette.mode === "dark" ? "text.primary" : "#1e3a8a",
                      }}
                    >
                      Standard User Account
                    </Typography>
                    <Typography
                      sx={{
                        mb: 3,
                        color: theme.palette.mode === "dark" ? "text.secondary" : "text.secondary",
                      }}
                    >
                      Upgrade to access professional legal features and showcase your expertise.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<TrendingUp />}
                      sx={{
                        borderRadius: 2,
                        borderColor: theme.palette.mode === "dark" ? "#3b82f6" : "#1e3a8a",
                        color: theme.palette.mode === "dark" ? "#3b82f6" : "#1e3a8a",
                        "&:hover": {
                          borderColor: theme.palette.mode === "dark" ? "#60a5fa" : "#1e40af",
                          bgcolor:
                            theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.08)" : "rgba(30, 58, 138, 0.04)",
                        },
                      }}
                    >
                      Upgrade Account
                    </Button>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Fade>

      {/* Toast Notification */}
      {mounted && (
        <Snackbar
          open={toast.open}
          autoHideDuration={6000}
          onClose={() => setToast({ ...toast, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => setToast({ ...toast, open: false })}
            variant="filled"
            sx={{
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              "& .MuiAlert-icon": { fontSize: 24 },
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      )}
    </Container>
  )
}
