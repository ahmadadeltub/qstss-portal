import React, { useState } from 'react';
import { authService } from '../services/authService';

const LoginTest: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const testLogin = async () => {
    try {
      setResult('Testing...');
      const response = await authService.login('admin@qstss.edu.qa', 'admin123');
      setResult(`SUCCESS: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`ERROR: ${error.message} - ${JSON.stringify(error.response?.data || error, null, 2)}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Auth Service Test</h2>
      <button onClick={testLogin}>Test Direct Auth Service</button>
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
        {result}
      </pre>
    </div>
  );
};

export default LoginTest;
