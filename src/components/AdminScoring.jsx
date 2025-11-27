import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  addAdminPoint, 
  subtractAdminPoint, 
  selectHouses, 
  resetAllScoresFirebase,
  saveHouseToFirebase
} from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const AdminScoring = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);

  const handleAddPoints = async (houseId, points) => {
    const house = houses.find(h => h.id === houseId);
    
    try {
      // Update local state for each point
      for (let i = 0; i < points; i++) {
        dispatch(addAdminPoint(houseId));
      }
      
      // Get the UPDATED house data from the store after the state update
      const updatedHouses = houses.map(h => 
        h.id === houseId 
          ? { ...h, adminPoints: h.adminPoints + points }
          : h
      );
      const updatedHouse = updatedHouses.find(h => h.id === houseId);
      
      // Sync with Firebase - .unwrap() REMOVED
      await dispatch(saveHouseToFirebase(updatedHouse));
      
      toast.success(`+${points} points to ${house.name}`, {
        icon: '👑',
        duration: 1500
      });
    } catch (error) {
      toast.error(`Failed to save points for ${house.name}`);
      console.error('Error saving to Firebase:', error);
    }
  };

  const handleSubtractPoint = async (houseId) => {
    const house = houses.find(h => h.id === houseId);
    if (house.adminPoints === 0) {
      toast.error(`${house.name} has no points to subtract`);
      return;
    }
    
    try {
      // Update local state
      dispatch(subtractAdminPoint(houseId));
      
      // Get the UPDATED house data from the store after the state update
      const updatedHouses = houses.map(h => 
        h.id === houseId 
          ? { ...h, adminPoints: h.adminPoints - 1 }
          : h
      );
      const updatedHouse = updatedHouses.find(h => h.id === houseId);
      
      // Sync with Firebase - .unwrap() REMOVED
      await dispatch(saveHouseToFirebase(updatedHouse));
      
      toast.error(`-1 point from ${house.name}`, {
        icon: '🔻',
        duration: 1500
      });
    } catch (error) {
      toast.error(`Failed to save points for ${house.name}`);
      console.error('Error saving to Firebase:', error);
    }
  };

  const handleSaveScores = async () => {
    try {
      // Update total points for all houses and reset admin points
      const savePromises = houses.map(house => {
        const newTotalPoints = house.totalPoints + house.adminPoints;
        return dispatch(saveHouseToFirebase({
          ...house,
          adminPoints: 0,
          totalPoints: newTotalPoints
        }));
      });

      await Promise.all(savePromises);
      
      toast.success('Scores saved successfully! Points added to totals and reset for next session.', {
        icon: '💾',
        duration: 3000
      });
    } catch (error) {
      toast.error('Failed to save scores');
      console.error('Error saving scores:', error);
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
                // .unwrap() REMOVED
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

  // Calculate total points currently given (sum of all adminPoints)
  const totalPointsGiven = houses.reduce((sum, house) => sum + house.adminPoints, 0);

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
                Award house points for overall performance
              </p>
              {totalPointsGiven > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">
                    {totalPointsGiven} points pending save
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSaveScores}
              disabled={totalPointsGiven === 0}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                totalPointsGiven === 0
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-sm">Points Currently Given</p>
                  <p className={`text-xl font-bold ${
                    house.adminPoints > 0 ? 'text-purple-400' : 'text-slate-500'
                  }`}>
                    {house.adminPoints}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total</p>
                  <p className="text-xl font-bold text-green-400">{house.totalPoints}</p>
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

              {/* Subtract Point Button - Only -1 */}
              <button
                onClick={() => handleSubtractPoint(house.id)}
                disabled={house.adminPoints === 0}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                  house.adminPoints === 0
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                -1 Point
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save Instructions */}
      {totalPointsGiven > 0 && (
        <div className="glass rounded-2xl p-6 mt-8 text-center border border-green-500/20">
          <div className="flex items-center justify-center space-x-3">
            <span className="text-green-400 text-2xl">💡</span>
            <div>
              <p className="text-green-400 font-semibold">
                Don't forget to save your scores!
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Click "Save Scores" to add pending points to totals and reset for the next session
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScoring;