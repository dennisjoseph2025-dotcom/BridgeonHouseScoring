import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { 
  selectCurrentUser, 
  selectUserRole,
  selectHouses,
  selectCanCurrentUserScore,
  selectScoringControl
} from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const ProtectedScoringRoute = ({ children }) => {
  const location = useLocation();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);
  const houses = useSelector(selectHouses);
  const canCurrentUserScore = useSelector(selectCanCurrentUserScore);
  const scoringControl = useSelector(selectScoringControl);

  useEffect(() => {
    // Only show error toast for house users who can't score
    if (currentUser && userRole === 'house' && !canCurrentUserScore && scoringControl.status === 'active') {
      const activeHouse = houses.find(h => h.isScoring);
      if (activeHouse) {
        toast.error(`${activeHouse.name} is currently scoring. You can only use the buzzer.`, {
          duration: 4000,
        });
      }
    }
  }, [currentUser, userRole, canCurrentUserScore, scoringControl, houses]);

  // Check if user is logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is admin, allow access
  if (userRole === 'admin') {
    return children;
  }

  // Check if user can score (based on isScoring flag)
  if (canCurrentUserScore) {
    return children;
  }

  // If user cannot score, redirect to buzzer
  return <Navigate to="/buzer" state={{ from: location }} replace />;
};

export default ProtectedScoringRoute;