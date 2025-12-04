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
    totalPoints: 0,
    isScoring: false
  },
  { 
    id: 'slytherin', 
    name: 'Slytherin', 
    color: 'slytherin', 
    bgColor: 'bg-slytherin', 
    icon: slytherinIcon,
    adminPoints: 0,
    totalPoints: 0,
    isScoring: false
  },
  { 
    id: 'hufflepuff', 
    name: 'Hufflepuff', 
    color: 'hufflepuff', 
    bgColor: 'bg-hufflepuff', 
    icon: hufflepuffIcon,
    adminPoints: 0,
    totalPoints: 0,
    isScoring: false
  },
  { 
    id: 'ravenclaw', 
    name: 'Ravenclaw', 
    color: 'ravenclaw', 
    bgColor: 'bg-ravenclaw', 
    icon: ravenclawIcon,
    adminPoints: 0,
    totalPoints: 0,
    isScoring: false
  },
  { 
    id: 'media', 
    name: 'Media Team', 
    color: 'media', 
    bgColor: 'bg-media', 
    icon: mediaIcon,
    adminPoints: 0,
    totalPoints: 0,
    isScoring: false
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
  firebaseAuthenticated: false,
  scoringSessionActive: false,
  activeScoringHouseId: null,
  scoringSessionStartTime: null,
  scoringSessionEndTime: null,
  currentScoringSession: null,
  // ADD THESE NEW STATES FOR SCORING CONTROL
  scoringControl: {
    activeHouseId: null,
    scoringSessionStartTime: null,
    scoringSessionEndTime: null,
    sessionId: null,
    status: 'inactive',
    lastUpdated: 0
  }
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
            house.isScoring = firebaseData[house.id].isScoring || false;
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
        house.isScoring = false;
      });
    },
    // ADD THESE NEW REDUCERS FOR SCORING SESSION MANAGEMENT
    startScoringSession: (state, action) => {
      const { houseId } = action.payload;
      state.scoringSessionActive = true;
      state.activeScoringHouseId = houseId;
      state.scoringSessionStartTime = Date.now();
      state.scoringSessionEndTime = null;
      
      // Reset all houses' isScoring to false
      state.houses.forEach(house => {
        house.isScoring = false;
      });
      
      // Set the active house's isScoring to true
      const activeHouse = state.houses.find(h => h.id === houseId);
      if (activeHouse) {
        activeHouse.isScoring = true;
      }
    },
    endScoringSession: (state) => {
      state.scoringSessionActive = false;
      state.activeScoringHouseId = null;
      state.scoringSessionEndTime = Date.now();
      state.scoringSessionStartTime = null;
      state.currentScoringSession = null;
      
      // Reset all houses' isScoring to false
      state.houses.forEach(house => {
        house.isScoring = false;
      });
    },
    // checkScoringSessionTimeout: (state) => {
    //   if (state.scoringSessionActive && state.scoringSessionStartTime) {
    //     const sessionDuration = Date.now() - state.scoringSessionStartTime;
    //     const maxSessionDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        
    //     if (sessionDuration > maxSessionDuration) {
    //       state.scoringSessionActive = false;
    //       state.activeScoringHouseId = null;
    //       state.scoringSessionEndTime = Date.now();
    //       state.scoringSessionStartTime = null;
    //       state.currentScoringSession = null;
          
    //       // Reset all houses' isScoring to false
    //       state.houses.forEach(house => {
    //         house.isScoring = false;
    //       });
    //     }
    //   }
    // },
    // ADD THIS NEW REDUCER FOR FIREBASE SYNC
    setCurrentScoringSessionFromFirebase: (state, action) => {
      const sessionData = action.payload;
      state.scoringSessionActive = true;
      state.activeScoringHouseId = sessionData.activeScoringHouseId || sessionData.houseId;
      state.scoringSessionStartTime = sessionData.startTime || sessionData._lastUpdated;
      state.scoringSessionEndTime = null;
      state.currentScoringSession = sessionData;
      
      // Update house isScoring status
      state.houses.forEach(house => {
        house.isScoring = house.id === (sessionData.activeScoringHouseId || sessionData.houseId);
      });
    },
    // ADD THESE NEW REDUCERS FOR SCORING CONTROL
    setScoringControl: (state, action) => {
      state.scoringControl = action.payload;
      
      // Update house isScoring status based on scoring control
      if (action.payload.status === 'active' && action.payload.activeHouseId) {
        state.houses.forEach(house => {
          house.isScoring = house.id === action.payload.activeHouseId;
        });
      } else {
        state.houses.forEach(house => {
          house.isScoring = false;
        });
      }
    },
    setHouseIsScoring: (state, action) => {
      const { houseId, isScoring } = action.payload;
      const house = state.houses.find(h => h.id === houseId);
      if (house) {
        house.isScoring = isScoring;
      }
    },
    clearScoringControl: (state) => {
      state.scoringControl = {
        activeHouseId: null,
        scoringSessionStartTime: null,
        scoringSessionEndTime: null,
        sessionId: null,
        status: 'inactive',
        lastUpdated: 0
      };
      
      // Reset all houses' isScoring to false
      state.houses.forEach(house => {
        house.isScoring = false;
      });
    },
  }
});

// =============== THUNK ACTIONS ===============

// Thunk Actions with Authentication Handling
const saveQuizToFirebase = () => async (dispatch, getState) => {
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

const saveCurrentQuizSession = () => async (dispatch, getState) => {
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
const startHouseListener = () => (dispatch) => {
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

const startQuizHistoryListener = () => (dispatch) => {
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

// ADD THIS NEW LISTENER FOR SCORING SESSIONS
// const startScoringSessionListener = () => (dispatch) => {
//   console.log('🔄 Starting scoring session listener...');
  
//   const unsubscribe = firebaseService.listenToScoringSession((data, error) => {
//     if (error) {
//       console.error('❌ Scoring session listener error:', error);
//       return;
//     }
    
//     console.log('📡 Scoring session update from Firebase:', data);
    
//     if (data) {
//       // Update local state with Firebase data
//       dispatch(setCurrentScoringSessionFromFirebase(data));
      
//       // Check if session is expired
//       const sessionDuration = Date.now() - (data.startTime || data._lastUpdated);
//       const maxSessionDuration = 2 * 60 * 60 * 1000; // 2 hours
      
//       if (sessionDuration > maxSessionDuration) {
//         console.log('⚠️ Scoring session expired, clearing...');
//         dispatch(endScoringSession());
//         firebaseService.clearScoringSession();
//       }
//     } else {
//       // No active session in Firebase
//       dispatch(endScoringSession());
//     }
//   });

//   return unsubscribe;
// };

// Add Firebase authentication status listener
const startFirebaseAuthListener = () => (dispatch) => {
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

const saveAllHousesSingleWrite = () => async (dispatch, getState) => {
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
        isScoring: house.isScoring || false,
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
const saveHouseToFirebase = (house) => async (dispatch) => {
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
      name: house.name,
      isScoring: house.isScoring || false
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

const saveQuizHistoryToFirebase = (quizHistory) => async () => {
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

const saveCurrentQuizToFirebase = (mode = 'replace') => async (dispatch, getState) => {
  try {
    const state = getState().quiz;
    const currentQuizPoints = state.currentQuizPoints;
    
    // STRICTER VALIDATION: Only the active scoring house can save quiz points
    if (state.scoringControl.status === 'active') {
      const currentUserHouse = state.houses.find(h => 
        state.currentUser?.email?.toLowerCase().includes(h.name.toLowerCase()) ||
        state.currentUser?.houseId === h.id
      );
      
      // Check if current user is from the scoring house
      if (!currentUserHouse || !currentUserHouse.isScoring) {
        const scoringHouse = state.houses.find(h => h.isScoring);
        return { 
          success: false, 
          error: `⛔ Only ${scoringHouse?.name || 'the selected house'} can save quiz points during active scoring session`,
          accessDenied: true
        };
      }
    } else {
      // No active session - no one can save quiz points
      return { 
        success: false, 
        error: '⛔ No active scoring session. Please wait for admin to start a scoring session.',
        accessDenied: true
      };
    }
    
    // Rest of the function remains the same...
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

const resetAllScoresFirebase = () => async (dispatch) => {
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
        name: house.name,
        isScoring: false
      })
    );
    
    await Promise.all(resetPromises);
    
    // Update local state
    dispatch(resetAllScores());
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting scores in Firebase:', error);
    return { success: false, error: error.message };
  }
};

// ADD THIS NEW THUNK FOR SCORING SESSION MANAGEMENT
const manageScoringSession = (action, houseId = null, houseData = null) => async (dispatch, getState) => {
  try {
    if (action === 'start') {
      if (!houseId) {
        throw new Error('House ID is required to start a scoring session');
      }
      
      const house = houseData || getState().quiz.houses.find(h => h.id === houseId);
      if (!house) {
        throw new Error(`House with ID ${houseId} not found`);
      }
      
      const sessionData = {
        activeScoringHouseId: houseId,
        houseName: house.name,
        houseColor: house.color,
        houseIcon: house.icon,
        houseBgColor: house.bgColor,
        startTime: Date.now(),
        status: 'active',
        startedBy: getState().quiz.currentUser?.email || 'unknown',
        timestamp: Date.now()
      };
      
      // Save to Firebase first
      const result = await firebaseService.saveScoringSession(sessionData);
      
      if (!result.success) {
        throw new Error(`Failed to save to Firebase: ${result.error}`);
      }
      
      // Then update local state
      dispatch(startScoringSession({ houseId }));
      
      // Update the house's isScoring status in Firebase
      await firebaseService.updateHousePoints(houseId, {
        adminPoints: house.adminPoints,
        totalPoints: house.totalPoints,
        name: house.name,
        isScoring: true
      });
      
      console.log('✅ Scoring session started for house:', house.name);
      
      return { 
        success: true, 
        houseId,
        houseName: house.name,
        data: sessionData
      };
      
    } else if (action === 'end') {
      const state = getState().quiz;
      
      if (state.scoringSessionActive) {
        // Get session data before clearing
        const activeHouse = state.houses.find(h => h.id === state.activeScoringHouseId);
        const sessionData = {
          activeScoringHouseId: state.activeScoringHouseId,
          houseName: activeHouse?.name,
          startTime: state.scoringSessionStartTime,
          endTime: Date.now(),
          duration: Date.now() - state.scoringSessionStartTime,
          endedBy: state.currentUser?.email || 'unknown'
        };
        
        // Save to history before clearing
        await firebaseService.saveToScoringHistory(sessionData);
        
        // Clear from Firebase
        await firebaseService.clearScoringSession();
        
        // Update the house's isScoring status in Firebase
        if (activeHouse) {
          await firebaseService.updateHousePoints(activeHouse.id, {
            adminPoints: activeHouse.adminPoints,
            totalPoints: activeHouse.totalPoints,
            name: activeHouse.name,
            isScoring: false
          });
        }
        
        // Then update local state
        dispatch(endScoringSession());
        
        console.log('✅ Scoring session ended');
        
        return { 
          success: true,
          endedBy: state.currentUser?.email,
          duration: sessionData.duration
        };
      }
      
      return { success: false, error: 'No active scoring session' };
      
    } else if (action === 'check') {
      // Check if any scoring session is active in Firebase
      const result = await firebaseService.getCurrentScoringSession();
      
      if (result.success && result.exists && result.data) {
        const sessionData = result.data;
        
        // Update local state with Firebase data
        dispatch(setCurrentScoringSessionFromFirebase(sessionData));
        
        return { 
          active: true, 
          houseId: sessionData.activeScoringHouseId || sessionData.houseId,
          houseName: sessionData.houseName,
          startTime: sessionData.startTime || sessionData._lastUpdated,
          duration: result.duration
        };
      }
      
      // Ensure local state matches Firebase
      dispatch(endScoringSession());
      
      return { active: false };
    }
    
    return { success: false, error: 'Invalid action' };
  } catch (error) {
    console.error('❌ Error managing scoring session:', error);
    return { success: false, error: error.message };
  }
};

// ADD THIS THUNK TO CHECK IF USER CAN SCORE
const checkIfUserCanScore = () => async (dispatch, getState) => {
  try {
    const state = getState().quiz;
    
    // Admin can always score
    if (state.userRole === 'admin') {
      return { canScore: true, reason: 'Admin has full access' };
    }
    
    // Get current user's house
    const currentUserHouse = state.houses.find(h => 
      state.currentUser?.email?.toLowerCase().includes(h.name.toLowerCase()) ||
      state.currentUser?.houseId === h.id
    );
    
    if (!currentUserHouse) {
      return { canScore: false, reason: 'User not associated with any house' };
    }
    
    // Check if scoring session is active
    if (state.scoringControl.status === 'active') {
      // Only the scoring house can score during active session
      if (currentUserHouse.isScoring) {
        return { canScore: true, reason: 'Active scoring house' };
      } else {
        const scoringHouse = state.houses.find(h => h.isScoring);
        return { 
          canScore: false, 
          reason: `⛔ Only ${scoringHouse?.name || 'the selected house'} can score during active session`,
          accessDenied: true
        };
      }
    } else {
      // No active session - NO ONE can score
      return { 
        canScore: false, 
        reason: '⛔ No active scoring session. Please wait for admin to start a scoring session.',
        accessDenied: true
      };
    }
  } catch (error) {
    console.error('Error checking if user can score:', error);
    return { canScore: false, reason: 'Error checking permissions' };
  }
};

// ADD THIS THUNK TO START SCORING SESSION WITH FIREBASE SYNC
const startScoringSessionWithControl = (houseId) => async (dispatch, getState) => {
  try {
    const state = getState().quiz;
    const house = state.houses.find(h => h.id === houseId);
    
    if (!house) {
      return { success: false, error: 'House not found' };
    }
    
    // Check if another house is already scoring
    if (state.scoringControl.status === 'active') {
      const activeHouse = state.houses.find(h => h.isScoring);
      return { 
        success: false, 
        error: `${activeHouse?.name} is currently scoring. Please wait for them to finish.` 
      };
    }
    
    // Create scoring control data
    const scoringControlData = {
      activeHouseId: houseId,
      scoringSessionStartTime: Date.now(),
      scoringSessionEndTime: null,
      sessionId: `session_${Date.now()}`,
      status: 'active',
      lastUpdated: Date.now()
    };
    
    // Save to Firebase
    const result = await firebaseService.writeData('scoringControl', scoringControlData);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // Update local state
    dispatch(setScoringControl(scoringControlData));
    
    // Update house isScoring status in Firebase
    await firebaseService.updateHousePoints(houseId, {
      adminPoints: house.adminPoints,
      totalPoints: house.totalPoints,
      name: house.name,
      isScoring: true
    });
    
    return { 
      success: true, 
      houseName: house.name,
      data: scoringControlData 
    };
    
  } catch (error) {
    console.error('Error starting scoring session:', error);
    return { success: false, error: error.message };
  }
};

// ADD THIS THUNK TO END SCORING SESSION WITH FIREBASE SYNC
const endScoringSessionWithControl = () => async (dispatch, getState) => {
  try {
    const state = getState().quiz;
    
    // Get active house
    const activeHouse = state.houses.find(h => h.isScoring);
    
    // Create scoring control data for inactive state
    const scoringControlData = {
      activeHouseId: null,
      scoringSessionStartTime: null,
      scoringSessionEndTime: Date.now(),
      sessionId: null,
      status: 'inactive',
      lastUpdated: Date.now()
    };
    
    // Save to Firebase
    const result = await firebaseService.writeData('scoringControl', scoringControlData);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // Update all houses' isScoring status in Firebase
    const updatePromises = state.houses.map(house =>
      firebaseService.updateHousePoints(house.id, {
        adminPoints: house.adminPoints,
        totalPoints: house.totalPoints,
        name: house.name,
        isScoring: false
      })
    );
    
    await Promise.all(updatePromises);
    
    // Update local state
    dispatch(clearScoringControl());
    
    return { 
      success: true, 
      endedHouse: activeHouse?.name,
      duration: activeHouse ? Date.now() - state.scoringControl.scoringSessionStartTime : 0
    };
    
  } catch (error) {
    console.error('Error ending scoring session:', error);
    return { success: false, error: error.message };
  }
};

// ADD THIS THUNK FOR SCORING CONTROL LISTENER
const startScoringControlListener = () => (dispatch) => {
  console.log('🔄 Starting scoring control listener...');
  
  const unsubscribe = firebaseService.listenToScoringControl((data, error) => {
    if (error) {
      console.error('❌ Scoring control listener error:', error);
      return;
    }
    
    console.log('📡 Scoring control update:', data);
    
    if (data) {
      dispatch(setScoringControl(data));
    } else {
      // If no data, set to inactive state
      dispatch(setScoringControl({
        activeHouseId: null,
        scoringSessionStartTime: null,
        scoringSessionEndTime: null,
        sessionId: null,
        status: 'inactive',
        lastUpdated: Date.now()
      }));
    }
  });

  return unsubscribe;
};

// Initialize Firebase data with authentication handling
const initializeFirebaseData = () => async () => {
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
          name: house.name,
          isScoring: false
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
    
    // Initialize scoring control if not exists
    const scoringControlResult = await firebaseService.readData('scoringControl');
    
    if (!scoringControlResult.exists) {
      console.log('Initializing scoring control in Firebase...');
      await firebaseService.writeData('scoringControl', {
        activeHouseId: null,
        scoringSessionStartTime: null,
        scoringSessionEndTime: null,
        sessionId: null,
        status: 'inactive',
        lastUpdated: Date.now()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing Firebase data:', error);
    return { success: false, error: error.message };
  }
};

// Test Firebase connection with authentication
const testFirebaseConnection = () => async () => {
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

// =============== EXPORTS ===============

// Export all actions from slice
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
  applyAdminPoints,
  updateHousesFromFirebase,
  updateQuizHistoryFromFirebase,
  setFirebaseConnected,
  setFirebaseAuthenticated,
  startTimer,
  pauseTimer,
  resetTimer,
  updateTimer,
  setTimer,
  resetAllScores,
  // ADD THESE NEW ACTIONS
  startScoringSession,
  endScoringSession,
  checkScoringSessionTimeout,
  setCurrentScoringSessionFromFirebase,
  setScoringControl,
  setHouseIsScoring,
  clearScoringControl,
} = quizSlice.actions;

// Export all thunks (separately to avoid duplicate exports)
export {
  saveQuizToFirebase,

  saveCurrentQuizSession,
  startHouseListener,
  startQuizHistoryListener,
  // startScoringSessionListener,
  startFirebaseAuthListener,
  saveAllHousesSingleWrite,
  saveHouseToFirebase,
  saveQuizHistoryToFirebase,
  saveCurrentQuizToFirebase,
  resetAllScoresFirebase,
  manageScoringSession,
  initializeFirebaseData,
  testFirebaseConnection,
  // ADD THESE NEW THUNKS
  checkIfUserCanScore,
  startScoringSessionWithControl,
  endScoringSessionWithControl,
  startScoringControlListener,
};

// Export all selectors
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

// ADD THESE NEW SELECTORS FOR SCORING SESSION
export const selectScoringSessionActive = (state) => state.quiz.scoringSessionActive;
export const selectActiveScoringHouseId = (state) => state.quiz.activeScoringHouseId;
export const selectScoringSessionStartTime = (state) => state.quiz.scoringSessionStartTime;
export const selectScoringSessionEndTime = (state) => state.quiz.scoringSessionEndTime;
export const selectActiveScoringHouse = (state) => 
  state.quiz.houses.find(house => house.id === state.quiz.activeScoringHouseId);
export const selectCurrentScoringSession = (state) => state.quiz.currentScoringSession;

// ADD THESE NEW SELECTORS FOR SCORING CONTROL
export const selectScoringControl = (state) => state.quiz.scoringControl;
export const selectCanCurrentUserScore = (state) => {
  if (state.quiz.userRole === 'admin') return true;
  
  const currentUserHouse = state.quiz.houses.find(h => 
    state.quiz.currentUser?.email?.toLowerCase().includes(h.name.toLowerCase()) ||
    state.quiz.currentUser?.houseId === h.id
  );
  
  if (!currentUserHouse) return false;
  
  // If scoring session is active, only the scoring house can score
  if (state.quiz.scoringControl.status === 'active') {
    return currentUserHouse.isScoring;
  }
  
  // If no active session, all houses can score
  return true;
};
export const selectIsScoringHouse = (houseId) => (state) => {
  const house = state.quiz.houses.find(h => h.id === houseId);
  return house?.isScoring || false;
};
export const selectCurrentUserHouse = (state) => 
  state.quiz.houses.find(h => 
    state.quiz.currentUser?.email?.toLowerCase().includes(h.name.toLowerCase()) ||
    state.quiz.currentUser?.houseId === h.id
  );

export default quizSlice.reducer;