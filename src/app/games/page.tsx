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
  ChevronRight,
  RefreshCw,
  Drama,
  Bomb,
  Swords,
  ShieldAlert,
  Trophy
} from 'lucide-react';
import { getAllMembers, addPointEvent } from '@/lib/firestore';
import { Member } from '@/types';
import BotAvatar from '@/components/BotAvatar';
import confetti from 'canvas-confetti';

type GameMode = 'hub' | 'impromptu' | 'hottake' | 'pitch' | 'emotion' | 'bomb' | 'debate';

// ==========================================
// GAME 1: IMPROMPTU TOPICS (60s)
// ==========================================
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

// ==========================================
// GAME 2: HOT TAKES (45s)
// ==========================================
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

// ==========================================
// GAME 3: PITCH IN 30 PRODUCTS (30s)
// ==========================================
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

// ==========================================
// GAME 4: EMOTION SWITCH (40s - 10s shifts)
// ==========================================
const EMOTION_SCENARIOS = [
  "The national competition judges just walked into the room unexpectedly.",
  "Our slide deck was accidentally deleted 5 minutes before the live pitch.",
  "We found a secret way to double our community project impact with zero budget.",
  "I am here to announce the biggest breakthrough in our presentation journey.",
  "Someone ate the coordinator's lunch right before the presentation session.",
  "This is the most critical 40 seconds of our entire committee history."
];

const EMOTION_STEPS = [
  { emotion: "😡 Furious & Fierce", desc: "Speak with fire, clenched teeth, and intense urgency!", bg: "from-rose-600/30 to-red-900/40", border: "border-rose-500" },
  { emotion: "🤩 Over-the-Top Excited", desc: "Pure joy! Big smile, bouncy energy, like you just won the lottery!", bg: "from-amber-500/30 to-yellow-900/40", border: "border-amber-400" },
  { emotion: "🤫 Suspicious Whisper", desc: "Lean in, look around, speak in a conspiratorial detective whisper!", bg: "from-sky-600/30 to-blue-900/40", border: "border-sky-400" },
  { emotion: "🎭 Dramatic Soap Opera", desc: "Heartbroken, theatrical, hand over your heart with dramatic gasps!", bg: "from-purple-600/30 to-fuchsia-900/40", border: "border-purple-400" }
];

// ==========================================
// GAME 5: WORD BOMB (45s)
// ==========================================
const WORD_BOMB_CHALLENGES = [
  { topic: "Why Enactus is life-changing", banned: ["Team", "Project", "Learn"] },
  { topic: "How to introduce yourself to a Fortune 500 CEO", banned: ["Name", "Job", "Work"] },
  { topic: "Describe your favorite food without getting hungry", banned: ["Delicious", "Eat", "Good"] },
  { topic: "Why public speaking is an essential life skill", banned: ["Speech", "Talk", "People"] },
  { topic: "Explaining the internet to someone from the 1800s", banned: ["Phone", "Computer", "Screen"] },
  { topic: "How to survive an awkward silence in a presentation", banned: ["Quiet", "Stop", "Awkward"] },
  { topic: "Why failure is just tuition for future success", banned: ["Mistake", "Fail", "Try"] },
  { topic: "Why presentation slides should look beautiful", banned: ["Slide", "Color", "Look"] }
];

// ==========================================
// GAME 6: DEBATE BLITZ (1v1 - 60s total, 30s each)
// ==========================================
const DEBATE_CHALLENGES = [
  {
    topic: "Rehearsing 20 times vs Winging it with natural charisma",
    sideA: "Rehearsing 20 times produces unmatched precision",
    sideB: "Winging it delivers raw, authentic human connection"
  },
  {
    topic: "Canva vs PowerPoint for presentations",
    sideA: "Canva: Modern, fast, and visually superior templates",
    sideB: "PowerPoint: Battle-tested corporate industry standard"
  },
  {
    topic: "Opening with a Joke vs Opening with a Shocking Stat",
    sideA: "Opening with a Joke breaks the ice immediately",
    sideB: "Opening with a Shocking Stat commands instant authority"
  },
  {
    topic: "Virtual Stage vs In-Person Stage",
    sideA: "Virtual Presentations: Global reach and perfect lighting",
    sideB: "In-Person Stage: Irreplaceable physical presence and energy"
  },
  {
    topic: "1 Slide with 100 Words vs 100 Slides with 1 Word",
    sideA: "1 Detailed Slide: Dense value, nothing omitted",
    sideB: "100 Fast Slides: Dynamic pace, eyes glued to the speaker"
  }
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameMode>('hub');
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Speaker Selection
  const [selectedSpeaker, setSelectedSpeaker] = useState<Member | null>(null);
  const [selectedSpeakerB, setSelectedSpeakerB] = useState<Member | null>(null);
  const [isSpinningSpeaker, setIsSpinningSpeaker] = useState(false);

  // Challenge Prompts
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [currentProduct, setCurrentProduct] = useState<{ name: string; pitch: string } | null>(null);
  const [currentBomb, setCurrentBomb] = useState<{ topic: string; banned: string[] } | null>(null);
  const [currentDebate, setCurrentDebate] = useState<{ topic: string; sideA: string; sideB: string } | null>(null);

  // Timer State
  const [duration, setDuration] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Debate Blitz State
  const [debateTurn, setDebateTurn] = useState<'A' | 'B'>('A');

  // Word Bomb State
  const [bombExploded, setBombExploded] = useState<boolean>(false);

  // Points Awarding
  const [pointsSuccess, setPointsSuccess] = useState<string>('');
  const [awardingPoints, setAwardingPoints] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const all = await getAllMembers();
      const valid = all.filter((m) => m.id !== 'ENC-2302');
      setMembers(valid);
      if (valid.length > 0) {
        setSelectedSpeaker(valid[0]);
        if (valid.length > 1) setSelectedSpeakerB(valid[1]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Sound Synthesizer via Web Audio API
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
          // Emotion Switch audio cue on 10s phase boundaries
          if (activeGame === 'emotion') {
            if (prev === 31 || prev === 21 || prev === 11) {
              playBeep(650, 'triangle', 0.25);
            }
          }

          // Debate switch at halfway (30s)
          if (activeGame === 'debate' && prev === 31) {
            setDebateTurn('B');
            playBeep(700, 'square', 0.3);
            confetti({ particleCount: 30, spread: 50 });
          }

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
  }, [isRunning, timeLeft, activeGame]);

  // Select Game Mode
  const handleLaunchGame = (mode: GameMode) => {
    setActiveGame(mode);
    setIsRunning(false);
    setIsFinished(false);
    setBombExploded(false);
    setPointsSuccess('');
    setDebateTurn('A');

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
    } else if (mode === 'emotion') {
      setDuration(40);
      setTimeLeft(40);
      rollEmotionScenario();
    } else if (mode === 'bomb') {
      setDuration(45);
      setTimeLeft(45);
      rollWordBomb();
    } else if (mode === 'debate') {
      setDuration(60);
      setTimeLeft(60);
      rollDebate();
    }
  };

  // Rollers
  const rollImpromptuTopic = () => {
    setCurrentPrompt(IMPROMPTU_TOPICS[Math.floor(Math.random() * IMPROMPTU_TOPICS.length)]);
  };

  const rollHotTake = () => {
    setCurrentPrompt(HOT_TAKES[Math.floor(Math.random() * HOT_TAKES.length)]);
  };

  const rollPitchProduct = () => {
    setCurrentProduct(PITCH_PRODUCTS[Math.floor(Math.random() * PITCH_PRODUCTS.length)]);
  };

  const rollEmotionScenario = () => {
    setCurrentPrompt(EMOTION_SCENARIOS[Math.floor(Math.random() * EMOTION_SCENARIOS.length)]);
  };

  const rollWordBomb = () => {
    setBombExploded(false);
    setCurrentBomb(WORD_BOMB_CHALLENGES[Math.floor(Math.random() * WORD_BOMB_CHALLENGES.length)]);
  };

  const rollDebate = () => {
    setDebateTurn('A');
    setCurrentDebate(DEBATE_CHALLENGES[Math.floor(Math.random() * DEBATE_CHALLENGES.length)]);
  };

  // Random Speaker Spinner
  const spinRandomSpeaker = (target: 'A' | 'B' = 'A') => {
    if (members.length === 0) return;
    setIsSpinningSpeaker(true);
    let count = 0;
    const interval = setInterval(() => {
      const randomMember = members[Math.floor(Math.random() * members.length)];
      if (target === 'A') setSelectedSpeaker(randomMember);
      else setSelectedSpeakerB(randomMember);
      count++;
      if (count > 12) {
        clearInterval(interval);
        setIsSpinningSpeaker(false);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    }, 100);
  };

  // Spin Both Speakers for Debate
  const spinDebateSpeakers = () => {
    if (members.length < 2) return;
    setIsSpinningSpeaker(true);
    let count = 0;
    const interval = setInterval(() => {
      const idxA = Math.floor(Math.random() * members.length);
      let idxB = Math.floor(Math.random() * members.length);
      if (idxB === idxA) idxB = (idxA + 1) % members.length;

      setSelectedSpeaker(members[idxA]);
      setSelectedSpeakerB(members[idxB]);
      count++;
      if (count > 12) {
        clearInterval(interval);
        setIsSpinningSpeaker(false);
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
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
    setBombExploded(false);
    setDebateTurn('A');
    setTimeLeft(duration);
  };

  // Trigger Word Bomb explosion
  const handleTriggerBomb = () => {
    setIsRunning(false);
    setBombExploded(true);
    playBeep(200, 'sawtooth', 0.5);
  };

  // Points Awarding
  const handleAwardPoints = async (member: Member | null, amount: number, label: string) => {
    if (!member) {
      alert('Please select a speaker first!');
      return;
    }

    setAwardingPoints(true);
    try {
      const gameNames: Record<GameMode, string> = {
        hub: 'Game Hub',
        impromptu: 'Impromptu 60s',
        hottake: 'Hot Take Roulette',
        pitch: 'Pitch in 30',
        emotion: 'Emotion Switch',
        bomb: 'Word Bomb',
        debate: 'Debate Blitz'
      };

      const reason = `Game Center [${gameNames[activeGame]}]: ${label}`;
      await addPointEvent(member.id, member.name, amount, reason);

      setPointsSuccess(`Awarded +${amount} pts to ${member.name}! 🎉`);
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.7 } });
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

  // Emotion Switch Phase Index (0 to 3)
  const currentEmotionPhase = Math.min(3, Math.max(0, Math.floor((40 - timeLeft) / 10)));
  const currentEmotion = EMOTION_STEPS[currentEmotionPhase];

  // ==========================================
  // VIEW: GAME SELECTION HUB (6 GAMES)
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
              <p className="text-xs text-slate-400">6 interactive presentation challenges & speech battles</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 rounded-full text-[10px] font-black uppercase tracking-wider">
            6 GAMES LIVE
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
              <p className="text-xs text-yellow-300/80">Warm-ups, Vocal Variety & Competitive Battles</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            Pick a challenge below, spin random participants, start the countdown, and award real-time bonus points!
          </p>
        </div>

        {/* 6 Game Cards Grid */}
        <div className="grid grid-cols-1 gap-3">
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
                  Random speech topic. Speaker has 60 seconds to speak fluently and persuasively.
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
                  A bizarre product is revealed. Pitch it as a \$10B startup breakthrough in 30 seconds!
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
          </div>

          {/* Game 4: Emotion Switch */}
          <div
            onClick={() => handleLaunchGame('emotion')}
            className="p-4 bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-purple-400/80 rounded-3xl transition-all cursor-pointer group shadow-lg flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform flex-shrink-0">
                <Drama className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors truncate">
                    Emotion Switch
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-400/20 text-purple-400 font-mono">
                    40s
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  The speaker delivers a speech while emotions shift every 10s (Angry ➔ Excited ➔ Whisper ➔ Soap Opera)!
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </div>

          {/* Game 5: Word Bomb */}
          <div
            onClick={() => handleLaunchGame('bomb')}
            className="p-4 bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-rose-400/80 rounded-3xl transition-all cursor-pointer group shadow-lg flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform flex-shrink-0">
                <Bomb className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors truncate">
                    Word Bomb
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-400/20 text-rose-400 font-mono">
                    45s
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  Speak on a topic without uttering 3 forbidden trap words! If you slip, the bomb explodes!
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-rose-400 transition-colors flex-shrink-0" />
          </div>

          {/* Game 6: Debate Blitz */}
          <div
            onClick={() => handleLaunchGame('debate')}
            className="p-4 bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-emerald-400/80 rounded-3xl transition-all cursor-pointer group shadow-lg flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                <Swords className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
                    Debate Blitz (1 vs 1)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-400/20 text-emerald-400 font-mono">
                    60s
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  Two speakers go head-to-head on opposite sides of a debate! 30 seconds each, audience votes winner.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: ACTIVE GAME ARENA
  // ==========================================
  const gameTitles: Record<GameMode, { title: string; icon: any; color: string; border: string }> = {
    hub: { title: "Hub", icon: Gamepad2, color: "text-yellow-400", border: "border-yellow-400" },
    impromptu: { title: "Impromptu 60s Speech", icon: Timer, color: "text-yellow-400", border: "border-yellow-400/60" },
    hottake: { title: "Hot Take Roulette", icon: Flame, color: "text-amber-400", border: "border-amber-400/60" },
    pitch: { title: "Pitch in 30", icon: Lightbulb, color: "text-indigo-400", border: "border-indigo-400/60" },
    emotion: { title: "Emotion Switch", icon: Drama, color: "text-purple-400", border: "border-purple-400/60" },
    bomb: { title: "Word Bomb Challenge", icon: Bomb, color: "text-rose-400", border: "border-rose-400/60" },
    debate: { title: "Debate Blitz (1 vs 1)", icon: Swords, color: "text-emerald-400", border: "border-emerald-400/60" },
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
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
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

      {/* ======================================================== */}
      {/* SPEAKER SECTION: 1v1 for Debate, Single for other games */}
      {/* ======================================================== */}
      {activeGame === 'debate' ? (
        <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
              <span>1 vs 1 Debaters</span>
            </span>

            <button
              onClick={spinDebateSpeakers}
              disabled={isSpinningSpeaker || members.length < 2}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isSpinningSpeaker ? 'animate-spin' : ''}`} />
              <span>{isSpinningSpeaker ? 'Spinning...' : 'Spin Pair'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Speaker A */}
            <div className={`p-2.5 rounded-xl border transition-all ${
              debateTurn === 'A' && isRunning
                ? 'bg-emerald-500/15 border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                : 'bg-slate-900/80 border-slate-700/80'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <BotAvatar config={selectedSpeaker?.avatar} size="sm" />
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-400 font-black block">SIDE A (PRO)</span>
                  <span className="text-xs font-bold text-white truncate block">{selectedSpeaker?.name || 'Speaker A'}</span>
                </div>
              </div>
            </div>

            {/* Speaker B */}
            <div className={`p-2.5 rounded-xl border transition-all ${
              debateTurn === 'B' && isRunning
                ? 'bg-sky-500/15 border-sky-400 shadow-md ring-2 ring-sky-400/40'
                : 'bg-slate-900/80 border-slate-700/80'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <BotAvatar config={selectedSpeakerB?.avatar} size="sm" />
                <div className="min-w-0">
                  <span className="text-[10px] text-sky-400 font-black block">SIDE B (CON)</span>
                  <span className="text-xs font-bold text-white truncate block">{selectedSpeakerB?.name || 'Speaker B'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-yellow-400" />
              <span>Active Speaker</span>
            </span>

            <button
              onClick={() => spinRandomSpeaker('A')}
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
      )}

      {/* ======================================================== */}
      {/* GAME SPECIFIC CHALLENGE PROMPT CARD */}
      {/* ======================================================== */}
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
              else if (activeGame === 'emotion') rollEmotionScenario();
              else if (activeGame === 'bomb') rollWordBomb();
              else if (activeGame === 'debate') rollDebate();
            }}
            className="text-[11px] text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reroll</span>
          </button>
        </div>

        {/* 1. Pitch in 30 prompt */}
        {activeGame === 'pitch' && currentProduct && (
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
        )}

        {/* 2. Word Bomb prompt with banned words */}
        {activeGame === 'bomb' && currentBomb && (
          <div className="space-y-2.5 bg-slate-900/90 p-3.5 rounded-2xl border border-rose-500/40">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Speech Topic (45s):
              </span>
              <h3 className="text-sm font-black text-white">
                &quot;{currentBomb.topic}&quot;
              </h3>
            </div>

            <div className="pt-1 border-t border-slate-800">
              <span className="text-[10px] text-rose-400 font-black uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Bomb className="w-3.5 h-3.5" />
                <span>FORBIDDEN TRAP WORDS (DO NOT SAY):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentBomb.banned.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-black tracking-wider uppercase"
                  >
                    🚫 {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Debate Blitz prompt with 2 sides */}
        {activeGame === 'debate' && currentDebate && (
          <div className="space-y-2.5 bg-slate-900/90 p-3.5 rounded-2xl border border-emerald-500/40">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                Debate Topic:
              </span>
              <h3 className="text-sm font-black text-white">
                &quot;{currentDebate.topic}&quot;
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
                <strong className="block text-emerald-400 text-[10px]">SIDE A ARGUMENT:</strong>
                {currentDebate.sideA}
              </div>
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200">
                <strong className="block text-sky-400 text-[10px]">SIDE B ARGUMENT:</strong>
                {currentDebate.sideB}
              </div>
            </div>
          </div>
        )}

        {/* 4. Emotion Switch scenario prompt */}
        {activeGame === 'emotion' && (
          <div className="space-y-1 bg-slate-900/90 p-3.5 rounded-2xl border border-purple-500/40">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
              Session Scenario (Shifts Every 10s):
            </span>
            <p className="text-sm font-extrabold text-white leading-relaxed">
              &quot;{currentPrompt}&quot;
            </p>
          </div>
        )}

        {/* 5. Standard Prompts for Impromptu / HotTake */}
        {(activeGame === 'impromptu' || activeGame === 'hottake') && (
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

      {/* ======================================================== */}
      {/* EMOTION SWITCH LIVE DISPLAY BANNER (Only in Emotion Mode) */}
      {/* ======================================================== */}
      {activeGame === 'emotion' && (
        <div className={`p-4 rounded-3xl border-2 bg-gradient-to-r ${currentEmotion.bg} ${currentEmotion.border} space-y-1 text-center shadow-lg animate-fadeIn`}>
          <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
            PHASE {currentEmotionPhase + 1} OF 4 • CURRENT EMOTION:
          </span>
          <h2 className="text-xl font-black text-white">
            {currentEmotion.emotion}
          </h2>
          <p className="text-xs text-white/90 font-medium">
            {currentEmotion.desc}
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* DEBATE TURN INDICATOR BANNER (Only in Debate Mode) */}
      {/* ======================================================== */}
      {activeGame === 'debate' && isRunning && (
        <div className={`p-3 rounded-2xl text-center font-bold text-xs animate-pulse ${
          debateTurn === 'A'
            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
            : 'bg-sky-500/20 border border-sky-400 text-sky-300'
        }`}>
          {debateTurn === 'A' ? (
            <span>🎤 SPEAKER A TURN: {selectedSpeaker?.name || 'Speaker A'} (0-30s)</span>
          ) : (
            <span>🎤 SPEAKER B TURN: {selectedSpeakerB?.name || 'Speaker B'} (30-60s)</span>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* WORD BOMB EXPLODED BANNER (Only in Word Bomb Mode) */}
      {/* ======================================================== */}
      {activeGame === 'bomb' && bombExploded && (
        <div className="p-4 bg-rose-600/30 border-2 border-rose-500 rounded-3xl text-center space-y-1 animate-bounce">
          <span className="text-2xl">💥 BOOM!</span>
          <h3 className="text-base font-black text-white">Trap Word Uttered!</h3>
          <p className="text-xs text-rose-200">The speaker stepped on a forbidden word!</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* COUNTDOWN TIMER & CONTROLS */}
      {/* ======================================================== */}
      <div className={`p-6 rounded-3xl border-2 transition-all text-center space-y-4 shadow-xl ${
        bombExploded 
          ? 'bg-rose-950/40 border-rose-600'
          : isFinished 
          ? 'bg-rose-500/10 border-rose-500/60'
          : isUrgent 
          ? 'bg-amber-500/10 border-amber-500/60 animate-pulse'
          : 'bg-slate-800/60 border-slate-700/80'
      }`}>
        {/* Large Time Display */}
        <div className="space-y-1">
          <span className={`text-5xl font-black font-mono tracking-tight ${
            bombExploded
              ? 'text-rose-500'
              : isFinished 
              ? 'text-rose-400' 
              : isUrgent 
              ? 'text-amber-400' 
              : 'text-white'
          }`}>
            {timeLeft}s
          </span>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            {bombExploded
              ? "💥 Trap Word Triggered!"
              : isFinished 
              ? "⏰ Time's Up! Give Feedback & Award Points" 
              : isRunning 
              ? "Live in the spotlight! 🎤" 
              : "Ready when you are!"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
          <div
            className={`h-full transition-all duration-300 ${
              bombExploded
                ? 'bg-rose-600'
                : isFinished 
                ? 'bg-rose-500' 
                : isUrgent 
                ? 'bg-amber-400' 
                : 'bg-gradient-to-r from-yellow-400 to-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={toggleTimer}
            disabled={bombExploded}
            className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
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

          {/* Special Word Bomb Trigger Button */}
          {activeGame === 'bomb' && isRunning && (
            <button
              onClick={handleTriggerBomb}
              className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
              title="Audience caught speaker saying a banned word!"
            >
              <Bomb className="w-4 h-4" />
              <span>BOOM! 💥</span>
            </button>
          )}

          <button
            onClick={resetTimer}
            className="p-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INSTANT POINTS PRESET AWARDS */}
      {/* ======================================================== */}
      {activeGame === 'debate' ? (
        <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Award Debate Victor</span>
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={awardingPoints || !selectedSpeaker}
              onClick={() => handleAwardPoints(selectedSpeaker, 10, `Won Debate vs ${selectedSpeakerB?.name || 'opponent'}! 🏆`)}
              className="p-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-xl text-center space-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-emerald-400 font-black text-xs block truncate">🏆 {selectedSpeaker?.name || 'A'}</span>
              <span className="text-[9px] text-slate-400 block">+10 pts Winner</span>
            </button>

            <button
              type="button"
              disabled={awardingPoints || !selectedSpeakerB}
              onClick={() => handleAwardPoints(selectedSpeakerB, 10, `Won Debate vs ${selectedSpeaker?.name || 'opponent'}! 🏆`)}
              className="p-2.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 rounded-xl text-center space-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-sky-400 font-black text-xs block truncate">🏆 {selectedSpeakerB?.name || 'B'}</span>
              <span className="text-[9px] text-slate-400 block">+10 pts Winner</span>
            </button>

            <button
              type="button"
              disabled={awardingPoints || !selectedSpeaker || !selectedSpeakerB}
              onClick={async () => {
                await handleAwardPoints(selectedSpeaker, 5, 'Debate Tie! 🤝');
                await handleAwardPoints(selectedSpeakerB, 5, 'Debate Tie! 🤝');
              }}
              className="p-2.5 bg-slate-900 hover:bg-yellow-400/10 border border-slate-700 hover:border-yellow-400/40 rounded-xl text-center space-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-yellow-400 font-black text-xs block">🤝 Tie Battle</span>
              <span className="text-[9px] text-slate-400 block">+5 pts Each</span>
            </button>
          </div>
        </div>
      ) : (
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
              onClick={() => handleAwardPoints(selectedSpeaker, 5, 'Great Effort & Energy! ⚡')}
              className="p-2.5 bg-slate-900 hover:bg-yellow-400/10 border border-slate-700 hover:border-yellow-400/50 rounded-xl text-center space-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-yellow-400 font-black text-xs block">+5 pts</span>
              <span className="text-[9px] text-slate-400 block truncate">Good Energy ⚡</span>
            </button>

            <button
              type="button"
              disabled={awardingPoints || !selectedSpeaker}
              onClick={() => handleAwardPoints(selectedSpeaker, 10, 'Impressive Flow & Persuasion! ⭐')}
              className="p-2.5 bg-slate-900 hover:bg-amber-400/10 border border-slate-700 hover:border-amber-400/50 rounded-xl text-center space-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-amber-400 font-black text-xs block">+10 pts</span>
              <span className="text-[9px] text-slate-400 block truncate">Great Flow ⭐</span>
            </button>

            <button
              type="button"
              disabled={awardingPoints || !selectedSpeaker}
              onClick={() => handleAwardPoints(selectedSpeaker, 15, 'Masterclass Stage Delivery! 👑')}
              className="p-2.5 bg-slate-900 hover:bg-emerald-400/10 border border-slate-700 hover:border-emerald-400/50 rounded-xl text-center space-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="text-emerald-400 font-black text-xs block">+15 pts</span>
              <span className="text-[9px] text-slate-400 block truncate">Masterclass 👑</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
