import React from 'react';
import { Box, Button, Container, Typography, Card, CardContent } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console (in production, send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally navigate to home
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" gap={3} py={4}>
                <ErrorOutlineIcon color="error" sx={{ fontSize: 80 }} />
                
                <Typography variant="h4" color="error" align="center" fontWeight="bold">
                  Oops! Something went wrong
                </Typography>
                
                <Typography variant="body1" color="textSecondary" align="center" sx={{ maxWidth: 400 }}>
                  We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
                </Typography>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Box 
                    sx={{ 
                      mt: 2, 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 1, 
                      width: '100%',
                      overflow: 'auto',
                      maxHeight: 200
                    }}
                  >
                    <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', color: '#d32f2f' }}>
                      {this.state.error.toString()}
                    </Typography>
                  </Box>
                )}

                <Box display="flex" gap={2} mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleReload}
                  >
                    Refresh Page
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => window.location.href = '/'}
                  >
                    Go to Home
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
