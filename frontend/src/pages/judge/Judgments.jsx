import React, { useState, useEffect } from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Judgments() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    setRecords([
      { id: 1, caseTitle: 'State vs. Mehta', verdict: 'Guilty', date: '2025-04-15', excerpt: 'The court finds...' },
      { id: 2, caseTitle: 'Khan vs. Sharma', verdict: 'Dismissed', date: '2025-03-20', excerpt: 'After review...' },
    ]);
  }, []);

  return (
    <Box className="mx-auto max-w-4xl py-8">
      <Typography variant="h5" className="font-semibold mb-4">
        Past Judgments
      </Typography>
      {records.map((r) => (
        <Accordion key={r.id} className="mb-2">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className="font-medium">
              {r.caseTitle} — {r.date}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography className="mb-2"><strong>Verdict:</strong> {r.verdict}</Typography>
            <Typography>{r.excerpt}…</Typography>
            <Button
              size="small"
              variant="text"
              className="mt-2 text-indigo-600"
              onClick={() => window.location.href = `/judge/case-details/${r.id}`}
            >
              View Full
            </Button>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
