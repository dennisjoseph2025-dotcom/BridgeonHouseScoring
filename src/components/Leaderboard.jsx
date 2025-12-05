import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectHouses } from '../store/slices/quizSlice';
import {
  Trophy,
  Award,
  Medal,
  Crown,
  Star,
  Target,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';
import logo from '../assets/logo.jpg'

const Leaderboard = () => {
  const houses = useSelector(selectHouses);
  const navigate = useNavigate();

  // Sort houses by totalPoints from Firebase
  const sortedHouses = [...houses].sort((a, b) => b.totalPoints - a.totalPoints);

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 md:w-7 md:h-7 text-yellow-500" />;
      case 1: return <Award className="w-6 h-6 md:w-7 md:h-7 text-green-400" />;
      case 2: return <Medal className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />;
      default: return <span className="text-white font-bold text-lg">{index + 1}</span>;
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0: return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 1: return 'from-green-400/20 to-green-500/20 border-green-400/30';
      case 2: return 'from-blue-600/20 to-blue-700/20 border-blue-600/30';
      default: return 'glass-dark hover:bg-white/5';
    }
  };

  return (
    <div className="max-w-4xl mx-auto fade-in px-4">
      {/* Header */}
      <div className="glass rounded-2xl p-6 md:p-8 mb-6 md:mb-8 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          {/* Use logo from assets folder */}
          <img 
            src={logo}
            alt="Leaderboard Logo" 
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
            onError={(e) => {
              // Fallback to Trophy icon if logo fails to load
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<svg class="w-10 h-10 md:w-12 md:h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/></svg>';
            }}
          />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-400" />
          House Cup Leaderboard
        </h1>
        <p className="text-slate-400 text-sm md:text-lg flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
          Live standings updated in real-time
        </p>
      </div>

      {/* Leaderboard */}
      <div className="glass rounded-2xl p-4 md:p-8">
        <div className="space-y-3 md:space-y-4">
          {sortedHouses.map((house, index) => (
            <div
              key={house.id}
              className={`flex items-center justify-between p-4 md:p-6 rounded-xl transition-all duration-200 border ${
                index < 3 
                  ? `bg-linear-to-r ${getRankColor(index)}` 
                  : 'glass-dark hover:bg-white/5 border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3 md:space-x-4">
                {/* Rank Badge */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                  index === 1 ? 'bg-green-400/20 border border-green-400/30' :
                  index === 2 ? 'bg-blue-400/20 border border-blue-400/30' : 
                  'bg-slate-600/50 border border-slate-500/30'
                }`}>
                  {getRankIcon(index)}
                </div>

                {/* House Icon and Name */}
                <div className={`w-12 h-12 md:w-16 md:h-16 ${house.bgColor} rounded-xl flex items-center justify-center shadow-lg`}>
                  <img
                    src={house.icon}
                    alt={house.name}
                    className="w-6 h-6 md:w-10 md:h-10 object-contain"
                    onError={(e) => {
                      // Fallback to Shield icon if house icon fails to load
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<svg class="w-6 h-6 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>';
                    }}
                  />
                </div>
                
                <div>
                  <h3 className={`text-xl md:text-3xl font-bold text-${house.color}`}>
                    {house.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                    <span className="text-slate-400 text-xs md:text-sm">
                      House Members
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Points Display */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                  <div className="text-xl md:text-3xl font-bold text-white">
                    {house.totalPoints}
                  </div>
                </div>
                <div className="text-slate-400 text-xs md:text-sm font-medium">
                  POINTS
                </div>
                {index < 3 && (
                  <div className={`flex items-center justify-end gap-1 mt-1 text-xs font-semibold ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' : 'text-amber-400'
                  }`}>
                    {index === 0 ? (
                      <>
                        <Crown className="w-3 h-3" />
                        CHAMPION
                      </>
                    ) : index === 1 ? (
                      <>
                        <Award className="w-3 h-3" />
                        RUNNER UP
                      </>
                    ) : (
                      <>
                        <Medal className="w-3 h-3" />
                        THIRD PLACE
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 pt-6 border-t border-slate-700/50">
          <button
            onClick={() => navigate('/quiz-scoring')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            <Target className="w-4 h-4" />
            Quiz Scoring
          </button>
          <button
            onClick={() => navigate('/house-target')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            <Shield className="w-4 h-4" />
            Target Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;