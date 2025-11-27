import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setScoringHouse, selectHouses, selectScoringHouse } from '../store/slices/quizSlice';

import toast from 'react-hot-toast';

const HouseSelection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const currentScoringHouse = useSelector(selectScoringHouse);

  const handleHouseSelect = (houseId) => {
    const house = houses.find(h => h.id === houseId);
    
    // Clear previously selected targets when changing scoring house
    if (currentScoringHouse !== houseId) {
      localStorage.removeItem('selectedTargets');
      toast.success(`Target selection cleared for new scoring house`, {
        icon: '🔄'
      });
    }
    
    dispatch(setScoringHouse(houseId));
    toast.success(`${house.name} is now scoring!`, {
      icon: '🎯'
    });
    navigate('/select-targets');
  };

  const handleQuickScoring = (houseId) => {
    const house = houses.find(h => h.id === houseId);
    
    // Clear any previous targets
    localStorage.removeItem('selectedTargets');
    
    // Auto-select all other houses as targets
    const allOtherHouses = houses.filter(h => h.id !== houseId).map(h => h.id);
    localStorage.setItem('selectedTargets', JSON.stringify(allOtherHouses));
    
    dispatch(setScoringHouse(houseId));
    toast.success(`${house.name} scoring all houses!`, {
      icon: '⚡'
    });
    navigate('/scoring');
  };

  return (
    <div className="max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-8 mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Select Scoring House</h1>
        <p className="text-slate-400 text-lg">
          Choose which house will be giving points to other teams
        </p>
        {currentScoringHouse && (
          <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg inline-block">
            <p className="text-blue-400">
              Currently scoring as: <span className="font-semibold">
                {houses.find(h => h.id === currentScoringHouse)?.name}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Houses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{houses.map(house => (
  <div key={house.id} className="glass-dark rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
    <div className="text-center">
      {/* House Icon - Changed from emoji to image */}
      <div className={`w-24 h-24 ${house.bgColor} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
        <img 
          src={house.icon} 
          alt={house.name}
          className="w-16 h-16 object-contain"
        />
      </div>
      
      {/* Rest of the component remains the same */}
      <h3 className={`text-2xl font-bold text-${house.color} mb-2`}>
        {house.name}
      </h3>
      
      <div className="mb-4">
        <p className="text-slate-400 text-sm">Current Points</p>
        <p className="text-3xl font-bold text-white">{house.points}</p>
      </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={() => handleHouseSelect(house.id)}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Select & Choose Targets
                </button>
                
                <button 
                  onClick={() => handleQuickScoring(house.id)}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Quick Score All Houses
                </button>
              </div>

              {/* Current Selection Indicator */}
              {currentScoringHouse === house.id && (
                <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm font-medium">Currently Selected</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Information Panel */}
      <div className="glass rounded-2xl p-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Select & Choose Targets</h3>
            <p className="text-slate-400 text-sm">
              Choose specific houses to score. Perfect for focused scoring sessions.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Quick Score All Houses</h3>
            <p className="text-slate-400 text-sm">
              Automatically select all other houses for scoring. Best for general sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="flex justify-center space-x-4 mt-12">
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
      </div>
    </div>
  );
};

export default HouseSelection;