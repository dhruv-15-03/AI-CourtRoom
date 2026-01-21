import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { judgeService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function JudgeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    pendingCases: 0,
    judgmentsDelivered: 0,
    casesThisMonth: 0,
    avgDaysToVerdict: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await judgeService.getDashboardStats();
        if (response.data) {
          setDashboardData({
            pendingCases: response.data.pendingCases || 0,
            judgmentsDelivered: response.data.judgmentsDelivered || 0,
            casesThisMonth: response.data.casesThisMonth || 0,
            avgDaysToVerdict: response.data.avgDaysToVerdict || 0,
          });
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching judge dashboard:', err);
        setError('Failed to load dashboard data');
        // Set fallback data for demo
        setDashboardData({
          pendingCases: 12,
          judgmentsDelivered: 48,
          casesThisMonth: 7,
          avgDaysToVerdict: 14,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const stats = [
    { label: 'Pending Cases', value: dashboardData.pendingCases },
    { label: 'Judgments Delivered', value: dashboardData.judgmentsDelivered },
    { label: 'Cases This Month', value: dashboardData.casesThisMonth },
    { label: 'Average Days to Verdict', value: dashboardData.avgDaysToVerdict },
  ];

  const judgeName = user?.firstName ? `Judge ${user.firstName}` : 'Judge';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="mx-auto max-w-5xl py-8">
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} - Showing sample data
        </Alert>
      )}
      <Typography variant="h4" className="text-center font-serif font-bold mb-8">
        Welcome, {judgeName}
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