import { createSlice } from '@reduxjs/toolkit';
import { firebaseService } from '../../services/firebaseService';

// Import house images
import gryffindorIcon from '../../assets/gryffindor.png';
import slytherinIcon from '../../assets/slytherin.png';
import hufflepuffIcon from '../../assets/hufflepuff.png';
import ravenclawIcon from '../../assets/ravenclaw.png';
import mediaIcon from '../../assets/media.png';

const houses = [
  { 
    id: 'gryffindor', 
    name: 'Gryffindor', 
    color: 'gryffindor', 
    bgColor: 'bg-gryffindor', 
    icon: gryffindorIcon,
    adminPoints: 0,
    totalPoints: 0
  },
  { 
    id: 'slytherin', 
    name: 'Slytherin', 
    color: 'slytherin', 
    bgColor: 'bg-slytherin', 
    icon: slytherinIcon,
    adminPoints: 0,
    totalPoints: 0
  },
  { 
    id: 'hufflepuff', 
    name: 'Hufflepuff', 
    color: 'hufflepuff', 
    bgColor: 'bg-hufflepuff', 
    icon: hufflepuffIcon,
    adminPoints: 0,
    totalPoints: 0
  },
  { 
    id: 'ravenclaw', 
    name: 'Ravenclaw', 
    color: 'ravenclaw', 
    bgColor: 'bg-ravenclaw', 
    icon: ravenclawIcon,
    adminPoints: 0,
    totalPoints: 0
  },
  { 
    id: 'media', 
    name: 'Media Team', 
    color: 'media', 
    bgColor: 'bg-media', 
    icon: mediaIcon,
    adminPoints: 0,
    totalPoints: 0
  }
];

const initialState = {
  houses: houses,
  scoringHouse: null,
  currentUser: null,
  userRole: null,
  quizHistory: {},
  currentQuizPoints: {},
  timer: {
    isRunning: false,
    time: 0,
    initialTime: 0
  },
  firebaseConnected: false,
  firebaseAuthenticated: false
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setScoringHouse: (state, action) => {
      state.scoringHouse = action.payload;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload.user;
      state.userRole = action.payload.role;
      state.scoringHouse = action.payload.houseId || null;
    },
    logoutUser: (state) => {
      state.currentUser = null;
      state.userRole = null;
      state.scoringHouse = null;
    },
    // Quiz Scoring
    addQuizPoint: (state, action) => {
      const houseId = action.payload;
      if (!state.currentQuizPoints[houseId]) {
        state.currentQuizPoints[houseId] = 0;
      }
      state.currentQuizPoints[houseId] += 1;
    },
    subtractQuizPoint: (state, action) => {
      const houseId = action.payload;
      if (state.currentQuizPoints[houseId] && state.currentQuizPoints[houseId] > 0) {
        state.currentQuizPoints[houseId] -= 1;
      }
    },
    // Save current quiz points to history
    saveQuizToHistory: (state) => {
      const date = new Date().toISOString().split('T')[0];
      
      if (!state.quizHistory[date]) {
        state.quizHistory[date] = {};
      }
      
      Object.keys(state.currentQuizPoints).forEach(houseId => {
        if (!state.quizHistory[date][houseId]) {
          state.quizHistory[date][houseId] = 0;
        }
        state.quizHistory[date][houseId] += state.currentQuizPoints[houseId];
      });
      
      state.currentQuizPoints = {};
    },
    // Clear current quiz session
    clearCurrentQuiz: (state) => {
      state.currentQuizPoints = {};
    },
    // Admin Scoring
addAdminPoint: (state, action) => {
      const houseId = action.payload;
      const house = state.houses.find(h => h.id === houseId);
      if (house) {
        house.adminPoints += 1;
      }
    },
    subtractAdminPoint: (state, action) => {
      const houseId = action.payload;
      const house = state.houses.find(h => h.id === houseId);
      if (house) {
        house.adminPoints -= 1; // Can go negative now
      }
    },
    // NEW: Apply admin points to total points (for save operation)
    applyAdminPoints: (state) => {
      state.houses.forEach(house => {
        house.totalPoints += house.adminPoints;
        house.adminPoints = 0;
      });
    },
    // Update from Firebase
    updateHousesFromFirebase: (state, action) => {
      const firebaseData = action.payload;
      console.log('Updating houses from Firebase:', firebaseData);
      if (firebaseData) {
        state.houses.forEach(house => {
          if (firebaseData[house.id]) {
            house.adminPoints = firebaseData[house.id].adminPoints || 0;
            house.totalPoints = firebaseData[house.id].totalPoints || 0;
          }
        });
      }
    },
    updateQuizHistoryFromFirebase: (state, action) => {
      const firebaseData = action.payload;
      console.log('Updating quiz history from Firebase:', firebaseData);
      state.quizHistory = firebaseData || {};
    },
    setFirebaseConnected: (state, action) => {
      state.firebaseConnected = action.payload;
    },
    setFirebaseAuthenticated: (state, action) => {
      state.firebaseAuthenticated = action.payload;
    },
    // Timer actions
    startTimer: (state) => {
      state.timer.isRunning = true;
    },
    pauseTimer: (state) => {
      state.timer.isRunning = false;
    },
    resetTimer: (state) => {
      state.timer.isRunning = false;
      state.timer.time = 0;
      state.timer.initialTime = 0;
    },
    updateTimer: (state) => {
      if (state.timer.isRunning && state.timer.time > 0) {
        state.timer.time -= 1;
      } else if (state.timer.isRunning && state.timer.time === 0) {
        state.timer.isRunning = false;
      }
    },
    setTimer: (state, action) => {
      state.timer.time = action.payload;
      state.timer.initialTime = action.payload;
    },
    resetAllScores: (state) => {
      state.houses.forEach(house => {
        house.adminPoints = 0;
        house.totalPoints = 0;
      });
    }
  }
});

// Thunk Actions with Authentication Handling
export const saveQuizToFirebase = () => async (dispatch, getState) => {
  try {
    const state = getState().quiz;
    
    // Wait for authentication if needed
    if (!firebaseService.getAuthStatus()) {
      console.log('🔄 Waiting for Firebase authentication...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save quiz history to Firebase
    await firebaseService.writeData('quizHistory', state.quizHistory);
    
    console.log('✅ Quiz history saved to Firebase');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving quiz to Firebase:', error);
    return { success: false, error: error.message };
  }
};

export const saveCurrentQuizSession = () => async (dispatch, getState) => {
  try {
    const state = getState().quiz;
    
    // First save to local history
    dispatch(saveQuizToHistory());
    
    // Then sync with Firebase
    await dispatch(saveQuizToFirebase());
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving quiz session:', error);
    return { success: false, error: error.message };
  }
};

// Update the listeners to use the service:
export const startHouseListener = () => (dispatch) => {
  console.log('🔄 Starting house listener...');
  
  const unsubscribe = firebaseService.listenToHouses((data, error) => {
    if (error) {
      console.error('❌ House listener error:', error);
      dispatch(setFirebaseConnected(false));
      return;
    }
    console.log('📡 House data received from Firebase:', data);
    dispatch(updateHousesFromFirebase(data));
    dispatch(setFirebaseConnected(true));
  });

  return unsubscribe;
};

export const startQuizHistoryListener = () => (dispatch) => {
  console.log('🔄 Starting quiz history listener...');
  
  const unsubscribe = firebaseService.listenToQuizHistory((data, error) => {
    if (error) {
      console.error('❌ Quiz history listener error:', error);
      return;
    }
    console.log('📡 Quiz history received from Firebase:', data);
    dispatch(updateQuizHistoryFromFirebase(data));
  });

  return unsubscribe;
};

// Add Firebase authentication status listener
export const startFirebaseAuthListener = () => (dispatch) => {
  console.log('🔄 Starting Firebase auth listener...');
  
  const unsubscribe = firebaseService.onConnectionChange((status) => {
    console.log('📡 Firebase connection status:', status);
    dispatch(setFirebaseConnected(status.connected));
    
    // Check authentication status
    const authStatus = firebaseService.getAuthStatus();
    dispatch(setFirebaseAuthenticated(authStatus));
  });

  return unsubscribe;
};
export const saveAllHousesSingleWrite = () => async (dispatch, getState) => {
  try {
    const state = getState().quiz;
    const houses = state.houses;
    
    console.log('⚡ Single-write saving all houses to Firebase');
    
    // Single authentication check
    if (!firebaseService.getAuthStatus()) {
      console.log('⏳ Waiting for authentication...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Create a single object with all house data
    const allHousesData = {};
    houses.forEach(house => {
      allHousesData[house.id] = {
        adminPoints: house.adminPoints,
        totalPoints: house.totalPoints,
        name: house.name,
        _lastUpdated: Date.now()
      };
    });

    console.log('📦 Single payload for all houses:', allHousesData);

    // Single write operation for all houses
    const result = await firebaseService.writeData('houses', allHousesData);
    
    if (result.success) {
      console.log('✅ All houses saved in single write operation');
      return { success: true, data: result.data };
    } else {
      console.error('❌ Single write failed:', result.error);
      throw new Error(result.error || 'Failed to save houses data');
    }
  } catch (error) {
    console.error('❌ Error in saveAllHousesSingleWrite:', error);
    throw error;
  }
};
// Enhanced thunk actions for Firebase operations with authentication handling:
export const saveHouseToFirebase = (house) => async (dispatch) => {
  try {
    console.log('🔄 Attempting to save house to Firebase:', house);
    
    // Wait for authentication if needed
    if (!firebaseService.getAuthStatus()) {
      console.log('⏳ Waiting for authentication before saving house...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const result = await firebaseService.updateHousePoints(house.id, {
      adminPoints: house.adminPoints,
      totalPoints: house.totalPoints,
      name: house.name
    });
    
    console.log('✅ Firebase save result:', result);
    
    if (result.success) {
      return { success: true };
    } else {
      console.error('❌ Firebase returned error:', result.error);
      throw new Error(result.error || 'Failed to save house data');
    }
  } catch (error) {
    console.error('❌ Error in saveHouseToFirebase:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const saveQuizHistoryToFirebase = (quizHistory) => async () => {
  try {
    // Wait for authentication if needed
    if (!firebaseService.getAuthStatus()) {
      console.log('⏳ Waiting for authentication before saving quiz history...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const result = await firebaseService.writeData('quizHistory', quizHistory);
    
    if (result.success) {
      return { success: true };
    } else {
      throw new Error(result.error || 'Failed to save quiz history');
    }
  } catch (error) {
    console.error('Error in saveQuizHistoryToFirebase:', error);
    throw error;
  }
};

export const saveCurrentQuizToFirebase = (mode = 'replace') => async (dispatch, getState) => {
  try {
    const state = getState().quiz;
    const currentQuizPoints = state.currentQuizPoints;
    
    // Filter out houses with 0 points
    const housesWithPoints = Object.keys(currentQuizPoints).filter(
      houseId => currentQuizPoints[houseId] > 0
    );

    if (housesWithPoints.length === 0) {
      return { success: false, error: 'No quiz points to save' };
    }

    const date = new Date().toISOString().split('T')[0];
    
    console.log('🔄 Saving quiz points to Firebase:', {
      date,
      points: currentQuizPoints,
      housesWithPoints,
      mode
    });

    // Read existing quiz history first
    const existingResult = await firebaseService.readData('quizHistory');
    const existingHistory = existingResult.data || {};
    
    console.log('📊 Existing quiz history:', existingHistory);

    // Create updated history based on mode
    let updatedHistory;
    
    if (mode === 'replace') {
      // REPLACE the entire day's data
      updatedHistory = {
        ...existingHistory,
        [date]: {
          ...currentQuizPoints
        }
      };
    } else {
      // ADD to existing day's data
      updatedHistory = {
        ...existingHistory,
        [date]: {
          ...existingHistory[date],
          ...Object.keys(currentQuizPoints).reduce((acc, houseId) => {
            if (currentQuizPoints[houseId] > 0) {
              acc[houseId] = (existingHistory[date]?.[houseId] || 0) + currentQuizPoints[houseId];
            }
            return acc;
          }, {})
        }
      };
    }

    console.log('💾 Updated quiz history to save:', updatedHistory);

    // Save to Firebase
    const result = await firebaseService.writeData('quizHistory', updatedHistory);
    
    if (result.success) {
      // Update local state
      dispatch(updateQuizHistoryFromFirebase(updatedHistory));
      
      // Clear current quiz points
      dispatch(clearCurrentQuiz());
      
      console.log(`✅ Quiz points successfully saved to Firebase (${mode} mode)`);
      return { success: true, data: updatedHistory };
    } else {
      console.error('❌ Firebase save failed:', result.error);
      
      // Fallback: save locally
      dispatch(saveQuizToHistory());
      dispatch(clearCurrentQuiz());
      
      return { 
        success: false, 
        error: result.error,
        localSave: true
      };
    }
  } catch (error) {
    console.error('❌ Error in saveCurrentQuizToFirebase:', error);
    
    // Last resort: save locally
    dispatch(saveQuizToHistory());
    dispatch(clearCurrentQuiz());
    
    return { 
      success: false, 
      error: error.message,
      localSave: true
    };
  }
};
export const resetAllScoresFirebase = () => async (dispatch) => {
  try {
    // Wait for authentication if needed
    if (!firebaseService.getAuthStatus()) {
      console.log('⏳ Waiting for authentication before resetting scores...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Reset all houses in Firebase - ONLY reset adminPoints and totalPoints, keep quiz history
    const resetPromises = houses.map(house => 
      firebaseService.updateHousePoints(house.id, {
        adminPoints: 0,
        totalPoints: 0,
        name: house.name
        // Don't touch quizHistory here
      })
    );
    
    await Promise.all(resetPromises);
    
    // REMOVE this line that resets quiz history:
    // await firebaseService.writeData('quizHistory', {});
    
    // Update local state
    dispatch(resetAllScores());
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting scores in Firebase:', error);
    return { success: false, error: error.message };
  }
};

// Initialize Firebase data with authentication handling
export const initializeFirebaseData = () => async () => {
  try {
    // Wait for authentication
    if (!firebaseService.getAuthStatus()) {
      console.log('🔄 Waiting for Firebase authentication before initializing data...');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Check if houses data exists, if not initialize
    const housesResult = await firebaseService.readData('houses');
    
    if (!housesResult.exists) {
      console.log('Initializing houses data in Firebase...');
      
      const initPromises = houses.map(house =>
        firebaseService.updateHousePoints(house.id, {
          adminPoints: 0,
          totalPoints: 0,
          name: house.name
        })
      );
      
      await Promise.all(initPromises);
    }
    
    // Check if quiz history exists, if not initialize
    const quizHistoryResult = await firebaseService.readData('quizHistory');
    
    if (!quizHistoryResult.exists) {
      console.log('Initializing quiz history in Firebase...');
      await firebaseService.writeData('quizHistory', {});
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing Firebase data:', error);
    return { success: false, error: error.message };
  }
};

// Test Firebase connection with authentication
export const testFirebaseConnection = () => async () => {
  try {
    console.log('🧪 Testing Firebase connection with authentication...');
    const result = await firebaseService.testConnection();
    console.log('Firebase connection test result:', result);
    return result;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Export all actions
export const {
  setScoringHouse,
  setCurrentUser,
  logoutUser,
  addQuizPoint,
  subtractQuizPoint,
  saveQuizToHistory,
  clearCurrentQuiz,
  addAdminPoint,
  subtractAdminPoint,
  applyAdminPoints,   // ADD THIS
  updateHousesFromFirebase,
  updateQuizHistoryFromFirebase,
  setFirebaseConnected,
  setFirebaseAuthenticated,
  startTimer,
  pauseTimer,
  resetTimer,
  updateTimer,
  setTimer,
  resetAllScores
} = quizSlice.actions;
export const selectHouses = (state) => state.quiz.houses;
export const selectScoringHouse = (state) => state.quiz.scoringHouse;
export const selectCurrentUser = (state) => state.quiz.currentUser;
export const selectUserRole = (state) => state.quiz.userRole;
export const selectTimer = (state) => state.quiz.timer;
export const selectCurrentQuizPoints = (state) => state.quiz.currentQuizPoints;
export const selectQuizHistory = (state) => state.quiz.quizHistory;
export const selectFirebaseConnected = (state) => state.quiz.firebaseConnected;
export const selectFirebaseAuthenticated = (state) => state.quiz.firebaseAuthenticated;
export const selectHouseById = (houseId) => (state) => 
  state.quiz.houses.find(house => house.id === houseId);

export default quizSlice.reducer;