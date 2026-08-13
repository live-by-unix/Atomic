import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { wsService } from '../services/websocket';
import ChannelSidebar from '../components/ChannelSidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import CallPanel from '../components/CallPanel';
import UserStatusIndicator from '../components/UserStatusIndicator';
import './ChatPage.css';

export default function ChatPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const updateUserStatus = useChatStore((state) => state.updateUserStatus);
  const addVoicemail = useChatStore((state) => state.addVoicemail);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    wsService.on('new_message', (message) => {
      addMessage(message);
    });

    wsService.on('message_edited', (message) => {
      updateMessage(message.id, message);
    });

    wsService.on('message_deleted', (data) => {
      removeMessage(data.messageId);
    });

    wsService.on('voicemail_created', (voicemail) => {
      addVoicemail(voicemail);
    });

    wsService.on('presence_update', (data) => {
      updateUserStatus(data.userId, data.status);
    });

    wsService.on('typing', (data) => {
      // Handle typing indicators (could add UI for this)
      console.log(`${data.username} is ${data.isTyping ? 'typing' : 'not typing'} in channel ${data.channelId}`);
    });

    return () => {
      wsService.off('new_message', () => {});
      wsService.off('message_edited', () => {});
      wsService.off('message_deleted', () => {});
      wsService.off('voicemail_created', () => {});
      wsService.off('presence_update', () => {});
    };
  }, [token, navigate, addMessage, updateMessage, removeMessage, addVoicemail, updateUserStatus]);

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="header-left">
          <h1>Atomic Chat</h1>
          <UserStatusIndicator user={user!} showName />
        </div>
        <div className="header-right">
          <button onClick={() => navigate('/settings')} className="settings-button">
            ⚙️ Settings
          </button>
        </div>
      </div>
      <div className="chat-main">
        <ChannelSidebar />
        <div className="chat-content">
          <MessageList />
          <MessageInput />
        </div>
        <CallPanel />
      </div>
    </div>
  );
}
