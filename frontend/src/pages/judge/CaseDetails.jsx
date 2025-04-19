import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

export default function CaseDetails() {
  const [judgmentText, setJudgmentText] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <Box className="mx-auto max-w-4xl py-8">
      <Typography variant="h5" className="font-serif font-bold mb-4">
        Case #A123: State vs. Mehta
      </Typography>

      <Paper className="p-6 mb-6">
        <Typography className="mb-2 font-medium">Facts & Description:</Typography>
        <Typography>
          The defendant is accused of… (full detailed description here)…
        </Typography>
      </Paper>

      <Button variant="contained" onClick={() => setOpen(true)}>
        Submit Judgment
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle className="font-bold">Enter Your Judgment</DialogTitle>
        <DialogContent dividers>
          <TextareaAutosize
            minRows={10}
            placeholder="Write your judgment here using markdown syntax (e.g. **bold**, _italic_)"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontFamily: 'inherit',
            }}
            value={judgmentText}
            onChange={(e) => setJudgmentText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpen(false)}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {judgmentText && (
        <Paper className="mt-6 p-4">
          <Typography variant="h6" className="mb-2">Rendered Judgment Preview:</Typography>
          <ReactMarkdown>{judgmentText}</ReactMarkdown>
        </Paper>
      )}
    </Box>
  );
}
