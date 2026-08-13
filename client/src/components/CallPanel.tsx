import { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../store/callStore';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import './CallPanel.css';

export default function CallPanel() {
  const {
    activeCall,
    localStream,
    remoteStream,
    peerConnection,
    isMuted,
    isVideoOff,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    setActiveCall,
    toggleMute,
    toggleVideo,
    endCall,
  } = useCallStore();

  const currentChannel = useChatStore((state) => state.currentChannel);
  const users = useChatStore((state) => state.users);
  const currentUser = useAuthStore((state) => state.user);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startCall = async (targetUserId: string, type: 'audio' | 'video') => {
    if (!currentChannel || !currentUser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      setPeerConnection(pc);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && activeCall) {
          api.calls.ice({
            callId: activeCall.callId,
            candidate: {
              candidate: event.candidate.candidate || '',
              sdpMid: event.candidate.sdpMid || null,
              sdpMLineIndex: event.candidate.sdpMLineIndex || null,
            },
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await api.calls.offer({
        channelId: currentChannel.id,
        callerId: currentUser.id,
        calleeId: targetUserId,
        type,
        sdp: { type: offer.type || 'offer', sdp: offer.sdp || '' },
      });

      if (response.success && response.data) {
        const callData = response.data;
        setActiveCall({
          callId: callData.callId ? String(callData.callId) : `call-${Date.now()}`,
          remoteUserId: targetUserId,
          type,
        });
        setPeerConnection(pc);
      }
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not start call. Please check camera/microphone permissions.');
    }
  };

  const answerCall = async (callData: any) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callData.type === 'video',
      });

      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      setPeerConnection(pc);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && activeCall) {
          api.calls.ice({
            callId: activeCall.callId,
            candidate: {
              candidate: event.candidate.candidate || '',
              sdpMid: event.candidate.sdpMid || null,
              sdpMLineIndex: event.candidate.sdpMLineIndex || null,
            },
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(callData.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await api.calls.answer({
        callId: callData.callId ? String(callData.callId) : `call-${Date.now()}`,
        calleeId: callData.calleeId,
        sdp: { type: answer.type || 'answer', sdp: answer.sdp || '' },
      });

      const callId = callData.callId ? String(callData.callId) : `call-${Date.now()}`;
      const callerId = callData.callerId ? String(callData.callerId) : '';
      setActiveCall({
        callId,
        remoteUserId: callerId,
        type: callData.type,
      });
      setIncomingCall(null);
    } catch (error) {
      console.error('Error answering call:', error);
      alert('Could not answer call. Please check camera/microphone permissions.');
    }
  };

  const handleMuteToggle = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        toggleMute();
      }
    }
  };

  const handleVideoToggle = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        toggleVideo();
      }
    }
  };

  const handleEndCall = async () => {
    if (activeCall) {
      await api.calls.end(activeCall.callId);
    }
    endCall();
  };

  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  useEffect(() => {
    wsService.on('call_offer', (callData) => {
      if (callData.calleeId === currentUser?.id) {
        setIncomingCall(callData);
      }
    });

    wsService.on('call_answer', async (answerData) => {
      if (peerConnection && activeCall) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answerData.sdp));
      }
    });

    wsService.on('call_ice_candidate', async (iceData) => {
      if (peerConnection && iceData.callId === activeCall?.callId) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(iceData.candidate));
      }
    });

    wsService.on('call_ended', () => {
      endCall();
    });

    return () => {
      wsService.off('call_offer', () => {});
      wsService.off('call_answer', () => {});
      wsService.off('call_ice_candidate', () => {});
      wsService.off('call_ended', () => {});
    };
  }, [peerConnection, activeCall, currentUser, endCall]);

  if (activeCall) {
    return (
      <div className="call-panel active">
        <div className="call-video-container">
          {activeCall.type === 'video' && (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video"
              />
            </>
          )}
          {activeCall.type === 'audio' && (
            <div className="audio-call-indicator">
              <div className="pulse-ring"></div>
              <span>📞 Audio Call in Progress</span>
            </div>
          )}
        </div>
        <div className="call-controls">
          <button
            onClick={handleMuteToggle}
            className={`control-button ${isMuted ? 'muted' : ''}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          {activeCall.type === 'video' && (
            <button
              onClick={handleVideoToggle}
              className={`control-button ${isVideoOff ? 'video-off' : ''}`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? '📷' : '📹'}
            </button>
          )}
          <button onClick={handleEndCall} className="control-button end-call" title="End call">
            📞
          </button>
        </div>
      </div>
    );
  }

  if (incomingCall) {
    return (
      <div className="call-panel incoming">
        <div className="incoming-call-content">
          <h3>Incoming {incomingCall.type} Call</h3>
          <p>From: {users.find(u => u.id === incomingCall.callerId)?.username || 'Unknown'}</p>
          <div className="incoming-call-buttons">
            <button onClick={() => answerCall(incomingCall)} className="accept-button">
              Accept
            </button>
            <button onClick={() => setIncomingCall(null)} className="reject-button">
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="call-panel">
      <h3>Start a Call</h3>
      <div className="call-users-list">
        {otherUsers.map((user) => (
          <div key={user.id} className="call-user-item">
            <span className="user-name">{user.username}</span>
            <div className="call-buttons">
              <button
                onClick={() => startCall(user.id, 'audio')}
                className="call-button audio"
                title="Audio call"
              >
                📞
              </button>
              <button
                onClick={() => startCall(user.id, 'video')}
                className="call-button video"
                title="Video call"
              >
                📹
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
