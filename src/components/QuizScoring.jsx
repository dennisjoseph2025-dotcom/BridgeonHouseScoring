import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  addQuizPoint, 
  subtractQuizPoint, 
  saveQuizToHistory,
  clearCurrentQuiz,
  selectHouses, 
  selectScoringHouse,
  selectCurrentQuizPoints
} from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const QuizScoring = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const scoringHouseId = useSelector(selectScoringHouse);
  const currentQuizPoints = useSelector(selectCurrentQuizPoints);
  const [housesToScore, setHousesToScore] = useState([]);

  const scoringHouse = houses.find(h => h.id === scoringHouseId);

  // Load selected targets from localStorage
  useEffect(() => {
    const savedTargets = localStorage.getItem('selectedTargets');
    if (savedTargets) {
      const targetIds = JSON.parse(savedTargets);
      setHousesToScore(houses.filter(house => targetIds.includes(house.id)));
    } else {
      setHousesToScore(houses.filter(house => house.id !== scoringHouseId));
    }
  }, [houses, scoringHouseId]);

  const handleAddQuizPoint = (houseId) => {
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

  const handleSubtractQuizPoint = (houseId) => {
    if (!scoringHouseId) {
      toast.error('Please select a scoring house first');
      navigate('/select-targets');
      return;
    }

    const house = houses.find(h => h.id === houseId);
    const currentPoints = currentQuizPoints[houseId] || 0;
    
    if (currentPoints === 0) {
      toast.error(`${house.name} has no quiz points to subtract`);
      return;
    }

    dispatch(subtractQuizPoint(houseId));
    toast.error(`-1 quiz point from ${house.name}`, {
      icon: '🔻',
      duration: 1000
    });
  };

  const handleSaveQuiz = () => {
    const totalPoints = Object.values(currentQuizPoints).reduce((sum, points) => sum + points, 0);
    
    if (totalPoints === 0) {
      toast.error('No quiz points to save');
      return;
    }

    dispatch(saveQuizToHistory());
    toast.success('Quiz points saved to history!', {
      icon: '💾',
      duration: 2000
    });
  };

  const handleClearQuiz = () => {
    dispatch(clearCurrentQuiz());
    toast.success('Current quiz session cleared', {
      icon: '🗑️',
      duration: 1500
    });
  };

  if (!scoringHouseId) {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in">
        <div className="glass rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">No House Selected</h2>
          <p className="text-slate-400 mb-8">
            Please select targets first
          </p>
          <button
            onClick={() => navigate('/select-targets')}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            🎯 Select Targets
          </button>
        </div>
      </div>
    );
  }

  const totalSessionPoints = Object.values(currentQuizPoints).reduce((sum, points) => sum + points, 0);

  return (
    <div className="max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 ${scoringHouse.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
              <img 
                src={scoringHouse.icon} 
                alt={scoringHouse.name}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Quiz Scoring Panel</h1>
              <p className="text-slate-400">
                <span className={`font-semibold text-${scoringHouse.color}`}>{scoringHouse.name}</span> - Current Quiz Session
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Points are temporary until saved to history
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-4">
              {/* <div className="text-right">
                <p className="text-sm text-slate-400">Session Points</p>
                <p className="text-2xl font-bold text-blue-400">{totalSessionPoints}</p>
              </div> */}
              <button
                onClick={handleSaveQuiz}
                disabled={totalSessionPoints === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  totalSessionPoints === 0
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                💾 Save Quiz
              </button>
              <button
                onClick={handleClearQuiz}
                disabled={totalSessionPoints === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  totalSessionPoints === 0
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Scoring House Info - SIMPLIFIED */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your House</h2>
            <div className="text-center p-6 bg-slate-800/50 rounded-xl border-2 border-slate-600">
              <div className={`w-20 h-20 ${scoringHouse.bgColor} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                <img 
                  src={scoringHouse.icon} 
                  alt={scoringHouse.name}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h3 className={`text-2xl font-bold text-${scoringHouse.color} mb-2`}>
                {scoringHouse.name}
              </h3>
              
              {/* Simplified - Only show house being scored */}
              <div className="mb-4">
                <p className="text-slate-400 text-sm">Scoring</p>
                <p className="text-3xl font-bold text-green-400">{housesToScore.length}</p>
                <p className="text-slate-400 text-sm">houses</p>
              </div>

              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Cannot score your own house
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/select-targets')}
                className="w-full py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors font-medium"
              >
                🎯 Change Targets
              </button>
              <button
                onClick={() => navigate('/leaderboard')}
                className="w-full py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors font-medium"
              >
                🏆 View Leaderboard
              </button>
              <button
                onClick={() => navigate('/quiz-history')}
                className="w-full py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors font-medium"
              >
                📊 Quiz History
              </button>
            </div>
          </div>
        </div>

        {/* Scoring Interface */}
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Score Selected Houses ({housesToScore.length})
                </h2>
                <p className="text-slate-400">
                  Award quiz points for correct answers and good performance
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-slate-400">Scoring Mode</p>
                  <p className="text-blue-400 font-semibold">Quiz Points</p>
                </div>
              </div>
            </div>

            {housesToScore.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl">🎯</span>
                </div>
                <p className="text-slate-400 text-lg mb-4">No houses selected for scoring</p>
                <button
                  onClick={() => navigate('/select-targets')}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                >
                  Select Houses to Score
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {housesToScore.map(house => (
                  <div key={house.id} className="glass-dark rounded-xl p-5 transition-all duration-200 hover:bg-white/5 border border-slate-600/30 hover:border-slate-500/50">
                    <div className="text-center mb-4">
                      <div className={`w-16 h-16 ${house.bgColor} rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg`}>
                        <img 
                          src={house.icon} 
                          alt={house.name}
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                      <h3 className={`text-lg font-semibold text-${house.color} mb-1`}>
                        {house.name}
                      </h3>
                      
                      {/* Points Display */}
                      <div className="mb-3">
                        <p className="text-slate-400 text-xs">This Session</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {currentQuizPoints[house.id] || 0}
                        </p>
                      </div>
                    </div>

                    {/* Scoring Controls */}
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSubtractQuizPoint(house.id)}
                          disabled={(currentQuizPoints[house.id] || 0) === 0}
                          className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-200 ${
                            (currentQuizPoints[house.id] || 0) === 0
                              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          }`}
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAddQuizPoint(house.id)}
                          className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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
                            className="py-2 bg-blue-400/20 text-blue-400 border border-blue-400/30 rounded text-sm font-medium hover:bg-blue-400/30 transition-colors"
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
              <div className="mt-8 glass-dark rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Current Session Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {housesToScore.map(house => (
                    <div key={house.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${house.bgColor} rounded-lg flex items-center justify-center`}>
                          <img 
                            src={house.icon} 
                            alt={house.name}
                            className="w-4 h-4 object-contain"
                          />
                        </div>
                        <span className={`text-${house.color} font-medium`}>{house.name}</span>
                      </div>
                      <span className="text-blue-400 font-bold">{currentQuizPoints[house.id] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats - SIMPLIFIED */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl text-blue-400">⭐</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Total Session Points</h3>
          <p className="text-3xl font-bold text-blue-400">{totalSessionPoints}</p>
          <p className="text-slate-400 text-sm mt-1">All houses combined</p>
        </div>

        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl text-green-400">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Houses Being Scored</h3>
          <p className="text-3xl font-bold text-green-400">{housesToScore.length}</p>
          <p className="text-slate-400 text-sm mt-1">Active targets</p>
        </div>
      </div> */}
    </div>
  );
};

export default QuizScoring;