import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

// Set base URL for axios
axios.defaults.baseURL = 'http://localhost:3000'

interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await axios.post('/api/auth/login', { email, password })
        const { user, token } = response.data
        set({ user, token, isAuthenticated: true })
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },

      register: async (name: string, email: string, password: string) => {
        const response = await axios.post('/api/auth/register', {
          name,
          email,
          password,
        })
        const { user, token } = response.data
        set({ user, token, isAuthenticated: true })
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        delete axios.defaults.headers.common['Authorization']
      },

      updateProfile: async (data: Partial<User>) => {
        const response = await axios.put('/api/auth/profile', data)
        const { user } = response.data
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set Authorization header when app loads if token exists
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
) 