/* ------------------------------------------------------------------ */
/*  Recruiter candidate cohort — the demo talent pool.                 */
/*  Alex Johnson is `live`: every profile field renders from the       */
/*  student's real ASTRA state. Peers are stored demo profiles with    */
/*  the same shape so discovery, profiles, and pipeline treat them     */
/*  identically. Peer applications seed the recruiter pipeline;        */
/*  Alex's applications flow in live from student state.               */
/* ------------------------------------------------------------------ */

export type PeerCandidate = {
  id: string;
  name: string;
  initials: string;
  program: string;
  graduation: string;
  school: string;
  targetRole: string;
  readiness: number;
  skills: { name: string; status: 'VERIFIED' | 'ASSESSED' | 'BASIC' | 'MISSING'; level: number }[];
  verifiedSkills: string[];
  assessments: { name: string; score: number }[];
  certifications: string[];
  projects: { name: string; outcome: string }[];
  bio: string;
};

export const PEERS: PeerCandidate[] = [
  {
    id: 'peer-mc', name: 'Maya Chen', initials: 'MC', program: 'MBA Product & Strategy', graduation: '2026', school: 'ASTRA University',
    targetRole: 'Product Manager', readiness: 78,
    skills: [
      { name: 'Product Strategy', status: 'VERIFIED', level: 84 }, { name: 'User Research', status: 'VERIFIED', level: 88 },
      { name: 'Product Analytics', status: 'ASSESSED', level: 72 }, { name: 'Roadmapping', status: 'BASIC', level: 48 },
      { name: 'Agile', status: 'BASIC', level: 55 }, { name: 'Communication', status: 'VERIFIED', level: 82 },
    ],
    verifiedSkills: ['Product Strategy', 'User Research', 'Communication'],
    assessments: [{ name: 'Product Analytics', score: 72 }, { name: 'Communication', score: 86 }],
    certifications: ['Product Management Certificate', 'Advanced User Research'],
    projects: [{ name: 'Campus dining ordering research', outcome: 'Cut order wait time 22% with a redesigned flow.' }, { name: 'Product teardown series', outcome: '12 teardowns published with 3k+ reads.' }],
    bio: 'Turning user research into product decisions with the evidence to back them.',
  },
  {
    id: 'peer-dc', name: 'Darius Cole', initials: 'DC', program: 'MS Computer Science', graduation: '2026', school: 'ASTRA University',
    targetRole: 'Software Engineer', readiness: 91,
    skills: [
      { name: 'Systems Design', status: 'VERIFIED', level: 90 }, { name: 'Python', status: 'VERIFIED', level: 86 },
      { name: 'AWS', status: 'ASSESSED', level: 74 }, { name: 'Distributed Systems', status: 'ASSESSED', level: 70 },
      { name: 'Communication', status: 'BASIC', level: 52 },
    ],
    verifiedSkills: ['Systems Design', 'Python'],
    assessments: [{ name: 'Systems Design', score: 90 }, { name: 'Python', score: 86 }],
    certifications: ['AWS Solutions Architect — Associate'],
    projects: [{ name: 'Distributed cache design study', outcome: 'Prototyped a 40% faster read path under load.' }, { name: 'Open-source contribution', outcome: 'Merged fixes into a widely used queueing library.' }],
    bio: 'Systems-minded engineer who writes code that other people can maintain.',
  },
  {
    id: 'peer-nk', name: 'Nora Kim', initials: 'NK', program: 'BBA Marketing', graduation: '2027', school: 'ASTRA University',
    targetRole: 'Business Analyst', readiness: 68,
    skills: [
      { name: 'SQL', status: 'ASSESSED', level: 66 }, { name: 'Tableau', status: 'ASSESSED', level: 70 },
      { name: 'Excel', status: 'VERIFIED', level: 84 }, { name: 'Data Analysis', status: 'BASIC', level: 45 },
      { name: 'Storytelling', status: 'VERIFIED', level: 80 },
    ],
    verifiedSkills: ['Excel', 'Storytelling'],
    assessments: [{ name: 'SQL', score: 66 }, { name: 'Excel', score: 84 }],
    certifications: ['Tableau Desktop Specialist'],
    projects: [{ name: 'Retail cohort dashboard', outcome: 'Segmented 18 months of sales into 4 actionable cohorts.' }],
    bio: 'Data storyteller building a people-analytics portfolio one project at a time.',
  },
  {
    id: 'peer-av', name: 'Aisha Verma', initials: 'AV', program: 'MBA Strategy', graduation: '2026', school: 'ASTRA University',
    targetRole: 'Financial Analyst', readiness: 81,
    skills: [
      { name: 'Financial Modeling', status: 'VERIFIED', level: 83 }, { name: 'Excel', status: 'VERIFIED', level: 88 },
      { name: 'Valuation', status: 'ASSESSED', level: 71 }, { name: 'Market Research', status: 'ASSESSED', level: 68 },
      { name: 'SQL', status: 'BASIC', level: 42 },
    ],
    verifiedSkills: ['Financial Modeling', 'Excel'],
    assessments: [{ name: 'Financial Modeling', score: 83 }],
    certifications: ['Financial Modeling & Valuation Analyst (FMVA)'],
    projects: [{ name: 'Comparable-company valuation of two retail chains', outcome: 'Model reviewed and signed off by an alum mentor.' }],
    bio: 'Strategy brain with a spreadsheet habit — I like questions that end in a decision.',
  },
  {
    id: 'peer-si', name: 'Samir Patel', initials: 'SP', program: 'MS Data Science', graduation: '2027', school: 'ASTRA University',
    targetRole: 'Data Scientist', readiness: 74,
    skills: [
      { name: 'Python', status: 'VERIFIED', level: 85 }, { name: 'Statistics', status: 'VERIFIED', level: 79 },
      { name: 'Machine Learning', status: 'ASSESSED', level: 64 }, { name: 'Data Visualization', status: 'ASSESSED', level: 70 },
      { name: 'Communication', status: 'BASIC', level: 50 },
    ],
    verifiedSkills: ['Python', 'Statistics'],
    assessments: [{ name: 'Machine Learning', score: 64 }, { name: 'Python', score: 85 }],
    certifications: ['TensorFlow Developer Certificate'],
    projects: [{ name: 'Engagement churn model', outcome: 'Flagged at-risk members three weeks earlier than the old heuristic.' }],
    bio: 'I model the boring problems until they become interesting ones.',
  },
];

/** Role-tag chips used by talent discovery's role filter. */
export const peerRoles = (peers: PeerCandidate[]): string[] => Array.from(new Set(peers.map(p => p.targetRole)));

/* Peer pipeline seeds — real rows in shared state, keyed to peer ids. */
export type PeerApplicationSeed = { id: string; jobId: string; peerId: string; stage: 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected' | 'Hired'; date: string };

export const PEER_APPLICATIONS: PeerApplicationSeed[] = [
  { id: 'pa1', jobId: 'rj1', peerId: 'peer-mc', stage: 'Screening', date: 'Mar 09' },
  { id: 'pa2', jobId: 'rj2', peerId: 'peer-av', stage: 'Applied', date: 'Mar 10' },
  { id: 'pa3', jobId: 'rj1', peerId: 'peer-nk', stage: 'Applied', date: 'Mar 10' },
  { id: 'pa4', jobId: 'rj2', peerId: 'peer-dc', stage: 'Rejected', date: 'Mar 05' },
];
