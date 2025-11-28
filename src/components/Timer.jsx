import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  startTimer, 
  pauseTimer, 
  resetTimer, 
  updateTimer, 
  setTimer,
  selectTimer 
} from '../store/slices/quizSlice';

const Timer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const timer = useSelector(selectTimer);
  const [customTime, setCustomTime] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [localTime, setLocalTime] = useState(0); // Local state for display

  // Sync local time with Redux timer
  useEffect(() => {
    setLocalTime(timer.time);
  }, [timer.time]);

  // Reset everything when component mounts
  useEffect(() => {
    dispatch(resetTimer());
    setIsRedirecting(false);
    setInitialTime(0);
    setCustomTime(0);
  }, [dispatch]);

  useEffect(() => {
    let interval;
    
    if (timer.isRunning && timer.time > 0) {
      interval = setInterval(() => {
        dispatch(updateTimer());
      }, 1000);
    } else if (timer.isRunning && timer.time === 0) {
      // Timer finished
      dispatch(pauseTimer());
      setIsRedirecting(true);
      
      // Navigate to quiz scoring when timer reaches zero
      setTimeout(() => {
        dispatch(resetTimer());
        setIsRedirecting(false);
        setInitialTime(0);
        navigate('/quiz-scoring');
      }, 1500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.time, dispatch, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartPause = () => {
    // If timer is at 0 and we have an initial time, reset it first
    if (timer.time === 0 && initialTime > 0) {
      dispatch(setTimer(initialTime));
    }
    
    if (timer.isRunning) {
      dispatch(pauseTimer());
    } else {
      // Only start if we have time set
      if (timer.time > 0) {
        dispatch(startTimer());
      } else if (initialTime > 0) {
        // If no current time but we have initial time, set it and start
        dispatch(setTimer(initialTime));
        dispatch(startTimer());
      }
    }
  };

  const handleReset = () => {
    dispatch(resetTimer());
    setInitialTime(0);
    setCustomTime(0);
    setIsRedirecting(false);
  };

  const handleSetCustomTime = () => {
    if (customTime > 0) {
      dispatch(setTimer(customTime));
      setInitialTime(customTime);
      setCustomTime(0);
      setIsRedirecting(false);
    }
  };

  const handleQuickTimeSet = (time) => {
    if (time > 0) {
      dispatch(setTimer(time));
      setInitialTime(time);
      setIsRedirecting(false);
    }
  };

  const quickTimeButtons = [60, 120, 180, 240, 300]; // 1m, 2m, 3m, 4m, 5m

  // Get status text based on current state
  const getStatusText = () => {
    if (isRedirecting) {
      return "Time's Up! Redirecting...";
    }
    if (timer.isRunning) {
      return 'Countdown Running';
    }
    if (timer.time === 0 && initialTime > 0) {
      return 'Timer Finished - Click Start to Restart';
    }
    if (timer.time > 0 && !timer.isRunning) {
      return 'Timer Paused - Click Start to Continue';
    }
    if (initialTime > 0) {
      return 'Timer Set - Ready to Start';
    }
    return 'Set Timer Duration';
  };

  // Check if start button should be enabled
  const isStartButtonEnabled = () => {
    if (isRedirecting) return false;
    if (timer.time > 0) return true; // Timer has time set
    if (initialTime > 0) return true; // Initial time is set
    return false; // No time set
  };

  return (
    <div className="max-w-md mx-auto fade-in px-4 min-h-[75vh] md:min-h-auto flex items-center justify-center py-4">
      <div className="glass rounded-2xl p-4 md:p-6 w-full">
        <div className="text-center mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Quiz Timer</h1>
          <p className="text-slate-400 text-xs md:text-sm">Countdown timer for quiz sessions</p>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-4 md:mb-6">
          <div className={`text-5xl md:text-6xl font-bold mb-3 md:mb-4 font-mono ${
            isRedirecting ? 'text-red-400 animate-pulse' :
            timer.isRunning ? 'text-green-400' : 
            timer.time === 0 ? 'text-white' : 'text-blue-400'
          }`}>
            {formatTime(localTime)}
          </div>
          <div className={`text-xs md:text-sm ${
            isRedirecting ? 'text-red-400 font-semibold' : 'text-slate-400'
          }`}>
            {getStatusText()}
          </div>
          {initialTime > 0 && !isRedirecting && (
            <div className="text-slate-500 text-xs mt-1">
              Set for: {formatTime(initialTime)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {initialTime > 0 && timer.time > 0 && !isRedirecting && (
          <div className="mb-4 md:mb-6">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((initialTime - timer.time) / initialTime) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4 md:mb-6">
          <button
            onClick={handleStartPause}
            disabled={!isStartButtonEnabled()}
            className={`py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-200 ${
              !isStartButtonEnabled()
                ? 'bg-gray-500 cursor-not-allowed text-gray-300' :
                timer.isRunning
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } shadow-lg hover:shadow-xl`}
          >
            {timer.isRunning ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button
            onClick={handleReset}
            disabled={isRedirecting}
            className={`py-3 rounded-xl font-semibold text-sm md:text-base shadow-lg transition-all duration-200 ${
              isRedirecting
                ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            🔄 Reset
          </button>
        </div>

        {/* Quick Time Buttons */}
        <div className="mb-4 md:mb-6">
          <h3 className="text-sm md:text-base font-semibold text-white mb-2 md:mb-3 text-center">Quick Set</h3>
          <div className="grid grid-cols-5 gap-2">
            {quickTimeButtons.map(time => (
              <button
                key={time}
                onClick={() => handleQuickTimeSet(time)}
                disabled={isRedirecting}
                className={`py-2 rounded-lg font-medium transition-colors text-xs md:text-sm ${
                  isRedirecting
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300' :
                    initialTime === time 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Time Input */}
        <div className="glass-dark rounded-xl p-3 md:p-4 mb-3 md:mb-4">
          <h3 className="text-sm md:text-base font-semibold text-white mb-2 md:mb-3 text-center">Custom Time</h3>
          <div className="flex space-x-2">
            <input
              type="number"
              min="1"
              value={customTime}
              onChange={(e) => setCustomTime(parseInt(e.target.value))}
              placeholder="Seconds"
              disabled={isRedirecting}
              className={`flex-1 px-3 py-2 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                isRedirecting
                  ? 'bg-gray-600 border-gray-500 cursor-not-allowed'
                  : 'bg-slate-800 border-slate-600'
              }`}
            />
            <button
              onClick={handleSetCustomTime}
              disabled={isRedirecting || customTime <= 0}
              className={`px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                isRedirecting || customTime <= 0
                  ? 'bg-gray-500 cursor-not-allowed text-gray-300' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Set
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4 md:mt-6">
          <button
            onClick={() => navigate('/quiz-scoring')}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors text-sm"
          >
            🎯 Back to Scoring
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors text-sm"
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer;