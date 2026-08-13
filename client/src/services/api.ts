import {
  LoginRequest,
  RegisterRequest,
  CreateChannelRequest,
  SendMessageRequest,
  EditMessageRequest,
  ApiResponse,
  AuthResponse,
  InitializationData,
  Channel,
  Message,
  Voicemail,
  CallOffer,
  CallAnswer,
  IceCandidate,
} from '@atomic-chat/shared';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth-token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  return data;
}

export const api = {
  auth: {
    login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    register: async (credentials: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    getMe: async (): Promise<ApiResponse<any>> => {
      return request('/auth/me');
    },
  },
  channels: {
    list: async (): Promise<ApiResponse<Channel[]>> => {
      return request('/channels');
    },
    create: async (data: CreateChannelRequest): Promise<ApiResponse<Channel>> => {
      return request('/channels', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    join: async (channelId: string): Promise<ApiResponse<any>> => {
      return request(`/channels/${channelId}/join`, {
        method: 'POST',
      });
    },
    leave: async (channelId: string): Promise<ApiResponse<any>> => {
      return request(`/channels/${channelId}/leave`, {
        method: 'POST',
      });
    },
    getMessages: async (channelId: string, limit?: number, before?: string): Promise<ApiResponse<Message[]>> => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (before) params.append('before', before);
      return request(`/channels/${channelId}/messages?${params.toString()}`);
    },
  },
  messages: {
    send: async (data: SendMessageRequest): Promise<ApiResponse<Message>> => {
      return request('/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    edit: async (messageId: string, data: EditMessageRequest): Promise<ApiResponse<Message>> => {
      return request(`/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (messageId: string): Promise<ApiResponse<any>> => {
      return request(`/messages/${messageId}`, {
        method: 'DELETE',
      });
    },
  },
  voicemail: {
    upload: async (file: File, channelId: string, duration: number): Promise<ApiResponse<Voicemail>> => {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('channelId', channelId);
      formData.append('duration', duration.toString());
      
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE}/voicemail`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      
      return response.json();
    },
    getUrl: (filename: string): string => {
      return `${API_BASE}/voicemail/${filename}`;
    },
  },
  calls: {
    offer: async (data: CallOffer): Promise<ApiResponse<{ callId?: string; callerId: string; calleeId: string; type: string; sdp: any }>> => {
      return request('/calls/offer', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    answer: async (data: CallAnswer): Promise<ApiResponse<{ callId?: string; calleeId: string; sdp: any }>> => {
      return request('/calls/answer', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    ice: async (data: IceCandidate): Promise<ApiResponse<any>> => {
      return request('/calls/ice', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    end: async (callId: string): Promise<ApiResponse<any>> => {
      return request(`/calls/${callId}/end`, {
        method: 'POST',
      });
    },
  },
  init: {
    get: async (): Promise<ApiResponse<InitializationData>> => {
      return request('/init');
    },
  },
};
