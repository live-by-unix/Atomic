import { create } from 'zustand';
import { Channel, Message, User, Voicemail } from '@atomic-chat/shared';

interface ChatState {
  channels: Channel[];
  currentChannel: Channel | null;
  messages: Message[];
  users: User[];
  unreadCounts: Record<string, number>;
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updatedMessage: Message) => void;
  removeMessage: (messageId: string) => void;
  setUsers: (users: User[]) => void;
  updateUserStatus: (userId: string, status: 'online' | 'offline' | 'idle') => void;
  setUnreadCounts: (counts: Record<string, number>) => void;
  addVoicemail: (voicemail: Voicemail) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  users: [],
  unreadCounts: {},
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (messageId, updatedMessage) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? updatedMessage : msg
      ),
    })),
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),
  setUsers: (users) => set({ users }),
  updateUserStatus: (userId, status) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, status } : user
      ),
    })),
  setUnreadCounts: (counts) => set({ unreadCounts: counts }),
  addVoicemail: (voicemail) =>
    set((state) => {
      const voicemailMessage: Message = {
        id: `msg-${voicemail.id}`,
        channelId: voicemail.channelId,
        userId: voicemail.userId,
        content: 'Voicemail',
        type: 'voicemail',
        voicemailId: voicemail.id,
        createdAt: voicemail.createdAt,
        updatedAt: voicemail.createdAt,
        edited: false,
      };
      return { messages: [...state.messages, voicemailMessage] };
    }),
}));
