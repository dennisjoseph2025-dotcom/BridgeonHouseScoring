import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectHouses, selectScoringHouse } from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const HouseTargetSelection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const currentScoringHouse = useSelector(selectScoringHouse);
  const [selectedTargets, setSelectedTargets] = useState([]);

  // Load previously selected targets from localStorage
  useEffect(() => {
    const savedTargets = localStorage.getItem('selectedTargets');
    if (savedTargets) {
      setSelectedTargets(JSON.parse(savedTargets));
    }
  }, []);

  // Get the scoring house object
  const scoringHouse = houses.find(h => h.id === currentScoringHouse);

  // Houses that can be scored (excluding the scoring house itself)
  const availableTargets = houses.filter(house => house.id !== currentScoringHouse);

  const handleTargetToggle = (houseId) => {
    setSelectedTargets(prev => 
      prev.includes(houseId) 
        ? prev.filter(id => id !== houseId)
        : [...prev, houseId]
    );
  };

  const handleStartScoring = () => {
    if (selectedTargets.length === 0) {
      toast.error('Please select at least one house to score');
      return;
    }

    // Store selected targets in localStorage for use in scoring page
    localStorage.setItem('selectedTargets', JSON.stringify(selectedTargets));
    
    toast.success(`Ready to score ${selectedTargets.length} house${selectedTargets.length > 1 ? 's' : ''}!`, {
      icon: '🎯'
    });
    
    // FIX: Navigate to /quiz-scoring instead of /scoring
    navigate('/quiz-scoring');
  };

  const handleSelectAll = () => {
    setSelectedTargets(availableTargets.map(house => house.id));
  };

  const handleDeselectAll = () => {
    setSelectedTargets([]);
  };

  // If no scoring house is selected, redirect to login
  if (!currentScoringHouse) {
    return (
      <div className="max-w-2xl mx-auto text-center fade-in">
        <div className="glass rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">No House Selected</h2>
          <p className="text-slate-400 mb-8">
            Please log in with your house credentials
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            🔐 Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 ${scoringHouse.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
              <img 
                src={scoringHouse.icon} 
                alt={scoringHouse.name}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Select Houses to Score</h1>
              <p className="text-slate-400">
                Choose which houses <span className={`font-semibold text-${scoringHouse.color}`}>{scoringHouse.name}</span> will award quiz points to
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-slate-400">Selected</p>
              <p className="text-2xl font-bold text-white">{selectedTargets.length}/{availableTargets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-center">
            💡 You cannot score your own house ({scoringHouse.name}). Select one or more houses to award quiz points to.
          </p>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Available Target Houses
            </h2>
            <p className="text-slate-400">
              Click on houses to select/deselect them for quiz scoring
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      </div>

      {/* Houses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {availableTargets.map(house => (
          <div
            key={house.id}
            className={`glass-dark rounded-2xl p-6 transition-all duration-300 cursor-pointer group border-2 ${
              selectedTargets.includes(house.id)
                ? 'border-blue-500 bg-blue-500/10 transform scale-105'
                : 'border-transparent hover:border-slate-600 hover:scale-105'
            }`}
            onClick={() => handleTargetToggle(house.id)}
          >
            <div className="text-center">
              {/* House Icon */}
              <div className={`w-20 h-20 ${house.bgColor} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                <img 
                  src={house.icon} 
                  alt={house.name}
                  className="w-14 h-14 object-contain"
                />
              </div>
              
              {/* House Name */}
              <h3 className={`text-2xl font-bold text-${house.color} mb-2`}>
                {house.name}
              </h3>
              
              {/* Current Points - Show only admin points since quiz points are separate */}
              <div className="mb-4">
                <p className="text-slate-400 text-sm">House Points</p>
                <p className="text-3xl font-bold text-white">{house.totalPoints}</p>
              </div>

              {/* Selection Indicator */}
              <div className={`p-3 rounded-lg transition-all duration-200 ${
                selectedTargets.includes(house.id)
                  ? 'bg-blue-500/20 border border-blue-500/30'
                  : 'bg-slate-700/50 border border-slate-600/30'
              }`}>
                <p className={`font-medium ${
                  selectedTargets.includes(house.id) ? 'text-blue-400' : 'text-slate-400'
                }`}>
                  {selectedTargets.includes(house.id) ? '✓ Selected for Quiz Scoring' : 'Click to Select'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="text-center lg:text-left">
            <p className="text-slate-400 text-lg">
              Ready to start quiz scoring?
            </p>
            <p className="text-white font-semibold">
              {selectedTargets.length} house{selectedTargets.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/quiz-scoring')}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all duration-200"
            >
              ⭐ Go to Quiz Scoring
            </button>
            <button
              onClick={handleStartScoring}
              disabled={selectedTargets.length === 0}
              className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                selectedTargets.length === 0
                  ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              🎯 Start Scoring ({selectedTargets.length})
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="flex justify-center space-x-4 mt-8">
        <button
          onClick={() => navigate('/leaderboard')}
          className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors"
        >
          🏆 View Leaderboard
        </button>
        <button
          onClick={() => navigate('/timer')}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
        >
          ⏱️ Timer Control
        </button>
        <button
          onClick={() => navigate('/quiz-history')}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
        >
          📊 Quiz History
        </button>
      </div>
    </div>
  );
};

export default HouseTargetSelection;