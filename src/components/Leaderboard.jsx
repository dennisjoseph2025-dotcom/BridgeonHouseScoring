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
      case 0: return `${index + 1}`;;
      case 1: return `${index + 1}`;;
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
    <div className="max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-8 mb-8 text-center">
        <div className="w-20 h-20 bg-linear-to-r from-purple-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <span className="text-3xl">🏆</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">House Cup Leaderboard</h1>
        <p className="text-slate-400 text-lg">Live standings updated in real-time</p>
      </div>

      {/* Leaderboard */}
      <div className="glass rounded-2xl p-8">
        <div className="space-y-4">
          {sortedHouses.map((house, index) => (
            <div
              key={house.id}
              className={`flex items-center justify-between p-6 rounded-xl transition-all duration-200 border ${
                index < 3 
                  ? `bg-linear-to-r ${getRankColor(index)}` 
                  : 'glass-dark hover:bg-white/5 border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Rank Badge */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-green-400' :
                  index === 2 ? 'bg-gray-400' : 'bg-slate-600'
                }`}>
                  <span className="text-white font-bold text-lg">
                    {getMedal(index)}
                  </span>
                </div>

                {/* House Icon and Name */}
                <div className={`w-16 h-16 ${house.bgColor} rounded-xl flex items-center justify-center shadow-lg`}>
                  <img
                    src={house.icon}
                    alt={house.name}
                    className="w-10 h-10 object-contain"
                  />
                </div>
                
                <div>
                  <h3 className={`text-xl font-bold text-${house.color}`}>
                    {house.name}
                  </h3>
                  <div className="flex space-x-4 mt-1">
                    <div className="text-slate-400 text-sm">
                      <span className="text-blue-400 font-semibold">Admin:</span> {house.adminPoints}
                    </div>
                    <div className="text-slate-400 text-sm">
                      <span className="text-green-400 font-semibold">Quiz:</span> {house.totalPoints - house.adminPoints}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Points Display */}
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">
                  {house.totalPoints}
                </div>
                <div className="text-slate-400 text-sm font-medium">
                  TOTAL POINTS
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
        <div className="flex justify-center space-x-4 mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate('/admin-scoring')}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors"
          >
            👑 Admin Scoring
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;