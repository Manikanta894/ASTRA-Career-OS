import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  BriefcaseBusiness,
  FileCheck2,
  Folder,
  Infinity as InfinityIcon,
  Map,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  UsersRound,
  Zap,
} from 'lucide-react';
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Hero data model — every value comes from the live Astra demo state */
/* ------------------------------------------------------------------ */

export type HeroData = {
  name: string;
  initials: string;
  targetRole: string;
  readiness: number;
  verifiedSkills: number;
  projects: number;
  certifications: number;
  applications: number;
  interviews: number;
  roadmapPct: number;
  jobMatchBest: number;
  topJob: string;
  topJobMatch: number;
  gap: string | null;
  nextAction: string;
};

/* ------------------------------------------------------------------ */
/*  Orbital geometry                                                  */
/* ------------------------------------------------------------------ */

const NODE_DEFS = [
  { label: 'SKILLS', icon: BarChart3, hint: (d: HeroData) => `${d.verifiedSkills} verified skills` },
  { label: 'ROADMAP', icon: Map, hint: (d: HeroData) => `${d.roadmapPct}% roadmap complete` },
  { label: 'PROJECTS', icon: Folder, hint: (d: HeroData) => `${d.projects} portfolio proofs` },
  { label: 'JOBS', icon: BriefcaseBusiness, hint: (d: HeroData) => `${d.applications} matched opportunities` },
  { label: 'CERTIFICATIONS', icon: Award, hint: (d: HeroData) => `${d.certifications} verified credentials` },
  { label: 'INTERVIEWS', icon: UsersRound, hint: (d: HeroData) => `${d.interviews} completed` },
  { label: 'MENTORS', icon: Users, hint: () => '24 available mentors' },
  { label: 'OUTCOMES', icon: Trophy, hint: () => '+18% readiness' },
] as const;

const NODE_COUNT = NODE_DEFS.length;

const posOf = (i: number) => {
  const a = (Math.PI * 2 * i) / NODE_COUNT - Math.PI / 2;
  return { x: 50 + 40 * Math.cos(a), y: 50 + 33 * Math.sin(a) };
};

const linePath = (i: number) => {
  const p = posOf(i);
  const dx = p.x - 50;
  const dy = p.y - 50;
  const len = Math.hypot(dx, dy) || 1;
  const bow = 0.1 * len;
  const mx = (p.x + 50) / 2 - (dy / len) * bow;
  const my = (p.y + 50) / 2 + (dx / len) * bow;
  return `M50 50 Q${mx.toFixed(2)} ${my.toFixed(2)}, ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
};

const AUTOPILOT = [
  'Analyzing your career passport...',
  'Mapping skill gaps...',
  'Finding your next best action...',
  'Ranking opportunities...',
  'Updating your roadmap...',
];

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  top: (i * 53 + 7) % 100,
  size: 1 + (i % 3) * 0.6,
  delay: (i % 7) * 0.8,
  hue: i % 4 === 0 ? '32 96% 62%' : i % 4 === 1 ? '176 62% 60%' : '38 45% 96%',
  dur: 3.6 + (i % 5) * 0.9,
}));

/* ------------------------------------------------------------------ */
/*  Shared animation bits                                             */
/* ------------------------------------------------------------------ */

const ease = [0.22, 1, 0.36, 1] as const;

const itemFade = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

function CountUp({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value.toFixed(decimals));
      return;
    }
    const controls = animate(0, value, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, value, reduced, decimals]);

  return (
    <span ref={ref} className="hero-metric-num">
      {display}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Career Passport visualization                                     */
/* ------------------------------------------------------------------ */

function SignalCard({
  className,
  kicker,
  title,
  meta,
  delay,
  children,
}: {
  className: string;
  kicker: string;
  title?: string;
  meta?: string;
  delay: number;
  children?: ReactNode;
}) {
  return (
    <motion.div
      className={`signal-card card-float ${className}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
    >
      <div className="sc-k">{kicker}</div>
      {title && <div className="sc-t">{title}</div>}
      {meta && <div className="sc-s">{meta}</div>}
      {children}
    </motion.div>
  );
}

function CareerVisual({ data }: { data: HeroData }) {
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [passportOpen, setPassportOpen] = useState(false);
  const [autopilotIndex, setAutopilotIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setAutopilotIndex((v) => (v + 1) % AUTOPILOT.length), 2600);
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <div className="hero-visual-area">
      <div className="hero-visual">
        {/* decorative orbit rings */}
        <svg className="hero-rings" viewBox="0 0 600 600" preserveAspectRatio="none" aria-hidden="true">
          <ellipse cx="300" cy="300" rx="235" ry="196" fill="none" stroke="hsl(176 62% 48% / 0.1)" strokeWidth="1" />
          <g className="ring-g ring-spin-cw">
            <ellipse cx="300" cy="300" rx="205" ry="170" fill="none" stroke="hsl(176 62% 48% / 0.16)" strokeWidth="1.2" strokeDasharray="2 9" />
          </g>
          <g className="ring-g ring-spin-ccw">
            <ellipse cx="300" cy="300" rx="168" ry="140" fill="none" stroke="hsl(32 96% 62% / 0.12)" strokeWidth="1" strokeDasharray="6 12" />
          </g>
        </svg>

        {/* connection lines + travelling evidence particles */}
        <svg className="hero-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {NODE_DEFS.map((n, i) => {
            const d = linePath(i);
            const hot = activeNode === i;
            return (
              <g key={n.label} className={hot ? 'line-g hot' : 'line-g'}>
                <path className="career-line" d={d} />
                {!reduced && (
                  <circle className="line-particle" r={0.6} fill={i % 3 === 0 ? 'hsl(32 96% 70%)' : 'hsl(176 62% 62%)'}>
                    <animateMotion dur={`${6 + (i % 4) * 2.4}s`} begin={`${(i * 1.9) % 8}s`} repeatCount="indefinite" path={d} />
                  </circle>
                )}
                {!reduced && i % 2 === 0 && (
                  <circle className="line-particle ghost" r={0.45} fill="hsl(38 45% 96%)">
                    <animateMotion dur={`${9 + (i % 3) * 2}s`} begin={`${(i * 2.7 + 3) % 11}s`} repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* orbiting career nodes */}
        {NODE_DEFS.map((n, i) => {
          const p = posOf(i);
          const active = activeNode === i;
          return (
            <span
              key={n.label}
              className="orbit-slot"
              style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${(i % 4) * 0.9}s` }}
            >
              <motion.button
                type="button"
                className={`orbit-node${active ? ' active' : ''}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: active ? 1.09 : 1 }}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.07, ease }}
                onMouseEnter={() => setActiveNode(i)}
                onMouseLeave={() => setActiveNode(null)}
                onFocus={() => setActiveNode(i)}
                onBlur={() => setActiveNode(null)}
                aria-label={`${n.label}: ${n.hint(data)}`}
                data-testid={`hero-node-${n.label.toLowerCase()}`}
              >
                <span className="orbit-node-vis">
                  <n.icon size={20} strokeWidth={1.8} />
                </span>
                <span className="orbit-node-label">{n.label}</span>
                <AnimatePresence>
                  {active && (
                    <motion.span
                      className="node-tip"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.16 }}
                    >
                      {n.hint(data)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </span>
          );
        })}
        {/* center — Career Passport */}
        <span className="passport-slot">
          <button
            type="button"
            className="passport-core"
            onClick={() => setPassportOpen((o) => !o)}
            onMouseEnter={() => setPassportOpen(true)}
            aria-label={`Career Passport — ${data.name}, open details`}
            data-testid="hero-passport-core"
          >
            <span className="passport-glow" aria-hidden="true" />
            <svg className="passport-scan" viewBox="0 0 190 190" aria-hidden="true">
              <circle cx="95" cy="95" r="91" fill="none" stroke="hsl(176 62% 48% / 0.35)" strokeWidth="1" strokeDasharray="2 7" />
              <circle cx="95" cy="95" r="84" fill="none" stroke="hsl(32 96% 62% / 0.2)" strokeWidth="1.2" />
            </svg>
            <span className="passport-disc">
              <span className="passport-avatar">{data.initials}</span>
              <span className="passport-name">CAREER PASSPORT</span>
              <span className="passport-sub">Verified source of truth</span>
              <span className="passport-shield">
                <ShieldCheck size={14} />
              </span>
            </span>
          </button>
        </span>

        {/* passport detail panel */}
        <span className="pp-slot">
          <AnimatePresence>
            {passportOpen && (
            <motion.div
              className="passport-panel"
              role="dialog"
              aria-label="Career Passport details"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.2, ease }}
            >
              <div className="pp-head">
                <span className="pp-k">CAREER PASSPORT</span>
                <button type="button" className="pp-x" onClick={() => setPassportOpen(false)} aria-label="Close details">
                  ✕
                </button>
              </div>
              <div className="pp-name">{data.name}</div>
              <div className="pp-role">{data.targetRole}</div>
              <div className="pp-row">
                <span>Readiness</span>
                <b>{data.readiness} / 100</b>
              </div>
              <div className="mini-progress">
                <i style={{ width: `${data.readiness}%` }} />
              </div>
              <div className="pp-stats">
                <span><b>{data.verifiedSkills}</b> verified skills</span>
                <span><b>{data.certifications}</b> certifications</span>
                <span><b>{data.projects}</b> projects</span>
              </div>
              <Link
                href="/student/career-passport"
                className="pp-cta"
                onClick={() => setPassportOpen(false)}
                data-testid="hero-open-passport"
              >
                Open Career Passport <ArrowRight size={13} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        </span>

        {/* floating live-signal cards */}
        <SignalCard className="hsc-signal" kicker="AI CAREER SIGNAL" title={data.targetRole} meta={`${data.jobMatchBest}% role fit`} delay={0.55}>
          <div className="mini-progress"><i style={{ width: `${data.jobMatchBest}%` }} /></div>
        </SignalCard>

        <SignalCard className="hsc-action" kicker="NEXT BEST ACTION" title={data.nextAction} delay={0.7}>
          <span className="sc-link">Recommended by ASTRA <ArrowRight size={11} /></span>
        </SignalCard>

        <SignalCard className="hsc-gap" kicker={data.gap ? 'SKILL GAP IDENTIFIED' : 'SKILL GAP CLOSED'} title={data.gap ?? 'Priority skills verified'} meta={data.gap ? 'Next best action ready' : '+ stronger match'} delay={0.85}>
          {data.gap ? (
            <span className="sc-link">Close this gap <ArrowRight size={11} /></span>
          ) : (
            <span className="sc-check">✓ All critical skills covered</span>
          )}
        </SignalCard>

        <SignalCard className="hsc-job" kicker="JOB MATCH" title={data.topJob} meta={`${data.topJobMatch}% match`} delay={1}>
          <Link href="/student/jobs" className="sc-link" data-testid="hero-apply-now">Apply now <ArrowRight size={11} /></Link>
        </SignalCard>

        {/* autopilot status bar */}
        <div className="autopilot" aria-live="polite">
          <span className="autopilot-led" aria-hidden="true" />
          <span className="autopilot-label">ASTRA AUTOPILOT</span>
          <span className="autopilot-msg">
            <AnimatePresence mode="wait">
              <motion.span
                key={autopilotIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.35 }}
              >
                {AUTOPILOT[autopilotIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                            */
/* ------------------------------------------------------------------ */

function HeroNav() {
  return (
    <header className="hero-nav">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="hero-logo" data-testid="link-logo" aria-label="ASTRA home">
          <span className="hero-logo-mark">
            <Zap size={16} strokeWidth={2.75} />
          </span>
          <span className="hero-logo-word">ASTRA</span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13.5px] font-semibold text-[hsl(225_20%_38%)] lg:flex" aria-label="Primary">
          <a href="#system">The system</a>
          <a href="#how">How it works</a>
          <Link href="/student/dashboard">For Students</Link>
          <Link href="/university/dashboard">For Universities</Link>
          <Link href="/recruiter/dashboard">For Recruiters</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost hidden sm:inline-flex" data-testid="link-login">
            Log in
          </Link>
          <Link href="/signup" className="btn btn-dark" data-testid="link-start-building">
            Start building <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Cinematic backdrop                                                */
/* ------------------------------------------------------------------ */

function HeroBackdrop() {
  const reduced = useReducedMotion();
  return (
    <div className="hero-bg" aria-hidden="true">
      <div className="hero-grid-bg" />
      <i className="hero-glow glow-amber" />
      <i className="hero-glow glow-teal" />
      <i className="hero-glow glow-blue" />
      <svg className="hero-arc" viewBox="0 0 700 700" fill="none" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="350" cy="250" rx="330" ry="360" stroke="hsl(176 62% 48% / 0.08)" strokeWidth="1.4" />
        <ellipse cx="430" cy="300" rx="260" ry="300" stroke="hsl(32 96% 62% / 0.07)" strokeWidth="1.4" />
      </svg>
      {!reduced &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            className="hero-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: `hsl(${p.hue})`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Left column                                                       */
/* ------------------------------------------------------------------ */

function HeroMetrics({ readiness }: { readiness: number }) {
  return (
    <motion.div className="hero-metrics" variants={itemFade}>
      <div className="hero-metric">
        <div className="hero-metric-value">
          <Activity size={14} className="hero-metric-ico" />
          <CountUp value={readiness} suffix="%" />
        </div>
        <div className="hero-metric-label">Average readiness signal</div>
      </div>
      <div className="hero-metric">
        <div className="hero-metric-value">
          <FileCheck2 size={14} className="hero-metric-ico" />
          <CountUp value={1} />
          <span className="hero-metric-sub">SOURCE</span>
        </div>
        <div className="hero-metric-label">For every proof point</div>
      </div>
      <div className="hero-metric">
        <div className="hero-metric-value">
          <InfinityIcon size={15} className="hero-metric-ico" />
          <span className="hero-metric-num">∞</span>
        </div>
        <div className="hero-metric-label">Ways to find your next move</div>
      </div>
    </motion.div>
  );
}

function HeroLeft({ data }: { data: HeroData }) {
  return (
    <motion.div
      className="hero-left"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
    >
      <motion.div className="hero-badge" variants={itemFade}>
        <span className="hero-badge-dot" aria-hidden="true" />
        THE CAREER OPERATING SYSTEM
      </motion.div>

      <motion.h1 className="hero-headline display" variants={itemFade}>
        <motion.span className="hero-line" variants={itemFade}>Your entire</motion.span>
        <motion.span className="hero-line" variants={itemFade}>career,</motion.span>
        <motion.span className="hero-line" variants={itemFade}>
          on <em className="hero-amber">one platform.</em>
        </motion.span>
      </motion.h1>

      <motion.p className="hero-copy" variants={itemFade}>
        ASTRA connects the skills you're learning, the work you're making, and the opportunities
        you're ready for — so your next move is never a guess.
      </motion.p>

      <motion.div className="hero-ctas" variants={itemFade}>
        <Link href="/student/roadmap" className="btn hero-cta-primary" data-testid="button-build-roadmap">
          Build my career roadmap <ArrowRight size={16} />
        </Link>
        <Link href="/demo" className="btn hero-cta-secondary" data-testid="link-explore-demo">
          <span className="hero-cta-glyph" aria-hidden="true">◉</span> Explore the demo
        </Link>
      </motion.div>

      <HeroMetrics readiness={data.readiness} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public hero                                                       */
/* ------------------------------------------------------------------ */

export default function LandingHero({ data }: { data: HeroData }) {
  return (
    <MotionConfig reducedMotion="user">
      <HeroNav />
      <section className="landing-hero" aria-label="ASTRA — your entire career, on one platform">
        <HeroBackdrop />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-6 md:px-8 lg:grid-cols-[45fr_55fr] lg:gap-8 lg:pb-16 lg:pt-10">
          <HeroLeft data={data} />
          <CareerVisual data={data} />
        </div>
      </section>
    </MotionConfig>
  );
}