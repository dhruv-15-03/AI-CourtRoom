import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Grid,
  Avatar,
  Chip,
} from '@mui/material';
import { WorkOutline, PersonOutline } from '@mui/icons-material';

const dummyCases = [
  
];

const Cases = () => {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setCases(dummyCases);
    }, 500);
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center">
        My Active Cases
      </Typography>

      {cases.length === 0 ? (
        <Box
          className="text-center mt-20"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <WorkOutline sx={{ fontSize: 80, color: '#ccc' }} />
          <Typography variant="h6" mt={2} color="textSecondary">
            No running cases on you.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3} mt={2}>
          {cases.map((caseItem) => (
            <Grid item xs={12} sm={6} key={caseItem.id}>
              <Card className="hover:shadow-xl transition duration-300 ease-in-out rounded-2xl">
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {caseItem.title}
                  </Typography>

                  <Chip
                    label={caseItem.status}
                    color={caseItem.status === 'Active' ? 'success' : 'default'}
                    size="small"
                    sx={{ mb: 1 }}
                  />

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Date Filed: {new Date(caseItem.dateFiled).toLocaleDateString()}
                  </Typography>

                  <Box display="flex" alignItems="center" mt={2}>
                    <Avatar src={caseItem.lawyer.avatar} />
                    <Typography variant="body1" ml={2}>
                      {caseItem.lawyer.name}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Cases;
