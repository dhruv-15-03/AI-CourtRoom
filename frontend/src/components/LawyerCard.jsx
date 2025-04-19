import { Card, CardContent, Typography, Avatar, Button, Box } from '@mui/material';

export default function LawyerCard({ lawyer }) {
  return (
    <Card sx={{ width: '380px', height: '360px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar
          src={lawyer.photoUrl || ''}
          alt={lawyer.name}
          sx={{ width: 56, height: 56 }}
        >
          {!lawyer.photoUrl && lawyer.name?.[0]}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {lawyer.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lawyer.specialization}
          </Typography>
        </Box>
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {lawyer.description}
        </Typography>
        <Typography variant="body1" fontWeight="bold">
          Fee: ₹{lawyer.fees}
        </Typography>
      </CardContent>
      <Box display="flex" justifyContent="space-between" mt={1}>
        <Button variant="contained" color="primary">
          Chat
        </Button>
        <Button variant="outlined">Select</Button>
      </Box>
    </Card>
  );
}