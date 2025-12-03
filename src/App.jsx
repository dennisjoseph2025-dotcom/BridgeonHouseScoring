import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  selectCurrentUser,
  selectUserRole,
  setCurrentUser,
  logoutUser,
  setFirebaseConnected,
  startHouseListener,
  startQuizHistoryListener
} from './store/slices/quizSlice';
import { firebaseService } from './services/firebaseService';
import './index.css';
import Layout from './components/Layout';
import Login from './components/Login';
import HouseTargetSelection from './components/HouseTargetSelection';
import QuizScoring from './components/QuizScoring';
import QuizHistory from './components/QuizHistory';
import AdminScoring from './components/AdminScoring';
import Timer from './components/Timer';
import Leaderboard from './components/Leaderboard';

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
    // Firebase auth state listener
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        let userRole = 'house';
        let houseId = null;

        if (user.email === 'admin@bridgeon.com') {
          userRole = 'admin';
        } else {
          houseId = user.email.split('@')[0];
        }

        dispatch(setCurrentUser({
          user: {
            email: user.email,
            displayName: user.email.split('@')[0],
            uid: user.uid
          },
          role: userRole,
          houseId: houseId
        }));

        // Start Firebase listeners only when authenticated
        dispatch(startHouseListener());
        dispatch(startQuizHistoryListener());
        dispatch(setFirebaseConnected(true));

        console.log('✅ User authenticated:', user.email);
      } else {
        // User is signed out
        dispatch(logoutUser());
        dispatch(setFirebaseConnected(false));
        console.log('🔐 User signed out');
      }
    });

    // Start Firebase connection monitoring
    const connectionUnsubscribe = firebaseService.startConnectionMonitor((status) => {
      dispatch(setFirebaseConnected(status.connected));
    });

    return () => {
      unsubscribeAuth();
      connectionUnsubscribe();
      firebaseService.cleanupAllListeners();
    };
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
            borderRadius: '0.75rem',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#059669',
              border: '1px solid #10b981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#059669',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#dc2626',
              border: '1px solid #ef4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#dc2626',
            },
          },
        }}
      />
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

export default App;