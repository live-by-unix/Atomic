import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { api } from '../services/api';
import './SettingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const channels = useChatStore((state) => state.channels);
  const setChannels = useChatStore((state) => state.setChannels);
  
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.channels.create({
        name: newChannelName,
        description: newChannelDescription || undefined,
        isPrivate,
      });

      if (response.success && response.data) {
        setChannels([...channels, response.data]);
        setNewChannelName('');
        setNewChannelDescription('');
        setIsPrivate(false);
        setShowCreateChannel(false);
      } else {
        setError(response.error || 'Failed to create channel');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveChannel = async (channelId: string) => {
    try {
      const response = await api.channels.leave(channelId);
      if (response.success) {
        setChannels(channels.filter(c => c.id !== channelId));
      }
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <button onClick={() => navigate('/chat')} className="back-button">
            ← Back to Chat
          </button>
        </div>

        <div className="settings-section">
          <h2>Account</h2>
          <div className="account-info">
            <div className="info-item">
              <label>Username:</label>
              <span>{user?.username}</span>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <span>{user?.status}</span>
            </div>
            <div className="info-item">
              <label>Member since:</label>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <h2>Channels</h2>
            <button
              onClick={() => setShowCreateChannel(!showCreateChannel)}
              className="create-channel-button"
            >
              {showCreateChannel ? 'Cancel' : '+ Create Channel'}
            </button>
          </div>

          {showCreateChannel && (
            <form onSubmit={handleCreateChannel} className="create-channel-form">
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label htmlFor="channelName">Channel Name</label>
                <input
                  type="text"
                  id="channelName"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  required
                  minLength={3}
                  placeholder="Enter channel name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="channelDescription">Description (optional)</label>
                <input
                  type="text"
                  id="channelDescription"
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="Enter channel description"
                />
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  Private Channel
                </label>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Channel'}
              </button>
            </form>
          )}

          <div className="channels-list">
            {channels.map((channel) => (
              <div key={channel.id} className="channel-item">
                <div className="channel-info">
                  <h3>{channel.name}</h3>
                  {channel.description && <p>{channel.description}</p>}
                  <span className={`channel-type ${channel.isPrivate ? 'private' : 'public'}`}>
                    {channel.isPrivate ? '🔒 Private' : '🌐 Public'}
                  </span>
                </div>
                <button
                  onClick={() => handleLeaveChannel(channel.id)}
                  className="leave-button"
                >
                  Leave
                </button>
              </div>
            ))}
            {channels.length === 0 && (
              <p className="no-channels">No channels yet. Create one to get started!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
