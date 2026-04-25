/**
 * Virtual Courtroom — video conference stub for future integration.
 * Displays hearing information and a placeholder for video conferencing.
 */
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Button, Chip, Alert, Divider,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonIcon from '@mui/icons-material/Person';
import { useParams, useNavigate } from 'react-router-dom';
import { hearingService } from '../../services/api';

export default function VirtualCourtroom() {
  const { hearingId } = useParams();
  const navigate = useNavigate();
  const [hearing, setHearing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hearingId) return;
    (async () => {
      try {
        const res = await hearingService.get(hearingId);
        setHearing(res.data);
      } catch (e) {
        setError('Failed to load hearing details');
      }
    })();
  }, [hearingId]);

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <VideocamIcon color="primary" fontSize="large" />
        <Typography variant="h4" fontWeight={700}>Virtual Courtroom</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {hearing && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" alignItems="center">
            <GavelIcon fontSize="small" />
            <Typography variant="h6">
              Case #{hearing.courtCase?.id || '?'} — {hearing.hearingType?.replace(/_/g, ' ')}
            </Typography>
            <Chip size="small" label={hearing.status} color="primary" />
            {hearing.courtRoom && <Chip size="small" variant="outlined" label={hearing.courtRoom} />}
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Scheduled: {hearing.hearingDateTime ? new Date(hearing.hearingDateTime).toLocaleString() : 'N/A'}
          </Typography>
          {hearing.purpose && <Typography variant="body2"><b>Purpose:</b> {hearing.purpose}</Typography>}
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {hearing.presidingJudge && (
              <Chip icon={<PersonIcon />} label={`Judge: ${hearing.presidingJudge}`} />
            )}
            {hearing.presentAdvocates && (
              <Chip icon={<PersonIcon />} label={`Advocates: ${hearing.presentAdvocates}`} />
            )}
          </Stack>
        </Paper>
      )}

      {/* Video placeholder */}
      <Paper
        sx={{
          p: 6, textAlign: 'center',
          bgcolor: 'grey.900', color: 'grey.300',
          borderRadius: 2, minHeight: 350,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <VideocamIcon sx={{ fontSize: 80, mb: 2, opacity: 0.4 }} />
        <Typography variant="h5" sx={{ mb: 1 }}>Video Conference</Typography>
        <Typography variant="body2" sx={{ mb: 3, maxWidth: 500 }}>
          This is a placeholder for the virtual courtroom video integration.
          Connect a WebRTC provider (e.g. Jitsi, Twilio, Daily.co) here
          for real-time audio/video hearings.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="success" startIcon={<VideocamIcon />} disabled>
            Join hearing
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Stack>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <b>Coming soon:</b> End-to-end encrypted video conferencing with court recording,
        transcript generation, and exhibit sharing — integrated directly into the AI Courtroom platform.
      </Alert>
    </Box>
  );
}
