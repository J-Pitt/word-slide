import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestModal = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleTestLogin = async () => {
    console.log('🧪 TestModal: handleTestLogin called');
    console.log('🧪 Username:', username);
    console.log('🧪 Password:', password);
    
    try {
      const result = await login(username, password);
      console.log('🧪 TestModal: Login result:', result);
      
      if (result && result.success) {
        setMessage('✅ SUCCESS! Login worked!');
        console.log('🧪 TestModal: Setting success message');
      } else {
        setMessage(`❌ FAILED: ${result?.error || 'Unknown error'}`);
        console.log('🧪 TestModal: Setting error message');
      }
    } catch (error) {
      console.error('🧪 TestModal: Error during login:', error);
      setMessage(`🚨 ERROR: ${error.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        minWidth: '300px'
      }}>
        <h2>🧪 TEST MODAL</h2>
        <p>This is a simple test modal to debug the login issue.</p>
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        
        <button
          onClick={handleTestLogin}
          style={{
            background: 'blue',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🧪 Test Login
        </button>
        
        <button
          onClick={onClose}
          style={{
            background: 'gray',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
        
        {message && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: message.includes('SUCCESS') ? 'lightgreen' : 'lightcoral',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestModal;
