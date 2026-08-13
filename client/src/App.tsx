import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InitializePage from './pages/InitializePage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import { useAuthStore } from './store/authStore';

function App() {
  const { token, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/initialize" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/initialize" /> : <RegisterPage />}
        />
        <Route
          path="/initialize"
          element={!token ? <Navigate to="/login" /> : <InitializePage />}
        />
        <Route
          path="/chat"
          element={!token ? <Navigate to="/login" /> : <ChatPage />}
        />
        <Route
          path="/settings"
          element={!token ? <Navigate to="/login" /> : <SettingsPage />}
        />
        <Route path="/" element={<Navigate to={token ? "/initialize" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
