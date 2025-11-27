import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  addAdminPoint, 
  subtractAdminPoint, 
  selectHouses, 
  resetAllScores 
} from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const AdminScoring = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);

  const handleAddAdminPoint = (houseId) => {
    const house = houses.find(h => h.id === houseId);
    dispatch(addAdminPoint(houseId));
    toast.success(`+1 admin point to ${house.name}`, {
      icon: '👑',
      duration: 1500
    });
  };

  const handleSubtractAdminPoint = (houseId) => {
    const house = houses.find(h => h.id === houseId);
    if (house.adminPoints === 0) {
      toast.error(`${house.name} has no admin points to subtract`);
      return;
    }
    dispatch(subtractAdminPoint(houseId));
    toast.error(`-1 admin point from ${house.name}`, {
      icon: '🔻',
      duration: 1500
    });
  };

  const handleResetScores = () => {
    toast((t) => (
      <div className="text-center p-2">
        <p className="font-semibold text-gray-800 mb-4">Reset all scores to zero?</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={() => {
              dispatch(resetAllScores());
              toast.success('All scores reset!', { icon: '🔄' });
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Reset All
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl text-white">👑</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Scoring Panel</h1>
              <p className="text-slate-400">
                Award total house points for overall performance
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleResetScores}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200"
            >
              🔄 Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Scoring Interface */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map(house => (
          <div key={house.id} className="glass-dark rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 ${house.bgColor} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                <img 
                  src={house.icon} 
                  alt={house.name}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h3 className={`text-2xl font-bold text-${house.color} mb-2`}>
                {house.name}
              </h3>
              
              {/* Points Display */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-sm">Quiz Points</p>
                  <p className="text-xl font-bold text-blue-400">{house.quizPoints}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Admin Points</p>
                  <p className="text-xl font-bold text-purple-400">{house.adminPoints}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total</p>
                  <p className="text-xl font-bold text-green-400">{house.totalPoints}</p>
                </div>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="space-y-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSubtractAdminPoint(house.id)}
                  disabled={house.adminPoints === 0}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    house.adminPoints === 0
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  -1 Admin
                </button>
                <button
                  onClick={() => handleAddAdminPoint(house.id)}
                  className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  +1 Admin
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminScoring;