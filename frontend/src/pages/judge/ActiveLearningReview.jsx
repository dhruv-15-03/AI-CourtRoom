/**
 * Active Learning Review — human-in-the-loop labeling UI.
 * Judges review low-confidence ML predictions and supply ground-truth labels.
 * Labels feed the LabeledDataStore and trigger retraining when the threshold hits.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Alert, LinearProgress,
  Divider, Tooltip, IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SyncIcon from '@mui/icons-material/Sync';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import { activeLearningService } from '../../services/api';

const OUTCOMES = [
  'Bail Granted', 'Bail Denied', 'Conviction', 'Acquittal',
  'Compensation Awarded', 'Case Dismissed', 'Pending',
  'Settlement', 'Divorce Granted', 'Custody Awarded',
];

export default function ActiveLearningReview() {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [selectedLabels, setSelectedLabels] = useState({});
  const [suggesting, setSuggesting] = useState({});
  const [suggestions, setSuggestions] = useState({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [qRes, sRes] = await Promise.all([
        activeLearningService.getQueue(),
        activeLearningService.stats(),
      ]);
      setQueue(qRes.data?.pending || []);
      setStats(sRes.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleLabel = async (item) => {
    const label = selectedLabels[item.id];
    if (!label) { setError('Pick a label first'); return; }
    setLoading(true);
    try {
      const res = await activeLearningService.label(item.id, { label, labeler: 'judge' });
      setInfo(res.data?.retrained
        ? `Labeled & model retrained (F1=${res.data?.retrain_meta?.f1_score?.toFixed?.(3) ?? 'n/a'})`
        : 'Label saved');
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.message || 'Label failed');
    } finally { setLoading(false); }
  };

  const handleSuggest = async (item) => {
    setSuggesting(s => ({ ...s, [item.id]: true }));
    try {
      const res = await activeLearningService.suggestLabel(item.text);
      const sug = res.data?.suggestion || res.data;
      setSuggestions(s => ({ ...s, [item.id]: sug }));
      if (sug?.suggested_label) {
        setSelectedLabels(l => ({ ...l, [item.id]: sug.suggested_label }));
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'LLM suggestion failed');
    } finally {
      setSuggesting(s => ({ ...s, [item.id]: false }));
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setError(''); setInfo('');
    try {
      const res = await activeLearningService.syncOutcomes({ auto_retrain: true });
      setInfo(`Synced ${res.data?.new_labels || 0} new outcomes from court records.` +
              (res.data?.retrained ? ' Model retrained.' : ''));
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.message || 'Sync failed');
    } finally { setLoading(false); }
  };

  const handleRetrain = async () => {
    setLoading(true);
    try {
      const res = await activeLearningService.retrain();
      setInfo(`Retrained. F1=${res.data?.f1_score?.toFixed?.(3) ?? 'n/a'}`);
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.message || 'Retrain failed');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" fontWeight={700}>Active Learning — Review Queue</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh"><IconButton onClick={refresh}><RefreshIcon /></IconButton></Tooltip>
          <Button size="small" startIcon={<SyncIcon />} onClick={handleSync}>
            Sync court outcomes
          </Button>
          <Button size="small" variant="contained" startIcon={<ModelTrainingIcon />}
            onClick={handleRetrain} disabled={!stats?.retrain_ready}>
            Retrain now{stats?.retrain_ready ? '' : ' (not ready)'}
          </Button>
        </Stack>
      </Stack>

      {stats && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Typography variant="body2"><b>Queue:</b> {stats.queue_size}</Typography>
            <Typography variant="body2"><b>Labels stored:</b> {stats.labels_stored}</Typography>
            <Typography variant="body2"><b>Retrain threshold:</b> {stats.retrain_threshold}</Typography>
            <Typography variant="body2">
              <b>Retrain ready:</b> {stats.retrain_ready ? 'Yes' : 'No'}
            </Typography>
          </Stack>
        </Paper>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {info && <Alert severity="success" onClose={() => setInfo('')} sx={{ mb: 2 }}>{info}</Alert>}

      {queue.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Queue is empty. Low-confidence predictions will appear here automatically.
          </Typography>
        </Paper>
      ) : queue.map(item => {
        const sug = suggestions[item.id];
        return (
          <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
              <Chip size="small" label={`#${item.id.slice(0, 8)}`} />
              {typeof item.uncertainty === 'number' && (
                <Chip size="small" color="warning"
                  label={`Uncertainty: ${item.uncertainty.toFixed(3)}`} />
              )}
              {item.predicted_label && (
                <Chip size="small" label={`Predicted: ${item.predicted_label}`} />
              )}
              {item.case_type && <Chip size="small" variant="outlined" label={item.case_type} />}
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {item.text}
            </Typography>

            {sug && (
              <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ mb: 2 }}>
                <b>LLM suggests:</b> {sug.suggested_label}
                {sug.confidence != null && ` (conf ${Number(sug.confidence).toFixed(2)})`}
                {sug.reasoning && <Box component="span" sx={{ ml: 1, opacity: 0.8 }}>
                  — {sug.reasoning}
                </Box>}
              </Alert>
            )}

            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Ground-truth label</InputLabel>
                <Select
                  value={selectedLabels[item.id] || ''}
                  label="Ground-truth label"
                  onChange={e => setSelectedLabels(l => ({ ...l, [item.id]: e.target.value }))}
                >
                  {OUTCOMES.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Or type custom label"
                value={selectedLabels[item.id] || ''}
                onChange={e => setSelectedLabels(l => ({ ...l, [item.id]: e.target.value }))}
                sx={{ minWidth: 220 }}
              />
              <Button
                startIcon={<AutoAwesomeIcon />}
                onClick={() => handleSuggest(item)}
                disabled={!!suggesting[item.id]}
              >
                Ask LLM
              </Button>
              <Button
                variant="contained"
                onClick={() => handleLabel(item)}
                disabled={!selectedLabels[item.id]}
              >
                Save label
              </Button>
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
