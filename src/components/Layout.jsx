import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectScoringHouse, 
  selectHouses, 
  selectCurrentUser, 
  selectUserRole,
  selectFirebaseConnected,
  logoutUser,
  selectScoringSessionActive,
  selectActiveScoringHouseId,
  selectScoringSessionStartTime,
  endScoringSession,
  selectCanCurrentUserScore,
  selectCurrentUserHouse,
  selectScoringControl,
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
  const scoringSessionActive = useSelector(selectScoringSessionActive);
  const activeScoringHouseId = useSelector(selectActiveScoringHouseId);
  const scoringSessionStartTime = useSelector(selectScoringSessionStartTime);
  const canCurrentUserScore = useSelector(selectCanCurrentUserScore);
  const currentUserHouse = useSelector(selectCurrentUserHouse);
  const scoringControl = useSelector(selectScoringControl);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('');

  // Update elapsed time every minute for scoring session - UPDATED TO USE SCORING CONTROL
  useEffect(() => {
    if (!scoringControl.activeHouseId || !scoringControl.scoringSessionStartTime) {
      setElapsedTime('');
      return;
    }

    const updateElapsedTime = () => {
      const durationMs = Date.now() - scoringControl.scoringSessionStartTime;
      const minutes = Math.floor(durationMs / 60000);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        setElapsedTime(`${hours}h ${minutes % 60}m`);
      } else if (minutes > 0) {
        setElapsedTime(`${minutes}m`);
      } else {
        setElapsedTime('Just started');
      }
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 60000);

    return () => clearInterval(interval);
  }, [scoringControl.activeHouseId, scoringControl.scoringSessionStartTime]);

  // Check if current user is the scoring house - UPDATED TO USE SCORING CONTROL
  const isCurrentUserScoringHouse = currentUserHouse && 
    scoringControl.status === 'active' && 
    currentUserHouse.id === scoringControl.activeHouseId;

  // Get the currently scoring house object - UPDATED TO USE SCORING CONTROL
  const activeScoringHouse = houses.find(h => h.id === scoringControl.activeHouseId);

  // Base navigation items for all users
  const baseNavItems = [
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/quiz-history', label: 'Quiz History', icon: '📊' }
  ];

  // Navigation items for house users when they can score
  const scoringHouseNavItems = [
    { path: '/select-targets', label: 'Select Targets', icon: '🎯' },
    { path: '/quiz-scoring', label: 'Quiz Scoring', icon: '⭐' },
    { path: '/timer', label: 'Timer', icon: '⏱️' },
  ];

  // Navigation items for participating houses (not scoring)
  const participatingHouseNavItems = [
    { path: '/buzer', label: 'Buzzer', icon: '🔊' },
  ];

  // Navigation items for admin only
  const adminNavItems = [
    { path: '/admin-scoring', label: 'Admin Scoring', icon: '👑' },
    { path: '/scoring-control', label: 'Scoring Control', icon: '🎮' },
  ];

  // Combine navigation items based on user role and scoring session - FIXED LOGIC
  const getNavItems = () => {
    if (userRole === 'admin') {
      return [...adminNavItems, ...baseNavItems];
    } else if (userRole === 'house') {
      // Check if scoring control is active
      if (scoringControl.status === 'active') {
        // Check if current user is the scoring house
        if (currentUserHouse && currentUserHouse.id === scoringControl.activeHouseId) {
          // Scoring house sees scoring options + buzzer
          return [...scoringHouseNavItems, ...participatingHouseNavItems, ...baseNavItems];
        } else {
          // Non-scoring house only sees buzzer and base items
          return [...participatingHouseNavItems, ...baseNavItems];
        }
      } else {
        // No active scoring session - show only base items
        return [...baseNavItems];
      }
    }
    return baseNavItems;
  };

  const navItems = getNavItems();

  // Get the scoring house object to display proper name
  const scoringHouse = houses.find(h => h.id === scoringHouseId);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      
      // Note: We don't end scoring session on logout anymore since admin controls it
      
      await signOut(auth);
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

  // Check if scoring control is active
  const isScoringControlActive = scoringControl.status === 'active';

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

            {/* Current Scoring Display - Desktop */}
            {isScoringControlActive && activeScoringHouse && (
              <div className="hidden md:flex items-center space-x-3 bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg px-4 py-2 mr-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 ${activeScoringHouse.bgColor} rounded-lg flex items-center justify-center`}>
                    <img 
                      src={activeScoringHouse.icon} 
                      alt={activeScoringHouse.name}
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">Currently Scoring:</span>
                      <span className={`text-sm font-bold text-${activeScoringHouse.color}`}>
                        {activeScoringHouse.name}
                      </span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    {elapsedTime && (
                      <div className="text-xs text-slate-500">
                        Active for: <span className="text-green-400 font-medium">{elapsedTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User Display - Desktop */}
            {currentUser && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    {userRole === 'admin' 
                      ? 'Administrator' 
                      : `Logged in as: ${currentUserHouse?.name || 'House'}`
                    }
                  </p>
                  {isScoringControlActive && userRole === 'house' && (
                    <p className={`text-xs mt-1 ${
                      currentUserHouse && currentUserHouse.id === scoringControl.activeHouseId
                        ? 'text-green-400' 
                        : 'text-blue-400'
                    }`}>
                      {currentUserHouse && currentUserHouse.id === scoringControl.activeHouseId
                        ? '🎤 Quiz Conductor' 
                        : '🔊 Participant'
                      }
                    </p>
                  )}
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
              {/* Mobile Current Scoring Indicator */}
              {isScoringControlActive && activeScoringHouse && (
                <div className="hidden sm:flex items-center space-x-1 bg-green-500/20 border border-green-500/30 rounded px-2 py-1 mr-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">
                    {activeScoringHouse.name}
                  </span>
                </div>
              )}
              
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
              {/* Mobile Current Scoring Display */}
              {isScoringControlActive && activeScoringHouse && (
                <div className="mb-4 p-3 bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${activeScoringHouse.bgColor} rounded-lg flex items-center justify-center`}>
                        <img 
                          src={activeScoringHouse.icon} 
                          alt={activeScoringHouse.name}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Currently Scoring</p>
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold text-${activeScoringHouse.color}`}>
                            {activeScoringHouse.name}
                          </span>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        {elapsedTime && (
                          <p className="text-xs text-slate-500 mt-1">
                            Active: <span className="text-green-400 font-medium">{elapsedTime}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                      LIVE
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile User Info */}
              {currentUser && (
                <div className="mb-4 p-3 bg-slate-700/80 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">
                        {userRole === 'admin' 
                          ? 'Administrator' 
                          : `Logged in as: ${currentUserHouse?.name || 'House'}`
                        }
                      </p>
                      <p className="text-white font-medium">{currentUser.displayName}</p>
                      {isScoringControlActive && userRole === 'house' && (
                        <p className={`text-xs mt-1 flex items-center ${
                          currentUserHouse && currentUserHouse.id === scoringControl.activeHouseId
                            ? 'text-green-400' 
                            : 'text-blue-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-1 ${
                            currentUserHouse && currentUserHouse.id === scoringControl.activeHouseId
                              ? 'bg-green-500' 
                              : 'bg-blue-500'
                          }`}></span>
                          {currentUserHouse && currentUserHouse.id === scoringControl.activeHouseId
                            ? 'Quiz Conductor' 
                            : 'Participant'
                          }
                        </p>
                      )}
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
          {/* Footer Current Scoring Status */}
          {isScoringControlActive && activeScoringHouse && (
            <div className="mt-2 flex items-center justify-center space-x-2 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>Currently scoring: </span>
              <span className={`font-medium text-${activeScoringHouse.color}`}>
                {activeScoringHouse.name}
              </span>
              {elapsedTime && (
                <span className="text-slate-500">({elapsedTime})</span>
              )}
            </div>
          )}
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