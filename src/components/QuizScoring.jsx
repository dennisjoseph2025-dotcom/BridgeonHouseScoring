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
  selectCurrentQuizPoints,
  saveCurrentQuizToFirebase
} from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const QuizScoring = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const scoringHouseId = useSelector(selectScoringHouse);
  const currentQuizPoints = useSelector(selectCurrentQuizPoints);
  const [housesToScore, setHousesToScore] = useState([]);
  const [saveMode, setSaveMode] = useState('replace');

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

  const debugQuizData = () => {
    console.log('🔍 Debug Quiz Data:', {
      currentQuizPoints,
      housesToScore: housesToScore.map(h => ({ id: h.id, name: h.name })),
      scoringHouse: scoringHouse?.name,
      totalPoints: Object.values(currentQuizPoints).reduce((sum, points) => sum + points, 0)
    });
  };

  useEffect(() => {
    debugQuizData();
  }, [currentQuizPoints]);

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

  const handleSaveQuiz = async () => {
    const totalPoints = Object.values(currentQuizPoints).reduce((sum, points) => sum + points, 0);
    
    console.log('💾 Save Quiz Clicked:', {
      totalPoints,
      currentQuizPoints,
      housesWithPoints: Object.keys(currentQuizPoints).filter(id => currentQuizPoints[id] > 0),
      saveMode
    });

    if (totalPoints === 0) {
      toast.error('No quiz points to save');
      return;
    }

    try {
      const resultAction = await dispatch(saveCurrentQuizToFirebase(saveMode));
      const result = resultAction?.payload || resultAction;
      
      console.log('📨 Save Result:', result);
      
      if (result && result.success) {
        toast.success(`Quiz points ${saveMode === 'replace' ? 'saved' : 'added'} to history and synced across all devices!`, {
          icon: '💾',
          duration: 3000
        });
      } else if (result && result.localSave) {
        toast.success(`Quiz points ${saveMode === 'replace' ? 'saved' : 'added'} locally (Firebase sync unavailable)`, {
          icon: '💾',
          duration: 3000
        });
      } else {
        const errorMsg = result?.error || 'Unknown error occurred';
        toast.error(`Failed to save: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ Save Error Details:', error);
      toast.error(`Error saving quiz points: ${error.message}`);
    }
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
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <p className="text-xs md:text-sm text-slate-400">Save Mode</p>
              <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                <button
                  onClick={() => setSaveMode('replace')}
                  className={`px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm font-medium transition-colors ${
                    saveMode === 'replace' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Replace
                </button>
                <button
                  onClick={() => setSaveMode('add')}
                  className={`px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm font-medium transition-colors ${
                    saveMode === 'add' 
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
                onClick={handleSaveQuiz}
                disabled={totalSessionPoints === 0}
                className={`flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-200 text-sm md:text-base ${
                  totalSessionPoints === 0
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {saveMode === 'replace' ? '💾 Save' : '➕ Add'}
              </button>
              
              <button
                onClick={handleClearQuiz}
                disabled={totalSessionPoints === 0}
                className={`flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-200 text-sm md:text-base ${
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
                onClick={() => navigate('/leaderboard')}
                className="w-full py-2 md:py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors font-medium text-sm md:text-base"
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => navigate('/quiz-history')}
                className="w-full py-2 md:py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors font-medium text-sm md:text-base"
              >
                📊 History
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
                          onClick={() => handleSubtractQuizPoint(house.id)}
                          disabled={(currentQuizPoints[house.id] || 0) === 0}
                          className={`flex-1 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
                            (currentQuizPoints[house.id] || 0) === 0
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

export default QuizScoring;