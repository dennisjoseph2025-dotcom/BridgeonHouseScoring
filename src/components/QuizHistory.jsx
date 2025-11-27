import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectQuizHistory, selectHouses, selectUserRole, updateQuizHistoryFromFirebase } from '../store/slices/quizSlice';
import { firebaseService } from '../services/firebaseService'; // Import the service
import toast from 'react-hot-toast';

const QuizHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const quizHistory = useSelector(selectQuizHistory);
  const houses = useSelector(selectHouses);
  const userRole = useSelector(selectUserRole);

  const isAdmin = userRole === 'admin';

  // Get sorted dates (newest first)
  const sortedDates = Object.keys(quizHistory).sort((a, b) => new Date(b) - new Date(a));

  // Calculate total quiz points for a house across all dates
  const getTotalQuizPoints = (houseId) => {
    return Object.values(quizHistory).reduce((total, dayPoints) => {
      return total + (dayPoints[houseId] || 0);
    }, 0);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Admin function to delete a specific date's history
  const handleDeleteDate = async (date) => {
    if (!isAdmin) return;

    toast((t) => (
      <div className="text-center p-2">
        <p className="font-semibold text-red-500 mb-4">Delete quiz history for {formatDate(date)}?</p>
        <p className="text-sm text-gray-400 mb-4">This action cannot be undone.</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={async () => {
              try {
                const newHistory = { ...quizHistory };
                delete newHistory[date];
                
                // Update Firebase using the service
                const result = await firebaseService.writeData('quizHistory', newHistory);
                
                if (result.success) {
                  // Update local state
                  dispatch(updateQuizHistoryFromFirebase(newHistory));
                  toast.success('Quiz history deleted from Firebase!', { icon: '🗑️' });
                } else {
                  toast.error('Failed to delete from Firebase');
                }
              } catch (error) {
                toast.error('Error deleting history');
                console.error('Delete error:', error);
              }
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Delete
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

  // Admin function to clear all quiz history
  const handleClearAllHistory = () => {
    if (!isAdmin) return;

    toast((t) => (
      <div className="text-center p-2">
        <p className="font-semibold text-red-500 mb-4">Clear all quiz history?</p>
        <p className="text-sm text-gray-400 mb-4">This will delete all quiz data and cannot be undone.</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={async () => {
              try {
                // Clear Firebase using the service
                const result = await firebaseService.writeData('quizHistory', {});
                
                if (result.success) {
                  // Update local state
                  dispatch(updateQuizHistoryFromFirebase({}));
                  toast.success('All quiz history cleared from Firebase!', { icon: '🗑️' });
                } else {
                  toast.error('Failed to clear Firebase');
                }
              } catch (error) {
                toast.error('Error clearing history');
                console.error('Clear error:', error);
              }
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Clear All
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
      <div className="glass rounded-2xl p-8 mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Quiz Points History</h1>
        <p className="text-slate-400 text-lg">
          {isAdmin ? 'Manage weekly quiz performance and history' : 'Weekly quiz performance and point distribution'}
        </p>
        
        {/* Admin Controls */}
        {isAdmin && sortedDates.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleClearAllHistory}
              className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
            >
              🗑️ Clear All History
            </button>
          </div>
        )}
      </div>

      {/* Overall Quiz Summary */}
      <div className="glass rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Overall Quiz Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {houses.map(house => (
            <div key={house.id} className="glass-dark rounded-xl p-4 text-center">
              <div className={`w-16 h-16 ${house.bgColor} rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg`}>
                <img 
                  src={house.icon} 
                  alt={house.name}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h3 className={`text-lg font-semibold text-${house.color} mb-2`}>
                {house.name}
              </h3>
              <p className="text-3xl font-bold text-blue-400">
                {getTotalQuizPoints(house.id)}
              </p>
              <p className="text-slate-400 text-sm">Total Quiz Points</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="glass rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Daily Quiz Breakdown</h2>
          {isAdmin && sortedDates.length > 0 && (
            <div className="text-sm text-slate-400">
              Admin Mode: Click 🗑️ to delete dates
            </div>
          )}
        </div>
        
        {sortedDates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">📊</span>
            </div>
            <p className="text-slate-400 text-lg mb-4">No quiz history available</p>
            <p className="text-slate-500">Quiz points will appear here after each session</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="glass-dark rounded-xl p-6 relative">
                {/* Admin Delete Button */}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteDate(date)}
                    className="absolute top-4 right-4 w-8 h-8 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center"
                    title="Delete this date's history"
                  >
                    🗑️
                  </button>
                )}
                
                <h3 className="text-xl font-semibold text-white mb-4 pr-12">
                  {formatDate(date)}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {houses.map(house => (
                    <div key={house.id} className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className={`w-12 h-12 ${house.bgColor} rounded-xl mx-auto mb-2 flex items-center justify-center`}>
                        <img 
                          src={house.icon} 
                          alt={house.name}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <h4 className={`text-sm font-semibold text-${house.color} mb-1`}>
                        {house.name}
                      </h4>
                      <p className="text-2xl font-bold text-blue-400">
                        {quizHistory[date][house.id] || 0}
                      </p>
                      <p className="text-slate-400 text-xs">Points</p>
                    </div>
                  ))}
                </div>

                {/* Date Summary */}
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Total points awarded:</span>
                    <span className="text-blue-400 font-semibold">
                      {Object.values(quizHistory[date]).reduce((sum, points) => sum + points, 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-center space-x-4 mt-8">
        <button
          onClick={() => navigate('/leaderboard')}
          className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors"
        >
          🏆 View Leaderboard
        </button>
        
        {isAdmin ? (
          <button
            onClick={() => navigate('/admin-scoring')}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
          >
            👑 Admin Scoring
          </button>
        ) : (
          <button
            onClick={() => navigate('/quiz-scoring')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
          >
            ⭐ Quiz Scoring
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizHistory;