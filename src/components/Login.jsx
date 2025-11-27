import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser, selectHouses } from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const houses = useSelector(selectHouses);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if admin login
      if (email === 'admin@bridgeon.com' && password === 'admin123') {
        dispatch(setCurrentUser({
          user: { email, displayName: 'Administrator' },
          role: 'admin',
          houseId: null
        }));
        toast.success('Welcome Administrator!');
        navigate('/admin-scoring');
        return;
      }

      // Check if house login
      const house = houses.find(h => 
        email === `${h.id}@bridgeon.com` && password === `${h.id}123`
      );

      if (house) {
        dispatch(setCurrentUser({
          user: { email, displayName: house.name },
          role: 'house',
          houseId: house.id
        }));
        toast.success(`Welcome ${house.name}!`);
        navigate('/select-targets');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo credentials for testing
  const demoCredentials = [
    { role: 'Admin', email: 'admin@bridgeon.com', password: 'admin123' },
    ...houses.map(house => ({
      role: house.name,
      email: `${house.id}@bridgeon.com`,
      password: `${house.id}123`
    }))
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BRIDGEON</h1>
          <p className="text-slate-400">House Cup Quiz System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Demo Credentials:</h3>
          <div className="space-y-2 text-xs">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="flex justify-between text-slate-400">
                <span>{cred.role}:</span>
                <span>{cred.email} / {cred.password}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;