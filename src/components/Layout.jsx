import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import logo from '/assets/logo.webp'
import { 
  selectHouses, 
  selectCurrentUser, 
  selectUserRole,
  selectFirebaseConnected,
  logoutUser,
  selectCurrentUserHouse,
  selectScoringControl,
} from '../store/slices/quizSlice';
import { getAuth, signOut } from 'firebase/auth';

// Import Lucide React icons
import {
  Trophy,
  BarChart3,
  Target,
  Star,
  Clock,
  Bell,
  Crown,
  LogOut,
  Menu,
  X,
  Home,
  User,
  CheckCircle2,
  XCircle,
  Radio,
  Headphones,
  Zap,
  Server,
  Timer,
  Settings,
  History,
  Gamepad2,
  Mic2
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const houses = useSelector(selectHouses);
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const firebaseConnected = useSelector(selectFirebaseConnected);
  const currentUserHouse = useSelector(selectCurrentUserHouse);
  const scoringControl = useSelector(selectScoringControl);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('');

  // Update elapsed time every minute for scoring session
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

  // Get the currently scoring house object
  const activeScoringHouse = houses.find(h => h.id === scoringControl.activeHouseId);

  // Base navigation items for all users - using Lucide icons with same alignment
  const baseNavItems = [
    { 
      path: '/', 
      label: 'Leaderboard', 
      icon: <Trophy className="w-5 h-5" />
    },
    { 
      path: '/quiz-history', 
      label: 'Quiz History', 
      icon: <BarChart3 className="w-5 h-5" />
    }
  ];

  // Navigation items for house users when they can score
  const scoringHouseNavItems = [
    { 
      path: '/select-targets', 
      label: 'Select Targets', 
      icon: <Target className="w-5 h-5" />
    },
    { 
      path: '/quiz-scoring', 
      label: 'Quiz Scoring', 
      icon: <Star className="w-5 h-5" />
    },
    { 
      path: '/timer', 
      label: 'Timer', 
      icon: <Timer className="w-5 h-5" />
    },
  ];

  // Navigation items for participating houses (not scoring)
  const participatingHouseNavItems = [
    { 
      path: '/buzer', 
      label: 'Buzzer', 
      icon: <Bell className="w-5 h-5" />
    },
  ];

  // Navigation items for admin only
  const adminNavItems = [
    { 
      path: '/admin-scoring', 
      label: 'Admin Scoring', 
      icon: <Crown className="w-5 h-5" />
    },
    { 
      path: '/scoring-control', 
      label: 'Scoring Control', 
      icon: <Settings className="w-5 h-5" />
    },
  ];

  // Combine navigation items based on user role and scoring session
  const getNavItems = () => {
    // If user is not logged in, show only base items
    if (!currentUser) {
      return baseNavItems;
    }
    
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

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      dispatch(logoutUser());
      localStorage.removeItem('selectedTargets');
      navigate('/leaderboard');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Check if scoring control is active
  const isScoringControlActive = scoringControl.status === 'active';

  // If user is not logged in, show only login button in header
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* Fixed Header - Only logo and login button for non-logged in users */}
        <header className="bg-slate-900/95 border-b border-slate-700 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Logo and BRIDGEON */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={logo}
                    alt="Bridgeon Logo"
                    className="w-full h-full object-contain bg-white pr-0.5 p-1"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">BRIDGEON</h1>
                  <p className="text-xs text-slate-400 hidden sm:block">House Cup Quiz System</p>
                </div>
              </div>

              {/* Right: Only Login button (matching logout button style) */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLogin}
                  className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 pt-16">
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>

        {/* Footer - Minimal */}
        <footer className="bg-slate-900 border-t border-slate-700 mt-auto">
          <div className="container mx-auto px-4 py-3 text-center">
            <p className="text-slate-400 text-sm">
              BRIDGEON House Cup System
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
  }

  // If user is logged in, show the full layout with menu
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Fixed Header - Full header for logged in users */}
      <header className="bg-slate-900/95 border-b border-slate-700 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          {/* Minimal Header Content - Always visible */}
          <div className="flex items-center justify-between">
            {/* Left: Logo and BRIDGEON */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={logo}
                  alt="Bridgeon Logo"
                  className="w-full h-full object-contain bg-white pr-0.5 p-1"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">BRIDGEON</h1>
                <p className="text-xs text-slate-400 hidden sm:block">House Cup Quiz System</p>
              </div>
            </div>

            {/* Center: Current Scoring Display (when active) */}
            {isScoringControlActive && activeScoringHouse && (
              <div className="hidden md:flex items-center space-x-2 bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg px-3 py-1.5 mx-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-7 h-7 ${activeScoringHouse.bgColor} rounded-lg flex items-center justify-center`}>
                    <img 
                      src={activeScoringHouse.icon} 
                      alt={activeScoringHouse.name}
                      className="w-4 h-4 object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-400">Scoring:</span>
                      <span className={`text-xs font-bold text-${activeScoringHouse.color}`}>
                        {activeScoringHouse.name}
                      </span>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    {elapsedTime && (
                      <div className="text-xs text-slate-500">
                        <span className="text-green-400 font-medium">{elapsedTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Right: User Status, Menu Button, and Logout */}
            <div className="flex items-center space-x-2">
              {/* Firebase Connection Status */}
              <div className="hidden sm:flex items-center space-x-1 mr-2">
                {firebaseConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-slate-400">
                  {firebaseConnected ? 'Connected' : 'Offline'}
                </span>
              </div>

              {/* Mobile Current Scoring Indicator (when active) */}
              {isScoringControlActive && activeScoringHouse && (
                <div className="sm:hidden flex items-center space-x-1 bg-green-500/20 border border-green-500/30 rounded px-2 py-1 mr-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">
                    {activeScoringHouse.name}
                  </span>
                </div>
              )}

              {/* Menu Button */}
              <button
                onClick={toggleMenu}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm hidden sm:block"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Hidden Menu Panel - Appears when menu button is clicked */}
          {isMenuOpen && (
            <div className="mt-3 pb-3 border-t border-slate-700 pt-3 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl">
              {/* Mobile Current Scoring Display */}
              {isScoringControlActive && activeScoringHouse && (
                <div className="mb-3 p-3 bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
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
                          <span className={`text-base font-bold text-${activeScoringHouse.color}`}>
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
                      <Zap className="w-3 h-3" />
                      LIVE
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile User Info */}
              <div className="mb-3 p-3 bg-slate-700/80 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      {userRole === 'admin' 
                        ? 'Administrator' 
                        : `Logged in as: ${currentUserHouse?.name || 'House'}`
                      }
                    </p>
                    <p className="text-white font-medium text-base">{currentUser.displayName}</p>
                    <p className="text-sm text-slate-400">{currentUser.email}</p>
                    
                    {isScoringControlActive && userRole === 'house' && (
                      <p className={`text-xs mt-1 flex items-center ${
                        currentUserHouse && currentUserHouse.id === scoringControl.activeHouseId
                          ? 'text-green-400' 
                          : 'text-blue-400'
                      }`}>
                        {currentUserHouse && currentUserHouse.id === scoringControl.activeHouseId ? (
                          <>
                            <Mic2 className="w-3 h-3 mr-1" />
                            Quiz Conductor
                          </>
                        ) : (
                          <>
                            <Headphones className="w-3 h-3 mr-1" />
                            Participant
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Mobile Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 bg-red-600 text-white border border-red-700 rounded-lg hover:bg-red-700 transition-colors text-sm sm:hidden"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Links Grid */}
              <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 text-center ${
                      location.pathname === item.path
                        ? 'bg-blue-600 text-white border border-blue-700'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/80'
                    }`}
                  >
                    <div className="text-xl mb-1.5 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Additional Info Footer in Menu */}
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex justify-center items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {firebaseConnected ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-xs text-slate-400">
                      {firebaseConnected ? 'Connected to server' : 'Server offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 pt-16">
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>

      {/* Footer - Minimal */}
      <footer className="bg-slate-900 border-t border-slate-700 mt-auto">
        <div className="container mx-auto px-4 py-3 text-center">
          <p className="text-slate-400 text-sm">
            BRIDGEON House Cup System
          </p>
          {/* Footer Current Scoring Status */}
          {isScoringControlActive && activeScoringHouse && (
            <div className="mt-1 flex items-center justify-center space-x-2 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>Scoring: </span>
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