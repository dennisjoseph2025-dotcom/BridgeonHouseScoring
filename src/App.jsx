import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectUserRole } from './store/slices/quizSlice'
import './index.css'
import Layout from './components/Layout'
import Login from './components/Login'
import HouseTargetSelection from './components/HouseTargetSelection'
import QuizScoring from './components/QuizScoring'
import QuizHistory from './components/QuizHistory'
import AdminScoring from './components/AdminScoring'
import Timer from './components/Timer'
import Leaderboard from './components/Leaderboard'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate page based on role
    if (userRole === 'admin') {
      return <Navigate to="/admin-scoring" replace />;
    } else {
      return <Navigate to="/select-targets" replace />;
    }
  }

  return children;
};

function App() {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  return (
    <Router>
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
        {/* Remove the /select-house route since it's no longer needed */}
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
      </Routes>
    </Router>
  )
}

export default App