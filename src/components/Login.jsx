import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser, selectHouses, selectCurrentUser, selectUserRole } from '../store/slices/quizSlice';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (userRole === 'admin') {
        navigate('/admin-scoring');
      } else {
        navigate('/select-targets');
      }
    }
  }, [currentUser, userRole, navigate]);

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
      const houseId = isAdmin ? null : email.split('@')[0];

      // Update Redux store
      dispatch(setCurrentUser({
        user: {
          email: user.email,
          displayName: isAdmin ? 'Administrator' : user.email.split('@')[0],
          uid: user.uid
        },
        role: userRole,
        houseId: houseId
      }));

      toast.success(`Welcome ${isAdmin ? 'Administrator' : user.email.split('@')[0]}!`, {
        icon: '🎉',
        duration: 2000
      });

      // Redirect based on role
      navigate(isAdmin ? '/admin-scoring' : '/select-targets');

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
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  // Quick login credentials
  const quickLogins = [
    { role: '👑 Admin', email: 'admin@bridgeon.com', password: 'admin123Head', color: 'bg-purple-500 hover:bg-purple-600' },
    { role: '🦁 Gryffindor', email: 'gryffindor@bridgeon.com', password: 'gryffindor123red', color: 'bg-red-500 hover:bg-red-600' },
    { role: '🐍 Slytherin', email: 'slytherin@bridgeon.com', password: 'slytherin123green', color: 'bg-green-500 hover:bg-green-600' },
    { role: '🦡 Hufflepuff', email: 'hufflepuff@bridgeon.com', password: 'hufflepuff123yellow', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { role: '🦅 Ravenclaw', email: 'ravenclaw@bridgeon.com', password: 'ravenclaw123blue', color: 'bg-blue-500 hover:bg-blue-600' },
    { role: '📸 Media', email: 'media@bridgeon.com', password: 'media123white', color: 'bg-indigo-500 hover:bg-indigo-600' }
  ];

  // If already logged in, show loading screen
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Welcome Back!</h2>
          <p className="text-slate-400 mb-4">
            Redirecting you to {userRole === 'admin' ? 'Admin Panel' : 'Scoring'}...
          </p>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-linear-to-r from-purple-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white">🏰</span>
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

        {/* Quick Login Buttons */}
        <div className="mt-8">
          <h3 className="text-slate-400 text-sm font-medium mb-3 text-center">
            Quick Sign In
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickLogins.map((cred, index) => (
              <button
                key={index}
                onClick={() => quickLogin(cred.email, cred.password)}
                className={`py-2 ${cred.color} text-white rounded-lg text-sm font-medium transition-colors`}
              >
                {cred.role}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
          <p className="text-slate-400 text-sm text-center">
            Use your @bridgeon.com email and password to sign in
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;