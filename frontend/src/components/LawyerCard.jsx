import { Card, CardContent, Typography, Avatar, Button, Box, Chip } from '@mui/material';
import { Email, Phone, Star } from '@mui/icons-material';

export default function LawyerCard({ lawyer, onRequest, onChat }) {
  const displayName = lawyer.name || `${lawyer.firstName} ${lawyer.lastName}`;
  const specialization = lawyer.specialization || lawyer.specialisation;
  
  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4
      }
    }}>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header with Avatar and Name */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            src={lawyer.image || lawyer.photoUrl || ''}
            alt={displayName}
            sx={{ width: 64, height: 64 }}
          >
            {displayName?.[0]}
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Adv. {displayName}
            </Typography>
            <Chip 
              label={specialization} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Description */}
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
          {lawyer.description}
        </Typography>

        {/* Contact Info */}
        <Box mb={2}>
          <Typography variant="body1" fontWeight="bold" color="primary" mb={1}>
            Consultation Fee: ₹{lawyer.fees}
          </Typography>
          
          {lawyer.email && (
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Email fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {lawyer.email}
              </Typography>
            </Box>
          )}
          
          {lawyer.mobile && (
            <Box display="flex" alignItems="center" gap={1}>
              <Phone fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {lawyer.mobile}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Rating (if available) */}
        {lawyer.rating && (
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Star fontSize="small" color="warning" />
            <Typography variant="body2">
              {lawyer.rating} ({lawyer.reviewCount || 0} reviews)
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Action Buttons */}
      <Box display="flex" gap={1} p={2} pt={0}>
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth
          onClick={onChat}
        >
          Chat
        </Button>
        <Button 
          variant="outlined" 
          color="primary" 
          fullWidth
          onClick={onRequest}
        >
          Request
        </Button>
      </Box>
    </Card>
  );
}