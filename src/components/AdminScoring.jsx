import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  addAdminPoint,
  subtractAdminPoint,
  applyAdminPoints,
  selectHouses,
  resetAllScoresFirebase,
  saveAllHousesSingleWrite // ADD THIS IMPORT
} from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const AdminScoring = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);

  const handleAddPoints = (houseId, points) => {
    const house = houses.find(h => h.id === houseId);

    try {
      // Update local state for each point (only adminPoints, not totalPoints)
      for (let i = 0; i < points; i++) {
        dispatch(addAdminPoint(houseId));
      }

      toast.success(`+${points} pending points to ${house.name}`, {
        icon: '🔺',
        duration: 1500
      });
    } catch (error) {
      toast.error(`Failed to add points for ${house.name}`);
      console.error('Error adding points:', error);
    }
  };

  const handleSubtractPoint = (houseId) => {
    const house = houses.find(h => h.id === houseId);

    try {
      // Update local state (only adminPoints - can go negative)
      dispatch(subtractAdminPoint(houseId));

      toast.error(`-1 pending point from ${house.name}`, {
        icon: '🔻',
        duration: 1500
      });
    } catch (error) {
      toast.error(`Failed to subtract points for ${house.name}`);
      console.error('Error subtracting points:', error);
    }
  };

  const handleSaveScores = async () => {
    try {


      // Show loading state immediately
      const saveToast = toast.loading('Saving scores...');

      // Apply admin points to total points
      dispatch(applyAdminPoints());

      try {
        // Use the ultra-fast single write approach
        const result = await dispatch(saveAllHousesSingleWrite());

        if (result.success) {
          toast.success('Scores saved successfully!', {
            icon: '💾',
            duration: 2000
          });
        } else {
          throw new Error(result.error || 'Failed to save scores');
        }
      } catch (error) {
        console.error('❌ Error saving scores:', error);
        toast.error('Failed to save scores to database');
      } finally {
        toast.dismiss(saveToast);
      }
    } catch (error) {
      console.error('❌ Error in save operation:', error);
      toast.error('Failed to process scores');
    }
  };

  const handleResetScores = () => {
    toast((t) => (
      <div className="text-center p-2">
        <p className="font-semibold text-red-500 mb-4">Reset all scores to zero?</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={async () => {
              try {
                await dispatch(resetAllScoresFirebase());
                toast.success('All scores reset!', { icon: '🔄' });
                toast.dismiss(t.id);
              } catch (error) {
                toast.error('Failed to reset scores');
                console.error('Reset error:', error);
              }
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

  // Calculate net pending changes (can be positive or negative)
  const netPendingChanges = houses.reduce((sum, house) => sum + house.adminPoints, 0);

  // Check if any house has pending changes
  const hasPendingChanges = houses.some(house => house.adminPoints !== 0);

  // Calculate what the total would be after applying pending changes
  const getProjectedTotal = (house) => house.totalPoints + house.adminPoints;

  // Point increment options - only +5, +3, +1
  const pointOptions = [5, 3, 1];

  return (
    <div className="max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-linear-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl text-white">👑</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Scoring Panel</h1>
              <p className="text-slate-400">
                Award or deduct house points for overall performance
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSaveScores}
              disabled={!hasPendingChanges}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                hasPendingChanges
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              💾 Save Scores
            </button>
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
        {houses.map(house => {
          const projectedTotal = getProjectedTotal(house);
          const hasPendingChanges = house.adminPoints !== 0;

          return (
            <div key={house.id} className="glass-dark rounded-2xl p-6">
              <div className="text-center mb-6">
                <div className={`w-20 h-20 ${house.bgColor} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                  <img
                    src={house.icon}
                    alt={house.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <h3 className={`text-2xl font-bold text-${house.color} mb-4`}>
                  {house.name}
                </h3>

                {/* Points Display - Horizontal Layout */}
                <div className="flex justify-between items-center mb-4 p-4 bg-slate-700/30 rounded-xl">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-1">Current</p>
                    <p className="text-2xl font-bold text-green-400">{house.totalPoints}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-1">Pending</p>
                    <p className={`text-xl font-bold ${house.adminPoints === 0
                      ? 'text-slate-500'
                      : house.adminPoints > 0
                        ? 'text-purple-400'
                        : 'text-red-400'
                      }`}>
                      {house.adminPoints > 0 ? '+' : ''}{house.adminPoints}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-1">New Total</p>
                    <p className={`text-2xl font-bold ${hasPendingChanges ? 'text-blue-400' : 'text-slate-500'
                      }`}>
                      {projectedTotal}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Controls */}
              <div className="space-y-3">
                {/* Add Points Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {pointOptions.map(points => (
                    <button
                      key={`add-${points}`}
                      onClick={() => handleAddPoints(house.id, points)}
                      className="py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      +{points}
                    </button>
                  ))}
                </div>

                {/* Subtract Point Button */}
                <button
                  onClick={() => handleSubtractPoint(house.id)}

                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200  bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl`}
                >
                  -1 Point
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Instructions */}

        <div className="glass rounded-2xl p-6 mt-8 text-center border border-green-500/20">
          <div className="flex items-center justify-center space-x-3">
            <div>
              <p className="text-green-400 font-semibold">
                Don't forget to save your changes!
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Click "Save Scores" to apply all pending changes to totals
              </p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AdminScoring;