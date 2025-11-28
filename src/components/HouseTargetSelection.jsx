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
      <div className="max-w-2xl mx-auto text-center fade-in px-4">
        <div className="glass rounded-2xl p-6 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">No House Selected</h2>
          <p className="text-slate-400 mb-6 md:mb-8 text-sm md:text-base">
            Please log in with your house credentials
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 md:px-8 md:py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-base md:text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            🔐 Login
          </button>
        </div>
      </div>
    );
  }

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

      {/* Houses Grid - Updated for 2 per row on mobile */}
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
              🎯 Start ({selectedTargets.length})
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default HouseTargetSelection;