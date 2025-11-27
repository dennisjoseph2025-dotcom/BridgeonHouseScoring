import { ref, set, onValue, update, get, off, push } from 'firebase/database';
import { database } from '../firebase/config';

class FirebaseService {
  // House operations
  async updateHouse(houseId, houseData) {
    try {
      const houseRef = ref(database, `houses/${houseId}`);
      const data = {
        ...houseData,
        lastUpdated: Date.now(),
        updatedBy: houseData.updatedBy || 'system'
      };
      await set(houseRef, data);
      console.log(`✅ House ${houseId} updated successfully`);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Error updating house ${houseId}:`, error);
      throw error;
    }
  }

  async getHouse(houseId) {
    try {
      const houseRef = ref(database, `houses/${houseId}`);
      const snapshot = await get(houseRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`❌ Error getting house ${houseId}:`, error);
      throw error;
    }
  }

  async getAllHouses() {
    try {
      const housesRef = ref(database, 'houses');
      const snapshot = await get(housesRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('❌ Error getting all houses:', error);
      throw error;
    }
  }

  // Quiz History operations
  async saveQuizHistory(quizHistory) {
    try {
      const quizHistoryRef = ref(database, 'quizHistory');
      await set(quizHistoryRef, quizHistory);
      console.log('✅ Quiz history saved successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving quiz history:', error);
      throw error;
    }
  }

  async getQuizHistory() {
    try {
      const quizHistoryRef = ref(database, 'quizHistory');
      const snapshot = await get(quizHistoryRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('❌ Error getting quiz history:', error);
      throw error;
    }
  }

  // Real-time listeners with cleanup
  listenToHouses(callback) {
    const housesRef = ref(database, 'houses');
    
    const handleData = (snapshot) => {
      const data = snapshot.val();
      console.log('🏠 Houses data updated:', data);
      callback(data);
    };

    const handleError = (error) => {
      console.error('❌ Houses listener error:', error);
      callback(null, error);
    };

    onValue(housesRef, handleData, handleError);

    // Return unsubscribe function
    return () => off(housesRef, 'value', handleData);
  }

  listenToQuizHistory(callback) {
    const quizHistoryRef = ref(database, 'quizHistory');
    
    const handleData = (snapshot) => {
      const data = snapshot.val();
      console.log('📊 Quiz history updated:', data);
      callback(data);
    };

    const handleError = (error) => {
      console.error('❌ Quiz history listener error:', error);
      callback(null, error);
    };

    onValue(quizHistoryRef, handleData, handleError);

    // Return unsubscribe function
    return () => off(quizHistoryRef, 'value', handleData);
  }

  // Batch operations
  async updateMultipleHouses(housesData) {
    try {
      const updates = {};
      const timestamp = Date.now();

      Object.keys(housesData).forEach(houseId => {
        updates[`houses/${houseId}`] = {
          ...housesData[houseId],
          lastUpdated: timestamp,
          batchUpdate: true
        };
      });

      await update(ref(database), updates);
      console.log(`✅ Updated ${Object.keys(housesData).length} houses successfully`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating multiple houses:', error);
      throw error;
    }
  }

  // Initialize default data
  async initializeDefaultData() {
    try {
      const housesSnapshot = await get(ref(database, 'houses'));
      if (!housesSnapshot.exists()) {
        console.log('🚀 Initializing default houses data...');
        
        const defaultHouses = {
          gryffindor: { name: 'Gryffindor', adminPoints: 0, totalPoints: 0, lastUpdated: Date.now() },
          slytherin: { name: 'Slytherin', adminPoints: 0, totalPoints: 0, lastUpdated: Date.now() },
          hufflepuff: { name: 'Hufflepuff', adminPoints: 0, totalPoints: 0, lastUpdated: Date.now() },
          ravenclaw: { name: 'Ravenclaw', adminPoints: 0, totalPoints: 0, lastUpdated: Date.now() },
          media: { name: 'Media Team', adminPoints: 0, totalPoints: 0, lastUpdated: Date.now() }
        };

        await this.updateMultipleHouses(defaultHouses);
      }
    } catch (error) {
      console.error('❌ Error initializing default data:', error);
      throw error;
    }
  }

  // Analytics and logging
  async logAction(action, details) {
    try {
      const logsRef = ref(database, 'logs');
      const newLogRef = push(logsRef);
      await set(newLogRef, {
        action,
        details,
        timestamp: Date.now(),
        user: details.user || 'unknown'
      });
    } catch (error) {
      console.error('❌ Error logging action:', error);
      // Don't throw error for logging failures
    }
  }
}

export const firebaseService = new FirebaseService();
export default FirebaseService;