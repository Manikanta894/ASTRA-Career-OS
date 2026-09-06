import fs from 'node:fs';

const p = 'src/App.tsx';
const src = fs.readFileSync(p, 'utf8');
const lines = src.split('\n');

// --- sanity check: line 226 = function Landing() {  and  line 239 = }  (1-based) ---
if (lines[225].trim() !== 'function Landing() {' || lines[238].trim() !== '}') {
  throw new Error(
    'Line offsets out of sync: [' +
      JSON.stringify([lines[225].trim(), lines[238].trim()]) +
      ']',
  );
}

// keep existing demo / system / how / footer sections (file lines 234-238)
const kept = lines.slice(233, 238).join('\n');

const newLanding = [
  "function Landing() {",
  "  const { data } = useAstra();",
  "  const [demo, setDemo] = useState<Role>('student');",
  "  const readiness = calculateReadiness(data);",
  "  const matches = data.jobs.map(j => calculateJobMatch(j, data));",
  "  const roadmapPct = Math.round((data.roadmap.filter(r => r.status === 'Completed' || r.status === 'In progress').length / Math.max(data.roadmap.length, 1)) * 100);",
  "  const topJob = data.jobs[0];",
  "  return <div className=\"noise min-h-dvh overflow-hidden\">",
  "    <LandingHero",
  "      data={{",
  "        name: data.studentProfile.name,",
  "        initials: data.studentProfile.initials,",
  "        targetRole: data.studentProfile.targetRole,",
  "        readiness,",
  "        verifiedSkills: data.verifiedSkills.length,",
  "        projects: data.projects.length,",
  "        certifications: data.certifications.length,",
  "        applications: data.applications.length,",
  "        interviews: data.interviews.length,",
  "        roadmapPct,",
  "        jobMatchBest: Math.max(0, ...matches),",
  "        topJob: topJob?.title ?? 'People Operations Specialist',",
  "        topJobMatch: topJob ? calculateJobMatch(topJob, data) : 0,",
  "        gap: calculateSkillGaps(data)[0] ?? 'HR Analytics',",
  "        nextAction: data.roadmap[0]?.title ?? 'Validate HR Analytics',",
  "      }}",
  "    />",
  kept,
  "  </div>;",
  "}",
].join('\n');

const next = [...lines.slice(0, 225), newLanding, ...lines.slice(239)].join('\n');

// --- add /demo route beside /pricing ---
if (!next.includes('<Route path="/demo"')) {
  const updated = next
    .split('\n')
    .map((l) =>
      l.includes('component={Pricing}')
        ? l.replace(
            '<Route path="/pricing" component={Pricing} />',
            '<Route path="/pricing" component={Pricing} /><Route path="/demo"><Shell role="student"><StudentPage section="dashboard" /></Shell></Route>',
          )
        : l,
    )
    .join('\n');
  fs.writeFileSync(p, updated);
  console.log('Rewrote Landing + added /demo route');
} else {
  fs.writeFileSync(p, next);
  console.log('Rewrote Landing (demo route already present)');
}