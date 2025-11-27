import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectHouses } from '../store/slices/quizSlice';


const Leaderboard = () => {
  const houses = useSelector(selectHouses);
  const navigate = useNavigate();

  const sortedHouses = [...houses].sort((a, b) => b.points - a.points);

  // const getMedal = (index) => {
  //   switch (index) {
  //     case 0: return '🥇';
  //     case 1: return '🥈';
  //     case 2: return '🥉';
  //     default: return `#${index + 1}`;
  //   }
  // };

  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-8 mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">House Leaderboard</h1>
        <p className="text-slate-400">Current standings for the House Cup</p>
      </div>

      {/* Leaderboard */}
      <div className="glass rounded-2xl p-8">
        <div className="space-y-4">
          {sortedHouses.map((house, index) => (
            <div
              key={house.id}
              className={`flex items-center justify-between p-6 rounded-xl transition-all duration-200 ${index === 0
                  ? 'bg-linear-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20'
                  : 'glass-dark hover:bg-white/5'
                }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${house.bgColor} rounded-xl flex items-center justify-center shadow-lg`}>
                  <img
                    src={house.icon}
                    alt={house.name}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold text-${house.color}`}>
                    {house.name}
                  </h3>

                </div>
              </div>

              {/* <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {house.points}
                </div>
                <div className="text-slate-400 text-sm">
                  points
                </div>
              </div> */}
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {house.totalPoints}
                </div>

              </div>
            </div>
          ))}
        </div>
        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
          >
            🎯 Score Points
          </button>
          <button
            onClick={() => navigate('/timer')}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
          >
            ⏱️ Timer Control
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;