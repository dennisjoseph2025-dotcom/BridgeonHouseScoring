import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectScoringHouse, 
  selectHouses, 
  selectCurrentUser, 
  selectUserRole,
  selectFirebaseConnected,
  logoutUser 
} from '../store/slices/quizSlice';
import { getAuth, signOut } from 'firebase/auth';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scoringHouseId = useSelector(selectScoringHouse);
  const houses = useSelector(selectHouses);
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const firebaseConnected = useSelector(selectFirebaseConnected);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      return [...adminNavItems, ...baseNavItems];
    } else if (userRole === 'house') {
      return [...houseUserNavItems, ...baseNavItems ];
    }
    return baseNavItems;
  };

  const navItems = getNavItems();

  // Get the scoring house object to display proper name
  const scoringHouse = houses.find(h => h.id === scoringHouseId);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth); // Sign out from Firebase
      dispatch(logoutUser());
      localStorage.removeItem('selectedTargets');
      navigate('/login');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Fixed Header - Darker Background */}
      <header className="bg-slate-900/95 border-b border-slate-700 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Top Bar - Logo and Mobile Menu Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              {/* Mobile BRIDGEON text */}
              <div className="block sm:hidden">
                <h1 className="text-lg font-semibold text-white">BRIDGEON</h1>
              </div>
              {/* Desktop text */}
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-white">BRIDGEON</h1>
                <p className="text-sm text-slate-400">House Cup Quiz System</p>
              </div>
            </div>

            {/* User Display - Desktop */}
            {currentUser && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    {userRole === 'admin' ? 'Administrator' : `Scoring as: ${scoringHouse?.name || 'No House'}`}
                  </p>
                  {/* <p className="text-white font-medium">{currentUser.displayName}</p> */}
                  <div className="flex items-center space-x-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-slate-400">
                      {firebaseConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white border border-blue-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 lg:hidden">
              {currentUser && (
                <div className="flex items-center space-x-2 mr-2">
                  <div className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {firebaseConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              )}
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu - Darker Background when open */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-slate-700 pt-4 bg-slate-800/95 backdrop-blur-sm rounded-lg">
              {/* Mobile User Info */}
              {currentUser && (
                <div className="mb-4 p-3 bg-slate-700/80 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">
                        {userRole === 'admin' ? 'Administrator' : `Scoring as: ${scoringHouse?.name || 'No House'}`}
                      </p>
                      <p className="text-white font-medium">{currentUser.displayName}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1 bg-red-600 text-white border border-red-700 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Navigation Links */}
              <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 text-center ${
                      location.pathname === item.path
                        ? 'bg-blue-600 text-white border border-blue-700'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/80'
                    }`}
                  >
                    <span className="text-lg mb-1">{item.icon}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area - This will grow to push footer down */}
      <div className="flex-1 pt-16">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          {children}
        </main>
      </div>

      {/* Footer - Always at bottom */}
      <footer className="bg-slate-900 border-t border-slate-700 mt-auto">
        <div className="container mx-auto px-4 py-4 sm:py-6 text-center">
          <p className="text-slate-400 text-sm sm:text-base">
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