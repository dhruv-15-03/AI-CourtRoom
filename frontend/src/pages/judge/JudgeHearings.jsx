/**
 * Judge Hearing Calendar — schedule, view, adjourn, and complete hearings.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Alert, LinearProgress, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Badge,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventIcon from '@mui/icons-material/Event';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import { hearingService } from '../../services/api';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const HEARING_TYPES = [
  'ADMISSION', 'INTERIM', 'EVIDENCE', 'CROSS_EXAMINATION',
  'ARGUMENTS', 'JUDGMENT', 'MISCELLANEOUS', 'STATUS_REPORT', 'COMPLIANCE',
];
const STATUS_COLORS = {
  SCHEDULED: 'primary', COMPLETED: 'success', ADJOURNED: 'warning',
  CANCELLED: 'error', POSTPONED: 'default', IN_PROGRESS: 'info',
};

export default function JudgeHearings() {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState('upcoming'); // upcoming | date
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [adjournOpen, setAdjournOpen] = useState(null);    // hearing obj or null
  const [completeOpen, setCompleteOpen] = useState(null);   // hearing obj or null
  const [wsEvents, setWsEvents] = useState([]);

  // ── Fetch ─────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = viewMode === 'upcoming'
        ? await hearingService.upcoming()
        : await hearingService.byDate(selectedDate);
      setHearings(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load hearings');
    } finally { setLoading(false); }
  }, [viewMode, selectedDate]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── WebSocket for real-time hearing events ────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
    const client = Stomp.over(socket);
    client.debug = () => {};
    let sub;
    client.connect({ Authorization: `Bearer ${token}` }, () => {
      sub = client.subscribe('/group/hearings', (msg) => {
        try {
          const evt = JSON.parse(msg.body);
          setWsEvents(prev => [evt, ...prev].slice(0, 20));
          refresh(); // auto-refresh on any hearing event
        } catch { /* ignore */ }
      });
    }, () => {});
    return () => { try { sub?.unsubscribe(); client.disconnect(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Schedule dialog ───────────────────────────────────
  const [form, setForm] = useState({
    caseId: '', hearingType: 'ARGUMENTS', hearingDateTime: '',
    courtRoom: '', purpose: '',
  });

  const handleSchedule = async () => {
    setError('');
    try {
      await hearingService.schedule(form);
      setInfo('Hearing scheduled');
      setScheduleOpen(false);
      setForm({ caseId: '', hearingType: 'ARGUMENTS', hearingDateTime: '', courtRoom: '', purpose: '' });
      refresh();
    } catch (e) { setError(e?.response?.data?.error || 'Schedule failed'); }
  };

  // ── Adjourn ───────────────────────────────────────────
  const [adjReason, setAdjReason] = useState('');
  const [adjNext, setAdjNext] = useState('');
  const handleAdjourn = async () => {
    try {
      await hearingService.adjourn(adjournOpen.id, {
        reason: adjReason, nextDate: adjNext || undefined,
      });
      setInfo('Hearing adjourned'); setAdjournOpen(null);
      setAdjReason(''); setAdjNext(''); refresh();
    } catch (e) { setError(e?.response?.data?.error || 'Adjourn failed'); }
  };

  // ── Complete ──────────────────────────────────────────
  const [proceedings, setProceedings] = useState('');
  const [order, setOrder] = useState('');
  const handleComplete = async () => {
    try {
      await hearingService.complete(completeOpen.id, {
        proceedings, orderPassed: order || undefined,
      });
      setInfo('Hearing completed'); setCompleteOpen(null);
      setProceedings(''); setOrder(''); refresh();
    } catch (e) { setError(e?.response?.data?.error || 'Complete failed'); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <EventIcon color="primary" />
          <Typography variant="h4" fontWeight={700}>Hearing Calendar</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh"><IconButton onClick={refresh}><RefreshIcon /></IconButton></Tooltip>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setScheduleOpen(true)}>
            Schedule hearing
          </Button>
        </Stack>
      </Stack>

      {/* View toggle */}
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <Button variant={viewMode === 'upcoming' ? 'contained' : 'outlined'} size="small"
          onClick={() => setViewMode('upcoming')}>
          Upcoming (30 days)
        </Button>
        <Button variant={viewMode === 'date' ? 'contained' : 'outlined'} size="small"
          onClick={() => setViewMode('date')}>
          By date
        </Button>
        {viewMode === 'date' && (
          <TextField type="date" size="small" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} sx={{ width: 180 }} />
        )}
      </Stack>

      {/* Live event ticker */}
      {wsEvents.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setWsEvents([])}>
          Latest: <b>{wsEvents[0]?.type}</b> — Case #{wsEvents[0]?.caseId}
          {wsEvents[0]?.courtRoom && ` in ${wsEvents[0].courtRoom}`}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {info && <Alert severity="success" onClose={() => setInfo('')} sx={{ mb: 2 }}>{info}</Alert>}

      {/* Hearing list */}
      {hearings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No hearings found.</Typography>
        </Paper>
      ) : hearings.map(h => (
        <Paper key={h.id} sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight={600}>
                Case #{h.courtCase?.id || h.caseId} — {h.hearingType}
              </Typography>
              <Chip size="small" label={h.status} color={STATUS_COLORS[h.status] || 'default'} />
              {h.courtRoom && <Chip size="small" variant="outlined" label={h.courtRoom} />}
            </Stack>
            <Stack direction="row" spacing={0.5}>
              {h.status === 'SCHEDULED' && (
                <>
                  <Tooltip title="Complete">
                    <IconButton color="success" onClick={() => setCompleteOpen(h)}>
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Adjourn">
                    <IconButton color="warning" onClick={() => setAdjournOpen(h)}>
                      <PauseCircleIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {h.hearingDateTime ? new Date(h.hearingDateTime).toLocaleString() : ''}
            {h.purpose ? ` — ${h.purpose}` : ''}
          </Typography>
          {h.proceedings && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <b>Proceedings:</b> {h.proceedings}
            </Typography>
          )}
          {h.orderPassed && (
            <Typography variant="body2">
              <b>Order:</b> {h.orderPassed}
            </Typography>
          )}
        </Paper>
      ))}

      {/* ── Schedule Dialog ────────────────────────────── */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Hearing</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Case ID" type="number" value={form.caseId}
              onChange={e => setForm(f => ({ ...f, caseId: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={form.hearingType} label="Type"
                onChange={e => setForm(f => ({ ...f, hearingType: e.target.value }))}>
                {HEARING_TYPES.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Date & Time" type="datetime-local" value={form.hearingDateTime}
              onChange={e => setForm(f => ({ ...f, hearingDateTime: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
            <TextField label="Court Room" value={form.courtRoom}
              onChange={e => setForm(f => ({ ...f, courtRoom: e.target.value }))} />
            <TextField label="Purpose" multiline minRows={2} value={form.purpose}
              onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSchedule}
            disabled={!form.caseId || !form.hearingDateTime}>Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* ── Adjourn Dialog ─────────────────────────────── */}
      <Dialog open={!!adjournOpen} onClose={() => setAdjournOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjourn Hearing</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Reason" multiline minRows={2} value={adjReason}
              onChange={e => setAdjReason(e.target.value)} />
            <TextField label="Next hearing date (optional)" type="datetime-local" value={adjNext}
              onChange={e => setAdjNext(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjournOpen(null)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleAdjourn}
            disabled={!adjReason}>Adjourn</Button>
        </DialogActions>
      </Dialog>

      {/* ── Complete Dialog ─────────────────────────────── */}
      <Dialog open={!!completeOpen} onClose={() => setCompleteOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Hearing Completion</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Proceedings" multiline minRows={3} value={proceedings}
              onChange={e => setProceedings(e.target.value)} />
            <TextField label="Order passed (optional)" multiline minRows={2} value={order}
              onChange={e => setOrder(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteOpen(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleComplete}
            disabled={!proceedings}>Mark completed</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
