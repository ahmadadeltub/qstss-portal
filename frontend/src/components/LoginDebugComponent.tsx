import React, { useState } from 'react';
import { authService } from '../services/authService';

const LoginDebugComponent: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...');
    
    try {
      console.log('🧪 Testing direct authService login...');
      
      // Clear any existing tokens first
      localStorage.clear();
      
      const response = await authService.login('admin@qstss.edu.qa', 'admin123');
      
      console.log('✅ Login response:', response);
      
      setResult(`✅ SUCCESS! 
User: ${response.teacher.firstName} ${response.teacher.lastName}
Email: ${response.teacher.email}
Role: ${response.teacher.role}
Token: ${response.token.substring(0, 50)}...`);
      
    } catch (error: any) {
      console.error('❌ Login test failed:', error);
      setResult(`❌ FAILED: ${error.message || error.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    setLoading(true);
    setResult('Testing API connectivity...');
    
    try {
      const response = await fetch('http://localhost:4000/api/health');
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ API HEALTHY: ${data.status}`);
      } else {
        setResult(`❌ API ERROR: ${data.message}`);
      }
    } catch (error: any) {
      setResult(`❌ API UNREACHABLE: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f0f0f0', 
      margin: '20px', 
      borderRadius: '8px',
      fontFamily: 'monospace'
    }}>
      <h3>🔧 Login Debug Panel</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testAPI} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test API Connection
        </button>
        
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Login
        </button>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '15px', 
        borderRadius: '4px',
        border: '1px solid #ddd',
        minHeight: '100px',
        whiteSpace: 'pre-wrap'
      }}>
        {loading ? '⏳ Loading...' : result || 'Click a button to test...'}
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <strong>Expected credentials:</strong><br/>
        Email: admin@qstss.edu.qa<br/>
        Password: admin123<br/>
        Backend: http://localhost:4000<br/>
        Frontend: http://localhost:3000
      </div>
    </div>
  );
};

export default LoginDebugComponent;
