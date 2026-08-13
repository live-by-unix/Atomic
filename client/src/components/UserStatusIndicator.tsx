import { User } from '@atomic-chat/shared';
import './UserStatusIndicator.css';

interface UserStatusIndicatorProps {
  user: User;
  showName?: boolean;
}

export default function UserStatusIndicator({ user, showName = false }: UserStatusIndicatorProps) {
  const statusColors = {
    online: '#27ae60',
    offline: '#7f8c8d',
    idle: '#f39c12',
  };

  return (
    <div className="user-status-indicator">
      <div
        className="status-dot"
        style={{ backgroundColor: statusColors[user.status] }}
        title={user.status}
      />
      {showName && <span className="user-name">{user.username}</span>}
    </div>
  );
}
