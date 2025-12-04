import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectHouses,
    selectScoringControl,
    startScoringSessionWithControl,
    endScoringSessionWithControl,
    saveAllHousesSingleWrite
} from '../store/slices/quizSlice';
import toast from 'react-hot-toast';

const ScoringControl = () => {
    const dispatch = useDispatch();
    const houses = useSelector(selectHouses);
    const scoringControl = useSelector(selectScoringControl);

    const [loading, setLoading] = useState(false);
    const [selectedHouseId, setSelectedHouseId] = useState('');

    useEffect(() => {
        if (scoringControl.activeHouseId) {
            setSelectedHouseId(scoringControl.activeHouseId);
        }
    }, [scoringControl.activeHouseId]);

    const handleStartScoring = async () => {
        if (!selectedHouseId) {
            toast.error('Please select a house to start scoring');
            return;
        }

        setLoading(true);
        try {
            const result = await dispatch(startScoringSessionWithControl(selectedHouseId));

            if (result.success) {
                toast.success(`Started scoring session for ${result.houseName}`);
                // Save updated house data to Firebase
                await dispatch(saveAllHousesSingleWrite());
            } else {
                toast.error(`Failed to start scoring: ${result.error}`);
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEndScoring = async () => {
        setLoading(true);
        try {
            const result = await dispatch(endScoringSessionWithControl());

            if (result.success) {
                toast.success(`Ended scoring session for ${result.endedHouse}`);
                // Save updated house data to Firebase
                await dispatch(saveAllHousesSingleWrite());
            } else {
                toast.error(`Failed to end scoring: ${result.error}`);
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (startTime) => {
        if (!startTime) return '';

        const duration = Date.now() - startTime;
        const minutes = Math.floor(duration / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return 'Just started';
        }
    };

    const activeHouse = houses.find(h => h.id === scoringControl.activeHouseId);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-6">
                <h1 className="text-2xl font-bold text-white mb-6">Scoring Control Panel</h1>

                {/* Current Status */}
                <div className="mb-8 p-4 bg-slate-800/50 rounded-lg">
                    <h2 className="text-lg font-semibold text-white mb-3">Current Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-700/30 rounded-lg">
                            <p className="text-slate-400 text-sm">Scoring Session</p>
                            <p className={`text-xl font-bold ${scoringControl.status === 'active' ? 'text-green-400' : 'text-slate-300'}`}>
                                {scoringControl.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                            </p>
                        </div>

                        {scoringControl.status === 'active' && activeHouse && (
                            <>
                                <div className="p-3 bg-slate-700/30 rounded-lg">
                                    <p className="text-slate-400 text-sm">Active Scoring House</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className={`w-8 h-8 ${activeHouse.bgColor} rounded-lg flex items-center justify-center`}>
                                            <img
                                                src={activeHouse.icon}
                                                alt={activeHouse.name}
                                                className="w-5 h-5 object-contain"
                                            />
                                        </div>
                                        <p className="text-xl font-bold text-white">{activeHouse.name}</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-700/30 rounded-lg">
                                    <p className="text-slate-400 text-sm">Duration</p>
                                    <p className="text-xl font-bold text-white">
                                        {formatDuration(scoringControl.scoringSessionStartTime)}
                                    </p>
                                </div>

                                <div className="p-3 bg-slate-700/30 rounded-lg">
                                    <p className="text-slate-400 text-sm">Session ID</p>
                                    <p className="text-sm font-mono text-slate-300 truncate">
                                        {scoringControl.sessionId || 'N/A'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Control Panel */}
                <div className="mb-8 p-4 bg-slate-800/50 rounded-lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Control Panel</h2>

                    {scoringControl.status === 'inactive' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-medium mb-2">
                                    Select House to Start Scoring
                                </label>
                                <select
                                    value={selectedHouseId}
                                    onChange={(e) => setSelectedHouseId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                >
                                    <option value="">Select a house...</option>
                                    {houses.filter(h => h.id !== 'media').map(house => (
                                        <option key={house.id} value={house.id}>
                                            {house.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-slate-400 text-xs mt-1">
                                    Media Team cannot be selected as scoring house
                                </p>
                            </div>

                            <button
                                onClick={handleStartScoring}
                                disabled={!selectedHouseId || loading}
                                className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 ${!selectedHouseId || loading
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? 'Starting...' : 'Start Scoring Session'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <span className="text-yellow-400">⚠️</span>
                                    <p className="text-yellow-300">
                                        <span className="font-bold">{activeHouse?.name}</span> is currently scoring.
                                        Other houses can only use the buzzer.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleEndScoring}
                                disabled={loading}
                                className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 ${loading
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? 'Ending...' : 'End Scoring Session'}
                            </button>
                        </div>
                    )}
                </div>

                {/* House Status Grid */}
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h2 className="text-lg font-semibold text-white mb-4">House Status</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {houses.map(house => (
                            <div
                                key={house.id}
                                className={`p-4 rounded-lg border transition-all duration-200 ${house.isScoring
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-slate-700/30 border-slate-600/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center space-y-2">
                                    <div className={`w-12 h-12 ${house.bgColor} rounded-lg flex items-center justify-center`}>
                                        <img
                                            src={house.icon}
                                            alt={house.name}
                                            className="w-8 h-8 object-contain"
                                        />
                                    </div>
                                    <p className="text-white font-medium text-center">{house.name}</p>
                                    <div className="flex items-center space-x-1">
                                        <div className={`w-2 h-2 rounded-full ${house.isScoring ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                                        <span className={`text-xs ${house.isScoring ? 'text-green-400' : 'text-slate-400'}`}>
                                            {house.isScoring ? 'Scoring' : 'Idle'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 className="text-blue-400 font-semibold mb-2">How it works:</h3>
                    <ul className="text-slate-300 text-sm space-y-1">
                        <li>• Only one house can score at a time</li>
                        <li>• When a house is scoring, only that house can access Quiz Scoring and Target Selection</li>
                        <li>• Other houses can only use the buzzer</li>
                        <li>• Admin can manually start/end scoring sessions</li>
                        <li>• Session ends only when admin clicks "End Scoring Session"</li>
                        <li>• Media Team cannot be selected as scoring house</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ScoringControl;