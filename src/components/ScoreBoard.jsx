import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPoint, subtractPoint, selectHouses, resetAllScores } from '../store/slices/quizSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ScoreBoard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);

  const handleAddPoint = (houseId, houseName) => {
    dispatch(addPoint(houseId));
    toast.success(`+1 point to ${houseName}!`, { 
      icon: '⭐',
      duration: 1500 
    });
  };

  const handleSubtractPoint = (houseId, houseName) => {
    dispatch(subtractPoint(houseId));
    toast.error(`-1 point from ${houseName}`, { 
      icon: '🔻',
      duration: 1500 
    });
  };

  const handleResetScores = () => {
    toast((t) => (
      <div className="text-center">
        <p className="font-magic mb-4 text-gray-800">Reset all scores to zero?</p>
        <div className="space-x-4">
          <button
            onClick={() => {
              dispatch(resetAllScores());
              toast.success('All scores reset!', { icon: '🔄' });
              toast.dismiss(t.id);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-magic"
          >
            Yes, Reset All
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 font-magic"
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="parchment rounded-2xl p-8 mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-ancient text-gray-800 mb-2">House Score Board</h1>
          <p className="text-gray-600 font-magic text-lg">
            Manage points for each house during the quiz
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {houses.map(house => (
            <div key={house.id} className="house-card bg-white rounded-2xl p-6 shadow-2xl border-4 border-gray-200">
              {/* House Header */}
              <div className={`${house.bgColor} rounded-xl p-4 text-center mb-4`}>
                <h3 className={`text-2xl font-bold text-white font-magic`}>
                  {house.name}
                </h3>
              </div>

              {/* Points Display */}
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-gray-800 mb-2">
                  {house.points}
                </div>
                <p className="text-gray-600 font-magic">Points</p>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAddPoint(house.id, house.name)}
                  className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl font-magic text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  +1 ⬆️
                </button>
                <button
                  onClick={() => handleSubtractPoint(house.id, house.name)}
                  disabled={house.points === 0}
                  className={`p-4 rounded-xl font-magic text-lg shadow-lg transition-all ${
                    house.points === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  -1 ⬇️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={handleResetScores}
            className="bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl font-magic text-lg shadow-lg hover:shadow-xl transition-all"
          >
            🔄 Reset All Scores
          </button>
          <button
            onClick={() => navigate('/quiz')}
            className="bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-magic text-lg shadow-lg hover:shadow-xl transition-all"
          >
            ⏱️ Quiz Control
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-magic text-lg shadow-lg hover:shadow-xl transition-all"
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;