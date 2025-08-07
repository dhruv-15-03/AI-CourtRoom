import React from 'react';
import { 
  Alert, 
  Box, 
  CircularProgress, 
  Container, 
  Typography,
  Backdrop,
  Button,
  Card,
  CardContent
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// Loading Spinner Component
export const LoadingSpinner = ({ size = 40, message = 'Loading...' }) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="200px"
    gap={2}
  >
    <CircularProgress size={size} />
    <Typography variant="body2" color="textSecondary">
      {message}
    </Typography>
  </Box>
);

// Full Screen Loading
export const FullScreenLoader = ({ message = 'Loading...' }) => (
  <Backdrop open={true} sx={{ color: '#fff', zIndex: 9999 }}>
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <CircularProgress color="inherit" />
      <Typography variant="h6">{message}</Typography>
    </Box>
  </Backdrop>
);

// Error Display Component
export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  showRetry = true 
}) => (
  <Container maxWidth="sm" sx={{ mt: 4 }}>
    <Card>
      <CardContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
          <Typography variant="h5" color="error" align="center">
            {title}
          </Typography>
          <Typography variant="body1" color="textSecondary" align="center">
            {error || 'An unexpected error occurred. Please try again.'}
          </Typography>
          {showRetry && onRetry && (
            <Button variant="contained" onClick={onRetry} sx={{ mt: 2 }}>
              Try Again
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  </Container>
);

// Success Message Component
export const SuccessMessage = ({ message, onClose }) => (
  <Alert 
    severity="success" 
    icon={<CheckCircleOutlineIcon fontSize="inherit" />}
    onClose={onClose}
    sx={{ mb: 2 }}
  >
    {message}
  </Alert>
);

// Notification Alert Component
export const NotificationAlert = ({ 
  type = 'info', 
  message, 
  onClose, 
  autoHide = true 
}) => {
  const icons = {
    error: <ErrorOutlineIcon fontSize="inherit" />,
    warning: <WarningAmberIcon fontSize="inherit" />,
    info: <InfoOutlinedIcon fontSize="inherit" />,
    success: <CheckCircleOutlineIcon fontSize="inherit" />
  };

  React.useEffect(() => {
    if (autoHide && onClose) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onClose]);

  return (
    <Alert 
      severity={type} 
      icon={icons[type]}
      onClose={onClose}
      sx={{ mb: 2 }}
    >
      {message}
    </Alert>
  );
};

// Empty State Component
export const EmptyState = ({ 
  title = 'No data found', 
  description,
  action,
  icon: Icon = InfoOutlinedIcon 
}) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center"
    minHeight="300px"
    textAlign="center"
    gap={2}
  >
    <Icon sx={{ fontSize: 80, color: 'text.secondary' }} />
    <Typography variant="h5" color="textSecondary">
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="textSecondary">
        {description}
      </Typography>
    )}
    {action && action}
  </Box>
);

// Page Wrapper for consistent layout
export const PageWrapper = ({ 
  children, 
  title, 
  subtitle, 
  loading = false, 
  error = null,
  onRetry 
}) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={onRetry} />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {title && (
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
      {children}
    </Container>
  );
};

// Confirmation Dialog Hook
export const useConfirmation = () => {
  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState({});

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      setConfig({
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        ...options,
        onConfirm: () => {
          setOpen(false);
          resolve(true);
        },
        onCancel: () => {
          setOpen(false);
          resolve(false);
        }
      });
      setOpen(true);
    });
  };

  const ConfirmationDialog = () => (
    <Box>
      {/* Implementation would include Material-UI Dialog */}
    </Box>
  );

  return { confirm, ConfirmationDialog };
};

export default {
  LoadingSpinner,
  FullScreenLoader,
  ErrorDisplay,
  SuccessMessage,
  NotificationAlert,
  EmptyState,
  PageWrapper,
  useConfirmation
};
