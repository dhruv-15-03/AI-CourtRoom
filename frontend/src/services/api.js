import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ;
const AI_API_URL = process.env.REACT_APP_AI_API_URL ;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const aiApi = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = 'application/json';
    
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
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
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
};

// Case Services - Comprehensive case management
export const caseService = {
  // Basic CRUD
  createCase: (caseData) => api.post('/api/cases', caseData),
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
  getMessages: (chatId) => api.get(`/api/chat/${chatId}/messages`),
  sendMessage: (chatId, message) => api.post(`/api/chat/${chatId}/messages`, { content: message }),
  createChat: (participants) => api.post('/api/chat/create', { participants }),
};

// AI Services
export const aiService = {
  askQuestion: (question, context = {}) => aiApi.post('/ask', { question, context }),
  getQuestionnaire: (caseType) => aiApi.get(`/questionnaire/${caseType}`),
  submitQuestionnaire: (answers) => aiApi.post('/questionnaire/submit', answers),
  chatWithAI: (message, conversationId) => aiApi.post('/chat', { message, conversationId }),
};

export default api;
