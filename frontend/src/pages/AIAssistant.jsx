
import { useState, useEffect } from "react"
import axios from "axios"
import {
  Card,
  Typography,
  Button,
  TextField,
  FormControl,
  FormLabel,
  Modal,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  useTheme, 
  alpha,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from "@mui/material"
import { Psychology, Assessment, CheckCircle, ArrowForward, ArrowBack, RestartAlt } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"

const API_URL = "https://ai-court-ai.onrender.com/api"

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "900px",
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
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [caseType, setCaseType] = useState("")
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  const handleStart = () => {
    setOpen(true)
    fetchInitialQuestions()
  }

  const fetchInitialQuestions = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/questions/initial`)
      setQuestions(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching initial questions:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!caseType) return

    const fetchQuestionsByType = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/questions/${caseType}`)
        setQuestions(response.data)
        setCurrentStep(0)
        setLoading(false)
      } catch (error) {
        console.error(`Error fetching ${caseType} questions:`, error)
        setLoading(false)
      }
    }

    fetchQuestionsByType()
  }, [caseType])

  const handleAnswerChange = (questionId, value) => {
    if (questionId === "case_type") {
      setCaseType(value)
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleNext = () => {
    if (currentStep === 0 && questions[0]?.id === "case_type") {
      return
    }
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const response = await axios.post(`${API_URL}/analyze`, {
        ...answers,
        case_type: caseType,
      })
      setResult(response.data)
      setAttemptsLeft(prev => Math.max(0, prev - 1))
      setSubmitting(false)
    } catch (error) {
      console.error("Error submitting case:", error)
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setCaseType("")
    setAnswers({})
    setResult(null)
    setCurrentStep(0)
    setOpen(false)
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

        <Modal open={open} onClose={() => setOpen(false)}>
          <Box sx={modalStyle}>
            {loading ? (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="400px"
              >
                <CircularProgress size={60} sx={{ color: "#1e3a8a", mb: 2 }} />
                <Typography variant="h6" sx={{ color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1e3a8a" }}>
                  Loading Questions...
                </Typography>
              </Box>
            ) : result ? (
              // Results View
              <Box>
                <Box
                  sx={{
                    background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`,
                    color: "white",
                    p: 4,
                    textAlign: "center",
                  }}
                >
                  <Assessment sx={{ fontSize: 48, mb: 2, color: "#d97706" }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontFamily: "serif" }}>
                    Case Analysis Complete
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    AI-Powered Legal Assessment Results
                  </Typography>
                </Box>

                <Box sx={{ p: 4, maxHeight: "calc(85vh - 200px)", overflowY: "auto" }}>
                  <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: "200px",
                        background: `linear-gradient(135deg, ${alpha("#1e3a8a", 0.1)} 0%, ${alpha("#1e40af", 0.05)} 100%)`,
                        border: `2px solid ${alpha("#1e3a8a", 0.2)}`,
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h6" sx={{ color: "#1e3a8a", mb: 1, fontWeight: 600 }}>
                        Case Type
                      </Typography>
                      <Chip
                        label={result.case_type}
                        sx={{
                          backgroundColor: "#1e3a8a",
                          color: "white",
                          fontWeight: 600,
                          height: 36,
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        minWidth: "200px",
                        background: `linear-gradient(135deg, ${alpha("#d97706", 0.1)} 0%, ${alpha("#f59e0b", 0.05)} 100%)`,
                        border: `2px solid ${alpha("#d97706", 0.2)}`,
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h6" sx={{ color: "#d97706", mb: 1, fontWeight: 600 }}>
                        Predicted Judgment
                      </Typography>
                      <Chip
                        label={result.judgment}
                        sx={{
                          backgroundColor: "#d97706",
                          color: "white",
                          fontWeight: 600,
                          height: 36,
                        }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" sx={{ color: "#1e3a8a", mb: 2, fontWeight: 600 }}>
                    Case Details Summary
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {result.answers && Object.entries(result.answers).map(([key, value]) => (
                      <Box
                        key={key}
                        sx={{
                          p: 2,
                          backgroundColor: alpha("#1e3a8a", 0.05),
                          borderRadius: 2,
                          border: `1px solid ${alpha("#1e3a8a", 0.1)}`,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e3a8a", mb: 0.5 }}>
                          {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Typography>
                        <Typography variant="body1">{value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ textAlign: "center", mt: 4 }}>
                    <Button
                      variant="contained"
                      onClick={resetForm}
                      startIcon={<RestartAlt />}
                      sx={{
                        background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        "&:hover": {
                          background: `linear-gradient(135deg, #1e40af 0%, #2563eb 100%)`,
                        },
                      }}
                    >
                      Close
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              // Questionnaire View
              <Box>
                <Box
                  sx={{
                    background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`,
                    color: "white",
                    p: 3,
                    textAlign: "center",
                  }}
                >
                  <Psychology sx={{ fontSize: 40, mb: 1, color: "#d97706" }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: "serif" }}>
                    AI Legal Consultation
                  </Typography>
                </Box>

                <Box sx={{ p: 4, maxHeight: "calc(85vh - 180px)", overflowY: "auto" }}>
                  {questions.length > 1 && (
                    <Box sx={{ mb: 4 }}>
                      <Stepper
                        activeStep={currentStep}
                        sx={{
                          "& .MuiStepLabel-root .Mui-completed": { color: "#d97706" },
                          "& .MuiStepLabel-root .Mui-active": { color: "#1e3a8a" },
                        }}
                      >
                        {questions.map((q, index) => (
                          <Step key={index}>
                            <StepLabel></StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                      <Typography variant="body2" sx={{ textAlign: "center", mt: 2, color: "#64748b" }}>
                        Question {currentStep + 1} of {questions.length}
                      </Typography>
                    </Box>
                  )}

                  {questions[currentStep] && (
                    <FormControl fullWidth>
                      <FormLabel
                        sx={{
                          mb: 3,
                          fontSize: "1.2rem",
                          fontWeight: 600,
                          color: "#1e3a8a",
                          fontFamily: "serif",
                        }}
                      >
                        {questions[currentStep].question}
                      </FormLabel>

                      {questions[currentStep].options ? (
                        <RadioGroup
                          value={answers[questions[currentStep].id] || ""}
                          onChange={(e) => handleAnswerChange(questions[currentStep].id, e.target.value)}
                        >
                          {questions[currentStep].options.map((option) => (
                            <FormControlLabel
                              key={option}
                              value={option}
                              control={
                                <Radio
                                  sx={{
                                    color: alpha("#1e3a8a", 0.6),
                                    "&.Mui-checked": { color: "#1e3a8a" },
                                  }}
                                />
                              }
                              label={<Typography sx={{ fontSize: "1rem" }}>{option}</Typography>}
                              sx={{
                                mb: 1,
                                p: 2,
                                borderRadius: 2,
                                border: `1px solid ${alpha("#1e3a8a", 0.1)}`,
                                backgroundColor:
                                  answers[questions[currentStep].id] === option
                                    ? alpha("#1e3a8a", 0.05)
                                    : "transparent",
                                "&:hover": { backgroundColor: alpha("#1e3a8a", 0.03) },
                              }}
                            />
                          ))}
                        </RadioGroup>
                      ) : (
                        <TextField
                          value={answers[questions[currentStep].id] || ""}
                          onChange={(e) => handleAnswerChange(questions[currentStep].id, e.target.value)}
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="Please provide your detailed answer..."
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              "&.Mui-focused fieldset": { borderColor: "#1e3a8a", borderWidth: 2 },
                            },
                          }}
                        />
                      )}
                    </FormControl>
                  )}

                  <Box display="flex" justifyContent="space-between" mt={4}>
                    <Button
                      disabled={currentStep === 0}
                      onClick={handleBack}
                      startIcon={<ArrowBack />}
                      variant="outlined"
                      sx={{
                        borderColor: alpha("#1e3a8a", 0.3),
                        color: "#64748b",
                        "&:hover": { borderColor: "#1e3a8a" },
                      }}
                    >
                      Back
                    </Button>

                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!answers[questions[currentStep]?.id] || submitting}
                      endIcon={submitting ? <CircularProgress size={20} sx={{ color: "white" }} /> : <ArrowForward />}
                      sx={{
                        background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`,
                        px: 4,
                        "&:hover": { background: `linear-gradient(135deg, #1e40af 0%, #2563eb 100%)` },
                        "&:disabled": { background: alpha("#64748b", 0.3) },
                      }}
                    >
                      {questions[currentStep]?.id === "case_type"
                        ? "Start Analysis"
                        : currentStep === questions.length - 1
                          ? "Submit Case"
                          : "Next Question"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Modal>
      </Card>
    </Box>
  )
}
