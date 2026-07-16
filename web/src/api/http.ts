import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add dynamic JWT token authorization header interceptor and request logger
http.interceptors.request.use((config) => {
  console.log('📤 API Request:', {
    method: config.method?.toUpperCase(),
    url: (config.baseURL || '') + (config.url || ''),
    data: config.data,
    params: config.params
  })
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

// Add response interceptor to handle 401 errors and log responses
http.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      url: (response.config.baseURL || '') + (response.config.url || ''),
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: (error.config?.baseURL || '') + (error.config?.url || ''),
      data: error.response?.data,
      error: error.message
    })
    if (error.response?.status === 401) {
      console.error('Session expired or unauthorized. Clearing session.')
      localStorage.removeItem('hr_session')
      // Dispatch a custom event so the React app can navigate gracefully
      window.dispatchEvent(new CustomEvent('auth-unauthorized'))
    }
    return Promise.reject(error)
  }
)
