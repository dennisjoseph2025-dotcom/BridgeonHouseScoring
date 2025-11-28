import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectHouses } from '../store/slices/quizSlice';

const Leaderboard = () => {
  const houses = useSelector(selectHouses);
  const navigate = useNavigate();

  // Sort houses by totalPoints from Firebase
  const sortedHouses = [...houses].sort((a, b) => b.totalPoints - a.totalPoints);

  const getMedal = (index) => {
    switch (index) {
      case 0: return `${index + 1}`;
      case 1: return `${index + 1}`;
      case 2: return `${index + 1}`;
      default: return `${index + 1}`;
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0: return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 1: return 'from-green-400/20 to-green-500/20 border-green-400/30';
      case 2: return 'from-blue-600/20 to-blue-700/20 border-blue-600/30';
      default: return 'glass-dark hover:bg-white/5';
    }
  };

  return (
    <div className="max-w-4xl mx-auto fade-in px-4">
      {/* Header */}
      <div className="glass rounded-2xl p-6 md:p-8 mb-6 md:mb-8 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-linear-to-r from-purple-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <span className="text-2xl md:text-3xl">🏆</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">House Cup Leaderboard</h1>
        <p className="text-slate-400 text-sm md:text-lg">Live standings updated in real-time</p>
      </div>

      {/* Leaderboard */}
      <div className="glass rounded-2xl p-4 md:p-8">
        <div className="space-y-3 md:space-y-4">
          {sortedHouses.map((house, index) => (
            <div
              key={house.id}
              className={`flex items-center justify-between p-4 md:p-6 rounded-xl transition-all duration-200 border ${
                index < 3 
                  ? `bg-linear-to-r ${getRankColor(index)}` 
                  : 'glass-dark hover:bg-white/5 border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3 md:space-x-4">
                {/* Rank Badge */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-green-400' :
                  index === 2 ? 'bg-gray-400' : 'bg-slate-600'
                }`}>
                  <span className="text-white font-bold text-base md:text-lg">
                    {getMedal(index)}
                  </span>
                </div>

                {/* House Icon and Name */}
                <div className={`w-12 h-12 md:w-16 md:h-16 ${house.bgColor} rounded-xl flex items-center justify-center shadow-lg`}>
                  <img
                    src={house.icon}
                    alt={house.name}
                    className="w-6 h-6 md:w-10 md:h-10 object-contain"
                  />
                </div>
                
                <div>
                  <h3 className={`text-xl md:text-3xl font-bold text-${house.color}`}>
                    {house.name}
                  </h3>
                </div>
              </div>

              {/* Total Points Display */}
              <div className="text-right">
                <div className="text-xl md:text-3xl font-bold text-white mb-1">
                  {house.totalPoints}
                </div>
                <div className="text-slate-400 text-xs md:text-sm font-medium">
                  POINTS
                </div>
                {index < 3 && (
                  <div className={`text-xs font-semibold mt-1 ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' : 'text-amber-400'
                  }`}>
                    {index === 0 ? 'CHAMPION' : index === 1 ? 'RUNNER UP' : 'THIRD PLACE'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6 md:mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors text-sm md:text-base"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate('/admin-scoring')}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors text-sm md:text-base"
          >
            👑 Admin Scoring
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;