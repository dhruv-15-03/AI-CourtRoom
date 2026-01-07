import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Container,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Tab,
  Tabs,
  IconButton,
} from '@mui/material';
import {
  Add,

  Gavel,

  Article,
  Balance,
  Delete,
  FileUpload,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { caseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CreateCase = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Templates state
  const [templates, setTemplates] = useState([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Indian legal templates mock data
  const indianTemplates = [
    {
      title: 'Criminal Case - IPC 302 (Murder)',
      description: 'Template for murder cases under Indian Penal Code Section 302',
      caseType: 'CRIMINAL',
      courtType: 'SESSIONS_COURT',
      legalActs: [{ actName: 'Indian Penal Code', section: '302', year: '1860' }]
    },
    {
      title: 'Civil Property Dispute',
      description: 'Template for property disputes under Transfer of Property Act',
      caseType: 'CIVIL',
      courtType: 'CIVIL_COURT',
      legalActs: [{ actName: 'Transfer of Property Act', section: '6', year: '1882' }]
    },
    {
      title: 'Family Law - Divorce',
      description: 'Template for divorce cases under Hindu Marriage Act',
      caseType: 'FAMILY',
      courtType: 'FAMILY_COURT',
      legalActs: [{ actName: 'Hindu Marriage Act', section: '13', year: '1955' }]
    },
    {
      title: 'Consumer Protection Case',
      description: 'Template for consumer complaints under Consumer Protection Act',
      caseType: 'CONSUMER',
      courtType: 'CONSUMER_COURT',
      legalActs: [{ actName: 'Consumer Protection Act', section: '35', year: '2019' }]
    },
    {
      title: 'Labour Dispute',
      description: 'Template for labour disputes under Industrial Disputes Act',
      caseType: 'LABOUR',
      courtType: 'LABOUR_COURT',
      legalActs: [{ actName: 'Industrial Disputes Act', section: '10', year: '1947' }]
    },
    {
      title: 'Constitutional Matter',
      description: 'Template for constitutional matters and fundamental rights',
      caseType: 'CONSTITUTIONAL',
      courtType: 'HIGH_COURT',
      legalActs: [{ actName: 'Constitution of India', section: 'Article 32', year: '1950' }]
    }
  ];
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    plaintiff: '',
    defendant: '',
    caseType: '',
    courtType: '',
    courtLocation: '',
    date: '',
    nextHearingDate: '',
    courtFees: '',
    legalActs: [
      { actName: 'Indian Penal Code', section: '302', year: '1860' }
    ],
    legalRemarks: '',
    customAct: '',
  });

  // Indian Legal Case Types
  const caseTypes = [
    { 
      value: 'CRIMINAL', 
      label: 'Criminal Law', 
      icon: '⚖️',
      description: 'Cases involving criminal offenses, violations of law, and prosecutions by the state.'
    },
    { 
      value: 'CIVIL', 
      label: 'Civil Law', 
      icon: '🏛️',
      description: 'Disputes between private parties, contracts, property, and personal rights.'
    },
    { 
      value: 'FAMILY', 
      label: 'Family Law', 
      icon: '👨‍👩‍👧‍👦',
      description: 'Marriage, divorce, custody, adoption, and domestic relations matters.'
    },
    { 
      value: 'CONSUMER', 
      label: 'Consumer Protection', 
      icon: '🛡️',
      description: 'Consumer rights, product defects, service complaints, and trade practices.'
    },
    { 
      value: 'LABOUR', 
      label: 'Labour & Industrial', 
      icon: '👷',
      description: 'Employment disputes, industrial relations, and worker rights issues.'
    },
    { 
      value: 'CONSTITUTIONAL', 
      label: 'Constitutional Law', 
      icon: '📜',
      description: 'Fundamental rights, constitutional interpretation, and government powers.'
    },
    { 
      value: 'CYBER_CRIME', 
      label: 'Cyber Crime', 
      icon: '💻',
      description: 'Digital crimes, online fraud, data breaches, and technology-related offenses.'
    },
    { 
      value: 'ENVIRONMENTAL', 
      label: 'Environmental Law', 
      icon: '🌱',
      description: 'Environmental protection, pollution control, and natural resource disputes.'
    },
  ];

  // Indian Court Types
  const courtTypes = [
    { value: 'SUPREME_COURT', label: 'Supreme Court of India' },
    { value: 'HIGH_COURT', label: 'High Court' },
    { value: 'DISTRICT_COURT', label: 'District Court' },
    { value: 'SESSIONS_COURT', label: 'Sessions Court' },
    { value: 'MAGISTRATE_COURT', label: 'Magistrate Court' },
    { value: 'FAMILY_COURT', label: 'Family Court' },
    { value: 'CONSUMER_COURT', label: 'Consumer Court' },
    { value: 'LABOUR_COURT', label: 'Labour Court' },
  ];

  const steps = [
    'Choose Template',
    'Case Information',
    'Legal Details',
    'Review & Submit'
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await caseService.getIndianTemplates();
      setTemplates(response.data.templates);
    } catch (err) {
      console.error('Error loading templates:', err);
      
      // Check for JWT/Authentication errors
      if (err.response?.status === 401 || 
          err.response?.status === 403 ||
          (err.response?.data?.message && 
           (err.response.data.message.includes('JWT') || 
            err.response.data.message.includes('token') ||
            err.response.data.message.includes('Unauthorized') ||
            err.response.data.message.includes('expired')))) {
        
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
        return;
      }
      
      setError('Failed to load case templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateSelect = (template) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      caseType: template.caseType,
      courtType: template.courtType,
      legalActs: template.legalActs || [],
    });
    setSelectedTemplate(template);
    setTemplateDialogOpen(false);
    setActiveStep(1); // Move to next step
  };

  const handleAddCustomAct = () => {
    setFormData(prev => ({
      ...prev,
      legalActs: [...prev.legalActs, { actName: '', section: '', year: '' }]
    }));
  };

  const handleRemoveAct = (actToRemove) => {
    setFormData(prev => ({
      ...prev,
      actsAndSections: prev.actsAndSections.filter(act => act !== actToRemove)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Case title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Case description is required');
      }
      if (!formData.caseType) {
        throw new Error('Case type is required');
      }
      if (!formData.courtType) {
        throw new Error('Court type is required');
      }
      if (!formData.date) {
        throw new Error('Filing date is required');
      }

      // Prepare data for backend
      const caseData = {
        title: formData.title,
        description: formData.description,
        plaintiff: formData.plaintiff || 'To be determined',
        defendant: formData.defendant || 'To be determined',
        caseType: formData.caseType,
        courtType: formData.courtType,
        courtLocation: formData.courtLocation || 'New Delhi',
        filingDate: formData.date,
        nextHearingDate: formData.nextHearingDate || null,
        legalActs: formData.legalActs || [],
        legalRemarks: formData.legalRemarks || '',
        courtFees: formData.courtFees ? parseFloat(formData.courtFees) : 0,
      };

      const response = await caseService.createIndianCase(caseData);

      setSuccess(`Case created successfully! Case Number: ${response.data.caseNumber}`);
      
      // Reset stepper and navigate after 3 seconds
      setTimeout(() => {
        handleReset();
        navigate('/cases');
      }, 3000);

    } catch (err) {
      console.error('Error creating case:', err);
      
      // Check for JWT/Authentication errors
      if (err.response?.status === 401 || 
          err.response?.status === 403 ||
          (err.response?.data?.message && 
           (err.response.data.message.includes('JWT') || 
            err.response.data.message.includes('token') ||
            err.response.data.message.includes('Unauthorized') ||
            err.response.data.message.includes('expired')))) {
        
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
        return;
      }
      
      setError(err.response?.data?.error || err.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      title: '',
      description: '',
      plaintiff: '',
      defendant: '',
      caseType: '',
      courtType: '',
      courtLocation: '',
      date: '',
      nextHearingDate: '',
      courtFees: '',
      legalActs: [
        { actName: 'Indian Penal Code', section: '302', year: '1860' }
      ],
      legalRemarks: '',
      customAct: '',
    });
    setSelectedTemplate(null);
  };

  const handleCancel = () => {
    navigate('/cases');
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          p: 4,
          color: 'white',
          textAlign: 'center'
        }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              mb: 2,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Gavel sx={{ fontSize: 40 }} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              mb: 1,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Create New Legal Case
          </Typography>
          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Initiate a new case in the Indian Legal System with professional templates and comprehensive case management.
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Card elevation={1} sx={{ borderRadius: 3, minHeight: 500 }}>
            <CardContent sx={{ p: 4 }}>
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 3 }}>
                    Choose Case Template
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {caseTypes.map((caseType) => (
                      <Grid item xs={12} sm={6} md={4} key={caseType.value}>
                        <Card
                          onClick={() => {
                            setFormData(prev => ({ ...prev, caseType: caseType.value }));
                            setActiveStep(1);
                          }}
                          sx={{
                            cursor: 'pointer',
                            border: formData.caseType === caseType.value ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              borderColor: '#1976d2',
                            },
                          }}
                        >
                          <CardContent sx={{ textAlign: 'center', p: 3 }}>
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px auto',
                                color: 'white',
                              }}
                            >
                              <Balance sx={{ fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {caseType.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {caseType.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={() => setTemplateDialogOpen(true)}
                      startIcon={<Article />}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        borderColor: '#1976d2',
                        color: '#1976d2',
                      }}
                    >
                      Browse Indian Legal Templates
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 3 }}>
                    Case Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Case Title *"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter a descriptive title for the case..."
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&.Mui-focused fieldset': {
                              borderColor: '#1976d2',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1976d2',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Case Description *"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Provide a detailed description of the case, including relevant facts, parties involved, and legal issues..."
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&.Mui-focused fieldset': {
                              borderColor: '#1976d2',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1976d2',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Court Type *"
                        name="courtType"
                        value={formData.courtType}
                        onChange={handleChange}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      >
                        {courtTypes.map((court) => (
                          <MenuItem key={court.value} value={court.value}>
                            {court.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Court Location"
                        name="courtLocation"
                        value={formData.courtLocation}
                        onChange={handleChange}
                        placeholder="e.g., New Delhi, Mumbai"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Filing Date *"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Next Hearing Date"
                        name="nextHearingDate"
                        value={formData.nextHearingDate}
                        onChange={handleChange}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 3 }}>
                    Legal Acts & Sections
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          Applicable Legal Acts
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleAddCustomAct}
                          startIcon={<Add />}
                          sx={{ borderRadius: 2 }}
                        >
                          Add Custom Act
                        </Button>
                      </Box>
                      
                      {formData.legalActs.map((act, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                          <CardContent sx={{ p: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={5}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Act Name"
                                  value={act.actName}
                                  onChange={(e) => {
                                    const newActs = [...formData.legalActs];
                                    newActs[index].actName = e.target.value;
                                    setFormData(prev => ({ ...prev, legalActs: newActs }));
                                  }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Section"
                                  value={act.section}
                                  onChange={(e) => {
                                    const newActs = [...formData.legalActs];
                                    newActs[index].section = e.target.value;
                                    setFormData(prev => ({ ...prev, legalActs: newActs }));
                                  }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Year"
                                  value={act.year}
                                  onChange={(e) => {
                                    const newActs = [...formData.legalActs];
                                    newActs[index].year = e.target.value;
                                    setFormData(prev => ({ ...prev, legalActs: newActs }));
                                  }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={1}>
                                <IconButton
                                  onClick={() => {
                                    const newActs = formData.legalActs.filter((_, i) => i !== index);
                                    setFormData(prev => ({ ...prev, legalActs: newActs }));
                                  }}
                                  color="error"
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Additional Legal Remarks"
                        name="legalRemarks"
                        value={formData.legalRemarks}
                        onChange={handleChange}
                        placeholder="Add any additional legal remarks, precedents, or special considerations..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeStep === 3 && (
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 3 }}>
                    Review & Submit
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                            Case Summary
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">Case Type:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                {caseTypes.find(ct => ct.value === formData.caseType)?.label || 'Not selected'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">Court Type:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                {courtTypes.find(ct => ct.value === formData.courtType)?.label || 'Not selected'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Case Title:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                {formData.title || 'Not provided'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Description:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                {formData.description ? formData.description.substring(0, 200) + '...' : 'Not provided'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">Filing Date:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                {formData.date || 'Not set'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">Legal Acts:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                {formData.legalActs.length} act(s) specified
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
                        <Typography variant="body2">
                          Please review all information carefully before submitting. Once created, the case will be assigned a unique Indian case number and enter the legal system for processing.
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                  }}
                >
                  Back
                </Button>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      borderColor: '#64748b',
                      color: '#64748b',
                    }}
                  >
                    Cancel
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <FileUpload />}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        boxShadow: '0 4px 15px rgba(30, 58, 138, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                          boxShadow: '0 6px 20px rgba(30, 58, 138, 0.4)',
                        },
                      }}
                    >
                      {loading ? 'Creating Case...' : 'Submit Case'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      variant="contained"
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      {/* Template Selection Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Article />
          Indian Legal Case Templates
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
              <Tab label="Popular Templates" />
              <Tab label="Recent Templates" />
              <Tab label="All Templates" />
            </Tabs>
          </Box>
          
          {templatesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {indianTemplates.slice(0, 6).map((template, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card
                    onClick={() => handleTemplateSelect(template)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, fontSize: '1rem' }}>
                        {template.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {template.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={template.caseType} size="small" color="primary" />
                        <Chip label={template.courtType} size="small" variant="outlined" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setTemplateDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateCase;
