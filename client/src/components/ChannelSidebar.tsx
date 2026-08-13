import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import './ChannelSidebar.css';

export default function ChannelSidebar() {
  const navigate = useNavigate();
  const channels = useChatStore((state) => state.channels);
  const currentChannel = useChatStore((state) => state.currentChannel);
  const setCurrentChannel = useChatStore((state) => state.setCurrentChannel);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const logout = useAuthStore((state) => state.logout);

  const handleChannelClick = async (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      setCurrentChannel(channel);
      try {
        await api.channels.getMessages(channelId);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    }
  };

  const handleLogout = () => {
    wsService.disconnect();
    logout();
    navigate('/login');
  };

  return (
    <div className="channel-sidebar">
      <div className="sidebar-header">
        <h2>Channels</h2>
        <button 
          className="logout-button"
          onClick={handleLogout}
          title="Logout"
        >
          Logout
        </button>
      </div>
      <div className="channel-list">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className={`channel-item ${currentChannel?.id === channel.id ? 'active' : ''}`}
            onClick={() => handleChannelClick(channel.id)}
          >
            <span className="channel-name">{channel.name}</span>
            {unreadCounts[channel.id] > 0 && (
              <span className="unread-badge">{unreadCounts[channel.id]}</span>
            )}
          </div>
        ))}
        {channels.length === 0 && (
          <div className="no-channels">
            <p>No channels yet</p>
            <p className="hint">Create a channel to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
