import { useState, useEffect } from 'react';
import { lawyerService } from '../services/api';

export const useLawyerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalRequests: 0,
    newRequestsThisWeek: 0,
    acceptedCases: 0,
    activeCases: 0,
    activeChats: 0,
    unreadMessages: 0,
    pastCases: 0,
    totalCasesHandled: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await lawyerService.getDashboardStats();
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return { dashboardData, loading, error, refetch: fetchDashboardData };
};

export const useCaseRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await lawyerService.getCaseRequests();
      setRequests(response.data.requests || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching case requests:', err);
      setError('Failed to load case requests');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId, response = '') => {
    try {
      await lawyerService.acceptCaseRequest(requestId, { response });
      await fetchRequests(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error('Error accepting request:', err);
      return { success: false, error: err.response?.data?.error || 'Failed to accept request' };
    }
  };

  const rejectRequest = async (requestId, response = '') => {
    try {
      await lawyerService.rejectCaseRequest(requestId, { response });
      await fetchRequests(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error('Error rejecting request:', err);
      return { success: false, error: err.response?.data?.error || 'Failed to reject request' };
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return { 
    requests, 
    loading, 
    error, 
    refetch: fetchRequests,
    acceptRequest,
    rejectRequest
  };
};

export const useLawyerCases = () => {
  const [cases, setCases] = useState({
    activeCases: [],
    pastCases: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await lawyerService.getMyCases();
      setCases(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return { cases, loading, error, refetch: fetchCases };
};

export const useLawyerChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await lawyerService.getChats();
      setChats(response.data.chats || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return { chats, loading, error, refetch: fetchChats };
};
