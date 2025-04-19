import { useEffect, useState } from 'react';
import { Grid, Typography, Container } from '@mui/material';
import LawyerCard from '../components/LawyerCard';

export default function FindLawyer() {
  const [lawyers, setLawyers] = useState([]);

  useEffect(() => {
    const fetchedLawyers = [
      {
        id: 1,
        name: 'Adv. Priya Sharma',
        specialization: 'Criminal Law',
        description: 'Experienced in criminal defense &.............................. case analysis.',
        fees: 1500,
        image: '',
      },
      {
        id: 2,
        name: 'Adv. Rajeev Mehta',
        specialization: 'Civil Law',
        description: 'Expert in property disputes and civil litigation.',
        fees: 1200,
        image: '',
      },
      {
        id: 3,
        name: 'Adv. Anjali Rao',
        specialization: 'Family Law',
        description: 'Handles divorce, custody and family settlements.',
        fees: 1000,
        image: '',
      },
      {
        id: 4,
        name: 'Adv. Sameer Khan',
        specialization: 'Corporate Law',
        description: 'Focused on contract law and business advisory.',
        fees: 2000,
        image: '',

      },{
        id: 5,
        name: 'Adv. Sameer Khan',
        specialization: 'Corporate Law',
        description: 'Focused on contract law and business advisory.',
        fees: 2000,
        image: '',
      },{
        id: 6,
        name: 'Adv. Sameer Khan',
        specialization: 'Corporate Law',
        description: 'Focused on contract law and business advisory.',
        fees: 2000,
        image: '',
      },
      {
        id: 7,
        name: 'Adv. Yuvraj Singh',
        specialization: 'Corporate Law',
        description: 'Focused on contract law and business advisory.',
        fees: 2000,
        image: '',

      },
      {
        id: 8,
        name: 'Adv. Dhruv Rastogi',
        specialization: 'Corporate Law',
        description: 'Focused on contract law and business advisory.',
        fees: 2000,
        image: '',
      },{
        id: 9,
        name: 'Adv. Sameer Khan',
        specialization: 'Corporate Law',
        description: 'Focused on contract law and business advisory.',
        fees: 2000,
        image: '',
      }
    ];
    setLawyers(fetchedLawyers);
  }, []);

  return (
    <Container
    maxWidth="xl"
    sx={{
      mt: 4,
      pr: { xs: 2, sm: 4 },
    }}
  >
    <Typography variant="h5" gutterBottom textAlign="center">
      <b>Select a Lawyer for Your Case</b>
    </Typography>
  
    <Grid container spacing={3}>
      {lawyers.map((lawyer) => (
        <Grid item xs={12} sm={6} md={4} key={lawyer.id}>
          <LawyerCard lawyer={lawyer} />
        </Grid>
      ))}
    </Grid>
  </Container>
  
  );
}