import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import FormWrapper from '../components/FormWrapper';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('user');

  return (
    <FormWrapper>
      <Typography variant="h5" mb={2} align="center">
        Register
      </Typography>

      <TextField label="First Name" fullWidth margin="normal" required />
      <TextField label="Last Name" fullWidth margin="normal" required />
      <TextField label="Email" type="email" fullWidth margin="normal" required />
      <TextField label="Mobile Number" type="tel" fullWidth margin="normal" required />

      <TextField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        fullWidth
        margin="normal"
        required
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
        type={showConfirmPassword ? 'text' : 'password'}
        fullWidth
        margin="normal"
        required
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
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        fullWidth
        margin="normal"
        required
      >
        <MenuItem value="user">User</MenuItem>
        <MenuItem value="lawyer">Lawyer</MenuItem>
        <MenuItem value="judge">Judge</MenuItem>
      </TextField>

      <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
        Register
      </Button>
    </FormWrapper>
  );
};

export default RegisterPage;
