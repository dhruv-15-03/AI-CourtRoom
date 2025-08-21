import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FormWrapper from '../components/FormWrapper';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = ({ showNotification }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Only send email and password for login
      const loginCredentials = {
        email: formData.email,
        password: formData.password
      };
      
      const result = await login(loginCredentials);
      
      if (result.success) {
        showNotification && showNotification('Login successful!', 'success');
        
        // Navigation will be handled by the App.js LandingRedirect based on actual user role
        navigate('/');
      } else {
        showNotification && showNotification(result.error, 'error');
      }
    } catch (err) {
      showNotification && showNotification('Login failed. Please try again.', 'error');
    }
  };

  return (
    <FormWrapper>
      <Typography variant="h5" mb={2} align="center" fontWeight="600">
        Welcome Back
      </Typography>
      <Typography variant="body2" mb={3} align="center" color="textSecondary">
        Sign in to your account to continue
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          name="email"
          type="email"
          fullWidth
          margin="normal"
          required
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          disabled={loading}
        />

        <TextField
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          required
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => setShowPassword(!showPassword)} 
                  edge="end"
                  disabled={loading}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button 
          type="submit"
          variant="contained" 
          color="primary" 
          fullWidth 
          size="large"
          disabled={loading}
          sx={{ mt: 3, mb: 2, py: 1.5 }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2" color="textSecondary">
            Don't have an account?{' '}
            <Button 
              variant="text" 
              onClick={() => navigate('/register')}
              disabled={loading}
              sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
            >
              Sign up here
            </Button>
          </Typography>
        </Box>
      </Box>
    </FormWrapper>
  );
};

export default LoginPage;
