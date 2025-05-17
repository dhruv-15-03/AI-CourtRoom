import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  FormControl, 
  Select, 
  MenuItem, 
  FormLabel,
  Card, 
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';

const API_URL = 'https://ai-court-ai.onrender.com/api';

const DynamicQuestionnaire = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [caseType, setCaseType] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  
  useEffect(() => {
    const fetchInitialQuestions = async () => {
      try {
        const response = await axios.get(`${API_URL}/questions/initial`);
        setQuestions(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial questions:', error);
        setLoading(false);
      }
    };
    
    fetchInitialQuestions();
  }, []);
  
  useEffect(() => {
    if (!caseType) return;
    
    const fetchQuestionsByType = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/questions/${caseType}`);
        setQuestions(response.data);
        setCurrentStep(0);
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching ${caseType} questions:`, error);
        setLoading(false);
      }
    };
    
    fetchQuestionsByType();
  }, [caseType]);
  
  const handleAnswerChange = (questionId, value) => {
    if (questionId === 'case_type') {
      setCaseType(value);
    }
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleNext = () => {
    if (currentStep === 0 && questions[0]?.id === 'case_type') {
      return;
    }
    console.log(answers)
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const response = await axios.post(`${API_URL}/analyze`, {
        ...answers,
        case_type: caseType
      });
      setResult(response.data);
      setSubmitting(false);
    } catch (error) {
      console.error('Error1 submitting case:', error);
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setCaseType('');
    setAnswers({});
    setResult(null);
    axios.get(`${API_URL}/questions/initial`)
      .then(response => {
        setQuestions(response.data);
        setCurrentStep(0);
      })
      .catch(error => console.error('Error resetting form:', error));
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (result) {
    return (
      <Card elevation={3} sx={{ maxWidth: 800, margin: '0 auto', mt: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>Case Analysis Results</Typography>
          
          <Box sx={{ mt: 3, mb: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Predicted Case Type: {result.case_type}
            </Typography>
            <Typography variant="h5" gutterBottom color="secondary">
              Predicted Judgment: {result.judgment}
            </Typography>
          </Box>
          
          <Typography variant="h6" gutterBottom>Your Answers:</Typography>
          {Object.entries(result.answers).map(([key, value]) => (
            <Typography key={key} variant="body1" sx={{ mb: 1 }}>
              <strong>{key}:</strong> {value}
            </Typography>
          ))}
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={resetForm} 
            sx={{ mt: 3 }}
          >
            Analyze Another Case
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const currentQuestion = questions[currentStep];
  
  if (!currentQuestion) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <Typography variant="h6">No questions found</Typography>
      </Box>
    );
  }
  
  return (
    <Card elevation={3} sx={{ maxWidth: 800, margin: '0 auto', mt: 4, p: 2 }}>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          AI Court Assistant
        </Typography>
        
        {questions.length > 1 && (
          <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
            {questions.map((q, index) => (
              <Step key={index}>
                <StepLabel></StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <FormLabel id={`question-${currentQuestion.id}`} sx={{ mb: 2, fontSize: '1.2rem', fontWeight: 'bold' }}>
            {currentQuestion.question}
          </FormLabel>
          
          {currentQuestion.options ? (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            >
              {currentQuestion.options.map((option) => (
                <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
          ) : (
            <TextField
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Your answer"
            />
          )}
        </FormControl>
        
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            disabled={currentStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || submitting}
          >
            {currentQuestion.id === 'case_type' ? 'Start' : 
              currentStep === questions.length - 1 ? 'Submit' : 'Next'}
            {submitting && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DynamicQuestionnaire;