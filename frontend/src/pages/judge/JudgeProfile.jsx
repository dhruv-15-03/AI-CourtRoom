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
  useTheme,
} from '@mui/material';

const presetAvatars = ['/avatars/avatar1.png','/avatars/avatar2.png','/avatars/avatar3.png'];
const dummyJudge = {
  firstName: 'Arun',
  lastName: 'Sinha',
  email: 'arun.sinha@court.gov',
  mobile: '9123456780',
  bench: 'Criminal',
  years: 12,
  avatar: '/avatars/avatar1.png',
};

export default function JudgeProfile({ mode, setMode }) {
  const theme = useTheme();
  const [judge, setJudge] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    setJudge(dummyJudge);
    setForm(dummyJudge);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (!judge) return null;

  const borderStyle =
    theme.palette.mode === 'dark'
      ? { border: '3px solid', borderImage: 'linear-gradient(135deg,#9c27b0,#ce93d8) 1' }
      : { border: '3px solid', borderImage: 'linear-gradient(135deg,#81d4fa,#b2ebf2) 1' };

  return (
    <Box className="mx-auto max-w-sm py-8">
      <Card sx={{ p: 3, ...borderStyle, background: theme.palette.background.paper }}>
        <CardContent>
          <Box display="flex" justifyContent="center" mb={2}>
            <Avatar src={judge.avatar} sx={{ width: 100, height: 100 }} />
          </Box>
          <Typography align="center" variant="h5" className="font-semibold">
            {judge.firstName} {judge.lastName}
          </Typography>
          <Typography align="center" color="textSecondary" mb={3}>
            {judge.bench} Bench, {judge.years} yrs
          </Typography>
          <Box className="space-y-1">
            <Typography><strong>Email:</strong> {judge.email}</Typography>
            <Typography><strong>Mobile:</strong> {judge.mobile}</Typography>
          </Box>
          <Box textAlign="center" mt={3}>
            <Button variant="contained" onClick={() => setOpen(true)}>
              Edit Profile
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            {['firstName','lastName','email','mobile','bench','years'].map((name) => (
              <Grid item xs={12} sm={name==='years'?6:12} key={name}>
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
                {presetAvatars.map((url,i) => (
                  <MenuItem key={i} value={url}>
                    <Box display="flex" alignItems="center">
                      <Avatar src={url} sx={{ mr: 1 }} /> Avatar {i+1}
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
              setJudge(form);
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
