import React, { useState } from 'react';
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
  Divider,
} from '@mui/material';
import { Add, Description, CalendarToday, Gavel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { caseService } from '../services/api';

const CreateCase = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    next: '', // Next hearing date
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.description.trim()) {
        throw new Error('Case description is required');
      }

      const response = await caseService.createCase(formData);
      
      setSuccess('Case created successfully!');
      
      // Redirect to cases page after a short delay
      setTimeout(() => {
        navigate('/cases');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating case:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/cases');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              color: 'white',
              mb: 2,
              boxShadow: '0 8px 24px rgba(30, 58, 138, 0.3)',
            }}
          >
            <Gavel sx={{ fontSize: 40 }} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: '#1e3a8a',
              mb: 1,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Create New Case
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: 500,
              mx: 'auto',
            }}
          >
            Initiate a new legal case by providing the necessary details below.
            All fields marked with * are required.
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

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

        {/* Form */}
        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                {/* Case Description */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Description sx={{ color: '#1e3a8a', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                      Case Details
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Case Description *"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide a detailed description of the case, including relevant facts, issues, and background information..."
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&.Mui-focused fieldset': {
                          borderColor: '#1e3a8a',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#1e3a8a',
                      },
                    }}
                  />
                </Grid>

                {/* Dates */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarToday sx={{ color: '#1e3a8a', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                      Important Dates
                    </Typography>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Case Filing Date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&.Mui-focused fieldset': {
                              borderColor: '#1e3a8a',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1e3a8a',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Next Hearing Date (Optional)"
                        name="next"
                        value={formData.next}
                        onChange={handleChange}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&.Mui-focused fieldset': {
                              borderColor: '#1e3a8a',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1e3a8a',
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        borderColor: '#64748b',
                        color: '#64748b',
                        '&:hover': {
                          borderColor: '#475569',
                          backgroundColor: 'rgba(100, 116, 139, 0.04)',
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <Add />}
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
                        '&:disabled': {
                          background: 'rgba(30, 58, 138, 0.5)',
                        },
                      }}
                    >
                      {loading ? 'Creating Case...' : 'Create Case'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
};

export default CreateCase;
