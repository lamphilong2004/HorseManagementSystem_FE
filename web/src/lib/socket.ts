import { io } from 'socket.io-client';

const BE_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://managerhourse-be.onrender.com';

// Initialize the socket connection to the backend server
// Note: Ensure the backend has socket.io configured and running on this URL
export const socket = io(BE_BASE_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'], // Fallback to polling if websocket is not supported
});

// Generic logging for connection status (useful for debugging)
socket.on('connect', () => {
  console.log('[Socket] Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('[Socket] Disconnected from server');
});

socket.on('connect_error', (err) => {
  console.error('[Socket] Connection Error:', err.message);
});
