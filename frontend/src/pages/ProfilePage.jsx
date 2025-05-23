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
  ToggleButton,
  ToggleButtonGroup,
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
  role: 'user',
  password: '**********',
  avatar: '/avatars/avatar1.png',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [enrollmentError, setEnrollmentError] = useState('');
  const [judgeModalOpen, setJudgeModalOpen] = useState(false);
  const [judgeType, setJudgeType] = useState('District');
  const [districtId, setDistrictId] = useState('');
  const [higherTitle, setHigherTitle] = useState('Justice');
  const [surname, setSurname] = useState('');
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    setProfile(dummyProfileData);
    setForm(dummyProfileData);
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      if (value === 'lawyer') {
        setEnrollmentModalOpen(true);
        return;
      }
      if (value === 'judge') {
        setJudgeModalOpen(true);
        return;
      }
    }
    setForm({ ...form, [name]: value });
  };

  const handleSave = () => {
    setProfile(form);
    setOpen(false);
  };

  if (!profile) return null;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" mb={2}>
            <Avatar src={profile.avatar} sx={{ width: 100, height: 100 }} />
          </Box>
          <Typography variant="h6" align="center">
            {profile.firstName} {profile.lastName}
          </Typography>
          <Typography align="center" color="textSecondary">
            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </Typography>
          <Box mt={2}>
            <Typography><b>Email:</b> {profile.email}</Typography>
            <Typography><b>Mobile:</b> {profile.mobile}</Typography>
            <Typography><b>Password:</b> *********</Typography>
          </Box>
          <Box textAlign="center" mt={3}>
            <Button variant="outlined" onClick={handleOpen}>
              Edit Profile
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
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
                type="password"
                value={form.password}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Role"
                name="role"
                value={form.role}
                onChange={handleChange}
                fullWidth
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

      {/* Lawyer Enrollment Modal */}
      <Dialog open={enrollmentModalOpen} onClose={() => {
        setEnrollmentModalOpen(false);
        setForm({ ...form, role: 'user' });
        setEnrollmentNo('');
        setEnrollmentError('');
      }} fullWidth maxWidth="xs">
        <DialogTitle>Lawyer Enrollment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Enrollment Number"
            fullWidth
            value={enrollmentNo}
            onChange={(e) => setEnrollmentNo(e.target.value)}
            error={!!enrollmentError}
            helperText={enrollmentError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEnrollmentModalOpen(false);
            setForm({ ...form, role: 'user' });
            setEnrollmentNo('');
            setEnrollmentError('');
          }}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            if (enrollmentNo === 'LAWYER123') {
              setEnrollmentModalOpen(false);
              setEnrollmentError('');
            } else {
              setEnrollmentError('Invalid Enrollment Number');
            }
          }}>Verify</Button>
        </DialogActions>
      </Dialog>

      {/* Judge Verification Modal */}
      <Dialog open={judgeModalOpen} onClose={() => {
        setJudgeModalOpen(false);
        setForm({ ...form, role: 'user' });
        setVerificationError('');
      }} fullWidth maxWidth="sm">
        <DialogTitle>Judge Verification</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" my={2}>
            <ToggleButtonGroup
              value={judgeType}
              exclusive
              onChange={(e, val) => val && setJudgeType(val)}
            >
              <ToggleButton value="District">District Judge</ToggleButton>
              <ToggleButton value="Higher">Higher Court Judge</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {judgeType === 'District' ? (
            <TextField
              fullWidth
              margin="dense"
              label="District Judge ID"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              error={!!verificationError && judgeType==='District'}
              helperText={judgeType==='District' ? verificationError : ''}
            />
          ) : (
            <Grid container spacing={2} mt={1}>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Title"
                  value={higherTitle}
                  onChange={(e) => setHigherTitle(e.target.value)}
                >
                  <MenuItem value="Justice">Justice</MenuItem>
                  <MenuItem value="Chief Justice">Chief Justice</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  error={!!verificationError && judgeType==='Higher'}
                  helperText={judgeType==='Higher' ? verificationError : ''}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setJudgeModalOpen(false);
            setForm({ ...form, role: 'user' });
            setVerificationError('');
          }}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            if ((judgeType === 'District' && districtId === 'D123') ||
                (judgeType === 'Higher' && (higherTitle === 'Justice' || higherTitle === '\Chief Justice') && surname === 'Verma')) {
              setJudgeModalOpen(false);
              setForm({ ...form, role: 'judge' });
              setVerificationError('');
            } else {
              setVerificationError(
                judgeType === 'District'
                  ? 'Invalid District Judge ID'
                  : 'Invalid Higher Court credentials'
              );
            }
          }}>Verify</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
