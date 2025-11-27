import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  startTimer, 
  pauseTimer, 
  resetTimer, 
  updateTimer, 
  setTimer,
  selectTimer 
} from '../store/slices/quizSlice';
import { useNavigate } from 'react-router-dom';

const Timer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const timer = useSelector(selectTimer);
  const [customTime, setCustomTime] = useState(0);
  const [initialTime, setInitialTime] = useState(0);

  useEffect(() => {
    let interval;
    if (timer.isRunning && timer.time > 0) {
      interval = setInterval(() => {
        dispatch(updateTimer());
      }, 1000);
    } else if (timer.isRunning && timer.time === 0) {
      dispatch(pauseTimer());
      // You can add a notification here when timer reaches zero
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.time, dispatch]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartPause = () => {
    if (timer.isRunning) {
      dispatch(pauseTimer());
    } else {
      if (timer.time === 0 && initialTime > 0) {
        dispatch(setTimer(initialTime));
      }
      dispatch(startTimer());
    }
  };

  const handleReset = () => {
    dispatch(resetTimer());
    setInitialTime(0);
  };

  const handleSetCustomTime = () => {
    if (customTime > 0) {
      dispatch(setTimer(customTime));
      setInitialTime(customTime);
    }
  };

  const handleQuickTimeSet = (time) => {
    if (time > 0) {
      dispatch(setTimer(time));
      setInitialTime(time);
      if (!timer.isRunning) {
        dispatch(startTimer());
      }
    }
  };

  const quickTimeButtons = [60, 120, 180,240, 300]; // 30s, 1m, 5m, 10m, 15m

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="glass rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Timer</h1>
          <p className="text-slate-400">Countdown timer for quiz sessions</p>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className={`text-8xl font-bold mb-6 font-mono ${
            timer.isRunning ? 'text-green-400 pulse' : 
            timer.time === 0 ? 'text-red-400' : 'text-white'
          }`}>
            {formatTime(timer.time)}
          </div>
          <div className="text-slate-400 text-lg">
            {timer.isRunning ? 'Countdown Running' : 
             timer.time === 0 ? 'Time\'s Up!' : 'Timer Ready'}
          </div>
          {initialTime > 0 && (
            <div className="text-slate-500 text-sm mt-2">
              Set for: {formatTime(initialTime)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {initialTime > 0 && (
          <div className="mb-8">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((initialTime - timer.time) / initialTime) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleStartPause}
            disabled={initialTime === 0 && timer.time === 0}
            className={`py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              timer.isRunning
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : initialTime === 0 && timer.time === 0
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } shadow-lg hover:shadow-xl`}
          >
            {timer.isRunning ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button
            onClick={handleReset}
            className="py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            🔄 Reset
          </button>
        </div>

        {/* Quick Time Buttons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Quick Set</h3>
          <div className="grid grid-cols-5 gap-2">
            {quickTimeButtons.map(time => (
              <button
                key={time}
                onClick={() => handleQuickTimeSet(time)}
                className="py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Time Input */}
        <div className="glass-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Custom Time</h3>
          <div className="flex space-x-3">
            <input
              type="number"
              min="1"
              value={customTime}
              onChange={(e) => setCustomTime(parseInt(e.target.value))}
              placeholder="Seconds"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSetCustomTime}
              disabled={customTime <= 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                customTime <= 0 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Set
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => navigate('/quiz-scoring')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
          >
            🎯 Back to Scoring
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors"
          >
            🏆 View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer;