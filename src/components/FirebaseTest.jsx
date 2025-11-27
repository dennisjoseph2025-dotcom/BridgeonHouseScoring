import React, { useEffect, useState } from 'react';
import { database } from '../firebase/config';
import { ref, set, onValue, off } from 'firebase/database';

const FirebaseTest = () => {
  const [status, setStatus] = useState('Testing Firebase connection...');
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const testRef = ref(database, 'connectionTest');
    
    const testConnection = async () => {
      try {
        // Write test data
        await set(testRef, {
          message: 'Bridgeon House Cup connection test',
          timestamp: Date.now(),
          project: 'bridgeon-house-scoring'
        });
        
        setStatus('✅ Write successful - checking real-time updates...');
        
        // Listen for real-time updates
        const unsubscribe = onValue(testRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
            setStatus('✅ Firebase Realtime Database working!');
          }
        }, (error) => {
          setStatus(`❌ Listen error: ${error.message}`);
        });
        
        // Return cleanup function
        return () => {
          off(testRef, 'value', unsubscribe);
        };
      } catch (error) {
        setStatus(`❌ Error: ${error.message}`);
        console.error('Firebase test failed:', error);
      }
    };

    // Call the test function
    testConnection();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      left: 10,
      background: '#1f2937',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      zIndex: 10000,
      fontSize: '14px',
      border: '2px solid #3b82f6',
      maxWidth: '400px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Firebase Connection Test</div>
      <div style={{ marginBottom: '4px' }}>Status: {status}</div>
      {lastUpdate && <div>Last update: {lastUpdate}</div>}
      <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
        Project: bridgeon-house-scoring
      </div>
    </div>
  );
};

export default FirebaseTest;