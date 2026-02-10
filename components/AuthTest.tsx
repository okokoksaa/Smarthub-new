import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { socketManager } from '../lib/api-client';

interface AuthTestProps {}

const AuthTest: React.FC<AuthTestProps> = () => {
  const { currentUser, login, logout, loading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const result = await login({ email, password });
      
      if (result.requiresMfa) {
        setSuccess('MFA required - please enter your verification code');
      } else {
        setSuccess('Login successful!');
        // Test WebSocket connection
        checkWebSocketConnection();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setSuccess('Logged out successfully');
      setWsConnected(false);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    }
  };

  const checkWebSocketConnection = () => {
    // Listen for connection status
    socketManager.on('connect', () => {
      setWsConnected(true);
      setSuccess('Login successful! WebSocket connected.');
    });

    socketManager.on('disconnect', () => {
      setWsConnected(false);
    });

    socketManager.on('connect_error', () => {
      setWsConnected(false);
      setError('WebSocket connection failed');
    });
  };

  const testWebSocketMessage = () => {
    if (wsConnected) {
      socketManager.emit('test_message', { message: 'Hello from frontend!' });
      setSuccess('Test message sent via WebSocket');
    } else {
      setError('WebSocket not connected');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6 m-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Authentication Test</h2>
      
      {/* Connection Status */}
      <div className="mb-4 p-3 rounded-lg">
        <div className="flex items-center justify-between">
          <span>Backend API:</span>
          <span className="font-mono text-sm">{import.meta.env.VITE_API_URL}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span>WebSocket:</span>
          <div className="flex items-center">
            <span className="font-mono text-sm mr-2">{import.meta.env.VITE_WS_URL}</span>
            <div
              className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={wsConnected ? 'Connected' : 'Disconnected'}
            />
          </div>
        </div>
      </div>

      {/* User Status */}
      {isAuthenticated && currentUser && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">Logged in as:</h3>
          <div className="text-sm text-green-700">
            <p><strong>Name:</strong> {currentUser.name}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Role:</strong> {currentUser.role}</p>
            <p><strong>Scope:</strong> {currentUser.scope}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      {!isAuthenticated && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}

      {/* Logout Button */}
      {isAuthenticated && (
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Logout
          </button>
          
          {/* WebSocket Test */}
          {wsConnected && (
            <button
              onClick={testWebSocketMessage}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Test WebSocket Message
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">Processing request...</p>
        </div>
      )}

      {/* Debug Info */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600">Debug Information</summary>
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
          <p><strong>Auth State:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
          <p><strong>Loading:</strong> {loading ? 'True' : 'False'}</p>
          <p><strong>WebSocket:</strong> {wsConnected ? 'Connected' : 'Disconnected'}</p>
          <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL}</p>
          <p><strong>WS URL:</strong> {import.meta.env.VITE_WS_URL}</p>
          <p><strong>User:</strong> {currentUser ? JSON.stringify(currentUser, null, 2) : 'None'}</p>
        </div>
      </details>
    </div>
  );
};

export default AuthTest;