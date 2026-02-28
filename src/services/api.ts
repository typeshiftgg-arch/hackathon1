import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const getUser = async (userId: string) => {
  const res = await api.get(`/users/${userId}`);
  return res.data;
};

export const updateUser = async (userId: string, data: { monthlyIncome: number, savingsGoal: number }) => {
  const res = await api.put(`/users/${userId}`, data);
  return res.data;
};

export const addTransaction = async (data: any) => {
  const res = await api.post('/transactions', data);
  return res.data;
};

export const getTransactions = async (userId: string) => {
  const res = await api.get(`/transactions/${userId}`);
  return res.data;
};

export const simulateTransactions = async (userId: string) => {
  const res = await api.post(`/transactions/simulate/${userId}`);
  return res.data;
};

export const getDashboard = async (userId: string) => {
  const res = await api.get(`/dashboard/${userId}`);
  return res.data;
};

export const getInterventions = async (userId: string) => {
  const res = await api.get(`/interventions/${userId}`);
  return res.data;
};

export const getActiveInterventions = async (userId: string) => {
  const res = await api.get(`/interventions/${userId}/active`);
  return res.data;
};

export const acknowledgeIntervention = async (id: number) => {
  const res = await api.put(`/interventions/${id}/acknowledge`);
  return res.data;
};
