import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  setScoringHouse,
  selectHouses,
  selectCurrentUser,
  selectUserRole,
  selectCurrentUserHouse,
  selectScoringControl,
  selectFirebaseConnected
} from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const HouseTargetSelection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const currentUserHouse = useSelector(selectCurrentUserHouse);
  const scoringControl = useSelector(selectScoringControl);
  const firebaseConnected = useSelector(selectFirebaseConnected);
  
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [currentScoringHouse, setCurrentScoringHouse] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const checkTimeoutRef = useRef(null);
  const initialCheckDone = useRef(false);

  // Main useEffect for data loading and access checking
  useEffect(() => {
    // Clear any existing timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    console.log('=== TARGET SELECTION ACCESS CHECK ===');
    console.log('Data status:', {
      firebaseConnected,
      housesCount: houses.length,
      currentUserHouse: currentUserHouse?.name || 'loading',
      scoringControlLoaded: !!scoringControl,
      scoringControlStatus: scoringControl?.status
    });

    // If we're still waiting for critical data, keep loading
    if (!firebaseConnected || houses.length === 0 || !currentUserHouse || !scoringControl) {
      console.log('⏳ Waiting for critical data...');
      setIsLoading(true);
      return;
    }

    // Delay the final access check to ensure all data is stable
    checkTimeoutRef.current = setTimeout(() => {
      console.log('🏁 Performing final access check...');
      
      // Reset states for fresh check
      setHasAccess(false);
      setAccessChecked(false);
      
      // Check 1: Active scoring session
      if (scoringControl.status !== 'active') {
        console.log('❌ No active scoring session');
        setIsLoading(false);
        setAccessChecked(true);
        toast.error('⛔ No active scoring session. Please wait for admin to start one.');
        return;
      }

      // Check 2: User is scoring house
      const isScoringHouseUser = currentUserHouse.id === scoringControl.activeHouseId && 
                                 currentUserHouse.isScoring;
      
      if (!isScoringHouseUser) {
        console.log('❌ User is not scoring house:', {
          userHouseId: currentUserHouse.id,
          scoringHouseId: scoringControl.activeHouseId,
          userIsScoring: currentUserHouse.isScoring
        });
        setIsLoading(false);
        setAccessChecked(true);
        
        const scoringHouseName = houses.find(h => h.id === scoringControl.activeHouseId)?.name || 'Unknown';
        toast.error(`⛔ Only ${scoringHouseName} can access Target Selection`);
        return;
      }

      console.log('✅ ACCESS GRANTED!');
      
      // Grant access
      setHasAccess(true);
      setAccessChecked(true);
      setIsLoading(false);
      
      // Set the current scoring house
      setCurrentScoringHouse(currentUserHouse);
      dispatch(setScoringHouse(currentUserHouse.id));
      
      // Load previously selected targets from localStorage
      const savedTargets = localStorage.getItem('selectedTargets');
      if (savedTargets) {
        setSelectedTargets(JSON.parse(savedTargets));
      }
      
      initialCheckDone.current = true;
      
    }, 1000); // Delay to ensure data stability

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [firebaseConnected, houses, currentUserHouse, scoringControl, dispatch]);

  // Handle the case where user should have access but got denied
  useEffect(() => {
    // Only run if access check is complete but user seems to be denied incorrectly
    if (accessChecked && !hasAccess && !isLoading) {
      // Check if we should actually have access
      const shouldHaveAccess = scoringControl?.status === 'active' && 
                              currentUserHouse?.id === scoringControl?.activeHouseId && 
                              currentUserHouse?.isScoring;
      
      if (shouldHaveAccess) {
        console.log('🔄 Correcting access state - user should have access');
        setHasAccess(true);
        setIsLoading(false);
        setCurrentScoringHouse(currentUserHouse);
        dispatch(setScoringHouse(currentUserHouse.id));
      }
    }
  }, [accessChecked, hasAccess, isLoading, scoringControl, currentUserHouse, dispatch]);

  // Get the scoring house object
  const scoringHouse = houses.find(h => h.id === currentScoringHouse?.id);

  // Houses that can be scored (excluding the scoring house itself)
  const availableTargets = houses.filter(house => house.id !== currentScoringHouse?.id);

  const handleTargetToggle = (houseId) => {
    if (!hasAccess) {
      toast.error('⛔ Access denied');
      return;
    }
    
    setSelectedTargets(prev => 
      prev.includes(houseId) 
        ? prev.filter(id => id !== houseId)
        : [...prev, houseId]
    );
  };

  const handleStartScoring = async () => {
    if (!hasAccess) {
      toast.error('⛔ Access denied');
      return;
    }
    
    if (selectedTargets.length === 0) {
      toast.error('Please select at least one house to score');
      return;
    }

    if (!currentScoringHouse) {
      toast.error('Unable to determine your house. Please log in again.');
      return;
    }

    // Store selected targets in localStorage for use in scoring page
    localStorage.setItem('selectedTargets', JSON.stringify(selectedTargets));
    
    toast.success(`Targets saved for ${currentScoringHouse.name}!`, {
      icon: '🎯',
      duration: 3000
    });
    
    // Navigate to quiz scoring
    navigate('/quiz-scoring');
  };

  const handleSelectAll = () => {
    if (!hasAccess) {
      toast.error('⛔ Access denied');
      return;
    }
    
    setSelectedTargets(availableTargets.map(house => house.id));
  };

  const handleDeselectAll = () => {
    if (!hasAccess) {
      toast.error('⛔ Access denied');
      return;
    }
    
    setSelectedTargets([]);
  };

  // Show loading while data is loading
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in">
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="w-20 h-20 bg-slate-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">🎯</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Loading Target Selection...</h2>
          <p className="text-slate-400 mb-6 md:mb-8 text-sm md:text-base">
            Setting up your target selection environment
          </p>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
          </div>
          
          <div className="bg-slate-800/30 p-4 rounded-lg text-left text-xs text-slate-400">
            <p className="font-medium mb-2">Current Status:</p>
            <div className="space-y-1">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${firebaseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Firebase: {firebaseConnected ? 'Connected' : 'Connecting...'}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${houses.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>Houses: {houses.length} loaded</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${currentUserHouse ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>User House: {currentUserHouse?.name || 'Loading...'}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${scoringControl ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>Scoring Status: {scoringControl?.status || 'Loading...'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show this only after loading is complete AND access is denied
  if (!hasAccess && accessChecked && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center fade-in">
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="w-20 h-20 bg-slate-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">⛔</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Access Restricted</h2>
          
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-slate-300 mb-2 font-medium">Current Status:</p>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${currentUserHouse?.isScoring ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Your House: <span className={`font-semibold ${currentUserHouse?.isScoring ? 'text-green-400' : 'text-yellow-400'}`}>
                  {currentUserHouse?.name || 'Unknown'} {currentUserHouse?.isScoring ? '(Scoring)' : '(Not Scoring)'}
                </span></span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${scoringControl?.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span>Scoring Session: <span className={`font-semibold ${scoringControl?.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                  {scoringControl?.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                </span></span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-3 bg-blue-500"></div>
                <span>Scoring House: <span className="font-semibold text-blue-400">
                  {houses.find(h => h.id === scoringControl?.activeHouseId)?.name || 'None selected'}
                </span></span>
              </div>
            </div>
          </div>
          
          <p className="text-slate-400 mb-6 text-sm md:text-base">
            {scoringControl?.status !== 'active' 
              ? 'No active scoring session. Please wait for admin to start a scoring session.'
              : `Only ${houses.find(h => h.id === scoringControl?.activeHouseId)?.name || 'the scoring house'} can access this panel.`}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/leaderboard')}
              className="px-6 py-3 md:px-8 md:py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
            >
              Back to Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no house is selected for current user (but we have access)
  if (!currentScoringHouse && hasAccess) {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in px-4">
        <div className="glass rounded-2xl p-6 md:p-12">
          <div className="w-16 h-16 bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🏠</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">House Detection Issue</h2>
          <p className="text-slate-400 mb-4 text-sm md:text-base">
            We couldn't determine your house automatically.
          </p>
          <div className="bg-slate-800/50 p-4 rounded-lg mb-6">
            <p className="text-slate-300 mb-2">Your user info:</p>
            <p className="text-sm text-slate-400 mb-1">Email: {currentUser?.email || 'Not available'}</p>
            <p className="text-sm text-slate-400">Role: {userRole || 'Not set'}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
            >
              🔐 Re-login
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main interface - only show when hasAccess is true and not loading
  if (hasAccess && !isLoading && currentScoringHouse) {
    return (
      <div className="max-w-6xl mx-auto fade-in px-4">
        {/* Header */}
        <div className="glass rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
              <div className={`w-12 h-12 md:w-16 md:h-16 ${scoringHouse.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                <img 
                  src={scoringHouse.icon} 
                  alt={scoringHouse.name}
                  className="w-6 h-6 md:w-10 md:h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">Select Houses to Score</h1>
                <p className="text-slate-400 text-sm md:text-base">
                  Choose which houses <span className={`font-semibold text-${scoringHouse.color}`}>{scoringHouse.name}</span> will award quiz points to
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-green-400 text-xs font-medium">✅ Access Granted - You are the scoring house</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <div className="text-center lg:text-right">
                <p className="text-xs md:text-sm text-slate-400">Selected</p>
                <p className="text-xl md:text-2xl font-bold text-white">{selectedTargets.length}/{availableTargets.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="glass rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-3 md:gap-4">
            <div className="text-center lg:text-left mb-3 lg:mb-0">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2">
                Available Target Houses
              </h2>
              <p className="text-slate-400 text-xs md:text-sm">
                Tap on houses to select/deselect them for quiz scoring
              </p>
            </div>
            <div className="flex space-x-2 md:space-x-3">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 md:px-4 md:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors text-sm md:text-base"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-2 md:px-4 md:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm md:text-base"
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>

        {/* Houses Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          {availableTargets.map(house => (
            <div
              key={house.id}
              className={`glass-dark rounded-xl md:rounded-2xl p-3 md:p-6 transition-all duration-300 cursor-pointer group border-2 ${
                selectedTargets.includes(house.id)
                  ? 'border-blue-500 bg-blue-500/10 transform scale-105'
                  : 'border-transparent hover:border-slate-600 hover:scale-105'
              }`}
              onClick={() => handleTargetToggle(house.id)}
            >
              <div className="text-center">
                {/* House Icon */}
                <div className={`w-12 h-12 md:w-20 md:h-20 ${house.bgColor} rounded-xl md:rounded-2xl mx-auto mb-2 md:mb-4 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  <img 
                    src={house.icon} 
                    alt={house.name}
                    className="w-6 h-6 md:w-12 md:h-12 object-contain"
                  />
                </div>
                
                {/* House Name */}
                <h3 className={`text-base md:text-2xl font-bold text-${house.color} mb-1 md:mb-2`}>
                  {house.name}
                </h3>
                
                {/* Current Points */}
                <div className="mb-2 md:mb-4">
                  <p className="text-slate-400 text-xs md:text-sm">House Points</p>
                  <p className="text-lg md:text-3xl font-bold text-white">{house.totalPoints}</p>
                </div>

                {/* Selection Indicator */}
                <div className={`p-1 md:p-3 rounded-lg transition-all duration-200 ${
                  selectedTargets.includes(house.id)
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'bg-slate-700/50 border border-slate-600/30'
                }`}>
                  <p className={`font-medium text-xs md:text-sm ${
                    selectedTargets.includes(house.id) ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    {selectedTargets.includes(house.id) ? '✓ Selected' : 'Click to Select'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="glass rounded-2xl p-4 md:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 md:gap-4">
            <div className="text-center lg:text-left mb-4 lg:mb-0">
              <p className="text-slate-400 text-sm md:text-lg">
                Ready to start quiz scoring?
              </p>
              <p className="text-white font-semibold text-base md:text-lg">
                {selectedTargets.length} house{selectedTargets.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-400 text-xs font-medium">✅ You are the scoring house</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
              <button
                onClick={handleStartScoring}
                disabled={selectedTargets.length === 0}
                className={`px-4 py-2 md:px-8 md:py-3 rounded-xl font-semibold text-base md:text-lg transition-all duration-200 ${
                  selectedTargets.length === 0
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                🎯 Start Scoring
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="max-w-2xl mx-auto text-center fade-in">
      <div className="glass rounded-2xl p-8 md:p-12">
        <div className="w-20 h-20 bg-slate-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-3xl">❓</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Unexpected State</h2>
        <p className="text-slate-400 mb-6 text-sm md:text-base">
          Please refresh the page or contact support.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

export default HouseTargetSelection;