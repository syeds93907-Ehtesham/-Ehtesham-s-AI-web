import React, { useState, useEffect } from 'react';
import { Participant, EventSettings, Buzz, Round } from '../types';
import { api } from '../services/api';
import { soundEffects } from '../services/audio';
import { Flame, Trophy, Shield, User, Award, CheckCircle2, AlertCircle, RefreshCw, Smartphone, Zap } from 'lucide-react';

interface PlayerBuzzerProps {
  settings?: EventSettings;
  currentRound?: Round;
  buzzes?: Buzz[];
}

export const PlayerBuzzer: React.FC<PlayerBuzzerProps> = ({ settings, currentRound, buzzes = [] }) => {
  // Saved participant in localStorage
  const [participant, setParticipant] = useState<Participant | null>(() => {
    try {
      const saved = localStorage.getItem('peaceday_participant');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Registration Form State
  const [fullName, setFullName] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [department, setDepartment] = useState<string>('CSE');
  const [formError, setFormError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Buzz state for current participant
  const [buzzStatus, setBuzzStatus] = useState<{
    buzzed: boolean;
    position?: number;
    message?: string;
  }>({ buzzed: false });
  const [isSubmittingBuzz, setIsSubmittingBuzz] = useState<boolean>(false);

  // Check if current participant has buzzed in current round
  useEffect(() => {
    if (participant && currentRound) {
      const userBuzz = buzzes.find(
        (b) =>
          b.roundId === currentRound.roundNumber &&
          (b.participantId === participant.id || b.rollNumber.toUpperCase() === participant.rollNumber.toUpperCase())
      );

      if (userBuzz) {
        setBuzzStatus({
          buzzed: true,
          position: userBuzz.position,
          message:
            userBuzz.position === 1
              ? '🏆 FIRST BUZZ! The host has called on you!'
              : `Buzzed! Ranked #${userBuzz.position} in Round ${currentRound.roundNumber}`,
        });
      } else {
        setBuzzStatus({ buzzed: false });
      }
    }
  }, [buzzes, currentRound, participant]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = fullName.trim();
    const cleanRoll = rollNumber.trim().toUpperCase();

    if (!cleanName || !cleanRoll) {
      setFormError('Please enter both your Full Name and Roll Number.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await api.register(cleanName, cleanRoll, department);
      if (res.success && res.participant) {
        setParticipant(res.participant);
        localStorage.setItem('peaceday_participant', JSON.stringify(res.participant));
        soundEffects.playBuzzPressed();
      } else {
        setFormError(res.message || 'Registration failed. Roll number may already be registered.');
      }
    } catch {
      setFormError('Connection error. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleBuzz = async () => {
    if (!participant || !settings?.buzzerActive || buzzStatus.buzzed || isSubmittingBuzz) {
      return;
    }

    setIsSubmittingBuzz(true);

    // Audio & Haptic vibration on phone
    soundEffects.playBuzzPressed();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 150]);
      } catch {
        // Safe catch for browsers that restrict vibrate
      }
    }

    try {
      const roundId = currentRound?.roundNumber || 1;
      const res = await api.buzz(participant.id, participant.rollNumber, roundId);
      if (res.success) {
        setBuzzStatus({
          buzzed: true,
          position: res.position,
          message: res.message,
        });
      } else {
        setBuzzStatus({
          buzzed: true,
          message: res.message || 'You already buzzed in this round.',
        });
      }
    } catch {
      setBuzzStatus({
        buzzed: false,
        message: 'Network issue. Try buzzing again!',
      });
    } finally {
      setIsSubmittingBuzz(false);
    }
  };

  const handleSwitchPlayer = () => {
    if (window.confirm('Do you want to switch or register as a different student?')) {
      localStorage.removeItem('peaceday_participant');
      setParticipant(null);
      setBuzzStatus({ buzzed: false });
    }
  };

  // SCREEN 1: REGISTRATION FORM (If not yet registered)
  if (!participant) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/40 border-2 border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/50 text-left">
          {/* Badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 font-gaming">
              <Smartphone className="w-3.5 h-3.5" />
              Audience Arena
            </span>
            <span className="text-xs font-mono text-slate-400">
              {settings?.registrationOpen ? '🟢 Registration Open' : '🔴 Closed'}
            </span>
          </div>

          <h2 className="text-3xl font-black text-white font-gaming tracking-tight">
            PEACE DAY BUZZER
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Register yourself before the game starts. Think fast, buzz faster!
          </p>

          {formError && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-gaming">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ahmed Khan"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-base font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-gaming">
                Roll Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 23IT104"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-base font-mono uppercase font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Must be unique. No duplicate roll numbers permitted.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-gaming">
                Department / Branch
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm font-medium"
              >
                <option value="CSE">CSE (Computer Science)</option>
                <option value="IT">IT (Information Tech)</option>
                <option value="ECE">ECE (Electronics & Comm)</option>
                <option value="EEE">EEE (Electrical)</option>
                <option value="MECH">MECH (Mechanical)</option>
                <option value="CIVIL">CIVIL Engineering</option>
                <option value="AI&DS">AI & Data Science</option>
                <option value="MBA/BBA">Management (MBA/BBA)</option>
                <option value="OTHER">Other Department</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isRegistering || !settings?.registrationOpen}
              className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-extrabold text-base tracking-wider font-gaming shadow-xl shadow-purple-600/30 transition transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRegistering ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>REGISTERING...</span>
                </>
              ) : (
                <>
                  <span>REGISTER & ENTER BUZZER</span>
                  <Zap className="w-5 h-5 fill-white" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-400 mt-4">
            College Peace Day Gaming Event • Ready to buzz when host starts round
          </p>
        </div>
      </div>
    );
  }

  // SCREEN 2: ACTIVE BUZZER SCREEN (Registered participant)
  const isBuzzerActive = !!settings?.buzzerActive;

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col justify-between max-w-md mx-auto p-4 sm:p-6 text-center">
      {/* Participant Top Card */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-lg font-bold text-purple-300">
            {participant.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-extrabold text-white flex items-center gap-1.5 font-gaming">
              <span>{participant.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                {participant.rollNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {participant.department} Dept • Round #{currentRound?.roundNumber || 1}
            </p>
          </div>
        </div>

        <button
          onClick={handleSwitchPlayer}
          className="text-xs text-slate-400 hover:text-slate-200 underline font-medium"
          title="Switch roll number / player"
        >
          Switch
        </button>
      </div>

      {/* Main Interactive Buzzer Area */}
      <div className="my-auto py-8 flex flex-col items-center justify-center">
        {/* State Banner */}
        <div className="mb-6">
          {isBuzzerActive ? (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/20 border-2 border-red-500/50 text-red-300 font-bold text-sm tracking-wide font-gaming animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              🔥 BUZZER IS LIVE! SMASH IT!
            </div>
          ) : buzzStatus.buzzed ? (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm font-gaming">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              BUZZ RECORDED FOR ROUND #{currentRound?.roundNumber}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-medium text-xs sm:text-sm font-gaming">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Get ready! The host hasn't started the buzzer yet.
            </div>
          )}
        </div>

        {/* GIANT BUZZER BUTTON */}
        <div className="relative">
          {/* Pulsing ring if buzzer is active */}
          {isBuzzerActive && !buzzStatus.buzzed && (
            <div className="absolute inset-0 rounded-full bg-red-600/30 blur-2xl animate-buzzer-live pointer-events-none" />
          )}

          <button
            onClick={handleBuzz}
            disabled={!isBuzzerActive || buzzStatus.buzzed || isSubmittingBuzz}
            className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex flex-col items-center justify-center text-center p-6 transition-all duration-200 select-none touch-manipulation shadow-2xl ${
              isBuzzerActive && !buzzStatus.buzzed
                ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white cursor-pointer active:scale-90 active:brightness-125 border-8 border-red-400/50 shadow-red-600/50 transform hover:scale-105'
                : buzzStatus.buzzed
                ? 'bg-gradient-to-tr from-emerald-700 to-teal-800 text-emerald-100 border-8 border-emerald-500/40 cursor-default shadow-emerald-900/40'
                : 'bg-gradient-to-tr from-slate-800 via-slate-800 to-slate-900 text-slate-500 border-8 border-slate-700/50 cursor-not-allowed opacity-80'
            }`}
          >
            {/* Inner Ring Glow */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-white/20 flex flex-col items-center justify-center">
              {buzzStatus.buzzed ? (
                <>
                  <Trophy className="w-14 h-14 text-amber-300 mb-2 drop-shadow" />
                  <span className="font-gaming text-2xl font-black text-white">
                    {buzzStatus.position === 1 ? '🏆 1ST BUZZ!' : `#${buzzStatus.position} BUZZED`}
                  </span>
                  <span className="text-xs text-emerald-200 font-semibold mt-1">
                    Wait for Host
                  </span>
                </>
              ) : isBuzzerActive ? (
                <>
                  <span className="text-4xl mb-1">🔴</span>
                  <span className="font-bungee text-3xl sm:text-4xl text-white tracking-wider drop-shadow-md">
                    BUZZ NOW
                  </span>
                  <span className="text-xs text-red-200 uppercase tracking-widest font-bold mt-1">
                    TAP FAST!
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl mb-1 text-slate-500">⏳</span>
                  <span className="font-gaming text-2xl font-black text-slate-400 uppercase tracking-wider">
                    STAND BY
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Waiting for Host...
                  </span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Feedback Message */}
        <div className="mt-8 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-xs text-center">
          {buzzStatus.buzzed ? (
            <div className="text-sm font-semibold text-emerald-300">
              {buzzStatus.message || 'Buzz received! Wait for the host.'}
            </div>
          ) : isBuzzerActive ? (
            <div className="text-sm font-bold text-red-400 animate-bounce">
              ⚡ Round #{currentRound?.roundNumber} is LIVE!
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              "Wait for the host to start the buzzer."
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 text-center text-xs text-slate-400">
        Peace Day Gaming Arena • Roll #{participant.rollNumber}
      </div>
    </div>
  );
};
