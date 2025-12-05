import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  selectHouses, 
  selectCurrentUser, 
  selectUserRole,
  selectCanCurrentUserScore,
  selectCurrentUserHouse,
  selectScoringControl
} from '../store/slices/quizSlice';
import { firebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

// Import Lucide React icons
import {
  Volume2,
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  RotateCcw,
  PlayCircle,
  Mic2,
  Headphones,
  Award,
  Clock,
  VolumeX,
  History,
  ArrowLeft,
  ChevronRight,
  Zap,
  Star,
  User,
  Home,
  Target,
  Settings,
  Plus,
  Minus,
  AlertTriangle,
  Info,
  Volume1
} from 'lucide-react';

const Buzer = () => {
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const canCurrentUserScore = useSelector(selectCanCurrentUserScore);
  const currentUserHouse = useSelector(selectCurrentUserHouse);
  const scoringControl = useSelector(selectScoringControl);
  
  const [buzerQueue, setBuzerQueue] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [isQuizConductor, setIsQuizConductor] = useState(false);
  const [activeScoringHouse, setActiveScoringHouse] = useState(null);
  const [buzzerSoundEnabled, setBuzzerSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const audioRef = useRef(null);
  const lastProcessedTimestamp = useRef(0);
  const debounceRef = useRef(null);
  const processedBuzzIds = useRef(new Set());
  const hasSoundPlayedThisRound = useRef(false);
  const soundCooldownRef = useRef(false);

  // Get active scoring house
  useEffect(() => {
    setIsLoading(true);
    
    if (scoringControl && scoringControl.status === 'active' && scoringControl.activeHouseId) {
      const scoringHouse = houses.find(h => h.id === scoringControl.activeHouseId);
      if (scoringHouse) {
        setActiveScoringHouse(scoringHouse);
        
        if (currentUserHouse && currentUserHouse.id === scoringHouse.id) {
          setIsQuizConductor(true);
        } else {
          setIsQuizConductor(false);
        }
        
        setIsLoading(false);
      } else {
        toast.error('Scoring house not found. Please check the scoring session.');
        navigate('/leaderboard');
      }
    } else {
      setActiveScoringHouse(null);
      setIsQuizConductor(false);
      setIsLoading(false);
      
      if (scoringControl && scoringControl.status !== 'active') {
        toast.error('No active scoring session. Please wait for a house to start scoring.');
      }
    }
  }, [scoringControl, houses, currentUserHouse, navigate]);

  // Load buzzer sound
  useEffect(() => {
    audioRef.current = new Audio('/audio/alarm.mp3');
    audioRef.current.volume = 0.7;
    
    audioRef.current.addEventListener('playing', () => {
      setTimeout(() => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 2000);
    });
  }, []);

  // Initialize Firebase buzzer listener for currentRound
  useEffect(() => {
    if (!currentUser) return;

    console.log('🎯 Setting up Firebase buzzer listener...');

    const unsubscribeCurrentRound = firebaseService.listenToPath('buzzerEvents/currentRound', (data, metadata) => {
      if (data) {
        console.log('📡 Buzzer currentRound event received:', data);
        
        switch (data.type) {
          case 'BUZZER_START':
            if (isQuizConductor) {
              return;
            }
            setGameActive(true);
            setStartTime(data.startTime || Date.now());
            setBuzerQueue([]);
            processedBuzzIds.current.clear();
            hasSoundPlayedThisRound.current = false;
            soundCooldownRef.current = false;
            toast.info('Buzzer round started! Get ready to buzz!', {
              icon: <Volume2 className="w-4 h-4" />,
              duration: 2000
            });
            break;

          case 'BUZZER_RESET':
            if (isQuizConductor) {
              return;
            }
            setGameActive(false);
            setBuzerQueue([]);
            setStartTime(null);
            processedBuzzIds.current.clear();
            hasSoundPlayedThisRound.current = false;
            soundCooldownRef.current = false;
            toast.info('Buzzer reset for next question', {
              icon: <RotateCcw className="w-4 h-4" />,
              duration: 1500
            });
            break;
        }
      } else {
        setGameActive(false);
        setBuzerQueue([]);
        setStartTime(null);
        processedBuzzIds.current.clear();
        hasSoundPlayedThisRound.current = false;
        soundCooldownRef.current = false;
      }
    }, {
      debug: true,
      errorCallback: (error) => {
        console.error('❌ Buzzer currentRound listener error:', error);
      }
    });

    // Listen for new buzzes
    const unsubscribeBuzzes = firebaseService.listenToPath('buzzerEvents/buzzes', (data, metadata) => {
      debouncedUpdate(data, (debouncedData) => {
        if (debouncedData) {
          console.log('📡 Buzzer buzzes update:', debouncedData);
          
          const buzzesArray = Object.entries(debouncedData).map(([key, value]) => ({
            buzzId: key,
            ...value
          }));
          
          const validBuzzes = buzzesArray.filter(buzz => {
            if (!buzz.houseId || !buzz.houseName) {
              console.log('🚫 Removing invalid buzz (missing house data):', buzz);
              return false;
            }
            
            if (activeScoringHouse && buzz.houseId === activeScoringHouse.id && !isQuizConductor) {
              console.log('🚫 Removing buzz from quiz conductor house:', buzz);
              return false;
            }
            
            if (!buzz.timestamp && !buzz.buzzTime) {
              console.log('🚫 Removing buzz without timestamp:', buzz);
              return false;
            }
            
            return true;
          });
          
          const newBuzzes = validBuzzes.filter(buzz => !processedBuzzIds.current.has(buzz.buzzId));
          
          if (newBuzzes.length === 0 && validBuzzes.length === buzzesArray.length) {
            console.log('⏭️ No new buzzes to process');
            return;
          }
          
          newBuzzes.forEach(buzz => {
            processedBuzzIds.current.add(buzz.buzzId);
          });
          
          const sortedBuzzes = validBuzzes.sort((a, b) => {
            const timeA = a.buzzTime || a.timestamp || 0;
            const timeB = b.buzzTime || b.timestamp || 0;
            return timeA - timeB;
          });
          
          setBuzerQueue(prevQueue => {
            const formattedBuzzes = sortedBuzzes.map((buzz, index) => ({
              buzzId: buzz.buzzId,
              houseId: buzz.houseId,
              houseName: buzz.houseName,
              houseColor: buzz.houseColor,
              houseBgColor: buzz.houseBgColor,
              houseIcon: buzz.houseIcon,
              position: index + 1,
              time: buzz.time || buzz.reactionTime || 0,
              timestamp: buzz.timestamp ? new Date(buzz.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
              userId: buzz.userId,
              buzzTime: buzz.buzzTime || buzz.timestamp
            }));
            
            const genuinelyNewBuzzes = newBuzzes.filter(newBuzz => 
              !prevQueue.some(item => item.buzzId === newBuzz.buzzId)
            );
            
            if (isQuizConductor && buzzerSoundEnabled && genuinelyNewBuzzes.length > 0) {
              if (!soundCooldownRef.current) {
                playBuzerSound(2000);
                hasSoundPlayedThisRound.current = true;
                
                soundCooldownRef.current = true;
                setTimeout(() => {
                  soundCooldownRef.current = false;
                }, 500);
                
                if (genuinelyNewBuzzes.length === 1) {
                  const firstBuzz = genuinelyNewBuzzes[0];
                  const house = houses.find(h => h.id === firstBuzz.houseId) || firstBuzz;
                  toast(`${house.houseName || house.name} buzzed in first!`, {
                    icon: <Trophy className="w-4 h-4" />,
                    duration: 2000
                  });
                } else {
                  toast(`${genuinelyNewBuzzes.length} houses buzzed simultaneously!`, {
                    icon: <AlertCircle className="w-4 h-4" />,
                    duration: 2000
                  });
                }
              }
            }
            
            if (currentUserHouse && !isQuizConductor) {
              const myNewBuzz = genuinelyNewBuzzes.find(buzz => buzz.houseId === currentUserHouse.id);
              if (myNewBuzz) {
                const position = formattedBuzzes.findIndex(b => b.houseId === currentUserHouse.id) + 1;
                toast.success(`You buzzed in ${getPositionText(position)}!`, {
                  icon: <CheckCircle className="w-4 h-4" />,
                  duration: 2000
                });
              }
            }
            
            return formattedBuzzes;
          });
        } else {
          setBuzerQueue([]);
          processedBuzzIds.current.clear();
          hasSoundPlayedThisRound.current = false;
          soundCooldownRef.current = false;
        }
      });
    }, {
      debug: true,
      errorCallback: (error) => {
        console.error('❌ Buzzer buzzes listener error:', error);
      }
    });

    return () => {
      if (unsubscribeCurrentRound) unsubscribeCurrentRound();
      if (unsubscribeBuzzes) unsubscribeBuzzes();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentUser, isQuizConductor, currentUserHouse, activeScoringHouse, buzzerSoundEnabled, houses]);

  // Debounce function
  const debouncedUpdate = (data, callback) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      callback(data);
    }, 50);
  };

  // Get position text (1st, 2nd, 3rd, etc.)
  const getPositionText = (position) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const suffix = position % 100 >= 11 && position % 100 <= 13 
      ? 'th' 
      : suffixes[position] || 'th';
    return `${position}${suffix}`;
  };

  // Play buzzer sound with optional duration
  const playBuzerSound = (duration = 2000) => {
    if (audioRef.current && buzzerSoundEnabled) {
      audioRef.current.currentTime = 0;
      
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      
      setTimeout(() => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, duration);
    }
  };

  // Start a new buzzer round (only quiz conductor can start)
  const startNewRound = async () => {
    if (!isQuizConductor) {
      toast.error('Only the scoring house can start buzzer rounds');
      return;
    }

    if (!activeScoringHouse) {
      toast.error('No active scoring house detected');
      return;
    }

    try {
      console.log('🎬 Starting new buzzer round...');
      
      lastProcessedTimestamp.current = 0;
      processedBuzzIds.current.clear();
      hasSoundPlayedThisRound.current = false;
      soundCooldownRef.current = false;
      
      console.log('Clearing existing buzzes...');
      const clearResult = await firebaseService.writeData('buzzerEvents/buzzes', {});
      console.log('Clear result:', clearResult);
      
      const buzzerEvent = {
        type: 'BUZZER_START',
        startedBy: currentUser?.email || 'unknown',
        startTime: Date.now(),
        scoringHouseId: activeScoringHouse.id,
        scoringHouseName: activeScoringHouse.name,
        timestamp: Date.now(),
        _lastUpdated: Date.now()
      };

      console.log('Broadcasting BUZZER_START event...', buzzerEvent);
      const result = await firebaseService.writeData('buzzerEvents/currentRound', buzzerEvent);
      console.log('Write result:', result);
      
      if (result && result.success) {
        setGameActive(true);
        setStartTime(buzzerEvent.startTime);
        setBuzerQueue([]);
        
        toast.success('Buzzer round started! All houses can now buzz in.', {
          icon: <Volume2 className="w-4 h-4" />,
          duration: 2000
        });
      } else {
        toast.error('Failed to start buzzer round. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Error starting buzzer round:', error);
      toast.error(`Error starting buzzer round: ${error.message || 'Unknown error'}`);
    }
  };

  // Clear all buzzer events (quiz conductor only)
  const clearBuzerEvents = async () => {
    if (!isQuizConductor) {
      toast.error('Only the scoring house can clear buzzer events');
      return;
    }

    try {
      console.log('🧹 Clearing all buzzer events...');
      
      const loadingToast = toast.loading('Clearing buzzer events...');
      
      console.log('Setting buzzes to empty object...');
      const buzzesResult = await firebaseService.writeData('buzzerEvents/buzzes', {});
      console.log('Buzzes clear result:', buzzesResult);
      
      console.log('Setting currentRound to reset state...');
      const currentRoundResult = await firebaseService.writeData('buzzerEvents/currentRound', {
        type: 'BUZZER_RESET',
        resetBy: currentUser?.email || 'system',
        resetTime: Date.now(),
        _lastUpdated: Date.now()
      });
      console.log('CurrentRound clear result:', currentRoundResult);
      
      if (!buzzesResult || !buzzesResult.success) {
        console.log('Trying alternative clear method...');
        try {
          if (firebaseService.removeData) {
            await firebaseService.removeData('buzzerEvents/buzzes');
          }
        } catch (error) {
          console.log('Alternative method failed:', error);
        }
      }
      
      lastProcessedTimestamp.current = 0;
      processedBuzzIds.current.clear();
      hasSoundPlayedThisRound.current = false;
      soundCooldownRef.current = false;
      
      setBuzerQueue([]);
      setGameActive(false);
      setStartTime(null);
      
      toast.dismiss(loadingToast);
      toast.success('All buzzer events cleared', {
        icon: <RotateCcw className="w-4 h-4" />,
        duration: 1500
      });
      
      console.log('✅ Buzzer events cleared successfully');
      
    } catch (error) {
      console.error('❌ Error clearing buzzer events:', error);
      toast.error(`Clear failed: ${error.message || 'Check console for details'}`);
    }
  };

  // Handle buzzer click - for participating houses only (not quiz conductor)
  const handleBuzerClick = async () => {
    if (!gameActive) {
      toast.error('Buzzer round has not started yet!');
      return;
    }

    if (isQuizConductor) {
      toast.error('You are the quiz conductor - you control the buzzer!');
      return;
    }

    if (!currentUserHouse) {
      toast.error('You need to be logged into a house to buzz!');
      return;
    }

    if (!activeScoringHouse) {
      toast.error('No active scoring session. Please wait for a house to start scoring.');
      return;
    }

    if (buzerQueue.some(item => item.houseId === currentUserHouse.id)) {
      toast.error(`You have already buzzed in!`);
      return;
    }

    const buzzTime = Date.now();
    const timeDiff = startTime ? (buzzTime - startTime) : 0;

    try {
      const buzzerClickEvent = {
        type: 'BUZZER_CLICK',
        houseId: currentUserHouse.id,
        houseName: currentUserHouse.name,
        houseColor: currentUserHouse.color,
        houseBgColor: currentUserHouse.bgColor,
        houseIcon: currentUserHouse.icon,
        time: timeDiff,
        timestamp: new Date(buzzTime).toISOString(),
        userId: currentUser?.uid || 'unknown',
        userEmail: currentUser?.email || 'unknown',
        reactionTime: timeDiff,
        buzzTime: buzzTime,
        _lastUpdated: Date.now()
      };

      const buzzId = `${buzzTime}_${currentUserHouse.id}`;
      console.log('Registering buzz:', buzzerClickEvent);
      const result = await firebaseService.updateData(`buzzerEvents/buzzes/${buzzId}`, buzzerClickEvent);
      console.log('Buzz registration result:', result);
      
      if (result && result.success) {
        const participatingHouses = houses.filter(h => h.id !== activeScoringHouse.id);
        if (buzerQueue.length + 1 === participatingHouses.length) {
          setTimeout(() => {
            toast('All participating houses have buzzed! Round completed.', {
              icon: <CheckCircle className="w-4 h-4" />,
              duration: 4000
            });
          }, 500);
        }
      } else {
        toast.error('Failed to register buzz. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Error handling buzzer click:', error);
      toast.error(`Error buzzing in: ${error.message || 'Unknown error'}`);
    }
  };

  // Format time in milliseconds to seconds with 2 decimals
  const formatTime = (ms) => {
    return (ms / 1000).toFixed(2);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in px-4 py-12">
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="w-20 h-20 bg-slate-700 rounded-2xl mx-auto mb-6 flex items-center justify-center animate-pulse">
            <Clock className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Loading Buzzer...</h2>
          <p className="text-slate-400 mb-6 md:mb-8 text-sm md:text-base">
            Please wait while we set up the buzzer system
          </p>
        </div>
      </div>
    );
  }

  // If user is not from any house (shouldn't happen)
  if (!currentUserHouse && userRole !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in px-4 py-12">
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="w-20 h-20 bg-slate-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Home className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">House Not Detected</h2>
          <p className="text-slate-400 mb-6 md:mb-8 text-sm md:text-base">
            Your account is not associated with any house
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 md:px-8 md:py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
          >
            <Settings className="w-5 h-5" />
            Re-login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto fade-in px-4 py-8">
      {/* Header */}
      <div className="glass rounded-2xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 ${isQuizConductor && activeScoringHouse ? activeScoringHouse.bgColor : currentUserHouse ? currentUserHouse.bgColor : 'bg-slate-700'} rounded-2xl flex items-center justify-center shadow-lg`}>
              <img 
                src={isQuizConductor && activeScoringHouse ? activeScoringHouse.icon : currentUserHouse ? currentUserHouse.icon : ''} 
                alt={isQuizConductor && activeScoringHouse ? activeScoringHouse.name : currentUserHouse ? currentUserHouse.name : 'House'}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {isQuizConductor ? 'Quiz Conductor Console' : 'Buzzer System'}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400">
                  {isQuizConductor && activeScoringHouse
                    ? `You are conducting the quiz for ${activeScoringHouse.name}`
                    : currentUserHouse
                    ? `You are participating as ${currentUserHouse.name}`
                    : 'Waiting for scoring session...'
                  }
                </span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${gameActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={`text-sm ${gameActive ? 'text-green-400' : 'text-red-400'}`}>
                    {gameActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {isQuizConductor ? (
              <>
                <button
                  onClick={startNewRound}
                  disabled={gameActive || !activeScoringHouse}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 ${
                    gameActive || !activeScoringHouse
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-xl'
                  }`}
                >
                  <PlayCircle className="w-5 h-5" />
                  Start Buzzer Round
                </button>
                <button
                  onClick={clearBuzerEvents}
                  disabled={!activeScoringHouse}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 ${
                    !activeScoringHouse
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600 text-white hover:shadow-xl'
                  }`}
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </>
            ) : (
              <button
                onClick={handleBuzerClick}
                disabled={!gameActive || !currentUserHouse || buzerQueue.some(item => item.houseId === currentUserHouse.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg text-lg flex items-center gap-2 ${
                  gameActive && currentUserHouse && !buzerQueue.some(item => item.houseId === currentUserHouse.id)
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                {!currentUserHouse ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    No House Detected
                  </>
                ) : buzerQueue.some(item => item.houseId === currentUserHouse.id) ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Already Buzzed
                  </>
                ) : gameActive ? (
                  <>
                    <Bell className="w-5 h-5" />
                    BUZZ IN!
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    Waiting for round...
                  </>
                )}
              </button>
            )}
            
            {/* Conditional navigation button */}
            {isQuizConductor ? (
              <button
                onClick={() => navigate('/quiz-scoring')}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Scoring
              </button>
            ) : (
              <button
                onClick={() => navigate('/quiz-history')}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <History className="w-5 h-5" />
                Quiz History
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400 text-sm mb-1">Active Scoring House</div>
            <div className="flex items-center gap-2">
              {activeScoringHouse ? (
                <>
                  <div className={`w-3 h-3 rounded-full ${activeScoringHouse.color === 'green' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`}></div>
                  <span className={`text-lg font-bold text-${activeScoringHouse.color}`}>
                    {activeScoringHouse.name}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  No active scoring house
                </span>
              )}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400 text-sm mb-1">Buzzer Status</div>
            <div className="text-lg font-bold text-white">
              {gameActive ? `Round Active - ${buzerQueue.length} buzzes` : 'Ready to Start'}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400 text-sm mb-1">Your Role</div>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              {isQuizConductor ? (
                <>
                  <Mic2 className="w-5 h-5" />
                  Quiz Conductor
                </>
              ) : (
                <>
                  <Headphones className="w-5 h-5" />
                  Participant
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Warning message if no active scoring session */}
        {!activeScoringHouse && (
          <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-1">No Active Scoring Session</h3>
                <p className="text-yellow-300 text-sm">
                  Wait for a house to start scoring. The buzzer will be available once a scoring session is active.
                  {isQuizConductor && ' You can start a scoring session from the leaderboard.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Buzzer Queue Display */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Buzzer Queue</h2>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">
                  {buzerQueue.length} house{buzerQueue.length !== 1 ? 's' : ''} buzzed
                </span>
                {isQuizConductor && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={buzzerSoundEnabled}
                        onChange={(e) => setBuzzerSoundEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-400 text-sm">Sound</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {buzerQueue.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-slate-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  {gameActive ? (
                    <Volume2 className="w-12 h-12 text-slate-400" />
                  ) : (
                    <VolumeX className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <p className="text-slate-400 text-lg mb-2">
                  {gameActive ? 'No buzzes yet...' : 'Buzzer round not started'}
                </p>
                <p className="text-slate-500 text-sm">
                  {isQuizConductor 
                    ? gameActive 
                      ? 'Wait for houses to buzz in!' 
                      : 'Start a round to begin accepting buzzes'
                    : gameActive 
                      ? 'Be the first to buzz in!' 
                      : 'Wait for the quiz conductor to start a round'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {buzerQueue.map((entry, index) => {
                  const house = houses.find(h => h.id === entry.houseId) || entry;
                  const positionColors = [
                    'bg-yellow-500/20 border-yellow-500/40',
                    'bg-slate-700/50 border-slate-600/40',
                    'bg-amber-800/30 border-amber-700/40',
                    'bg-slate-800/40 border-slate-700/40'
                  ];
                  
                  const positionIcons = [
                    <Trophy className="w-8 h-8" key="1st" />,
                    <Award className="w-8 h-8" key="2nd" />,
                    <Star className="w-8 h-8" key="3rd" />,
                    <div key="4th" className="text-3xl font-bold">4️⃣</div>
                  ];
                  
                  return (
                    <div 
                      key={`${entry.buzzId || entry.houseId}_${entry.buzzTime || entry.timestamp}`} 
                      className={`p-4 rounded-xl border-2 ${positionColors[index] || 'bg-slate-700/30 border-slate-600/30'} transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl font-bold">
                            {positionIcons[index] || `#${entry.position}`}
                          </div>
                          <div className={`w-12 h-12 ${house.houseBgColor || house.bgColor} rounded-xl flex items-center justify-center shadow-lg`}>
                            <img 
                              src={house.houseIcon || house.icon} 
                              alt={house.houseName || house.name}
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                          <div>
                            <h3 className={`text-xl font-bold text-${house.houseColor || house.color}`}>
                              {house.houseName || house.name}
                            </h3>
                            <p className="text-slate-400 text-sm">Buzzed at: {entry.timestamp}</p>
                            <p className="text-slate-500 text-xs">Reaction: {formatTime(entry.time)}s</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">
                            {getPositionText(entry.position).toUpperCase()}
                          </div>
                          <div className="text-slate-400 text-sm">Position</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Controls/Info Panel */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
              {isQuizConductor ? 'Quiz Conductor Controls' : 'Your Buzzer'}
            </h2>
            
            {isQuizConductor ? (
              <>
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Mic2 className="w-5 h-5" />
                      Quiz Conductor
                    </h3>
                    <p className="text-slate-300 text-sm">
                      You control the buzzer. The buzzer sound will play on YOUR device when houses buzz.
                      A sound will play for the first buzz or when multiple houses buzz simultaneously.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-700/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-2">Current Round</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Status:</span>
                        <span className={`flex items-center gap-2 ${gameActive ? 'text-green-400 font-bold' : 'text-red-400'}`}>
                          {gameActive ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              ACTIVE
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              INACTIVE
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Buzzes:</span>
                        <span className="text-white">{buzerQueue.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Sound:</span>
                        <span className={`flex items-center gap-2 ${buzzerSoundEnabled ? 'text-green-400' : 'text-red-400'}`}>
                          {buzzerSoundEnabled ? (
                            <>
                              <Volume2 className="w-4 h-4" />
                              ENABLED
                            </>
                          ) : (
                            <>
                              <VolumeX className="w-4 h-4" />
                              DISABLED
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div className="text-center">
                    <div className={`w-32 h-32 ${currentUserHouse ? currentUserHouse.bgColor : 'bg-slate-700'} rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg`}>
                      <img 
                        src={currentUserHouse ? currentUserHouse.icon : ''} 
                        alt={currentUserHouse ? currentUserHouse.name : 'House'}
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    
                    <h3 className={`text-3xl font-bold text-${currentUserHouse ? currentUserHouse.color : 'white'} mb-4`}>
                      {currentUserHouse ? currentUserHouse.name : 'No House'}
                    </h3>
                    
                    <div className="mb-6">
                      <p className="text-slate-400 mb-2">Current Status</p>
                      <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                        currentUserHouse && buzerQueue.some(item => item.houseId === currentUserHouse.id) 
                          ? 'text-green-400'
                          : gameActive 
                            ? 'text-yellow-400' 
                            : 'text-slate-400'
                      }`}>
                        {!currentUserHouse ? (
                          <>
                            <XCircle className="w-6 h-6" />
                            NO HOUSE DETECTED
                          </>
                        ) : buzerQueue.some(item => item.houseId === currentUserHouse.id) ? (
                          <>
                            <CheckCircle className="w-6 h-6" />
                            BUZZED IN!
                          </>
                        ) : gameActive ? (
                          <>
                            <Zap className="w-6 h-6" />
                            READY TO BUZZ!
                          </>
                        ) : (
                          <>
                            <Clock className="w-6 h-6" />
                            WAITING FOR ROUND
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Buzzer Position Info */}
                  {currentUserHouse && buzerQueue.some(item => item.houseId === currentUserHouse.id) && (
                    <div className="bg-linear-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 mb-6">
                      <div className="text-5xl mb-3 flex justify-center">
                        {(() => {
                          const position = buzerQueue.findIndex(item => item.houseId === currentUserHouse.id) + 1;
                          switch(position) {
                            case 1: return <Trophy className="w-12 h-12" />;
                            case 2: return <Award className="w-12 h-12" />;
                            case 3: return <Star className="w-12 h-12" />;
                            default: return <div className="text-5xl">{position}️⃣</div>;
                          }
                        })()}
                      </div>
                      <h4 className="text-2xl font-bold text-green-400 mb-2 text-center">
                        You buzzed {getPositionText(buzerQueue.findIndex(item => item.houseId === currentUserHouse.id) + 1)}!
                      </h4>
                      <p className="text-slate-300 text-center">
                        Reaction time: <span className="text-yellow-400 font-bold">
                          {formatTime(buzerQueue.find(item => item.houseId === currentUserHouse.id).time)} seconds
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleBuzerClick}
                  disabled={!gameActive || !currentUserHouse || buzerQueue.some(item => item.houseId === currentUserHouse.id)}
                  className={`w-full py-4 rounded-xl font-semibold transition-all text-2xl shadow-lg mb-4 flex items-center justify-center gap-2 ${
                    !gameActive || !currentUserHouse || buzerQueue.some(item => item.houseId === currentUserHouse.id)
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {!currentUserHouse ? (
                    <>
                      <XCircle className="w-6 h-6" />
                      NO HOUSE DETECTED
                    </>
                  ) : buzerQueue.some(item => item.houseId === currentUserHouse.id) ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      ALREADY BUZZED
                    </>
                  ) : (
                    <>
                      <Bell className="w-6 h-6" />
                      BUZZ IN!
                    </>
                  )}
                </button>
              </>
            )}

            {/* Instructions */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                How It Works
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                {isQuizConductor ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">①</span>
                      <span>Click "Start Buzzer Round" when asking a question</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">②</span>
                      <span>Buzzer sound will play on YOUR device for the first buzz or simultaneous buzzes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">③</span>
                      <span>Click "Reset" after each question</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">④</span>
                      <span>Watch the queue to see which house buzzed first</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400">①</span>
                      <span>Wait for {activeScoringHouse?.name || 'the scoring house'} to start a round</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">②</span>
                      <span>Click BUZZ IN! when you know the answer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">③</span>
                      <span>First to buzz gets priority to answer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">④</span>
                      <span>The buzzer sound plays on {activeScoringHouse?.name || 'the scoring house'}'s device</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Buzer;