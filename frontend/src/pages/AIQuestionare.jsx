
import { useState, useEffect } from "react"
import axios from "axios"
import {
  Box,
  Button,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  alpha,
  Chip,
  Divider,
} from "@mui/material"
import { Gavel, Assessment, CheckCircle, ArrowForward, ArrowBack, RestartAlt } from "@mui/icons-material"

const API_URL = "https://ai-court-ai.onrender.com/api"

const DynamicQuestionnaire = () => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [caseType, setCaseType] = useState("")
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  useEffect(() => {
    const fetchInitialQuestions = async () => {
      try {
        const response = await axios.get(`${API_URL}/questions/initial`)
        setQuestions(response.data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching initial questions:", error)
        setLoading(false)
      }
    }

    fetchInitialQuestions()
  }, [])

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
    console.log(answers)
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
      setSubmitting(false)
    } catch (error) {
      console.error("Error1 submitting case:", error)
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setCaseType("")
    setAnswers({})
    setResult(null)
    axios
      .get(`${API_URL}/questions/initial`)
      .then((response) => {
        setQuestions(response.data)
        setCurrentStep(0)
      })
      .catch((error) => console.error("Error resetting form:", error))
  }

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
        sx={{
          background: `linear-gradient(135deg, ${alpha("#1e3a8a", 0.05)} 0%, ${alpha("#d97706", 0.05)} 100%)`,
        }}
      >
        <CircularProgress
          size={60}
          sx={{
            color: "#1e3a8a",
            mb: 2,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1e3a8a",
            fontWeight: 500,
          }}
        >
          Loading Case Analysis...
        </Typography>
      </Box>
    )
  }

  if (result) {
    return (
      <Box sx={{ maxWidth: 900, margin: "0 auto", mt: 4, px: 2 }}>
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
              <Assessment sx={{ fontSize: 48, mb: 2, color: "#d97706" }} />
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontFamily: "serif" }}>
                Case Analysis Complete
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                AI-Powered Legal Assessment Results
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 3,
                  mb: 4,
                }}
              >
                <Card
                  sx={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${alpha("#1e3a8a", 0.1)} 0%, ${alpha("#1e40af", 0.05)} 100%)`,
                    border: `2px solid ${alpha("#1e3a8a", 0.2)}`,
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                  }}
                >
                  <Gavel sx={{ fontSize: 40, color: "#1e3a8a", mb: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1e3a8a", mb: 1, fontWeight: 600 }}
                  >
                    Case Type
                  </Typography>
                  <Chip
                    label={result.case_type}
                    sx={{
                      backgroundColor: "#1e3a8a",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "1rem",
                      height: 40,
                      "& .MuiChip-label": { px: 2 },
                    }}
                  />
                </Card>

                <Card
                  sx={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${alpha("#d97706", 0.1)} 0%, ${alpha("#f59e0b", 0.05)} 100%)`,
                    border: `2px solid ${alpha("#d97706", 0.2)}`,
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                  }}
                >
                  <CheckCircle sx={{ fontSize: 40, color: "#d97706", mb: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.mode === "dark" ? "#e2e8f0" : "#d97706", mb: 1, fontWeight: 600 }}
                  >
                    Predicted Judgment
                  </Typography>
                  <Chip
                    label={result.judgment}
                    sx={{
                      backgroundColor: "#d97706",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "1rem",
                      height: 40,
                      "& .MuiChip-label": { px: 2 },
                    }}
                  />
                </Card>
              </Box>
            </Box>

            <Divider sx={{ my: 4, borderColor: alpha("#1e3a8a", 0.1) }} />

            <Box>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1e3a8a",
                  mb: 3,
                  fontWeight: 600,
                  fontFamily: "serif",
                }}
              >
                Case Details Summary
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {Object.entries(result.answers).map(([key, value]) => (
                  <Box
                    key={key}
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.mode === "dark" ? alpha("#1e3a8a", 0.1) : alpha("#1e3a8a", 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha("#1e3a8a", 0.1)}`,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                        lineHeight: 1.6,
                      }}
                    >
                      <Box component="span" sx={{ fontWeight: 600, color: "#1e3a8a" }}>
                        {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                      </Box>{" "}
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Button
                variant="contained"
                onClick={resetForm}
                startIcon={<RestartAlt />}
                sx={{
                  background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`,
                  color: "white",
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  boxShadow: `0 4px 12px ${alpha("#1e3a8a", 0.3)}`,
                  "&:hover": {
                    background: `linear-gradient(135deg, #1e40af 0%, #2563eb 100%)`,
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px ${alpha("#1e3a8a", 0.4)}`,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Analyze Another Case
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  const currentQuestion = questions[currentStep]

  if (!currentQuestion) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
        sx={{
          background: `linear-gradient(135deg, ${alpha("#1e3a8a", 0.05)} 0%, ${alpha("#d97706", 0.05)} 100%)`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1e3a8a",
            fontWeight: 500,
          }}
        >
          No questions found
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 900, margin: "0 auto", mt: 4, px: 2 }}>
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
            <Gavel sx={{ fontSize: 48, mb: 2, color: "#d97706" }} />
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontFamily: "serif" }}>
              AI Court Assistant
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Intelligent Case Analysis & Legal Guidance
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {questions.length > 1 && (
            <Box sx={{ mb: 4 }}>
              <Stepper
                activeStep={currentStep}
                sx={{
                  mb: 4,
                  "& .MuiStepLabel-root .Mui-completed": {
                    color: "#d97706",
                  },
                  "& .MuiStepLabel-root .Mui-active": {
                    color: "#1e3a8a",
                  },
                  "& .MuiStepConnector-line": {
                    borderColor: alpha("#1e3a8a", 0.3),
                  },
                  "& .Mui-completed .MuiStepConnector-line": {
                    borderColor: "#d97706",
                  },
                }}
              >
                {questions.map((q, index) => (
                  <Step key={index}>
                    <StepLabel></StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Question {currentStep + 1} of {questions.length}
                </Typography>
              </Box>
            </Box>
          )}

          <FormControl fullWidth sx={{ mb: 4 }}>
            <FormLabel
              id={`question-${currentQuestion.id}`}
              sx={{
                mb: 3,
                fontSize: "1.4rem",
                fontWeight: 600,
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1e3a8a",
                fontFamily: "serif",
                lineHeight: 1.4,
              }}
            >
              {currentQuestion.question}
            </FormLabel>

            {currentQuestion.options ? (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                sx={{ mt: 2 }}
              >
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={
                      <Radio
                        sx={{
                          color: alpha("#1e3a8a", 0.6),
                          "&.Mui-checked": {
                            color: "#1e3a8a",
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontSize: "1.1rem",
                          color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                          fontWeight: 500,
                        }}
                      >
                        {option}
                      </Typography>
                    }
                    sx={{
                      mb: 1,
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${alpha("#1e3a8a", 0.1)}`,
                      backgroundColor: answers[currentQuestion.id] === option ? alpha("#1e3a8a", 0.05) : "transparent",
                      "&:hover": {
                        backgroundColor: alpha("#1e3a8a", 0.03),
                      },
                      transition: "all 0.2s ease",
                    }}
                  />
                ))}
              </RadioGroup>
            ) : (
              <TextField
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="Please provide your detailed answer..."
                multiline
                rows={4}
                sx={{
                  mt: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    fontSize: "1.1rem",
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
                  "& .MuiInputBase-input": {
                    color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                  },
                }}
              />
            )}
          </FormControl>

          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              disabled={currentStep === 0}
              onClick={handleBack}
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{
                borderColor: alpha("#1e3a8a", 0.3),
                color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
                px: 3,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 500,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  borderColor: "#1e3a8a",
                  backgroundColor: alpha("#1e3a8a", 0.05),
                },
                "&:disabled": {
                  borderColor: alpha("#64748b", 0.2),
                  color: alpha("#64748b", 0.5),
                },
              }}
            >
              Back
            </Button>

            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!answers[currentQuestion.id] || submitting}
              endIcon={submitting ? null : <ArrowForward />}
              sx={{
                background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)`,
                color: "white",
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                boxShadow: `0 4px 12px ${alpha("#1e3a8a", 0.3)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, #1e40af 0%, #2563eb 100%)`,
                  transform: "translateY(-2px)",
                  boxShadow: `0 6px 20px ${alpha("#1e3a8a", 0.4)}`,
                },
                "&:disabled": {
                  background: alpha("#64748b", 0.3),
                  color: alpha("#ffffff", 0.7),
                  transform: "none",
                  boxShadow: "none",
                },
                transition: "all 0.3s ease",
              }}
            >
              {currentQuestion.id === "case_type"
                ? "Start Analysis"
                : currentStep === questions.length - 1
                  ? "Submit Case"
                  : "Next Question"}
              {submitting && <CircularProgress size={20} sx={{ ml: 1, color: "white" }} />}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default DynamicQuestionnaire
