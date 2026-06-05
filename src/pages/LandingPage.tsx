import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { GlassCard } from '../components/GlassCard';
import { 
  Sparkles, ArrowRight, Play, Users, 
  Activity, Smile, Zap, MessageSquare, 
  BrainCircuit, Star 
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

// Custom lightweight canvas particle drawer
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 0.8
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(109, 93, 252, 0.12)';
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
      ctx.lineWidth = 0.8;
      
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

// Animated statistic counter component
const Counter: React.FC<{ target: number; suffix?: string; decimals?: boolean }> = ({ target, suffix = '', decimals = false }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800; // ms
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Number(start.toFixed(decimals ? 1 : 0)));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [inView, target, decimals]);

  return <span ref={ref} className="font-mono">{count}{suffix}</span>;
};

// Mock Bento data sets
const miniMoodData = [
  { time: '10m', mood: 60 },
  { time: '20m', mood: 75 },
  { time: '30m', mood: 90 },
  { time: '40m', mood: 85 }
];

const miniDnaData = [
  { subject: 'Focus', score: 92 },
  { subject: 'Mood', score: 80 },
  { subject: 'Energy', score: 85 },
  { subject: 'Outcome', score: 89 }
];

export const LandingPage: React.FC = () => {
  const { setCurrentView } = useStore();
  const [orbHovered, setOrbHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mock live transcription typewriter loop
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const speakerPhrases = [
    'Sarah: Aligning variables for the floating dock details.',
    'Alex: I loaded Recharts coordinates using HSL colors.',
    'Elena: verified mobile layout breaks at 768px viewports.'
  ];
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [phraseProgress, setPhraseProgress] = useState(0);

  // Track typewriter
  useEffect(() => {
    const text = speakerPhrases[currentPhraseIdx];
    const charTimer = setInterval(() => {
      if (phraseProgress < text.length) {
        setPhraseProgress(p => p + 1);
      } else {
        clearInterval(charTimer);
        setTimeout(() => {
          setTranscripts(prev => [...prev.slice(-2), text]);
          setPhraseProgress(0);
          setCurrentPhraseIdx(prev => (prev + 1) % speakerPhrases.length);
        }, 2500);
      }
    }, 45);
    return () => clearInterval(charTimer);
  }, [currentPhraseIdx, phraseProgress]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 22 } }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="aurora-container min-h-screen relative flex flex-col w-full text-[var(--theme-text)] overflow-x-hidden"
    >
      
      {/* Canvas Particles & cursor spotlights */}
      <ParticleCanvas />
      <div 
        className="absolute pointer-events-none inset-0 transition-opacity duration-300 opacity-50 z-0"
        style={{
          background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(109, 93, 252, 0.08), transparent 80%)`
        }}
      />

      {/* Glassmorphic Navbar */}
      <header className="sticky top-0 z-30 border-b border-[var(--theme-divider)] bg-[var(--theme-input-bg)] backdrop-blur-xl px-6 py-4 flex items-center justify-between w-full max-w-7xl mx-auto rounded-b-3xl shadow-lg">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setCurrentView('landing')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6D5DFC] to-[#00D4FF] flex items-center justify-center border border-[var(--theme-border)] shadow-lg">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[var(--theme-text)] to-[var(--theme-text-secondary)] bg-clip-text text-transparent">
            Intell<span className="text-secondary">Meet</span>
          </span>
        </div>
        
        {/* Navigation list */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-[var(--theme-text-secondary)]">
          <a href="#features" className="hover:text-primary transition-colors relative py-1 group">
            Features
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#ai-intelligence" className="hover:text-secondary transition-colors relative py-1 group">
            AI Intelligence
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#metrics" className="hover:text-accent transition-colors relative py-1 group">
            Productivity
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full" />
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setCurrentView('auth')} 
            className="text-xs font-bold hover:text-primary transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => setCurrentView('auth')} 
            className="text-[11px] font-bold px-4.5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white border border-primary/20 shadow-lg transition-all cursor-pointer hover:shadow-primary/25 hover:-translate-y-0.5"
          >
            Start Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full z-10 relative">
        
        {/* Intro */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="lg:col-span-5 flex flex-col space-y-6 text-center lg:text-left"
        >
          {/* Animated AI activity badge */}
          <motion.div 
            variants={itemVariants} 
            className="inline-flex self-center lg:self-start items-center space-x-2 border border-primary/30 bg-primary/10 rounded-full px-3.5 py-1.5 text-[10px] text-primary font-bold tracking-wider uppercase shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Introducing IntellMeet AI 2.0</span>
          </motion.div>

          {/* Heading with aurora glow behind */}
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute -inset-x-4 -top-8 bottom-0 bg-primary/8 filter blur-3xl rounded-full z-0" />
            <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight text-[var(--theme-text)] relative z-10">
              Meetings That <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#6D5DFC] via-[#00D4FF] to-[#00FFA3] bg-clip-text text-transparent glow-primary font-extrabold">
                Think For You
              </span>
            </h1>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-sm sm:text-base text-[var(--theme-text-secondary)] max-w-md mx-auto lg:mx-0 leading-relaxed"
          >
            Transform conversations into decisions, action items, insights, and measurable outcomes. Unchain your team from note-taking.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <button 
              onClick={() => setCurrentView('auth')} 
              className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl border border-primary/20 shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs font-bold"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-7 py-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors text-center text-xs font-semibold flex items-center justify-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 text-secondary" />
              <span>Explore Features</span>
            </a>
          </motion.div>
        </motion.div>

        {/* Hero visual: AI Command Center mock */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="lg:col-span-7 relative flex justify-center items-center"
        >
          <GlassCard className="relative w-full max-w-2xl border-[var(--theme-border)] shadow-2xl p-5 overflow-hidden bg-[var(--theme-input-bg)]">
            <div className="flex justify-between items-center border-b border-[var(--theme-border)] pb-4 mb-4">
              <div className="flex space-x-2 items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-[var(--theme-text-muted)] font-mono pl-2">ai-command-center_v2.0</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[9px] text-red-400 font-mono tracking-wider font-semibold">RECONSTRUCTION MODEL</span>
              </div>
            </div>

            {/* Simulated Live command center feeds */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Typewriter text simulator (Live scroll) */}
              <div className="border border-[var(--theme-divider)] bg-[var(--theme-input-bg)] p-4 rounded-xl col-span-2 space-y-3 min-h-[140px] flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5 text-primary" /> Live Speech Capture</span>
                  <div className="flex items-center gap-1">
                    <LoaderPulse />
                    <span className="text-[8px] text-primary">Thinking...</span>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  {transcripts.map((t, idx) => (
                    <p key={idx} className="text-[11px] text-[var(--theme-text-secondary)] font-sans">{t}</p>
                  ))}
                  {/* Typewriter active line */}
                  <p className="text-xs text-[var(--theme-text)] font-sans font-bold">
                    {speakerPhrases[currentPhraseIdx].slice(0, phraseProgress)}
                    <span className="w-1.5 h-3 bg-primary inline-block ml-1 animate-pulse" />
                  </p>
                </div>
              </div>

              {/* Float pop notification simulation */}
              <div className="border border-[var(--theme-divider)] bg-[var(--theme-input-bg)] p-4 rounded-xl flex flex-col justify-between h-28">
                <div className="flex justify-between items-center text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider">
                  <span>Smart recommendations</span>
                  <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                </div>
                <div className="flex flex-col mt-2 space-y-1">
                  <span className="text-xs text-accent font-bold">Burnout Warning</span>
                  <span className="text-[9px] text-[var(--theme-text-secondary)] leading-normal line-clamp-2">Design team exceeded 4 continuous sync hours.</span>
                </div>
              </div>

              {/* Energy index metrics */}
              <div className="border border-[var(--theme-divider)] bg-[var(--theme-input-bg)] p-4 rounded-xl flex flex-col justify-between h-28">
                <div className="flex justify-between items-center text-[10px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider">
                  <span>Sentiment index</span>
                  <Smile className="w-3.5 h-3.5 text-secondary" />
                </div>
                <div className="flex flex-col mt-2">
                  <span className="text-2xl font-black text-secondary font-mono">92% <span className="text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase">Optimal</span></span>
                  <span className="text-[9px] text-[var(--theme-text-muted)] mt-1">Motivation levels are high</span>
                </div>
              </div>

            </div>
          </GlassCard>

          {/* Floating Orb */}
          <div className="absolute -top-12 -right-8 z-20">
            <motion.div
              onMouseEnter={() => setOrbHovered(true)}
              onMouseLeave={() => setOrbHovered(false)}
              animate={orbHovered ? { scale: 1.12, rotate: 15, y: -4 } : { scale: 1, rotate: 0, y: 0 }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent flex items-center justify-center border border-[var(--theme-border-hover)] shadow-2xl relative cursor-pointer"
            >
              <div className="absolute inset-0.5 rounded-full bg-[var(--theme-input-bg)] backdrop-blur-sm" />
              <Sparkles className="w-7 h-7 text-white relative z-10 animate-bounce" />
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Feature Bento Grid Section */}
      <section id="features" className="py-24 border-t border-[var(--theme-divider)] bg-[var(--theme-input-bg)] w-full z-10 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 border border-secondary/30 bg-secondary/10 rounded-full px-3 py-1 text-[9px] text-secondary font-bold tracking-widest uppercase">
              <Star className="w-3 h-3" />
              <span>Full-Suite Features</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--theme-text)]">Advanced Bento Grid Infrastructure</h2>
            <p className="text-xs text-[var(--theme-text-secondary)]">Everything compiled under a single, unified executive board.</p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Team Mood (col-span-2) */}
            <GlassCard hoverable className="col-span-1 md:col-span-2 border-[var(--theme-border)] flex flex-col justify-between min-h-[240px] border-l-4 border-l-primary relative overflow-hidden group">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-lg bg-primary/20 p-1.5 text-primary border border-primary/25">
                      <Smile className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--theme-text)]">Linguistic Team Mood Analysis</h3>
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)] max-w-md leading-relaxed">
                    Map motivated, neutral, stressed, or fatigued indicators dynamically using vocal pitch analysis. Protect engineering and design squads from meeting burnout.
                  </p>
                </div>
                
                {/* Mini Sparkline Chart Preview */}
                <div className="w-28 h-16 hidden sm:block">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={miniMoodData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <defs>
                        <linearGradient id="miniMood" x1="0" y1="0" x2="0" y2="100%">
                          <stop offset="5%" stopColor="#6D5DFC" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6D5DFC" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="mood" stroke="#6D5DFC" strokeWidth={1.8} fill="url(#miniMood)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-primary font-bold mt-4 uppercase tracking-wider">
                <span>Explore Mood TIMELINES</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>

            {/* Card 2: Meeting DNA (col-span-1) */}
            <GlassCard hoverable className="border-[var(--theme-border)] flex flex-col justify-between min-h-[240px] border-l-4 border-l-secondary group">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-lg bg-secondary/20 p-1.5 text-secondary border border-secondary/25">
                      <Activity className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--theme-text)]">Meeting DNA Blueprint</h3>
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                    Visual outcomes blueprint mapping clarity indices, collaboration scoring, and decision matrices.
                  </p>
                </div>

                {/* Mini Radar Chart Preview */}
                <div className="w-14 h-14 hidden sm:block">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={miniDnaData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={false} />
                      <Radar dataKey="score" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-secondary font-bold mt-4 uppercase tracking-wider">
                <span>View DNA Structure</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>

            {/* Card 3: Real-Time Extraction */}
            <GlassCard hoverable className="border-[var(--theme-border)] flex flex-col justify-between min-h-[240px] border-l-4 border-l-accent group">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="rounded-lg bg-accent/20 p-1.5 text-accent border border-accent/25">
                    <Zap className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--theme-text)]">Real-Time Extraction</h3>
                </div>
                <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                  Automatic transcribing captures deliverables, compiling summary lists and pushing cards directly to Kanban lanes.
                </p>
              </div>
              <div className="flex justify-between items-center text-[10px] text-accent font-bold mt-4 uppercase tracking-wider">
                <span>Inspect Extract Logs</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>

            {/* Card 4: Persistent AI Copilot (col-span-2) */}
            <GlassCard hoverable className="col-span-1 md:col-span-2 border-[var(--theme-border)] flex flex-col justify-between min-h-[240px] border-l-4 border-l-primary group">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="rounded-lg bg-primary/20 p-1.5 text-primary border border-primary/25">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--theme-text)]">ChatGPT + Notion AI Copilot</h3>
                </div>
                <p className="text-xs text-[var(--theme-text-secondary)] max-w-md leading-relaxed">
                  Execute powerful slash commands directly in sync rooms. Compose emails, compile reports, search transcripts, or query action list summaries instantly.
                </p>
              </div>
              <div className="flex justify-between items-center text-[10px] text-primary font-bold mt-4 uppercase tracking-wider">
                <span>Launch Assistant Panel</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>

          </div>
        </div>
      </section>

      {/* Action Workflow Extraction Section */}
      <section id="ai-intelligence" className="py-24 w-full z-10 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 border border-accent/30 bg-accent/10 rounded-full px-3 py-1 text-[9px] text-accent font-bold tracking-widest uppercase">
              <Zap className="w-3 h-3" />
              <span>COGNITIVE PIPELINE FLOW</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--theme-text)]">Linguistic Extraction Pipeline</h2>
            <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
              Watch conversations transform into tasks. The pipeline filters audio feeds, compiles transcripts, maps action keywords, and exports task cards to team channels instantly.
            </p>
          </div>

          {/* Connected SVG workflow mockup */}
          <div className="relative">
            <div className="flex flex-col space-y-6 relative z-10">
              {/* Transcript node */}
              <div id="source-node" className="rounded-2xl border border-[var(--theme-border)] p-4 bg-[var(--theme-surface)] max-w-sm flex items-start gap-3">
                <Users className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[9px] text-secondary font-mono font-bold uppercase">Sarah Connor (Design Lead)</span>
                  <p className="text-xs text-[var(--theme-text)]">"Make sure the layout uses v4 CSS variables. Alex, map the charts."</p>
                </div>
              </div>

              {/* Action item node */}
              <div id="target-node" className="rounded-2xl border border-primary/30 p-4 bg-primary/10 max-w-sm ml-auto flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary animate-pulse flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[9px] text-primary font-mono font-bold uppercase">AI Extracted Deliverable</span>
                  <p className="text-xs text-[var(--theme-text)] font-bold">Assign Alex to map DNA Recharts</p>
                  <p className="text-[9px] text-[var(--theme-text-secondary)]">Due: June 10, 2026 • Priority: Medium</p>
                </div>
              </div>
            </div>

            {/* Connecting flow arrows background */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <svg className="w-full h-full" style={{ minHeight: '220px' }}>
                <path 
                  d="M 120 75 Q 180 120 300 160" 
                  fill="transparent" 
                  stroke="rgba(0, 212, 255, 0.2)" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                  className="animate-[dash_10s_linear_infinite]"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section with Counters and loaders */}
      <section id="metrics" className="py-24 border-t border-[var(--theme-divider)] bg-[var(--theme-input-bg)] w-full z-10 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            {/* Stat 1 */}
            <GlassCard className="border-[var(--theme-border)] space-y-2.5 p-6 bg-[var(--theme-input-bg)] hover:bg-[var(--theme-surface-hover)] transition-all">
              <p className="text-4xl font-extrabold text-white bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <Counter target={42} suffix="%" />
              </p>
              <h3 className="text-xs font-bold text-[var(--theme-text)]">Fatigue Reduction</h3>
              <p className="text-[10px] text-[var(--theme-text-muted)] leading-relaxed">Systematic check-ins prevent dev burnout overlaps.</p>
            </GlassCard>

            {/* Stat 2 */}
            <GlassCard className="border-[var(--theme-border)] space-y-2.5 p-6 bg-[var(--theme-input-bg)] hover:bg-[var(--theme-surface-hover)] transition-all">
              <p className="text-4xl font-extrabold text-white bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                <Counter target={1.8} suffix="h" decimals />
              </p>
              <h3 className="text-xs font-bold text-[var(--theme-text)]">Saved Weekly / Person</h3>
              <p className="text-[10px] text-[var(--theme-text-muted)] leading-relaxed">No manual retrospect writing or note compiling.</p>
            </GlassCard>

            {/* Stat 3 */}
            <GlassCard className="border-[var(--theme-border)] space-y-2.5 p-6 bg-[var(--theme-input-bg)] hover:bg-[var(--theme-surface-hover)] transition-all">
              <p className="text-4xl font-extrabold text-white bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                <Counter target={94} suffix="%" />
              </p>
              <h3 className="text-xs font-bold text-[var(--theme-text)]">Task Completion</h3>
              <p className="text-[10px] text-[var(--theme-text-muted)] leading-relaxed">AI deliverables logs keep timelines on schedule.</p>
            </GlassCard>

            {/* Stat 4 */}
            <GlassCard className="border-[var(--theme-border)] space-y-2.5 p-6 bg-[var(--theme-input-bg)] hover:bg-[var(--theme-surface-hover)] transition-all">
              <p className="text-4xl font-extrabold text-white bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                <Counter target={250} suffix="K+" />
              </p>
              <h3 className="text-xs font-bold text-[var(--theme-text)]">Syncs Conducted</h3>
              <p className="text-[10px] text-[var(--theme-text-muted)] leading-relaxed">Empowering software networks globally.</p>
            </GlassCard>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--theme-divider)] bg-[var(--theme-bg)] py-12 px-6 w-full z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[var(--theme-text-muted)]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#6D5DFC] to-[#00D4FF] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-[var(--theme-text)]">IntellMeet Inc.</span>
          </div>
          <p>© 2026 IntellMeet AI Platforms Corp. Google DeepMind pair program model.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-secondary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
      
    </div>
  );
};

// Mini internal loader pulse dot helper
const LoaderPulse: React.FC = () => {
  return (
    <div className="flex items-center space-x-1">
      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
    </div>
  );
};

export default LandingPage;
