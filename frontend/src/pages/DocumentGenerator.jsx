/**
 * AI Document Generator — craft court-ready legal drafts.
 * Uses the Python agent's /api/agent/generate-document endpoint.
 */
import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Button, Stack, Alert, LinearProgress,
  Divider, Chip, IconButton, Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import GavelIcon from '@mui/icons-material/Gavel';
import { agentService } from '../services/api';

export default function DocumentGenerator() {
  const [types, setTypes] = useState([]);
  const [docType, setDocType] = useState('');
  const [caseInfo, setCaseInfo] = useState('');
  const [instructions, setInstructions] = useState('');
  const [sessionId, setSessionId] = useState(
    localStorage.getItem('ai.sessionId') || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await agentService.getDocumentTypes();
        const list = res.data?.document_types || [];
        setTypes(list);
        if (list.length && !docType) setDocType(list[0].id);
      } catch (e) {
        setError('Failed to load document types');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (!docType) { setError('Pick a document type'); return; }
    if (!caseInfo && !sessionId) {
      setError('Provide case details or a session ID'); return;
    }
    setLoading(true); setError(''); setDoc(null);
    try {
      const res = await agentService.generateDocument(docType, {
        case_info: caseInfo,
        session_id: sessionId || undefined,
        user_instructions: instructions,
      });
      setDoc(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Generation failed');
    } finally { setLoading(false); }
  };

  const copyDoc = () => {
    if (!doc?.content) return;
    navigator.clipboard.writeText(doc.content);
  };

  const downloadDoc = () => {
    if (!doc?.content) return;
    const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.doc_type || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selected = types.find(t => t.id === docType);

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <GavelIcon color="primary" />
        <Typography variant="h4" fontWeight={700}>AI Document Drafter</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Generate court-ready Indian legal documents — bail applications, appeals,
        writ petitions, replies and more. Based on the AI Lawyer's analysis of
        your case.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Document type</InputLabel>
            <Select
              value={docType} label="Document type"
              onChange={e => setDocType(e.target.value)}
            >
              {types.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {selected?.sections?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Includes sections:
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {selected.sections.map(s => (
                  <Chip key={s} size="small" label={s} sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>
            </Box>
          )}

          <TextField
            label="Case details" multiline minRows={4}
            placeholder="Facts, parties, sections involved, relief sought…"
            value={caseInfo} onChange={e => setCaseInfo(e.target.value)}
          />
          <TextField
            label="Specific instructions (optional)" multiline minRows={2}
            placeholder="e.g. Emphasize lack of direct evidence, cite Arnesh Kumar…"
            value={instructions} onChange={e => setInstructions(e.target.value)}
          />
          <TextField
            label="Session ID (optional)" size="small"
            placeholder="Continues from an AI Lawyer chat session"
            value={sessionId} onChange={e => setSessionId(e.target.value)}
          />

          {error && <Alert severity="error">{error}</Alert>}
          {loading && <LinearProgress />}

          <Box>
            <Button
              variant="contained" size="large"
              onClick={handleGenerate} disabled={loading}
            >
              {loading ? 'Drafting…' : 'Generate document'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {doc && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6">{doc.title}</Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Copy"><IconButton onClick={copyDoc}><ContentCopyIcon /></IconButton></Tooltip>
              <Tooltip title="Download .md"><IconButton onClick={downloadDoc}><DownloadIcon /></IconButton></Tooltip>
            </Stack>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6, m: 0,
            }}
          >
            {doc.content}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
