import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';

export default function JudgeDashboard() {
  const stats = [
    { label: 'Pending Cases', value: 12 },
    { label: 'Judgments Delivered', value: 48 },
    { label: 'Cases This Month', value: 7 },
    { label: 'Average Days to Verdict', value: 14 },
  ];

  return (
    <Box className="mx-auto max-w-5xl py-8">
      <Typography variant="h4" className="text-center font-serif font-bold mb-8">
        Welcome, Judge Patel
      </Typography>
      <Grid container spacing={6}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card className="hover:shadow-xl transition-shadow duration-300">
              <CardContent className="text-center">
                <Typography variant="h6" className="font-medium text-gray-700">
                  {stat.label}
                </Typography>
                <Typography variant="h3" className="font-bold text-indigo-600 mt-2">
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}