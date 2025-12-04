import { database, auth } from '../firebase/config';
import { ref, set, onValue, off, get, update, remove } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';

class FirebaseService {
  constructor() {
    this.connectionStatus = 'disconnected';
    this.listeners = new Map();
    this.connectionCallbacks = [];
    this.isAuthenticated = false;
    this.authError = null;
    
    // Initialize anonymous authentication
    this.initializeAuth();
  }

  async mergeQuizHistoryData(date, newPoints) {
    try {
      await this.ensureAuthenticated();
      
      // Read current quiz history
      const currentHistoryResult = await this.readData('quizHistory');
      const currentHistory = currentHistoryResult.data || {};
      
      // Merge the new points with existing data
      const updatedHistory = {
        ...currentHistory,
        [date]: {
          ...currentHistory[date],
          ...newPoints
        }
      };
      
      // Write merged data back
      const result = await this.writeData('quizHistory', updatedHistory);
      
      return {
        success: true,
        data: updatedHistory,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error merging quiz history:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Initialize anonymous authentication for write operations
  async initializeAuth() {
    try {
      await signInAnonymously(auth);
      this.isAuthenticated = true;
      this.authError = null;
      console.log('✅ Firebase anonymous authentication successful');
    } catch (error) {
      console.error('❌ Firebase authentication failed:', error);
      this.isAuthenticated = false;
      this.authError = error;
      console.warn('⚠️ Continuing without Firebase authentication - some operations may fail due to security rules');
    }
  }

  // Wait for authentication to be ready
  async ensureAuthenticated() {
    if (!this.isAuthenticated && this.authError) {
      console.warn('⚠️ Authentication failed, proceeding with operations (may fail due to security rules)');
      return;
    }
    
    if (!this.isAuthenticated) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!this.isAuthenticated) {
        throw new Error('Authentication not ready. Please try again.');
      }
    }
  }

  // Connection testing methods
  async testConnection() {
    try {
      await this.ensureAuthenticated();
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
      await this.ensureAuthenticated();
      const dataRef = ref(database, path);
      const dataWithMeta = {
        ...data,
        _lastUpdated: Date.now()
      };
      
      await set(dataRef, dataWithMeta);
      
      console.log(`✅ Data written to ${path}:`, data);
      return {
        success: true,
        path,
        data: dataWithMeta,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`❌ Error writing to ${path}:`, error);
      return {
        success: false,
        path,
        error: error.message,
        timestamp: Date.now()
      };
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
      await this.ensureAuthenticated();
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

  // ADD THESE NEW METHODS FOR SCORING CONTROL

  // Listen to scoring control
  listenToScoringControl(callback) {
    console.log('🎯 Setting up scoring control listener...');
    
    return this.listenToPath('scoringControl', (data, metadata) => {
      console.log('📡 Scoring control data received:', data);
      callback(data, null);
    }, {
      errorCallback: (error) => {
        console.error('❌ Scoring control listener error:', error);
        callback(null, error);
      },
      debug: true
    });
  }

  // Listen to active scoring session
  listenToScoringSession(callback) {
    console.log('🎯 Setting up scoring session listener...');
    
    return this.listenToPath('activeScoringSession', (data, metadata) => {
      console.log('📡 Scoring session data received:', data);
      callback(data, null);
    }, {
      errorCallback: (error) => {
        console.error('❌ Scoring session listener error:', error);
        callback(null, error);
      },
      debug: true
    });
  }

  // Save active scoring session to Firebase
  async saveScoringSession(sessionData) {
    try {
      await this.ensureAuthenticated();
      const sessionRef = ref(database, 'activeScoringSession');
      
      const dataWithMeta = {
        ...sessionData,
        _lastUpdated: Date.now(),
        _status: 'active'
      };
      
      await set(sessionRef, dataWithMeta);
      
      console.log('✅ Scoring session saved to Firebase:', dataWithMeta);
      return {
        success: true,
        data: dataWithMeta,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error saving scoring session:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Clear active scoring session from Firebase
  async clearScoringSession() {
    try {
      await this.ensureAuthenticated();
      const sessionRef = ref(database, 'activeScoringSession');
      
      await set(sessionRef, null);
      
      console.log('✅ Scoring session cleared from Firebase');
      return {
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error clearing scoring session:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Get current scoring session
  async getCurrentScoringSession() {
    try {
      const sessionRef = ref(database, 'activeScoringSession');
      const snapshot = await get(sessionRef);
      
      const data = snapshot.val();
      
      if (!data) {
        return {
          success: true,
          exists: false,
          data: null,
          timestamp: Date.now()
        };
      }
      
      // Check if session has expired (2 hours max)
      const sessionDuration = Date.now() - (data.startTime || data._lastUpdated);
      const maxSessionDuration = 2 * 60 * 60 * 1000; // 2 hours
      
      if (sessionDuration > maxSessionDuration) {
        // Session expired, clear it
        await this.clearScoringSession();
        return {
          success: true,
          exists: false,
          data: null,
          timestamp: Date.now(),
          expired: true
        };
      }
      
      return {
        success: true,
        exists: true,
        data: data,
        timestamp: Date.now(),
        duration: sessionDuration
      };
    } catch (error) {
      console.error('❌ Error getting scoring session:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Save scoring history (for records)
  async saveToScoringHistory(sessionData) {
    try {
      await this.ensureAuthenticated();
      const historyRef = ref(database, 'scoringHistory');
      
      // Get existing history
      const existingHistory = await this.readData('scoringHistory');
      const historyArray = existingHistory.data ? Object.values(existingHistory.data) : [];
      
      // Add new session to history
      const newSession = {
        ...sessionData,
        id: `session_${Date.now()}`,
        endTime: Date.now(),
        duration: Date.now() - sessionData.startTime,
        _archived: true
      };
      
      historyArray.push(newSession);
      
      // Save updated history (keep last 100 sessions)
      const limitedHistory = historyArray.slice(-100);
      const historyData = {};
      limitedHistory.forEach((session, index) => {
        historyData[`session_${index}`] = session;
      });
      
      await set(historyRef, historyData);
      
      console.log('✅ Scoring session added to history:', newSession);
      return {
        success: true,
        session: newSession,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error saving to scoring history:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Check if a house can score
  async canHouseScore(houseId) {
    try {
      // Check scoring control
      const scoringControlResult = await this.readData('scoringControl');
      
      if (!scoringControlResult.success) {
        return {
          success: false,
          error: scoringControlResult.error
        };
      }
      
      const scoringControl = scoringControlResult.data;
      
      // If no active session, all houses can score
      if (!scoringControl || scoringControl.status !== 'active') {
        return {
          success: true,
          canScore: true,
          reason: 'No active scoring session'
        };
      }
      
      // Check if this house is the active scoring house
      const canScore = scoringControl.activeHouseId === houseId;
      
      return {
        success: true,
        canScore: canScore,
        activeHouseId: scoringControl.activeHouseId,
        reason: canScore ? 'Active scoring house' : `Only ${scoringControl.activeHouseId} can score`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get current scoring control
  async getScoringControl() {
    try {
      const result = await this.readData('scoringControl');
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          exists: result.exists
        };
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utility methods
  getConnectionStatus() {
    return this.connectionStatus;
  }

  getActiveListeners() {
    return Array.from(this.listeners.keys());
  }

  // Check authentication status
  getAuthStatus() {
    return this.isAuthenticated;
  }

  // Get authentication error
  getAuthError() {
    return this.authError;
  }
}

// Create and export singleton instance
export const firebaseService = new FirebaseService();
export default FirebaseService;