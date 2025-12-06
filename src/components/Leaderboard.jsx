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
import logo from '/assets/logo.webp'

const Leaderboard = () => {
  const houses = useSelector(selectHouses);
  const navigate = useNavigate();

  // Sort houses by totalPoints from Firebase
  const sortedHouses = [...houses].sort((a, b) => b.totalPoints - a.totalPoints);

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-500" />;
      case 1: return <Award className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-400" />;
      case 2: return <Medal className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-400" />;
      default: return <span className="text-white font-bold text-base sm:text-lg">{index + 1}</span>;
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
    <div className="max-w-4xl mx-auto fade-in px-3 sm:px-4">
      {/* Header */}
      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-lg">
          <img 
            src={logo}
            alt="Leaderboard Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<svg class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/></svg>';
            }}
          />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <Trophy className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 text-yellow-400 shrink-0" />
          <span className="whitespace-nowrap">House Cup Leaderboard</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm md:text-lg flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400 shrink-0" />
          <span>Live standings updated in real-time</span>
        </p>
      </div>

      {/* Leaderboard */}
      <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-8">
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          {sortedHouses.map((house, index) => (
            <div
              key={house.id}
              className={`flex items-center justify-between p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl transition-all duration-200 border ${
                index < 3 
                  ? `bg-linear-to-r ${getRankColor(index)}` 
                  : 'glass-dark hover:bg-white/5 border-slate-700'
              }`}
            >
              {/* Left Section - Rank, Icon, and House Info */}
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0">
                {/* Rank Badge */}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
                  index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                  index === 1 ? 'bg-green-400/20 border border-green-400/30' :
                  index === 2 ? 'bg-blue-400/20 border border-blue-400/30' : 
                  'bg-slate-600/50 border border-slate-500/30'
                }`}>
                  {getRankIcon(index)}
                </div>

                {/* House Icon */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 ${house.bgColor} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
                  <img
                    src={house.icon}
                    alt={house.name}
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<svg class="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>';
                    }}
                  />
                </div>
                
                {/* House Info */}
                <div className="min-w-0 flex-1">
                  <h3 className={`text-base sm:text-lg md:text-3xl font-bold text-${house.color} truncate`}>
                    {house.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Users className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-400 text-[10px] sm:text-xs md:text-sm truncate">
                      House Members
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section - Points Display */}
              <div className="text-right ml-2 sm:ml-4 shrink-0">
                <div className="flex items-center justify-end gap-1 sm:gap-2 mb-0.5">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-400 shrink-0" />
                  <div className="text-lg sm:text-xl md:text-3xl font-bold text-white whitespace-nowrap">
                    {house.totalPoints}
                  </div>
                </div>
                <div className="text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
                  POINTS
                </div>
                {index < 3 && (
                  <div className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' : 'text-amber-400'
                  }`}>
                    {index === 0 ? (
                      <>
                        <Crown className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                        <span className="hidden xs:inline">CHAMPION</span>
                        <span className="xs:hidden">1ST</span>
                      </>
                    ) : index === 1 ? (
                      <>
                        <Award className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                        <span className="hidden xs:inline">RUNNER UP</span>
                        <span className="xs:hidden">2ND</span>
                      </>
                    ) : (
                      <>
                        <Medal className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                        <span className="hidden xs:inline">THIRD PLACE</span>
                        <span className="xs:hidden">3RD</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
};

export default Leaderboard;