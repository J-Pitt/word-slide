import React, { useState } from 'react';

const SimpleTest = () => {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showModal, setShowModal] = useState(false);

  console.log('🧪 SimpleTest component rendered, count:', count);

  const handleButtonClick = () => {
    console.log('🧪 Button clicked! Current count:', count);
    setCount(prev => prev + 1);
  };

  const handleInputChange = (e) => {
    console.log('🧪 Input changed:', e.target.value);
    setInputValue(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('🧪 Form submitted with value:', inputValue);
    alert(`Form submitted: ${inputValue}`);
  };

  const handleModalToggle = () => {
    console.log('🧪 Toggling modal, current state:', showModal);
    setShowModal(!showModal);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '3px solid blue',
      padding: '20px',
      borderRadius: '8px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h3>🧪 Simple Test Component</h3>
      
      {/* SUPER OBVIOUS TEST ELEMENT */}
      <div style={{
        background: 'red',
        color: 'white',
        padding: '20px',
        margin: '20px',
        border: '5px solid yellow',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        🚨 THIS RED BOX SHOULD BE VISIBLE! 🚨
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <p>Count: {count}</p>
        <button 
          onClick={handleButtonClick}
          style={{
            background: 'blue',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Increment Count
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <form onSubmit={handleFormSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type something..."
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button 
            type="submit"
            style={{
              background: 'green',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Submit Form
          </button>
        </form>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleModalToggle}
          style={{
            background: 'purple',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Toggle Modal
        </button>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          border: '2px solid purple',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 10000
        }}>
          <h4>🧪 Test Modal</h4>
          <p>This modal is working!</p>
          <button onClick={handleModalToggle}>Close</button>
        </div>
      )}

      <div style={{
        background: 'yellow',
        padding: '10px',
        marginTop: '15px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>Debug Info:</strong><br/>
        Count: {count}<br/>
        Input: {inputValue}<br/>
        Modal: {showModal ? 'Open' : 'Closed'}
      </div>
    </div>
  );
};

export default SimpleTest;
