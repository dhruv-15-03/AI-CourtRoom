/**
 * Judge Audit Log — view all system actions across Java + Python services.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Alert, LinearProgress,
  TextField, Button, TableContainer, Table, TableHead, TableBody,
  TableRow, TableCell, TablePagination, Tabs, Tab, IconButton, Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import { auditService } from '../../services/api';

const ACTION_COLORS = {
  CREATE: 'success', UPDATE: 'info', DELETE: 'error', LOGIN: 'primary',
  ANALYZE: 'secondary', RETRAIN: 'warning', GENERATE: 'info',
};

function colorFor(action) {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if ((action || '').toUpperCase().includes(key)) return color;
  }
  return 'default';
}

export default function JudgeAuditLog() {
  const [tab, setTab] = useState(0); // 0=Java, 1=AI
  const [javaEntries, setJavaEntries] = useState([]);
  const [aiEntries, setAiEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalJava, setTotalJava] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (tab === 0) {
        const res = await auditService.getLog(page, rowsPerPage);
        const data = res.data;
        setJavaEntries(data?.content || data?.entries || (Array.isArray(data) ? data : []));
        setTotalJava(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
      } else {
        const res = await auditService.getAILog(500);
        setAiEntries(res.data?.entries || []);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load audit log');
    } finally { setLoading(false); }
  }, [tab, page, rowsPerPage]);

  useEffect(() => { refresh(); }, [refresh]);

  const entries = tab === 0 ? javaEntries : aiEntries;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <HistoryIcon color="primary" />
          <Typography variant="h4" fontWeight={700}>Audit Log</Typography>
        </Stack>
        <Tooltip title="Refresh"><IconButton onClick={refresh}><RefreshIcon /></IconButton></Tooltip>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label="Court Actions (Java)" />
        <Tab label="AI Service Actions" />
      </Tabs>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      {entries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No audit entries found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((e, i) => (
                <TableRow key={e.id || i} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                    {e.timestamp
                      ? new Date(e.timestamp).toLocaleString()
                      : ''}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{e.actor || e.email || '-'}</Typography>
                    {e.role && <Chip size="small" label={e.role} sx={{ ml: 0.5 }} />}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={e.action || '?'} color={colorFor(e.action)} />
                  </TableCell>
                  <TableCell>
                    {e.entityType || e.entity_type
                      ? `${e.entityType || e.entity_type}#${e.entityId || e.entity_id || ''}`
                      : '-'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                      {typeof e.details === 'string' ? e.details : JSON.stringify(e.details || '')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {tab === 0 && (
            <TablePagination
              component="div" count={totalJava}
              page={page} onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
            />
          )}
        </TableContainer>
      )}
    </Box>
  );
}
