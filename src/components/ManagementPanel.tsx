import React, { useState, useMemo } from 'react';
import { Participant, Buzz, Round, EventSettings } from '../types';
import { api } from '../services/api';
import { soundEffects } from '../services/audio';
import { RIDDLES_DATA } from '../data/riddles';
import {
  Lock,
  Play,
  Square,
  RotateCcw,
  PlusCircle,
  QrCode,
  Users,
  Search,
  Download,
  Trash2,
  Trophy,
  Flame,
  Radio,
  CheckCircle,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Shield,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface ManagementPanelProps {
  settings?: EventSettings;
  participants?: Participant[];
  currentRound?: Round;
  buzzes?: Buzz[];
  topBuzzes?: Buzz[];
  onOpenQr: () => void;
  onNavigateToWinner: (name: string, rollNumber?: string) => void;
}

export const ManagementPanel: React.FC<ManagementPanelProps> = ({
  settings,
  participants = [],
  currentRound,
  buzzes = [],
  topBuzzes = [],
  onOpenQr,
  onNavigateToWinner,
}) => {
  // Organizer Login State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('peaceday_mgmt_auth') === 'true';
  });
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Search & Filter in Participants Table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Action status message
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const res = await api.managementLogin(password, username);
      if (res.success) {
        setIsAuthenticated(true);
        localStorage.setItem('peaceday_mgmt_auth', 'true');
        soundEffects.playSuccessChime();
      } else {
        setAuthError(res.message || 'Invalid username or password. Default passcode: peace2026');
      }
    } catch {
      setAuthError('Connection error during login. Try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('peaceday_mgmt_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  // Management Action Handlers
  const handleToggleRegistration = async () => {
    try {
      const res = await api.toggleRegistration();
      showFeedback(`Registration is now ${res.registrationOpen ? 'OPEN' : 'CLOSED'}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartBuzzer = async () => {
    setIsActionLoading(true);
    soundEffects.playBuzzerLive();
    try {
      await api.startBuzzer();
      showFeedback(`Buzzer STARTED for Round #${currentRound?.roundNumber || 1}!`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStopBuzzer = async () => {
    setIsActionLoading(true);
    try {
      await api.stopBuzzer();
      showFeedback(`Buzzer STOPPED for Round #${currentRound?.roundNumber || 1}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetBuzzer = async () => {
    if (window.confirm('Reset buzzer buzzes for current round?')) {
      setIsActionLoading(true);
      try {
        await api.resetBuzzer();
        showFeedback(`Buzzer reset for current round.`);
      } catch (e) {
        console.error(e);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleNextRound = async () => {
    const nextNum = (currentRound?.roundNumber || 1) + 1;
    if (window.confirm(`Start Round #${nextNum}? This will reset the live buzzer list.`)) {
      setIsActionLoading(true);
      try {
        await api.newRound(nextNum);
        showFeedback(`Round #${nextNum} started successfully!`);
      } catch (e) {
        console.error(e);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleRemoveParticipant = async (id: string, name: string) => {
    if (window.confirm(`Remove ${name} from registered participants?`)) {
      try {
        await api.removeParticipant(id);
        showFeedback(`Participant ${name} removed.`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleExportCsv = () => {
    if (participants.length === 0) {
      alert('No participants to export yet!');
      return;
    }

    const headers = ['#', 'Full Name', 'Roll Number', 'Department', 'Registered At'];
    const rows = participants.map((p, idx) => [
      idx + 1,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.rollNumber}"`,
      `"${p.department}"`,
      `"${new Date(p.registeredAt).toLocaleTimeString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `peace_day_participants_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmergencyResetAll = async () => {
    const pass = window.prompt('Type "RESET" to wipe all participants and restart the entire event from Round 1:');
    if (pass === 'RESET') {
      await api.resetAll();
      showFeedback('Entire system reset.');
    }
  };

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === 'ALL' || p.department.toUpperCase() === deptFilter.toUpperCase();
      return matchQuery && matchDept;
    });
  }, [participants, searchQuery, deptFilter]);

  // Unique departments for filter dropdown
  const departmentsList = useMemo(() => {
    const set = new Set(participants.map((p) => p.department));
    return Array.from(set).filter(Boolean);
  }, [participants]);

  const firstBuzzer = topBuzzes.length > 0 ? topBuzzes[0] : null;

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/40 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 text-left">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white font-gaming">
                EVENT MANAGEMENT LOGIN
              </h2>
              <p className="text-xs text-cyan-300">
                Peace Day Gaming Committee Access
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-6">
            Enter the organizer credentials to access the live buzzer monitor, round controls, and participant database.
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 font-gaming">
                Username / Role
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 font-gaming">
                Management Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-mono"
              />
              <p className="text-[11px] text-cyan-400/80 mt-1">
                Default event passcode: <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-200">peace2026</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm tracking-wider font-gaming shadow-xl shadow-cyan-600/30 transition transform active:scale-98 disabled:opacity-50"
            >
              {isLoggingIn ? 'AUTHENTICATING...' : 'ENTER MANAGEMENT DECK'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // AUTHENTICATED MANAGEMENT DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-2xl">
            🎛
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-gaming">
                MANAGEMENT DASHBOARD
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Organizers Only
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-Time Round Control, Live Buzzer Monitor & Participant Registrar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={onOpenQr}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>PROJECTOR QR</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            title="Log out of management panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Action Toast Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-cyan-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 4 EVENT STATUS TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Registration Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-gaming block mb-1">
            Registration Status
          </span>
          <div className="flex items-center justify-between">
            <span
              className={`text-lg sm:text-xl font-black font-gaming ${
                settings?.registrationOpen ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {settings?.registrationOpen ? '🟢 OPEN' : '🔴 CLOSED'}
            </span>
            <button
              onClick={handleToggleRegistration}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Toggle
            </button>
          </div>
        </div>

        {/* Tile 2: Buzzer Status */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-md transition ${
            settings?.buzzerActive
              ? 'bg-red-950/50 border-red-500/50 shadow-red-950/50'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-gaming block mb-1">
            Buzzer State
          </span>
          <div className="flex items-center justify-between">
            <span
              className={`text-lg sm:text-xl font-black font-gaming flex items-center gap-1.5 ${
                settings?.buzzerActive ? 'text-red-400 animate-pulse' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  settings?.buzzerActive ? 'bg-red-500 animate-ping' : 'bg-slate-600'
                }`}
              ></span>
              {settings?.buzzerActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
            <span className="text-xs font-mono text-slate-400 font-bold">
              {buzzes.length} buzz{buzzes.length === 1 ? '' : 'es'}
            </span>
          </div>
        </div>

        {/* Tile 3: Registered Players */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-gaming block mb-1">
            Registered Players
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl font-black text-purple-300 font-gaming">
              👥 {participants.length}
            </span>
            <button
              onClick={onOpenQr}
              className="text-xs px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 font-medium"
            >
              Show QR
            </button>
          </div>
        </div>

        {/* Tile 4: Current Round */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-gaming block mb-1">
            Current Round
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-gaming font-mono">
              #{String(currentRound?.roundNumber || 1).padStart(2, '0')}
            </span>
            <button
              onClick={handleNextRound}
              className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium flex items-center gap-1"
            >
              <span>+ Next</span>
            </button>
          </div>
        </div>
      </div>

      {/* ROUND ACTION CONTROL BAR */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 font-gaming">
                ROUND {String(currentRound?.roundNumber || 1).padStart(2, '0')} CONTROLS
              </span>
              <span className="text-xs text-slate-400">
                Riddle #{settings?.activeRiddleId || 1}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              Start buzzer when riddle is announced. Students can only buzz while active.
            </p>
          </div>

          {/* Quick Round Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!settings?.buzzerActive ? (
              <button
                onClick={handleStartBuzzer}
                disabled={isActionLoading}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm tracking-wider font-gaming shadow-xl shadow-emerald-600/30 transition transform active:scale-95"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>START BUZZER</span>
              </button>
            ) : (
              <button
                onClick={handleStopBuzzer}
                disabled={isActionLoading}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm tracking-wider font-gaming shadow-xl shadow-red-600/30 transition transform active:scale-95 animate-pulse"
              >
                <Square className="w-5 h-5 fill-white" />
                <span>STOP BUZZER</span>
              </button>
            )}

            <button
              onClick={handleResetBuzzer}
              disabled={isActionLoading}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm font-gaming transition"
              title="Clear all buzzes for this round"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>RESET BUZZER</span>
            </button>

            <button
              onClick={handleNextRound}
              disabled={isActionLoading}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 font-bold text-xs sm:text-sm font-gaming transition"
            >
              <PlusCircle className="w-4 h-4 text-purple-300" />
              <span>NEXT ROUND</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE BUZZER MONITOR (THE MOST VISUALLY PROMINENT SECTION!) */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-red-500/40 p-6 sm:p-8 shadow-2xl shadow-red-950/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-xl">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-gaming tracking-wide">
                  LIVE BUZZER MONITOR
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    settings?.buzzerActive
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings?.buzzerActive ? 'LIVE ACTIVE' : 'ROUND IDLE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditorium Host Screen • Millisecond Precision Order
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Total Buzzes in Round #{currentRound?.roundNumber}:</span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
              {buzzes.length}
            </span>
          </div>
        </div>

        {/* 🥇 FIRST BUZZ PROMINENT HERO CARD */}
        {firstBuzzer ? (
          <div className="mb-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-yellow-950/40 to-slate-900 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/20 relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-4xl sm:text-5xl shadow-xl shadow-amber-400/40 shrink-0">
                  🥇
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 font-gaming animate-pulse">
                      🏆 FIRST BUZZ! PASS MICROPHONE!
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      +{ (firstBuzzer.timeFromStartMs / 1000).toFixed(3) }s
                    </span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-gaming tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-yellow-300">
                    {firstBuzzer.participantName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-slate-300 font-medium">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono font-bold text-amber-300">
                      ROLL: {firstBuzzer.rollNumber}
                    </span>
                    <span>DEPT: {firstBuzzer.department}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">
                      Time: {new Date(firstBuzzer.timestamp).toLocaleTimeString()}.{String(new Date(firstBuzzer.timestamp).getMilliseconds()).padStart(3, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action to trigger Winner Reveal Screen */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => onNavigateToWinner(firstBuzzer.participantName, firstBuzzer.rollNumber)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm font-gaming shadow-xl shadow-amber-400/30 transition transform hover:scale-105"
                >
                  <Trophy className="w-4 h-4 fill-slate-950" />
                  <span>REVEAL AS WINNER 🎉</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400">
            <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
            <p className="text-base font-gaming text-slate-300 font-bold">
              {settings?.buzzerActive
                ? 'BUZZER IS LIVE! Waiting for participants to smash the buzzer...'
                : 'No buzzes yet. Press "START BUZZER" above to activate the buzzers for all participants!'}
            </p>
          </div>
        )}

        {/* REMAINING TOP BUZZERS LIST */}
        {topBuzzes.length > 1 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-gaming mb-3">
              RUNNER-UP BUZZERS (ORDER OF SPEED)
            </h4>
            <div className="space-y-2">
              {topBuzzes.slice(1).map((b, idx) => {
                const medals = ['🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
                const medal = medals[idx] || `#${idx + 2}`;
                const diffMs = firstBuzzer ? b.timestamp - firstBuzzer.timestamp : 0;

                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs sm:text-sm hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{medal}</span>
                      <div>
                        <div className="font-extrabold text-white font-gaming text-base">
                          {b.participantName}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="font-mono text-slate-300 font-bold">{b.rollNumber}</span>
                          <span>•</span>
                          <span>{b.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400">
                          +{ (diffMs / 1000).toFixed(3) }s
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(b.timestamp).toLocaleTimeString()}.{String(new Date(b.timestamp).getMilliseconds()).padStart(3, '0')}
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigateToWinner(b.participantName, b.rollNumber)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                        title="Select if this student answered correctly"
                      >
                        Winner
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* REGISTERED PARTICIPANTS DIRECTORY TABLE */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white font-gaming">
                REGISTERED PARTICIPANTS
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {participants.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live database of students who scanned the QR code
            </p>
          </div>

          {/* Search, Filter & Export */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or roll..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Depts</option>
              {departmentsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Participants Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase font-gaming text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Participant Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Time Registered</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white font-gaming text-base">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      {p.rollNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{p.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                      {new Date(p.registeredAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemoveParticipant(p.id, p.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Remove participant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No participants matched your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Emergency Reset Deck */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>College Peace Day Gaming Arena System</span>
          <button
            onClick={handleEmergencyResetAll}
            className="text-red-400/70 hover:text-red-400 hover:underline text-xs"
          >
            Emergency System Reset
          </button>
        </div>
      </div>
    </div>
  );
};
