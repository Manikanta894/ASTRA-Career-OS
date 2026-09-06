import { type ReactNode, createContext, lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  Activity, ArrowRight, Award, BarChart3, Bell, BookOpen, Brain, BriefcaseBusiness, Building2,
  CalendarDays, Check, ChevronDown, ChevronRight, ClipboardCheck, Clock3,
  Compass, FileText, FlaskConical, GraduationCap, Handshake, Heart, Home, Layers3, Lightbulb, LineChart,
  ListChecks, Map, Menu,  MessageCircle, Network, Pencil, PiggyBank, Plus,
  Rocket, RotateCcw, Search, Send, Settings, Sparkles, Star, Target, TrendingUp, Trophy, UserRound,
  Users, X, Zap, Loader2
} from 'lucide-react';
import { TIMELINE_OPTIONS, TIMELINE_PRESETS, formatTimeline, rankedRoleGaps, roleSkillBands, runRoadmapPipeline, timelinePresetFor, topGapFor, type RoleRequirements } from './lib/roadmap';
import { ALUMNI, HACKATHONS, INTERNSHIPS, MARKETPLACE, MENTORS, RESEARCH_OPPS, SCHOLARSHIPS, STARTUPS, TEAM_MEMBERS, type Alumni, type Mentor, type Opportunity, type TeamMember } from './lib/opportunities';
import { PEERS, PEER_APPLICATIONS, type PeerCandidate } from './lib/candidates';
const CohortPlacementChart = lazy(() => import('@/components/charts').then(m => ({ default: m.CohortPlacementChart })));
import NotFound from '@/pages/not-found';
import LandingHero from '@/components/landing-hero';

type Role = 'student' | 'university' | 'recruiter';
type SkillStatus = 'VERIFIED' | 'ASSESSED' | 'BASIC' | 'MISSING';
type ApplicationStage = 'Saved' | 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';
type Job = { id: string; title: string; company: string; location: string; type: string; salary: string; skills: string[]; kind?: string; duration?: string; stipend?: string; };
type Application = { id: string; title: string; company: string; stage: ApplicationStage; date: string; source?: string; };
type Project = { id: string; name: string; summary: string; tools: string[]; skills: string[]; outcome: string; status: string; };
type Assessment = { id: string; name: string; score: number; date: string; };
type Course = { id: string; title: string; provider: string; duration: string; difficulty: string; skills: string[]; progress: number; };

type AstraData = {
  role: Role;
  studentProfile: { name: string; initials: string; program: string; school: string; graduation: string; targetRole: string; bio: string; };
  skills: { name: string; status: SkillStatus; level: number }[];
  verifiedSkills: string[];
  certifications: { id: string; name: string; issuer: string; status: string; date: string }[];
  projects: Project[];
  experience: { id: string; role: string; company: string; period: string; description: string }[];
  achievements: string[];
  research: { id: string; title: string; lab: string; status: string }[];
  targetRole: string;
  timeline: number;
  roadmap: { id: string; title: string; detail: string; status: string; skill: string; week: string; link?: string }[];
  assessments: Assessment[];
  courses: Course[];
  learningProgress: Record<string, number>;
  applications: Application[];
  interviews: { id: string; company: string; role: string; date: string; stage: string; score?: number }[];
  recruiterInterviews: { id: string; jobId: string; candidateId: string; candidateName: string; role: string; date: string; stage: string; outcome?: string }[];
  recruiterOffers: { id: string; jobId: string; candidateId: string; candidateName: string; role: string; date: string; status: string }[];
  mentorBookings: string[];
  notifications: { id: string; text: string; time: string; read: boolean }[];
  jobs: Job[];
  /** one saved-item map shared by every opportunity board (jobs, internships, scholarships…) */
  saved: Record<string, string[]>;
  /** one activity map shared by every board (applied / joined / requested / connected) */
  activity: Record<string, string[]>;
  community: { id: string; author: string; role: string; body: string; likes: number; comments: number }[];
  university: { name: string; students: number; readiness: number; placement: number; internships: number; offers: number; ctc: string };
  recruiter: {
    company: string; name: string; industry: string; website: string; description: string; prefs: string;
    jobs: { id: string; title: string; applicants: number; status: string }[]; shortlisted: string[];
    profileViews: string[];
  };
};

const seedData: AstraData = {
  role: 'student',
  studentProfile: { name: 'Alex Johnson', initials: 'AJ', program: 'MBA Human Resources & Marketing', school: 'ASTRA University', graduation: '2027', targetRole: 'HR Business Partner', bio: 'Human-centered operator building better systems for how teams grow.' },
  skills: [
    { name: 'Recruitment', status: 'VERIFIED', level: 88 }, { name: 'Communication', status: 'VERIFIED', level: 90 },
    { name: 'Employee Engagement', status: 'ASSESSED', level: 75 }, { name: 'Excel', status: 'ASSESSED', level: 68 },
    { name: 'Leadership', status: 'BASIC', level: 56 }, { name: 'HR Operations', status: 'BASIC', level: 52 },
    { name: 'Employee Relations', status: 'BASIC', level: 36 }, { name: 'Workforce Planning', status: 'BASIC', level: 28 },
    { name: 'HR Analytics', status: 'MISSING', level: 0 },
  ],
  verifiedSkills: ['Recruitment', 'Communication'],
  certifications: [
    { id: 'c1', name: 'HR Fundamentals', issuer: 'AIHR', status: 'Completed', date: 'Feb 2025' },
    { id: 'c2', name: 'Advanced Excel', issuer: 'Coursera', status: 'Completed', date: 'Jan 2025' },
    { id: 'c3', name: 'Change Management', issuer: 'LinkedIn Learning', status: 'In progress', date: '—' },
  ],
  projects: [
    { id: 'p1', name: 'Employee Engagement Analysis', summary: 'Found the moments that keep high-potential teams engaged.', tools: ['Excel', 'Survey design', 'PowerPoint'], skills: ['Employee Engagement', 'Communication'], outcome: 'Synthesized 214 responses into a manager action plan.', status: 'Published' },
    { id: 'p2', name: 'Recruitment Funnel Analysis', summary: 'Mapped drop-offs across a campus hiring funnel.', tools: ['Excel', 'Data storytelling'], skills: ['Recruitment', 'HR Operations'], outcome: 'Cut review time by 31% in the prototype workflow.', status: 'Published' },
  ],
  experience: [{ id: 'e1', role: 'People Operations Intern', company: 'Harbor & Finch', period: 'Jun 2024 — Aug 2024', description: 'Supported onboarding, engagement surveys, and weekly workforce reporting.' }],
  achievements: ['Dean’s Leadership Scholar', 'Finalist, Campus Case Sprint', 'Student HR Association — Events Lead'],
  research: [{ id: 'r1', title: 'The first 90 days of hybrid managers', lab: 'ASTRA Org Design Lab', status: 'Open to join' }],
  targetRole: 'HR Business Partner', timeline: 90,
  roadmap: [
    { id: 'r1', title: 'Validate HR Analytics', detail: 'Complete the 10-question HR Analytics assessment.', status: 'In progress', skill: 'HR Analytics', week: 'Week 01' },
    { id: 'r2', title: 'Build a workforce planning case', detail: 'Turn a headcount question into a crisp recommendation.', status: 'Up next', skill: 'Workforce Planning', week: 'Week 02' },
    { id: 'r3', title: 'Practice a manager conversation', detail: 'Run a mock conversation on performance and trust.', status: 'Locked', skill: 'Employee Relations', week: 'Week 03' },
    { id: 'r4', title: 'Publish your proof of work', detail: 'Add the case to your Career Passport.', status: 'Locked', skill: 'Communication', week: 'Week 04' },
  ],
  assessments: [], courses: [
    { id: 'l1', title: 'HR Analytics: From data to decisions', provider: 'Wharton Online', duration: '4h 20m', difficulty: 'Intermediate', skills: ['HR Analytics', 'Excel'], progress: 40 },
    { id: 'l2', title: 'Employee relations for modern managers', provider: 'AIHR', duration: '2h 45m', difficulty: 'Beginner', skills: ['Employee Relations'], progress: 20 },
    { id: 'l3', title: 'Workforce planning essentials', provider: 'LinkedIn Learning', duration: '3h 10m', difficulty: 'Intermediate', skills: ['Workforce Planning'], progress: 0 },
  ],
  learningProgress: { 'Advanced Excel': 80, 'HR Analytics': 40, 'Employee Relations': 20 },
  applications: [
    { id: 'a1', title: 'People Operations Specialist', company: 'Latticeworks', stage: 'Saved', date: 'Today' },
    { id: 'a2', title: 'People Operations Specialist', company: 'Meridian Health', stage: 'Saved', date: 'Yesterday' },
    { id: 'a3', title: 'HR Coordinator', company: 'Northstar Labs', stage: 'Saved', date: 'Mar 08' },
    { id: 'a4', title: 'Campus Recruiter', company: 'Goodwell', stage: 'Saved', date: 'Mar 07' },
    { id: 'a5', title: 'People Analyst', company: 'Frame Systems', stage: 'Saved', date: 'Mar 02' },
    { id: 'a6', title: 'HR Generalist', company: 'Cedar House', stage: 'Applied', date: 'Mar 01' },
    { id: 'a7', title: 'Talent Programs Associate', company: 'Olive & Co.', stage: 'Applied', date: 'Feb 28' },
    { id: 'a8', title: 'People Analyst', company: 'Vertex', stage: 'Applied', date: 'Feb 25' },
    { id: 'a9', title: 'HR Coordinator', company: 'Northstar Labs', stage: 'Applied', date: 'Feb 18' },
    { id: 'a10', title: 'HR Operations Associate', company: 'Atlas Cloud', stage: 'Screening', date: 'Feb 25' },
    { id: 'a11', title: 'People Partner Intern', company: 'Latticeworks', stage: 'Screening', date: 'Feb 20' },
    { id: 'a12', title: 'Talent Associate', company: 'Morrow', stage: 'Interview', date: 'Feb 12' },
  ],
  interviews: [{ id: 'i1', company: 'Morrow', role: 'Talent Associate', date: 'Thu, Mar 14 · 2:00 PM', stage: 'Mock ready' }],
  mentorBookings: [], notifications: [{ id: 'n1', text: 'Your HR Analytics gap has a clear next step.', time: '8m ago', read: false }, { id: 'n2', text: 'Morrow invited you to an interview.', time: '2h ago', read: false }],
  jobs: [
    { id: 'j1', title: 'People Operations Specialist', company: 'Latticeworks', location: 'New York · Hybrid', type: 'Full-time', salary: '$72k–$86k', skills: ['Employee Relations', 'HR Analytics', 'Communication'] },
    { id: 'j2', title: 'HR Business Partner Intern', company: 'Morrow', location: 'Remote · US', type: 'Internship', salary: '$28/hr', skills: ['Recruitment', 'Communication', 'Employee Engagement'] },
    { id: 'j3', title: 'People Analyst', company: 'Frame Systems', location: 'Boston · On-site', type: 'Full-time', salary: '$68k–$79k', skills: ['HR Analytics', 'Excel', 'Workforce Planning'] },
    { id: 'j4', title: 'Talent Programs Associate', company: 'Olive & Co.', location: 'Chicago · Hybrid', type: 'Full-time', salary: '$64k–$76k', skills: ['Recruitment', 'Leadership', 'Communication'] },
    { id: 'rj1', title: 'People Operations Specialist', company: 'Demo Technologies', location: 'Remote · US', type: 'Full-time', salary: '$70k–$84k', skills: ['Communication', 'Employee Relations', 'HR Operations'] },
    { id: 'rj2', title: 'Talent Programs Associate', company: 'Demo Technologies', location: 'Chicago · Hybrid', type: 'Full-time', salary: '$58k–$70k', skills: ['Recruitment', 'Leadership', 'Communication'] },
  ],
  saved: {}, activity: {}, community: [
    { id: 'post1', author: 'Maya Chen', role: 'MBA ’26 · Product', body: 'I turned my first user research project into a proof card today. The story is much clearer when the evidence leads.', likes: 18, comments: 4 },
    { id: 'post2', author: 'Samir Patel', role: 'MS ’25 · Data', body: 'What is everyone using to practice case interviews? I am collecting the best prompts in one place.', likes: 11, comments: 7 },
  ],
  university: { name: 'ASTRA University', students: 1500, readiness: 74, placement: 82, internships: 68, offers: 420, ctc: '$78.4k' },
  recruiter: {
    company: 'Demo Technologies', name: 'Priya Sharma', industry: 'Human Resources Technology', website: 'demotechnologies.example',
    description: 'Demo Technologies builds hiring tools for modern teams and hires across people, product, and engineering roles.',
    prefs: 'Verified skills over keywords; published proof required for senior loops; two rounds maximum.',
    jobs: [{ id: 'rj1', title: 'People Operations Specialist', applicants: 48, status: 'Published' }, { id: 'rj2', title: 'Talent Programs Associate', applicants: 31, status: 'Published' }],
    shortlisted: [],
    profileViews: [],
  },
  recruiterInterviews: [], recruiterOffers: [],
};

function normalizePersistedState(raw: unknown, seed: AstraData): AstraData {
  // Guard against stale or malformed state from previous sessions/builds.
  // Only keys that exist in the seed with a compatible type are carried over;
  // everything else falls back to seed defaults so pages never crash on mount.
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return seed;
  const stored = raw as Record<string, unknown>;
  const merged: AstraData = { ...seed };
  for (const key of Object.keys(seed) as (keyof AstraData)[]) {
    const value = stored[key];
    if (value === undefined || value === null) continue;
    const fallback = seed[key];
    if (Array.isArray(fallback)) {
      if (Array.isArray(value)) (merged as Record<string, unknown>)[key] = value;
    } else if (typeof fallback === 'object') {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        (merged as Record<string, unknown>)[key] = { ...(fallback as object), ...(value as object) };
      }
    } else if (typeof value === typeof fallback) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}

const ASTRA_STATE_KEY = 'astra-state';
const ASTRA_STATE_VERSION = 4;

function usePersistedData() {
  const [data, setData] = useState<AstraData>(() => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(ASTRA_STATE_KEY) || 'null');
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const envelope = raw as { version?: unknown; data?: unknown };
        if (envelope.version === ASTRA_STATE_VERSION && envelope.data && typeof envelope.data === 'object') {
          return normalizePersistedState(envelope.data, seedData);
        }
        // Legacy bare state (pre-versioning): carry over compatible fields once.
        if (envelope.version === undefined && envelope.data === undefined) {
          return normalizePersistedState(raw, seedData);
        }
      }
    } catch { /* fall through to a fresh seed */ }
    return seedData;
  });
  useEffect(() => { localStorage.setItem(ASTRA_STATE_KEY, JSON.stringify({ version: ASTRA_STATE_VERSION, data })); }, [data]);
  const reset = () => { setData(JSON.parse(JSON.stringify(seedData))); localStorage.removeItem('astra-role'); };
  return { data, update: setData, reset };
}

const AstraContext = createContext<{ data: AstraData; update: React.Dispatch<React.SetStateAction<AstraData>>; reset: () => void; toast: (message: string) => void } | null>(null);
function useAstra() { const value = useContext(AstraContext); if (!value) throw new Error('Astra provider missing'); return value; }

function calculateReadiness(data: AstraData) {
  // A deterministic signal computed entirely from demo state: verified skills,
  // published projects, completed certifications, scored interviews, assessments.
  const verified = data.verifiedSkills.length;
  const published = data.projects.filter(p => p.status === 'Published').length;
  const certs = data.certifications.filter(c => c.status === 'Completed').length;
  const assessments = data.assessments.length;
  const interviews = data.interviews.filter(i => i.score).length;
  const raw = 38 + verified * 10 + Math.min(published, 3) * 4 + Math.min(certs, 3) * 3 + Math.min(assessments, 3) * 2 + Math.min(interviews, 2) * 2;
  return Math.min(98, raw);
}
function calculateProfileStrength(data: AstraData) {
  const filled = [data.studentProfile.bio, data.projects.length > 0, data.certifications.length > 0, data.experience.length > 0, data.skills.filter(s => s.status !== 'MISSING').length > 6];
  return Math.round(filled.filter(Boolean).length / filled.length * 100);
}
function calculateJobMatch(job: Job, data: AstraData) {
  const have = data.skills.filter(s => s.status !== 'MISSING').map(s => s.name);
  return Math.min(98, Math.round(job.skills.reduce((score, skill) => score + (have.includes(skill) ? 33.34 : 8), 0)));
}

/* ------------------------------------------------------------------ */
/*  Recruiter ↔ student shared state. Alex is the live candidate —     */
/*  his Career Passport renders straight from student state. Peers are */
/*  stored profiles with the same shape. Pipeline rows derive from     */
/*  student applications (live) + peer application seeds (stored), so  */
/*  one change shows up on both sides.                                 */
/* ------------------------------------------------------------------ */
const LIVE_CANDIDATE_ID = 'cand-alex';

function liveCandidate(data: AstraData): PeerCandidate {
  return {
    id: LIVE_CANDIDATE_ID,
    name: data.studentProfile.name,
    initials: data.studentProfile.initials,
    program: data.studentProfile.program,
    graduation: data.studentProfile.graduation,
    school: data.studentProfile.school,
    targetRole: data.targetRole,
    readiness: calculateReadiness(data),
    skills: data.skills,
    verifiedSkills: data.verifiedSkills,
    assessments: data.assessments.map(a => ({ name: a.name, score: a.score })),
    certifications: data.certifications.filter(c => c.status === 'Completed').map(c => c.name),
    projects: data.projects.filter(p => p.status === 'Published').map(p => ({ name: p.name, outcome: p.outcome })),
    bio: data.studentProfile.bio,
  };
}

function unifiedCandidates(data: AstraData): PeerCandidate[] {
  return [liveCandidate(data), ...PEERS];
}

type PipelineRow = { id: string; jobId: string; jobTitle: string; candidateId: string; candidateName: string; stage: 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Offer' | 'Hired' | 'Rejected'; date: string; live: boolean };

/** Live applications for recruiter jobs (student side) + seeded peer rows. */
function recruiterPipeline(data: AstraData): PipelineRow[] {
  const jobTitleFor = (id: string) => data.recruiter.jobs.find(j => j.id === id)?.title;
  const rows: PipelineRow[] = [];
  // Live: student applications sourced from ASTRA Jobs for this company.
  for (const app of data.applications) {
    if (app.stage === 'Saved' || (app.source !== 'ASTRA Jobs' && app.company !== data.recruiter.company)) continue;
    const job = data.recruiter.jobs.find(j => j.title === app.title);
    if (!job) continue;
    const shortlisted = data.recruiter.shortlisted.includes(LIVE_CANDIDATE_ID);
    const stage = shortlisted && ['Applied', 'Screening'].includes(app.stage) ? 'Shortlisted' : app.stage;
    rows.push({ id: `live-${app.id}`, jobId: job.id, jobTitle: job.title, candidateId: LIVE_CANDIDATE_ID, candidateName: data.studentProfile.name, stage, date: app.date, live: true });
  }
  // Peers: stored seeds, only for jobs that still exist.
  for (const seed of PEER_APPLICATIONS) {
    const jobTitle = jobTitleFor(seed.jobId);
    if (!jobTitle) continue;
    const peer = PEERS.find(p => p.id === seed.peerId);
    if (!peer) continue;
    const shortlisted = data.recruiter.shortlisted.includes(peer.id);
    const stage = shortlisted && ['Applied', 'Screening'].includes(seed.stage) ? 'Shortlisted' : seed.stage;
    rows.push({ id: seed.id, jobId: seed.jobId, jobTitle, candidateId: peer.id, candidateName: peer.name, stage, date: seed.date, live: false });
  }
  return rows;
}

const PIPELINE_ORDER: PipelineRow['stage'][] = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];

/** Push a candidate's stage forward and mirror it into student state when live. */
function movePipelineRow(data: AstraData, row: PipelineRow, stage: PipelineRow['stage'], interviewDate?: string): AstraData {
  let next = data;
  const note = (text: string) => [{ id: crypto.randomUUID(), text, time: 'Just now', read: false }, ...data.notifications];
  if (row.live) {
    const company = data.recruiter.company;
    next = {
      ...next,
      applications: next.applications.map(a => (a.title === row.jobTitle && a.company === company && a.stage !== 'Saved') ? { ...a, stage: stage as ApplicationStage } : a),
      notifications: note(`${company} moved your ${row.jobTitle} application to ${stage}.`),
    };
    if (stage === 'Interview' && interviewDate) {
      next = { ...next, interviews: [...next.interviews, { id: crypto.randomUUID(), company, role: row.jobTitle, date: interviewDate, stage: 'Interview scheduled' }] };
    }
    if (stage === 'Offer') {
      next = { ...next, notifications: [...note(`Offer: ${company} extended an offer for ${row.jobTitle}!`)] };
    }
  }
  if (stage === 'Interview' && interviewDate) {
    next = {
      ...next,
      recruiterInterviews: [...next.recruiterInterviews.filter(i => !(i.candidateId === row.candidateId && i.jobId === row.jobId)), { id: crypto.randomUUID(), jobId: row.jobId, candidateId: row.candidateId, candidateName: row.candidateName, role: row.jobTitle, date: interviewDate, stage: 'Scheduled' }],
    };
  }
  if (stage === 'Offer') {
    next = { ...next, recruiterOffers: next.recruiterOffers.some(o => o.candidateId === row.candidateId && o.jobId === row.jobId) ? next.recruiterOffers : [...next.recruiterOffers, { id: crypto.randomUUID(), jobId: row.jobId, candidateId: row.candidateId, candidateName: row.candidateName, role: row.jobTitle, date: 'Today', status: 'Extended' }] };
  }
  return next;
}

/** Derived recruiter metrics — no fallback fakes. */
function recruiterMetrics(data: AstraData) {
  const pipeline = recruiterPipeline(data);
  const by = (s: PipelineRow['stage']) => pipeline.filter(r => r.stage === s).length;
  const applied = pipeline.length;
  const placedInFunnel = by('Applied') + by('Screening') + by('Shortlisted') + by('Interview') + by('Offer') + by('Hired');
  return {
    pipeline,
    openJobs: data.recruiter.jobs.filter(j => j.status === 'Published').length,
    totalJobs: data.recruiter.jobs.length,
    candidates: unifiedCandidates(data).length,
    applications: applied,
    screening: by('Screening'),
    shortlisted: data.recruiter.shortlisted.length,
    interviews: data.recruiterInterviews.length,
    offers: data.recruiterOffers.length,
    hired: by('Hired'),
    rejected: by('Rejected'),
    activeInPipeline: placedInFunnel,
    conversion: placedInFunnel ? Math.round((by('Offer') + by('Hired')) / placedInFunnel * 100) : 0,
    profileViews: data.recruiter.profileViews.length,
  };
}
/** Shared saved-item helpers — one consistent saved map across every board. */
function boardSaved(data: AstraData, board: string): string[] { return data.saved[board] ?? []; }
function boardActioned(data: AstraData, board: string): string[] { return data.activity[board] ?? []; }
function toggleBoardSaved(d: AstraData, board: string, id: string): AstraData {
  const saved = boardSaved(d, board);
  return { ...d, saved: { ...d.saved, [board]: saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id] } };
}
/** Record an applied/joined/requested action on a board (optionally adding an application-tracker row). */
function markBoardActioned(d: AstraData, board: string, id: string, label: string, application?: { title: string; company: string; source: string }): AstraData {
  const done = boardActioned(d, board);
  return {
    ...d,
    activity: { ...d.activity, [board]: done.includes(id) ? done : [...done, id] },
    applications: application && !d.applications.some(a => a.title === application.title && a.company === application.company) ? [...d.applications, { id: crypto.randomUUID(), title: application.title, company: application.company, stage: 'Applied' as ApplicationStage, date: 'Today', source: application.source }] : d.applications,
    notifications: [{ id: crypto.randomUUID(), text: label, time: 'Just now', read: false }, ...d.notifications],
  };
}
function calculateSkillGaps(data: AstraData) { return data.skills.filter(s => s.status === 'MISSING' || s.level < 45).map(s => s.name); }
function roadmapProgressPct(data: AstraData) { const done = data.roadmap.filter(t => t.status === 'Complete' || t.status === 'In progress').length; return Math.round((done / Math.max(data.roadmap.length, 1)) * 100); }
function learningProgressPct(data: AstraData) { return data.courses.length ? Math.round(data.courses.reduce((sum, c) => sum + c.progress, 0) / data.courses.length) : 0; }

type NextAction = { title: string; tag: string; detail: string; href: string; cta: string };
function nextBestAction(data: AstraData): NextAction {
  const topGap = topGapFor(ROLE_DB, data.targetRole, data.skills);
  if (topGap) {
    if (topGap === 'HR Analytics') {
      return { title: `Validate ${topGap}`, tag: '20 min · assessment', detail: `A short assessment can move ${topGap} from MISSING to VERIFIED and update your roadmap.`, href: '/student/assessments', cta: 'Take assessment' };
    }
    const roadTask = data.roadmap.find(t => t.skill === topGap && t.status !== 'Complete');
    if (roadTask) {
      return { title: roadTask.title, tag: roadTask.week, detail: roadTask.detail, href: '/student/roadmap', cta: 'Open roadmap' };
    }
    return { title: `Build ${topGap}`, tag: 'learning', detail: `Start a focused course or artifact that turns ${topGap} into visible proof for ${data.targetRole} roles.`, href: '/student/learning', cta: 'Explore learning' };
  }
  const open = data.roadmap.find(t => t.status === 'In progress' || t.status === 'Up next');
  if (open) return { title: open.title, tag: open.week, detail: open.detail, href: '/student/roadmap', cta: 'Continue on your roadmap' };
  const match = data.jobs.reduce<Job | null>((best, job) => (best ? (calculateJobMatch(job, data) > calculateJobMatch(best, data) ? job : best) : job), null);
  if (match) return { title: match.title, tag: `${calculateJobMatch(match, data)}% match`, detail: `Your passport is ready — ${match.company} fits your verified signal.`, href: '/student/jobs', cta: 'View opportunities' };
  return { title: 'Publish your next proof', tag: 'career passport', detail: 'Add a project or outcome to keep your signal compounding.', href: '/student/projects', cta: 'Open projects' };
}

const studentNav = [
  { label: 'Overview', icon: Home, path: '/student/dashboard' },
  { label: 'Career Passport', icon: UserRound, path: '/student/career-passport' },
  { label: 'Autopilot roadmap', icon: Map, path: '/student/roadmap' },
  { label: 'Assessments', icon: ClipboardCheck, path: '/student/assessments' },
  { label: 'Learning', icon: BookOpen, path: '/student/learning' },
  { label: 'Projects', icon: Layers3, path: '/student/projects' },
  { label: 'Opportunities', icon: BriefcaseBusiness, path: '/student/jobs' },
  { label: 'Applications', icon: ListChecks, path: '/student/applications' },
];
const studentMore = [
  { label: 'Certifications', icon: Award, path: '/student/certifications' }, { label: 'Portfolio', icon: Compass, path: '/student/portfolio' },
  { label: 'Interview studio', icon: MessageCircle, path: '/student/interview' }, { label: 'ASTRA Copilot', icon: Sparkles, path: '/student/assistant' },
  { label: 'Mentors & alumni', icon: Users, path: '/student/mentors' }, { label: 'Analytics', icon: LineChart, path: '/student/analytics' },
  { label: 'Community', icon: Network, path: '/student/community' }, { label: 'Productivity', icon: Target, path: '/student/productivity' },
];
const studentOpps = [
  { label: 'Internships', icon: GraduationCap, path: '/student/internships' }, { label: 'Scholarships', icon: PiggyBank, path: '/student/scholarships' },
  { label: 'Hackathons', icon: Brain, path: '/student/hackathons' }, { label: 'Team finder', icon: Handshake, path: '/student/team-finder' },
  { label: 'Project marketplace', icon: Layers3, path: '/student/project-marketplace' }, { label: 'Research', icon: FlaskConical, path: '/student/research' },
  { label: 'Startup hub', icon: Lightbulb, path: '/student/startup-hub' },
];
const universityNav = [{ label: 'Overview', icon: Home, path: '/university/dashboard' }, { label: 'Students', icon: Users, path: '/university/students' }, { label: 'Placements', icon: BriefcaseBusiness, path: '/university/placements' }, { label: 'Analytics', icon: BarChart3, path: '/university/analytics' }, { label: 'Settings', icon: Settings, path: '/university/settings' }];
const recruiterNav = [{ label: 'Overview', icon: Home, path: '/recruiter/dashboard' }, { label: 'Talent search', icon: Search, path: '/recruiter/talent' }, { label: 'Jobs', icon: BriefcaseBusiness, path: '/recruiter/jobs' }, { label: 'Shortlist', icon: Star, path: '/recruiter/shortlist' }, { label: 'Interviews', icon: CalendarDays, path: '/recruiter/interviews' }, { label: 'Analytics', icon: BarChart3, path: '/recruiter/analytics' }, { label: 'Company', icon: Building2, path: '/recruiter/company' }, { label: 'Settings', icon: Settings, path: '/recruiter/settings' }];

function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`flex items-center gap-2 ${light ? 'text-[hsl(var(--sidebar-foreground))]' : ''}`} data-testid="link-logo"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--secondary))]"><Zap size={17} strokeWidth={3} /></span><span className="display text-xl font-bold tracking-tight">ASTRA</span></Link>;
}

function SideNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const { reset } = useAstra(); const [confirmReset, setConfirmReset] = useState(false);
  const [location] = useLocation();
  const nav = role === 'student' ? studentNav : role === 'university' ? universityNav : recruiterNav;
  const more = role === 'student' ? studentMore : [];
  const opps = role === 'student' ? studentOpps : [];
  const go = () => onNavigate?.();
  const linkClass = (path: string) => `side-link ${location === path ? 'active' : ''}`;
  return <aside className="side-nav">
    <div className="px-4 py-5" onClick={go}><Logo light /></div>
    <div className="px-4 pb-2"><div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent))] p-3"><div className="label text-[hsl(var(--sidebar-foreground)/.42)]">Workspace</div><div className="mt-1 flex items-center gap-2 text-sm font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-[hsl(var(--accent))] text-xs text-[hsl(var(--secondary))]">{role === 'student' ? 'AJ' : role === 'university' ? 'AU' : 'PS'}</span><span className="side-word">{role === 'student' ? 'Alex Johnson' : role === 'university' ? 'ASTRA University' : 'Priya Sharma'}</span></div></div></div>
    <nav className="side-section"><div className="side-section-title">Workspace</div>{nav.map(item => <Link key={item.path} href={item.path} onClick={go} className={linkClass(item.path)} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={16} /><span>{item.label}</span></Link>)}</nav>
    {more.length > 0 && <nav className="side-section"><div className="side-section-title">Build your edge</div>{more.map(item => <Link key={item.path} href={item.path} onClick={go} className={linkClass(item.path)} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={16} /><span>{item.label}</span></Link>)}</nav>}
    {opps.length > 0 && <nav className="side-section"><div className="side-section-title">Opportunities</div>{opps.map(item => <Link key={item.path} href={item.path} onClick={go} className={linkClass(item.path)} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={16} /><span>{item.label}</span></Link>)}</nav>}
    <div className="mt-auto space-y-1 p-4"><Link href="/login" className="side-link" onClick={go} data-testid="link-switch-demo"><Settings size={16} /><span>Switch demo</span></Link><button type="button" className="side-link w-full" onClick={() => setConfirmReset(true)} data-testid="button-reset-demo"><RotateCcw size={16} /><span>Reset demo</span></button></div>
    {confirmReset && <Modal title="Reset demo?" close={() => setConfirmReset(false)}><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">This restores the original seeded ASTRA demo: it clears assessments, roadmap progress, projects, jobs, applications, and any other changes made during this session, and brings back Alex Johnson's starting skills and readiness.</p><div className="mt-6 flex gap-2"><button className="btn btn-outline flex-1" onClick={() => setConfirmReset(false)} data-testid="button-cancel-reset">Cancel</button><button className="btn btn-primary flex-1" onClick={() => { reset(); setConfirmReset(false); }} data-testid="button-confirm-reset">Reset demo</button></div></Modal>}
  </aside>;
}

function TopBar({ role, onOpenMenu }: { role: Role; onOpenMenu?: () => void }) {
  const { data, update, toast } = useAstra();
  const [location, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  useEffect(() => {
    if (!notifOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNotifOpen(false); };
    const onDown = (e: MouseEvent) => { const el = e.target as HTMLElement | null; if (!el?.closest?.('[data-notif-root]')) setNotifOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown); };
  }, [notifOpen]);
  const title = location.split('/').pop()?.replaceAll('-', ' ') || 'overview';
  const catalog: { label: string; sub: string; href: string }[] = [
    ...data.jobs.map(j => ({ label: j.title, sub: `${j.company} · ${j.type} · job`, href: '/student/jobs' })),
    ...data.projects.map(p => ({ label: p.name, sub: `${p.status} project · proof`, href: '/student/projects' })),
    ...data.courses.map(c => ({ label: c.title, sub: `${c.provider} · learning`, href: '/student/learning' })),
    ...data.certifications.map(c => ({ label: c.name, sub: `${c.issuer} · certification`, href: '/student/certifications' })),
    ...INTERNSHIPS.map(o => ({ label: o.title, sub: `${o.org} · internship`, href: '/student/internships' })),
    ...SCHOLARSHIPS.map(o => ({ label: o.title, sub: `${o.org} · ${o.meta}`, href: '/student/scholarships' })),
    ...HACKATHONS.map(o => ({ label: o.title, sub: `${o.org} · hackathon`, href: '/student/hackathons' })),
    ...MARKETPLACE.map(o => ({ label: o.title, sub: `${o.org} · project brief`, href: '/student/project-marketplace' })),
    ...RESEARCH_OPPS.map(o => ({ label: o.title, sub: `${o.org} · research`, href: '/student/research' })),
    ...STARTUPS.map(o => ({ label: o.title, sub: `${o.org} · startup`, href: '/student/startup-hub' })),
    ...MENTORS.map(m => ({ label: m.name, sub: `${m.title} · ${m.org} · mentor`, href: '/student/mentors' })),
    ...ALUMNI.map(a => ({ label: a.name, sub: `${a.program} ${a.year} · ${a.company} · alumni`, href: '/student/alumni' })),
    { label: 'Career Passport', sub: 'verified skills & proof', href: '/student/career-passport' },
    { label: 'Autopilot roadmap', sub: `plan for ${data.targetRole}`, href: '/student/roadmap' },
    { label: 'HR Analytics assessment', sub: 'verify a missing skill', href: '/student/assessments' },
  ];
  const unread = data.notifications.filter(n => !n.read).length;
  const q = query.trim().toLowerCase();
  const results = q ? catalog.filter(r => `${r.label} ${r.sub}`.toLowerCase().includes(q)).slice(0, 7) : [];
  const go = (r: { label: string; href: string }) => { setQuery(''); setShowResults(false); navigate(r.href); };
  const group = (href: string) => { const map: Record<string, string> = { '/student/jobs': 'Jobs', '/student/internships': 'Internships', '/student/scholarships': 'Scholarships', '/student/hackathons': 'Hackathons', '/student/project-marketplace': 'Marketplace', '/student/research': 'Research', '/student/startup-hub': 'Startups', '/student/mentors': 'Mentors', '/student/alumni': 'Alumni', '/student/learning': 'Learning', '/student/certifications': 'Certifications', '/student/projects': 'Projects', '/student/roadmap': 'Roadmap', '/student/assessments': 'Assessments', '/student/career-passport': 'Passport' }; return map[href] ?? 'Workspace'; };
  return <header className="topbar flex items-center justify-between gap-3 px-4 md:px-7">
    <div className="flex min-w-0 items-center gap-3"><button className="btn btn-ghost !p-2 md:hidden" onClick={onOpenMenu} aria-label="Open navigation" data-testid="button-mobile-menu"><Menu size={18} /></button><div className="hidden text-sm capitalize text-[hsl(var(--muted-foreground))] md:block">{title}</div><div className="relative hidden max-w-md flex-1 md:block"><Search className="pointer-events-none absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={15} /><input value={query} onFocus={() => setShowResults(true)} onBlur={() => setTimeout(() => setShowResults(false), 160)} onChange={e => { setQuery(e.target.value); setShowResults(true); }} className="input !rounded-full !py-2 !pl-9 !text-xs" placeholder="Search jobs, internships, mentors, research…" aria-label="Search" data-testid="input-global-search" />{showResults && q && <div className="card absolute left-0 right-0 top-11 z-40 max-h-96 overflow-auto p-2">{results.length ? results.map((r, i) => <button key={`${r.label}-${i}`} onMouseDown={e => e.preventDefault()} onClick={() => go(r)} className="flex w-full items-start gap-2 rounded-lg p-2 text-left hover:bg-[hsl(var(--muted))]" data-testid={`button-search-result-${i}`}><Search className="mt-0.5 shrink-0 text-[hsl(var(--muted-foreground))]" size={13} /><span className="min-w-0"><span className="block truncate text-xs font-bold">{r.label}</span><span className="block truncate text-[.65rem] text-[hsl(var(--muted-foreground))]"><span className="text-[hsl(var(--primary))]">{group(r.href)}</span> · {r.sub}</span></span></button>) : <div className="p-2 text-xs text-[hsl(var(--muted-foreground))]">No matches across your career graph.</div>}</div>}</div></div>
    <div className="flex items-center gap-2"><div className="relative" data-notif-root><button className="btn btn-ghost relative !p-2" onClick={() => setNotifOpen(o => !o)} aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`} aria-expanded={notifOpen} data-testid="button-notifications"><Bell size={18} />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(var(--accent))] px-1 text-[9px] font-extrabold text-[hsl(var(--accent-foreground))]" data-testid="notif-badge">{unread}</span>}</button>{notifOpen && <div className="card absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden p-0" role="dialog" aria-label="Notifications" data-testid="panel-notifications"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3"><div className="text-sm font-bold">Notifications{unread > 0 && <span className="ml-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{unread} new</span>}</div>{unread > 0 && <button className="text-xs font-bold text-[hsl(var(--primary))]" onClick={() => { update(d => ({ ...d, notifications: d.notifications.map(n => ({ ...n, read: true })) })); }} data-testid="button-mark-all-read">Mark all read</button>}</div><div className="max-h-80 overflow-auto p-2">{data.notifications.length === 0 ? <div className="px-3 py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">You're all caught up — new career signal will land here.</div> : data.notifications.map(n => <div key={n.id} className={`flex gap-2.5 rounded-lg p-2.5 ${n.read ? 'opacity-60' : 'bg-[hsl(var(--muted)/.5)]'}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-[hsl(var(--border))]' : 'bg-[hsl(var(--accent))]'}`} /><div className="min-w-0"><div className="text-xs font-semibold leading-5">{n.text}</div><div className="mt-0.5 text-[.65rem] text-[hsl(var(--muted-foreground))]">{n.time}</div></div></div>)}</div></div>}</div><Link href={role === 'student' ? '/student/career-passport' : role === 'university' ? '/university/settings' : '/recruiter/company'} className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 pr-3" data-testid="link-account"><span className="grid h-7 w-7 place-items-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-[hsl(var(--primary-foreground))]">{role === 'student' ? 'AJ' : role === 'university' ? 'AU' : 'PS'}</span><span className="hidden text-xs font-bold sm:block">{role === 'student' ? 'Alex Johnson' : role === 'university' ? 'ASTRA' : 'Priya Sharma'}</span><ChevronDown size={13} className="text-[hsl(var(--muted-foreground))]" /></Link></div>
  </header>;
}

function Shell({ role, children }: { role: Role; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="app-shell noise"><SideNav role={role} /><MobileNav role={role} open={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="main-area"><TopBar role={role} onOpenMenu={() => setMobileOpen(true)} /><main className="page-pad mx-auto max-w-[1440px] p-4 md:p-7">{children}</main></div></div>;
}

function MobileNav({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="mobile-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Navigation menu"><div className="mobile-drawer" onClick={e => e.stopPropagation()}><button type="button" className="mobile-drawer-close" onClick={onClose} aria-label="Close navigation" data-testid="button-close-mobile-nav"><X size={18} /></button><SideNav role={role} onNavigate={onClose} /></div></div>;
}

function Kicker({ children }: { children: ReactNode }) { return <div className="label">{children}</div>; }
function SectionHeading({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode }) { return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div>{eyebrow && <Kicker>{eyebrow}</Kicker>}<h1 className="display mt-1 text-2xl font-bold md:text-3xl">{title}</h1>{detail && <p className="mt-1 max-w-2xl text-sm text-[hsl(var(--muted-foreground))]">{detail}</p>}</div>{action}</div>; }
function StatCard({ icon: Icon, label, value, trend, tone = 'teal' }: { icon: typeof Activity; label: string; value: string | number; trend?: string; tone?: 'teal' | 'orange' | 'blue' | 'red' }) { const bg = tone === 'orange' ? 'bg-[hsl(var(--accent)/.2)]' : tone === 'blue' ? 'bg-[hsl(var(--chart-3)/.13)]' : tone === 'red' ? 'bg-[hsl(var(--destructive)/.12)]' : 'bg-[hsl(var(--primary)/.13)]'; return <div className="card card-hover p-4"><div className="flex items-start justify-between"><span className={`grid h-9 w-9 place-items-center rounded-lg ${bg}`}><Icon size={17} /></span>{trend && <span className="tag !bg-transparent !p-0 text-[hsl(143 44% 36%)]">{trend}</span>}</div><div className="mt-4 text-2xl font-bold tracking-tight">{value}</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{label}</div></div>; }
function ProgressRing({ value, size = 116 }: { value: number; size?: number }) { return <div className="relative grid place-items-center" style={{ width: size, height: size }}><svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={(size - 12) / 2} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" /><circle cx={size / 2} cy={size / 2} r={(size - 12) / 2} fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(size - 12) * Math.PI}`} strokeDashoffset={`${(size - 12) * Math.PI * (1 - value / 100)}`} /></svg><div className="absolute text-center"><div className="display text-2xl font-bold">{value}%</div><div className="label !text-[.54rem]">ready</div></div></div>; }

function Landing() {
  const { data } = useAstra();
  const [demo, setDemo] = useState<Role>('student');
  const readiness = calculateReadiness(data);
  const matches = data.jobs.map(j => calculateJobMatch(j, data));
  const roadmapPct = roadmapProgressPct(data);
  const topJob = data.jobs[0];
  const next = nextBestAction(data);
  return <div className="noise min-h-dvh overflow-hidden">
    <LandingHero
      data={{
        name: data.studentProfile.name,
        initials: data.studentProfile.initials,
        targetRole: data.studentProfile.targetRole,
        readiness,
        verifiedSkills: data.verifiedSkills.length,
        projects: data.projects.length,
        certifications: data.certifications.length,
        applications: data.applications.length,
        interviews: data.interviews.length,
        roadmapPct,
        jobMatchBest: Math.max(0, ...matches),
        topJob: topJob?.title ?? 'People Operations Specialist',
        topJobMatch: topJob ? calculateJobMatch(topJob, data) : 0,
        gap: topGapFor(ROLE_DB, data.targetRole, data.skills),
        nextAction: next.title,
      }}
    />
    <section id="demo" className="mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28"><SectionHeading eyebrow="Explore the system" title="One source of truth. Three powerful views." detail="Pick a lens and see how ASTRA turns career data into decisions." /><div className="grid gap-4 md:grid-cols-3">{(['student', 'university', 'recruiter'] as Role[]).map(role => <button key={role} onClick={() => setDemo(role)} className={`card card-hover p-5 text-left ${demo === role ? '!border-[hsl(var(--primary))] !bg-[hsl(var(--primary)/.06)]' : ''}`} data-testid={`button-demo-${role}`}><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--muted))]">{role === 'student' ? <UserRound size={18} /> : role === 'university' ? <Building2 size={18} /> : <BriefcaseBusiness size={18} />}</span><ChevronRight size={17} className="text-[hsl(var(--muted-foreground))]" /></div><div className="mt-8 text-lg font-bold capitalize">{role} view</div><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{role === 'student' ? 'Build signal, close gaps, and move with confidence.' : role === 'university' ? 'See readiness and outcomes across every cohort.' : 'Find verified talent with context, not keywords.'}</p><Link href={role === 'student' ? '/student/dashboard' : role === 'university' ? '/university/dashboard' : '/recruiter/dashboard'} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]" data-testid={`link-open-${role}`}>Open demo <ArrowRight size={14} /></Link></button>)}</div></section>
    <section id="system" className="bg-[hsl(var(--secondary))] px-6 py-20 text-[hsl(var(--secondary-foreground))] md:px-8 md:py-28"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="The ASTRA loop" title="From scattered effort to visible momentum." detail="Every action compounds into a sharper Career Passport." /><div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-border))] sm:grid-cols-2 lg:grid-cols-4">{[['01','Capture','Your education, work, projects, and proof live together.'],['02','See the gap','Rules-based intelligence spots what stands between you and the role.'],['03','Take the next step','A roadmap turns the gap into one focused move at a time.'],['04','Get the outcome','Applications, interviews, and offers close the loop.']].map(([n, t, d]) => <div key={n} className="bg-[hsl(var(--secondary))] p-6"><div className="mono text-sm text-[hsl(var(--accent))]">{n}</div><div className="mt-10 text-xl font-bold">{t}</div><p className="mt-3 text-sm leading-6 text-[hsl(var(--secondary-foreground)/.58)]">{d}</p></div>)}</div></div></section>
    <section id="how" className="mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><Kicker>Designed for motion</Kicker><h2 className="display mt-3 text-4xl font-bold">The right signal, at the right moment.</h2><p className="mt-5 text-sm leading-7 text-[hsl(var(--muted-foreground))]">ASTRA is opinionated enough to guide you and flexible enough to stay yours. No black box. No dead ends.</p><Link href="/pricing" className="btn btn-dark mt-7" data-testid="button-see-pricing">See plans <ArrowRight size={15} /></Link></div><div className="grid gap-3 sm:grid-cols-2">{[['Career Passport','The living source of truth recruiters actually want to see.'],['Skill gaps','Know the difference between “I have done it” and “I can prove it.”'],['Opportunity radar','Roles, mentors, and projects ranked by your actual signal.'],['Interview studio','Practice with context pulled from your own story.']].map(([t, d], i) => <div key={t} className={`card p-5 ${i === 1 ? 'sm:translate-y-8' : ''}`}><div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--primary)/.13)] text-[hsl(var(--primary))]"><Sparkles size={16} /></div><div className="mt-6 font-bold">{t}</div><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{d}</p></div>)}</div></div></section>
    <footer className="border-t border-[hsl(var(--border))] px-6 py-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><Logo /><div className="flex gap-5 text-xs text-[hsl(var(--muted-foreground))]"><Link href="/pricing">Pricing</Link><Link href="/login">Demo login</Link><Link href="/signup">Sign up</Link></div><span className="text-xs text-[hsl(var(--muted-foreground))]">A focused future, built daily.</span></div></footer>
  </div>;
}

const BAND_LABEL: Record<string, string> = { missing: 'Missing', basic: 'Basic', developing: 'Developing' };
function Dashboard() {
  const { data } = useAstra(); const readiness = calculateReadiness(data); const gaps = rankedRoleGaps(ROLE_DB, data.targetRole, data.skills); const topGap = topGapFor(ROLE_DB, data.targetRole, data.skills); const next = nextBestAction(data);
  const verified = data.verifiedSkills.slice(0, 2).join(' and ') || 'your core skills';
  return <><SectionHeading eyebrow="Monday, March 11 · Your command center" title={`Good morning, ${data.studentProfile.name.split(' ')[0]}.`} detail="A clear view of where you are, what matters next, and the proof that moves you forward." action={<Link href="/student/roadmap" className="btn btn-primary" data-testid="button-open-autopilot"><Sparkles size={15} /> Open Autopilot</Link>} />
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><div className="card relative overflow-hidden bg-[hsl(var(--secondary))] p-6 text-[hsl(var(--secondary-foreground))]"><div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[hsl(var(--primary)/.2)] blur-3xl" /><div className="relative flex flex-wrap items-center justify-between gap-8"><div><Kicker>Readiness signal</Kicker><h2 className="display mt-2 text-3xl font-bold">You are closer than you think.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[hsl(var(--secondary-foreground)/.62)]">{topGap ? `Your proof is strong in ${verified}. Close the ${topGap} gap to unlock the next tier of ${data.targetRole} roles.` : 'Your critical skills are verified and your proof is compounding. The next move is turning that signal into an outcome.'}</p><Link href={next.href} className="btn btn-warm mt-5" data-testid="button-close-gap">{topGap ? `Close the ${topGap} gap` : 'Explore matching roles'} <ArrowRight size={15} /></Link></div><ProgressRing value={readiness} /></div></div><div className="card p-6"><div className="flex items-center justify-between"><div><Kicker>Next best action</Kicker><h3 className="mt-2 text-lg font-bold">{next.title}</h3></div><span className="tag status-basic">{next.tag}</span></div><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{next.detail}</p><Link href={next.href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]" data-testid="link-next-action">{next.cta} <ArrowRight size={14} /></Link></div></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={TrendingUp} label="Career readiness" value={`${readiness}%`} trend="Signal score" /><StatCard icon={Map} label="Roadmap progress" value={`${roadmapProgressPct(data)}%`} trend="On track" tone="orange" /><StatCard icon={BriefcaseBusiness} label="Active applications" value={data.applications.filter(a => ['Applied', 'Screening', 'Interview'].includes(a.stage)).length} trend="Moving forward" tone="blue" /><StatCard icon={Award} label="Profile strength" value={`${calculateProfileStrength(data)}%`} trend="Solid foundation" tone="orange" /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><div className="card p-6"><div className="flex items-center justify-between"><div><Kicker>Autopilot roadmap</Kicker><h3 className="mt-1 text-lg font-bold">Your next moves</h3></div><Link href="/student/roadmap" className="text-xs font-bold text-[hsl(var(--primary))]" data-testid="link-roadmap">View roadmap</Link></div><div className="mt-6 space-y-4">{data.roadmap.slice(0, 4).map((task, i) => <div key={task.id} className="flex gap-3"><div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${task.status === 'Complete' ? 'bg-[hsl(143_44%_90%)] text-[hsl(143_44%_33%)]' : task.status === 'In progress' ? 'bg-[hsl(var(--accent)/.32)] text-[hsl(var(--secondary))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>{task.status === 'Complete' ? <Check size={14} /> : <span className="mono text-[10px]">{String(i + 1).padStart(2, '0')}</span>}</div><div className="min-w-0 flex-1 border-b border-[hsl(var(--border))] pb-4"><div className="flex flex-wrap justify-between gap-2"><span className="font-bold">{task.title}</span><span className="mono text-[10px] text-[hsl(var(--muted-foreground))]">{task.week}</span></div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{task.detail}</p></div></div>)}</div></div><div className="space-y-5"><div className="card p-6"><div className="flex items-center justify-between"><Kicker>Skill gaps · {data.targetRole}</Kicker><Link href="/student/roadmap" className="text-xs font-bold text-[hsl(var(--primary))]" data-testid="link-skills">Roadmap</Link></div><div className="mt-4 space-y-3">{gaps.length ? gaps.slice(0, 4).map(gap => <div key={gap.name}><div className="flex justify-between text-xs"><span className="font-semibold">{gap.name}</span><span className={gap.band === 'missing' ? 'text-[hsl(var(--destructive))] capitalize' : gap.band === 'basic' ? 'text-[hsl(32_74%_38%)] capitalize' : 'text-[hsl(225_62%_45%)] capitalize'}>{BAND_LABEL[gap.band]}</span></div><div className="progress mt-2"><i className={gap.band === 'missing' ? '!bg-[hsl(var(--destructive))]' : gap.band === 'basic' ? '!bg-[hsl(32_74%_38%)]' : '!bg-[hsl(225_62%_45%)]'} style={{ width: `${Math.max(gap.level || 4, 4)}%` }} /></div></div>) : <p className="text-sm text-[hsl(var(--muted-foreground))]">Every {data.targetRole} skill you need is verified. Nice.</p>}</div></div><div className="card p-6"><div className="flex items-center gap-2"><Bell size={16} className="text-[hsl(var(--accent-foreground))]" /><Kicker>Recent signal</Kicker></div><div className="mt-4 space-y-3">{data.notifications.map(n => <div key={n.id} className="flex gap-3 text-xs"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--accent))]" /><div><div className="font-semibold">{n.text}</div><div className="mt-1 text-[hsl(var(--muted-foreground))]">{n.time}</div></div></div>)}</div></div></div></div>
  </>;
}

function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    boxRef.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [close]);
  return <div className="modal-backdrop" onMouseDown={close}><div ref={boxRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="modal p-6 outline-none" onMouseDown={e => e.stopPropagation()}><div className="flex items-center justify-between"><h2 className="display text-xl font-bold">{title}</h2><button className="btn btn-ghost !p-2" onClick={close} aria-label="Close" data-testid="button-close-modal"><X size={18} /></button></div>{children}</div></div>; }

function Passport() {
  const { data, update, toast } = useAstra(); const [modal, setModal] = useState<'skill' | 'cert' | 'project' | 'experience' | null>(null);
  const [value, setValue] = useState('');
  const add = () => { if (!value.trim()) return; update(d => modal === 'skill' ? ({ ...d, skills: [...d.skills, { name: value, status: 'BASIC', level: 25 }] }) : modal === 'cert' ? ({ ...d, certifications: [...d.certifications, { id: crypto.randomUUID(), name: value, issuer: 'Self-added', status: 'In progress', date: '—' }] }) : modal === 'project' ? ({ ...d, projects: [...d.projects, { id: crypto.randomUUID(), name: value, summary: 'A new proof of work in progress.', tools: ['To be added'], skills: [d.targetRole], outcome: 'Define your result.', status: 'Draft' }] }) : ({ ...d, experience: [...d.experience, { id: crypto.randomUUID(), role: value, company: 'New experience', period: 'Current', description: 'Add your contribution and outcome.' }] })); setValue(''); setModal(null); toast('Career Passport updated'); };
  return <><SectionHeading eyebrow="Your source of truth" title="Career Passport" detail="Everything ASTRA knows about your direction, proof, and potential. Keep it current; make it undeniable." action={<span className="tag status-verified"><Check size={12} /> Synced locally</span>} /><div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]"><div className="space-y-5"><div className="card p-6"><div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-xl font-bold text-[hsl(var(--accent))]">AJ</div><div><h2 className="text-xl font-bold">{data.studentProfile.name}</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{data.studentProfile.program}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{data.studentProfile.school} · Class of {data.studentProfile.graduation}</p></div></div><p className="mt-5 text-sm leading-6">{data.studentProfile.bio}</p><div className="mt-5 rounded-xl bg-[hsl(var(--muted)/.7)] p-4"><Kicker>Career goal</Kicker><div className="mt-2 flex items-center justify-between"><span className="font-bold">{data.targetRole}</span><span className="tag !bg-[hsl(var(--accent)/.35)]">{formatTimeline(data.timeline)}</span></div></div></div><div className="card p-6"><div className="flex items-center justify-between"><Kicker>Profile strength</Kicker><span className="display text-2xl font-bold text-[hsl(var(--primary))]">{calculateProfileStrength(data)}%</span></div><div className="progress mt-3"><i style={{ width: `${calculateProfileStrength(data)}%` }} /></div><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">Add an outcome to your next project to move this signal.</p></div></div><div className="space-y-5"><div className="card p-6"><div className="flex items-center justify-between"><div><Kicker>Signal library</Kicker><h3 className="mt-1 text-lg font-bold">Skills & proof</h3></div><button className="btn btn-outline !px-3 !py-2" onClick={() => setModal('skill')} data-testid="button-add-skill"><Plus size={14} /> Add skill</button></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{data.skills.map(skill => <div key={skill.name} className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] p-3"><div><div className="text-sm font-bold">{skill.name}</div><div className="mt-2 progress w-28"><i style={{ width: `${skill.level}%` }} /></div></div><span className={`tag status-${skill.status.toLowerCase()}`}>{skill.status}</span></div>)}</div></div><div className="grid gap-5 md:grid-cols-2"><CollectionCard title="Certifications" items={data.certifications.map(c => `${c.name} · ${c.status}`)} action={() => setModal('cert')} actionLabel="Add certification" /><CollectionCard title="Experience" items={data.experience.map(e => `${e.role} · ${e.company}`)} action={() => setModal('experience')} actionLabel="Add experience" /><CollectionCard title="Projects" items={data.projects.map(p => `${p.name} · ${p.status}`)} action={() => setModal('project')} actionLabel="Add project" /><CollectionCard title="Achievements" items={data.achievements} action={() => toast('Achievement editor is ready in the next profile pass.')} actionLabel="Edit list" /></div></div></div>{modal && <Modal title={`Add ${modal}`} close={() => setModal(null)}><label className="mt-6 block text-xs font-bold">Name or title<input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} className="input mt-2" placeholder={`e.g. ${modal === 'skill' ? 'People analytics' : modal === 'project' ? 'Hiring funnel teardown' : 'Your new item'}`} data-testid={`input-add-${modal}`} /></label><button className="btn btn-primary mt-5 w-full" onClick={add} data-testid={`button-save-${modal}`}>Save to Career Passport <Check size={15} /></button></Modal>}</>;
}
function CollectionCard({ title, items, action, actionLabel }: { title: string; items: string[]; action: () => void; actionLabel: string }) { return <div className="card p-5"><div className="flex items-center justify-between"><Kicker>{title}</Kicker><button className="btn btn-ghost !p-1.5" onClick={action} aria-label={actionLabel} data-testid={`button-${actionLabel.toLowerCase().replaceAll(' ', '-')}`}><Plus size={15} /></button></div><div className="mt-4 space-y-3">{items.map((item, i) => <div key={`${item}-${i}`} className="flex items-start gap-2 text-xs font-semibold"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--primary))]" />{item}</div>)}</div></div>; }

const ROLE_DB: Record<string, RoleRequirements> = {
  'Product Manager': {
    category: 'Business & Management',
    skills: ['Product Strategy', 'User Research', 'Product Analytics', 'Market Research', 'Roadmapping', 'Prioritization', 'Agile', 'Stakeholder Management', 'Communication', 'Problem Solving'],
    phases: [
      { title: 'Understand Product Fundamentals', duration: 'Weeks 1–2', tasks: [
        { title: 'Master Product Strategy basics', skill: 'Product Strategy', impact: 10, link: '/student/learning' },
        { title: 'Learn Market Research patterns', skill: 'Market Research', impact: 8, link: '/student/learning' },
      ]},
      { title: 'Build Product Skills', duration: 'Weeks 3–6', tasks: [
        { title: 'Complete Product Analytics assessment', skill: 'Product Analytics', impact: 12, link: '/student/assessments' },
        { title: 'Run a User Research sprint', skill: 'User Research', impact: 10, link: '/student/projects' },
        { title: 'Practice Prioritization frameworks', skill: 'Prioritization', impact: 8, link: '/student/learning' },
      ]},
      { title: 'Create Product Proof', duration: 'Weeks 7–9', tasks: [
        { title: 'Build a Product Roadmap for a real app', skill: 'Roadmapping', impact: 15, link: '/student/projects' },
        { title: 'Draft a PRD for a new feature', skill: 'Documentation', impact: 8, link: '/student/portfolio' },
      ]},
      { title: 'Interview & Apply', duration: 'Weeks 10–12', tasks: [
        { title: 'Practice PM Case Interviews', skill: 'Problem Solving', impact: 12, link: '/student/interview' },
        { title: 'Optimize PM Portfolio', skill: 'Communication', impact: 10, link: '/student/portfolio' },
      ]},
    ],
    why: 'ASTRA starts with product fundamentals because they unlock the analytical and strategic work required later. Once you have the foundation, the roadmap moves into portfolio proof and interview readiness.'
  },
  'Business Analyst': {
    category: 'Business & Management',
    skills: ['Requirements Gathering', 'Business Process Mapping', 'SQL', 'Excel', 'Power BI', 'Stakeholder Management', 'Documentation', 'Data Analysis', 'Problem Solving'],
    phases: [
      { title: 'Analysis Foundation', duration: 'Weeks 1–3', tasks: [
        { title: 'Master Requirements Gathering', skill: 'Requirements Gathering', impact: 10, link: '/student/learning' },
        { title: 'Learn Business Process Mapping', skill: 'Business Process Mapping', impact: 8, link: '/student/learning' },
      ]},
      { title: 'Technical Tooling', duration: 'Weeks 4–8', tasks: [
        { title: 'SQL for Business Analysis', skill: 'SQL', impact: 12, link: '/student/assessments' },
        { title: 'Advanced Excel for BA', skill: 'Excel', impact: 10, link: '/student/learning' },
        { title: 'Build Power BI dashboards', skill: 'Power BI', impact: 12, link: '/student/projects' },
      ]},
      { title: 'Professional Application', duration: 'Weeks 9–12', tasks: [
        { title: 'Case Study: Process Optimization', skill: 'Problem Solving', impact: 15, link: '/student/projects' },
        { title: 'Stakeholder Management simulation', skill: 'Stakeholder Management', impact: 10, link: '/student/interview' },
      ]},
    ],
    why: 'ASTRA prioritizes technical tooling (SQL/Excel) early on, as these are the non-negotiable baseline for any modern Business Analyst role.'
  },
  'HR Business Partner': {
    category: 'HR',
    skills: ['HR Strategy', 'Employee Relations', 'Workforce Planning', 'Performance Management', 'Employee Engagement', 'HR Analytics', 'Leadership', 'Stakeholder Management', 'Communication'],
    phases: [
      { title: 'HR Strategy Foundation', duration: 'Month 1', tasks: [
        { title: 'Learn HR Strategy frameworks', skill: 'HR Strategy', impact: 10, link: '/student/learning' },
        { title: 'Study Employee Relations laws', skill: 'Employee Relations', impact: 8, link: '/student/learning' },
      ]},
      { title: 'People Management Skills', duration: 'Month 2', tasks: [
        { title: 'Performance Management simulation', skill: 'Performance Management', impact: 12, link: '/student/learning' },
        { title: 'Employee Engagement strategy', skill: 'Employee Engagement', impact: 10, link: '/student/projects' },
      ]},
      { title: 'HR Analytics & Workforce Planning', duration: 'Month 3', tasks: [
        { title: 'Complete HR Analytics assessment', skill: 'HR Analytics', impact: 15, link: '/student/assessments' },
        { title: 'Build a Workforce Plan', skill: 'Workforce Planning', impact: 12, link: '/student/projects' },
      ]},
      { title: 'Build Career Proof', duration: 'Month 4-5', tasks: [
        { title: 'Lead a mock HR project', skill: 'Leadership', impact: 10, link: '/student/projects' },
        { title: 'Create HRBP Case Study', skill: 'Communication', impact: 10, link: '/student/portfolio' },
      ]},
      { title: 'Interview & Placement', duration: 'Month 6', tasks: [
        { title: 'Practice HRBP Interviews', skill: 'Stakeholder Management', impact: 12, link: '/student/interview' },
      ]},
    ],
    why: 'ASTRA prioritizes HR analytics and workforce planning because they strengthen the strategic evidence required for an HR Business Partner role.'
  },
  'Talent Acquisition Specialist': {
    category: 'HR',
    skills: ['Recruitment', 'Sourcing', 'Candidate Screening', 'Interviewing', 'ATS', 'Employer Branding', 'Candidate Experience', 'Communication'],
    phases: [
      { title: 'Sourcing Mastery', duration: 'Weeks 1–4', tasks: [
        { title: 'Learn Boolean Sourcing', skill: 'Sourcing', impact: 10, link: '/student/learning' },
        { title: 'Candidate Screening patterns', skill: 'Candidate Screening', impact: 8, link: '/student/learning' },
      ]},
      { title: 'Process & Tooling', duration: 'Weeks 5–8', tasks: [
        { title: 'Master ATS workflows', skill: 'ATS', impact: 10, link: '/student/learning' },
        { title: 'Employer Branding strategy', skill: 'Employer Branding', impact: 12, link: '/student/projects' },
      ]},
      { title: 'Candidate Experience', duration: 'Weeks 9–12', tasks: [
        { title: 'Optimize Candidate Journey', skill: 'Candidate Experience', impact: 12, link: '/student/projects' },
        { title: 'Interviewing techniques', skill: 'Interviewing', impact: 15, link: '/student/interview' },
      ]},
    ],
    why: 'ASTRA focuses on the sourcing funnel first, ensuring you can find the right talent before mastering the art of the interview.'
  },
  'Marketing Manager': {
    category: 'Marketing',
    skills: ['Marketing Strategy', 'Consumer Behaviour', 'Market Research', 'Brand Management', 'Digital Marketing', 'Campaign Management', 'Analytics', 'Communication'],
    phases: [
      { title: 'Market Intelligence', duration: 'Month 1', tasks: [
        { title: 'Consumer Behaviour basics', skill: 'Consumer Behaviour', impact: 10, link: '/student/learning' },
        { title: 'Market Research project', skill: 'Market Research', impact: 12, link: '/student/projects' },
      ]},
      { title: 'Brand & Digital', duration: 'Month 2', tasks: [
        { title: 'Digital Marketing certification', skill: 'Digital Marketing', impact: 10, link: '/student/learning' },
        { title: 'Brand Management framework', skill: 'Brand Management', impact: 10, link: '/student/learning' },
      ]},
      { title: 'Campaign Execution', duration: 'Month 3', tasks: [
        { title: 'Build a Campaign Plan', skill: 'Campaign Management', impact: 15, link: '/student/projects' },
        { title: 'Marketing Analytics assessment', skill: 'Analytics', impact: 12, link: '/student/assessments' },
      ]},
    ],
    why: 'ASTRA starts with intelligence (consumer behaviour/market research) because great marketing is built on data, not guesses.'
  },
  'Data Scientist': {
    category: 'Analytics & Technology',
    skills: ['Python', 'SQL', 'Statistics', 'Machine Learning', 'Pandas', 'NumPy', 'Data Cleaning', 'Data Visualization', 'Model Evaluation'],
    phases: [
      { title: 'Python & Statistics', duration: 'Months 1–3', tasks: [
        { title: 'Python for Data Science', skill: 'Python', impact: 12, link: '/student/learning' },
        { title: 'SQL for Data Science', skill: 'SQL', impact: 10, link: '/student/assessments' },
        { title: 'Statistical foundations', skill: 'Statistics', impact: 10, link: '/student/learning' },
      ]},
      { title: 'Machine Learning', duration: 'Months 4–6', tasks: [
        { title: 'ML Algorithm basics', skill: 'Machine Learning', impact: 15, link: '/student/learning' },
        { title: 'Pandas & NumPy mastery', skill: 'Pandas', impact: 10, link: '/student/learning' },
        { title: 'Data Cleaning project', skill: 'Data Cleaning', impact: 12, link: '/student/projects' },
      ]},
      { title: 'Projects & Portfolio', duration: 'Months 7–9', tasks: [
        { title: 'End-to-end ML Project', skill: 'Model Evaluation', impact: 15, link: '/student/projects' },
        { title: 'Data Visualization portfolio', skill: 'Data Visualization', impact: 10, link: '/student/portfolio' },
      ]},
      { title: 'Advanced Skills', duration: 'Months 10–12', tasks: [
        { title: 'Deep Learning intro', skill: 'Machine Learning', impact: 8, link: '/student/learning' },
        { title: 'Portfolio review', skill: 'Communication', impact: 10, link: '/student/interview' },
      ]},
    ],
    why: 'ASTRA prioritizes Python and statistics first because they unlock machine learning, modelling and portfolio projects later in the roadmap.'
  },
  'Financial Analyst': {
    category: 'Finance',
    skills: ['Financial Analysis', 'Excel', 'Financial Modelling', 'Financial Statements', 'Valuation', 'Forecasting', 'Power BI', 'Business Communication'],
    phases: [
      { title: 'Financial Core', duration: 'Weeks 1–4', tasks: [
        { title: 'Financial Statement analysis', skill: 'Financial Statements', impact: 12, link: '/student/learning' },
        { title: 'Excel for Finance', skill: 'Excel', impact: 10, link: '/student/assessments' },
      ]},
      { title: 'Valuation & Modelling', duration: 'Weeks 5–8', tasks: [
        { title: 'Build a DCF Model', skill: 'Financial Modelling', impact: 15, link: '/student/projects' },
        { title: 'Company Valuation project', skill: 'Valuation', impact: 12, link: '/student/projects' },
      ]},
      { title: 'Forecasting & Reporting', duration: 'Weeks 9–12', tasks: [
        { title: 'Financial Forecasting basics', skill: 'Forecasting', impact: 10, link: '/student/learning' },
        { title: 'Power BI for Finance', skill: 'Power BI', impact: 10, link: '/student/learning' },
      ]},
    ],
    why: 'ASTRA builds from the ground up: statements first, then modelling, then forecasting, mirroring how real-world financial analysis scales.'
  },
  'Software Engineer': {
    category: 'Analytics & Technology',
    skills: ['Programming', 'Data Structures', 'Algorithms', 'Git', 'Databases', 'APIs', 'Testing', 'Software Development'],
    phases: [
      { title: 'CS Fundamentals', duration: 'Months 1–3', tasks: [
        { title: 'Programming proficiency', skill: 'Programming', impact: 12, link: '/student/learning' },
        { title: 'Data Structures & Algorithms', skill: 'Algorithms', impact: 15, link: '/student/assessments' },
      ]},
      { title: 'Engineering Tooling', duration: 'Months 4–6', tasks: [
        { title: 'Git & Version Control', skill: 'Git', impact: 8, link: '/student/learning' },
        { title: 'Database design', skill: 'Databases', impact: 10, link: '/student/projects' },
        { title: 'Building REST APIs', skill: 'APIs', impact: 12, link: '/student/projects' },
      ]},
      { title: 'Software Development', duration: 'Months 7–12', tasks: [
        { title: 'Testing & Quality Assurance', skill: 'Testing', impact: 10, link: '/student/learning' },
        { title: 'Full-stack project', skill: 'Software Development', impact: 15, link: '/student/projects' },
      ]},
    ],
    why: 'ASTRA prioritizes the "hard" fundamentals (DSA) first, as they are the primary gatekeepers for engineering roles at top firms.'
  },
};

function Roadmap() {
  const { data, update, toast } = useAstra(); const [generating, setGenerating] = useState(false); const [stage, setStage] = useState(''); const [selected, setSelected] = useState<AstraData['roadmap'][number] | null>(null); const [roleQuery, setRoleQuery] = useState(''); const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleKeys = Object.keys(ROLE_DB).sort(); const preset = timelinePresetFor(data.timeline); const progressPct = roadmapProgressPct(data); const topGap = topGapFor(ROLE_DB, data.targetRole, data.skills);
  const complete = (id: string) => { update(d => ({ ...d, roadmap: d.roadmap.map(t => t.id === id ? { ...t, status: 'Complete' } : t), notifications: [{ id: crypto.randomUUID(), text: 'Roadmap progress updated — your readiness signal is stronger.', time: 'Just now', read: false }, ...d.notifications] })); toast('Task marked complete'); };
  const generate = () => { if (!ROLE_DB[data.targetRole]) { toast('Pick a supported target role from the list'); return; } setGenerating(true); setStage('Analyzing Career Passport...'); runRoadmapPipeline(ROLE_DB, data.targetRole, data.skills, data.timeline, data.roadmap, setStage).then(plan => { update(d => ({ ...d, roadmap: plan, notifications: [{ id: crypto.randomUUID(), text: `Career Autopilot rebuilt your ${formatTimeline(d.timeline)} plan for ${d.targetRole}.`, time: 'Just now', read: false }, ...d.notifications] })); setGenerating(false); setStage(''); toast('Roadmap generated from your Career Passport'); }); };
  return <><SectionHeading eyebrow="Career Autopilot" title="A roadmap that knows why." detail="Your target role, timeline, and evidence shape every next move. Change the inputs; regenerate the plan." action={<button className="btn btn-primary" onClick={generate} disabled={generating} data-testid="button-generate-roadmap"><Sparkles size={15} /> {generating ? stage : 'Regenerate roadmap'}</button>} /><div className="grid gap-5 xl:grid-cols-[1fr_.65fr]"><div className="card p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Target role<div className="relative mt-2"><input className="input" value={roleMenuOpen ? roleQuery : data.targetRole} onFocus={() => { setRoleQuery(''); setRoleMenuOpen(true); }} onChange={e => setRoleQuery(e.target.value)} onBlur={() => setTimeout(() => setRoleMenuOpen(false), 140)} placeholder="Search a role…" aria-label="Search target role" data-testid="input-role-search" />{roleMenuOpen && <div className="card absolute left-0 right-0 top-11 z-30 max-h-56 overflow-auto p-1.5">{roleKeys.filter(k => k.toLowerCase().includes(roleQuery.toLowerCase())).map(k => <button key={k} type="button" onMouseDown={e => { e.preventDefault(); update(d => ({ ...d, targetRole: k })); setRoleMenuOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold ${data.targetRole === k ? 'bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]' : 'hover:bg-[hsl(var(--muted))]'}`} data-testid={`option-role-${k.toLowerCase().replaceAll(' ', '-')}`}><span>{k}</span>{data.targetRole === k && <Check size={14} />}</button>)}</div>}</div></label><label className="text-xs font-bold">Timeline<select className="input mt-2" value={String(data.timeline)} onChange={e => update(d => ({ ...d, timeline: Number(e.target.value) }))} data-testid="select-timeline">{TIMELINE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></label></div><div className="mt-4 flex flex-wrap gap-2">{TIMELINE_PRESETS.map(p => <button key={p.label} type="button" onClick={() => update(d => ({ ...d, timeline: p.range[1] }))} className={`tag cursor-pointer transition ${preset.label === p.label ? 'status-verified' : ''}`} title={p.blurb} data-testid={`preset-${p.label.toLowerCase().replaceAll(' ', '-')}`}>{p.label}</button>)}</div><div className="mt-8 flex items-center justify-between"><div><Kicker>Generated for {data.targetRole}</Kicker><h2 className="mt-1 text-lg font-bold">{data.roadmap.filter(t => t.status === 'Complete').length} of {data.roadmap.length} moves complete</h2></div><div className="text-right"><div className="display text-3xl font-bold text-[hsl(var(--primary))]">{progressPct}%</div><div className="label">roadmap signal</div></div></div><div className="progress mt-4"><i style={{ width: `${progressPct}%` }} /></div>{generating && <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))]"><Loader2 className="animate-spin" size={14} /> {stage}</div>}<div className="mt-8 space-y-3">{data.roadmap.map((task, i) => <button key={task.id} onClick={() => setSelected(task)} className="flex w-full items-center gap-4 rounded-xl border border-[hsl(var(--border))] p-4 text-left transition hover:border-[hsl(var(--primary)/.5)]" data-testid={`button-roadmap-task-${task.id}`}><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${task.status === 'Complete' ? 'bg-[hsl(143_44%_89%)] text-[hsl(143_44%_33%)]' : task.status === 'In progress' ? 'bg-[hsl(var(--accent)/.4)]' : 'bg-[hsl(var(--muted))]'}`}>{task.status === 'Complete' ? <Check size={16} /> : <span className="mono text-xs">{String(i + 1).padStart(2, '0')}</span>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{task.title}</span><span className={`tag ${task.status === 'In progress' ? 'status-basic' : ''}`}>{task.status}</span></div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{task.skill} · {task.week}</div></div><ChevronRight size={17} className="text-[hsl(var(--muted-foreground))]" /></button>)}</div></div><div className="space-y-5"><div className="card p-6"><Kicker>Gap analysis · {data.targetRole}</Kicker><h3 className="mt-1 text-lg font-bold">What will unlock you</h3><div className="mt-5 space-y-4">{rankedRoleGaps(ROLE_DB, data.targetRole, data.skills).slice(0, 6).map(gap => <div key={gap.name}><div className="flex justify-between text-xs font-bold"><span>{gap.name}</span><span className={`capitalize ${gap.band === 'missing' ? 'text-[hsl(var(--destructive))]' : gap.band === 'basic' ? 'text-[hsl(32_74%_38%)]' : 'text-[hsl(225_62%_45%)]'}`}>{BAND_LABEL[gap.band]}</span></div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{gap.status === 'UNLISTED' ? 'Not on your Career Passport yet — the roadmap builds it first.' : gap.band === 'developing' ? 'Assessed — convert it into verified evidence.' : 'Build one visible proof point.'}</p></div>)}</div></div><div className="card bg-[hsl(var(--accent)/.24)] p-6"><Sparkles size={19} /><h3 className="mt-3 font-bold">Why this order?</h3><p className="mt-2 text-sm leading-6">{ROLE_DB[data.targetRole]?.why ?? 'ASTRA starts with the smallest action that changes the most signal.'}</p>{topGap && <p className="mt-3 rounded-lg bg-[hsl(var(--accent)/.3)] p-3 text-xs font-bold">Start with {topGap} — it is your biggest current gap for this role.</p>}</div></div></div>{selected && <Modal title={selected.title} close={() => setSelected(null)}><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{selected.detail}</p><div className="mt-5 rounded-xl bg-[hsl(var(--muted)/.65)] p-4"><Kicker>Signal to build</Kicker><div className="mt-1 font-bold">{selected.skill}</div><div className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">This move is selected because it improves your {data.targetRole} match and gives recruiters a concrete artifact to trust.</div></div><div className="mt-5 flex gap-2">{selected.status !== 'Complete' && <button className="btn btn-primary flex-1" onClick={() => { complete(selected.id); setSelected(null); }} data-testid="button-complete-roadmap-task"><Check size={15} /> Mark complete</button>}<Link href={selected.link || (selected.skill === 'HR Analytics' ? '/student/assessments' : '/student/projects')} className="btn btn-outline flex-1" onClick={() => setSelected(null)} data-testid="link-start-roadmap-task">{selected.status === 'Complete' ? 'Review proof' : 'Start task'} <ArrowRight size={15} /></Link></div></Modal>}</>;
}

const ASSESSMENT_QUESTIONS = [
  { skill: 'HR Analytics', q: 'Which metric best reveals where a recruiting funnel loses candidates?', options: ['Funnel conversion rate by stage', 'Offer-to-start ratio', 'Cost per hire', 'Time to fill'], correct: 0 },
  { skill: 'HR Analytics', q: 'A high offer acceptance rate most directly signals what?', options: ['Recruiters over-selling the role', 'Base pay above the market rate', 'A compelling employee value proposition', 'A very small candidate pool'], correct: 2 },
  { skill: 'Data literacy', q: 'What is the best first step when a people dataset has missing values?', options: ['Delete every incomplete row', 'Understand why the values are missing', 'Replace with the column average', 'Ignore the gaps and proceed'], correct: 1 },
  { skill: 'Data visualization', q: 'Which chart best compares engagement scores across departments?', options: ['A line chart over time', 'A scatter plot of two metrics', 'A donut of the overall average', 'Horizontal bars, one per department'], correct: 3 },
  { skill: 'Workforce Planning', q: 'What does time-to-fill measure?', options: ['Days from requisition approval to a signed offer', 'How long new hires stay in a role', 'Months until a role is needed', 'Hours spent in interviews per hire'], correct: 0 },
  { skill: 'Employee Relations', q: 'Which practice protects trust in an employee survey?', options: ['Publishing individual responses to managers', 'Anonymous results reported in aggregate with clear follow-up', 'Sharing raw comments before analysis', 'Running the same survey without acting on it'], correct: 1 },
  { skill: 'Workforce Planning', q: 'Which input belongs in a workforce plan?', options: ['Only currently open requisitions', 'Hiring-manager preferences alone', 'Headcount demand from the business plan', 'Social-media follower counts'], correct: 2 },
  { skill: 'HR Analytics', q: 'A correlation between tenure and engagement means what?', options: ['Longer tenure causes engagement', 'Engagement causes people to stay', 'The relationship is causal both ways', 'They move together — causation is not proven'], correct: 3 },
  { skill: 'Communication', q: 'What makes an HR recommendation persuasive to a leader?', options: ['The most colorful dashboard', 'Stating the answer with confidence', 'A decision framed with evidence and trade-offs', 'Listing every metric available'], correct: 2 },
  { skill: 'HR Analytics', q: 'Which outcome shows analysis turned into business value?', options: ['A longer, more detailed dashboard', 'A decision or experiment that follows the analysis', 'Collecting even more data first', 'Archiving the report for reference'], correct: 1 },
];
type AssessmentResult = { score: number; readiness: number; passed: boolean };
function Assessments() {
  const { data, update, toast } = useAstra(); const [active, setActive] = useState(false); const [step, setStep] = useState(0); const [answers, setAnswers] = useState<number[]>([]); const [result, setResult] = useState<AssessmentResult | null>(null);
  const submit = () => {
    const correct = answers.filter((a, i) => a === ASSESSMENT_QUESTIONS[i].correct).length;
    const score = Math.round((correct / ASSESSMENT_QUESTIONS.length) * 100);
    const status: SkillStatus = score >= 80 ? 'VERIFIED' : score >= 60 ? 'ASSESSED' : 'BASIC';
    const nextSkills = data.skills.map(s => s.name === 'HR Analytics' ? { ...s, status, level: score } : s);
    const nextVerified = status === 'VERIFIED' ? [...new Set([...data.verifiedSkills, 'HR Analytics'])] : data.verifiedSkills;
    const nextData = { ...data, skills: nextSkills, verifiedSkills: nextVerified, assessments: [...data.assessments, { id: crypto.randomUUID(), name: 'HR Analytics', score, date: 'Today' }], notifications: [{ id: crypto.randomUUID(), text: status === 'VERIFIED' ? `HR Analytics is now VERIFIED at ${score}%.` : `HR Analytics assessed at ${score}% — keep building toward VERIFIED.`, time: 'Just now', read: false }, ...data.notifications] };
    update(() => nextData);
    // Roadmap sync: rebuild the plan around the Passport's new skill state so a
    // freshly verified skill stops leading the plan and the next gap takes over.
    runRoadmapPipeline(ROLE_DB, nextData.targetRole, nextSkills, nextData.timeline, nextData.roadmap, () => {}).then(plan => update(d => ({ ...d, roadmap: plan })));
    setResult({ score, readiness: calculateReadiness(nextData), passed: status === 'VERIFIED' });
    toast('Assessment scored — Passport and roadmap updated');
  };
  if (active && !result) return <div className="mx-auto max-w-3xl"><button className="btn btn-ghost !px-0" onClick={() => setActive(false)} data-testid="button-exit-assessment"><ArrowRight className="rotate-180" size={15} /> Exit assessment</button><div className="card mt-4 p-6 md:p-10"><div className="flex justify-between"><Kicker>{ASSESSMENT_QUESTIONS[step].skill} · Question {step + 1} of {ASSESSMENT_QUESTIONS.length}</Kicker><span className="mono text-xs">{Math.round((step / ASSESSMENT_QUESTIONS.length) * 100)}%</span></div><div className="progress mt-3"><i style={{ width: `${((step + 1) / ASSESSMENT_QUESTIONS.length) * 100}%` }} /></div><h1 className="display mt-10 text-2xl font-bold md:text-3xl">{ASSESSMENT_QUESTIONS[step].q}</h1><div className="mt-8 grid gap-3">{ASSESSMENT_QUESTIONS[step].options.map((answer, i) => <button key={answer} onClick={() => setAnswers(a => [...a.slice(0, step), i])} className={`rounded-xl border p-4 text-left text-sm font-semibold transition ${answers[step] === i ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/.4)]'}`} data-testid={`button-answer-${i}`}><span className="mr-3 inline-grid h-6 w-6 place-items-center rounded-full bg-[hsl(var(--muted))] text-xs">{String.fromCharCode(65 + i)}</span>{answer}</button>)}</div><button className="btn btn-primary mt-8 w-full" disabled={answers[step] === undefined} onClick={() => step === ASSESSMENT_QUESTIONS.length - 1 ? submit() : setStep(s => s + 1)} data-testid="button-next-assessment">{step === ASSESSMENT_QUESTIONS.length - 1 ? 'Submit assessment' : 'Next question'} <ArrowRight size={15} /></button></div></div>;
  if (result) return <div className="mx-auto max-w-2xl text-center"><div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${result.passed ? 'bg-[hsl(143_44%_89%)] text-[hsl(143_44%_33%)]' : 'bg-[hsl(var(--accent)/.25)] text-[hsl(var(--secondary))]'}`}>{result.passed ? <Check size={28} /> : <ClipboardCheck size={28} />}</div><h1 className="display mt-6 text-4xl font-bold">{result.passed ? 'Your signal just got stronger.' : 'Progress, not proof — yet.'}</h1><p className="mt-4 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{result.passed ? `HR Analytics is now VERIFIED. Readiness moved to ${result.readiness}%, and your roadmap is ready for its next chapter.` : `You scored ${result.score}/100 — real progress, but not yet verified. Retake after a focused review to lock the skill in.`}</p><div className="card mt-7 p-6 text-left"><div className="flex justify-between text-sm font-bold"><span>Assessment score</span><span className="text-[hsl(var(--primary))]">{result.score} / 100</span></div><div className="progress mt-3"><i style={{ width: `${result.score}%` }} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href="/student/roadmap" className="btn btn-primary" data-testid="link-see-updated-roadmap">See updated roadmap</Link><Link href="/student/jobs" className="btn btn-outline" data-testid="link-browse-matches">Browse new matches</Link></div></div></div>;
  return <><SectionHeading eyebrow="Build credible signal" title="Assessments" detail="Short, practical checks that turn a claim into verified evidence." /><div className="grid gap-5 lg:grid-cols-[1fr_.6fr]"><div className="card card-hover p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><span className="tag status-basic">Recommended next</span><h2 className="display mt-4 text-2xl font-bold">HR Analytics</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">10 questions · 20 minutes · unlocks a high-demand skill for {data.targetRole}.</p></div><div className="grid h-16 w-16 place-items-center rounded-2xl bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]"><ClipboardCheck size={27} /></div></div><button onClick={() => { setActive(true); setStep(0); setAnswers([]); setResult(null); }} className="btn btn-primary mt-7" data-testid="button-start-hr-analytics">Start assessment <ArrowRight size={15} /></button></div><div className="card p-6"><Kicker>Completed</Kicker>{data.assessments.length ? data.assessments.map(a => <div key={a.id} className="mt-4 rounded-xl bg-[hsl(var(--muted)/.65)] p-4"><div className="flex justify-between text-sm font-bold"><span>{a.name}</span><span className="text-[hsl(var(--primary))]">{a.score}%</span></div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{a.date} · {a.score >= 80 ? 'Verified skill added' : 'Assessed — retake to verify'}</div></div>) : <div className="mt-5 text-sm text-[hsl(var(--muted-foreground))]">Your first verified score is one focused session away.</div>}</div></div></>;
}

function Learning() {
  const { data, update, toast } = useAstra();
  const act = (course: Course) => { const next = Math.min(100, (data.learningProgress[course.skills[0]] || course.progress) + 20); update(d => ({ ...d, learningProgress: { ...d.learningProgress, [course.skills[0]]: next }, courses: d.courses.map(c => c.id === course.id ? { ...c, progress: next } : c) })); toast(next === 100 ? `${course.title} completed` : 'Learning progress saved'); };
  return <><SectionHeading eyebrow="Close the gap" title="Learning that leads somewhere." detail="Every course connects to a roadmap task, a skill, or a piece of proof." /><div className="grid gap-4 lg:grid-cols-3">{data.courses.map(course => <div className="card card-hover flex flex-col p-5" key={course.id}><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]"><BookOpen size={18} /></div><span className="tag">{course.difficulty}</span></div><h2 className="mt-6 text-lg font-bold">{course.title}</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{course.provider} · {course.duration}</p><div className="mt-5 flex flex-wrap gap-1.5">{course.skills.map(s => <span className="tag" key={s}>{s}</span>)}</div><div className="mt-auto pt-7"><div className="flex justify-between text-xs"><span className="font-bold">{course.progress}% complete</span><span className="text-[hsl(var(--muted-foreground))]">{course.progress === 100 ? 'Complete' : course.progress ? 'In progress' : 'Not started'}</span></div><div className="progress mt-2"><i style={{ width: `${course.progress}%` }} /></div><button className="btn btn-primary mt-4 w-full" onClick={() => act(course)} data-testid={`button-course-${course.id}`}>{course.progress === 100 ? 'Review course' : course.progress ? 'Continue learning' : 'Start learning'} <ArrowRight size={14} /></button></div></div>)}</div></>;
}

function Projects() {
  const { data, update, toast } = useAstra(); const [editing, setEditing] = useState<Project | null>(null); const [name, setName] = useState('');
  const save = () => { if (!name.trim()) return; update(d => editing ? ({ ...d, projects: d.projects.map(p => p.id === editing.id ? { ...p, name } : p) }) : ({ ...d, projects: [...d.projects, { id: crypto.randomUUID(), name, summary: 'A proof-of-work project built in public.', tools: ['Excel', 'Storytelling'], skills: ['Communication'], outcome: 'Add a measurable outcome.', status: 'Draft' }] })); setName(''); setEditing(null); toast(editing ? 'Project updated' : 'Project added'); };
  const remove = (id: string) => { update(d => ({ ...d, projects: d.projects.filter(p => p.id !== id) })); toast('Project removed from portfolio'); };
  return <><SectionHeading eyebrow="Your proof of work" title="Projects" detail="A strong project says what you saw, what you did, and what changed." action={<button className="btn btn-primary" onClick={() => setEditing({ id: '', name: '', summary: '', tools: [], skills: [], outcome: '', status: 'Draft' })} data-testid="button-add-project"><Plus size={15} /> Add project</button>} /><div className="grid gap-4 lg:grid-cols-2">{data.projects.map(project => <div className="card card-hover p-6" key={project.id}><div className="flex items-start justify-between"><span className={`tag ${project.status === 'Published' ? 'status-verified' : 'status-basic'}`}>{project.status}</span><div className="flex gap-1"><button className="btn btn-ghost !p-2" onClick={() => { setEditing(project); setName(project.name); }} aria-label="Edit project" data-testid={`button-edit-project-${project.id}`}><Pencil size={14} /></button><button className="btn btn-ghost !p-2 text-[hsl(var(--destructive))]" onClick={() => remove(project.id)} aria-label="Delete project" data-testid={`button-delete-project-${project.id}`}><X size={14} /></button></div></div><h2 className="display mt-5 text-2xl font-bold">{project.name}</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{project.summary}</p><div className="mt-5 flex flex-wrap gap-1.5">{project.tools.map(t => <span key={t} className="tag">{t}</span>)}</div><div className="mt-5 border-t border-[hsl(var(--border))] pt-4 text-xs"><span className="label">Outcome</span><p className="mt-1 font-semibold">{project.outcome}</p></div><button className="btn btn-outline mt-5 w-full" onClick={() => update(d => ({ ...d, projects: d.projects.map(p => p.id === project.id ? { ...p, status: p.status === 'Published' ? 'Draft' : 'Published' } : p) }))} data-testid={`button-publish-project-${project.id}`}>{project.status === 'Published' ? 'Remove from portfolio' : 'Add to portfolio'} <ArrowRight size={14} /></button></div>)}</div>{editing && <Modal title={editing.id ? 'Edit project' : 'Add project'} close={() => { setEditing(null); setName(''); }}><label className="mt-6 block text-xs font-bold">Project name<input autoFocus className="input mt-2" value={name} onChange={e => setName(e.target.value)} data-testid="input-project-name" /></label><p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">Create the card now; refine tools, skills, and outcomes from your Passport.</p><button className="btn btn-primary mt-5 w-full" onClick={save} data-testid="button-save-project">Save project <Check size={15} /></button></Modal>}</>;
}

function Jobs() {
  const { data, update, toast } = useAstra();
  const [view, setView] = useState<'all' | 'saved'>('all');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [open, setOpen] = useState<Job | null>(null);
  const saved = boardSaved(data, 'jobs');
  const skillRow = (name: string) => data.skills.find(s => s.name === name);
  const matchReason = (job: Job) => {
    const have = job.skills.filter(s => { const r = skillRow(s); return r && r.status !== 'MISSING' && r.status !== 'BASIC'; });
    const build = job.skills.filter(s => { const r = skillRow(s); return !r || r.status === 'MISSING' || r.status === 'BASIC'; });
    return { have, build };
  };
  const types = ['All', ...Array.from(new Set(data.jobs.map(j => j.type)))];
  const haystack = (j: Job) => `${j.title} ${j.company} ${j.location} ${j.type} ${j.salary} ${j.skills.join(' ')}`.toLowerCase();
  const list = data.jobs
    .filter(j => view !== 'saved' || saved.includes(j.id))
    .filter(j => typeFilter === 'All' || j.type === typeFilter)
    .filter(j => haystack(j).includes(query.toLowerCase()));
  const isApplied = (job: Job) => data.applications.some(a => a.title === job.title && a.company === job.company && a.stage !== 'Saved');
  const apply = (job: Job) => {
    const existing = data.applications.find(a => a.title === job.title && a.company === job.company);
    if (existing && existing.stage !== 'Saved') { toast('Already applied — it is in your tracker'); return; }
    update(d => ({ ...d, applications: existing ? d.applications.map(a => a.id === existing.id ? { ...a, stage: 'Applied' as ApplicationStage, date: 'Today', source: 'ASTRA Jobs' } : a) : [...d.applications, { id: crypto.randomUUID(), title: job.title, company: job.company, stage: 'Applied' as ApplicationStage, date: 'Today', source: 'ASTRA Jobs' }], notifications: [{ id: crypto.randomUUID(), text: `Applied to ${job.title} at ${job.company}.`, time: 'Just now', read: false }, ...d.notifications] }));
    toast('Application added to tracker');
    setOpen(null);
  };
  const toggleSaved = (job: Job) => { const is = saved.includes(job.id); update(d => toggleBoardSaved(d, 'jobs', job.id)); toast(is ? 'Removed from saved' : 'Saved — revisit it any time'); };
  const chipCls = (label: string) => `tag cursor-pointer transition ${typeFilter === label ? 'status-verified' : ''}`;
  return <>
    <SectionHeading eyebrow="Opportunity radar" title="Roles that fit your story." detail="Match is calculated from your current skills, proof, and target role — not just a keyword." action={<div className="flex items-center gap-1 rounded-xl bg-[hsl(var(--muted)/.6)] p-1"><button onClick={() => setView('all')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'all' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="button-jobs-view-all">All</button><button onClick={() => setView('saved')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'saved' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="button-jobs-view-saved">Saved{saved.length > 0 ? ` (${saved.length})` : ''}</button></div>} />
    <div className="mb-5 flex flex-wrap items-center gap-2"><div className="relative min-w-56 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={15} /><input value={query} onChange={e => setQuery(e.target.value)} className="input !pl-9" placeholder="Search roles, companies, skills…" aria-label="Search jobs" data-testid="input-search-jobs" /></div>{types.map(t => <button key={t} type="button" onClick={() => setTypeFilter(t)} className={chipCls(t)} data-testid={`button-type-${t.toLowerCase()}`}>{t}</button>)}<span className="ml-auto text-xs font-bold text-[hsl(var(--muted-foreground))]">{list.length} roles</span></div>
    {view === 'saved' && !saved.length ? <div className="card p-10 text-center"><Heart className="mx-auto text-[hsl(var(--muted-foreground))]" size={22} /><p className="mt-3 text-sm font-semibold">Nothing saved here yet.</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Tap the heart on a role you like — it stays here until you decide.</p><button className="btn btn-outline mt-4" onClick={() => setView('all')} data-testid="button-browse-all-jobs">Browse all roles</button></div> : list.length ? <div className="grid gap-4">{list.map(job => { const match = calculateJobMatch(job, data); const savedJob = saved.includes(job.id); const applied = isApplied(job); const reasons = matchReason(job); return <div className="card card-hover p-5 md:p-6" key={job.id}><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--accent))]"><Building2 size={21} /></div><div><h2 className="text-lg font-bold">{job.title}</h2><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{job.company} · {job.location}</p></div></div><div className="flex items-center gap-2"><span className="tag status-verified">{match}% match</span><button className={`btn !p-2 ${savedJob ? 'text-[hsl(var(--destructive))]' : 'btn-ghost'}`} onClick={() => toggleSaved(job)} aria-label={savedJob ? 'Remove from saved' : 'Save opportunity'} data-testid={`button-save-job-${job.id}`}><Heart size={16} fill={savedJob ? 'currentColor' : 'none'} /></button></div></div><div className="mt-5 flex flex-wrap gap-2">{job.skills.map(skill => <span key={skill} className={`tag ${(skillRow(skill)?.status === 'VERIFIED') || (skillRow(skill)?.status === 'ASSESSED') ? 'status-verified' : 'status-basic'}`}>{skill}{skillRow(skill)?.status === 'VERIFIED' ? ' ✓' : ''}</span>)}<span className="tag">{job.type}</span><span className="tag">{job.salary}</span></div><div className="mt-5 border-t border-[hsl(var(--border))] pt-4 text-xs"><span className="font-bold text-[hsl(var(--primary))]"><Sparkles className="mr-1 inline" size={12} /> Why this fits:</span> {reasons.have.length ? <span>Your <strong>{reasons.have.join(', ')}</strong> signal is directly on the job.</span> : <span>Your target-role direction is the strongest signal for this opening.</span>}{reasons.build.length > 0 && <span> Keep building <strong>{reasons.build.slice(0, 2).join(', ')}</strong>{reasons.build.length > 2 ? ' and more' : ''} to push the match higher.</span>}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{applied ? 'In your application tracker' : 'New on your radar'}</span><div className="flex gap-2"><button className="btn btn-outline !py-2" onClick={() => setOpen(job)} data-testid={`button-view-job-${job.id}`}>View details</button><button className="btn btn-primary !py-2" onClick={() => apply(job)} disabled={applied} data-testid={`button-apply-job-${job.id}`}>{applied ? 'Applied ✓' : 'Apply'} {applied ? <Check size={14} /> : <Send size={14} />}</button></div></div></div>; })}</div> : <div className="card p-10 text-center"><Search className="mx-auto text-[hsl(var(--muted-foreground))]" size={22} /><p className="mt-3 text-sm font-semibold">No roles match those filters.</p><button className="btn btn-outline mt-4" onClick={() => { setQuery(''); setTypeFilter('All'); setView('all'); }} data-testid="button-clear-job-filters">Clear filters</button></div>}
    {open && <Modal title={open.title} close={() => setOpen(null)}><div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><span className="tag">{open.type}</span><span className="font-semibold">{open.company}</span><span>· {open.location}</span><span>· {open.salary}</span><span className={`tag status-verified`}>{calculateJobMatch(open, data)}% match</span></div><p className="mt-5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">This role rewards {open.skills.join(' · ')}. Match is computed from your live Passport — verified skills count full weight, and every missing skill lowers the score, so the number moves as you do.</p><div className="mt-5"><div className="label">Skills the role asks for</div><div className="mt-2 flex flex-wrap gap-1.5">{open.skills.map(s => { const row = skillRow(s); return <span key={s} className={`tag ${row?.status === 'VERIFIED' ? 'status-verified' : row && row.status !== 'MISSING' ? 'status-assessed' : 'status-basic'}`}>{s}{row ? ` · ${row.status.toLowerCase()}` : ' · not on passport'}</span>; })}</div></div><div className="mt-5 rounded-xl bg-[hsl(var(--muted)/.65)] p-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Applying adds this role to your application tracker and a notification to your Passport — no external account needed.</div><div className="mt-5 flex gap-2"><button className="btn btn-ghost flex-1" onClick={() => toggleSaved(open)} data-testid={`button-save-modal-job-${open.id}`}><Heart size={14} fill={saved.includes(open.id) ? 'currentColor' : 'none'} /> {saved.includes(open.id) ? 'Saved' : 'Save'}</button><button className="btn btn-primary flex-1" onClick={() => apply(open)} disabled={isApplied(open)} data-testid={`button-apply-modal-job-${open.id}`}>{isApplied(open) ? 'Applied ✓' : 'Apply now'} <ArrowRight size={15} /></button></div></Modal>}
  </>;
}

function Applications() {
  const { data, update, toast } = useAstra(); const stages: ApplicationStage[] = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
  const move = (id: string, stage: ApplicationStage) => { update(d => ({ ...d, applications: d.applications.map(a => a.id === id ? { ...a, stage } : a) })); toast(`Moved to ${stage}`); };
  return <><SectionHeading eyebrow="Keep momentum visible" title="Application tracker" detail="Every opportunity has a next state. Move the work forward, one honest update at a time." action={<Link href="/student/jobs" className="btn btn-primary" data-testid="button-find-more-jobs"><Plus size={15} /> Find opportunities</Link>} /><div className="flex gap-4 overflow-x-auto pb-3">{stages.map(stage => <div className="w-64 min-w-64" key={stage}><div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold">{stage}</span><span className="tag">{data.applications.filter(a => a.stage === stage).length}</span></div><div className="space-y-3">{data.applications.filter(a => a.stage === stage).map(app => <div className="card p-4" key={app.id}><div className="text-sm font-bold">{app.title}</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{app.company}</div><div className="mt-4 flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))]"><span>{app.date}</span><select className="rounded-md border border-[hsl(var(--border))] bg-transparent p-1" value={app.stage} onChange={e => move(app.id, e.target.value as ApplicationStage)} aria-label={`Move ${app.title}`} data-testid={`select-stage-${app.id}`}>{stages.map(s => <option key={s}>{s}</option>)}</select></div></div>)}</div></div>)}</div></>;
}

function Analytics() {
  const { data } = useAstra();
  const readiness = calculateReadiness(data);
  const learning = learningProgressPct(data);
  const required = ROLE_DB[data.targetRole];
  const requiredCount = required?.skills.length ?? 0;
  const bands = roleSkillBands(ROLE_DB, data.targetRole, data.skills);
  const strong = bands.filter(b => b.band === 'strong').length;
  const gaps = rankedRoleGaps(ROLE_DB, data.targetRole, data.skills);
  const published = data.projects.filter(p => p.status === 'Published').length;
  const moving = data.applications.filter(a => ['Applied', 'Screening', 'Interview', 'Offer'].includes(a.stage)).length;
  const funnel = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer'].map(stage => ({ stage, count: data.applications.filter(a => a.stage === stage).length })).filter(f => f.count > 0);
  const maxFunnel = Math.max(1, ...funnel.map(f => f.count));
  const funnelHues = [177, 225, 32, 143, 5];
  const drivers = [
    { label: 'Verified skills', value: data.verifiedSkills.length },
    { label: 'Published projects', value: published },
    { label: 'Certifications', value: data.certifications.filter(c => c.status === 'Completed').length },
    { label: 'Scored interviews', value: data.interviews.filter(i => i.score).length },
    { label: 'Assessments passed', value: data.assessments.filter(a => a.score >= 80).length },
  ];
  return <><SectionHeading eyebrow="Evidence, not vibes" title="Career analytics" detail="See how small actions compound into stronger signal." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={Activity} label="Readiness" value={`${readiness}%`} trend="Signal score" /><StatCard icon={ListChecks} label="Applications" value={data.applications.length} trend={`${moving} moving`} tone="blue" /><StatCard icon={BookOpen} label="Learning progress" value={`${learning}%`} trend={`${data.courses.length} courses`} tone="orange" /><StatCard icon={Trophy} label="Verified skills" value={data.verifiedSkills.length} trend={`${strong} of ${requiredCount} role skills`} /></div><div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><div className="card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><Kicker>Readiness signal</Kicker><h2 className="mt-1 text-lg font-bold">{data.targetRole} readiness</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Computed from your live Passport, proof, and practice.</p></div><ProgressRing value={readiness} size={110} /></div><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">{drivers.map(d => <div key={d.label} className="rounded-xl bg-[hsl(var(--muted)/.6)] p-3 text-center"><div className="display text-lg font-bold">{d.value}</div><div className="mt-1 text-[.58rem] font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{d.label}</div></div>)}</div></div><div className="card p-6"><div className="flex items-center justify-between"><Kicker>Application funnel</Kicker><span className="tag">{data.applications.length} tracked</span></div>{funnel.length ? <div className="mt-6 space-y-5">{funnel.map((f, i) => <div key={f.stage}><div className="flex justify-between text-xs font-bold"><span>{f.stage}</span><span>{f.count}</span></div><div className="progress mt-2"><i style={{ width: `${Math.max((f.count / maxFunnel) * 100, 6)}%`, background: `hsl(${funnelHues[i % funnelHues.length]} 62% 42%)` }} /></div></div>)}</div> : <p className="mt-6 text-sm text-[hsl(var(--muted-foreground))]">No applications tracked yet — apply to a matched role to start the funnel.</p>}</div></div><div className="card mt-5 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><Kicker>Skill coverage · {data.targetRole}</Kicker><h2 className="mt-1 text-lg font-bold">Where your proof stands against the role.</h2></div><div className="flex flex-wrap gap-2">{[{ band: 'strong', n: strong }, { band: 'developing', n: bands.filter(b => b.band === 'developing').length }, { band: 'basic', n: bands.filter(b => b.band === 'basic').length }, { band: 'missing', n: bands.filter(b => b.band === 'missing').length }].map(c => <span className={`tag ${c.band === 'strong' ? 'status-verified' : c.band === 'developing' ? 'status-assessed' : c.band === 'basic' ? 'status-basic' : 'status-missing'}`} key={c.band}>{c.n} {c.band}</span>)}</div></div>{gaps.length ? <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">{gaps.slice(0, 8).map(gap => <div key={gap.name}><div className="flex justify-between text-xs"><span className="font-bold">{gap.name}</span><span className="text-[hsl(var(--muted-foreground))] capitalize">{gap.status === 'UNLISTED' ? 'Not on passport' : `${gap.level}% · ${BAND_LABEL[gap.band].toLowerCase()}`}</span></div><div className="progress mt-2"><i className={gap.band === 'missing' ? '!bg-[hsl(var(--destructive))]' : gap.band === 'basic' ? '!bg-[hsl(32_74%_38%)]' : '!bg-[hsl(225_62%_45%)]'} style={{ width: `${Math.max(gap.level || 3, 3)}%` }} /></div></div>)}</div> : <p className="mt-6 text-sm text-[hsl(var(--muted-foreground))]">Every {data.targetRole} skill you need is verified — recruiters see a complete picture.</p>}</div></>;
}

function Assistant() {
  const { data, toast } = useAstra(); const [messages, setMessages] = useState<{ from: string; text: string }[]>([{ from: 'astra', text: 'I have your Career Passport open. Ask me what to do next, where your story is strongest, or how to prepare for a role.' }]); const [input, setInput] = useState('');
  const send = (text = input) => { if (!text.trim()) return; const lower = text.toLowerCase(); let reply = lower.includes('readiness') ? `Your readiness is ${calculateReadiness(data)}%. The fastest lift is validating HR Analytics, then publishing a workforce planning case.` : lower.includes('job') ? 'Latticeworks is your strongest current match at 88%. Your verified recruitment and communication signals are doing the work.' : lower.includes('interview') ? 'For your next interview, lead with the Recruitment Funnel Analysis. It gives you a clear story: observation, decision, outcome.' : 'Based on your graph, I would spend 20 minutes on HR Analytics today. It is the only missing high-priority skill for your target role.'; setMessages(m => [...m, { from: 'you', text }, { from: 'astra', text: reply }]); setInput(''); };
  return <><SectionHeading eyebrow="Your career co-pilot" title="Ask ASTRA." detail="Grounded in your actual Passport, roadmap, and opportunity graph." /><div className="grid gap-5 lg:grid-cols-[1fr_.55fr]"><div className="card flex min-h-[560px] flex-col p-5"><div className="flex items-center gap-3 border-b border-[hsl(var(--border))] pb-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--accent))]"><Sparkles size={17} /></span><div><div className="text-sm font-bold">ASTRA Copilot</div><div className="text-xs text-[hsl(var(--muted-foreground))]">Context-aware · Local intelligence</div></div><span className="ml-auto h-2 w-2 rounded-full bg-[hsl(143_44%_43%)]" /></div><div className="flex-1 space-y-4 overflow-auto py-5">{messages.map((m, i) => <div key={i} className={`flex ${m.from === 'you' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.from === 'you' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted))]'}`}>{m.text}</div></div>)}</div><div className="flex gap-2 border-t border-[hsl(var(--border))] pt-4"><input className="input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask about your next move…" aria-label="Ask ASTRA" data-testid="input-assistant" /><button className="btn btn-primary !p-3" onClick={() => send()} aria-label="Send message" data-testid="button-send-assistant"><Send size={16} /></button></div></div><div className="space-y-5"><div className="card p-5"><Kicker>Suggested prompts</Kicker><div className="mt-4 space-y-2">{['What should I do next?', 'Where is my strongest proof?', 'How ready am I for HRBP roles?', 'Help me prepare for an interview'].map(prompt => <button className="flex w-full items-center justify-between rounded-xl border border-[hsl(var(--border))] p-3 text-left text-xs font-semibold hover:border-[hsl(var(--primary)/.5)]" key={prompt} onClick={() => send(prompt)} data-testid={`button-prompt-${prompt.slice(0, 8).replaceAll(' ', '-')}`}>{prompt}<ArrowRight size={14} /></button>)}</div></div><div className="card bg-[hsl(var(--accent)/.24)] p-5"><Kicker>ASTRA sees</Kicker><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Readiness</span><strong>{calculateReadiness(data)}%</strong></div><div className="flex justify-between"><span>Profile strength</span><strong>{calculateProfileStrength(data)}%</strong></div><div className="flex justify-between"><span>Verified skills</span><strong>{data.verifiedSkills.length}</strong></div></div></div></div></div></>;
}

type OpportunityKind = 'internships' | 'scholarships' | 'hackathons' | 'marketplace' | 'research' | 'startups';
const OPP_SPECS: Record<OpportunityKind, { eyebrow: string; title: string; detail: string; icon: typeof Rocket; catalog: Opportunity[]; verb: string; doneVerb: string; toApplications?: boolean }> = {
  internships: { eyebrow: 'Internship radar', title: 'Internships with a point of view.', detail: 'Roles that build real proof, not just resume lines — apply once and the tracker keeps the momentum.', icon: GraduationCap, catalog: INTERNSHIPS, verb: 'Apply', doneVerb: 'Applied', toApplications: true },
  scholarships: { eyebrow: 'Funding the work', title: 'Funding that keeps ambitious work moving.', detail: 'Merit, need, and project-based awards. Save the ones worth chasing and track where you have applied.', icon: PiggyBank, catalog: SCHOLARSHIPS, verb: 'Apply', doneVerb: 'Applied' },
  hackathons: { eyebrow: 'High-signal rooms', title: 'Hackathons that build proof.', detail: 'A real problem, a tight deadline, and artifacts you can publish to your Passport. Register to hold your spot.', icon: Brain, catalog: HACKATHONS, verb: 'Register', doneVerb: 'Registered' },
  marketplace: { eyebrow: 'Real briefs. Better proof.', title: 'Project marketplace.', detail: 'Live briefs from organizations with a problem worth solving. Apply to the ones that stretch your target-role skills.', icon: Layers3, catalog: MARKETPLACE, verb: 'Apply to brief', doneVerb: 'Applied' },
  research: { eyebrow: 'Questions worth a semester', title: 'Research you can point to.', detail: 'Join a faculty-led or industry question, contribute the analysis, and co-author a field note.', icon: FlaskConical, catalog: RESEARCH_OPPS, verb: 'Join research', doneVerb: 'Joined' },
  startups: { eyebrow: 'Early teams, compounding work', title: 'Startup hub.', detail: 'Seed and Series A teams where one person owns a real outcome. Your Passport travels with every application.', icon: Lightbulb, catalog: STARTUPS, verb: 'Apply', doneVerb: 'Applied' },
};

function OpportunityBoard({ kind }: { kind: OpportunityKind }) {
  const { data, update, toast } = useAstra();
  const spec = OPP_SPECS[kind];
  const [view, setView] = useState<'all' | 'saved'>('all');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState<Opportunity | null>(null);
  const saved = boardSaved(data, kind);
  const done = boardActioned(data, kind);
  const Icon = spec.icon;
  const types = ['All', ...Array.from(new Set(spec.catalog.map(o => o.type)))];
  const haystack = (o: Opportunity) => `${o.title} ${o.org} ${o.location} ${o.type} ${o.meta} ${o.tags.join(' ')} ${o.detail}`.toLowerCase();
  const list = spec.catalog
    .filter(o => view !== 'saved' || saved.includes(o.id))
    .filter(o => filter === 'All' || o.type === filter)
    .filter(o => haystack(o).includes(query.toLowerCase()));
  const toggleSave = (o: Opportunity) => { const is = saved.includes(o.id); update(d => toggleBoardSaved(d, kind, o.id)); toast(is ? 'Removed from saved' : 'Saved — revisit it any time'); };
  const act = (o: Opportunity) => { if (done.includes(o.id)) return; update(d => markBoardActioned(d, kind, o.id, `${spec.doneVerb} ${o.title}${o.org ? ` at ${o.org}` : ''}${spec.toApplications ? ' — added to your application tracker' : ''}.`, spec.toApplications ? { title: o.title, company: o.org, source: 'Internships' } : undefined)); toast(`${spec.doneVerb}: ${o.title}`); setOpen(null); };
  const tagCls = (t: string) => `tag cursor-pointer transition ${filter === t ? 'status-verified' : ''}`;
  const searchWord = kind === 'internships' ? 'roles' : kind === 'scholarships' ? 'awards' : kind === 'hackathons' ? 'hackathons' : kind === 'marketplace' ? 'briefs' : kind === 'research' ? 'research' : 'startups';
  return <>
    <SectionHeading eyebrow={spec.eyebrow} title={spec.title} detail={spec.detail} action={<div className="flex items-center gap-1 rounded-xl bg-[hsl(var(--muted)/.6)] p-1"><button onClick={() => setView('all')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'all' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`button-view-all-${kind}`}>All</button><button onClick={() => setView('saved')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'saved' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`button-view-saved-${kind}`}>Saved{saved.length > 0 ? ` (${saved.length})` : ''}</button></div>} />
    <div className="mb-5 flex flex-wrap items-center gap-2"><div className="relative min-w-56 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={15} /><input value={query} onChange={e => setQuery(e.target.value)} className="input !pl-9" placeholder={`Search ${searchWord}…`} aria-label={`Search ${spec.title}`} data-testid={`input-search-${kind}`} /></div>{types.map(t => <button key={t} type="button" onClick={() => setFilter(t)} className={tagCls(t)} data-testid={`button-filter-${kind}-${t.toLowerCase().replaceAll(' ', '-')}`}>{t}</button>)}<span className="ml-auto text-xs font-bold text-[hsl(var(--muted-foreground))]">{list.length} {list.length === 1 ? 'result' : 'results'}{done.length > 0 && ` · ${done.length} ${spec.doneVerb.toLowerCase()}`}</span></div>
    {view === 'saved' && !saved.length ? <div className="card p-10 text-center"><Heart className="mx-auto text-[hsl(var(--muted-foreground))]" size={22} /><p className="mt-3 text-sm font-semibold">Nothing saved here yet.</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Tap the heart on anything you like — it stays here until you decide.</p><button className="btn btn-outline mt-4" onClick={() => setView('all')} data-testid="button-browse-all-board">Browse everything</button></div> : list.length ? <div className="grid gap-4">{list.map(o => { const isSaved = saved.includes(o.id); const isDone = done.includes(o.id); return <div key={o.id} className="card card-hover p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--accent))]"><Icon size={21} /></div><div className="min-w-0"><h2 className="text-lg font-bold">{o.title}</h2><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{o.org}{o.org && o.location ? ' · ' : ''}{o.location}</p></div></div><div className="flex items-center gap-2">{isDone ? <span className="tag status-verified">{spec.doneVerb}</span> : <span className="tag">{o.type}</span>}<button className={`btn !p-2 ${isSaved ? 'text-[hsl(var(--destructive))]' : 'btn-ghost'}`} onClick={() => toggleSave(o)} aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'} data-testid={`button-save-${kind}-${o.id}`}><Heart size={16} fill={isSaved ? 'currentColor' : 'none'} /></button></div></div><div className="mt-5 flex flex-wrap gap-2">{o.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}<span className="tag">{o.meta}</span></div><p className="mt-4 line-clamp-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{o.detail}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4"><button className="inline-flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]" onClick={() => setOpen(o)} data-testid={`button-open-${kind}-${o.id}`}>View details <ChevronRight size={14} /></button><button className="btn btn-primary !py-2" onClick={() => act(o)} disabled={isDone} data-testid={`button-act-${kind}-${o.id}`}>{isDone ? `${spec.doneVerb} ✓` : spec.verb} {isDone ? <Check size={14} /> : <ArrowRight size={14} />}</button></div></div>; })}</div> : <div className="card p-10 text-center"><Search className="mx-auto text-[hsl(var(--muted-foreground))]" size={22} /><p className="mt-3 text-sm font-semibold">No {searchWord} match your filters.</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Try a broader search or clear the type filter.</p><button className="btn btn-outline mt-4" onClick={() => { setQuery(''); setFilter('All'); }} data-testid="button-clear-board-filters">Clear filters</button></div>}
    {open && <Modal title={open.title} close={() => setOpen(null)}><div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><span className="tag">{open.type}</span><span className="font-semibold">{open.org}</span>{open.location && <span>· {open.location}</span>}<span>· {open.meta}</span></div><p className="mt-5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{open.detail}</p><ul className="mt-5 space-y-2">{open.bullets.map(b => <li key={b} className="flex items-start gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--primary))]" />{b}</li>)}</ul><div className="mt-6 flex gap-2"><button className="btn btn-ghost flex-1" onClick={() => toggleSave(open)} data-testid={`button-save-modal-${kind}-${open.id}`}><Heart size={14} fill={saved.includes(open.id) ? 'currentColor' : 'none'} /> {saved.includes(open.id) ? 'Saved' : 'Save'}</button>{done.includes(open.id) ? <span className="btn btn-primary flex-1 opacity-70"><Check size={15} /> {spec.doneVerb}</span> : <button className="btn btn-primary flex-1" onClick={() => act(open)} data-testid={`button-act-modal-${kind}-${open.id}`}>{spec.verb} <ArrowRight size={15} /></button>}</div></Modal>}
  </>;
}

function TeamFinderBoard() {
  const { data, update, toast } = useAstra();
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState('All');
  const [open, setOpen] = useState<TeamMember | null>(null);
  const requested = boardActioned(data, 'team-finder');
  const haystack = (m: TeamMember) => `${m.name} ${m.role} ${m.program} ${m.lookingFor} ${m.skills.join(' ')} ${m.availability} ${m.blurb}`.toLowerCase();
  const skills = ['All', ...Array.from(new Set(TEAM_MEMBERS.flatMap(m => m.skills)))];
  const list = TEAM_MEMBERS.filter(m => skill === 'All' || m.skills.includes(skill)).filter(m => haystack(m).includes(query.toLowerCase()));
  const request = (m: TeamMember) => { if (requested.includes(m.id)) { toast('Request already sent'); return; } update(d => markBoardActioned(d, 'team-finder', m.id, `Team request sent to ${m.name}.`, undefined)); toast(`Request sent to ${m.name}`); setOpen(null); };
  return <>
    <SectionHeading eyebrow="Find your build-mates" title="Team finder." detail="People with the skills you lack, looking for partners who bring the rest. Reach out with a real brief." />
    <div className="mb-5 flex flex-wrap items-center gap-2"><div className="relative min-w-56 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={15} /><input value={query} onChange={e => setQuery(e.target.value)} className="input !pl-9" placeholder="Search members, skills, roles…" aria-label="Search team members" data-testid="input-search-team-finder" /></div>{skills.map(s => <button key={s} type="button" onClick={() => setSkill(s)} className={`tag cursor-pointer transition ${skill === s ? 'status-verified' : ''}`} data-testid={`button-skill-${s.toLowerCase().replaceAll(' ', '-')}`}>{s}</button>)}</div>
    {list.length ? <div className="grid gap-4 md:grid-cols-2">{list.map(m => { const isReq = requested.includes(m.id); return <div key={m.id} className="card card-hover p-5"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--accent))]">{m.initials}</span><div className="min-w-0"><h2 className="font-bold">{m.name}</h2><p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{m.program} · {m.role}</p></div>{isReq && <span className="tag status-verified ml-auto">Requested</span>}</div><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]"><span className="font-semibold text-[hsl(var(--foreground))]">Looking for:</span> {m.lookingFor}</p><div className="mt-4 flex flex-wrap gap-1.5">{m.skills.map(s => <span key={s} className="tag">{s}</span>)}</div><div className="mt-5 flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4"><span className="text-xs text-[hsl(var(--muted-foreground))]">Available {m.availability.toLowerCase()}</span><div className="flex gap-2"><button className="btn btn-outline !py-2" onClick={() => setOpen(m)} data-testid={`button-open-team-${m.id}`}>View profile</button><button className="btn btn-primary !py-2" onClick={() => request(m)} disabled={isReq} data-testid={`button-request-team-${m.id}`}>{isReq ? 'Requested ✓' : 'Request to team'} {isReq ? <Check size={14} /> : <ArrowRight size={14} />}</button></div></div></div>; })}</div> : <div className="card p-10 text-center"><Search className="mx-auto text-[hsl(var(--muted-foreground))]" size={22} /><p className="mt-3 text-sm font-semibold">No members match that filter.</p><button className="btn btn-outline mt-4" onClick={() => { setQuery(''); setSkill('All'); }} data-testid="button-clear-team-filters">Clear filters</button></div>}
    {open && <Modal title={open.name} close={() => setOpen(null)}><div className="mt-4 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--accent))]">{open.initials}</span><div><div className="text-sm font-bold">{open.program}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{open.role} · available {open.availability.toLowerCase()}</div></div></div><p className="mt-5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{open.blurb}</p><div className="mt-5"><div className="label">Looking for</div><p className="mt-1 text-sm font-semibold">{open.lookingFor}</p></div><div className="mt-4"><div className="label">Skills</div><div className="mt-2 flex flex-wrap gap-1.5">{open.skills.map(s => <span key={s} className="tag">{s}</span>)}</div></div><button className="btn btn-primary mt-6 w-full" onClick={() => request(open)} disabled={requested.includes(open.id)} data-testid={`button-request-team-${open.id}`}>{requested.includes(open.id) ? 'Requested ✓' : `Request ${open.name.split(' ')[0]} to your team`} <ArrowRight size={15} /></button></Modal>}
  </>;
}

function CertificationsBoard() {
  const { data, update, toast } = useAstra();
  const done = data.certifications.filter(c => c.status === 'Completed').length;
  const complete = (id: string) => { update(d => ({ ...d, certifications: d.certifications.map(c => c.id === id ? { ...c, status: 'Completed' } : c), notifications: [{ id: crypto.randomUUID(), text: 'Certification completed — added to your proof.', time: 'Just now', read: false }, ...d.notifications] })); toast('Certification completed'); };
  return <><SectionHeading eyebrow="Build portable proof" title="Certifications" detail="Completed certifications travel on your Passport and feed your readiness signal." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.certifications.map(c => <div key={c.id} className="card card-hover flex flex-col p-5"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--accent))]"><Award size={18} /></span><span className={`tag ${c.status === 'Completed' ? 'status-verified' : 'status-basic'}`}>{c.status}</span></div><h2 className="mt-6 text-lg font-bold">{c.name}</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{c.issuer}{c.date !== '—' ? ` · ${c.date}` : ''}</p><div className="mt-auto pt-6">{c.status === 'Completed' ? <div className="rounded-xl bg-[hsl(var(--muted)/.7)] p-3 text-xs font-semibold text-[hsl(var(--muted-foreground))]"><Check className="mr-1 inline text-[hsl(143 44% 36%)]" size={13} /> Verified on your Career Passport</div> : <button className="btn btn-primary w-full" onClick={() => complete(c.id)} data-testid={`button-complete-cert-${c.id}`}>Mark complete <Check size={14} /></button>}</div></div>)}</div><p className="mt-5 text-xs text-[hsl(var(--muted-foreground))]">{done} of {data.certifications.length} certifications completed — each one strengthens your readiness score.</p></>;
}

function MentorsBoard() {
  const { data, update, toast } = useAstra();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Mentor | null>(null);
  const booked = data.mentorBookings;
  const list = MENTORS.filter(m => `${m.name} ${m.title} ${m.org} ${m.focus} ${m.topics.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const book = (m: Mentor) => { if (booked.includes(m.name)) return; update(d => ({ ...d, mentorBookings: [...d.mentorBookings, m.name], notifications: [{ id: crypto.randomUUID(), text: `Conversation requested with ${m.name}.`, time: 'Just now', read: false }, ...d.notifications] })); toast(`Request sent to ${m.name}`); setOpen(null); };
  return <>
    <SectionHeading eyebrow="People one chapter ahead" title="Mentors" detail="Request a conversation with someone who has already navigated the path you are on." action={<div className="relative"><Search className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={15} /><input value={query} onChange={e => setQuery(e.target.value)} className="input !pl-9" placeholder="Search mentors" aria-label="Search mentors" data-testid="input-search-mentors" /></div>} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map(m => { const isBooked = booked.includes(m.name); return <div key={m.id} className="card card-hover flex flex-col p-5"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--accent))]">{m.initials}</span>{isBooked && <span className="tag status-verified">Requested</span>}</div><h2 className="mt-5 text-lg font-bold">{m.name}</h2><p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{m.title} · {m.org}</p><div className="mt-4 flex flex-wrap gap-1.5">{m.topics.map(t => <span key={t} className="tag">{t}</span>)}</div><p className="mt-4 flex-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{m.blurb}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4"><span className="text-xs text-[hsl(var(--muted-foreground))]">{m.availability}</span><button className="btn btn-primary !py-2" onClick={() => setOpen(m)} data-testid={`button-open-mentor-${m.id}`}>{isBooked ? 'Manage request' : 'View profile'} <ArrowRight size={14} /></button></div></div>; })}</div>
    {open && <Modal title={open.name} close={() => setOpen(null)}><div className="mt-4 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--accent))]">{open.initials}</span><div><div className="text-sm font-bold">{open.title}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{open.org} · {open.availability}</div></div></div><p className="mt-5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{open.blurb}</p><div className="mt-5"><div className="label">Focus</div><p className="mt-1 text-sm font-semibold">{open.focus}</p></div><div className="mt-4"><div className="label">Topics</div><div className="mt-2 flex flex-wrap gap-1.5">{open.topics.map(t => <span key={t} className="tag">{t}</span>)}</div></div><button className="btn btn-primary mt-6 w-full" onClick={() => book(open)} disabled={booked.includes(open.name)} data-testid={`button-book-mentor-${open.id}`}>{booked.includes(open.name) ? 'Request sent ✓' : `Request a conversation with ${open.name.split(' ')[0]}`} <ArrowRight size={15} /></button></Modal>}
  </>;
}

function AlumniBoard() {
  const { data, update, toast } = useAstra();
  const [query, setQuery] = useState('');
  const connected = boardActioned(data, 'alumni');
  const list = ALUMNI.filter(a => `${a.name} ${a.program} ${a.year} ${a.company} ${a.path} ${a.shared}`.toLowerCase().includes(query.toLowerCase()));
  const connect = (a: Alumni) => { if (connected.includes(a.id)) return; update(d => markBoardActioned(d, 'alumni', a.id, `Connection request sent to ${a.name}.`, undefined)); toast(`Connection request sent to ${a.name}`); };
  return <>
    <SectionHeading eyebrow="Search by path, not by title" title="Alumni network" detail="People from your campus, one step ahead. Connect to ask about their transition, their company, or their first 90 days." action={<div className="relative"><Search className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={15} /><input value={query} onChange={e => setQuery(e.target.value)} className="input !pl-9" placeholder="Search alumni" aria-label="Search alumni" data-testid="input-search-alumni" /></div>} />
    <div className="grid gap-4 md:grid-cols-2">{list.map(a => { const isConnected = connected.includes(a.id); return <div key={a.id} className="card card-hover flex flex-col p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--accent))]">{a.initials}</span><div><h2 className="font-bold">{a.name}</h2><p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{a.program} {a.year} · {a.company}</p></div></div>{isConnected && <span className="tag status-verified">Connected</span>}</div><p className="mt-4 text-sm font-semibold text-[hsl(var(--primary))]">{a.path}</p><p className="mt-2 flex-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{a.shared}</p><button className="btn btn-outline mt-5 w-full" onClick={() => connect(a)} disabled={isConnected} data-testid={`button-connect-alumni-${a.id}`}>{isConnected ? 'Connected ✓' : 'Connect'} {isConnected ? <Check size={14} /> : <ArrowRight size={14} />}</button></div>; })}</div>
  </>;
}

function Portfolio() { const { data } = useAstra(); return <><SectionHeading eyebrow="Share your signal" title="Your public portfolio" detail="A focused, generated view of the work behind your ambition." action={<button className="btn btn-primary" onClick={() => navigator.clipboard?.writeText(location.href)} data-testid="button-copy-portfolio">Copy public link <ArrowRight size={15} /></button>} /><div className="card overflow-hidden"><div className="bg-[hsl(var(--secondary))] p-8 text-[hsl(var(--secondary-foreground))] md:p-12"><div className="label text-[hsl(var(--accent))]">ASTRA / Career Passport</div><h1 className="display mt-5 text-4xl font-bold md:text-6xl">{data.studentProfile.name}</h1><p className="mt-4 max-w-2xl text-lg text-[hsl(var(--secondary-foreground)/.65)]">{data.studentProfile.bio}</p><div className="mt-7 flex flex-wrap gap-2"><span className="tag !bg-[hsl(var(--primary)/.3)] !text-[hsl(var(--primary-foreground))]">{data.targetRole}</span><span className="tag !bg-[hsl(var(--secondary-foreground)/.1)] !text-[hsl(var(--secondary-foreground))]">{data.studentProfile.school}</span></div></div><div className="grid gap-8 p-8 md:grid-cols-[.7fr_1.3fr] md:p-12"><div><Kicker>Verified skills</Kicker><div className="mt-4 flex flex-wrap gap-2">{data.verifiedSkills.map(s => <span className="tag status-verified" key={s}><Check size={12} /> {s}</span>)}</div><Kicker>Education</Kicker><p className="mt-3 text-sm font-bold">{data.studentProfile.program}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Class of {data.studentProfile.graduation}</p></div><div><Kicker>Selected proof</Kicker><div className="mt-4 grid gap-3">{data.projects.filter(p => p.status === 'Published').map(p => <div className="rounded-xl border border-[hsl(var(--border))] p-4" key={p.id}><h3 className="font-bold">{p.name}</h3><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{p.summary}</p><p className="mt-3 text-xs font-semibold text-[hsl(var(--primary))]">{p.outcome}</p></div>)}</div></div></div></div></>; }

function Interview() { const { data, update, toast } = useAstra(); const [started, setStarted] = useState(false); const [answer, setAnswer] = useState(''); const [score, setScore] = useState<number | null>(null); const question = `Tell us about a time you used insight to improve how a team worked.`; const submit = () => { const value = Math.min(96, 54 + Math.round(answer.length / 10)); setScore(value); update(d => ({ ...d, interviews: [...d.interviews, { id: crypto.randomUUID(), company: 'ASTRA Studio', role: d.targetRole, date: 'Today', stage: 'Practice complete', score: value }] })); toast('Interview result saved to analytics'); }; if (started) return <div className="mx-auto max-w-3xl"><button className="btn btn-ghost !px-0" onClick={() => setStarted(false)} data-testid="button-exit-interview"><ArrowRight className="rotate-180" size={15} /> Back to studio</button><div className="card mt-4 p-6 md:p-10"><Kicker>Behavioral round · {data.targetRole}</Kicker><h1 className="display mt-5 text-3xl font-bold">{question}</h1><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Aim for context, action, and a measurable outcome.</p><textarea className="input mt-8 min-h-48 resize-none" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write your answer as if you were saying it aloud…" aria-label="Interview answer" data-testid="textarea-interview-answer" /><button className="btn btn-primary mt-5 w-full" onClick={submit} disabled={!answer.trim()} data-testid="button-submit-interview">Get simulated feedback <Sparkles size={15} /></button>{score && <div className="mt-6 rounded-xl bg-[hsl(var(--primary)/.1)] p-5"><div className="flex justify-between font-bold"><span>Signal score</span><span className="text-[hsl(var(--primary))]">{score}/100</span></div><p className="mt-2 text-sm leading-6">Strong structure. Add one number to make your impact more credible and your answer easier to remember.</p></div>}</div></div>; return <><SectionHeading eyebrow="Practice the story" title="Interview studio" detail="Practice from your own evidence. Get feedback you can use in the next conversation." /><div className="grid gap-5 lg:grid-cols-[1fr_.6fr]"><div className="card bg-[hsl(var(--secondary))] p-7 text-[hsl(var(--secondary-foreground))]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--secondary))]"><MessageCircle size={18} /></span><Kicker>Mock interview</Kicker></div><h2 className="display mt-8 text-3xl font-bold">Turn proof into presence.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-[hsl(var(--secondary-foreground)/.62)]">A five-minute practice run, scored against clarity, evidence, and role fit.</p><button className="btn btn-warm mt-7" onClick={() => setStarted(true)} data-testid="button-start-interview">Start practice <ArrowRight size={15} /></button></div><div className="space-y-5"><div className="card p-6"><Kicker>Upcoming conversations</Kicker>{(() => { const live = data.applications.filter(a => a.stage === 'Interview'); return live.length ? live.map(a => <div key={a.id} className="mt-4 rounded-xl border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.05)] p-4"><div className="flex items-center justify-between gap-3"><div className="font-bold">{a.title}</div><span className="tag status-verified">Interview</span></div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{a.company} · {a.date}</div></div>) : <p className="mt-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]">When an application reaches the Interview stage in your tracker, it appears here as a live conversation.</p>; })()}</div><div className="card p-6"><Kicker>Recent practice</Kicker>{data.interviews.length ? data.interviews.map(i => <div key={i.id} className="mt-4 rounded-xl bg-[hsl(var(--muted)/.7)] p-4"><div className="font-bold">{i.role}</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{i.stage} · {i.score ? `${i.score}/100` : 'Ready'}</div></div>) : <p className="mt-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]">No practice runs yet — start one and your score feeds analytics.</p>}</div></div></div></>; }

function Productivity() { const { data, update, toast } = useAstra(); const [checked, setChecked] = useState<string[]>([]); const tasks = [...data.roadmap.slice(0, 3).map(t => t.title), 'Send one thoughtful alumni connection']; return <><SectionHeading eyebrow="Your daily operating rhythm" title="Make progress visible." detail="Four small actions today. That is enough." /><div className="grid gap-5 lg:grid-cols-[1fr_.6fr]"><div className="card p-6"><div className="flex items-center justify-between"><Kicker>Today · March 11</Kicker><span className="tag status-verified">{checked.length}/{tasks.length} complete</span></div><div className="mt-5 space-y-2">{tasks.map(task => <button key={task} className="flex w-full items-center gap-3 rounded-xl border border-[hsl(var(--border))] p-4 text-left" onClick={() => setChecked(c => c.includes(task) ? c.filter(x => x !== task) : [...c, task])} data-testid={`button-check-task-${task.slice(0, 8).replaceAll(' ', '-')}`}><span className={`grid h-6 w-6 place-items-center rounded-full border ${checked.includes(task) ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white' : 'border-[hsl(var(--border))]'}`}>{checked.includes(task) && <Check size={13} />}</span><span className={`text-sm font-semibold ${checked.includes(task) ? 'line-through text-[hsl(var(--muted-foreground))]' : ''}`}>{task}</span></button>)}</div></div><div className="card p-6"><Kicker>Weekly goal</Kicker><div className="mt-3 flex items-end justify-between"><span className="display text-4xl font-bold text-[hsl(var(--primary))]">3.5</span><span className="text-xs text-[hsl(var(--muted-foreground))]">hours of deep work</span></div><div className="progress mt-4"><i style={{ width: '68%' }} /></div><p className="mt-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]">You are 68% toward your weekly goal. One focused block today closes the gap.</p><button className="btn btn-outline mt-5 w-full" onClick={() => { update(d => ({ ...d, notifications: [{ id: crypto.randomUUID(), text: 'Focus block added to today.', time: 'Just now', read: false }, ...d.notifications] })); toast('Focus block added'); }} data-testid="button-add-focus-block">Add focus block <Clock3 size={14} /></button></div></div></>; }

function Community() { const { data, update, toast } = useAstra(); const [body, setBody] = useState(''); const add = () => { if (!body.trim()) return; update(d => ({ ...d, community: [{ id: crypto.randomUUID(), author: d.studentProfile.name, role: d.studentProfile.program, body, likes: 0, comments: 0 }, ...d.community] })); setBody(''); toast('Post published to your community'); }; return <><SectionHeading eyebrow="Build in public" title="Community" detail="Questions, wins, and useful context from people building their own edge." action={<button className="btn btn-primary" onClick={add} data-testid="button-publish-post"><Send size={15} /> Publish post</button>} /><div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]"><div className="card p-5"><Kicker>Start a conversation</Kicker><textarea className="input mt-4 min-h-36 resize-none" value={body} onChange={e => setBody(e.target.value)} placeholder="Share a question, a useful pattern, or a small win…" aria-label="Community post" data-testid="textarea-community-post" /><button className="btn btn-dark mt-3 w-full" onClick={add} data-testid="button-post-community">Post to community <ArrowRight size={14} /></button></div><div className="space-y-3">{data.community.map(post => <div className="card p-5" key={post.id}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--secondary))] text-xs font-bold text-[hsl(var(--accent))]">{post.author.split(' ').map(n => n[0]).join('')}</span><div><div className="text-sm font-bold">{post.author}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{post.role}</div></div></div><p className="mt-4 text-sm leading-7">{post.body}</p><div className="mt-4 flex gap-4 text-xs text-[hsl(var(--muted-foreground))]"><button onClick={() => update(d => ({ ...d, community: d.community.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p) }))} className="inline-flex items-center gap-1" data-testid={`button-like-post-${post.id}`}><Heart size={14} /> {post.likes}</button><span><MessageCircle className="mr-1 inline" size={14} /> {post.comments}</span></div></div>)}</div></div></>; }

type DirectoryStudent = { name: string; initials: string; program: string; readiness: number; status: string; skills: string[]; proof: string[]; bio: string; live?: boolean };
function UniversityDirectory() {
  const { data } = useAstra(); const [query, setQuery] = useState(''); const [open, setOpen] = useState<DirectoryStudent | null>(null);
  const alex: DirectoryStudent = { name: data.studentProfile.name, initials: data.studentProfile.initials, program: data.studentProfile.program, readiness: calculateReadiness(data), status: 'Interview ready', skills: data.verifiedSkills, proof: data.projects.filter(p => p.status === 'Published').map(p => p.name), bio: data.studentProfile.bio, live: true };
  const peers: DirectoryStudent[] = [
    { name: 'Maya Chen', initials: 'MC', program: 'MBA Product & Strategy', readiness: 78, status: 'Building proof', skills: ['Product strategy', 'User research', 'SQL'], proof: ['Campus dining ordering research', 'Product teardown series'], bio: 'Turning user research into product decisions with the evidence to back them.' },
    { name: 'Darius Cole', initials: 'DC', program: 'MS Computer Science', readiness: 91, status: 'Offer stage', skills: ['Systems design', 'Python', 'AWS'], proof: ['Distributed cache design study', 'Open-source contribution'], bio: 'Systems-minded engineer who writes code that other people can maintain.' },
    { name: 'Nora Kim', initials: 'NK', program: 'BBA Marketing', readiness: 68, status: 'Needs focus', skills: ['SQL', 'Tableau', 'Storytelling'], proof: ['Retail cohort dashboard'], bio: 'Data storyteller building a people-analytics portfolio one project at a time.' },
  ];
  const students = [alex, ...peers].filter(s => `${s.name} ${s.program} ${s.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const statusTone = (status: string) => status === 'Offer stage' ? 'status-verified' : status === 'Needs focus' ? 'status-basic' : status === 'Interview ready' ? 'status-assessed' : '';
  return <>
    <SectionHeading eyebrow="Student signal" title="Students" detail="Search a living career profile, not a spreadsheet row." action={<div className="relative"><Search className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={15} /><input className="input !pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search students" aria-label="Search students" data-testid="input-search-students" /></div>} />
    <div className="card overflow-hidden"><div className="hidden grid-cols-[1.1fr_1.5fr_.5fr_.8fr_auto] gap-4 border-b border-[hsl(var(--border))] px-5 py-3 text-[.65rem] font-bold uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] md:grid"><span>Student</span><span>Program</span><span>Ready</span><span>Status</span><span /></div>{students.map(s => <button key={s.name} onClick={() => setOpen(s)} className="grid w-full gap-2 border-b border-[hsl(var(--border))] px-5 py-4 text-left last:border-0 md:grid-cols-[1.1fr_1.5fr_.5fr_.8fr_auto] md:items-center md:gap-4" data-testid={`button-student-${s.initials}`}><span className="font-bold">{s.name}{s.live && <span className="tag status-verified ml-2">Live</span>}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{s.program}</span><span className="tag status-verified w-fit">{s.readiness}%</span><span className={`text-xs font-semibold`}>{s.status}</span><ChevronRight className="hidden text-[hsl(var(--muted-foreground))] md:block" size={15} /></button>)}</div>
    {open && <Modal title={open.name} close={() => setOpen(null)}><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--accent))]">{open.initials}</span><div><div className="text-sm font-bold">{open.program}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">ASTRA University{open.live ? ` · ${data.studentProfile.graduation}` : ''}</div></div></div><div className="flex items-center gap-2"><span className="tag status-verified">{open.readiness}% ready</span><span className={`tag ${statusTone(open.status)}`}>{open.status}</span></div></div><p className="mt-5 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{open.bio}{open.live ? ` Target: ${data.targetRole}.` : ''}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><div className="label">{open.live ? 'Verified skills' : 'Skills'}</div><div className="mt-2 flex flex-wrap gap-1.5">{open.skills.map(s => <span key={s} className="tag status-verified">{s}{open.live && <Check className="ml-1 inline" size={11} />}</span>)}</div></div><div><div className="label">Selected proof</div><div className="mt-2 space-y-1.5">{open.proof.map(p => <div key={p} className="text-xs font-semibold">· {p}</div>)}{!open.proof.length && <div className="text-xs text-[hsl(var(--muted-foreground))]">No published proof yet.</div>}</div></div></div>{open.live && <div className="mt-5 rounded-xl bg-[hsl(var(--muted)/.65)] p-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Profile rendered live from Alex's Career Passport — readiness, verified skills, and proof update as the student works.</div>}</Modal>}
  </>;
}
function RecruiterJobs() {
  const { data, update, toast } = useAstra();
  const [title, setTitle] = useState(''); const [type, setType] = useState('Full-time'); const [skills, setSkills] = useState('Communication, Leadership');
  const [editing, setEditing] = useState<{ id: string; title: string; type: string; skills: string } | null>(null);
  const metrics = recruiterMetrics(data);
  const pipeline = metrics.pipeline;
  const publish = () => {
    if (!title.trim()) { toast('Give the role a title first'); return; }
    const id = crypto.randomUUID();
    const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
    update(d => ({
      ...d,
      recruiter: { ...d.recruiter, jobs: [...d.recruiter.jobs, { id, title, applicants: 0, status: 'Published' }] },
      jobs: [...d.jobs, { id, title, company: d.recruiter.company, location: 'Remote · US', type, salary: 'Discussed in process', skills: skillList.length ? skillList : ['Communication', 'Leadership'] }],
      notifications: [{ id: crypto.randomUUID(), text: `${d.recruiter.company} published a new role: ${title}.`, time: 'Just now', read: false }, ...d.notifications],
    }));
    setTitle(''); toast('Job published — visible on the student opportunity radar');
  };
  const saveEdit = () => {
    if (!editing || !editing.title.trim()) { toast('Title is required'); return; }
    const skillList = editing.skills.split(',').map(s => s.trim()).filter(Boolean);
    update(d => ({
      ...d,
      recruiter: { ...d.recruiter, jobs: d.recruiter.jobs.map(j => j.id === editing.id ? { ...j, title: editing.title } : j) },
      jobs: d.jobs.map(j => j.id === editing.id ? { ...j, title: editing.title, type: editing.type, skills: skillList.length ? skillList : j.skills } : j),
    }));
    toast('Role updated everywhere — including the student radar');
    setEditing(null);
  };
  const closeJob = (id: string) => {
    update(d => ({
      ...d,
      recruiter: { ...d.recruiter, jobs: d.recruiter.jobs.map(j => j.id === id ? { ...j, status: 'Closed' } : j) },
      jobs: d.jobs.filter(j => j.id !== id),
      notifications: [{ id: crypto.randomUUID(), text: `A role was closed by ${d.recruiter.company}.`, time: 'Just now', read: false }, ...d.notifications],
    }));
    toast('Job closed and removed from the student radar');
  };  return <>
    <SectionHeading eyebrow="Recruiter OS" title="Jobs" detail="Publish a role once — it appears on the student opportunity radar instantly. Close it and it disappears." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={BriefcaseBusiness} label="Open jobs" value={metrics.openJobs} trend={`${metrics.totalJobs} total`} /><StatCard icon={ListChecks} label="Applications" value={metrics.applications} trend={`${metrics.activeInPipeline} in pipeline`} tone="blue" /><StatCard icon={Star} label="Shortlisted" value={metrics.shortlisted} trend="From pipeline" tone="orange" /><StatCard icon={CalendarDays} label="Interviews" value={metrics.interviews} trend={`${metrics.offers} offers`} /></div>
    <div className="mt-5 card p-5"><Kicker>Publish a new role</Kicker><div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_.7fr_1.2fr_auto]"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Role title" aria-label="New role title" data-testid="input-new-job-title" /><select className="input" value={type} onChange={e => setType(e.target.value)} aria-label="Job type" data-testid="select-new-job-type">{['Full-time', 'Internship', 'Contract'].map(t => <option key={t}>{t}</option>)}</select><input className="input" value={skills} onChange={e => setSkills(e.target.value)} placeholder="Skills, comma-separated" aria-label="Job skills" data-testid="input-new-job-skills" /><button className="btn btn-primary" onClick={publish} data-testid="button-publish-job"><Plus size={15} /> Publish</button></div></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{data.recruiter.jobs.map(job => {
      const applicants = pipeline.filter(r => r.jobId === job.id).length;
      const open = job.status === 'Published';
      return <div className={`card p-5 ${open ? '' : 'opacity-75'}`} key={job.id}><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--accent))]"><BriefcaseBusiness size={17} /></div><span className={`tag ${open ? 'status-verified' : 'status-basic'}`}>{job.status}</span></div><h2 className="mt-6 text-lg font-bold">{job.title}</h2><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{applicants} applicants · {open ? 'Student radar active' : 'Removed from student radar'}</p><div className="mt-5 flex gap-2"><button className="btn btn-outline flex-1" onClick={() => setEditing({ id: job.id, title: job.title, type: data.jobs.find(j => j.id === job.id)?.type ?? 'Full-time', skills: data.jobs.find(j => j.id === job.id)?.skills.join(', ') ?? 'Communication, Leadership' })} data-testid={`button-edit-recruiter-job-${job.id}`}><Pencil size={14} /> Edit</button>{open ? <button className="btn btn-ghost flex-1 text-[hsl(var(--destructive))]" onClick={() => closeJob(job.id)} data-testid={`button-close-recruiter-job-${job.id}`}><X size={14} /> Close</button> : <button className="btn btn-outline flex-1" onClick={() => update(d => ({ ...d, recruiter: { ...d.recruiter, jobs: d.recruiter.jobs.map(j => j.id === job.id ? { ...j, status: 'Published' } : j) } }))} data-testid={`button-reopen-recruiter-job-${job.id}`}>Reopen</button>}</div></div>;
    })}</div>
    {editing && <Modal title="Edit role" close={() => setEditing(null)}><label className="mt-5 block text-xs font-bold">Title<input className="input mt-2" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} data-testid="input-edit-job-title" /></label><label className="mt-4 block text-xs font-bold">Type<select className="input mt-2" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })} data-testid="select-edit-job-type">{['Full-time', 'Internship', 'Contract'].map(t => <option key={t}>{t}</option>)}</select></label><label className="mt-4 block text-xs font-bold">Skills (comma-separated)<input className="input mt-2" value={editing.skills} onChange={e => setEditing({ ...editing, skills: e.target.value })} data-testid="input-edit-job-skills" /></label><button className="btn btn-primary mt-6 w-full" onClick={saveEdit} data-testid="button-save-job-edit">Save changes <Check size={15} /></button></Modal>}
  </>;
}function RecruiterPipeline() {
  const { data, update, toast } = useAstra();
  const [open, setOpen] = useState<PipelineRow | null>(null);
  const [date, setDate] = useState('Thu, Mar 19 · 2:00 PM');
  const metrics = recruiterMetrics(data);
  const stages: PipelineRow['stage'][] = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];
  const advance = (row: PipelineRow, stage: PipelineRow['stage']) => {
    update(d => movePipelineRow(d, row, stage, stage === 'Interview' ? date : undefined));
    toast(`${row.candidateName} moved to ${stage}`);
    setOpen(null);
  };
  return <>
    <SectionHeading eyebrow="Recruiter OS" title="Application pipeline" detail="Every row is a real application — live student applications and stored peer applications share one funnel. Moves update the candidate's own tracker." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard icon={ListChecks} label="Applications" value={metrics.applications} trend="Total" tone="blue" /><StatCard icon={Star} label="Shortlisted" value={metrics.shortlisted} trend="Active" tone="orange" /><StatCard icon={CalendarDays} label="Interviews" value={metrics.interviews} trend="Scheduled" /><StatCard icon={Trophy} label="Offers" value={metrics.offers} trend="Extended" tone="orange" /><StatCard icon={Activity} label="Conversion" value={`${metrics.conversion}%`} trend="Offer rate" /></div>
    <div className="mt-5 flex gap-4 overflow-x-auto pb-3">{stages.map(stage => <div className="w-64 min-w-64" key={stage}><div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold">{stage}</span><span className="tag">{metrics.pipeline.filter(r => r.stage === stage).length}</span></div><div className="space-y-3">{metrics.pipeline.filter(r => r.stage === stage).map(row => { const cand = unifiedCandidates(data).find(c => c.id === row.candidateId); return <button className="card p-4 w-full text-left" key={row.id} onClick={() => setOpen(row)} data-testid={`button-pipeline-${row.id}`}><div className="text-sm font-bold">{row.candidateName}{row.live && <span className="tag status-verified ml-2">Live</span>}</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{row.jobTitle} · {cand?.readiness ?? '—'}% ready</div><div className="mt-3 text-[10px] text-[hsl(var(--muted-foreground))]">{row.date}</div></button>; })}</div></div>)}</div>
    {open && (() => {
      const cand = unifiedCandidates(data).find(c => c.id === open.candidateId);
      if (!cand) return null;
      return <Modal title={`${open.candidateName} — ${open.jobTitle}`} close={() => setOpen(null)}><div className="mt-4 flex flex-wrap items-center gap-2"><span className="tag status-verified">{cand.readiness}% ready</span><span className="tag">{cand.program}</span><span className="tag">Target: {cand.targetRole}</span></div><div className="mt-4"><div className="label">Verified skills</div><div className="mt-2 flex flex-wrap gap-1.5">{cand.verifiedSkills.map(s => <span key={s} className="tag status-verified"><Check size={11} /> {s}</span>)}</div></div><div className="mt-4"><div className="label">Move to</div><div className="mt-2 flex flex-wrap gap-2">{stages.filter(s => s !== open.stage).map(s => <button key={s} className={`btn btn-outline !py-1.5 !text-xs ${s === 'Interview' ? '' : ''}`} onClick={() => advance(open, s)} data-testid={`button-move-${s.toLowerCase()}`}>{s === 'Interview' ? 'Interview' : s}</button>)}</div></div>{open.stage !== 'Interview' && <label className="mt-4 block text-xs font-bold">Interview slot (used when moving to Interview)<input className="input mt-2" value={date} onChange={e => setDate(e.target.value)} data-testid="input-interview-slot" /></label>}</Modal>;
    })()}
  </>;
}

function RecruiterInterviews() {
  const { data, update, toast } = useAstra();
  const scheduled = data.recruiterInterviews;
  const outcome = (id: string, value: string) => {
    update(d => ({ ...d, recruiterInterviews: d.recruiterInterviews.map(i => i.id === id ? { ...i, stage: 'Completed', outcome: value } : i) }));
    toast(`Interview outcome recorded: ${value}`);
  };
  return <>
    <SectionHeading eyebrow="Recruiter OS" title="Interviews" detail="Scheduled loops live here; outcomes roll up into analytics. Students see their own invite on their interview studio page." />
    {scheduled.length ? <div className="grid gap-4 md:grid-cols-2">{scheduled.map(i => <div className="card p-5" key={i.id}><div className="flex items-start justify-between"><div><div className="font-bold">{i.candidateName}</div><div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{i.role} · {data.recruiter.company}</div></div><span className={`tag ${i.outcome ? 'status-verified' : 'status-basic'}`}>{i.outcome ?? i.stage}</span></div><div className="mt-4 text-xs font-semibold">{i.date}</div>{i.outcome ? <div className="mt-4 rounded-xl bg-[hsl(var(--muted)/.65)] p-3 text-xs font-semibold">Outcome: {i.outcome}</div> : <div className="mt-4 flex flex-wrap gap-2"><button className="btn btn-outline !py-1.5 !text-xs" onClick={() => outcome(i.id, 'Strong hire signal')} data-testid={`button-outcome-hire-${i.id}`}>Strong hire signal</button><button className="btn btn-outline !py-1.5 !text-xs" onClick={() => outcome(i.id, 'Needs another loop')} data-testid={`button-outcome-loop-${i.id}`}>Needs another loop</button><button className="btn btn-ghost !py-1.5 !text-xs text-[hsl(var(--destructive))]" onClick={() => outcome(i.id, 'Not moving forward')} data-testid={`button-outcome-no-${i.id}`}>Not moving forward</button></div>}</div>)}</div> : <div className="card p-10 text-center"><CalendarDays className="mx-auto text-[hsl(var(--muted-foreground))]" size={22} /><p className="mt-3 text-sm font-semibold">No interviews scheduled yet.</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Move a candidate to Interview from the pipeline and it lands here.</p><Link href="/recruiter/shortlist" className="btn btn-outline mt-4" data-testid="link-to-pipeline">Open pipeline</Link></div>}
  </>;
}

function TalentDiscovery() {
  const { data, update, toast } = useAstra();
  const [query, setQuery] = useState(''); const [roleFilter, setRoleFilter] = useState('All'); const [skillFilter, setSkillFilter] = useState('All'); const [minReadiness, setMinReadiness] = useState(0); const [hasExperience, setHasExperience] = useState(false); const [viewed, setViewed] = useState<string | null>(null);
  const candidates = unifiedCandidates(data);
  const roles = ['All', ...Array.from(new Set(candidates.map(c => c.targetRole)))];
  const skills = ['All', ...Array.from(new Set(candidates.flatMap(c => c.verifiedSkills)))];
  const list = candidates
    .filter(c => `${c.name} ${c.program} ${c.targetRole} ${c.verifiedSkills.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    .filter(c => roleFilter === 'All' || c.targetRole === roleFilter)
    .filter(c => skillFilter === 'All' || c.verifiedSkills.includes(skillFilter))
    .filter(c => c.readiness >= minReadiness)
    .filter(c => !hasExperience || c.projects.length > 0);
  const openCandidate = (c: PeerCandidate) => {
    setViewed(c.id);
    if (!data.recruiter.profileViews.includes(c.id)) update(d => ({ ...d, recruiter: { ...d.recruiter, profileViews: [...d.recruiter.profileViews, c.id] } }));
  };
  const toggleShortlist = (id: string, name: string) => {
    const has = data.recruiter.shortlisted.includes(id);
    update(d => ({ ...d, recruiter: { ...d.recruiter, shortlisted: has ? d.recruiter.shortlisted.filter(x => x !== id) : [...d.recruiter.shortlisted, id] } }));
    toast(has ? 'Removed from shortlist' : `${name} shortlisted`);
  };
  const cand = viewed ? candidates.find(c => c.id === viewed) : null;
  return <>
    <SectionHeading eyebrow="Recruiter OS" title="Talent discovery" detail="Search verified signal — every profile is built from a real Career Passport, not keywords." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={Users} label="Candidates" value={candidates.length} trend="In cohort" tone="blue" /><StatCard icon={Star} label="Shortlisted" value={data.recruiter.shortlisted.length} trend="Your picks" tone="orange" /><StatCard icon={Activity} label="Profiles viewed" value={data.recruiter.profileViews.length} trend="This demo" /><StatCard icon={Search} label="Showing" value={list.length} trend="After filters" /></div>
    <div className="mt-5 card p-5"><div className="grid gap-3 md:grid-cols-[1.1fr_.9fr_.9fr_.8fr]"><div className="relative"><Search className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={15} /><input value={query} onChange={e => setQuery(e.target.value)} className="input !pl-9" placeholder="Search names, roles, skills…" aria-label="Search candidates" data-testid="input-search-talent" /></div><select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} aria-label="Role filter" data-testid="select-role-filter"><option value="All">All target roles</option>{roles.filter(r => r !== 'All').map(r => <option key={r}>{r}</option>)}</select><select className="input" value={skillFilter} onChange={e => setSkillFilter(e.target.value)} aria-label="Skill filter" data-testid="select-skill-filter"><option value="All">Any verified skill</option>{skills.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}</select><label className="input flex items-center gap-2 !py-0"><input type="checkbox" checked={hasExperience} onChange={e => setHasExperience(e.target.checked)} className="accent-[hsl(var(--primary))]" data-testid="checkbox-experience" />Published proof</label></div><div className="mt-4 flex items-center gap-3"><span className="label">Min readiness</span><input type="range" min="0" max="90" step="5" value={minReadiness} onChange={e => setMinReadiness(Number(e.target.value))} className="flex-1 accent-[hsl(var(--primary))]" data-testid="range-readiness" /><span className="mono text-xs font-bold">{minReadiness}%+</span></div></div>
    <div className="mt-5 grid gap-4">{list.map(c => { const short = data.recruiter.shortlisted.includes(c.id); return <div className="card card-hover p-5" key={c.id}><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--accent))]">{c.initials}</span><div className="min-w-0"><h2 className="font-bold">{c.name}{c.id === LIVE_CANDIDATE_ID && <span className="tag status-verified ml-2">Live</span>}</h2><p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{c.program} · Class of {c.graduation}</p></div></div><div className="flex items-center gap-2"><span className="tag status-verified">{c.readiness}% ready</span><button className={`btn !p-2 ${short ? 'text-[hsl(var(--secondary))]' : 'btn-ghost'}`} onClick={() => toggleShortlist(c.id, c.name)} aria-label={short ? 'Remove from shortlist' : 'Shortlist'} data-testid={`button-shortlist-${c.id}`}><Star size={16} fill={short ? 'currentColor' : 'none'} /></button></div></div><div className="mt-5 flex flex-wrap gap-2">{c.verifiedSkills.map(s => <span key={s} className="tag status-verified"><Check size={11} /> {s}</span>)}<span className="tag">Target: {c.targetRole}</span>{c.assessments.slice(0, 2).map(a => <span key={a.name} className="tag status-assessed">{a.name} · {a.score}%</span>)}</div><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{c.bio}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4"><span className="text-xs text-[hsl(var(--muted-foreground))]">{c.projects.length} published {c.projects.length === 1 ? 'project' : 'projects'} · {c.certifications.length} {c.certifications.length === 1 ? 'certification' : 'certifications'}</span><div className="flex gap-2"><button className="btn btn-outline !py-2" onClick={() => openCandidate(c)} data-testid={`button-view-candidate-${c.id}`}>View profile</button>{short && <span className="tag status-verified self-center">Shortlisted</span>}</div></div></div>; })}{!list.length && <div className="card p-10 text-center"><Search className="mx-auto text-[hsl(var(--muted-foreground))]" size={22} /><p className="mt-3 text-sm font-semibold">No candidates match those filters.</p><button className="btn btn-outline mt-4" onClick={() => { setQuery(''); setRoleFilter('All'); setSkillFilter('All'); setMinReadiness(0); setHasExperience(false); }} data-testid="button-clear-talent-filters">Clear filters</button></div>}</div>
    {cand && (() => {
      const short = data.recruiter.shortlisted.includes(cand.id);
      const gaps = cand.skills.filter(s => s.status === 'MISSING' || s.status === 'BASIC');
      return <Modal title={cand.name} close={() => setViewed(null)}><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--accent))]">{cand.initials}</span><div><div className="text-sm font-bold">{cand.program}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{cand.school} · Class of {cand.graduation}</div></div></div><span className="tag status-verified">{cand.readiness}% ready</span></div><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{cand.bio}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><div className="label">Verified skills</div><div className="mt-2 flex flex-wrap gap-1.5">{cand.verifiedSkills.map(s => <span key={s} className="tag status-verified"><Check size={11} /> {s}</span>)}</div></div><div><div className="label">Skill gaps</div><div className="mt-2 flex flex-wrap gap-1.5">{gaps.length ? gaps.map(s => <span key={s.name} className={`tag ${s.status === 'MISSING' ? 'status-missing' : 'status-basic'}`}>{s.name}</span>) : <span className="text-xs text-[hsl(var(--muted-foreground))]">None — fully verified for target role.</span>}</div></div><div><div className="label">Assessments</div><div className="mt-2 space-y-1">{cand.assessments.length ? cand.assessments.map(a => <div key={a.name} className="text-xs font-semibold">· {a.name} — {a.score}%</div>) : <div className="text-xs text-[hsl(var(--muted-foreground))]">No assessments on file.</div>}</div></div><div><div className="label">Certifications</div><div className="mt-2 space-y-1">{cand.certifications.length ? cand.certifications.map(c => <div key={c} className="text-xs font-semibold">· {c}</div>) : <div className="text-xs text-[hsl(var(--muted-foreground))]">None listed.</div>}</div></div><div className="sm:col-span-2"><div className="label">Published proof</div><div className="mt-2 grid gap-2">{cand.projects.length ? cand.projects.map(p => <div key={p.name} className="rounded-xl border border-[hsl(var(--border))] p-3"><div className="text-xs font-bold">{p.name}</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{p.outcome}</div></div>) : <div className="text-xs text-[hsl(var(--muted-foreground))]">No published proof yet.</div>}</div></div></div><div className="mt-6 flex gap-2"><button className={`btn flex-1 ${short ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggleShortlist(cand.id, cand.name)} data-testid="button-modal-shortlist"><Star size={14} fill={short ? 'currentColor' : 'none'} /> {short ? 'Remove from shortlist' : 'Shortlist candidate'}</button><button className="btn btn-ghost flex-1" onClick={() => setViewed(null)} data-testid="button-modal-close">Close</button></div></Modal>;
    })()}
  </>;
}

function RecruiterDashboard({ section }: { section: string }) {
  const { data, update, toast } = useAstra();
  const metrics = recruiterMetrics(data);
  const isDashboard = section === 'dashboard';
  const shortlist = (action: string) => { const has = data.recruiter.shortlisted.includes(LIVE_CANDIDATE_ID); if (action === 'add' && !has) update(d => ({ ...d, recruiter: { ...d.recruiter, shortlisted: [...d.recruiter.shortlisted, LIVE_CANDIDATE_ID] } })); else if (action === 'remove') update(d => ({ ...d, recruiter: { ...d.recruiter, shortlisted: d.recruiter.shortlisted.filter(x => x !== LIVE_CANDIDATE_ID) } })); toast(action === 'remove' ? 'Candidate removed' : 'Alex Johnson shortlisted'); };
  const viewProfile = () => { if (!data.recruiter.profileViews.includes(LIVE_CANDIDATE_ID)) update(d => ({ ...d, recruiter: { ...d.recruiter, profileViews: [...d.recruiter.profileViews, LIVE_CANDIDATE_ID] } })); toast('Full profile lives in Talent Discovery'); };
  const featured = unifiedCandidates(data).find(c => c.id === LIVE_CANDIDATE_ID)!;
  return <>
    <SectionHeading eyebrow={`${data.recruiter.company} · Recruiter OS`} title={isDashboard ? 'Talent, with the context intact.' : section[0].toUpperCase() + section.slice(1)} detail={isDashboard ? 'Every number below is computed from the live pipeline — publish, shortlist, and hire to watch it move.' : 'Search verified signal, move the right people forward, and keep your pipeline human.'} action={<Link href="/recruiter/talent" className="btn btn-primary" data-testid="link-open-talent">Open talent discovery <ArrowRight size={15} /></Link>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard icon={BriefcaseBusiness} label="Open jobs" value={metrics.openJobs} trend={`${metrics.totalJobs} total`} /><StatCard icon={Users} label="Candidates" value={metrics.candidates} trend="In cohort" tone="blue" /><StatCard icon={Star} label="Shortlisted" value={metrics.shortlisted} trend="Your picks" tone="orange" /><StatCard icon={CalendarDays} label="Interviews" value={metrics.interviews} trend={`${metrics.offers} offers`} /><StatCard icon={Activity} label="Conversion" value={`${metrics.conversion}%`} trend="Offer rate" /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.7fr]"><div className="card p-6"><div className="flex items-center justify-between"><div><Kicker>{isDashboard ? 'Verified talent' : 'Pipeline health'}</Kicker><h2 className="mt-1 text-lg font-bold">{isDashboard ? 'People who can show the work.' : 'Keep every candidate moving.'}</h2></div><span className="tag status-verified">Live demo data</span></div>{isDashboard ? <div className="mt-6 rounded-2xl border-2 border-[hsl(var(--primary)/.35)] bg-[hsl(var(--primary)/.04)] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] font-bold text-[hsl(var(--accent))]">{featured.initials}</span><div><h3 className="font-bold">{featured.name}</h3><p className="text-xs text-[hsl(var(--muted-foreground))]">{featured.program} · Class of {featured.graduation}</p></div></div><span className="tag status-verified">{featured.readiness}% readiness</span></div><div className="mt-5 flex flex-wrap gap-2">{featured.verifiedSkills.map(s => <span className="tag status-verified" key={s}><Check size={12} /> {s}</span>)}</div><p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">{featured.projects.length} published {featured.projects.length === 1 ? 'project' : 'projects'} · target: {featured.targetRole}</p><div className="mt-5 flex gap-2"><button className="btn btn-primary" onClick={() => shortlist('add')} data-testid="button-shortlist-alex"><Star size={14} /> Shortlist {featured.name.split(' ')[0]}</button><button className="btn btn-outline" onClick={viewProfile} data-testid="button-view-alex">View profile</button></div></div> : <div className="mt-5 space-y-3">{PIPELINE_ORDER.slice(0, 5).map((s, i) => <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] p-4" key={s}><span className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--muted))] mono text-xs">{metrics.pipeline.filter(r => r.stage === s).length}</span><span className="text-sm font-semibold">{s}</span><ChevronRight className="ml-auto" size={15} /></div>)}</div>}
    </div><div className="space-y-5"><div className="card p-6"><Kicker>Open roles</Kicker>{data.recruiter.jobs.filter(j => j.status === 'Published').map(j => <div className="mt-4 flex items-center gap-3" key={j.id}><div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--muted))]"><BriefcaseBusiness size={15} /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{j.title}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{metrics.pipeline.filter(r => r.jobId === j.id).length} applicants · {j.status}</div></div></div>)}{!data.recruiter.jobs.some(j => j.status === 'Published') && <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">No open roles — publish one from the Jobs page.</p>}<Link href="/recruiter/jobs" className="btn btn-outline mt-5 w-full" data-testid="link-manage-jobs">Manage jobs <ArrowRight size={14} /></Link></div><div className="card bg-[hsl(var(--accent)/.24)] p-6"><Kicker>Recruiter tip</Kicker><p className="mt-3 text-sm leading-6">{featured.name.split(' ')[0]} is findable because verified skills and project outcomes travel together. Keywords alone would miss the signal.</p></div></div></div></>;
}
function exportUniversityCsv(data: AstraData) {
  const rows: string[][] = [
    ['ASTRA University — Placement Report'],
    ['Generated', new Date().toLocaleDateString()],
    [],
    ['Metric', 'Value'],
    ['Cohort size', '6 profiles (1 live + 5 demo peers)'],
    ['Average readiness', `${Math.round(unifiedCandidates(data).reduce((s, c) => s + c.readiness, 0) / unifiedCandidates(data).length)}%`],
    ['Verified skills across cohort', String(unifiedCandidates(data).reduce((s, c) => s + c.verifiedSkills.length, 0))],
    ['Published projects across cohort', String(unifiedCandidates(data).reduce((s, c) => s + c.projects.length, 0))],
    [],
    ['Recruiter', 'Job', 'Candidate', 'Stage'],
    ...recruiterPipeline(data).map(r => [data.recruiter.company, r.jobTitle, r.candidateName, r.stage]),
  ];
  const csv = rows.map(r => r.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'astra-university-placement-report.csv'; a.click();
  URL.revokeObjectURL(url);
}

function CompanyProfile() {
  const { data, update, toast } = useAstra();
  const [form, setForm] = useState({ company: data.recruiter.company, industry: data.recruiter.industry, website: data.recruiter.website, description: data.recruiter.description, prefs: data.recruiter.prefs });
  const save = () => {
    if (!form.company.trim()) { toast('Company name is required'); return; }
    update(d => ({ ...d, recruiter: { ...d.recruiter, company: form.company.trim(), industry: form.industry, website: form.website, description: form.description, prefs: form.prefs }, jobs: d.jobs.map(j => j.company === d.recruiter.company ? { ...j, company: form.company.trim() } : j) }));
    toast('Company profile saved');
  };
  return <>
    <SectionHeading eyebrow="Recruiter OS" title="Company profile" detail="What candidates and the university see about who is hiring — and how you hire." />
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="card p-6"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--accent))]"><Building2 size={24} /></div><h2 className="mt-5 text-xl font-bold">{data.recruiter.company}</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{data.recruiter.industry}</p><div className="mt-6 space-y-2 text-xs text-[hsl(var(--muted-foreground))]"><div><span className="font-bold">Website:</span> {data.recruiter.website}</div><div><span className="font-bold">Open jobs:</span> {data.recruiter.jobs.filter(j => j.status === 'Published').length}</div><div><span className="font-bold">Profiles viewed:</span> {data.recruiter.profileViews.length}</div></div><p className="mt-6 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{data.recruiter.description}</p></div><div className="card p-6"><div className="space-y-5"><label className="block text-xs font-bold">Company name<input className="input mt-2" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} data-testid="input-company-name" /></label><label className="block text-xs font-bold">Industry<input className="input mt-2" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} data-testid="input-company-industry" /></label><label className="block text-xs font-bold">Website<input className="input mt-2" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} data-testid="input-company-website" /></label><label className="block text-xs font-bold">Description<textarea className="input mt-2 min-h-24 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} data-testid="input-company-description" /></label><label className="block text-xs font-bold">Hiring preferences<textarea className="input mt-2 min-h-24 resize-none" value={form.prefs} onChange={e => setForm({ ...form, prefs: e.target.value })} data-testid="input-company-prefs" /></label><button className="btn btn-primary w-full" onClick={save} data-testid="button-save-company">Save company profile <Check size={14} /></button></div></div></div>
  </>;
}

function RecruiterSettings() {
  const { data, update, toast } = useAstra();
  const [name, setName] = useState(data.recruiter.name);
  const [contact, setContact] = useState('priya@demotechnologies.com');
  const save = () => { update(d => ({ ...d, recruiter: { ...d.recruiter, name: name.trim() || d.recruiter.name } })); toast('Settings saved to your recruiter workspace'); };
  return <>
    <SectionHeading eyebrow="Workspace controls" title="Recruiter settings" detail="Shape the workspace without losing the signal that makes it useful." />
    <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]"><div className="card p-6"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--accent))]"><BriefcaseBusiness size={24} /></div><h2 className="mt-5 text-xl font-bold">{data.recruiter.company}</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Demo workspace · Local prototype</p><div className="mt-6 rounded-xl bg-[hsl(var(--muted)/.7)] p-4"><div className="flex items-center justify-between text-sm font-bold"><span>Demo mode</span><span className="tag status-verified">Active</span></div><p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Changes persist only in this browser so you can safely explore the full product surface.</p></div></div><div className="card p-6"><div className="space-y-5"><label className="block text-xs font-bold">Recruiter name<input className="input mt-2" value={name} onChange={e => setName(e.target.value)} data-testid="input-recruiter-name" /></label><label className="block text-xs font-bold">Primary contact<input className="input mt-2" value={contact} onChange={e => setContact(e.target.value)} data-testid="input-primary-contact" /></label><div className="rounded-xl bg-[hsl(var(--muted)/.7)] p-4"><div className="flex items-center justify-between text-sm font-bold"><span>Interview reminders</span><span className="tag status-verified">On</span></div><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Scheduled loops appear in your Interviews page and on the candidate's studio.</p></div><button className="btn btn-primary w-full" onClick={save} data-testid="button-save-settings">Save settings <Check size={14} /></button></div></div></div>
  </>;
}

function UniversityPage({ section }: { section: string }) { const { data, toast } = useAstra(); const title = section === 'dashboard' ? 'University command center' : section[0].toUpperCase() + section.slice(1); if (section === 'settings') return <SettingsPage role="university" />; if (section === 'students') return <UniversityDirectory />; return <><SectionHeading eyebrow="ASTRA University Demo" title={title} detail="One operating view for readiness, placement, and the work between them." action={<button className="btn btn-outline" onClick={() => exportUniversityCsv(data)} data-testid="button-export-university"><FileText size={15} /> Export report</button>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={Users} label="Active students" value="1,500" trend="+8.4%" /><StatCard icon={Activity} label="Cohort readiness" value="74%" trend="+6.2 pts" tone="orange" /><StatCard icon={TrendingUp} label="Placement rate" value="82%" trend="+11% YoY" tone="blue" /><StatCard icon={Trophy} label="Average CTC" value="$86.4k" trend="+$7.2k" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]"><div className="card p-6"><Kicker>Placement pulse</Kicker><h2 className="mt-1 text-lg font-bold">Readiness is translating into outcomes.</h2><div className="mt-6 h-64"><Suspense fallback={<div className="grid h-full place-items-center text-xs font-semibold text-[hsl(var(--muted-foreground))]">Loading chart…</div>}><CohortPlacementChart data={[{ name: 'MBA', ready: 82, placed: 76 }, { name: 'MS', ready: 76, placed: 69 }, { name: 'BBA', ready: 68, placed: 61 }, { name: 'MCA', ready: 72, placed: 66 }]} /></Suspense></div></div><div className="card p-6"><Kicker>Skill gaps across cohort</Kicker><div className="mt-5 space-y-4">{['Data storytelling', 'Advanced Excel', 'Interview presence', 'Workforce planning'].map((s, i) => <div key={s}><div className="flex justify-between text-xs font-bold"><span>{s}</span><span>{[42, 35, 28, 22][i]}%</span></div><div className="progress mt-2"><i style={{ width: `${[42, 35, 28, 22][i]}%`, background: i === 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }} /></div></div>)}</div></div></div><div className="mt-5 grid gap-4 md:grid-cols-3">{[{ label: 'Internships active', value: '68%', icon: BriefcaseBusiness }, { label: 'Offers generated', value: '420', icon: Award }, { label: 'Students with proof', value: '1,124', icon: FileText }].map(s => <StatCard {...s} key={s.label} tone="blue" />)}</div></>; }
function RecruiterPage({ section }: { section: string }) { if (section === 'settings') return <RecruiterSettings />; if (section === 'company') return <CompanyProfile />; if (section === 'jobs') return <RecruiterJobs />; if (section === 'talent') return <TalentDiscovery />; if (section === 'shortlist') return <RecruiterPipeline />; if (section === 'interviews') return <RecruiterInterviews />; return <RecruiterDashboard section={section} />; }
function SettingsPage({ role }: { role: Role }) { const { toast } = useAstra(); return <><SectionHeading eyebrow="Workspace controls" title={`${role === 'university' ? 'Institution' : 'Recruiter'} settings`} detail="Shape the workspace without losing the signal that makes it useful." /><div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]"><div className="card p-6"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--accent))]">{role === 'university' ? <Building2 size={24} /> : <BriefcaseBusiness size={24} />}</div>      <h2 className="mt-5 text-xl font-bold">{role === 'university' ? 'ASTRA University' : 'Demo Technologies'}</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Demo workspace · Local prototype</p><button className="btn btn-outline mt-6 w-full" onClick={() => toast('Workspace preview saved')} data-testid="button-save-settings">Save workspace <Check size={14} /></button></div><div className="card p-6"><div className="space-y-5"><label className="block text-xs font-bold">Workspace name<input className="input mt-2" defaultValue={role === 'university' ? 'ASTRA University' : 'Demo Technologies'} data-testid="input-workspace-name" /></label><label className="block text-xs font-bold">Primary contact<input className="input mt-2" defaultValue={role === 'university' ? 'placement@astra.edu' : 'priya@demotechnologies.com'} data-testid="input-primary-contact" /></label><div className="rounded-xl bg-[hsl(var(--muted)/.7)] p-4"><div className="flex items-center justify-between text-sm font-bold"><span>Demo mode</span><span className="tag status-verified">Active</span></div><p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Changes persist only in this browser so you can safely explore the full product surface.</p></div></div></div></div></>; }

function Login() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<Role>('student');

  const enter = () => {
    localStorage.setItem('astra-role', role);
    setLocation(role === 'student' ? '/student/dashboard' : role === 'university' ? '/university/dashboard' : '/recruiter/dashboard');
  };

  const roleContent = {
    student: {
      title: 'Student Demo',
      name: 'Alex Johnson',
      detail: 'MBA • Human Resources & Marketing',
      target: 'Target: HR Business Partner',
      btn: 'Enter Student Demo →'
    },
    university: {
      title: 'University Demo',
      name: 'ASTRA University',
      detail: 'Placement & Career Intelligence',
      target: '',
      btn: 'Enter University Demo →'
    },
    recruiter: {
      title: 'Recruiter Demo',
      name: 'Demo Technologies',
      detail: 'Talent Acquisition',
      target: '',
      btn: 'Enter Recruiter Demo →'
    }
  };

  return (
    <div className="noise min-h-dvh bg-[hsl(var(--secondary))] p-5 text-[hsl(var(--secondary-foreground))] md:p-10 relative overflow-hidden">
      {/* Subtle Background Visualization */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[hsl(var(--accent)/.15)] blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[hsl(var(--primary)/.1)] blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M200,300 Q400,100 600,300 T1000,300" fill="none" stroke="url(#grad1)" strokeWidth="1" className="animate-pulse" />
          <circle cx="200" cy="300" r="4" fill="hsl(var(--primary))" />
          <circle cx="600" cy="300" r="4" fill="hsl(var(--accent))" />
          <circle cx="1000" cy="300" r="4" fill="hsl(var(--primary))" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
        <Logo light />
        <Link href="/" className="text-sm text-[hsl(var(--secondary-foreground)/.62)] hover:text-[hsl(var(--secondary-foreground))]" data-testid="link-back-home">Back to ASTRA</Link>
      </div>

      <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-12 py-16 lg:grid-cols-[.9fr_1.1fr]">
        <div className="space-y-8">
          <div>
            <Kicker>DEMO ACCESS</Kicker>
            <h1 className="display mt-4 text-5xl font-bold leading-tight md:text-6xl">Enter the world<br/>of ASTRA.</h1>
            <p className="mt-6 max-w-md text-lg leading-7 text-[hsl(var(--secondary-foreground)/.7)]">
              Experience how students, universities, and recruiters connect through one career operating system.
            </p>
          </div>

          <div className="space-y-4">
            {[
              'One connected career ecosystem',
              'Intelligent recommendations',
              'Student, university & recruiter workspaces'
            ].map(t => (
              <div key={t} className="flex items-center gap-3 text-sm font-medium">
                <div className="grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--secondary))]">
                  <Check size={12} strokeWidth={3} />
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 text-[hsl(var(--foreground))] md:p-10 shadow-2xl border-[hsl(var(--border))] transition-all hover:shadow-[0_0_40px_rgba(0,0,0,0.1)]">
          <div className="space-y-2 mb-8">
            <h2 className="display text-2xl font-bold">Choose your workspace</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Jump into a live ASTRA demo. No account or setup required.</p>
          </div>

          <div className="flex p-1 bg-[hsl(var(--muted)/.5)] rounded-xl gap-1 mb-8">
            {(['student', 'university', 'recruiter'] as Role[]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${
                  role === r ? 'bg-white text-[hsl(var(--primary))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="min-h-[160px] transition-all duration-300 ease-in-out">
            <div className="space-y-1">
              <div className="text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-wider">{roleContent[role].title}</div>
              <div className="text-2xl font-bold">{roleContent[role].name}</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">{roleContent[role].detail}</div>
              {roleContent[role].target && <div className="text-sm font-semibold mt-1">{roleContent[role].target}</div>}
            </div>

            <button
              className="btn btn-primary mt-8 w-full group transition-all hover:translate-y-[-2px] hover:shadow-lg"
              onClick={enter}
            >
              {roleContent[role].btn} <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="mt-10 pt-6 border-t border-[hsl(var(--border))] flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-tighter opacity-60">LIVE DEMO ENVIRONMENT</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">Explore real workflows with preloaded demo data.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function Checkout() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan') || 'ASTRA Pro';
  const requestedBilling = params.get('billing') === 'yearly' ? 'yearly' : 'monthly';
  // Pro+ Placement is an annual-only plan — never render a ₹0 monthly price for it.
  const billing = plan === 'Pro+ Placement' ? 'yearly' : requestedBilling;

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [details, setDetails] = useState({ id: '', name: '', number: '', expiry: '', cvv: '' });

  const prices: Record<string, Record<string, number>> = {
    'ASTRA Pro': { monthly: 199, yearly: 1799 },
    'Pro+ Placement': { yearly: 3499 },
  };

  const basePrice = prices[plan]?.[billing] || 0;
  const gst = Math.round(basePrice * 0.18);
  const total = basePrice + gst;

  const handlePay = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
    }, 1500);
  };

  if (paymentStatus === 'success') {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[hsl(143,44%,43%)] text-white">
          <Check size={40} />
        </div>
        <h1 className="display mt-8 text-4xl font-bold">Payment successful!</h1>
        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))]">Welcome to {plan}. Your workspace has been upgraded.</p>
        <button className="btn btn-primary mt-10 w-full" onClick={() => setLocation('/student/dashboard')}>
          Continue to ASTRA <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-8">
          <div>
            <h1 className="display text-3xl font-bold">Secure Checkout</h1>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Complete your upgrade to unlock premium career signals.</p>
          </div>

          <div className="card p-6">
            <Kicker>Payment Method</Kicker>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {(['upi', 'card', 'netbanking'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`btn !py-4 ${paymentMethod === method ? 'btn-primary' : 'btn-outline'} capitalize`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              {paymentMethod === 'upi' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold">UPI ID</label>
                  <input
                    className="input"
                    placeholder="username@upi"
                    value={details.id}
                    onChange={e => setDetails({ ...details, id: e.target.value })}
                  />
                </div>
              )}
              {paymentMethod === 'card' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold">Cardholder Name</label>
                    <input className="input" placeholder="Alex Johnson" value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold">Card Number</label>
                    <input className="input" placeholder="0000 0000 0000 0000" value={details.number} onChange={e => setDetails({ ...details, number: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold">Expiry</label>
                      <input className="input" placeholder="MM/YY" value={details.expiry} onChange={e => setDetails({ ...details, expiry: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold">CVV</label>
                      <input className="input" placeholder="123" value={details.cvv} onChange={e => setDetails({ ...details, cvv: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}
              {paymentMethod === 'netbanking' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold">Select Bank</label>
                  <select className="input" value={details.id} onChange={e => setDetails({ ...details, id: e.target.value })}>
                    <option value="">Choose your bank</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="sbi">State Bank of India</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <Kicker>Order Summary</Kicker>
            <div className="mt-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">{plan} ({billing}{plan === 'Pro+ Placement' ? ', annual plan' : ''})</span>
                <span className="font-bold">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">GST (18%)</span>
                <span className="font-bold">₹{gst}</span>
              </div>
              <div className="border-t border-[hsl(var(--border))] pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[hsl(var(--primary))]">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              className="btn btn-primary mt-8 w-full flex items-center justify-center gap-2"
              onClick={handlePay}
              disabled={paymentStatus === 'processing'}
            >
              {paymentStatus === 'processing' ? <><Loader2 className="animate-spin" size={16} /> Processing...</> : `Pay ₹${total.toLocaleString('en-IN')}`}            </button>
            <p className="mt-4 text-center text-[10px] text-[hsl(var(--muted-foreground))]">
              Demo Checkout — No real payment will be processed. <br/>
              Securely encrypted by ASTRA Payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Student',
      price: '₹0',
      period: 'lifetime',
      detail: 'Your career foundation',
      features: ['Career Passport', 'Skill Gap Map', 'Starter Roadmap', 'Jobs & Internships', 'Community Access'],
      cta: 'Get started for free →',
      highlight: false,
      link: '/signup'
    },
    {
      name: 'ASTRA Pro',
      price: billingCycle === 'monthly' ? '₹199' : '₹1,799',
      period: billingCycle === 'monthly' ? '/ month' : '/ year',
      detail: 'For students building with intent',
      features: ['Career Autopilot', 'Skill Assessments', 'Learning Hub', 'Projects & Portfolio', 'AI Interview Practice', 'Priority Job & Internship Access'],
      cta: 'Start Pro Plan →',
      highlight: true,
      link: '/signup'
    },
    {
      name: 'Pro+ Placement',
      price: '₹3,499',
      period: '/ year',
      detail: 'For the full outcome loop · billed annually',
      features: ['Everything in Pro', '1:1 Mentor Sessions', 'Human Resume & LinkedIn Review', 'Placement Support & Job Referrals', 'Exclusive Company Drives', 'Priority Recruiter Visibility'],
      cta: 'Start Placement Plan →',
      highlight: false,
      link: '/signup'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Subtle Indian Visual Identity Background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.06]">
        {/* Saffron, White, Green Accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[hsl(32,96%,62%)] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[hsl(143,44%,43%)] blur-[120px]" />

        {/* Ashoka Chakra Inspired Pattern */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
          <svg width="600" height="600" viewBox="0 0 100 100" className="text-[hsl(var(--primary))] fill-current">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" />
            {[...Array(24)].map((_, i) => (
              <line key={i} x1="50" y1="50" x2={50 + 48 * Math.cos((i * Math.PI) / 12)} y2={50 + 48 * Math.sin((i * Math.PI) / 12)} stroke="currentColor" strokeWidth="0.2" />
            ))}
          </svg>
        </div>

        {/* Minimal Cityline Silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-40">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full text-[hsl(var(--secondary))] fill-current">
            <path d="M0,120 L0,100 L20,100 L30,80 L50,80 L60,100 L80,100 L90,60 L120,60 L130,100 L150,100 L160,90 L200,90 L210,100 L250,100 L260,70 L300,70 L310,100 L350,100 L360,80 L400,80 L410,100 L450,100 L460,50 L500,50 L510,100 L550,100 L560,90 L600,90 L610,100 L650,100 L660,70 L700,70 L710,100 L750,100 L760,80 L800,80 L810,100 L850,100 L860,60 L900,60 L910,100 L950,100 L960,90 L1000,90 L1010,100 L1050,100 L1060,70 L1100,70 L1110,100 L1200,100 L1200,120 Z" />
          </svg>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="max-w-2xl mb-12 text-center mx-auto">
          <div className="label text-[hsl(var(--primary))] mb-3 block">FOR INDIAN STUDENTS 🇮🇳</div>
          <h1 className="display mt-4 text-5xl font-bold md:text-7xl leading-tight">Choose the momentum<br/>for your future.</h1>
          <p className="mt-5 text-base leading-7 text-[hsl(var(--muted-foreground))]">Whether you're exploring, building, or ready to get placed — ASTRA gives you the right support at every step of your journey.</p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="grid h-6 w-11 place-items-center rounded-full bg-[hsl(var(--muted))] relative transition-colors hover:bg-[hsl(var(--border))]"
            >
              <div className={`absolute h-4 w-4 rounded-full bg-[hsl(var(--primary))] transition-all ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>Yearly</span>
            {billingCycle === 'yearly' && <span className="tag status-verified text-[10px] !bg-transparent text-[hsl(var(--primary))]">Save up to 20%</span>}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <div key={p.name} className={`card flex flex-col p-6 relative ${p.highlight ? '!border-[hsl(var(--primary))] !bg-[hsl(var(--primary)/.03)]' : ''}`}>
              {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 tag status-verified text-[10px]">Most Popular</div>}
              <div className="flex items-center justify-between">
                <Kicker>{p.name}</Kicker>
              </div>
              <div className="display mt-8 text-3xl font-bold">{p.price}<span className="text-sm font-normal opacity-60">{p.period}</span></div>
              <p className="mt-2 min-h-10 text-xs text-[hsl(var(--muted-foreground))]">{p.detail}</p>
              <div className="mt-6 space-y-3 border-t border-[hsl(var(--border))] pt-5">
                {p.features.map(f => (
                  <div key={f} className="flex gap-2 text-xs font-semibold">
                    <Check size={14} className="text-[hsl(var(--primary))]" /> {f}
                  </div>
                ))}
              </div>
              <Link href={p.name === 'Student' ? '/signup' : `/checkout?plan=${encodeURIComponent(p.name)}&billing=${p.name === 'Pro+ Placement' ? 'yearly' : billingCycle}`} className={`btn mt-auto ${p.highlight ? 'btn-primary' : 'btn-outline'} mt-8`}>{p.cta}</Link>
            </div>
          ))}
        </div>

        {/* Trust Strip */}
        <div className="mt-20 grid gap-8 sm:grid-cols-3 border-t border-[hsl(var(--border))] pt-12">
          {[
            { label: 'Indian students supported', value: '10K+', icon: Users },
            { label: 'Hiring companies', value: '500+', icon: Building2 },
            { label: 'Better opportunity visibility', value: '90%', icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[hsl(var(--card)/.5)] border border-[hsl(var(--border))]">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]">
                <stat.icon size={20} />
              </div>
              <div>
                <div className="display text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function StudentPage({ section }: { section: string }) { if (section === 'dashboard') return <Dashboard />; if (section === 'career-passport') return <Passport />; if (section === 'roadmap') return <Roadmap />; if (section === 'assessments') return <Assessments />; if (section === 'learning') return <Learning />; if (section === 'projects') return <Projects />; if (section === 'jobs') return <Jobs />; if (section === 'internships') return <OpportunityBoard kind="internships" />; if (section === 'scholarships') return <OpportunityBoard kind="scholarships" />; if (section === 'hackathons') return <OpportunityBoard kind="hackathons" />; if (section === 'project-marketplace') return <OpportunityBoard kind="marketplace" />; if (section === 'research') return <OpportunityBoard kind="research" />; if (section === 'startup-hub') return <OpportunityBoard kind="startups" />; if (section === 'team-finder') return <TeamFinderBoard />; if (section === 'certifications') return <CertificationsBoard />; if (section === 'mentors') return <MentorsBoard />; if (section === 'alumni') return <AlumniBoard />; if (section === 'applications') return <Applications />; if (section === 'analytics') return <Analytics />; if (section === 'assistant') return <Assistant />; if (section === 'portfolio') return <Portfolio />; if (section === 'interview') return <Interview />; if (section === 'community') return <Community />; if (section === 'productivity') return <Productivity />; return <NotFound />; }

function AppRouter() {
  return <Switch>
    <Route path="/" component={Landing} /><Route path="/login"><Login /></Route><Route path="/signup"><Login /></Route><Route path="/pricing" component={Pricing} /><Route path="/checkout" component={Checkout} /><Route path="/demo"><Shell role="student"><StudentPage section="dashboard" /></Shell></Route>
    <Route path="/student/dashboard"><Shell role="student"><StudentPage section="dashboard" /></Shell></Route><Route path="/student/career-passport"><Shell role="student"><StudentPage section="career-passport" /></Shell></Route><Route path="/student/roadmap"><Shell role="student"><StudentPage section="roadmap" /></Shell></Route><Route path="/student/assessments"><Shell role="student"><StudentPage section="assessments" /></Shell></Route><Route path="/student/learning"><Shell role="student"><StudentPage section="learning" /></Shell></Route><Route path="/student/certifications"><Shell role="student"><StudentPage section="certifications" /></Shell></Route><Route path="/student/projects"><Shell role="student"><StudentPage section="projects" /></Shell></Route><Route path="/student/portfolio"><Shell role="student"><StudentPage section="portfolio" /></Shell></Route><Route path="/student/jobs"><Shell role="student"><StudentPage section="jobs" /></Shell></Route><Route path="/student/internships"><Shell role="student"><StudentPage section="internships" /></Shell></Route><Route path="/student/applications"><Shell role="student"><StudentPage section="applications" /></Shell></Route><Route path="/student/interview"><Shell role="student"><StudentPage section="interview" /></Shell></Route><Route path="/student/assistant"><Shell role="student"><StudentPage section="assistant" /></Shell></Route><Route path="/student/mentors"><Shell role="student"><StudentPage section="mentors" /></Shell></Route><Route path="/student/alumni"><Shell role="student"><StudentPage section="alumni" /></Shell></Route><Route path="/student/scholarships"><Shell role="student"><StudentPage section="scholarships" /></Shell></Route><Route path="/student/hackathons"><Shell role="student"><StudentPage section="hackathons" /></Shell></Route><Route path="/student/team-finder"><Shell role="student"><StudentPage section="team-finder" /></Shell></Route><Route path="/student/project-marketplace"><Shell role="student"><StudentPage section="project-marketplace" /></Shell></Route><Route path="/student/research"><Shell role="student"><StudentPage section="research" /></Shell></Route><Route path="/student/startup-hub"><Shell role="student"><StudentPage section="startup-hub" /></Shell></Route><Route path="/student/productivity"><Shell role="student"><StudentPage section="productivity" /></Shell></Route><Route path="/student/analytics"><Shell role="student"><StudentPage section="analytics" /></Shell></Route><Route path="/student/community"><Shell role="student"><StudentPage section="community" /></Shell></Route>
    <Route path="/university/dashboard"><Shell role="university"><UniversityPage section="dashboard" /></Shell></Route><Route path="/university/students"><Shell role="university"><UniversityPage section="students" /></Shell></Route><Route path="/university/placements"><Shell role="university"><UniversityPage section="placements" /></Shell></Route><Route path="/university/analytics"><Shell role="university"><UniversityPage section="analytics" /></Shell></Route><Route path="/university/settings"><Shell role="university"><UniversityPage section="settings" /></Shell></Route>
    <Route path="/recruiter/dashboard"><Shell role="recruiter"><RecruiterPage section="dashboard" /></Shell></Route><Route path="/recruiter/talent"><Shell role="recruiter"><RecruiterPage section="talent" /></Shell></Route><Route path="/recruiter/jobs"><Shell role="recruiter"><RecruiterPage section="jobs" /></Shell></Route><Route path="/recruiter/shortlist"><Shell role="recruiter"><RecruiterPage section="shortlist" /></Shell></Route><Route path="/recruiter/analytics"><Shell role="recruiter"><RecruiterPage section="analytics" /></Shell></Route><Route path="/recruiter/interviews"><Shell role="recruiter"><RecruiterPage section="interviews" /></Shell></Route><Route path="/recruiter/company"><Shell role="recruiter"><RecruiterPage section="company" /></Shell></Route><Route path="/recruiter/settings"><Shell role="recruiter"><RecruiterPage section="settings" /></Shell></Route>
    <Route component={NotFound} />
  </Switch>;
}

function App() { const { data, update, reset } = usePersistedData(); const [notice, setNotice] = useState(''); const toast = (message: string) => { setNotice(message); setTimeout(() => setNotice(''), 2200); }; return <AstraContext.Provider value={{ data, update, reset, toast }}><AppRouter />{notice && <div className="toast" role="status" data-testid="status-toast">{notice}</div>}</AstraContext.Provider>; }

export default App;