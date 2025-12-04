import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCeLsqlF0tUDEJlbpGre-QZRK_o4fsKIEE",
  authDomain: "bridgeon-house-scoring.firebaseapp.com",
  projectId: "bridgeon-house-scoring",
  databaseURL: "https://bridgeon-house-scoring-default-rtdb.firebaseio.com/",
  storageBucket: "bridgeon-house-scoring.firebasestorage.app",
  messagingSenderId: "619628309614",
  appId: "1:619628309614:web:bfe6da71ae236718bc4a7f",
  measurementId: "G-8CRH8SF4GL"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function initializeDatabase() {
  try {
    // Initialize scoring control
    await set(ref(database, 'scoringControl'), {
      activeHouseId: null,
      scoringSessionStartTime: null,
      scoringSessionEndTime: null,
      sessionId: null,
      status: 'inactive',
      lastUpdated: Date.now()
    });

    // Initialize active scoring session
    await set(ref(database, 'activeScoringSession'), null);

    // Initialize scoring history
    await set(ref(database, 'scoringHistory'), {});

    // Update houses with isScoring field
    const houses = ['gryffindor', 'slytherin', 'hufflepuff', 'ravenclaw', 'media'];
    
    for (const houseId of houses) {
      const houseRef = ref(database, `houses/${houseId}`);
      // Read existing house data first
      const snapshot = await get(houseRef);
      const existingData = snapshot.val() || {};
      
      // Update with isScoring field
      await set(houseRef, {
        ...existingData,
        isScoring: false,
        _lastUpdated: Date.now()
      });
      
      console.log(`✅ Updated ${houseId} with isScoring field`);
    }

    console.log('✅ Firebase database initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Run initialization
initializeDatabase();