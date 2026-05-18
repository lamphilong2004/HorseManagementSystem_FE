import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add dynamic JWT token authorization header interceptor
http.interceptors.request.use((config) => {
  const raw = localStorage.getItem('hr_session')
  if (raw) {
    try {
      const session = JSON.parse(raw)
      if (session && session.token) {
        config.headers.Authorization = `Bearer ${session.token}`
      }
    } catch (e) {
      console.error('Failed to parse session token:', e)
    }
  }
  return config
})
