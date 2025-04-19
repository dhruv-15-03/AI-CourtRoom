import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function PendingCases() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // Dummy fetch
    setRows([
      { id: 1, caseId: 'A123', parties: 'State vs. Mehta', assigned: '2025-04-10', urgency: 'High' },
      { id: 2, caseId: 'B456', parties: 'Khan vs. Sharma', assigned: '2025-04-12', urgency: 'Medium' },
      // ...
    ]);
  }, []);

  const columns = [
    { field: 'caseId', headerName: 'Case ID', flex: 1 },
    { field: 'parties', headerName: 'Parties', flex: 2 },
    { field: 'assigned', headerName: 'Assigned On', flex: 1 },
    {
      field: 'urgency',
      headerName: 'Urgency',
      flex: 1,
      renderCell: (params) => (
        <span className={
          params.value === 'High'
            ? 'text-red-600 font-semibold'
            : params.value === 'Medium'
            ? 'text-yellow-600 font-semibold'
            : 'text-green-600 font-semibold'
        }>
          {params.value}
        </span>
      )
    },
    {
      field: 'action',
      headerName: '',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => window.location.href = `/judge/case-details/${params.row.id}`}
        >
          Review
        </Button>
      )
    },
  ];

  return (
    <Box className="mx-auto max-w-4xl py-8">
      <Typography variant="h5" className="font-semibold mb-4">
        Pending Cases
      </Typography>
      <Paper style={{ height: 400, width: '100%' }}>
        <DataGrid rows={rows} columns={columns} pageSize={5} rowsPerPageOptions={[5]} />
      </Paper>
    </Box>
  );
}
