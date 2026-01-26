import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
const AI_API_URL = process.env.REACT_APP_AI_API_URL || 'https://ai-court-ai.onrender.com/api';

// Default timeout for requests (30 seconds)
const DEFAULT_TIMEOUT = 30000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

const aiApi = axios.create({
  baseURL: AI_API_URL,
  timeout: 60000, // AI requests may take longer
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle JWT token errors
    if (error.response?.status === 401 || 
        error.response?.status === 403 ||
        (error.response?.data?.message && 
         (error.response.data.message.includes('JWT') || 
          error.response.data.message.includes('token') ||
          error.response.data.message.includes('Unauthorized') ||
          error.response.data.message.includes('expired')))) {
      
      console.warn('JWT token invalid or expired, redirecting to login...');
      
      // Clear all auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      
      // Dispatch logout event for AuthContext
      window.dispatchEvent(new CustomEvent('forceLogout'));
      
      // Redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/signup', userData),
  logout: async () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      
     
      window.location.href = '/login';
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      window.location.href = '/login';
      
      return { success: false, error: error.message };
    }
  }
};

// User Services
export const userService = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data) => api.put('/api/user/profile', data),
  getLawyers: (filters = {}) => api.get('/api/user/lawyers', { params: filters }),
  requestLawyer: (lawyerId, caseData) => api.post(`/api/user/request-lawyer/${lawyerId}`, caseData),
  getCases: () => api.get('/api/user/cases'),
  getChats: () => api.get('/api/user/chats'),
  decrementAttempts: () => api.post('/api/user/decrement-attempts'),
};

// Case Services - Comprehensive case management
export const caseService = {
  // Basic CRUD
  createCase: (caseData) => api.post('/api/cases', caseData),
  createIndianCase: (caseData) => api.post('/api/cases/create-indian-case', caseData),
  getIndianTemplates: () => api.get('/api/cases/indian-templates'),
  getCaseById: (id) => api.get(`/api/cases/${id}`),
  getAllCases: (params = {}) => api.get('/api/cases/all', { params }),
  updateCase: (id, caseData) => api.put(`/api/cases/${id}`, caseData),
  deleteCase: (id) => api.delete(`/api/cases/${id}`),
  
  searchCases: (query) => api.get('/api/cases/search', { params: { query } }),
  getActiveCases: () => api.get('/api/cases/all', { params: { status: 'active' } }),
  getClosedCases: () => api.get('/api/cases/all', { params: { status: 'closed' } }),
  
  assignLawyer: (caseId, lawyerId) => api.post(`/api/cases/${caseId}/assign-lawyer/${lawyerId}`),
  assignJudge: (caseId, judgeId) => api.post(`/api/cases/${caseId}/assign-judge/${judgeId}`),
  closeCase: (caseId, judgement) => api.post(`/api/cases/${caseId}/close`, { judgement }),
  reopenCase: (caseId) => api.post(`/api/cases/${caseId}/reopen`),
  addJudgement: (caseId, judgement) => api.post(`/api/cases/${caseId}/judgement`, { judgement }),
  setNextHearing: (caseId, date) => api.post(`/api/cases/${caseId}/next-hearing`, { date }),
  
  getStatistics: () => api.get('/api/cases/statistics'),
  getUpcomingHearings: () => api.get('/api/cases/upcoming-hearings'),
};

// Lawyer Services
export const lawyerService = {
  getProfile: () => api.get('/api/user/profile'), // Use unified endpoint
  getDashboardStats: () => api.get('/api/lawyer/dashboard'),
  getCaseRequests: () => api.get('/api/lawyer/case-requests'),
  acceptCaseRequest: (requestId) => api.post(`/api/lawyer/case-requests/${requestId}/accept`),
  rejectCaseRequest: (requestId) => api.post(`/api/lawyer/case-requests/${requestId}/reject`),
  getMyCases: () => api.get('/api/lawyer/cases'),
  updateProfile: (data) => api.put('/api/user/profile', data), // Use unified endpoint
  getChats: () => api.get('/api/lawyer/chats'),
};

// Judge Services
export const judgeService = {
  getProfile: () => api.get('/api/user/profile'), // Use unified endpoint
  getDashboardStats: () => api.get('/api/judge/dashboard'),
  getPendingCases: () => api.get('/api/judge/pending-cases'),
  getCaseDetails: (caseId) => api.get(`/api/judge/cases/${caseId}`),
  updateCaseStatus: (caseId, status) => api.put(`/api/judge/cases/${caseId}/status`, { status }),
  addJudgment: (caseId, judgment) => api.post(`/api/judge/cases/${caseId}/judgment`, { judgment }),
  getJudgments: () => api.get('/api/judge/judgments'),
  updateProfile: (data) => api.put('/api/user/profile', data), // Use unified endpoint
};

// Chat Services
export const chatService = {
  getChats: () => api.get('/api/chat/list'),
  getChatMessages: (chatId, limit = 50) => api.get(`/api/chat/${chatId}/messages`, { params: { limit } }),
  sendMessage: (chatId, content) => api.post(`/api/chat/${chatId}/send`, { content }),
  createChat: (participantIds, chatName = null, chatType = 'DIRECT') => 
    api.post('/api/chat/create', { participantIds, chatName, chatType }),
  searchUsers: (query, limit = 10) => api.get('/api/chat/search-users', { params: { query, limit } }),
  
  // Legacy methods for backward compatibility
  getMessages: (chatId) => api.get(`/api/chat/${chatId}/messages`),
};

// AI Court API Services - Comprehensive Legal Case Prediction
export const aiService = {
  // ============== Core Analysis Endpoints ==============
  
  /**
   * Primary case analysis with full details
   * Rate Limit: 30/minute
   */
  analyzeCase: (caseData) => aiApi.post('/analyze', caseData),
  
  /**
   * Quick analysis for high-throughput scenarios
   * Rate Limit: 60/minute
   */
  analyzeQuick: (text, caseType = null) => aiApi.post('/analyze/quick', { 
    text, 
    ...(caseType && { case_type: caseType }) 
  }),
  
  /**
   * Batch analysis - process multiple cases (up to 50)
   * Rate Limit: 10/minute
   * @param {Array} cases - Array of case objects
   * @param {string} format - 'minimal' | 'full' | 'detailed'
   */
  analyzeBatch: (cases, format = 'full') => aiApi.post('/analyze/batch', { cases, format }),
  
  /**
   * Combined prediction + similar case retrieval
   * Rate Limit: 20/minute
   */
  analyzeAndSearch: (caseData) => aiApi.post('/analyze_and_search', caseData),
  
  // ============== RAG (Retrieval-Augmented Generation) ==============
  
  /**
   * Semantic search over case database with precedent retrieval
   * Rate Limit: 30/minute
   * @param {string} question - Natural language query
   * @param {number} k - Number of similar cases to retrieve (max 10)
   */
  ragQuery: (question, k = 5) => aiApi.post('/rag/query', { question, k }),
  
  // ============== Questions & Reference Endpoints ==============
  
  /**
   * Get initial case type selection questions
   */
  getInitialQuestions: () => aiApi.get('/questions/initial'),
  
  /**
   * Get questions for a specific case type
   * @param {string} caseType - 'Criminal' | 'Civil' | 'Labor' | 'Family'
   */
  getQuestionsByType: (caseType) => aiApi.get(`/questions/${caseType}`),
  
  /**
   * Get all case type categories and their input fields
   */
  getAllQuestions: () => aiApi.get('/questions'),
  
  /**
   * Get all possible prediction outcomes with descriptions
   */
  getOutcomes: () => aiApi.get('/outcomes'),
  
  /**
   * Get details for a specific outcome
   * @param {string} outcome - e.g., 'Bail Granted', 'Conviction'
   */
  getOutcomeDetails: (outcome) => aiApi.get(`/outcomes/${encodeURIComponent(outcome)}`),
  
  // ============== Monitoring & Health ==============
  
  /**
   * Health check and model status
   */
  checkHealth: () => aiApi.get('/health'),
  
  /**
   * Model metadata, version, and classes
   */
  getModelInfo: () => aiApi.get('/model/info'),
  
  /**
   * Model precision, recall, F1 scores
   */
  getModelMetrics: () => aiApi.get('/model/metrics'),
  
  /**
   * Data drift detection stats
   */
  getDriftStats: () => aiApi.get('/drift'),
  
  // ============== Backend Gemini API (for general chatbot) ==============
  
  chatWithGemini: (message) => api.post('/api/ai/chat', { message }),
  checkGeminiHealth: () => api.get('/api/ai/health'),
  
  // ============== Legacy endpoints (backward compatibility) ==============
  
  askQuestion: (question, context = {}) => aiApi.post('/ask', { question, context }),
  getQuestionnaire: (caseType) => aiApi.get(`/questionnaire/${caseType}`),
  submitQuestionnaire: (answers) => aiApi.post('/questionnaire/submit', answers),
  chatWithAI: (message, conversationId) => aiApi.post('/chat', { message, conversationId }),
};

// ============== Confidence Level Helpers ==============

/**
 * Get confidence display information based on score
 * @param {number} confidence - Confidence score (0-1)
 * @returns {Object} { level, color, icon, message }
 */
export const getConfidenceDisplay = (confidence) => {
  if (confidence >= 0.90) return { 
    level: 'Very High', 
    color: '#22c55e', 
    icon: '✅',
    message: 'Reliable for decision support'
  };
  if (confidence >= 0.75) return { 
    level: 'High', 
    color: '#84cc16', 
    icon: '🟢',
    message: 'Can be used with reasonable assurance'
  };
  if (confidence >= 0.60) return { 
    level: 'Moderate', 
    color: '#eab308', 
    icon: '🟡',
    message: 'Review with additional context'
  };
  if (confidence >= 0.40) return { 
    level: 'Low', 
    color: '#f97316', 
    icon: '🟠',
    message: 'Expert review strongly recommended'
  };
  return { 
    level: 'Very Low', 
    color: '#ef4444', 
    icon: '🔴',
    message: 'Do not rely without verification'
  };
};

/**
 * All possible prediction outcomes
 */
export const PREDICTION_OUTCOMES = [
  'Bail Granted',
  'Bail Denied', 
  'Conviction',
  'Acquittal',
  'Charges Quashed',
  'Compensation Awarded',
  'Petition Dismissed',
  'Injunction Granted',
  'Maintenance Ordered',
  'Other'
];

/**
 * Case types supported by the API
 */
export const CASE_TYPES = ['Criminal', 'Civil', 'Labor', 'Family'];

export default api;
