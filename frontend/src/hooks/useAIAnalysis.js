import { useState, useCallback, useEffect } from 'react';
import { aiService, getConfidenceDisplay, CASE_TYPES } from '../services/api';

/**
 * Custom hook for AI case analysis functionality
 * Provides methods for analyzing cases, fetching similar cases, and getting outcome details
 */
export const useAIAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [outcomes, setOutcomes] = useState([]);
  const [outcomeDescriptions, setOutcomeDescriptions] = useState({});

  // Fetch all outcomes on mount
  useEffect(() => {
    const fetchOutcomes = async () => {
      try {
        const response = await aiService.getOutcomes();
        if (response.data) {
          setOutcomes(response.data.outcomes || []);
          setOutcomeDescriptions(response.data.descriptions || {});
        }
      } catch (err) {
        console.error('Failed to fetch outcomes:', err);
      }
    };
    fetchOutcomes();
  }, []);

  /**
   * Analyze a case and get prediction
   * @param {Object} caseData - Case details for analysis
   * @returns {Promise<Object>} Analysis result
   */
  const analyzeCase = useCallback(async (caseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiService.analyzeCase(caseData);
      const result = {
        ...response.data,
        confidenceDisplay: getConfidenceDisplay(response.data.confidence || 0),
        outcomeInfo: outcomeDescriptions[response.data.judgment] || {},
      };
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Analysis failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [outcomeDescriptions]);

  /**
   * Quick analyze for real-time suggestions
   * @param {string} text - Free text description
   * @param {string} caseType - Optional case type hint
   * @returns {Promise<Object>} Quick analysis result
   */
  const quickAnalyze = useCallback(async (text, caseType = null) => {
    if (!text || text.length < 10) {
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await aiService.analyzeQuick(text, caseType);
      const result = {
        ...response.data,
        confidenceDisplay: getConfidenceDisplay(response.data.confidence || 0),
      };
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Quick analysis failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Batch analyze multiple cases
   * @param {Array} cases - Array of case objects
   * @param {string} format - 'minimal' | 'full' | 'detailed'
   * @returns {Promise<Object>} Batch results
   */
  const batchAnalyze = useCallback(async (cases, format = 'full') => {
    if (!cases || cases.length === 0) {
      throw new Error('No cases provided for analysis');
    }
    if (cases.length > 50) {
      throw new Error('Maximum 50 cases allowed per batch');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await aiService.analyzeBatch(cases, format);
      const result = {
        ...response.data,
        results: response.data.results.map(r => ({
          ...r,
          confidenceDisplay: getConfidenceDisplay(r.confidence || 0),
        })),
      };
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Batch analysis failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Analyze case and get similar precedents
   * @param {Object} caseData - Case details
   * @returns {Promise<Object>} Analysis with similar cases
   */
  const analyzeAndSearch = useCallback(async (caseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiService.analyzeAndSearch(caseData);
      const result = {
        ...response.data,
        confidenceDisplay: getConfidenceDisplay(response.data.confidence || 0),
        outcomeInfo: outcomeDescriptions[response.data.judgment] || {},
      };
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Analysis with search failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [outcomeDescriptions]);

  /**
   * RAG query for legal research
   * @param {string} question - Natural language question
   * @param {number} k - Number of results (max 10)
   * @returns {Promise<Object>} RAG query result with documents
   */
  const searchPrecedents = useCallback(async (question, k = 5) => {
    if (!question || question.length < 5) {
      throw new Error('Question too short');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await aiService.ragQuery(question, Math.min(k, 10));
      setLoading(false);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Search failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Get details for a specific outcome
   * @param {string} outcome - Outcome name
   * @returns {Promise<Object>} Outcome details
   */
  const getOutcomeDetails = useCallback(async (outcome) => {
    try {
      const response = await aiService.getOutcomeDetails(outcome);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch outcome details:', err);
      return outcomeDescriptions[outcome] || null;
    }
  }, [outcomeDescriptions]);

  /**
   * Check AI service health
   * @returns {Promise<Object>} Health status
   */
  const checkHealth = useCallback(async () => {
    try {
      const response = await aiService.checkHealth();
      return response.data;
    } catch (err) {
      return { status: 'unhealthy', error: err.message };
    }
  }, []);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    outcomes,
    outcomeDescriptions,
    caseTypes: CASE_TYPES,
    
    // Methods
    analyzeCase,
    quickAnalyze,
    batchAnalyze,
    analyzeAndSearch,
    searchPrecedents,
    getOutcomeDetails,
    checkHealth,
    clearError,
    
    // Helpers
    getConfidenceDisplay,
  };
};

export default useAIAnalysis;
