import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  setCurrentUser, 
  selectHouses, 
  selectCurrentUser, 
  selectUserRole,
  selectScoringControl  // ADD THIS IMPORT
} from '../store/slices/quizSlice';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';
import logo from '/assets/logo.webp'

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const scoringControl = useSelector(selectScoringControl);  // ADD THIS
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get the user's house based on email
  const getUserHouse = (email) => {
    if (!email) return null;
    const emailDomain = email.split('@')[0].toLowerCase();
    
    // Find house by email prefix
    return houses.find(house => 
      emailDomain.includes(house.name.toLowerCase()) ||
      emailDomain === house.id
    );
  };

  // Check if user's house is currently scoring
  const isUserHouseScoring = (house) => {
    if (!house || !scoringControl) return false;
    
    return scoringControl.status === 'active' && 
           scoringControl.activeHouseId === house.id &&
           house.isScoring === true;
  };

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      const userHouse = getUserHouse(currentUser.email);
      const userIsScoring = isUserHouseScoring(userHouse);
      
      if (userRole === 'admin') {
        navigate('/admin-scoring');
      } else if (userIsScoring) {
        // Only scoring houses go to target selection
        navigate('/select-targets');
      } else {
        // Non-scoring houses go to leaderboard
        navigate('/leaderboard');
      }
    }
  }, [currentUser, userRole, navigate, houses, scoringControl]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine user role
      const isAdmin = email === 'admin@bridgeon.com';
      const userRole = isAdmin ? 'admin' : 'house';
      const userHouse = getUserHouse(email);
      
      // Check if user's house is scoring
      const isScoringHouse = isUserHouseScoring(userHouse);

      // Update Redux store
      dispatch(setCurrentUser({
        user: {
          email: user.email,
          displayName: isAdmin ? 'Administrator' : user.email.split('@')[0],
          uid: user.uid
        },
        role: userRole,
        houseId: userHouse?.id || null
      }));

      const displayName = isAdmin ? 'Administrator' : user.email.split('@')[0];
      toast.success(`Welcome ${displayName}!`, {
        icon: '🎉',
        duration: 2000
      });

      // Add delay before redirect to see success toast
      setTimeout(() => {
        if (isAdmin) {
          navigate('/admin-scoring');
        } else if (isScoringHouse) {
          navigate('/select-targets');
        } else {
          // Non-scoring house - go to leaderboard
          navigate('/leaderboard');
        }
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Please check your email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Wrong password. Please try again.';
      }
      
      toast.error(errorMessage, {
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading screen when already logged in
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Welcome Back!</h2>
          <p className="text-slate-400 mb-4">
            Redirecting you to the dashboard...
          </p>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #475569',
          },
        }}
      />
      
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="glass rounded-2xl p-8 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <img 
                src={logo}
                alt="Leaderboard Logo" 
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<svg class="w-10 h-10 md:w-12 md:h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/></svg>';
                }}
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bridgeon House Cup</h1>
            <p className="text-slate-400">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="your-email@bridgeon.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Information about access */}
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400 text-sm text-center">
              Use your @bridgeon.com email and password to sign in
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;