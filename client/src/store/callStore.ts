import { create } from 'zustand';

interface CallState {
  activeCall: {
    callId: string;
    remoteUserId: string;
    type: 'audio' | 'video';
  } | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isMuted: boolean;
  isVideoOff: boolean;
  setActiveCall: (call: { callId?: string; remoteUserId?: string; type: 'audio' | 'video' } | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  endCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isMuted: false,
  isVideoOff: false,
  setActiveCall: (call) => {
    if (call) {
      set({
        activeCall: {
          callId: call.callId || '',
          remoteUserId: call.remoteUserId || '',
          type: call.type,
        }
      });
    } else {
      set({ activeCall: null });
    }
  },
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleVideo: () => set((state) => ({ isVideoOff: !state.isVideoOff })),
  endCall: () => {
    const state = useCallStore.getState();
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    if (state.peerConnection) {
      state.peerConnection.close();
    }
    set({
      activeCall: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isVideoOff: false,
    });
  },
}));
