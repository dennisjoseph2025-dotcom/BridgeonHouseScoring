import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectUserRole, startHouseListener, startQuizHistoryListener } from '../store/slices/quizSlice';
import './index.css';
import Layout from './Layout';
import Login from './Login';
import HouseTargetSelection from './HouseTargetSelection';
import QuizScoring from './QuizScoring';
import QuizHistory from './QuizHistory';
import AdminScoring from './AdminScoring';
import Timer from './Timer';
import Leaderboard from './Leaderboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') {
      return <Navigate to="/admin-scoring" replace />;
    } else {
      return <Navigate to="/select-targets" replace />;
    }
  }

  return children;
};

// 404 Component
const NotFound = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="glass rounded-2xl p-12 text-center max-w-md">
        <div className="w-20 h-20 bg-red-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-3xl">🔍</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate(currentUser ? (userRole === 'admin' ? '/admin-scoring' : '/select-targets') : '/login')}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
        >
          Go to {currentUser ? (userRole === 'admin' ? 'Admin Panel' : 'Scoring') : 'Login'}
        </button>
      </div>
    </div>
  );
};

function AppContent() {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        currentUser ? 
          (userRole === 'admin' ? 
            <Navigate to="/admin-scoring" replace /> : 
            <Navigate to="/select-targets" replace />
          ) : 
          <Navigate to="/login" replace />
      } />
      <Route path="/select-targets" element={
        <ProtectedRoute allowedRoles={['house']}>
          <Layout>
            <HouseTargetSelection />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/quiz-scoring" element={
        <ProtectedRoute allowedRoles={['house']}>
          <Layout>
            <QuizScoring />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/quiz-history" element={
        <ProtectedRoute allowedRoles={['admin', 'house']}>
          <Layout>
            <QuizHistory />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/timer" element={
        <ProtectedRoute allowedRoles={['house']}>
          <Layout>
            <Timer />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin-scoring" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout>
            <AdminScoring />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Layout>
            <Leaderboard />
          </Layout>
        </ProtectedRoute>
      } />
      {/* Catch all route - 404 handler */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Start Firebase listeners
    dispatch(startHouseListener());
    dispatch(startQuizHistoryListener());
  }, [dispatch]);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;