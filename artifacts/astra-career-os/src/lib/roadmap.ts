/* ------------------------------------------------------------------ */
/*  Career Autopilot — roadmap generation engine                       */
/*  Pure logic: takes the role database, the student's skill profile,  */
/*  and a timeline, and produces an adapted roadmap plan.              */
/* ------------------------------------------------------------------ */

export type RoleSkillStatus = 'VERIFIED' | 'ASSESSED' | 'BASIC' | 'MISSING';

export type SkillRow = { name: string; status: RoleSkillStatus; level: number };

export type RoleTask = { title: string; skill: string; impact: number; link: string };

export type RolePhase = { title: string; duration: string; tasks: RoleTask[] };

export type RoleRequirements = {
  category: string;
  skills: string[];
  phases: RolePhase[];
  why: string;
};

export type RoadmapPlanItem = {
  id: string;
  title: string;
  detail: string;
  status: string;
  skill: string;
  week: string;
  link?: string;
};

export type RoadmapPlan = RoadmapPlanItem[];

export const TIMELINE_OPTIONS = [
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: '6 months', value: 180 },
  { label: '12 months', value: 365 },
  { label: '18 months', value: 547 },
  { label: '24 months', value: 730 },
];

export const TIMELINE_PRESETS = [
  { label: 'QUICK START', range: [14, 30] as const, blurb: 'Compact high-priority actions' },
  { label: 'CAREER BUILD', range: [60, 90] as const, blurb: 'Structured, phased plan' },
  { label: 'PLACEMENT READY', range: [90, 180] as const, blurb: 'Role proof + interview track' },
  { label: 'LONG-TERM', range: [365, 730] as const, blurb: 'Broader career journey' },
];

export function formatTimeline(days: number): string {
  if (days < 60) return `${days} days`;
  if (days <= 730) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

export function timelinePresetFor(days: number) {
  return TIMELINE_PRESETS.find(p => days >= p.range[0] && days <= p.range[1]) ?? TIMELINE_PRESETS[0];
}

const GAP_WEIGHT: Record<RoleSkillStatus, number> = { MISSING: 100, BASIC: 60, ASSESSED: 25, VERIFIED: 0 };

function skillProfile(skills: SkillRow[]) {
  const map: Record<string, { status: RoleSkillStatus; level: number }> = {};
  for (const s of skills) map[s.name.toLowerCase()] = { status: s.status, level: s.level };
  return map;
}

function gapScoreFor(skill: string, profile: ReturnType<typeof skillProfile>): number {
  const p = profile[skill.toLowerCase()];
  if (!p) return 50;
  const levelPenalty = p.status === 'BASIC' ? Math.max(0, 45 - p.level) : 0;
  return GAP_WEIGHT[p.status] + levelPenalty;
}

type RequirementEntry = {
  task: RoleTask;
  phase: RolePhase;
  phaseIndex: number;
};

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/* Step 1 — analyze the Career Passport into a skill lookup table. */
function analyzePassport(skills: SkillRow[]) {
  return skillProfile(skills);
}

/* Step 2 — collect the role's full requirement list with phase context. */
function collectRequirements(role: RoleRequirements): RequirementEntry[] {
  return role.phases.flatMap((phase, phaseIndex) =>
    phase.tasks.map(task => ({ task, phase, phaseIndex })),
  );
}

/* Step 3 — prioritize. Two stages:
 *   Stage 0: tasks whose skill is on the Passport but MISSING / BASIC / ASSESSED
 *            (ranked by gap size — the student's real gaps go first).
 *   Stage 1: tasks for skills not on the Passport yet, kept in the role's
 *            phase order (fundamentals before proof before applications).
 *   Stage 2: tasks that only package an already-VERIFIED skill (last).
 * The number of moves adapts to the timeline preset. */
function prioritize(
  requirements: RequirementEntry[],
  profile: ReturnType<typeof skillProfile>,
  timelineDays: number,
): RequirementEntry[] {
  const preset = timelinePresetFor(timelineDays);
  const stageOf = (entry: RequirementEntry) => {
    const p = profile[entry.task.skill.toLowerCase()];
    if (p && (p.status === 'MISSING' || p.status === 'BASIC' || p.status === 'ASSESSED')) return 0;
    if (p && p.status === 'VERIFIED') return 2;
    return 1;
  };
  const byGapImpact = (a: RequirementEntry, b: RequirementEntry) =>
    gapScoreFor(b.task.skill, profile) + b.task.impact * 2 - (gapScoreFor(a.task.skill, profile) + a.task.impact * 2);
  const byJourney = (a: RequirementEntry, b: RequirementEntry) =>
    a.phaseIndex - b.phaseIndex || b.task.impact - a.task.impact;

  const ordered = [...requirements].sort((a, b) => {
    const sa = stageOf(a);
    const sb = stageOf(b);
    if (sa !== sb) return sa - sb;
    return sa === 0 ? byGapImpact(a, b) : byJourney(a, b);
  });

  const budget = preset.label === 'QUICK START' ? 4 : preset.label === 'CAREER BUILD' ? 6 : preset.label === 'PLACEMENT READY' ? 8 : ordered.length;
  return ordered.slice(0, budget);
}

/* Step 4 — lay the plan across the timeline with week/day/month labels. */
function layOutTimeline(ordered: RequirementEntry[], timelineDays: number, roleKey: string): RoadmapPlan {
  const preset = timelinePresetFor(timelineDays);
  const unit = preset.label === 'QUICK START' ? 'Day' : preset.label === 'LONG-TERM' ? 'Month' : 'Week';
  const total = preset.label === 'QUICK START'
    ? timelineDays
    : preset.label === 'LONG-TERM'
      ? Math.max(2, Math.round(timelineDays / 30))
      : Math.max(2, Math.round(timelineDays / 7));
  const slug = roleKey.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return ordered.map((entry, i) => {
    const start = Math.floor((i * total) / ordered.length) + 1;
    const end = Math.max(start, Math.floor(((i + 1) * total) / ordered.length));
    return {
      id: `${slug}-${i}`,
      title: entry.task.title,
      skill: entry.task.skill,
      link: entry.task.link,
      week: `${unit} ${start}${end > start ? `–${end}` : ''}`,
      detail: detailFor(entry.task.skill, entry.phase.title),
      status: 'Up next',
    };
  });
}

/* detail text depends on how far the student's skill is from verified. */
function detailFor(skill: string, phaseTitle: string): string {
  return `${phaseTitle} — strengthen ${skill} and turn it into visible proof for the role.`;
}

/* Step 5 — assign statuses: previously completed moves stay complete, the
 * first open move is in progress, the next two are up next, the rest unlock. */
function finalizeStatuses(plan: RoadmapPlan, previousCompleteTitles: string[]): RoadmapPlan {
  const firstOpen = plan.findIndex(item => !previousCompleteTitles.includes(item.title));
  if (firstOpen === -1) return plan.map(item => ({ ...item, status: 'Complete' }));
  return plan.map((item, i) => {
    let status: string;
    if (previousCompleteTitles.includes(item.title)) status = 'Complete';
    else if (i === firstOpen) status = 'In progress';
    else if (i <= firstOpen + 2) status = 'Up next';
    else status = 'Locked';
    return { ...item, status };
  });
}

/**
 * The full regeneration flow. Each stage runs real computation against
 * the role database and the student's skills, and reports its progress.
 */
export async function runRoadmapPipeline(
  roleDb: Record<string, RoleRequirements>,
  roleKey: string,
  skills: SkillRow[],
  timelineDays: number,
  previous: { title: string; status: string }[],
  onStage: (stage: string) => void,
): Promise<RoadmapPlan> {
  const role = roleDb[roleKey] ?? roleDb['HR Business Partner'];

  onStage('Analyzing Career Passport...');
  const profile = analyzePassport(skills);
  await pause(300);

  onStage('Comparing role requirements...');
  const requirements = collectRequirements(role);
  await pause(320);

  onStage('Identifying skill gaps...');
  const prioritized = prioritize(requirements, profile, timelineDays);
  await pause(360);

  onStage('Building career plan...');
  const planned = layOutTimeline(prioritized, timelineDays, roleKey);
  await pause(320);

  onStage('Ranking next best actions...');
  const final = finalizeStatuses(planned, previous.filter(t => t.status === 'Complete').map(t => t.title));
  await pause(280);

  return final;
}

/** The single most important gap among the role's required skills. */
export function topGapFor(
  roleDb: Record<string, RoleRequirements>,
  roleKey: string,
  skills: SkillRow[],
): string | null {
  const role = roleDb[roleKey];
  if (!role) return null;
  const profile = skillProfile(skills);
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const skill of role.skills) {
    const score = gapScoreFor(skill, profile);
    if (score > bestScore) {
      bestScore = score;
      best = skill;
    }
  }
  return bestScore > 0 ? best : null;
}

/* ------------------------------------------------------------------ */
/*  Skill gap engine — Career Passport × role requirements            */
/* ------------------------------------------------------------------ */

export type SkillBand = 'missing' | 'basic' | 'developing' | 'strong';

/** A role-required skill, classified against the student's Passport. */
export type RankedGap = {
  name: string;
  status: RoleSkillStatus | 'UNLISTED';
  level: number;
  band: SkillBand;
};

export function bandFor(status: RoleSkillStatus | 'UNLISTED' | undefined): SkillBand {
  if (status === 'VERIFIED') return 'strong';
  if (status === 'ASSESSED') return 'developing';
  if (status === 'BASIC') return 'basic';
  return 'missing'; // MISSING or not on the Passport at all
}

/**
 * Classify every skill the target role requires against the student's
 * Passport: missing (incl. not listed), basic, developing, strong.
 */
export function roleSkillBands(
  roleDb: Record<string, RoleRequirements>,
  roleKey: string,
  skills: SkillRow[],
): RankedGap[] {
  const role = roleDb[roleKey];
  if (!role) return [];
  const profile = skillProfile(skills);
  return role.skills.map(skill => {
    const p = profile[skill.toLowerCase()];
    const status = p ? p.status : ('UNLISTED' as const);
    return { name: skill, status, level: p ? p.level : 0, band: bandFor(status) };
  });
}

/** Gaps only (everything below strong), ranked most-important first. */
export function rankedRoleGaps(
  roleDb: Record<string, RoleRequirements>,
  roleKey: string,
  skills: SkillRow[],
): RankedGap[] {
  const profile = skillProfile(skills);
  return roleSkillBands(roleDb, roleKey, skills)
    .filter(g => g.band !== 'strong')
    .sort((a, b) => gapScoreFor(b.name, profile) - gapScoreFor(a.name, profile));
}