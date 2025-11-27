import { createSlice } from '@reduxjs/toolkit';
import { database } from '../../firebase/config';
import { ref, set, onValue, update } from 'firebase/database';

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

const loadInitialState = () => {
  const savedScores = localStorage.getItem('houseScores');
  if (savedScores) {
    const scores = JSON.parse(savedScores);
    return houses.map(house => ({
      ...house,
      adminPoints: scores[house.id]?.adminPoints || 0,
      totalPoints: scores[house.id]?.totalPoints || 0
    }));
  }
  return houses;
};

const initialState = {
  houses: loadInitialState(),
  scoringHouse: null,
  currentUser: null,
  userRole: null,
  // Quiz points history - stored by date
  quizHistory: {},
  // Current quiz session points (temporary, resets after saving)
  currentQuizPoints: {},
  timer: {
    isRunning: false,
    time: 0,
    initialTime: 0
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
    // Quiz Scoring (temporary for current session)
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
    saveQuizToHistory: (state, action) => {
      const date = action.payload || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      if (!state.quizHistory[date]) {
        state.quizHistory[date] = {};
      }

      // Add current quiz points to history
      Object.keys(state.currentQuizPoints).forEach(houseId => {
        if (!state.quizHistory[date][houseId]) {
          state.quizHistory[date][houseId] = 0;
        }
        state.quizHistory[date][houseId] += state.currentQuizPoints[houseId];
      });

      // Clear current quiz points after saving
      state.currentQuizPoints = {};

      // Save to Firebase
      saveQuizHistoryToFirebase(state.quizHistory);
    },
    // Clear current quiz session
    clearCurrentQuiz: (state) => {
      state.currentQuizPoints = {};
    },
    // Admin Scoring (for total house points)
    addAdminPoint: (state, action) => {
      const houseId = action.payload;
      const house = state.houses.find(h => h.id === houseId);
      if (house) {
        house.adminPoints += 1;
        house.totalPoints = house.adminPoints; // Only admin points count for total
        updateHouseInFirebase(house);
      }
    },
    subtractAdminPoint: (state, action) => {
      const houseId = action.payload;
      const house = state.houses.find(h => h.id === houseId);
      if (house && house.adminPoints > 0) {
        house.adminPoints -= 1;
        house.totalPoints = house.adminPoints; // Only admin points count for total
        updateHouseInFirebase(house);
      }
    },
    // Update houses from Firebase
    updateHousesFromFirebase: (state, action) => {
      const firebaseData = action.payload;
      state.houses.forEach(house => {
        if (firebaseData[house.id]) {
          house.adminPoints = firebaseData[house.id].adminPoints || 0;
          house.totalPoints = firebaseData[house.id].totalPoints || 0;
        }
      });
    },
    // Update quiz history from Firebase
    updateQuizHistoryFromFirebase: (state, action) => {
      state.quizHistory = action.payload || {};
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
        updateHouseInFirebase(house);
      });
    }
  }
});

// Helper function to update house in Firebase
const updateHouseInFirebase = (house) => {
  const houseRef = ref(database, `houses/${house.id}`);
  set(houseRef, {
    adminPoints: house.adminPoints,
    totalPoints: house.totalPoints,
    name: house.name,
    lastUpdated: Date.now()
  });
};

// Helper function to save quiz history to Firebase
const saveQuizHistoryToFirebase = (quizHistory) => {
  const quizHistoryRef = ref(database, 'quizHistory');
  set(quizHistoryRef, quizHistory);
};

// Real-time listener for house data
export const startHouseListener = () => (dispatch) => {
  const housesRef = ref(database, 'houses');
  onValue(housesRef, (snapshot) => {
    const data = snapshot.val();
    dispatch(updateHousesFromFirebase(data));
  });
};

// Real-time listener for quiz history
export const startQuizHistoryListener = () => (dispatch) => {
  const quizHistoryRef = ref(database, 'quizHistory');
  onValue(quizHistoryRef, (snapshot) => {
    const data = snapshot.val();
    dispatch(updateQuizHistoryFromFirebase(data));
  });
};

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
export const selectHouseById = (houseId) => (state) =>
  state.quiz.houses.find(house => house.id === houseId);

export default quizSlice.reducer;