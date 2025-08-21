import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FormWrapper from '../components/FormWrapper';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = ({ showNotification }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    // Lawyer specific fields
    specialisation: '',
    fees: '',
    description: '',
    // Judge specific fields
    bench: '',
    years: '',
    court: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Role-specific validation
    if (formData.role === 'lawyer') {
      if (!formData.specialisation.trim()) {
        newErrors.specialisation = 'Specialization is required for lawyers';
      }
      if (!formData.fees || formData.fees < 0) {
        newErrors.fees = 'Valid fees amount is required';
      }
    }
    
    if (formData.role === 'judge') {
      if (!formData.bench.trim()) {
        newErrors.bench = 'Bench is required for judges';
      }
      if (!formData.years || formData.years < 0) {
        newErrors.years = 'Years of experience is required';
      }
      if (!formData.court.trim()) {
        newErrors.court = 'Court is required for judges';
      }
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
      // Prepare UI payload; normalization to backend happens in AuthContext.register
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase(),
        mobile: parseInt(formData.mobile),
        password: formData.password,
        role: formData.role, // 'user' | 'lawyer' | 'judge' (mapped later)
        ...(formData.role === 'lawyer' && {
          specialisation: formData.specialisation.trim(),
          fees: parseInt(formData.fees),
          description: (formData.description || '').trim() || 'Experienced lawyer',
          image: ''
        }),
        ...(formData.role === 'judge' && {
          bench: formData.bench.trim(),
          years: parseInt(formData.years), // will be mapped to experience
          court: formData.court.trim()
        })
      };

      const result = await register(userData);
      
      if (result.success) {
        showNotification && showNotification('Registration successful! Welcome to AI Courtroom.', 'success');
        
        // Navigate based on role
        const redirectPath = 
          formData.role === 'lawyer' ? '/lawyer/dashboard' :
          formData.role === 'judge' ? '/judge/dashboard' : '/';
        
        navigate(redirectPath);
      } else {
        showNotification && showNotification(result.error, 'error');
      }
    } catch (err) {
      showNotification && showNotification('Registration failed. Please try again.', 'error');
    }
  };

  return (
    <FormWrapper>
      <Typography variant="h5" mb={2} align="center" fontWeight="600">
        Create Account
      </Typography>
      <Typography variant="body2" mb={3} align="center" color="textSecondary">
        Join AI Courtroom and get started today
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField 
            label="First Name" 
            name="firstName"
            fullWidth 
            margin="normal" 
            required 
            value={formData.firstName}
            onChange={handleChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
            disabled={loading}
          />
          <TextField 
            label="Last Name" 
            name="lastName"
            fullWidth 
            margin="normal" 
            required 
            value={formData.lastName}
            onChange={handleChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
            disabled={loading}
          />
        </Box>

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
          label="Mobile Number" 
          name="mobile"
          type="tel" 
          fullWidth 
          margin="normal" 
          required 
          value={formData.mobile}
          onChange={handleChange}
          error={!!errors.mobile}
          helperText={errors.mobile}
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
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          label="Register as"
          name="role"
          value={formData.role}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          error={!!errors.role}
          helperText={errors.role}
          disabled={loading}
        >
          <MenuItem value="user">User</MenuItem>
          <MenuItem value="lawyer">Lawyer</MenuItem>
          <MenuItem value="judge">Judge</MenuItem>
        </TextField>

        {/* Lawyer specific fields */}
        {formData.role === 'lawyer' && (
          <>
            <TextField
              label="Specialization"
              name="specialisation"
              fullWidth
              margin="normal"
              required
              value={formData.specialisation}
              onChange={handleChange}
              error={!!errors.specialisation}
              helperText={errors.specialisation}
              disabled={loading}
              placeholder="e.g., Criminal Law, Civil Law, Corporate Law"
            />
            <TextField
              label="Consultation Fees (₹)"
              name="fees"
              type="number"
              fullWidth
              margin="normal"
              required
              value={formData.fees}
              onChange={handleChange}
              error={!!errors.fees}
              helperText={errors.fees}
              disabled={loading}
            />
            <TextField
              label="Professional Description"
              name="description"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              placeholder="Brief description of your expertise and experience"
            />
          </>
        )}

        {/* Judge specific fields */}
        {formData.role === 'judge' && (
          <>
            <TextField
              label="Bench/Jurisdiction"
              name="bench"
              fullWidth
              margin="normal"
              required
              value={formData.bench}
              onChange={handleChange}
              error={!!errors.bench}
              helperText={errors.bench}
              disabled={loading}
              placeholder="e.g., Criminal, Civil, Family"
            />
            <TextField
              label="Years of Experience"
              name="years"
              type="number"
              fullWidth
              margin="normal"
              required
              value={formData.years}
              onChange={handleChange}
              error={!!errors.years}
              helperText={errors.years}
              disabled={loading}
            />
            <TextField
              label="Court"
              name="court"
              fullWidth
              margin="normal"
              required
              value={formData.court}
              onChange={handleChange}
              error={!!errors.court}
              helperText={errors.court}
              disabled={loading}
              placeholder="e.g., District Court, High Court"
            />
          </>
        )}

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
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2" color="textSecondary">
            Already have an account?{' '}
            <Button 
              variant="text" 
              onClick={() => navigate('/login')}
              disabled={loading}
              sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
            >
              Sign in here
            </Button>
          </Typography>
        </Box>
      </Box>
    </FormWrapper>
  );
};

export default RegisterPage;
