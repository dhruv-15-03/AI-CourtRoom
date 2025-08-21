import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Fab,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  CalendarToday,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`case-tabpanel-${index}`}
      aria-labelledby={`case-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Cases = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [activeCases, setActiveCases] = useState([]);
  const [pastCases, setPastCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    // Check authentication status
    if (!isAuthenticated) {
      console.warn('User not authenticated, redirecting to login...');
      navigate('/login');
      return;
    }

    // Validate JWT token exists
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No JWT token found, redirecting to login...');
      logout();
      navigate('/login');
      return;
    }

    loadCases();
  }, [isAuthenticated, navigate, logout]);

  const loadCases = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getCases();
      console.log('Cases API response:', response.data);
      
      setActiveCases(response.data.activeCases || []);
      setPastCases(response.data.pastCases || []);
    } catch (err) {
      console.error('Error loading cases:', err);
      
      // Check for JWT/Authentication errors
      if (err.response?.status === 401 || 
          err.response?.status === 403 ||
          (err.response?.data?.message && 
           (err.response.data.message.includes('JWT') || 
            err.response.data.message.includes('token') ||
            err.response.data.message.includes('Unauthorized') ||
            err.response.data.message.includes('expired')))) {
        
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
        return;
      }
      
      setError(err.response?.data?.error || err.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event, caseItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedCase(caseItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCase(null);
  };

  const handleViewCase = () => {
    if (selectedCase) {
      navigate(`/cases/${selectedCase.id}`);
    }
    handleMenuClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFilteredCases = (cases) => {
    if (!searchQuery.trim()) return cases;
    return cases.filter(caseItem => 
      caseItem.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getStatusChip = (caseItem) => {
    if (caseItem.isClose) {
      return <Chip label="Closed" color="default" size="small" icon={<CheckCircle />} />;
    }
    return <Chip label="Active" color="success" size="small" icon={<Schedule />} />;
  };

  const currentCases = tabValue === 0 ? activeCases : pastCases;
  const filteredCases = getFilteredCases(currentCases);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Case Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/cases/create')}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' }
          }}
        >
          Create New Case
        </Button>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Filter">
            <IconButton>
              <FilterList />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="case tabs">
            <Tab 
              label={`Active Cases (${getFilteredCases(activeCases).length})`} 
              icon={<CalendarToday />} 
              iconPosition="start"
            />
            <Tab 
              label={`Closed Cases (${getFilteredCases(pastCases).length})`} 
              icon={<CheckCircle />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <TabPanel value={tabValue} index={tabValue}>
              {filteredCases.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    {searchQuery.trim() 
                      ? `No cases found matching "${searchQuery}"` 
                      : `No ${tabValue === 0 ? 'active' : 'closed'} cases found`
                    }
                  </Typography>
                  {tabValue === 0 && !searchQuery.trim() && (
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => navigate('/cases/create')}
                      sx={{ mt: 2 }}
                    >
                      Create Your First Case
                    </Button>
                  )}
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {filteredCases.map((caseItem) => (
                    <Grid item xs={12} md={6} lg={4} key={caseItem.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 3
                          }
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" component="h2" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                              Case #{caseItem.id}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, caseItem)}
                              aria-label="more options"
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>

                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {caseItem.description || 'No description available'}
                          </Typography>

                          <Box sx={{ mt: 'auto' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Created:</strong> {formatDate(caseItem.date)}
                            </Typography>
                            {caseItem.next && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Next Hearing:</strong> {formatDate(caseItem.next)}
                              </Typography>
                            )}
                            {getStatusChip(caseItem)}
                          </Box>
                        </CardContent>
                        
                        <Box sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/cases/${caseItem.id}`)}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
          )}
        </Box>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleViewCase}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedCase) {
            navigate(`/cases/${selectedCase.id}`);
          }
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit Case
        </MenuItem>
      </Menu>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add case"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
        onClick={() => navigate('/cases/create')}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default Cases;
