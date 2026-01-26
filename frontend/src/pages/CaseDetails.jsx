import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  LinearProgress,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Close as CloseIcon,
  Gavel,
  CalendarToday,
  Schedule,
  Person,
  Description,
  Save,
  Cancel,
  Add,
  Psychology,
  TrendingUp,
  TrendingDown,
  ExpandMore,
  ExpandLess,
  Search,
  Info,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { caseService, getConfidenceDisplay } from '../services/api';
import { useAIAnalysis } from '../hooks/useAIAnalysis';

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [judgementDialog, setJudgementDialog] = useState(false);
  const [newJudgement, setNewJudgement] = useState('');
  
  // AI Analysis States
  const [aiPrediction, setAiPrediction] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [similarCases, setSimilarCases] = useState([]);
  const [showAiSection, setShowAiSection] = useState(false);
  
  const { analyzeAndSearch, searchPrecedents, outcomeDescriptions } = useAIAnalysis();
  
  const [editForm, setEditForm] = useState({
    description: '',
    next: '',
  });

  useEffect(() => {
    if (id) {
      loadCaseDetails();
    }
  }, [id]);

  const loadCaseDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await caseService.getCaseById(id);
      setCaseData(data);
      setEditForm({
        description: data.description || '',
        next: data.next || '',
      });
    } catch (err) {
      console.error('Error loading case details:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    setSaving(true);
    try {
      await caseService.updateCase(id, editForm);
      await loadCaseDetails(); // Reload to get updated data
      setEditing(false);
    } catch (err) {
      console.error('Error updating case:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  const handleAddJudgement = async () => {
    if (!newJudgement.trim()) return;
    
    setSaving(true);
    try {
      await caseService.addJudgement(id, newJudgement);
      await loadCaseDetails(); // Reload to get updated data
      setJudgementDialog(false);
      setNewJudgement('');
    } catch (err) {
      console.error('Error adding judgement:', err);
      setError(err.response?.data?.error || err.message || 'Failed to add judgement');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCase = async () => {
    setSaving(true);
    try {
      await caseService.closeCase(id, 'Case closed by user');
      await loadCaseDetails(); // Reload to get updated data
    } catch (err) {
      console.error('Error closing case:', err);
      setError(err.response?.data?.error || err.message || 'Failed to close case');
    } finally {
      setSaving(false);
    }
  };

  const handleReopenCase = async () => {
    setSaving(true);
    try {
      await caseService.reopenCase(id);
      await loadCaseDetails(); // Reload to get updated data
    } catch (err) {
      console.error('Error reopening case:', err);
      setError(err.response?.data?.error || err.message || 'Failed to reopen case');
    } finally {
      setSaving(false);
    }
  };

  // AI Analysis Function
  const handleAIAnalysis = async () => {
    if (!caseData) return;
    
    setAiLoading(true);
    setAiError(null);
    setShowAiSection(true);
    
    try {
      // Map case data to AI API format
      const caseTypeMapping = {
        'CRIMINAL': 'Criminal',
        'CIVIL': 'Civil',
        'FAMILY': 'Family',
        'LABOUR': 'Labor',
        'LABOR': 'Labor',
        'CONSUMER': 'Civil',
        'CONSTITUTIONAL': 'Civil',
      };
      
      const analysisData = {
        case_type: caseTypeMapping[caseData.caseType?.toUpperCase()] || 'Criminal',
        parties: `${caseData.petitioner || 'Petitioner'} vs ${caseData.respondent || 'Respondent'}`,
        description: caseData.description || '',
      };

      // Add additional fields based on case type
      if (caseData.caseType?.toUpperCase() === 'CRIMINAL') {
        analysisData.violence_level = 'Unknown';
        analysisData.weapon = 'Unknown';
        analysisData.police_report = caseData.policeReport ? 'Yes' : 'Unknown';
        analysisData.witnesses = caseData.witnesses?.length > 1 ? 'Multiple' : caseData.witnesses?.length === 1 ? 'Single' : 'Unknown';
        analysisData.premeditation = 'Unknown';
      }

      const result = await analyzeAndSearch(analysisData);
      setAiPrediction(result);
      setSimilarCases(result.similar || []);
    } catch (err) {
      console.error('AI Analysis error:', err);
      setAiError(err.message || 'Failed to analyze case');
    } finally {
      setAiLoading(false);
    }
  };

  // Search for similar precedents
  const handleSearchPrecedents = async () => {
    if (!caseData?.description) {
      setAiError('No case description available for search');
      return;
    }
    
    setAiLoading(true);
    setAiError(null);
    
    try {
      const result = await searchPrecedents(caseData.description, 5);
      setSimilarCases(result.documents || []);
    } catch (err) {
      console.error('Precedent search error:', err);
      setAiError(err.message || 'Failed to search precedents');
    } finally {
      setAiLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    return status === 'Closed' ? 'default' : 'success';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading case details...
        </Typography>
      </Container>
    );
  }

  if (error && !caseData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/cases')}
          variant="outlined"
        >
          Back to Cases
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/cases')}
              sx={{ color: 'white', mb: 2 }}
            >
              Back to Cases
            </Button>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                mb: 1,
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Case Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Case ID: {caseData?.id}
              </Typography>
              <Chip
                label={caseData?.status || 'Active'}
                color={getStatusColor(caseData?.status)}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <Psychology />}
              onClick={handleAIAnalysis}
              disabled={aiLoading}
              variant="contained"
              sx={{
                backgroundColor: '#d97706',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#b45309',
                },
              }}
            >
              AI Prediction
            </Button>
            {!editing && (
              <Button
                startIcon={<Edit />}
                onClick={() => setEditing(true)}
                variant="outlined"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Edit Case
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Main Case Information */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Description sx={{ color: '#1e3a8a', mr: 1 }} />
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', color: '#1e3a8a' }}
                >
                  Case Description
                </Typography>
              </Box>

              {editing ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Case Description"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    sx={{ mb: 3 }}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                      onClick={handleEditSubmit}
                      disabled={saving}
                      variant="contained"
                      sx={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      onClick={() => setEditing(false)}
                      variant="outlined"
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    lineHeight: 1.7,
                    backgroundColor: '#f8fafc',
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {caseData?.description || 'No description provided'}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Judgements */}
          {caseData?.judgement && caseData.judgement.length > 0 && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Gavel sx={{ color: '#1e3a8a', mr: 1 }} />
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 'bold', color: '#1e3a8a' }}
                  >
                    Judgements & Orders
                  </Typography>
                </Box>
                <List>
                  {caseData.judgement.map((judgement, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={judgement}
                        secondary={`Order ${index + 1}`}
                        sx={{
                          backgroundColor: '#f8fafc',
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid #e2e8f0',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Case Dates */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 3 }}
              >
                Important Dates
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ fontSize: 20, color: '#64748b' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Filing Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatDate(caseData?.date)}
                    </Typography>
                  </Box>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule sx={{ fontSize: 20, color: '#64748b' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Next Hearing
                    </Typography>
                    {editing ? (
                      <TextField
                        type="date"
                        size="small"
                        value={editForm.next}
                        onChange={(e) =>
                          setEditForm({ ...editForm, next: e.target.value })
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatDate(caseData?.next)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Case Actions */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 3 }}
              >
                Case Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  startIcon={<Add />}
                  onClick={() => setJudgementDialog(true)}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: '#1e3a8a',
                    color: '#1e3a8a',
                    '&:hover': {
                      borderColor: '#1e40af',
                      backgroundColor: 'rgba(30, 58, 138, 0.04)',
                    },
                  }}
                >
                  Add Note/Judgement
                </Button>
                
                {caseData?.status === 'Closed' ? (
                  <Button
                    fullWidth
                    startIcon={saving ? <CircularProgress size={20} /> : <Schedule />}
                    onClick={handleReopenCase}
                    disabled={saving}
                    variant="contained"
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    }}
                  >
                    {saving ? 'Reopening...' : 'Reopen Case'}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    startIcon={saving ? <CircularProgress size={20} /> : <CloseIcon />}
                    onClick={handleCloseCase}
                    disabled={saving}
                    variant="contained"
                    color="error"
                    sx={{ borderRadius: 2 }}
                  >
                    {saving ? 'Closing...' : 'Close Case'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Analysis Section */}
      <Collapse in={showAiSection}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            mt: 4, 
            borderRadius: 3,
            border: '2px solid #d97706',
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology sx={{ color: '#d97706', fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d97706' }}>
                AI Case Analysis
              </Typography>
            </Box>
            <IconButton onClick={() => setShowAiSection(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* AI Error */}
          {aiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {aiError}
            </Alert>
          )}

          {/* Loading State */}
          {aiLoading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#d97706', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Analyzing case with AI...
              </Typography>
            </Box>
          )}

          {/* AI Prediction Results */}
          {aiPrediction && !aiLoading && (
            <Grid container spacing={3}>
              {/* Predicted Judgment */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Predicted Judgment
                    </Typography>
                    <Chip
                      label={aiPrediction.judgment}
                      sx={{
                        backgroundColor: '#d97706',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        height: 36,
                        mb: 2,
                      }}
                    />
                    {aiPrediction.needs_review && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        This prediction has low confidence. Expert review recommended.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Confidence Score */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Confidence Score
                    </Typography>
                    {(() => {
                      const conf = getConfidenceDisplay(aiPrediction.confidence || 0);
                      return (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Typography sx={{ fontSize: '1.5rem' }}>{conf.icon}</Typography>
                            <Chip
                              label={conf.level}
                              sx={{
                                backgroundColor: conf.color,
                                color: 'white',
                                fontWeight: 'bold',
                              }}
                            />
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: conf.color, ml: 'auto' }}>
                              {((aiPrediction.confidence || 0) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(aiPrediction.confidence || 0) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: conf.color,
                                borderRadius: 4,
                              },
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {conf.message}
                          </Typography>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>

              {/* Key Factors */}
              {aiPrediction.key_factors && aiPrediction.key_factors.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Info sx={{ color: '#1e3a8a' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                          Key Factors Influencing Prediction
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {aiPrediction.key_factors.map((factor, index) => (
                          <Chip
                            key={index}
                            icon={factor.direction === 'positive' ? <TrendingUp /> : <TrendingDown />}
                            label={`${factor.feature} (${Math.round(factor.importance * 100)}%)`}
                            sx={{
                              backgroundColor: factor.direction === 'positive' 
                                ? 'rgba(34, 197, 94, 0.15)' 
                                : 'rgba(100, 116, 139, 0.15)',
                              color: factor.direction === 'positive' ? '#16a34a' : '#475569',
                              '& .MuiChip-icon': {
                                color: factor.direction === 'positive' ? '#22c55e' : '#64748b',
                              },
                            }}
                          />
                        ))}
                      </Box>
                      {aiPrediction.explanation && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mt: 2, fontStyle: 'italic', p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}
                        >
                          {aiPrediction.explanation}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Similar Cases */}
              {similarCases.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Search sx={{ color: '#1e3a8a' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                          Similar Precedents
                        </Typography>
                      </Box>
                      <List>
                        {similarCases.map((caseItem, index) => (
                          <ListItem 
                            key={index} 
                            sx={{ 
                              backgroundColor: '#f8fafc', 
                              borderRadius: 2, 
                              mb: 1,
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                                {caseItem.title || `Case ${index + 1}`}
                              </Typography>
                              {caseItem.outcome && (
                                <Chip 
                                  label={caseItem.outcome} 
                                  size="small"
                                  sx={{ backgroundColor: '#d97706', color: 'white' }}
                                />
                              )}
                            </Box>
                            {caseItem.snippet && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {caseItem.snippet}
                              </Typography>
                            )}
                            {caseItem.url && (
                              <Button 
                                size="small" 
                                href={caseItem.url} 
                                target="_blank"
                                sx={{ textTransform: 'none' }}
                              >
                                View Full Case →
                              </Button>
                            )}
                            {caseItem.score && (
                              <Typography variant="caption" color="text.secondary">
                                Relevance: {(caseItem.score * 100).toFixed(0)}%
                              </Typography>
                            )}
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    startIcon={<Search />}
                    onClick={handleSearchPrecedents}
                    disabled={aiLoading}
                    variant="outlined"
                    sx={{ borderColor: '#1e3a8a', color: '#1e3a8a' }}
                  >
                    Find More Precedents
                  </Button>
                  <Button
                    startIcon={<Psychology />}
                    onClick={handleAIAnalysis}
                    disabled={aiLoading}
                    variant="contained"
                    sx={{ backgroundColor: '#d97706' }}
                  >
                    Re-analyze Case
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Collapse>

      {/* Add Judgement Dialog */}
      <Dialog
        open={judgementDialog}
        onClose={() => setJudgementDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Judgement/Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Judgement or Note"
            value={newJudgement}
            onChange={(e) => setNewJudgement(e.target.value)}
            placeholder="Enter judgement, order, or case note..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJudgementDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddJudgement}
            disabled={!newJudgement.trim() || saving}
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Add />}
          >
            {saving ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CaseDetails;
