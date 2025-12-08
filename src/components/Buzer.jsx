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

    const unsubscribeCurrentRound = firebaseService.listenToPath('buzzerEvents/currentRound', (data, metadata) => {
      if (data) {
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
      errorCallback: (error) => {
        console.error('Buzzer currentRound listener error:', error);
      }
    });

    // Listen for new buzzes
    const unsubscribeBuzzes = firebaseService.listenToPath('buzzerEvents/buzzes', (data, metadata) => {
      debouncedUpdate(data, (debouncedData) => {
        if (debouncedData) {
          const buzzesArray = Object.entries(debouncedData).map(([key, value]) => ({
            buzzId: key,
            ...value
          }));
          
          const validBuzzes = buzzesArray.filter(buzz => {
            if (!buzz.houseId || !buzz.houseName) {
              return false;
            }
            
            if (activeScoringHouse && buzz.houseId === activeScoringHouse.id && !isQuizConductor) {
              return false;
            }
            
            if (!buzz.timestamp && !buzz.buzzTime) {
              return false;
            }
            
            return true;
          });
          
          const newBuzzes = validBuzzes.filter(buzz => !processedBuzzIds.current.has(buzz.buzzId));
          
          if (newBuzzes.length === 0 && validBuzzes.length === buzzesArray.length) {
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
      errorCallback: (error) => {
        console.error('Buzzer buzzes listener error:', error);
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
      lastProcessedTimestamp.current = 0;
      processedBuzzIds.current.clear();
      hasSoundPlayedThisRound.current = false;
      soundCooldownRef.current = false;
      
      await firebaseService.writeData('buzzerEvents/buzzes', {});
      
      const buzzerEvent = {
        type: 'BUZZER_START',
        startedBy: currentUser?.email || 'unknown',
        startTime: Date.now(),
        scoringHouseId: activeScoringHouse.id,
        scoringHouseName: activeScoringHouse.name,
        timestamp: Date.now(),
        _lastUpdated: Date.now()
      };

      const result = await firebaseService.writeData('buzzerEvents/currentRound', buzzerEvent);
      
      if (result && result.success) {
        setGameActive(true);
        setStartTime(buzzerEvent.startTime);
        setBuzerQueue([]);
        
        toast.success('Buzzer round started! All houses can now buzz in.', {
          icon: <Volume2 className="w-4 h-4" />,
          duration: 2000
        });
      } else {
        toast.error('Failed to start buzzer round.');
      }
    } catch (error) {
      console.error('Error starting buzzer round:', error);
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
      const loadingToast = toast.loading('Clearing buzzer events...');
      
      await firebaseService.writeData('buzzerEvents/buzzes', {});
      
      await firebaseService.writeData('buzzerEvents/currentRound', {
        type: 'BUZZER_RESET',
        resetBy: currentUser?.email || 'system',
        resetTime: Date.now(),
        _lastUpdated: Date.now()
      });
      
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
      
    } catch (error) {
      console.error('Error clearing buzzer events:', error);
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
      const result = await firebaseService.updateData(`buzzerEvents/buzzes/${buzzId}`, buzzerClickEvent);
      
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
        toast.error('Failed to register buzz.');
      }
    } catch (error) {
      console.error('Error handling buzzer click:', error);
      toast.error(`Error buzzing in: ${error.message || 'Unknown error'}`);
    }
  };

  // Format time in milliseconds to minutes, seconds, and milliseconds
  const formatTime = (ms) => {
    if (!ms || ms === 0) return '0.00s';
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000));
    
    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}s`;
    } else if (seconds > 0) {
      return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
    } else {
      return `0.${milliseconds.toString().padStart(3, '0')}s`;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in px-3 sm:px-4">
        <div className="glass rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-700 rounded-xl sm:rounded-2xl mx-auto mb-4 sm:mb-6 flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">Loading Buzzer...</h2>
          <p className="text-slate-400 mb-5 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base">
            Please wait while we set up the buzzer system
          </p>
        </div>
      </div>
    );
  }

  // If user is not from any house (shouldn't happen)
  if (!currentUserHouse && userRole !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in px-3 sm:px-4">
        <div className="glass rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-700 rounded-xl sm:rounded-2xl mx-auto mb-4 sm:mb-6 flex items-center justify-center">
            <Home className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">House Not Detected</h2>
          <p className="text-slate-400 mb-5 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base">
            Your account is not associated with any house
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto text-sm sm:text-base"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            Re-login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto fade-in px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${isQuizConductor && activeScoringHouse ? activeScoringHouse.bgColor : currentUserHouse ? currentUserHouse.bgColor : 'bg-slate-700'} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0`}>
              <img 
                src={isQuizConductor && activeScoringHouse ? activeScoringHouse.icon : currentUserHouse ? currentUserHouse.icon : ''} 
                alt={isQuizConductor && activeScoringHouse ? activeScoringHouse.name : currentUserHouse ? currentUserHouse.name : 'House'}
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                {isQuizConductor ? 'Quiz Conductor Console' : 'Buzzer System'}
              </h1>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="text-slate-400 text-sm sm:text-base">
                  {isQuizConductor && activeScoringHouse
                    ? `You are conducting the quiz for ${activeScoringHouse.name}`
                    : currentUserHouse
                    ? `You are participating as ${currentUserHouse.name}`
                    : 'Waiting for scoring session...'
                  }
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className={`w-2 h-2 rounded-full ${gameActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={`text-xs sm:text-sm ${gameActive ? 'text-green-400' : 'text-red-400'}`}>
                    {gameActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
            {isQuizConductor ? (
              <>
                <button
                  onClick={startNewRound}
                  disabled={gameActive || !activeScoringHouse}
                  className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base flex-1 lg:flex-none ${
                    gameActive || !activeScoringHouse
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-xl'
                  }`}
                >
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Start Buzzer Round
                </button>
                <button
                  onClick={clearBuzerEvents}
                  disabled={!activeScoringHouse}
                  className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base flex-1 lg:flex-none ${
                    !activeScoringHouse
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600 text-white hover:shadow-xl'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  Reset
                </button>
              </>
            ) : (
              <button
                onClick={handleBuzerClick}
                disabled={!gameActive || !currentUserHouse || buzerQueue.some(item => item.houseId === currentUserHouse.id)}
                className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-sm sm:text-base md:text-lg flex items-center gap-1 sm:gap-2 flex-1 lg:flex-none ${
                  gameActive && currentUserHouse && !buzerQueue.some(item => item.houseId === currentUserHouse.id)
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                {!currentUserHouse ? (
                  <>
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">No House Detected</span>
                  </>
                ) : buzerQueue.some(item => item.houseId === currentUserHouse.id) ? (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">Already Buzzed</span>
                  </>
                ) : gameActive ? (
                  <>
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">BUZZ IN!</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="truncate">Waiting for round...</span>
                  </>
                )}
              </button>
            )}
            
            {/* Conditional navigation button */}
            {isQuizConductor ? (
              <button
                onClick={() => navigate('/quiz-scoring')}
                className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-1 sm:gap-2 text-sm sm:text-base flex-1 lg:flex-none"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">Back to Scoring</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/quiz-history')}
                className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-1 sm:gap-2 text-sm sm:text-base flex-1 lg:flex-none"
              >
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">Quiz History</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3">
            <div className="text-slate-400 text-xs sm:text-sm mb-1">Active Scoring House</div>
            <div className="flex items-center gap-1 sm:gap-2">
              {activeScoringHouse ? (
                <>
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${activeScoringHouse.color === 'green' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`}></div>
                  <span className={`text-sm sm:text-lg font-bold text-${activeScoringHouse.color}`}>
                    {activeScoringHouse.name}
                  </span>
                </>
              ) : (
                <span className="text-sm sm:text-lg font-bold text-yellow-400 flex items-center gap-1 sm:gap-2">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                  No active scoring house
                </span>
              )}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3">
            <div className="text-slate-400 text-xs sm:text-sm mb-1">Buzzer Status</div>
            <div className="text-sm sm:text-lg font-bold text-white">
              {gameActive ? `Round Active - ${buzerQueue.length} buzzes` : 'Ready to Start'}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3">
            <div className="text-slate-400 text-xs sm:text-sm mb-1">Your Role</div>
            <div className="text-sm sm:text-lg font-bold text-white flex items-center gap-1 sm:gap-2">
              {isQuizConductor ? (
                <>
                  <Mic2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Quiz Conductor
                </>
              ) : (
                <>
                  <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
                  Participant
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Warning message if no active scoring session */}
        {!activeScoringHouse && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg sm:rounded-xl">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 shrink-0" />
              <div>
                <h3 className="text-sm sm:text-lg font-bold text-yellow-400 mb-1">No Active Scoring Session</h3>
                <p className="text-yellow-300 text-xs sm:text-sm">
                  Wait for a house to start scoring. The buzzer will be available once a scoring session is active.
                  {isQuizConductor && ' You can start a scoring session from the leaderboard.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Buzzer Queue Display */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Buzzer Queue</h2>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-slate-400 text-sm sm:text-base">
                  {buzerQueue.length} house{buzerQueue.length !== 1 ? 's' : ''} buzzed
                </span>
                {isQuizConductor && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <label className="flex items-center gap-1 sm:gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={buzzerSoundEnabled}
                        onChange={(e) => setBuzzerSoundEnabled(e.target.checked)}
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                      <span className="text-slate-400 text-xs sm:text-sm">Sound</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {buzerQueue.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-slate-700 rounded-xl sm:rounded-2xl mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                  {gameActive ? (
                    <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-slate-400" />
                  ) : (
                    <VolumeX className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-slate-400" />
                  )}
                </div>
                <p className="text-slate-400 text-base sm:text-lg md:text-xl mb-2">
                  {gameActive ? 'No buzzes yet...' : 'Buzzer round not started'}
                </p>
                <p className="text-slate-500 text-xs sm:text-sm md:text-base">
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
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {buzerQueue.map((entry, index) => {
                  const house = houses.find(h => h.id === entry.houseId) || entry;
                  const positionColors = [
                    'bg-yellow-500/20 border-yellow-500/40',
                    'bg-slate-700/50 border-slate-600/40',
                    'bg-amber-800/30 border-amber-700/40',
                    'bg-slate-800/40 border-slate-700/40'
                  ];
                  
                  const positionIcons = [
                    <Trophy className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" key="1st" />,
                    <Award className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" key="2nd" />,
                    <Star className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" key="3rd" />,
                    <div key="4th" className="text-xl sm:text-2xl md:text-3xl font-bold">4️⃣</div>
                  ];
                  
                  return (
                    <div 
                      key={`${entry.buzzId || entry.houseId}_${entry.buzzTime || entry.timestamp}`} 
                      className={`p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 ${positionColors[index] || 'bg-slate-700/30 border-slate-600/30'} transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                            {positionIcons[index] || `#${entry.position}`}
                          </div>
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${house.houseBgColor || house.bgColor} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg`}>
                            <img 
                              src={house.houseIcon || house.icon} 
                              alt={house.houseName || house.name}
                              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain"
                            />
                          </div>
                          <div>
                            <h3 className={`text-base sm:text-lg md:text-xl font-bold text-${house.houseColor || house.color}`}>
                              {house.houseName || house.name}
                            </h3>
                            <p className="text-slate-400 text-xs sm:text-sm">Buzzed at: {entry.timestamp}</p>
                            <p className="text-slate-500 text-xs">Reaction: {formatTime(entry.time)}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                            {getPositionText(entry.position).toUpperCase()}
                          </div>
                          <div className="text-slate-400 text-xs sm:text-sm">Position</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Controls/Info Panel - With large buzz button */}
        <div className="lg:col-span-1">
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 h-full flex flex-col">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6">
              {isQuizConductor ? 'Quiz Conductor Controls' : 'Your Buzzer'}
            </h2>
            
            {isQuizConductor ? (
              <>
                <div className="space-y-3 sm:space-y-4 mb-6">
                  <div className="p-3 sm:p-4 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-lg sm:rounded-xl border border-blue-500/30">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 flex items-center gap-1 sm:gap-2">
                      <Mic2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      Quiz Conductor
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm">
                      You control the buzzer. The buzzer sound will play on YOUR device when houses buzz.
                      A sound will play for the first buzz or when multiple houses buzz simultaneously.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-slate-700/50 rounded-lg sm:rounded-xl">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Current Round</h3>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs sm:text-sm">Status:</span>
                        <span className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${gameActive ? 'text-green-400 font-bold' : 'text-red-400'}`}>
                          {gameActive ? (
                            <>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                              ACTIVE
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                              INACTIVE
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs sm:text-sm">Buzzes:</span>
                        <span className="text-white text-xs sm:text-sm">{buzerQueue.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs sm:text-sm">Sound:</span>
                        <span className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${buzzerSoundEnabled ? 'text-green-400' : 'text-red-400'}`}>
                          {buzzerSoundEnabled ? (
                            <>
                              <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              ENABLED
                            </>
                          ) : (
                            <>
                              <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
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
                <div className="space-y-4 mb-4 sm:mb-6 grow">
                  <div className="text-center">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ${currentUserHouse ? currentUserHouse.bgColor : 'bg-slate-700'} rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-lg`}>
                      <img 
                        src={currentUserHouse ? currentUserHouse.icon : ''} 
                        alt={currentUserHouse ? currentUserHouse.name : 'House'}
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain"
                      />
                    </div>
                    
                    <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold text-${currentUserHouse ? currentUserHouse.color : 'white'} mb-2 sm:mb-3`}>
                      {currentUserHouse ? currentUserHouse.name : 'No House'}
                    </h3>
                    
                    <div className="mb-3 sm:mb-4">
                      <p className="text-slate-400 text-xs sm:text-sm mb-1">Current Status</p>
                      <div className={`text-base sm:text-lg md:text-xl font-bold flex flex-col items-center justify-center gap-1 ${
                        currentUserHouse && buzerQueue.some(item => item.houseId === currentUserHouse.id) 
                          ? 'text-green-400'
                          : gameActive 
                            ? 'text-yellow-400' 
                            : 'text-slate-400'
                      }`}>
                        {!currentUserHouse ? (
                          <>
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            <span>NO HOUSE DETECTED</span>
                          </>
                        ) : buzerQueue.some(item => item.houseId === currentUserHouse.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            <span>BUZZED IN!</span>
                          </>
                        ) : gameActive ? (
                          <>
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            <span>READY TO BUZZ!</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            <span>WAITING FOR ROUND</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Buzzer Position Info */}
                  {currentUserHouse && buzerQueue.some(item => item.houseId === currentUserHouse.id) && (
                    <div className="bg-linear-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
                      <div className="text-2xl sm:text-3xl md:text-4xl mb-2 flex justify-center">
                        {(() => {
                          const position = buzerQueue.findIndex(item => item.houseId === currentUserHouse.id) + 1;
                          switch(position) {
                            case 1: return <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />;
                            case 2: return <Award className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />;
                            case 3: return <Star className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />;
                            default: return <div className="text-2xl sm:text-3xl md:text-4xl">{position}️⃣</div>;
                          }
                        })()}
                      </div>
                      <h4 className="text-base sm:text-lg md:text-xl font-bold text-green-400 mb-1 sm:mb-2 text-center">
                        You buzzed {getPositionText(buzerQueue.findIndex(item => item.houseId === currentUserHouse.id) + 1)}!
                      </h4>
                      <p className="text-slate-300 text-xs sm:text-sm text-center">
                        Reaction time: <span className="text-yellow-400 font-bold">
                          {formatTime(buzerQueue.find(item => item.houseId === currentUserHouse.id).time)}
                        </span>
                      </p>
                    </div>
                  )}
                  
                  {/* LARGE BUZZ IN! Button */}
                  <button
                    onClick={handleBuzerClick}
                    disabled={!gameActive || !currentUserHouse || buzerQueue.some(item => item.houseId === currentUserHouse.id)}
                    className={`w-full py-4 sm:py-5 md:py-6 rounded-xl font-semibold transition-all text-xl sm:text-2xl md:text-3xl shadow-lg mb-4 flex items-center justify-center gap-2 grow min-h-[100px] sm:min-h-[120px] md:min-h-[140px] ${
                      !gameActive || !currentUserHouse || buzerQueue.some(item => item.houseId === currentUserHouse.id)
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white hover:shadow-xl transform hover:scale-105 active:scale-95'
                    }`}
                  >
                    {!currentUserHouse ? (
                      <>
                        <XCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                        <span>NO HOUSE DETECTED</span>
                      </>
                    ) : buzerQueue.some(item => item.houseId === currentUserHouse.id) ? (
                      <>
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                        <span>ALREADY BUZZED</span>
                      </>
                    ) : gameActive ? (
                      <>
                        <Bell className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 animate-pulse" />
                        <span>BUZZ IN!</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                        <span>WAITING</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Instructions */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-700">
              <h3 className="text-sm sm:text-base font-semibold text-white mb-2 flex items-center gap-1 sm:gap-2">
                <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                How It Works
              </h3>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-400">
                {isQuizConductor ? (
                  <>
                    <li className="flex items-start gap-1">
                      <span className="text-green-400">①</span>
                      <span>Click "Start Buzzer Round" when asking a question</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-blue-400">②</span>
                      <span>Buzzer sound will play on YOUR device for the first buzz or simultaneous buzzes</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-red-400">③</span>
                      <span>Click "Reset" after each question</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-purple-400">④</span>
                      <span>Watch the queue to see which house buzzed first</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-1">
                      <span className="text-yellow-400">①</span>
                      <span>Wait for {activeScoringHouse?.name || 'the scoring house'} to start a round</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-green-400">②</span>
                      <span>Click BUZZ IN! when you know the answer</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-blue-400">③</span>
                      <span>First to buzz gets priority to answer</span>
                    </li>
                    <li className="flex items-start gap-1">
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