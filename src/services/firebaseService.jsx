import { database } from '../firebase/config';
import { ref, set, onValue, off, get, update, remove } from 'firebase/database';

class FirebaseService {
  constructor() {
    this.connectionStatus = 'disconnected';
    this.listeners = new Map();
    this.connectionCallbacks = [];
  }

  // Connection testing methods
  async testConnection() {
    try {
      const testRef = ref(database, 'connectionTest');
      
      await set(testRef, {
        message: 'Bridgeon House Cup connection test',
        timestamp: Date.now(),
        project: 'bridgeon-house-scoring',
        status: 'active'
      });

      return {
        success: true,
        message: '✅ Write successful - checking real-time updates...',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Write error: ${error.message}`,
        error: error
      };
    }
  }

  // Real-time connection monitoring
  startConnectionMonitor(callback) {
    const connectionRef = ref(database, '.info/connected');
    
    const unsubscribe = onValue(connectionRef, (snapshot) => {
      const connected = snapshot.val();
      this.connectionStatus = connected ? 'connected' : 'disconnected';
      
      const statusData = {
        connected,
        status: this.connectionStatus,
        timestamp: Date.now()
      };

      this.connectionCallbacks.forEach(cb => cb(statusData));
      
      if (callback) {
        callback(statusData);
      }
    });

    return unsubscribe;
  }

  // Register connection status callbacks
  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
    
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  // Enhanced real-time listener
  listenToPath(path, callback, options = {}) {
    const pathRef = ref(database, path);
    
    const handleData = (snapshot) => {
      const data = snapshot.val();
      
      if (options.debug) {
        console.log(`📡 Firebase update for ${path}:`, data);
      }
      
      callback(data, {
        path,
        timestamp: Date.now(),
        exists: snapshot.exists()
      });
    };

    const handleError = (error) => {
      console.error(`❌ Firebase listener error for ${path}:`, error);
      
      if (options.errorCallback) {
        options.errorCallback(error, { path, timestamp: Date.now() });
      }
    };

    const listenerId = `listener_${path}_${Date.now()}`;
    const unsubscribe = onValue(pathRef, handleData, handleError);
    
    this.listeners.set(listenerId, { unsubscribe, path });
    
    return () => {
      this.removeListener(listenerId);
    };
  }

  // Remove specific listener
  removeListener(listenerId) {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener.unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  // Cleanup all listeners
  cleanupAllListeners() {
    this.listeners.forEach((listener) => {
      listener.unsubscribe();
    });
    this.listeners.clear();
  }

  // Data operations
  async writeData(path, data) {
    try {
      const result = await this.updateData(path, data);
      console.log(`✅ Data written to ${path}:`, data);
      return result;
    } catch (error) {
      console.error(`❌ Error writing to ${path}:`, error);
      throw error;
    }
  }

  async readData(path) {
    try {
      const dataRef = ref(database, path);
      const snapshot = await get(dataRef);
      
      return {
        success: true,
        data: snapshot.val(),
        exists: snapshot.exists(),
        path,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`❌ Error reading from ${path}:`, error);
      return {
        success: false,
        path,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async updateData(path, updates) {
    try {
      const dataRef = ref(database, path);
      const updatesWithMeta = {
        ...updates,
        _lastUpdated: Date.now()
      };
      
      await set(dataRef, updatesWithMeta);
      
      return {
        success: true,
        path,
        updates: updatesWithMeta,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`❌ Error updating ${path}:`, error);
      return {
        success: false,
        path,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // House-specific operations
  async updateHousePoints(houseId, pointsData) {
    try {
      console.log('📝 Updating house points in Firebase:', houseId, pointsData);
      
      const result = await this.updateData(`houses/${houseId}`, {
        ...pointsData,
        lastUpdated: Date.now()
      });
      
      console.log('✅ House points updated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error updating house points:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  listenToHouses(callback) {
    console.log('🎯 Setting up houses listener...');
    
    return this.listenToPath('houses', (data, metadata) => {
      console.log('📡 Houses data received:', data);
      callback(data, null);
    }, {
      errorCallback: (error) => {
        console.error('❌ Houses listener error:', error);
        callback(null, error);
      },
      debug: true
    });
  }

  listenToQuizHistory(callback) {
    return this.listenToPath('quizHistory', callback, {
      debug: true
    });
  }

  // Utility methods
  getConnectionStatus() {
    return this.connectionStatus;
  }

  getActiveListeners() {
    return Array.from(this.listeners.keys());
  }
}

// Create and export singleton instance
export const firebaseService = new FirebaseService();
export default FirebaseService;