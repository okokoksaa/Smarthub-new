import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // This will be proxied by Vite to the backend server during development
  timeout: 10000, // 10-second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle successful responses
apiClient.interceptors.response.use(
  (response) => response.data, // Return the data part of the response
  (error) => {
    // Handle errors globally
    // For example, log the error or show a notification
    console.error('API Error:', error.response?.data || error.message);

    // You could also handle specific status codes here
    if (error.response?.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      // window.location.href = '/login';
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
