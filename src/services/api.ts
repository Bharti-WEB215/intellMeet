// services/api.ts

const API_BASE_URL = 'http://localhost:5000/api';

// Retrieve JWT auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('intellmeet_jwt');
};

// Generic fetch API helper with 401 interceptor
const request = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 401 interceptor: clear token (skip login/register — they return 401 for bad credentials)
  const isAuthEndpoint = path === '/auth/login' || path === '/auth/register';
  if (response.status === 401 && !isAuthEndpoint) {
    localStorage.removeItem('intellmeet_jwt');
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const api = {
  // Auth API
  auth: {
    register: (name: string, email: string, password: string) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    login: (email: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request('/auth/logout', {
        method: 'POST',
      }),
    getProfile: () => request('/auth/me'),
    updateProfile: (data: { name?: string; role?: string; company?: string; avatar?: string }) =>
      request('/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Copilot API
  copilot: {
    chat: (message: string, meetingId?: string | null, context?: string) =>
      request('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({ message, meeting_id: meetingId, context }),
      }),
  },

  // Meetings API
  meetings: {
    list: () => request('/meetings'),
    create: (title: string) =>
      request('/meetings', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    get: (id: string) => request(`/meetings/${id}`),
    postTranscript: (meetingId: string, speaker_name: string, text: string) =>
      request(`/meetings/${meetingId}/transcript`, {
        method: 'POST',
        body: JSON.stringify({ speaker_name, text }),
      }),
    getTranscript: (meetingId: string) => request(`/meetings/${meetingId}/transcript`),
    end: (meetingId: string) =>
      request(`/meetings/${meetingId}/end`, {
        method: 'POST',
      }),
    getSummary: (meetingId: string) => request(`/meetings/${meetingId}/summary`),
    getMessages: (meetingId: string) => request(`/meetings/${meetingId}/messages`),
    getParticipants: (meetingId: string) => request(`/meetings/${meetingId}/participants`),
  },

  // Tasks API
  tasks: {
    list: () => request('/tasks'),
    create: (task: {
      title: string;
      description?: string;
      assignee_name?: string;
      assignee_avatar?: string;
      priority?: 'low' | 'medium' | 'high';
      deadline?: string;
      status?: 'todo' | 'in-progress' | 'review' | 'done';
    }) =>
      request('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      }),
    updateStatus: (id: string, status: 'todo' | 'in-progress' | 'review' | 'done') =>
      request(`/tasks/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) =>
      request(`/tasks/${id}`, {
        method: 'DELETE',
      }),
  },

  // Workspace API
  workspace: {
    getChannels: () => request('/workspace/channels'),
    getMessages: (channelId: string) => request(`/workspace/channels/${channelId}/messages`),
    postMessage: (channelId: string, text: string) =>
      request(`/workspace/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    getFiles: () => request('/workspace/files'),
    registerFile: (file: { name: string; size: string; type: string }) =>
      request('/workspace/files', {
        method: 'POST',
        body: JSON.stringify(file),
      }),
    getActivities: () => request('/workspace/activities'),
  },

  // Documents API
  documents: {
    list: () => request('/documents'),
    create: (title: string, content: string) =>
      request('/documents', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      }),
  },

  // Notifications API
  notifications: {
    list: () => request('/notifications'),
    markRead: (id: string) =>
      request(`/notifications/${id}/read`, {
        method: 'PUT',
      }),
  },

  // Analytics API
  analytics: {
    getDashboard: () => request('/analytics/dashboard'),
    getDNA: (meetingId: string) => request(`/analytics/meetings/${meetingId}/dna`),
    getSentiment: (meetingId: string) => request(`/analytics/meetings/${meetingId}/sentiment`),
    getTrends: () => request('/analytics/trends'),
    getAttendance: () => request('/analytics/attendance'),
  },
};
