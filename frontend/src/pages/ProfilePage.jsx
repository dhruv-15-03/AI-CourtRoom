import { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';

const presetAvatars = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
];

const dummyProfileData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@example.com',
  mobile: '9876543210',
  role: 'User',
  password:'**********',
  avatar: '/avatars/avatar1.png',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    setProfile(dummyProfileData);
    setForm(dummyProfileData);
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setProfile(form); 
    setOpen(false);
  };

  if (!profile) return null;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card sx={{alignItems:'centre'}}>
        <CardContent>
          <Box display="flex" justifyContent="center" mb={2}>
            <Avatar src={profile.avatar} sx={{ width: 100, height: 100 }} />
          </Box>
          <Typography variant="h6" align="center">{profile.firstName} {profile.lastName}</Typography>
          <Typography align="center" color="textSecondary">{profile.role}</Typography>
          <Box mt={2}>
            <Typography><b>Email:</b> {profile.email}</Typography>
            <Typography><b>Mobile:</b> {profile.mobile}</Typography>
            <Typography><b>Password:</b> *********</Typography>
          </Box>
          <Box textAlign="center" mt={3}>
            <Button variant="outlined" onClick={handleOpen}>Edit Profile</Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mobile"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                      select
                      label="Role"
                      value={form.role}
                      onChange={handleChange}
                      fullWidth
                      sx={
                        {width: '100px'}
                    }
                      margin="normal"
                      required
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="lawyer">Lawyer</MenuItem>
                      <MenuItem value="judge">Judge</MenuItem>
                    </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Avatar"
                name="avatar"
                value={form.avatar}
                onChange={handleChange}
                sx={
                    {width: '160px'}
                }
              >
                {presetAvatars.map((url, index) => (
                  <MenuItem key={index} value={url}>
                    <Box display="flex" alignItems="center">
                      <Avatar src={url} sx={{ mr: 1 }} /> Avatar {index + 1}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}