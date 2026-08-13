export interface User {
  id: string;
  username: string;
  createdAt: Date;
  status: 'online' | 'offline' | 'idle';
  lastSeen?: Date;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  isPrivate: boolean;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  joinedAt: Date;
  role: 'admin' | 'member';
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: 'text' | 'voicemail';
  voicemailId?: string;
  createdAt: Date;
  updatedAt: Date;
  edited: boolean;
}

export interface Voicemail {
  id: string;
  channelId: string;
  userId: string;
  filename: string;
  duration: number;
  mimeType: string;
  createdAt: Date;
}

export interface Call {
  id: string;
  channelId: string;
  callerId: string;
  calleeId: string;
  type: 'audio' | 'video';
  status: 'initiated' | 'ongoing' | 'ended' | 'rejected';
  startedAt: Date;
  endedAt?: Date;
}

export interface CallOffer {
  callId?: string;
  channelId?: string;
  callerId: string;
  calleeId: string;
  type: 'audio' | 'video';
  sdp: { type: string; sdp: string };
}

export interface CallAnswer {
  callId?: string;
  calleeId?: string;
  sdp: { type: string; sdp: string };
}

export interface IceCandidate {
  callId?: string;
  candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null };
}

export interface TypingIndicator {
  channelId: string;
  userId: string;
  isTyping: boolean;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline' | 'idle';
}

export interface WebSocketEvent {
  type: 'join_channel' | 'leave_channel' | 'send_message' | 'edit_message' | 
        'delete_message' | 'typing' | 'presence_update' | 'voicemail_created' |
        'call_offer' | 'call_answer' | 'call_ice_candidate' | 'call_ended';
  payload: any;
}

export interface InitializationData {
  user: User;
  channels: Channel[];
  unreadCounts: Record<string, number>;
  users: User[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  isPrivate: boolean;
}

export interface SendMessageRequest {
  channelId: string;
  content: string;
  type: 'text' | 'voicemail';
  voicemailId?: string;
}

export interface EditMessageRequest {
  content: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
