import React, { useEffect, useState } from 'react';
import { firebaseService } from '../services/firebaseService';

const FirebaseTest = () => {
  const [status, setStatus] = useState('Testing Firebase connection...');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [activeListeners, setActiveListeners] = useState([]);

  useEffect(() => {
    let cleanupFunctions = [];

    const runTests = async () => {
      try {
        // Test basic connection
        const testResult = await firebaseService.testConnection();
        setStatus(testResult.message);

        if (testResult.success) {
          // Start connection monitoring
          const connectionUnsubscribe = firebaseService.startConnectionMonitor((status) => {
            setConnectionStatus(status.connected ? 'connected' : 'disconnected');
          });

          // Listen for connection changes
          const connectionChangeUnsubscribe = firebaseService.onConnectionChange((status) => {
            console.log('Connection status changed:', status);
          });

          // Listen to test data for real-time updates
          const testDataUnsubscribe = firebaseService.listenToPath(
            'connectionTest',
            (data) => {
              if (data && data.timestamp) {
                setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
                setStatus('✅ Firebase Realtime Database working!');
              }
            },
            { debug: true }
          );

          // Update active listeners display
          const updateListeners = () => {
            setActiveListeners(firebaseService.getActiveListeners());
          };

          // Periodically update listeners list
          const listenerInterval = setInterval(updateListeners, 2000);

          cleanupFunctions = [
            connectionUnsubscribe,
            connectionChangeUnsubscribe,
            testDataUnsubscribe,
            () => clearInterval(listenerInterval)
          ];

          // Initial listeners update
          updateListeners();
        }
      } catch (error) {
        setStatus(`❌ Test failed: ${error.message}`);
        console.error('Firebase test failed:', error);
      }
    };

    runTests();

    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      // Optional: cleanup all service listeners
      // firebaseService.cleanupAllListeners();
    };
  }, []);

  const handleRetryTest = async () => {
    setStatus('Retrying connection test...');
    setConnectionStatus('checking');
    
    const result = await firebaseService.testConnection();
    setStatus(result.message);
    
    if (result.success) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  };

  const handleClearData = async () => {
    const result = await firebaseService.deleteData('connectionTest');
    if (result.success) {
      setStatus('✅ Test data cleared');
      setLastUpdate(null);
    } else {
      setStatus('❌ Failed to clear test data');
    }
  };

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
      border: `2px solid ${
        connectionStatus === 'connected' ? '#10b981' : 
        connectionStatus === 'disconnected' ? '#ef4444' : '#3b82f6'
      }`,
      maxWidth: '400px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div>Firebase Service Test</div>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 
            connectionStatus === 'connected' ? '#10b981' : 
            connectionStatus === 'disconnected' ? '#ef4444' : '#3b82f6'
        }}></div>
      </div>
      
      <div style={{ marginBottom: '4px' }}>Status: {status}</div>
      {lastUpdate && <div>Last update: {lastUpdate}</div>}
      
      <div style={{ 
        fontSize: '12px', 
        opacity: 0.8, 
        marginTop: '8px',
        marginBottom: '8px'
      }}>
        Connection: {connectionStatus}
      </div>

      {activeListeners.length > 0 && (
        <div style={{ 
          fontSize: '11px', 
          opacity: 0.7,
          marginBottom: '8px'
        }}>
          Listeners: {activeListeners.length}
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: '8px',
        marginTop: '8px'
      }}>
        <button
          onClick={handleRetryTest}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Retry Test
        </button>
        
        <button
          onClick={handleClearData}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Clear Data
        </button>
      </div>

      <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
        Project: bridgeon-house-scoring
      </div>
    </div>
  );
};

export default FirebaseTest;