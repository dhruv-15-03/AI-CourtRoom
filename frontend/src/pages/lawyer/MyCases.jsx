import React, { useState } from 'react';
import { 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Box, 
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import GavelIcon from '@mui/icons-material/Gavel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useLawyerCases } from '../../hooks/useLawyerData';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cases-tabpanel-${index}`}
      aria-labelledby={`cases-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function MyCases({ mode, setMode }) {
  const { cases, loading, error } = useLawyerCases();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'filed': return '#3b82f6';
      case 'admitted': return '#10b981';
      case 'under trial': return '#f59e0b';
      case 'disposed': return '#6b7280';
      case 'judgment reserved': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'urgent': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderCaseCard = (caseItem) => (
    <Grid item xs={12} md={6} lg={4} key={caseItem.id}>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            boxShadow: 6,
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Chip 
              label={caseItem.status}
              size="small"
              sx={{ 
                bgcolor: getStatusColor(caseItem.status),
                color: 'white',
                fontWeight: 600
              }}
            />
            {caseItem.priority && (
              <Chip 
                label={caseItem.priority}
                size="small"
                sx={{ 
                  bgcolor: getPriorityColor(caseItem.priority),
                  color: 'white'
                }}
              />
            )}
          </Box>

          <Typography variant="h6" gutterBottom noWrap>
            {caseItem.title}
          </Typography>

          {caseItem.caseNumber && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Case No:</strong> {caseItem.caseNumber}
            </Typography>
          )}

          {caseItem.caseType && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Type:</strong> {caseItem.caseType}
            </Typography>
          )}

          <Box display="flex" alignItems="center" mb={1}>
            <EventIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Filed: {caseItem.filingDate ? new Date(caseItem.filingDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>

          {caseItem.nextHearing && (
            <Box display="flex" alignItems="center" mb={1}>
              <GavelIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Next Hearing: {new Date(caseItem.nextHearing).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          {caseItem.judgmentDate && (
            <Box display="flex" alignItems="center" mb={1}>
              <GavelIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Judgment: {new Date(caseItem.judgmentDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          {caseItem.courtLocation && (
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {caseItem.courtLocation} {caseItem.courtRoom && `- Room ${caseItem.courtRoom}`}
              </Typography>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {caseItem.description?.length > 100 
              ? `${caseItem.description.substring(0, 100)}...`
              : caseItem.description || 'No description available'
            }
          </Typography>

          {caseItem.disposalType && (
            <Box mt={2} p={1} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="caption" color="text.secondary">
                Disposal Type:
              </Typography>
              <Typography variant="body2">
                {caseItem.disposalType}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        My Cases
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Active Cases (${cases.activeCases?.length || 0})`} />
          <Tab label={`Past Cases (${cases.pastCases?.length || 0})`} />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {cases.activeCases?.length === 0 ? (
          <Alert severity="info">No active cases found.</Alert>
        ) : (
          <Grid container spacing={3}>
            {cases.activeCases?.map(renderCaseCard)}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {cases.pastCases?.length === 0 ? (
          <Alert severity="info">No past cases found.</Alert>
        ) : (
          <Grid container spacing={3}>
            {cases.pastCases?.map(renderCaseCard)}
          </Grid>
        )}
      </TabPanel>
    </>
  );
}