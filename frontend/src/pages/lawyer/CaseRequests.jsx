import React, { useState } from 'react';
import { 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  Box, 
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { useCaseRequests } from '../../hooks/useLawyerData';

export default function CaseRequests({ mode, setMode }) {
  const { requests, loading, error, acceptRequest, rejectRequest } = useCaseRequests();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogType, setDialogType] = useState(''); // 'accept' or 'reject'
  const [response, setResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleAction = async (request, action) => {
    setSelectedRequest(request);
    setDialogType(action);
    setResponse(action === 'accept' 
      ? 'Thank you for considering me for your case. I am accepting this request and will contact you soon to discuss the details.' 
      : 'Thank you for your interest. Unfortunately, I cannot take on this case at this time due to scheduling conflicts.'
    );
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    try {
      let result;
      if (dialogType === 'accept') {
        result = await acceptRequest(selectedRequest.id, response);
      } else {
        result = await rejectRequest(selectedRequest.id, response);
      }
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Case request ${dialogType}ed successfully`,
          severity: 'success'
        });
        handleCloseDialog();
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to process request',
          severity: 'error'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'An error occurred',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setDialogType('');
    setResponse('');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

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
        Case Requests
      </Typography>
      
      {requests.length === 0 ? (
        <Alert severity="info">No case requests found.</Alert>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {requests.map((request) => (
            <Grid item xs={12} md={6} lg={4} key={request.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 6,
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip 
                      label={request.status}
                      size="small"
                      sx={{ 
                        bgcolor: getStatusColor(request.status),
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                    {request.urgency && (
                      <Chip 
                        label={request.urgency}
                        size="small"
                        icon={<PriorityHighIcon />}
                        sx={{ 
                          bgcolor: getUrgencyColor(request.urgency),
                          color: 'white'
                        }}
                      />
                    )}
                  </Box>

                  <Typography variant="h6" gutterBottom noWrap>
                    {request.caseTitle}
                  </Typography>

                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#1976d2' }}>
                      <PersonIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {request.user?.firstName} {request.user?.lastName}
                    </Typography>
                  </Box>

                  {request.caseType && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Type:</strong> {request.caseType}
                      </Typography>
                    </Box>
                  )}

                  {request.budget && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <AttachMoneyIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Budget: ₹{request.budget.toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  <Box display="flex" alignItems="center" mb={2}>
                    <EventIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {request.caseDescription?.length > 100 
                      ? `${request.caseDescription.substring(0, 100)}...`
                      : request.caseDescription
                    }
                  </Typography>

                  {request.status === 'Pending' && (
                    <Box display="flex" gap={1} mt="auto">
                      <Button 
                        variant="contained" 
                        color="success" 
                        size="small"
                        onClick={() => handleAction(request, 'accept')}
                        sx={{ flex: 1 }}
                      >
                        Accept
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={() => handleAction(request, 'reject')}
                        sx={{ flex: 1 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}

                  {request.status !== 'Pending' && request.lawyerResponse && (
                    <Box mt={2} p={1} bgcolor="grey.100" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">
                        Your response:
                      </Typography>
                      <Typography variant="body2">
                        {request.lawyerResponse}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'accept' ? 'Accept Case Request' : 'Reject Case Request'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedRequest.caseTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Client: {selectedRequest.user?.firstName} {selectedRequest.user?.lastName}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedRequest.caseDescription}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your response message"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction}
            variant="contained"
            color={dialogType === 'accept' ? 'success' : 'error'}
            disabled={actionLoading}
            startIcon={actionLoading && <CircularProgress size={16} />}
          >
            {dialogType === 'accept' ? 'Accept Request' : 'Reject Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}