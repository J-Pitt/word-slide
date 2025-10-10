import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { AuthProvider, useAuth } from './AuthContext'

// Test component that uses the auth context
const TestComponent = () => {
  const auth = useAuth()
  
  if (!auth) return <div>No auth context</div>
  
  return (
    <div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</div>
      <div data-testid="token">{auth.token || 'null'}</div>
      <button onClick={() => auth.login('test@example.com', 'password')}>Login</button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset fetch mock
    global.fetch = vi.fn()
  })
  
  afterEach(() => {
    vi.resetAllMocks()
  })
  
  it('should provide default auth state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
    expect(screen.getByTestId('user')).toHaveTextContent('null')
    expect(screen.getByTestId('token')).toHaveTextContent('null')
  })
  
  it('should restore auth state from localStorage', () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    const mockToken = 'test-token-123'
    
    localStorage.setItem('wordslide_user', JSON.stringify(mockUser))
    localStorage.setItem('wordslide_token', mockToken)
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
    expect(screen.getByTestId('token')).toHaveTextContent(mockToken)
  })
  
  it('should handle successful login', async () => {
    const mockResponse = {
      success: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
      token: 'new-token-456'
    }
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })
    
    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await act(async () => {
      getByText('Login').click()
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
    })
    
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockResponse.user))
    expect(screen.getByTestId('token')).toHaveTextContent(mockResponse.token)
    
    // Check localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'wordslide_user',
      JSON.stringify(mockResponse.user)
    )
    expect(localStorage.setItem).toHaveBeenCalledWith('wordslide_token', mockResponse.token)
  })
  
  it('should handle failed login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Invalid credentials' })
    })
    
    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await act(async () => {
      getByText('Login').click()
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
    })
  })
  
  it('should handle logout', async () => {
    const mockUser = { id: 1, username: 'testuser' }
    const mockToken = 'test-token'
    
    localStorage.setItem('wordslide_user', JSON.stringify(mockUser))
    localStorage.setItem('wordslide_token', mockToken)
    
    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    // Verify initially logged in
    expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
    
    // Logout
    await act(async () => {
      getByText('Logout').click()
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
    })
    
    expect(screen.getByTestId('user')).toHaveTextContent('null')
    expect(screen.getByTestId('token')).toHaveTextContent('null')
    
    // Check localStorage was cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('wordslide_user')
    expect(localStorage.removeItem).toHaveBeenCalledWith('wordslide_token')
  })
  
  it('should handle malformed localStorage data', () => {
    localStorage.setItem('wordslide_user', 'invalid json')
    localStorage.setItem('wordslide_token', 'test-token')
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    // Should fall back to logged out state
    expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
  })
  
  it('should return null when useAuth is called outside provider', () => {
    // Suppress console error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<TestComponent />)
    
    expect(screen.getByText('No auth context')).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })
})

