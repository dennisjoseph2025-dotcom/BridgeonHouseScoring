import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectScoringHouse, 
  setScoringHouse, 
  selectHouses, 
  selectCurrentUser, 
  selectUserRole,
  logoutUser 
} from '../store/slices/quizSlice';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scoringHouseId = useSelector(selectScoringHouse);
  const houses = useSelector(selectHouses);
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  // Base navigation items for all users
  const baseNavItems = [
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' }
  ];

  // Navigation items for house users only
  const houseUserNavItems = [
    { path: '/select-targets', label: 'Select Targets', icon: '🎯' },
    { path: '/quiz-scoring', label: 'Quiz Scoring', icon: '⭐' },
    { path: '/quiz-history', label: 'Quiz History', icon: '📊' },
    { path: '/timer', label: 'Timer', icon: '⏱️' }
  ];

  // Navigation items for admin only
  const adminNavItems = [
    { path: '/admin-scoring', label: 'Admin Scoring', icon: '👑' },
    { path: '/quiz-history', label: 'Quiz History', icon: '📊' }
  ];

  // Combine navigation items based on user role
  const getNavItems = () => {
    if (userRole === 'admin') {
      return [...baseNavItems, ...adminNavItems];
    } else if (userRole === 'house') {
      return [...baseNavItems, ...houseUserNavItems];
    }
    return baseNavItems;
  };

  const navItems = getNavItems();

  // Get the scoring house object to display proper name
  const scoringHouse = houses.find(h => h.id === scoringHouseId);

  // Hide scoring house display on specific pages
  const shouldShowScoringHouse = scoringHouse && 
    location.pathname !== '/select-targets';

  const handleLogout = () => {
    dispatch(logoutUser());
    // Also clear selected targets when logging out
    localStorage.removeItem('selectedTargets');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="glass border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">BRIDGEON</h1>
                <p className="text-sm text-slate-400">House Cup Quiz System</p>
              </div>
            </div>

            {/* User Display - Conditionally Shown */}
            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    {userRole === 'admin' ? 'Administrator' : `Scoring as: ${scoringHouse?.name || 'No House'}`}
                  </p>
                  <p className="text-white font-medium">{currentUser.displayName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/10 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-slate-400">
            BRIDGEON House Cup System • Magical Learning Experience
          </p>
        </div>
      </footer>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#1E293B',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#1E293B',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;