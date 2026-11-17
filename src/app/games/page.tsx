'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Gamepad2, 
  ArrowLeft, 
  Timer, 
  Flame, 
  Lightbulb, 
  Shuffle, 
  Play, 
  Pause, 
  RotateCcw, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Volume2, 
  VolumeX, 
  Crown,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { getAllMembers, addPointEvent } from '@/lib/firestore';
import { Member } from '@/types';
import BotAvatar from '@/components/BotAvatar';
import confetti from 'canvas-confetti';

type GameMode = 'hub' | 'impromptu' | 'hottake' | 'pitch';

// Bank of Curated Presentation Challenges
const IMPROMPTU_TOPICS = [
  "Why failure in a presentation is 100x better than being boring",
  "Convince us that aliens already visited Earth and left immediately",
  "Explain what Enactus does to a 5-year-old child in 60 seconds",
  "Why silence and intentional pausing is the ultimate stage power move",
  "The worst presentation mistake you ever saw and what we learned from it",
  "Why genuine storytelling beats raw statistics every single time",
  "If everyone lost the ability to speak for one week, what would happen?",
  "Why stage fright is actually your brain trying to give you superpowers",
  "If you were Enactus President for 24 hours, what rule would you make?",
  "Why body language speaks louder than any slide design"
];

const HOT_TAKES = [
  "All PowerPoint bullet points should be banned by international law",
  "Meetings should be completely replaced by 30-second voice notes",
  "Introverts actually make far better keynote speakers than extroverts",
  "Zero preparation produces a more authentic speech than rehearsing 10 times",
  "Nobody should ever start a speech with 'Good morning ladies and gentlemen'",
  "Humor in a business pitch is more important than financial projections",
  "Reading off note cards should result in immediate speech disqualification",
  "Every presentation slide should have a strict maximum of 3 words",
  "Remote Zoom presentations are more effective than in-person stage speeches",
  "Stage charisma is 100% learned; nobody is born a great speaker"
];

const PITCH_PRODUCTS = [
  { name: "Invisible Umbrella", pitch: "Keeps you 100% dry using silent reverse aerodynamic airflow." },
  { name: "Anti-Procrastination Pillow", pitch: "Screams energetic motivational speeches the second you try to nap." },
  { name: "Glow-in-the-Dark Socks", pitch: "Designed specifically for finding the fridge at 2:00 AM without stubbing your toe." },
  { name: "Diet Water", pitch: "0% extra wetness for ultra-efficient hydration." },
  { name: "Bluetooth Toothbrush", pitch: "Automatically tweets your dental hygiene score to your followers every morning." },
  { name: "Soundproof Chewing Gum", pitch: "Absorbs all mouth noise so you can chew during intense client pitches." },
  { name: "AI Cat Translator", pitch: "Translates your pet's meows directly into corporate buzzwords." },
  { name: "Inflatable Stage Suit", pitch: "Instantly inflates to 3x your size to assert dominance in any conference room." },
  { name: "Smart Coffee Mug", pitch: "Rapidly cools your coffee if your presentation runs over time." },
  { name: "The Teleprompter Glasses", pitch: "Subtly projects presentation punchlines onto your retina." }
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameMode>('hub');
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Speaker Selection
  const [selectedSpeaker, setSelectedSpeaker] = useState<Member | null>(null);
  const [isSpinningSpeaker, setIsSpinningSpeaker] = useState(false);

  // Active Challenge Prompt
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [currentProduct, setCurrentProduct] = useState<{ name: string; pitch: string } | null>(null);

  // Timer State
  const [duration, setDuration] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Points Awarding
  const [pointsSuccess, setPointsSuccess] = useState<string>('');
  const [awardingPoints, setAwardingPoints] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMembers();
    checkRole();
  }, []);

  const checkRole = () => {
    try {
      const saved = localStorage.getItem('enactus_member');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'ENC-2302' || parsed.role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const all = await getAllMembers();
      const valid = all.filter((m) => m.id !== 'ENC-2302');
      setMembers(valid);
      if (valid.length > 0 && !selectedSpeaker) {
        setSelectedSpeaker(valid[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Sound Synthesizer via Web Audio API (Zero external assets needed)
  const playBeep = (freq = 440, type: OscillatorType = 'sine', durationSec = 0.1) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + durationSec);
    } catch (e) {
      // Audio might be blocked until user interacts
    }
  };

  // Timer Tick Mechanism
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsRunning(false);
            setIsFinished(true);
            playBeep(880, 'triangle', 0.4);
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
            return 0;
          }
          if (prev <= 4) {
            playBeep(520, 'sine', 0.08);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  // Select Game Mode
  const handleLaunchGame = (mode: GameMode) => {
    setActiveGame(mode);
    setIsRunning(false);
    setIsFinished(false);
    setPointsSuccess('');

    if (mode === 'impromptu') {
      setDuration(60);
      setTimeLeft(60);
      rollImpromptuTopic();
    } else if (mode === 'hottake') {
      setDuration(45);
      setTimeLeft(45);
      rollHotTake();
    } else if (mode === 'pitch') {
      setDuration(30);
      setTimeLeft(30);
      rollPitchProduct();
    }
  };

  // Topic Rollers
  const rollImpromptuTopic = () => {
    const picked = IMPROMPTU_TOPICS[Math.floor(Math.random() * IMPROMPTU_TOPICS.length)];
    setCurrentPrompt(picked);
  };

  const rollHotTake = () => {
    const picked = HOT_TAKES[Math.floor(Math.random() * HOT_TAKES.length)];
    setCurrentPrompt(picked);
  };

  const rollPitchProduct = () => {
    const picked = PITCH_PRODUCTS[Math.floor(Math.random() * PITCH_PRODUCTS.length)];
    setCurrentProduct(picked);
  };

  // Random Speaker Spinner
  const spinRandomSpeaker = () => {
    if (members.length === 0) return;
    setIsSpinningSpeaker(true);
    let count = 0;
    const interval = setInterval(() => {
      const randomMember = members[Math.floor(Math.random() * members.length)];
      setSelectedSpeaker(randomMember);
      count++;
      if (count > 12) {
        clearInterval(interval);
        setIsSpinningSpeaker(false);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    }, 100);
  };

  // Timer Controls
  const toggleTimer = () => {
    if (timeLeft === 0) {
      resetTimer();
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(duration);
  };

  // Points Awarding
  const handleAwardPoints = async (amount: number, label: string) => {
    if (!selectedSpeaker) {
      alert('Please select a speaker first!');
      return;
    }

    setAwardingPoints(true);
    try {
      const gameTitle = 
        activeGame === 'impromptu' 
          ? 'Impromptu 60s Speech' 
          : activeGame === 'hottake' 
          ? 'Hot Take 45s Defense' 
          : '30s Product Pitch';

      const reason = `Game Center [${gameTitle}]: ${label}`;
      await addPointEvent(selectedSpeaker.id, selectedSpeaker.name, amount, reason);

      setPointsSuccess(`Awarded +${amount} pts to ${selectedSpeaker.name}! 🎉`);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
      setTimeout(() => setPointsSuccess(''), 4500);
    } catch (err: any) {
      alert('Error awarding points: ' + err.message);
    } finally {
      setAwardingPoints(false);
    }
  };

  // Timer Progress Calculation
  const progressPercent = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const isUrgent = timeLeft <= 10 && timeLeft > 0;

  // ==========================================
  // VIEW: GAME SELECTION HUB
  // ==========================================
  if (activeGame === 'hub') {
    return (
      <div className="space-y-6 pb-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-yellow-400" />
                <span>Presentations Game Center</span>
              </h1>
              <p className="text-xs text-slate-400">Live speech battles, rapid timers & fun challenges</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 rounded-full text-[10px] font-black uppercase tracking-wider">
            V1 LIVE
          </span>
        </div>

        {/* Hero Card */}
        <div className="p-5 bg-gradient-to-br from-yellow-500/20 via-amber-600/10 to-slate-900 border-2 border-yellow-400/50 rounded-3xl space-y-2 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 text-slate-950 rounded-2xl shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Stage Presence Arcade</h2>
              <p className="text-xs text-yellow-300/80">3 High-Energy Challenges for Today&apos;s Session</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            Pick a game below, spin a random participant, start the countdown, and award bonus points on the spot!
          </p>
        </div>

        {/* Game 1: Impromptu Timer */}
        <div
          onClick={() => handleLaunchGame('impromptu')}
          className="p-4 bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-yellow-400/80 rounded-3xl transition-all cursor-pointer group shadow-lg flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Timer className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors truncate">
                  Impromptu Timer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-400/20 text-yellow-400 font-mono">
                  60s
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                Random prompt appears. Speaker has 60 seconds to speak fluently and persuasively.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-yellow-400 transition-colors flex-shrink-0" />
        </div>

        {/* Game 2: Hot Take Roulette */}
        <div
          onClick={() => handleLaunchGame('hottake')}
          className="p-4 bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-amber-400/80 rounded-3xl transition-all cursor-pointer group shadow-lg flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
                  Hot Take Roulette
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400/20 text-amber-400 font-mono">
                  45s
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                Spin an unpopular or controversial stance. Defend it with maximum conviction for 45 seconds!
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
        </div>

        {/* Game 3: Pitch in 30 */}
        <div
          onClick={() => handleLaunchGame('pitch')}
          className="p-4 bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-indigo-400/80 rounded-3xl transition-all cursor-pointer group shadow-lg flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors truncate">
                  Pitch in 30
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-400/20 text-indigo-400 font-mono">
                  30s
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                A bizarre product is revealed. Pitch it as the next \$10B startup breakthrough in 30 seconds!
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: ACTIVE GAME ARENA
  // ==========================================
  const gameTitles = {
    impromptu: { title: "Impromptu 60s Speech", icon: Timer, color: "text-yellow-400", border: "border-yellow-400/60" },
    hottake: { title: "Hot Take Roulette", icon: Flame, color: "text-amber-400", border: "border-amber-400/60" },
    pitch: { title: "Pitch in 30", icon: Lightbulb, color: "text-indigo-400", border: "border-indigo-400/60" },
  };

  const activeMeta = gameTitles[activeGame];
  const GameIcon = activeMeta.icon;

  return (
    <div className="space-y-4 pb-8">
      {/* Game Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveGame('hub')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Game Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <span className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold font-mono">
            {duration}s Round
          </span>
        </div>
      </div>

      {pointsSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{pointsSuccess}</span>
        </div>
      )}

      {/* SPEAKER CARD & RANDOM SPINNER */}
      <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-yellow-400" />
            <span>Active Speaker</span>
          </span>

          <button
            onClick={spinRandomSpeaker}
            disabled={isSpinningSpeaker || members.length === 0}
            className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer"
          >
            <Shuffle className={`w-3.5 h-3.5 ${isSpinningSpeaker ? 'animate-spin' : ''}`} />
            <span>{isSpinningSpeaker ? 'Spinning...' : 'Random Speaker'}</span>
          </button>
        </div>

        {selectedSpeaker ? (
          <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-3 min-w-0">
              <BotAvatar config={selectedSpeaker.avatar} size="sm" />
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                  <span>{selectedSpeaker.name}</span>
                  {selectedSpeaker.titleBadge && (
                    <span className="px-1.5 py-0.2 text-[8px] bg-amber-400/20 text-amber-300 rounded-full">
                      {selectedSpeaker.titleBadge}
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {selectedSpeaker.id} • {selectedSpeaker.totalPoints || 0} pts
                </p>
              </div>
            </div>

            {/* Quick Switch Dropdown */}
            <select
              value={selectedSpeaker.id}
              onChange={(e) => {
                const found = members.find((m) => m.id === e.target.value);
                if (found) setSelectedSpeaker(found);
              }}
              className="text-[10px] bg-slate-800 border border-slate-700 rounded-lg text-slate-300 px-2 py-1 max-w-[110px] truncate"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-2">No members available</p>
        )}
      </div>

      {/* CHALLENGE PROMPT CARD */}
      <div className="p-4 bg-slate-800/80 border-2 border-slate-700/80 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GameIcon className={`w-4 h-4 ${activeMeta.color}`} />
            <span className="text-xs font-black text-white">{activeMeta.title}</span>
          </div>

          <button
            onClick={() => {
              if (activeGame === 'impromptu') rollImpromptuTopic();
              else if (activeGame === 'hottake') rollHotTake();
              else if (activeGame === 'pitch') rollPitchProduct();
            }}
            className="text-[11px] text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reroll Prompt</span>
          </button>
        </div>

        {/* Prompt Content */}
        {activeGame === 'pitch' && currentProduct ? (
          <div className="space-y-1 bg-slate-900/90 p-3.5 rounded-2xl border border-indigo-500/30">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
              Product to Pitch in 30s:
            </span>
            <h3 className="text-base font-black text-white">
              ✨ {currentProduct.name}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              &quot;{currentProduct.pitch}&quot;
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              {activeGame === 'hottake' ? 'Defend This Hot Take:' : 'Speaking Prompt:'}
            </span>
            <p className="text-sm font-extrabold text-white leading-relaxed">
              &quot;{currentPrompt}&quot;
            </p>
          </div>
        )}
      </div>

      {/* CIRCULAR / PROGRESS COUNTDOWN TIMER */}
      <div className={`p-6 rounded-3xl border-2 transition-all text-center space-y-4 shadow-xl ${
        isFinished 
          ? 'bg-rose-500/10 border-rose-500/60'
          : isUrgent 
          ? 'bg-amber-500/10 border-amber-500/60 animate-pulse'
          : 'bg-slate-800/60 border-slate-700/80'
      }`}>
        {/* Large Time Display */}
        <div className="space-y-1">
          <span className={`text-5xl font-black font-mono tracking-tight ${
            isFinished 
              ? 'text-rose-400' 
              : isUrgent 
              ? 'text-amber-400' 
              : 'text-white'
          }`}>
            {timeLeft}s
          </span>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            {isFinished ? "⏰ Time's Up! Give Feedback & Award Points" : isRunning ? "Speaker in the spotlight! 🎤" : "Ready when you are!"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
          <div
            className={`h-full transition-all duration-300 ${
              isFinished 
                ? 'bg-rose-500' 
                : isUrgent 
                ? 'bg-amber-400' 
                : 'bg-gradient-to-r from-yellow-400 to-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={toggleTimer}
            className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{timeLeft === 0 ? 'Restart Round' : 'Start Timer'}</span>
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="p-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* INSTANT POINTS PRESET AWARDS */}
      <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-yellow-400" />
            <span>Award Bonus Points to {selectedSpeaker?.name || 'Speaker'}</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">1-Click</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={awardingPoints || !selectedSpeaker}
            onClick={() => handleAwardPoints(5, 'Great Effort & Energy! ⚡')}
            className="p-2.5 bg-slate-900 hover:bg-yellow-400/10 border border-slate-700 hover:border-yellow-400/50 rounded-xl text-center space-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-yellow-400 font-black text-xs block">+5 pts</span>
            <span className="text-[9px] text-slate-400 block truncate">Good Energy ⚡</span>
          </button>

          <button
            type="button"
            disabled={awardingPoints || !selectedSpeaker}
            onClick={() => handleAwardPoints(10, 'Impressive Flow & Persuasion! ⭐')}
            className="p-2.5 bg-slate-900 hover:bg-amber-400/10 border border-slate-700 hover:border-amber-400/50 rounded-xl text-center space-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-amber-400 font-black text-xs block">+10 pts</span>
            <span className="text-[9px] text-slate-400 block truncate">Great Flow ⭐</span>
          </button>

          <button
            type="button"
            disabled={awardingPoints || !selectedSpeaker}
            onClick={() => handleAwardPoints(15, 'Masterclass Stage Delivery! 👑')}
            className="p-2.5 bg-slate-900 hover:bg-emerald-400/10 border border-slate-700 hover:border-emerald-400/50 rounded-xl text-center space-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-emerald-400 font-black text-xs block">+15 pts</span>
            <span className="text-[9px] text-slate-400 block truncate">Masterclass 👑</span>
          </button>
        </div>
      </div>
    </div>
  );
}
