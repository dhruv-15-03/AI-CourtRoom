import { useEffect, useState } from 'react';
import { 
  Grid, 
  Typography, 
  Container, 
  TextField, 
  MenuItem, 
  Box, 
  Chip,
  Button,
  Skeleton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LawyerCard from '../components/LawyerCard';
import { userService, chatService } from '../services/api';

export default function FindLawyer() {
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    specialization: '',
    maxFees: '',
    minRating: '',
    location: '',
    experience: ''
  });

  const specializations = [
    'Criminal Law',
    'Civil Law',
    'Family Law',
    'Corporate Law',
    'Property Law',
    'Constitutional Law',
    'Tax Law',
    'Immigration Law',
    'Environmental Law',
    'Intellectual Property'
  ];

  const experienceLevels = [
    { value: '1-3', label: '1-3 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5-10', label: '5-10 years' },
    { value: '10+', label: '10+ years' }
  ];

  useEffect(() => {
    fetchLawyers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, lawyers]);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API
      const response = await userService.getLawyers(filters);
      const lawyersData = response.data || [];
      
      setLawyers(lawyersData);
      setFilteredLawyers(lawyersData);
    } catch (err) {
      console.error('Error fetching lawyers:', err);
      setError('Failed to load lawyers. Using sample data.');
      
      // Fallback to sample data for development
      const sampleLawyers = [
        {
          id: 1,
          firstName: 'Priya',
          lastName: 'Sharma',
          specialisation: 'Criminal Law',
          description: 'Experienced criminal defense attorney with 12 years of practice. Specialized in white-collar crimes, domestic violence cases, and drug offenses. Successfully defended over 200 cases with an 85% success rate.',
          fees: 1500,
          image: '/avatars/avatar1.png',
          mobile: '9876543210',
          email: 'priya.sharma@law.com',
          rating: 4.8,
          reviewCount: 124,
          experience: 12,
          location: 'Mumbai'
        },
        {
          id: 2,
          firstName: 'Rajeev',
          lastName: 'Mehta',
          specialisation: 'Civil Law',
          description: 'Expert in property disputes, contract law, and civil litigation. Known for quick resolutions and client-focused approach. Handles both individual and corporate civil matters.',
          fees: 1200,
          image: '/avatars/avatar2.png',
          mobile: '9876543211',
          email: 'rajeev.mehta@law.com',
          rating: 4.6,
          reviewCount: 89,
          experience: 8,
          location: 'Delhi'
        },
        {
          id: 3,
          firstName: 'Anjali',
          lastName: 'Rao',
          specialisation: 'Family Law',
          description: 'Compassionate family law attorney specializing in divorce, child custody, and domestic relations. Provides sensitive and confidential legal counsel for family matters.',
          fees: 1000,
          image: '/avatars/avatar3.png',
          mobile: '9876543212',
          email: 'anjali.rao@law.com',
          rating: 4.9,
          reviewCount: 156,
          experience: 10,
          location: 'Bangalore'
        },
        {
          id: 4,
          firstName: 'Sameer',
          lastName: 'Khan',
          specialisation: 'Corporate Law',
          description: 'Corporate law specialist with expertise in mergers & acquisitions, compliance, and business formation. Trusted advisor to startups and established businesses.',
          fees: 2000,
          image: '/avatars/avatar1.png',
          mobile: '9876543213',
          email: 'sameer.khan@law.com',
          rating: 4.7,
          reviewCount: 98,
          experience: 15,
          location: 'Mumbai'
        },
        {
          id: 5,
          firstName: 'Yuvraj',
          lastName: 'Singh',
          specialisation: 'Property Law',
          description: 'Real estate and property law expert. Handles property transactions, land disputes, and real estate documentation with precision and efficiency.',
          fees: 1800,
          image: '/avatars/avatar2.png',
          mobile: '9876543214',
          email: 'yuvraj.singh@law.com',
          rating: 4.5,
          reviewCount: 67,
          experience: 7,
          location: 'Pune'
        },
        {
          id: 6,
          firstName: 'Dhruv',
          lastName: 'Rastogi',
          specialisation: 'Constitutional Law',
          description: 'Constitutional law expert with focus on fundamental rights, public interest litigation, and government law. Advocate for social justice and constitutional rights.',
          fees: 2200,
          image: '/avatars/avatar3.png',
          mobile: '9876543215',
          email: 'dhruv.rastogi@law.com',
          rating: 4.9,
          reviewCount: 143,
          experience: 18,
          location: 'Delhi'
        }
      ];
      
      setLawyers(sampleLawyers);
      setFilteredLawyers(sampleLawyers);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...lawyers];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lawyer =>
        `${lawyer.firstName} ${lawyer.lastName}`.toLowerCase().includes(searchLower) ||
        lawyer.specialisation.toLowerCase().includes(searchLower) ||
        lawyer.description.toLowerCase().includes(searchLower) ||
        lawyer.location?.toLowerCase().includes(searchLower)
      );
    }

    // Specialization filter
    if (filters.specialization) {
      filtered = filtered.filter(lawyer => 
        lawyer.specialisation === filters.specialization
      );
    }

    // Fees filter
    if (filters.maxFees) {
      filtered = filtered.filter(lawyer => 
        lawyer.fees <= parseInt(filters.maxFees)
      );
    }

    // Rating filter
    if (filters.minRating) {
      filtered = filtered.filter(lawyer => 
        lawyer.rating >= parseFloat(filters.minRating)
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(lawyer => 
        lawyer.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Experience filter
    if (filters.experience) {
      const [min, max] = filters.experience.includes('+') 
        ? [parseInt(filters.experience), Infinity]
        : filters.experience.split('-').map(x => parseInt(x));
      
      filtered = filtered.filter(lawyer => 
        lawyer.experience >= min && (max === Infinity || lawyer.experience <= max)
      );
    }

    setFilteredLawyers(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      specialization: '',
      maxFees: '',
      minRating: '',
      location: '',
      experience: ''
    });
    setSearchTerm('');
  };

  const handleRequestLawyer = async (lawyerId) => {
    try {
      // This would typically open a modal for case details
      // await userService.requestLawyer(lawyerId, caseData);
      alert('Lawyer request functionality will be implemented in the next phase.');
    } catch (err) {
      console.error('Error requesting lawyer:', err);
    }
  };

  const handleChatWithLawyer = async (lawyerId) => {
    try {
      setLoading(true);
      // Create or find existing chat with the lawyer
      const response = await chatService.createChat([lawyerId], null, 'DIRECT');
      
      if (response.data.chatId) {
        // Navigate to the chat page with the specific chat selected
        navigate('/chatbot', { state: { selectedChatId: response.data.chatId } });
      }
    } catch (err) {
      console.error('Error starting chat with lawyer:', err);
      setError('Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>Find a Lawyer</Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Find a Lawyer
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Connect with qualified legal professionals for your case
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        {/* Search Bar */}
        <Box display="flex" gap={2} mb={showFilters ? 3 : 0} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by name, specialization, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            variant="outlined"
          />
          <Tooltip title="Toggle Filters">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          {(Object.values(filters).some(f => f) || searchTerm) && (
            <Tooltip title="Clear All Filters">
              <IconButton onClick={clearAllFilters} color="secondary">
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Advanced Filters */}
        {showFilters && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth>
                <InputLabel>Specialization</InputLabel>
                <Select
                  value={filters.specialization}
                  onChange={(e) => handleFilterChange('specialization', e.target.value)}
                  label="Specialization"
                >
                  <MenuItem value="">All</MenuItem>
                  {specializations.map((spec) => (
                    <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="Max Fees (₹)"
                type="number"
                value={filters.maxFees}
                onChange={(e) => handleFilterChange('maxFees', e.target.value)}
                placeholder="e.g., 2000"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth>
                <InputLabel>Min Rating</InputLabel>
                <Select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  label="Min Rating"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="4.5">4.5+ ⭐</MenuItem>
                  <MenuItem value="4.0">4.0+ ⭐</MenuItem>
                  <MenuItem value="3.5">3.5+ ⭐</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="City or State"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth>
                <InputLabel>Experience</InputLabel>
                <Select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  label="Experience"
                >
                  <MenuItem value="">Any</MenuItem>
                  {experienceLevels.map((exp) => (
                    <MenuItem key={exp.value} value={exp.value}>
                      {exp.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {/* Results Summary */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="body2" color="textSecondary">
            Showing {filteredLawyers.length} of {lawyers.length} lawyers
          </Typography>
          <Box display="flex" gap={1}>
            {filters.specialization && (
              <Chip 
                label={`Specialization: ${filters.specialization}`}
                onDelete={() => handleFilterChange('specialization', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {filters.maxFees && (
              <Chip 
                label={`Max Fees: ₹${filters.maxFees}`}
                onDelete={() => handleFilterChange('maxFees', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Results Grid */}
      {filteredLawyers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No lawyers found
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Try adjusting your search criteria or filters
          </Typography>
          <Button variant="outlined" onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredLawyers.map((lawyer) => (
            <Grid item xs={12} sm={6} md={4} key={lawyer.id}>
              <LawyerCard 
                lawyer={{
                  ...lawyer,
                  name: `${lawyer.firstName} ${lawyer.lastName}`,
                  specialization: lawyer.specialisation
                }}
                onRequest={() => handleRequestLawyer(lawyer.id)}
                onChat={() => handleChatWithLawyer(lawyer.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
