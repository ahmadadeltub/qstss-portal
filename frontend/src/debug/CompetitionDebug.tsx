import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const CompetitionDebug: React.FC = () => {
  const [status, setStatus] = useState('Loading...');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        setStatus('Testing API connection...');
        
        // Test basic API
        const response = await fetch('http://localhost:5000/api/competitions');
        const rawData = await response.json();
        console.log('Raw API Response:', rawData);
        
        // Test through apiService
        setStatus('Testing through apiService...');
        const serviceData = await apiService.getCompetitions();
        console.log('ApiService Response:', serviceData);
        
        setData({
          raw: rawData,
          service: serviceData,
          isArray: Array.isArray(serviceData),
          length: Array.isArray(serviceData) ? serviceData.length : 0
        });
        setStatus('Success!');
      } catch (err: any) {
        console.error('Debug error:', err);
        setError(err.message);
        setStatus('Error occurred');
      }
    };

    testAPI();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Competition API Debug</h2>
      <p><strong>Status:</strong> {status}</p>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {data && (
        <div style={{ marginTop: '20px' }}>
          <h3>Data Analysis:</h3>
          <p><strong>Is Array:</strong> {data.isArray ? 'Yes' : 'No'}</p>
          <p><strong>Length:</strong> {data.length}</p>
          
          <h4>Raw API Response:</h4>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(data.raw, null, 2)}
          </pre>
          
          <h4>ApiService Response:</h4>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(data.service, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CompetitionDebug;
