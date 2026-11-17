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
  Trophy, 
  Eye, 
  EyeOff, 
  Vote, 
  ThumbsUp, 
  Star, 
  Radio
} from 'lucide-react';
import { 
  getAllMembers, 
  addPointEvent, 
  broadcastGameState, 
  subscribeToLiveGame, 
  castGameVote, 
  sendGameReaction, 
  LiveGameState 
} from '@/lib/firestore';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string>('');
  const [currentMemberName, setCurrentMemberName] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);

  // Coordinator Game Control State
  const [activeGame, setActiveGame] = useState<GameMode>('hub');
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

  // Debate & Word Bomb State
  const [debateTurn, setDebateTurn] = useState<'A' | 'B'>('A');
  const [bombExploded, setBombExploded] = useState<boolean>(false);

  // Live Sync State (From Firestore)
  const [liveState, setLiveState] = useState<LiveGameState | null>(null);
  const [myVote, setMyVote] = useState<string>('');
  const [pointsSuccess, setPointsSuccess] = useState<string>('');
  const [awardingPoints, setAwardingPoints] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkRole();
    loadMembers();

    // Subscribe to real-time live game broadcast
    const unsubscribe = subscribeToLiveGame((data) => {
      if (data) {
        setLiveState(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkRole = () => {
    try {
      const saved = localStorage.getItem('enactus_member');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id) setCurrentMemberId(parsed.id);
        if (parsed.name) setCurrentMemberName(parsed.name);
        if (parsed.id === 'ENC-2302' || parsed.role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMembers = async () => {
    try {
      const all = await getAllMembers();
      const valid = all.filter((m) => m.id !== 'ENC-2302');
      setMembers(valid);
      if (valid.length > 0 && !selectedSpeaker) {
        setSelectedSpeaker(valid[0]);
        if (valid.length > 1) setSelectedSpeakerB(valid[1]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Broadcast helper for Coordinator
  const broadcast = async (overrides?: Partial<LiveGameState>) => {
    if (!isAdmin) return;
    const payload: LiveGameState = {
      activeGame,
      selectedSpeaker,
      selectedSpeakerB,
      prompt: currentPrompt,
      product: currentProduct,
      bomb: currentBomb,
      debate: currentDebate,
      duration,
      timeLeft,
      isRunning,
      isFinished,
      bombExploded,
      debateTurn,
      votes: liveState?.votes || {},
      reactions: liveState?.reactions || {},
      updatedAt: Date.now(),
      ...overrides,
    };
    await broadcastGameState(payload);
  };

  // Web Audio Synthesizer
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
    } catch (e) {}
  };

  // Timer Tick (Admin side)
  useEffect(() => {
    if (isAdmin && isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (activeGame === 'emotion') {
            if (prev === 31 || prev === 21 || prev === 11) {
              playBeep(650, 'triangle', 0.25);
            }
          }

          if (activeGame === 'debate' && prev === 31) {
            setDebateTurn('B');
            playBeep(700, 'square', 0.3);
            confetti({ particleCount: 30, spread: 50 });
            broadcast({ debateTurn: 'B', timeLeft: 30 });
          }

          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsRunning(false);
            setIsFinished(true);
            playBeep(880, 'triangle', 0.4);
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
            broadcast({ isRunning: false, isFinished: true, timeLeft: 0 });
            return 0;
          }

          if (prev <= 4) {
            playBeep(520, 'sine', 0.08);
          }

          // Periodic broadcast sync every 5 seconds
          if (prev % 5 === 0) {
            broadcast({ timeLeft: prev - 1 });
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
  }, [isAdmin, isRunning, timeLeft, activeGame]);

  // Launch Game Mode (Admin Only)
  const handleLaunchGame = async (mode: GameMode) => {
    setActiveGame(mode);
    setIsRunning(false);
    setIsFinished(false);
    setBombExploded(false);
    setPointsSuccess('');
    setDebateTurn('A');

    let d = 60;
    let p = '';
    let prod: any = null;
    let b: any = null;
    let deb: any = null;

    if (mode === 'impromptu') {
      d = 60;
      p = IMPROMPTU_TOPICS[Math.floor(Math.random() * IMPROMPTU_TOPICS.length)];
      setCurrentPrompt(p);
    } else if (mode === 'hottake') {
      d = 45;
      p = HOT_TAKES[Math.floor(Math.random() * HOT_TAKES.length)];
      setCurrentPrompt(p);
    } else if (mode === 'pitch') {
      d = 30;
      prod = PITCH_PRODUCTS[Math.floor(Math.random() * PITCH_PRODUCTS.length)];
      setCurrentProduct(prod);
    } else if (mode === 'emotion') {
      d = 40;
      p = EMOTION_SCENARIOS[Math.floor(Math.random() * EMOTION_SCENARIOS.length)];
      setCurrentPrompt(p);
    } else if (mode === 'bomb') {
      d = 45;
      b = WORD_BOMB_CHALLENGES[Math.floor(Math.random() * WORD_BOMB_CHALLENGES.length)];
      setCurrentBomb(b);
    } else if (mode === 'debate') {
      d = 60;
      deb = DEBATE_CHALLENGES[Math.floor(Math.random() * DEBATE_CHALLENGES.length)];
      setCurrentDebate(deb);
    }

    setDuration(d);
    setTimeLeft(d);

    await broadcast({
      activeGame: mode,
      duration: d,
      timeLeft: d,
      isRunning: false,
      isFinished: false,
      bombExploded: false,
      prompt: p,
      product: prod,
      bomb: b,
      debate: deb,
      debateTurn: 'A',
      votes: {},
      reactions: {},
    });
  };

  // Exit Game back to Hub (Admin Only)
  const handleExitToHub = async () => {
    setActiveGame('hub');
    setIsRunning(false);
    await broadcast({ activeGame: 'hub', isRunning: false });
  };

  // Reroll Challenge (Admin Only)
  const handleReroll = async () => {
    if (activeGame === 'impromptu') {
      const p = IMPROMPTU_TOPICS[Math.floor(Math.random() * IMPROMPTU_TOPICS.length)];
      setCurrentPrompt(p);
      broadcast({ prompt: p });
    } else if (activeGame === 'hottake') {
      const p = HOT_TAKES[Math.floor(Math.random() * HOT_TAKES.length)];
      setCurrentPrompt(p);
      broadcast({ prompt: p });
    } else if (activeGame === 'pitch') {
      const prod = PITCH_PRODUCTS[Math.floor(Math.random() * PITCH_PRODUCTS.length)];
      setCurrentProduct(prod);
      broadcast({ product: prod });
    } else if (activeGame === 'emotion') {
      const p = EMOTION_SCENARIOS[Math.floor(Math.random() * EMOTION_SCENARIOS.length)];
      setCurrentPrompt(p);
      broadcast({ prompt: p });
    } else if (activeGame === 'bomb') {
      const b = WORD_BOMB_CHALLENGES[Math.floor(Math.random() * WORD_BOMB_CHALLENGES.length)];
      setCurrentBomb(b);
      setBombExploded(false);
      broadcast({ bomb: b, bombExploded: false });
    } else if (activeGame === 'debate') {
      const deb = DEBATE_CHALLENGES[Math.floor(Math.random() * DEBATE_CHALLENGES.length)];
      setCurrentDebate(deb);
      setDebateTurn('A');
      broadcast({ debate: deb, debateTurn: 'A' });
    }
  };

  // Spin Speaker (Admin Only)
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
        if (target === 'A') broadcast({ selectedSpeaker: randomMember });
        else broadcast({ selectedSpeakerB: randomMember });
      }
    }, 100);
  };

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
        broadcast({ selectedSpeaker: members[idxA], selectedSpeakerB: members[idxB] });
      }
    }, 100);
  };

  // Timer Controls (Admin Only)
  const toggleTimer = async () => {
    if (timeLeft === 0) {
      resetTimer();
      setIsRunning(true);
      await broadcast({ isRunning: true, timeLeft: duration, isFinished: false });
    } else {
      const nextRunning = !isRunning;
      setIsRunning(nextRunning);
      await broadcast({ isRunning: nextRunning, timeLeft });
    }
  };

  const resetTimer = async () => {
    setIsRunning(false);
    setIsFinished(false);
    setBombExploded(false);
    setDebateTurn('A');
    setTimeLeft(duration);
    await broadcast({
      isRunning: false,
      isFinished: false,
      bombExploded: false,
      debateTurn: 'A',
      timeLeft: duration,
    });
  };

  const handleTriggerBomb = async () => {
    setIsRunning(false);
    setBombExploded(true);
    playBeep(200, 'sawtooth', 0.5);
    await broadcast({ isRunning: false, bombExploded: true });
  };

  // Award Points (Admin Only)
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

  // Member Actions: Cast Vote & Send Reaction
  const handleCastVote = async (choice: 'A' | 'B') => {
    if (!currentMemberId) return;
    setMyVote(choice);
    try {
      await castGameVote(currentMemberId, choice);
      confetti({ particleCount: 30, spread: 50 });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReaction = async (reaction: string) => {
    try {
      await sendGameReaction(reaction);
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
    } catch (e) {
      console.error(e);
    }
  };

  // Tally Member Votes
  const votes = liveState?.votes || {};
  const totalVotes = Object.keys(votes).length;
  const countA = Object.values(votes).filter((v) => v === 'A').length;
  const countB = Object.values(votes).filter((v) => v === 'B').length;
  const percentA = totalVotes > 0 ? Math.round((countA / totalVotes) * 100) : 50;
  const percentB = totalVotes > 0 ? Math.round((countB / totalVotes) * 100) : 50;

  // Active game display info
  const effectiveGame = isAdmin ? activeGame : (liveState?.activeGame || 'hub');
  const effectiveSpeaker = isAdmin ? selectedSpeaker : (liveState?.selectedSpeaker || null);
  const effectiveSpeakerB = isAdmin ? selectedSpeakerB : (liveState?.selectedSpeakerB || null);
  const effectivePrompt = isAdmin ? currentPrompt : (liveState?.prompt || '');
  const effectiveProduct = isAdmin ? currentProduct : (liveState?.product || null);
  const effectiveBomb = isAdmin ? currentBomb : (liveState?.bomb || null);
  const effectiveDebate = isAdmin ? currentDebate : (liveState?.debate || null);
  const effectiveTimeLeft = isAdmin ? timeLeft : (liveState?.timeLeft ?? 60);
  const effectiveDuration = isAdmin ? duration : (liveState?.duration ?? 60);
  const effectiveIsRunning = isAdmin ? isRunning : (liveState?.isRunning ?? false);
  const effectiveIsFinished = isAdmin ? isFinished : (liveState?.isFinished ?? false);
  const effectiveBombExploded = isAdmin ? bombExploded : (liveState?.bombExploded ?? false);
  const effectiveDebateTurn = isAdmin ? debateTurn : (liveState?.debateTurn ?? 'A');

  // Check if current user is the chosen Word Bomb speaker (secret traps must be hidden from them!)
  const isWordBombSpeaker = !isAdmin && Boolean(effectiveSpeaker) && (
    (Boolean(currentMemberId) && Boolean(effectiveSpeaker?.id) && currentMemberId.trim().toLowerCase() === (effectiveSpeaker?.id || '').trim().toLowerCase()) ||
    (Boolean(currentMemberName) && Boolean(effectiveSpeaker?.name) && currentMemberName.trim().toLowerCase() === (effectiveSpeaker?.name || '').trim().toLowerCase())
  );

  const progressPercent = effectiveDuration > 0 ? ((effectiveDuration - effectiveTimeLeft) / effectiveDuration) * 100 : 0;
  const isUrgent = effectiveTimeLeft <= 10 && effectiveTimeLeft > 0;
  const currentEmotionPhase = Math.min(3, Math.max(0, Math.floor((40 - effectiveTimeLeft) / 10)));
  const currentEmotion = EMOTION_STEPS[currentEmotionPhase];

  const gameTitles: Record<GameMode, { title: string; icon: any; color: string }> = {
    hub: { title: "Game Arena", icon: Gamepad2, color: "text-yellow-400" },
    impromptu: { title: "Impromptu 60s Speech", icon: Timer, color: "text-yellow-400" },
    hottake: { title: "Hot Take Roulette", icon: Flame, color: "text-amber-400" },
    pitch: { title: "Pitch in 30", icon: Lightbulb, color: "text-indigo-400" },
    emotion: { title: "Emotion Switch", icon: Drama, color: "text-purple-400" },
    bomb: { title: "Word Bomb Challenge", icon: Bomb, color: "text-rose-400" },
    debate: { title: "Debate Blitz (1 vs 1)", icon: Swords, color: "text-emerald-400" },
  };

  const activeMeta = gameTitles[effectiveGame];
  const GameIcon = activeMeta.icon;

  // ==========================================
  // VIEW 1: MEMBER LOBBY (When no game is active)
  // ==========================================
  if (!isAdmin && effectiveGame === 'hub') {
    return (
      <div className="space-y-5 pb-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-yellow-400" />
                <span>Presentations Arena</span>
              </h1>
              <p className="text-xs text-slate-400">Audience & Voting Center</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Spectator</span>
          </span>
        </div>

        {/* Waiting Card */}
        <div className="p-8 bg-gradient-to-br from-yellow-500/15 via-amber-600/10 to-slate-900 border-2 border-yellow-400/40 rounded-3xl text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 mx-auto animate-pulse">
            <Radio className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-black text-white">Live Session Lobby</h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              Waiting for Coordinator Hazem to launch a live presentation game... Keep this screen open!
            </p>
          </div>
          <p className="text-[10px] text-yellow-300/80 font-mono">
            When a game starts, your screen will automatically tune in to watch, vote, and react live!
          </p>
        </div>

        {/* Preview of the 6 Games */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Games Played in Sessions (6 Challenges)
          </h3>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400">
                <Timer className="w-3.5 h-3.5" />
                <span>Impromptu (60s)</span>
              </div>
              <p className="text-[10px] text-slate-400">Random speech topic with zero preparation.</p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Flame className="w-3.5 h-3.5" />
                <span>Hot Take (45s)</span>
              </div>
              <p className="text-[10px] text-slate-400">Defend an unpopular stance with passion.</p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Pitch in 30 (30s)</span>
              </div>
              <p className="text-[10px] text-slate-400">Pitch a bizarre invention like a billion-dollar startup.</p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                <Drama className="w-3.5 h-3.5" />
                <span>Emotion Switch</span>
              </div>
              <p className="text-[10px] text-slate-400">Vocal tone shifts every 10 seconds.</p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <Bomb className="w-3.5 h-3.5" />
                <span>Word Bomb (45s)</span>
              </div>
              <p className="text-[10px] text-slate-400">Speech with 3 forbidden trap words.</p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Swords className="w-3.5 h-3.5" />
                <span>Debate Blitz (1v1)</span>
              </div>
              <p className="text-[10px] text-slate-400">Two speakers duel; audience votes winner!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: COORDINATOR GAME SELECTION HUB
  // ==========================================
  if (isAdmin && activeGame === 'hub') {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-yellow-400" />
                <span>Coordinator Game Control</span>
              </h1>
              <p className="text-xs text-slate-400">Launch challenges & broadcast live to all members</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-yellow-400 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider">
            HOST
          </span>
        </div>

        <div className="p-5 bg-gradient-to-br from-yellow-500/20 via-amber-600/10 to-slate-900 border-2 border-yellow-400/50 rounded-3xl space-y-2 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 text-slate-950 rounded-2xl shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Stage Presence Arcade</h2>
              <p className="text-xs text-yellow-300/80">Launch Any of the 6 Challenges</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            Selecting a game immediately broadcasts to every member device in the room! Members tune in as audience spectators and vote in real-time.
          </p>
        </div>

        {/* 6 Game Cards Grid */}
        <div className="grid grid-cols-1 gap-3">
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
                  <h3 className="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors truncate">Impromptu Timer</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-400/20 text-yellow-400 font-mono">60s</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">Random topic. Speaker talks fluently for 60 seconds.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-yellow-400 transition-colors flex-shrink-0" />
          </div>

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
                  <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">Hot Take Roulette</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400/20 text-amber-400 font-mono">45s</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">Defend a controversial stance with conviction for 45s.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
          </div>

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
                  <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors truncate">Pitch in 30</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-400/20 text-indigo-400 font-mono">30s</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">Pitch a wild product as a billion-dollar startup in 30s.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
          </div>

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
                  <h3 className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors truncate">Emotion Switch</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-400/20 text-purple-400 font-mono">40s</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">Vocal variety challenge shifting emotions every 10s.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </div>

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
                  <h3 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors truncate">Word Bomb</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-400/20 text-rose-400 font-mono">45s</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">Speak without saying 3 banned words. If you slip: BOOM!</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-rose-400 transition-colors flex-shrink-0" />
          </div>

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
                  <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors truncate">Debate Blitz (1v1)</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-400/20 text-emerald-400 font-mono">60s</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">Two speakers duel; audience votes on who won!</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: ACTIVE GAME (Admin Host OR Member Spectator)
  // ==========================================
  return (
    <div className="space-y-4 pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        {isAdmin ? (
          <button
            onClick={handleExitToHub}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>End Game & Return to Hub</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold">
            <Radio className="w-4 h-4 animate-pulse text-rose-500" />
            <span>Live Session Arena</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          ) : (
            <span className="px-2.5 py-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Audience</span>
            </span>
          )}
          <span className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold font-mono">
            {effectiveDuration}s
          </span>
        </div>
      </div>

      {pointsSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{pointsSuccess}</span>
        </div>
      )}

      {/* SPEAKER SECTION */}
      {effectiveGame === 'debate' ? (
        <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
              <span>1 vs 1 Debaters</span>
            </span>

            {isAdmin && (
              <button
                onClick={spinDebateSpeakers}
                disabled={isSpinningSpeaker || members.length < 2}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <Shuffle className={`w-3.5 h-3.5 ${isSpinningSpeaker ? 'animate-spin' : ''}`} />
                <span>{isSpinningSpeaker ? 'Spinning...' : 'Spin Pair'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2.5 rounded-xl border transition-all ${
              effectiveDebateTurn === 'A' && effectiveIsRunning
                ? 'bg-emerald-500/15 border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                : 'bg-slate-900/80 border-slate-700/80'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <BotAvatar config={effectiveSpeaker?.avatar} size="sm" />
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-400 font-black block">SIDE A (PRO)</span>
                  <span className="text-xs font-bold text-white truncate block">{effectiveSpeaker?.name || 'Speaker A'}</span>
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border transition-all ${
              effectiveDebateTurn === 'B' && effectiveIsRunning
                ? 'bg-sky-500/15 border-sky-400 shadow-md ring-2 ring-sky-400/40'
                : 'bg-slate-900/80 border-slate-700/80'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <BotAvatar config={effectiveSpeakerB?.avatar} size="sm" />
                <div className="min-w-0">
                  <span className="text-[10px] text-sky-400 font-black block">SIDE B (CON)</span>
                  <span className="text-xs font-bold text-white truncate block">{effectiveSpeakerB?.name || 'Speaker B'}</span>
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

            {isAdmin && (
              <button
                onClick={() => spinRandomSpeaker('A')}
                disabled={isSpinningSpeaker || members.length === 0}
                className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <Shuffle className={`w-3.5 h-3.5 ${isSpinningSpeaker ? 'animate-spin' : ''}`} />
                <span>{isSpinningSpeaker ? 'Spinning...' : 'Random Speaker'}</span>
              </button>
            )}
          </div>

          {effectiveSpeaker ? (
            <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/80">
              <div className="flex items-center gap-3 min-w-0">
                <BotAvatar config={effectiveSpeaker.avatar} size="sm" />
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                    <span>{effectiveSpeaker.name}</span>
                    {effectiveSpeaker.titleBadge && (
                      <span className="px-1.5 py-0.2 text-[8px] bg-amber-400/20 text-amber-300 rounded-full">
                        {effectiveSpeaker.titleBadge}
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {effectiveSpeaker.id} • {effectiveSpeaker.totalPoints || 0} pts
                  </p>
                </div>
              </div>

              {isAdmin && (
                <select
                  value={effectiveSpeaker.id}
                  onChange={(e) => {
                    const found = members.find((m) => m.id === e.target.value);
                    if (found) {
                      setSelectedSpeaker(found);
                      broadcast({ selectedSpeaker: found });
                    }
                  }}
                  className="text-[10px] bg-slate-800 border border-slate-700 rounded-lg text-slate-300 px-2 py-1 max-w-[110px] truncate"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No active speaker assigned yet</p>
          )}
        </div>
      )}

      {/* CHALLENGE PROMPT CARD */}
      <div className="p-4 bg-slate-800/80 border-2 border-slate-700/80 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GameIcon className={`w-4 h-4 ${activeMeta.color}`} />
            <span className="text-xs font-black text-white">{activeMeta.title}</span>
          </div>

          {isAdmin && (
            <button
              onClick={handleReroll}
              className="text-[11px] text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reroll</span>
            </button>
          )}
        </div>

        {effectiveGame === 'pitch' && effectiveProduct && (
          <div className="space-y-1 bg-slate-900/90 p-3.5 rounded-2xl border border-indigo-500/30">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Product to Pitch in 30s:</span>
            <h3 className="text-base font-black text-white">✨ {effectiveProduct.name}</h3>
            <p className="text-xs text-slate-300 leading-relaxed italic">&quot;{effectiveProduct.pitch}&quot;</p>
          </div>
        )}

        {effectiveGame === 'bomb' && effectiveBomb && (
          <div className="space-y-3 bg-slate-900/90 p-4 rounded-2xl border border-rose-500/40 shadow-lg">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Speech Topic (45s):</span>
              <h3 className="text-sm font-black text-white">&quot;{effectiveBomb.topic}&quot;</h3>
            </div>

            <div className="pt-2 border-t border-slate-800">
              {isWordBombSpeaker ? (
                /* HIDDEN FROM THE ACTIVE SPEAKER ONLY */
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/60 rounded-2xl text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[11px] font-black uppercase">
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Secret Traps Hidden From You!</span>
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
                    🙈 You are the Speaker! 3 secret trap words are hidden from your screen. Speak fluently without saying any of them!
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 bg-rose-900/50 border border-rose-700/60 rounded-xl text-center">
                      <span className="text-[9px] text-rose-400 block font-bold">TRAP 1</span>
                      <span className="text-xs font-mono font-black text-rose-200">🔒 [ ? ? ? ]</span>
                    </div>
                    <div className="p-2 bg-rose-900/50 border border-rose-700/60 rounded-xl text-center">
                      <span className="text-[9px] text-rose-400 block font-bold">TRAP 2</span>
                      <span className="text-xs font-mono font-black text-rose-200">🔒 [ ? ? ? ]</span>
                    </div>
                    <div className="p-2 bg-rose-900/50 border border-rose-700/60 rounded-xl text-center">
                      <span className="text-[9px] text-rose-400 block font-bold">TRAP 3</span>
                      <span className="text-xs font-mono font-black text-rose-200">🔒 [ ? ? ? ]</span>
                    </div>
                  </div>

                  {effectiveBombExploded && (
                    <div className="pt-2.5 mt-2 border-t border-rose-800/80">
                      <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block mb-1.5">
                        💥 Secret Traps Revealed:
                      </span>
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        {effectiveBomb.banned.map((word, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-rose-500/30 text-rose-100 border border-rose-500/60 rounded-xl text-xs font-black uppercase">
                            💥 {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* VISIBLE TO AUDIENCE & COORDINATOR */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-black uppercase tracking-wider flex items-center gap-1">
                      <Bomb className="w-3.5 h-3.5" />
                      <span>FORBIDDEN TRAP WORDS:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                      <EyeOff className="w-3 h-3 text-rose-400" />
                      <span>Hidden on {effectiveSpeaker?.name ? `${effectiveSpeaker.name}'s` : "Speaker's"} screen</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {effectiveBomb.banned.map((word, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-rose-500/20 text-rose-200 border border-rose-500/50 rounded-xl text-xs font-black uppercase tracking-wide shadow-sm">
                        🚫 {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {effectiveGame === 'debate' && effectiveDebate && (
          <div className="space-y-2.5 bg-slate-900/90 p-3.5 rounded-2xl border border-emerald-500/40">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Debate Topic:</span>
              <h3 className="text-sm font-black text-white">&quot;{effectiveDebate.topic}&quot;</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
                <strong className="block text-emerald-400 text-[10px]">SIDE A:</strong>
                {effectiveDebate.sideA}
              </div>
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200">
                <strong className="block text-sky-400 text-[10px]">SIDE B:</strong>
                {effectiveDebate.sideB}
              </div>
            </div>
          </div>
        )}

        {effectiveGame === 'emotion' && (
          <div className="space-y-1 bg-slate-900/90 p-3.5 rounded-2xl border border-purple-500/40">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Scenario:</span>
            <p className="text-sm font-extrabold text-white leading-relaxed">&quot;{effectivePrompt}&quot;</p>
          </div>
        )}

        {(effectiveGame === 'impromptu' || effectiveGame === 'hottake') && (
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              {effectiveGame === 'hottake' ? 'Defend This Hot Take:' : 'Speaking Prompt:'}
            </span>
            <p className="text-sm font-extrabold text-white leading-relaxed">&quot;{effectivePrompt}&quot;</p>
          </div>
        )}
      </div>

      {/* EMOTION BANNER */}
      {effectiveGame === 'emotion' && (
        <div className={`p-4 rounded-3xl border-2 bg-gradient-to-r ${currentEmotion.bg} ${currentEmotion.border} space-y-1 text-center shadow-lg animate-fadeIn`}>
          <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
            PHASE {currentEmotionPhase + 1} OF 4 • CURRENT EMOTION:
          </span>
          <h2 className="text-xl font-black text-white">{currentEmotion.emotion}</h2>
          <p className="text-xs text-white/90 font-medium">{currentEmotion.desc}</p>
        </div>
      )}

      {/* WORD BOMB EXPLODED BANNER */}
      {effectiveGame === 'bomb' && effectiveBombExploded && (
        <div className="p-4 bg-rose-600/30 border-2 border-rose-500 rounded-3xl text-center space-y-1 animate-bounce">
          <span className="text-2xl">💥 BOOM!</span>
          <h3 className="text-base font-black text-white">Trap Word Uttered!</h3>
          <p className="text-xs text-rose-200">The speaker stepped on a forbidden trap word!</p>
        </div>
      )}

      {/* DEBATE TURN BANNER */}
      {effectiveGame === 'debate' && effectiveIsRunning && (
        <div className={`p-2.5 rounded-2xl text-center font-bold text-xs animate-pulse ${
          effectiveDebateTurn === 'A' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
        }`}>
          {effectiveDebateTurn === 'A' ? (
            <span>🎤 SPEAKER A (0–30s): {effectiveSpeaker?.name || 'A'}</span>
          ) : (
            <span>🎤 SPEAKER B (30–60s): {effectiveSpeakerB?.name || 'B'}</span>
          )}
        </div>
      )}

      {/* COUNTDOWN TIMER */}
      <div className={`p-6 rounded-3xl border-2 transition-all text-center space-y-4 shadow-xl ${
        effectiveBombExploded 
          ? 'bg-rose-950/40 border-rose-600'
          : effectiveIsFinished 
          ? 'bg-rose-500/10 border-rose-500/60'
          : isUrgent 
          ? 'bg-amber-500/10 border-amber-500/60 animate-pulse'
          : 'bg-slate-800/60 border-slate-700/80'
      }`}>
        <div className="space-y-1">
          <span className={`text-5xl font-black font-mono tracking-tight ${
            effectiveBombExploded
              ? 'text-rose-500'
              : effectiveIsFinished 
              ? 'text-rose-400' 
              : isUrgent 
              ? 'text-amber-400' 
              : 'text-white'
          }`}>
            {effectiveTimeLeft}s
          </span>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            {effectiveBombExploded
              ? "💥 Trap Word Triggered!"
              : effectiveIsFinished 
              ? "⏰ Round Finished!" 
              : effectiveIsRunning 
              ? "Speaker is Live! 🎤" 
              : "Ready"}
          </p>
        </div>

        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
          <div
            className={`h-full transition-all duration-300 ${
              effectiveBombExploded ? 'bg-rose-600' : effectiveIsFinished ? 'bg-rose-500' : isUrgent ? 'bg-amber-400' : 'bg-gradient-to-r from-yellow-400 to-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* TIMER CONTROLS: COORDINATOR ONLY */}
        {isAdmin && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={toggleTimer}
              disabled={bombExploded}
              className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                isRunning ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950'
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
                  <span>{timeLeft === 0 ? 'Restart' : 'Start Timer'}</span>
                </>
              )}
            </button>

            {activeGame === 'bomb' && isRunning && (
              <button
                onClick={handleTriggerBomb}
                className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
              >
                <Bomb className="w-4 h-4" />
                <span>BOOM! 💥</span>
              </button>
            )}

            <button
              onClick={resetTimer}
              className="p-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* AUDIENCE VOTING & REACTION SECTION (FOR MEMBERS) */}
      {/* ======================================================== */}
      {!isAdmin && (
        <div className="p-4 bg-slate-800/80 border-2 border-yellow-400/50 rounded-3xl space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-yellow-400" />
              <span>Audience Live Voting & Reactions</span>
            </h3>
            <span className="text-[10px] text-yellow-400 font-mono font-bold">
              {totalVotes} Votes Cast
            </span>
          </div>

          {/* If Debate Blitz: Vote for A or B */}
          {effectiveGame === 'debate' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">Who delivered the more persuasive argument?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCastVote('A')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    myVote === 'A'
                      ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                      : 'bg-slate-900/90 text-white border-emerald-500/40 hover:bg-emerald-500/10'
                  }`}
                >
                  <span className="text-[10px] block font-mono">SIDE A</span>
                  <span className="text-xs font-bold block truncate">{effectiveSpeaker?.name || 'Speaker A'}</span>
                  <span className="text-[10px] block mt-1 font-mono">{percentA}% ({countA})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCastVote('B')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    myVote === 'B'
                      ? 'bg-sky-500 text-slate-950 font-black border-sky-400 shadow-md ring-2 ring-sky-400/50'
                      : 'bg-slate-900/90 text-white border-sky-500/40 hover:bg-sky-500/10'
                  }`}
                >
                  <span className="text-[10px] block font-mono">SIDE B</span>
                  <span className="text-xs font-bold block truncate">{effectiveSpeakerB?.name || 'Speaker B'}</span>
                  <span className="text-[10px] block mt-1 font-mono">{percentB}% ({countB})</span>
                </button>
              </div>

              {/* Live Vote Progress Bar */}
              {totalVotes > 0 && (
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex border border-slate-700/60">
                  <div className="bg-emerald-400 h-full transition-all" style={{ width: `${percentA}%` }} />
                  <div className="bg-sky-400 h-full transition-all" style={{ width: `${percentB}%` }} />
                </div>
              )}
            </div>
          ) : (
            /* Live Reactions for Other Games */
            <div className="space-y-2">
              <p className="text-[11px] text-slate-300">Tap to cheer and react to the speaker:</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Fire", icon: "🔥" },
                  { label: "Clap", icon: "👏" },
                  { label: "Genius", icon: "💡" },
                  { label: "Crown", icon: "👑" },
                ].map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => handleSendReaction(r.label)}
                    className="p-2.5 bg-slate-900 hover:bg-yellow-400/10 border border-slate-700 hover:border-yellow-400/50 rounded-2xl text-center transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="text-lg block">{r.icon}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* COORDINATOR ONLY: LIVE CROWD VOTE RESULTS & POINTS AWARD */}
      {/* ======================================================== */}
      {isAdmin && (
        <div className="space-y-3">
          {/* Audience Vote Tally Display */}
          {effectiveGame === 'debate' && (
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <Vote className="w-4 h-4" />
                  <span>Audience Live Vote Tally:</span>
                </span>
                <span className="text-slate-400 font-mono">{totalVotes} total votes</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                  {effectiveSpeaker?.name || 'A'}: {percentA}% ({countA} votes)
                </div>
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 font-bold">
                  {effectiveSpeakerB?.name || 'B'}: {percentB}% ({countB} votes)
                </div>
              </div>
            </div>
          )}

          {/* Points Awarding Form */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" />
                <span>Coordinator Official Points Award</span>
              </h3>
              <span className="text-[10px] text-yellow-400 font-mono">Coordinator Exclusive</span>
            </div>

            {effectiveGame === 'debate' ? (
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
            ) : (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
