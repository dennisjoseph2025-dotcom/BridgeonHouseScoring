import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  addQuizPoint,
  subtractQuizPoint,
  clearCurrentQuiz,
  selectHouses,
  selectScoringHouse,
  selectCurrentQuizPoints,
  saveCurrentQuizToFirebase,
  selectCurrentUserHouse,
  selectScoringControl,
  selectFirebaseConnected
} from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const QuizScoring = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const scoringHouseId = useSelector(selectScoringHouse);
  const currentQuizPoints = useSelector(selectCurrentQuizPoints);
  const currentUserHouse = useSelector(selectCurrentUserHouse);
  const scoringControl = useSelector(selectScoringControl);
  const firebaseConnected = useSelector(selectFirebaseConnected);
  
  const [housesToScore, setHousesToScore] = useState([]);
  const [saveMode, setSaveMode] = useState('replace');
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const checkTimeoutRef = useRef(null);
  const initialCheckDone = useRef(false);

  const scoringHouse = houses.find(h => h.id === scoringHouseId);

  useEffect(() => {
    // Clear any existing timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    console.log('=== ACCESS CHECK CYCLE START ===');
    console.log('Data status:', {
      firebaseConnected,
      housesCount: houses.length,
      currentUserHouse: currentUserHouse?.name || 'loading',
      scoringControlLoaded: !!scoringControl,
      scoringControlStatus: scoringControl?.status,
      scoringHouseId: scoringHouseId
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
        toast.error(`⛔ Only ${scoringHouseName} can access Quiz Scoring`);
        return;
      }

      console.log('✅ ACCESS GRANTED!');
      console.log('User house:', currentUserHouse.name);
      console.log('Scoring house ID:', scoringControl.activeHouseId);
      
      // Grant access
      setHasAccess(true);
      setAccessChecked(true);
      setIsLoading(false);
      
      // Load selected targets
      if (scoringHouseId) {
        const savedTargets = localStorage.getItem('selectedTargets');
        if (savedTargets) {
          const targetIds = JSON.parse(savedTargets);
          setHousesToScore(houses.filter(house => targetIds.includes(house.id)));
        } else {
          setHousesToScore(houses.filter(house => house.id !== scoringHouseId));
        }
      }
      
      initialCheckDone.current = true;
      
    }, 1000);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [firebaseConnected, houses, currentUserHouse, scoringControl, scoringHouseId]);

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
      }
    }
  }, [accessChecked, hasAccess, isLoading, scoringControl, currentUserHouse]);

  // Handle adding points
  const handleAddQuizPoint = (houseId) => {
    if (!hasAccess) {
      toast.error('⛔ Access denied');
      return;
    }
    
    if (!scoringHouseId) {
      toast.error('Please select a scoring house first');
      navigate('/select-targets');
      return;
    }

    const house = houses.find(h => h.id === houseId);
    dispatch(addQuizPoint(houseId));
    toast.success(`+1 quiz point to ${house.name}`, {
      icon: '⭐',
      duration: 1000
    });
  };

  // Loading screen - show this until everything is checked
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in">
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="w-20 h-20 bg-slate-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Verifying Access...</h2>
          <p className="text-slate-400 mb-6 md:mb-8 text-sm md:text-base">
            Please wait while we verify your permissions
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
            <button
              onClick={() => navigate('/buzer')}
              className="px-6 py-3 md:px-8 md:py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
            >
              🔊 Go to Buzzer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no scoring house is selected but we have access
  if (!scoringHouseId && hasAccess) {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in px-4">
        <div className="glass rounded-2xl p-6 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">No House Selected</h2>
          <p className="text-slate-400 mb-6 md:mb-8 text-sm md:text-base">
            Please select targets first
          </p>
          <button
            onClick={() => navigate('/select-targets')}
            className="px-6 py-3 md:px-8 md:py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-base md:text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            🎯 Select Targets
          </button>
        </div>
      </div>
    );
  }

  // Main scoring interface - only show when hasAccess is true
  if (hasAccess && !isLoading) {
    const totalSessionPoints = Object.values(currentQuizPoints).reduce((sum, points) => sum + points, 0);
  return (
    <div className="max-w-7xl mx-auto fade-in px-4">
      {/* Header */}
      <div className="glass rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
            <div className={`w-12 h-12 md:w-16 md:h-16 ${scoringHouse.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
              <img
                src={scoringHouse.icon}
                alt={scoringHouse.name}
                className="w-6 h-6 md:w-10 md:h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 md:mb-2">Quiz Scoring Panel</h1>
              <p className="text-slate-400 text-sm md:text-base">
                <span className={`font-semibold text-${scoringHouse.color}`}>{scoringHouse.name}</span> - Current Quiz Session
              </p>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                Points are temporary until saved to history
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-400 text-xs font-medium">✅ Access Granted - You are the scoring house</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <p className="text-xs md:text-sm text-slate-400">Save Mode</p>
              <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                <button
                  onClick={() => setSaveMode('replace')}
                  className={`px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm font-medium transition-colors ${saveMode === 'replace'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                >
                  Replace
                </button>
                <button
                  onClick={() => setSaveMode('add')}
                  className={`px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm font-medium transition-colors ${saveMode === 'add'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex space-x-2 md:space-x-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  const totalPoints = Object.values(currentQuizPoints).reduce((sum, points) => sum + points, 0);
                  if (totalPoints === 0) {
                    toast.error('No quiz points to save');
                    return;
                  }
                  dispatch(saveCurrentQuizToFirebase(saveMode));
                }}
                disabled={totalSessionPoints === 0}
                className={`flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-200 text-sm md:text-base ${totalSessionPoints === 0
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                  }`}
              >
                {saveMode === 'replace' ? '💾 Save' : '➕ Add'}
              </button>

              <button
                onClick={() => {
                  dispatch(clearCurrentQuiz());
                  toast.success('Current quiz session cleared', {
                    icon: '🗑️',
                    duration: 1500
                  });
                }}
                disabled={totalSessionPoints === 0}
                className={`flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-200 text-sm md:text-base ${totalSessionPoints === 0
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                  }`}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same... */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Scoring House Info */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Your House</h2>
            <div className="text-center p-4 md:p-6 bg-slate-800/50 rounded-xl border-2 border-slate-600">
              <div className={`w-16 h-16 md:w-20 md:h-20 ${scoringHouse.bgColor} rounded-2xl mx-auto mb-3 md:mb-4 flex items-center justify-center shadow-lg`}>
                <img
                  src={scoringHouse.icon}
                  alt={scoringHouse.name}
                  className="w-8 h-8 md:w-12 md:h-12 object-contain"
                />
              </div>
              <h3 className={`text-xl md:text-2xl font-bold text-${scoringHouse.color} mb-2`}>
                {scoringHouse.name}
              </h3>

              <div className="mb-3 md:mb-4">
                <p className="text-slate-400 text-xs md:text-sm">Scoring</p>
                <p className="text-2xl md:text-3xl font-bold text-green-400">{housesToScore.length}</p>
                <p className="text-slate-400 text-xs md:text-sm">houses</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
              <button
                onClick={() => navigate('/select-targets')}
                className="w-full py-2 md:py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors font-medium text-sm md:text-base"
              >
                🎯 Change Targets
              </button>
              <button
                onClick={() => navigate('/buzer')}
                className="w-full py-2 md:py-3 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors font-medium text-sm md:text-base flex items-center justify-center gap-2"
              >
                🔊 Buzzer System
              </button>
            </div>
          </div>
        </div>

        {/* Scoring Interface */}
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-4 md:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 md:mb-6 gap-3 md:gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2">
                  Score Houses ({housesToScore.length})
                </h2>
                <p className="text-slate-400 text-sm md:text-base">
                  Award quiz points for correct answers
                </p>
              </div>

              <div className="text-left lg:text-right">
                <p className="text-xs md:text-sm text-slate-400">Scoring Mode</p>
                <p className="text-blue-400 font-semibold text-sm md:text-base">Quiz Points</p>
              </div>
            </div>

            {housesToScore.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl md:text-4xl">🎯</span>
                </div>
                <p className="text-slate-400 text-base md:text-lg mb-4">No houses selected for scoring</p>
                <button
                  onClick={() => navigate('/select-targets')}
                  className="px-4 py-2 md:px-6 md:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors text-sm md:text-base"
                >
                  Select Houses to Score
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {housesToScore.map(house => (
                  <div key={house.id} className="glass-dark rounded-xl p-3 md:p-5 transition-all duration-200 hover:bg-white/5 border border-slate-600/30 hover:border-slate-500/50">
                    <div className="text-center mb-3 md:mb-4">
                      <div className={`w-12 h-12 md:w-16 md:h-16 ${house.bgColor} rounded-2xl mx-auto mb-2 md:mb-3 flex items-center justify-center shadow-lg`}>
                        <img
                          src={house.icon}
                          alt={house.name}
                          className="w-6 h-6 md:w-10 md:h-10 object-contain"
                        />
                      </div>
                      <h3 className={`text-base md:text-lg font-semibold text-${house.color} mb-1`}>
                        {house.name}
                      </h3>

                      {/* Points Display */}
                      <div className="mb-2 md:mb-3">
                        <p className="text-slate-400 text-xs">This Session</p>
                        <p className="text-xl md:text-2xl font-bold text-blue-400">
                          {currentQuizPoints[house.id] || 0}
                        </p>
                      </div>
                    </div>

                    {/* Scoring Controls */}
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            if (!hasAccess) {
                              toast.error('⛔ Access denied');
                              return;
                            }
                            
                            const houseToScore = houses.find(h => h.id === house.id);
                            const currentPoints = currentQuizPoints[house.id] || 0;

                            if (currentPoints === 0) {
                              toast.error(`${houseToScore.name} has no quiz points to subtract`);
                              return;
                            }

                            dispatch(subtractQuizPoint(house.id));
                            toast.error(`-1 quiz point from ${houseToScore.name}`, {
                              icon: '🔻',
                              duration: 1000
                            });
                          }}
                          disabled={(currentQuizPoints[house.id] || 0) === 0}
                          className={`flex-1 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${(currentQuizPoints[house.id] || 0) === 0
                              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                            }`}
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAddQuizPoint(house.id)}
                          className="flex-1 py-2 md:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base"
                        >
                          +1
                        </button>
                      </div>

                      {/* Quick Add Multiple Points */}
                      <div className="grid grid-cols-3 gap-1">
                        {[2, 3, 5].map(points => (
                          <button
                            key={points}
                            onClick={() => {
                              if (!hasAccess) {
                                toast.error('⛔ Access denied');
                                return;
                              }
                              
                              for (let i = 0; i < points; i++) {
                                setTimeout(() => {
                                  dispatch(addQuizPoint(house.id));
                                }, i * 100);
                              }
                              toast.success(`+${points} quiz points to ${house.name}`, {
                                icon: '⭐',
                                duration: 1500
                              });
                            }}
                            className="py-1 md:py-2 bg-blue-400/20 text-blue-400 border border-blue-400/30 rounded text-xs md:text-sm font-medium hover:bg-blue-400/30 transition-colors"
                          >
                            +{points}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Scoring Summary */}
            {housesToScore.length > 0 && (
              <div className="mt-6 md:mt-8 glass-dark rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Current Session Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                  {housesToScore.map(house => (
                    <div key={house.id} className="flex items-center justify-between p-2 md:p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <div className={`w-6 h-6 md:w-8 md:h-8 ${house.bgColor} rounded-lg flex items-center justify-center`}>
                          <img
                            src={house.icon}
                            alt={house.name}
                            className="w-3 h-3 md:w-4 md:h-4 object-contain"
                          />
                        </div>
                        <span className={`text-${house.color} font-medium text-sm md:text-base`}>{house.name}</span>
                      </div>
                      <span className="text-blue-400 font-bold text-sm md:text-base">{currentQuizPoints[house.id] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
}

export default QuizScoring;