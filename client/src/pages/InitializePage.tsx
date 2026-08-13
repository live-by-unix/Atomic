import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import './InitializePage.css';

export default function InitializePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const setChannels = useChatStore((state) => state.setChannels);
  const setUsers = useChatStore((state) => state.setUsers);
  const setUnreadCounts = useChatStore((state) => state.setUnreadCounts);

  useEffect(() => {
    const initialize = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await api.init.get();
        
        if (response.success && response.data) {
          const { channels, users, unreadCounts } = response.data;
          
          setChannels(channels);
          setUsers(users);
          setUnreadCounts(unreadCounts);
          
          wsService.connect(token);
          
          navigate('/chat');
        } else {
          setError(response.error || 'Initialization failed');
        }
      } catch (err) {
        setError('An error occurred during initialization');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [token, navigate, setChannels, setUsers, setUnreadCounts]);

  if (loading) {
    return (
      <div className="initialize-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="initialize-page">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => navigate('/login')}>Back to Login</button>
        </div>
      </div>
    );
  }

  return null;
}
