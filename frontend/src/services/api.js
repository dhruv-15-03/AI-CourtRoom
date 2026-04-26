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
    
    // Handle JWT token errors - but NOT 403 from auth endpoints (verification flow)
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/signup');
    const requiresVerification = error.response?.data?.requiresVerification;
    
    // Skip force-logout for verification-related 403s from auth endpoints
    if (isAuthEndpoint && (error.response?.status === 403) && requiresVerification) {
      return Promise.reject(error);
    }
    
    // Skip force-logout for subscription/access-related 403s (user is logged in but plan insufficient)
    if (error.response?.status === 403 && !error.response?.data?.message?.includes('JWT') && !error.response?.data?.message?.includes('token')) {
      return Promise.reject(error);
    }
    
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

// Subscription Services - Payment and Plan Management
export const subscriptionService = {
  /**
   * Get all available subscription plans
   */
  getPlans: () => api.get('/api/subscription/plans'),
  
  /**
   * Check user's current access status (subscription/free trial)
   */
  checkAccess: () => api.get('/api/subscription/access'),
  
  /**
   * Get user's subscription history
   */
  getHistory: () => api.get('/api/subscription/history'),
  
  /**
   * Create a Razorpay order for subscription purchase
   * @param {string} planId - The plan ID (e.g., 'BASIC', 'PRO', 'PREMIUM', 'UNLIMITED')
   */
  createOrder: (planId) => api.post('/api/subscription/create-order', { planId }),
  
  /**
   * Verify payment and activate subscription
   * @param {Object} paymentData - { orderId, paymentId, signature, paymentMethod }
   */
  verifyPayment: (paymentData) => api.post('/api/subscription/verify-payment', paymentData),
  
  /**
   * Cancel a subscription
   * @param {number} subscriptionId - The subscription ID to cancel
   */
  cancelSubscription: (subscriptionId) => api.post(`/api/subscription/${subscriptionId}/cancel`),
  
  /**
   * Use an AI query (call before each AI request to track usage)
   */
  useQuery: () => api.post('/api/subscription/use-query'),
};

// AI Court API Services - Comprehensive Legal Case Prediction
export const aiService = {
  // ============== Core Analysis Endpoints ==============
  
  /**
   * Primary case analysis with full details - NOW WITH SUBSCRIPTION AWARENESS
   * Uses backend proxy that enriches response based on user's subscription plan
   * FREE: Basic prediction only
   * BASIC/PRO: Prediction + limited key factors
   * UNLIMITED: Full details with all factors, explanations, and implications
   * Rate Limit: 30/minute
   */
  analyzeCase: (caseData) => api.post('/api/ai-analysis/analyze', caseData),
  
  /**
   * Quick analysis for high-throughput scenarios
   * Rate Limit: 60/minute
   */
  analyzeQuick: (text, caseType = null) => api.post('/api/ai-analysis/analyze/quick', { 
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
   * Health check and model status - via backend proxy
   */
  checkHealth: () => api.get('/api/ai-analysis/health'),
  
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

// ============== AI Agent (Full AI Lawyer) Service ==============
export const agentService = {
  /**
   * Full AI Lawyer analysis — ML prediction + LLM analysis + precedents + strategy
   * Goes through Java proxy for subscription checks
   */
  analyze: (query, options = {}) => api.post('/api/agent/analyze', { query, ...options }),

  /**
   * Full analysis with uploaded documents — the complete AI Lawyer experience
   * Supports multipart/form-data with files
   * @param {string} query - Case description
   * @param {File[]} files - Uploaded document files
   * @param {string} documentsContext - Pre-processed doc text (from upload-documents)
   */
  analyzeWithDocs: (query, files = [], documentsContext = '') => {
    const formData = new FormData();
    formData.append('query', query);
    if (documentsContext) formData.append('documents_context', documentsContext);
    files.forEach(file => formData.append('files', file));
    return api.post('/api/agent/analyze-with-docs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },

  /**
   * Follow-up chat within a case session — agent remembers full context
   * @param {string} sessionId - Session UUID from analyze response
   * @param {string} message - Follow-up question
   */
  chat: (sessionId, message) => api.post('/api/agent/chat', { session_id: sessionId, message }),

  /**
   * Upload documents for AI reading — OCR, text extraction, evidence analysis
   * @param {File[]} files - Array of files (PDF, images, DOCX)
   * @param {string} sessionId - Optional session to attach documents to
   */
  uploadDocuments: (files, sessionId = '') => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (sessionId) formData.append('session_id', sessionId);
    return api.post('/api/agent/upload-documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },

  /**
   * Generate court-ready legal documents (bail applications, appeals, etc.)
   * @param {string} docType - Document type ID (e.g., 'bail_application')
   * @param {object} params - { case_info, session_id, documents_context, user_instructions }
   */
  generateDocument: (docType, params = {}) => api.post('/api/agent/generate-document', {
    doc_type: docType,
    ...params,
  }),

  /**
   * List available court document types the AI can draft
   */
  getDocumentTypes: () => api.get('/api/agent/document-types'),

  /**
   * Get session info (conversation history, case context)
   */
  getSession: (sessionId) => api.get(`/api/agent/session/${sessionId}`),

  /**
   * Agent health check
   */
  checkHealth: () => api.get('/api/agent/health'),

  /**
   * Stream a response token-by-token via Server-Sent Events.
   *
   * Hits the Python agent directly (AI_API_URL) to avoid proxy buffering.
   * Caller supplies event handlers; the returned function can be invoked to
   * abort the request.
   *
   * @param {{query: string, sessionId?: string, kCases?: number, kStatutes?: number}} params
   * @param {{onStatus?: Function, onCitations?: Function, onToken?: Function,
   *          onDone?: Function, onError?: Function}} handlers
   * @returns {() => void} abort function
   */
  stream: (params, handlers = {}) => {
    const controller = new AbortController();
    const base = (AI_API_URL || '').replace(/\/api\/?$/, '');
    const url = `${base}/api/agent/stream`;

    (async () => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: params.query,
            session_id: params.sessionId,
            k_cases: params.kCases ?? 5,
            k_statutes: params.kStatutes ?? 5,
          }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`stream failed: HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        // SSE frames are separated by a blank line
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const evtMatch = frame.match(/^event:\s*(.+)$/m);
            const dataLines = [...frame.matchAll(/^data:\s?(.*)$/gm)].map(m => m[1]);
            if (!evtMatch || dataLines.length === 0) continue;
            const evt = evtMatch[1].trim();
            let payload;
            try { payload = JSON.parse(dataLines.join('\n')); } catch { payload = { raw: dataLines.join('\n') }; }
            if (evt === 'status') handlers.onStatus?.(payload);
            else if (evt === 'citations') handlers.onCitations?.(payload);
            else if (evt === 'token') handlers.onToken?.(payload);
            else if (evt === 'done') handlers.onDone?.(payload);
            else if (evt === 'error') handlers.onError?.(payload);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') handlers.onError?.({ message: err.message });
      }
    })();

    return () => controller.abort();
  },
};

// ============== User Feedback (was this helpful?) ==============
export const feedbackService = {
  submit: ({ responseType, helpful, queryExcerpt, sessionId, comment }) =>
    aiApi.post('/api/feedback', {
      response_type: responseType,
      helpful,
      query_excerpt: queryExcerpt,
      session_id: sessionId,
      comment,
    }),
  stats: () => aiApi.get('/api/feedback/stats'),
};

// ============== Active Learning (Phase 3 — human-in-the-loop labeling) ==============
// These endpoints live on the Python AI service. They're exposed to admins/judges
// for reviewing low-confidence predictions and supplying ground-truth labels.
export const activeLearningService = {
  getQueue: () => aiApi.get('/api/active_learning/queue'),
  addToQueue: (payload) => aiApi.post('/api/active_learning/queue', payload),
  label: (itemId, { label, labeler }) =>
    aiApi.post(`/api/active_learning/queue/${itemId}`, { label, labeler }),
  suggestLabel: (text) => aiApi.post('/api/active_learning/suggest_label', { text }),
  retrain: () => aiApi.post('/api/active_learning/retrain', {}),
  stats: () => aiApi.get('/api/active_learning/stats'),
  syncOutcomes: (opts = {}) => aiApi.post('/api/active_learning/sync_outcomes', opts),
};

// ============== Case Outcome Tracking (Phase 2 — ML feedback loop) ==============
export const outcomeService = {
  recordPredicted: (caseId, { outcome, confidence, modelVersion }) =>
    api.post(`/api/cases/${caseId}/predicted-outcome`, {
      outcome, confidence, modelVersion,
    }),
  recordActual: (caseId, { outcome, notes }) =>
    api.post(`/api/cases/${caseId}/actual-outcome`, { outcome, notes }),
  stats: () => api.get('/api/cases/outcome-stats'),
};

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
// ============== Hearing Management (Phase 4 — Court Integration) ==============
export const hearingService = {
  schedule: (data) => api.post('/api/hearings', data),
  get: (id) => api.get(`/api/hearings/${id}`),
  getForCase: (caseId) => api.get(`/api/hearings/case/${caseId}`),
  upcoming: () => api.get('/api/hearings/upcoming'),
  byDate: (date) => api.get(`/api/hearings/date/${date}`),
  update: (id, data) => api.put(`/api/hearings/${id}`, data),
  adjourn: (id, data) => api.post(`/api/hearings/${id}/adjourn`, data),
  complete: (id, data) => api.post(`/api/hearings/${id}/complete`, data),
  calendarStats: (from, to) => api.get('/api/hearings/calendar-stats', { params: { from, to } }),
  roomAvailability: (courtRoom, date) =>
    api.get('/api/hearings/room-availability', { params: { courtRoom, date } }),
};

// ============== Audit Log (Phase 4 — Court Integration) ==============
export const auditService = {
  // Java backend audit (full case/user actions)
  getLog: (page = 0, size = 50) => api.get('/api/audit', { params: { page, size } }),
  getEntityTrail: (type, id) => api.get(`/api/audit/entity/${type}/${id}`),
  getByRange: (from, to) => api.get('/api/audit/range', { params: { from, to } }),
  // Python AI audit (analysis, doc gen, retrain events)
  getAILog: (limit = 200) => aiApi.get('/api/audit/ai', { params: { limit } }),
};

export const CASE_TYPES = ['Criminal', 'Civil', 'Labor', 'Family'];

export default api;
