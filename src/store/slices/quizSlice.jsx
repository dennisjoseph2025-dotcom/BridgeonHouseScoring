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
  firebaseConnected: false
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
    // Admin Scoring - Updated to remove direct Firebase calls
    addAdminPoint: (state, action) => {
      const houseId = action.payload;
      const house = state.houses.find(h => h.id === houseId);
      if (house) {
        house.adminPoints += 1;
        house.totalPoints = house.adminPoints;
      }
    },
    subtractAdminPoint: (state, action) => {
      const houseId = action.payload;
      const house = state.houses.find(h => h.id === houseId);
      if (house && house.adminPoints > 0) {
        house.adminPoints -= 1;
        house.totalPoints = house.adminPoints;
      }
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
    // Updated to remove direct Firebase calls
    resetAllScores: (state) => {
      state.houses.forEach(house => {
        house.adminPoints = 0;
        house.totalPoints = 0;
      });
    }
  }
});

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
// Add new thunk actions for Firebase operations:
export const saveHouseToFirebase = (house) => async () => {
  try {
    console.log('🔄 Attempting to save house to Firebase:', house);
    
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

export const saveCurrentQuizToFirebase = () => async (dispatch, getState) => {
  try {
    const state = getState().quiz;
    
    // Save quiz history first
    const date = new Date().toISOString().split('T')[0];
    const currentHistory = { ...state.quizHistory };
    
    if (!currentHistory[date]) {
      currentHistory[date] = {};
    }
    
    Object.keys(state.currentQuizPoints).forEach(houseId => {
      if (!currentHistory[date][houseId]) {
        currentHistory[date][houseId] = 0;
      }
      currentHistory[date][houseId] += state.currentQuizPoints[houseId];
    });
    
    // Save to Firebase
    await firebaseService.writeData('quizHistory', currentHistory);
    
    // Update local state
    dispatch(saveQuizToHistory());
    
    return { success: true };
  } catch (error) {
    console.error('Error saving quiz to Firebase:', error);
    return { success: false, error: error.message };
  }
};

export const resetAllScoresFirebase = () => async (dispatch) => {
  try {
    // Reset all houses in Firebase
    const resetPromises = houses.map(house => 
      firebaseService.updateHousePoints(house.id, {
        adminPoints: 0,
        totalPoints: 0,
        name: house.name
      })
    );
    
    await Promise.all(resetPromises);
    
    // Reset quiz history
    await firebaseService.writeData('quizHistory', {});
    
    // Update local state
    dispatch(resetAllScores());
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting scores in Firebase:', error);
    return { success: false, error: error.message };
  }
};

// Initialize Firebase data
export const initializeFirebaseData = () => async () => {
  try {
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
  updateHousesFromFirebase,
  updateQuizHistoryFromFirebase,
  setFirebaseConnected,
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
export const selectHouseById = (houseId) => (state) => 
  state.quiz.houses.find(house => house.id === houseId);

export default quizSlice.reducer;