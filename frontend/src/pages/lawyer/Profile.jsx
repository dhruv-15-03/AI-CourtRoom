import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  useTheme,
} from '@mui/material';
import LawyerLayout from '../../components/LawyerLayout';

const presetAvatars = ['/avatars/avatar1.png','/avatars/avatar2.png','/avatars/avatar3.png'];
const dummyLawyer = {
  firstName: 'Ravi',
  lastName: 'Patel',
  email: 'ravi@law.com',
  mobile: '9876543210',
  description:'Best in Business',
  specialization: 'Criminal Law',
  fees: 2000,
  avatar: '/avatars/avatar2.png',
};

export default function Profile() {
  const theme = useTheme();
  const [lawyer, setLawyer] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    // Simulate backend fetch
    setTimeout(() => {
      setLawyer(dummyLawyer);
      setForm(dummyLawyer);
    }, 500);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!lawyer) {
    return (
      <LawyerLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </LawyerLayout>
    );
  }

  // card border gradient based on theme
  const borderStyle =
    theme.palette.mode === 'dark'
      ? {
          border: '3px solid transparent',
          borderImage: 'linear-gradient(135deg, #9c27b0, #ce93d8) 1',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }
      : {
          border: '3px solid transparent',
          borderImage: 'linear-gradient(135deg, #81d4fa, #b2ebf2) 1',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        };

  return (
    <LawyerLayout>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)', 
          backgroundColor: theme.palette.background.default,
          py: 8,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          My Profile
        </Typography>
        <Card sx={{ width: 400, ...borderStyle, backgroundColor: theme.palette.background.paper }}>
          <CardContent>
            <Box display="flex" justifyContent="center" mb={2}>
              <Avatar src={lawyer.avatar} sx={{ width: 120, height: 120 }} />
            </Box>
            <Typography align="center" variant="h5" sx={{ fontWeight: 'bold' }}>
              {lawyer.firstName} {lawyer.lastName}
            </Typography>
            <Typography align="center" color="textSecondary" mb={3}>
              {lawyer.specialization}
            </Typography>
            <Box mb={2}>
              <Typography sx={{ mb: 1 }}>
                <strong>Email:</strong> {lawyer.email}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Mobile:</strong> {lawyer.mobile}
              </Typography>
              <Typography>
                <strong>Fees:</strong> ₹{lawyer.fees}
              </Typography>
            </Box>
            <Typography align="center" color="textSecondary" mb={3}>
              {lawyer.description}
            </Typography>
            <Box textAlign="center">
              <Button variant="contained" onClick={() => setOpen(true)}>
                Edit Profile
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {['firstName', 'lastName', 'email', 'mobile','description', 'specialization', 'fees'].map((name) => (
                <Grid item xs={12} sm={name === 'fees' ? 6 : 12} key={name}>
                  <TextField
                    fullWidth
                    name={name}
                    label={name.charAt(0).toUpperCase() + name.slice(1)}
                    value={form[name]}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  name="avatar"
                  label="Avatar"
                  value={form.avatar}
                  onChange={handleChange}
                >
                  {presetAvatars.map((url, i) => (
                    <MenuItem key={i} value={url}>
                      <Box display="flex" alignItems="center">
                        <Avatar src={url} sx={{ mr: 1 }} /> Avatar {i + 1}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                setLawyer(form);
                setOpen(false);
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LawyerLayout>
  );
}
