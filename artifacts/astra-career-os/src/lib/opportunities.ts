/* ------------------------------------------------------------------ */
/*  Opportunity catalogs — internships, scholarships, hackathons,      */
/*  team members, marketplace briefs, research, and startups.          */
/*  Static demo catalogs (like ROLE_DB); user activity (saved/applied) */
/*  lives in ASTRA state, keyed by board id.                           */
/* ------------------------------------------------------------------ */

export type Opportunity = {
  id: string;
  title: string;
  org: string;
  location: string;
  type: string;
  tags: string[];
  meta: string;
  detail: string;
  bullets: string[];
};

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  program: string;
  role: string;
  lookingFor: string;
  skills: string[];
  availability: string;
  blurb: string;
};

/* ----------------------------- internships ----------------------------- */
export const INTERNSHIPS: Opportunity[] = [
  { id: 'in1', title: 'People Operations Intern', org: 'Latticeworks', location: 'New York · Hybrid', type: 'HR', tags: ['People ops', 'Excel', 'HR Analytics'], meta: '10 weeks · $28/hr', detail: 'Work beside the People team on onboarding, engagement pulse checks, and the hiring funnel the Latticeworks People org runs every quarter.', bullets: ['Own one engagement pulse from design to synthesis', 'Maintain the weekly workforce dashboard in Excel', 'Present a funnel teardown to the Head of People'] },
  { id: 'in2', title: 'Talent & Employer Branding Intern', org: 'Goodwell', location: 'Remote · US', type: 'Marketing', tags: ['Employer brand', 'Content', 'Recruitment'], meta: '12 weeks · $24/hr', detail: 'Help Goodwell show candidates what working there is actually like — through campus events, written stories, and a hiring-page refresh.', bullets: ['Write candidate stories that convert interest into applications', 'Coordinate two campus recruiting events', 'Audit the careers site with the brand team'] },
  { id: 'in3', title: 'HR Analytics Summer Intern', org: 'Frame Systems', location: 'Boston · On-site', type: 'Analytics', tags: ['HR Analytics', 'Excel', 'SQL'], meta: 'Summer · $32/hr', detail: 'Join a small analytics crew turning workforce data into decisions for engineering and go-to-market leaders.', bullets: ['Build a retention cohort dashboard', 'Pair with a data scientist on a churn model', 'Present findings to the VP of People'] },
  { id: 'in4', title: 'Recruitment Operations Intern', org: 'Morrow', location: 'Remote · US', type: 'HR', tags: ['Recruitment', 'Sourcing', 'ATS'], meta: '8 weeks · $26/hr', detail: 'Morrow is scaling its campus hiring program. You will keep the pipeline clean, source smart, and learn how ops makes recruiting humane.', bullets: ['Run the ATS pipeline for two campus roles', 'Source 40 qualified candidates from events', 'Build the intern hiring playbook with the team'] },
  { id: 'in5', title: 'Learning & Development Intern', org: 'Cedar House', location: 'Austin · Hybrid', type: 'L&D', tags: ['L&D', 'Content', 'Facilitation'], meta: '10 weeks · $22/hr', detail: 'Cedar House is building manager learning paths. You will turn messy interview notes into curriculum that managers actually finish.', bullets: ['Turn manager interviews into module outlines', 'Co-facilitate one onboarding cohort', 'Measure completion against manager confidence'] },
  { id: 'in6', title: 'DEI Program Intern', org: 'Olive & Co.', location: 'Chicago · Hybrid', type: 'DEI', tags: ['DEI', 'Data', 'Programs'], meta: '12 weeks · $25/hr', detail: 'Support Olive & Co. in running belonging surveys and translating the results into programs that move representation metrics.', bullets: ['Coordinate the quarterly belonging survey', 'Analyze response trends by segment', 'Draft the DEI program calendar for fall'] },
];

/* ----------------------------- scholarships ----------------------------- */
export const SCHOLARSHIPS: Opportunity[] = [
  { id: 's1', title: 'Future of Work Fellowship', org: 'ASTRA Foundation', location: 'Remote · Open globally', type: 'Research', tags: ['Research', 'Future of work', '$4,000'], meta: '$4,000 · Deadline Apr 18', detail: 'For students researching how teams and technology work better together. The fellowship funds one semester of independent inquiry with a mentor from the field.', bullets: ['$4,000 stipend toward tuition or living costs', 'A named mentor from the ASTRA partner network', 'Publication in the Future of Work field notes'] },
  { id: 's2', title: 'ASTRA Impact Grant', org: 'ASTRA University', location: 'ASTRA campus', type: 'Impact', tags: ['Community', 'Prototype', '$1,500'], meta: '$1,500 · Rolling', detail: 'Prototype a measurable project with a community partner. Past winners built a job-readiness workshop and a peer-mentoring pilot.', bullets: ['$1,500 project budget', 'Community partner introductions', 'Showcase at the Spring Impact Fair'] },
  { id: 's3', title: 'Women in Business Scholarship', org: 'Meridian Health', location: 'Remote · Open to all', type: 'Merit', tags: ['Leadership', 'Merit', '$6,000'], meta: '$6,000 · Deadline May 02', detail: 'Meridian funds a merit award for students who lead teams and build systems that make work more human — regardless of gender.', bullets: ['$6,000 toward your program', 'Access to the Meridian women-in-leadership circle', 'Priority internship consideration at Meridian'] },
  { id: 's4', title: 'Data for Good Scholarship', org: 'Frame Systems', location: 'Remote', type: 'Merit', tags: ['Data', 'Social impact', '$5,000'], meta: '$5,000 · Deadline May 15', detail: 'Awarded to students who use data to improve people outcomes — in their community, at school, or inside an organization.', bullets: ['$5,000 award', 'One-on-one session with a Frame data scientist', 'Invite to the annual Frame summit'] },
  { id: 's5', title: 'First-Gen Leaders Fund', org: 'Olive & Co.', location: 'Remote', type: 'Merit', tags: ['First-gen', 'Leadership', '$3,000'], meta: '$3,000 · Rolling', detail: 'Olive & Co. supports first-generation students who are the first in their family to pursue a professional career track.', bullets: ['$3,000 need-based award', 'Paired with an Olive & Co. leader', 'Interview prep support'] },
];

/* ------------------------------ hackathons ------------------------------ */
export const HACKATHONS: Opportunity[] = [
  { id: 'h1', title: 'People + Data Sprint', org: 'ASTRA Labs', location: 'Remote · 48 hours', type: 'Data', tags: ['People data', 'Analytics', 'Team'], meta: 'Apr 06 · 48 hours · Remote', detail: 'Turn messy people data into a decision leaders can act on. Teams get one dataset, one burning question, and two days.', bullets: ['A real anonymized workforce dataset', 'Mentor office hours from people analysts', 'Top teams present to partner companies'] },
  { id: 'h2', title: 'Campus Impact Lab', org: 'ASTRA', location: 'ASTRA campus', type: 'Design', tags: ['Campus', 'Cross-functional', '2 days'], meta: 'Apr 20 · 2 days · ASTRA', detail: 'Cross-disciplinary teams build solutions for student success — from onboarding to alumni connection to wellbeing.', bullets: ['Team up with engineers, designers, and MBAs', 'Budget and dataset support provided', 'Prizes from campus partners'] },
  { id: 'h3', title: 'Future of Talent Hackathon', org: 'Goodwell', location: 'Hybrid', type: 'Product', tags: ['Recruiting', 'AI', 'Product'], meta: 'May 10 · 48 hours · Hybrid', detail: 'Reimagine one part of the hiring process with AI that makes candidates feel more human, not less.', bullets: ['Product + engineering mentors from Goodwell', 'Access to a recruiting-process sandbox', 'Winner pitch at the Goodwell demo day'] },
  { id: 'h4', title: 'Visualizing Work Hackathon', org: 'Frame Systems', location: 'Remote', type: 'Design', tags: ['Data viz', 'Dashboards', 'Teams'], meta: 'May 24 · 36 hours · Remote', detail: 'Build the clearest possible dashboard for a chaotic HR dataset. Clarity wins, not complexity.', bullets: ['A brutally messy but real dataset', 'Design critique sessions', 'Viz library credits for the winners'] },
];

/* ------------------------------ team finder ------------------------------ */
export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm1', name: 'Nora Kim', initials: 'NK', program: 'MBA · Marketing', role: 'Data storyteller', lookingFor: 'HR / product partner for a retention study', skills: ['SQL', 'Tableau', 'User research'], availability: '10 hrs/week', blurb: 'I make numbers feel like stories. Building a portfolio of people-analytics projects and need a partner who can bring the business context.' },
  { id: 'tm2', name: 'Leo Martins', initials: 'LM', program: 'MS · Computer Science', role: 'Builder', lookingFor: 'Marketing lead for a campus-engagement app', skills: ['Python', 'Prototyping', 'Automation'], availability: '15 hrs/week', blurb: 'I prototype fast and ship small things that work. Looking for someone who can take my rough builds and turn them into a story people join.' },
  { id: 'tm3', name: 'Aisha Verma', initials: 'AV', program: 'MBA · Strategy', role: 'Problem framer', lookingFor: 'Data partner for an HR-tech market map', skills: ['Strategy', 'Interviews', 'Excel'], availability: '8 hrs/week', blurb: 'I like starting from a confusing question and finding the frame that makes it answerable. Need a data-savvy teammate to stress-test it.' },
  { id: 'tm4', name: 'Jon Bell', initials: 'JB', program: 'BBA · Design', role: 'Product designer', lookingFor: 'PM and engineer for an onboarding project', skills: ['Figma', 'UX research', 'Design systems'], availability: '12 hrs/week', blurb: 'Design is how I think. I want to work on something with real users — happy to bring the interface if you bring the system.' },
  { id: 'tm5', name: 'Rhea Shah', initials: 'RS', program: 'MS · Analytics', role: 'Data analyst', lookingFor: 'Anyone building with people data', skills: ['Python', 'Statistics', 'Dashboards'], availability: '20 hrs/week', blurb: 'People data is my whole focus — engagement, retention, hiring funnels. Looking for projects with actual datasets and real decisions behind them.' },
];

/* -------------------------- project marketplace -------------------------- */
export const MARKETPLACE: Opportunity[] = [
  { id: 'm1', title: 'Redesign a nonprofit hiring funnel', org: 'CivicWorks', location: 'Remote · 3 weeks', type: 'Consulting', tags: ['Hiring', 'Analysis', 'Recommendation'], meta: '3 weeks · Stipend $500', detail: 'CivicWorks receives 120+ applications per open role but hires slowly. Create a proof-backed recommendation from their last three hiring cycles.', bullets: ['Analyze the anonymized application dataset', 'Interview two hiring managers', 'Deliver a funnel redesign with measurable targets'] },
  { id: 'm2', title: 'Employee listening pulse', org: 'Brightwell', location: 'Remote · 2 weeks', type: 'Research', tags: ['Surveys', 'Engagement', 'Synthesis'], meta: '2 weeks · Stipend $300', detail: 'Design, run, and synthesize a lightweight engagement study for a 40-person startup that has never run one.', bullets: ['Design a 12-question pulse survey', 'Run it with the Brightwell team', 'Write the synthesis the leadership actually reads'] },
  { id: 'm3', title: 'Campus recruiting scorecard', org: 'Harbor & Finch', location: 'Remote · 4 weeks', type: 'Analytics', tags: ['Recruiting', 'Metrics', 'Dashboard'], meta: '4 weeks · Stipend $700', detail: 'Build the scorecard Harbor & Finch uses to judge their campus hiring: source quality, conversion, time-to-accept, and diversity.', bullets: ['Define the metric set with the campus team', 'Build the Excel/BI scorecard', 'Document how to read it in under five minutes'] },
  { id: 'm4', title: 'Manager onboarding journey map', org: 'Northstar Labs', location: 'Remote · 3 weeks', type: 'Research', tags: ['Onboarding', 'Interviews', 'Journey map'], meta: '3 weeks · Stipend $450', detail: 'New managers at Northstar feel lost for the first month. Interview them and map the journey from offer to first win.', bullets: ['Conduct 8–10 manager interviews', 'Build a journey map with pain points', 'Recommend three high-leverage fixes'] },
];

/* ------------------------------- research ------------------------------- */
export const RESEARCH_OPPS: Opportunity[] = [
  { id: 'r1', title: 'The first 90 days of hybrid managers', org: 'ASTRA Org Design Lab', location: 'Campus + remote', type: 'Faculty-led', tags: ['Hybrid work', 'Management', 'Field notes'], meta: 'Semester · Faculty-led', detail: 'What do managers actually do in their first 90 days when half their team is remote? Interview managers, code the patterns, write the field note.', bullets: ['Interview 12 new hybrid managers', 'Code patterns with a faculty researcher', 'Co-author a concise field note'] },
  { id: 'r2', title: 'Skills-based hiring: promises vs practice', org: 'ASTRA Research', location: 'Remote', type: 'Faculty-led', tags: ['Hiring', 'Policy', 'Dataset'], meta: 'Semester · Remote', detail: 'Companies say they hire for skills. Do they? Analyze job descriptions and offer data to test the gap between promise and practice.', bullets: ['Build a small JD corpus with the team', 'Measure skills vs degree mentions', 'Present at the spring research review'] },
  { id: 'r3', title: 'Engagement surveys and quiet quitting', org: 'Goodwell Research', location: 'Remote', type: 'Industry', tags: ['Engagement', 'Surveys', 'Analysis'], meta: '8 weeks · Industry partner', detail: 'Engagement scores are up but attrition is flat. Work with Goodwell data to understand what survey scores actually predict.', bullets: ['Access to a multi-year engagement dataset', 'Pair with a Goodwell people scientist', 'Deliver a short paper + presentation'] },
  { id: 'r4', title: 'What makes mentorship work at scale', org: 'ASTRA Career Lab', location: 'Campus', type: 'Student-led', tags: ['Mentorship', 'Program design', 'Qualitative'], meta: 'Semester · Student-led', detail: 'ASTRA runs thousands of mentor matches a year. Help the Career Lab figure out which matches actually change outcomes.', bullets: ['Study match quality across 200 pairs', 'Run follow-up interviews', 'Recommend changes to the matching algorithm'] },
];

/* ------------------------------ startup hub ------------------------------ */
export const STARTUPS: Opportunity[] = [
  { id: 'st1', title: 'Morrow', org: 'Morrow', location: 'Remote · Series A', type: 'People infrastructure', tags: ['Talent', 'HR tech', 'Growth'], meta: 'Series A · 40 people', detail: 'Morrow builds people infrastructure for modern teams. Join the founding team on how talent systems scale from 40 to 400.', bullets: ['Own the talent ops roadmap with the founders', 'Run hiring loops for the next 20 hires', 'Shape employer brand from the ground up'] },
  { id: 'st2', title: 'Goodwell', org: 'Goodwell', location: 'Hybrid · Seed', type: 'Future of work', tags: ['Manager development', 'Learning', 'Seed'], meta: 'Seed · 12 people', detail: 'Goodwell makes manager development more human. Small team, real product usage, and a lot of room to own outcomes.', bullets: ['Run customer discovery with HR leaders', 'Build the onboarding for new manager cohorts', 'Own one metric end to end'] },
  { id: 'st3', title: 'Cedar House', org: 'Cedar House', location: 'Austin · Seed', type: 'People analytics', tags: ['Analytics', 'Wellbeing', 'Seed'], meta: 'Seed · 15 people', detail: 'Cedar House helps companies notice burnout before it compounds. Early stage, research-heavy, and hungry for people who can analyze and act.', bullets: ['Work with the data team on early signals', 'Translate findings for HR buyers', 'Co-design the pilot program'] },
  { id: 'st4', title: 'Olive & Co.', org: 'Olive & Co.', location: 'Chicago · Seed', type: 'DEI tools', tags: ['DEI', 'Programs', 'Seed'], meta: 'Seed · 18 people', detail: 'Olive & Co. builds tools that make belonging measurable. Join a team turning DEI from a report into a rhythm.', bullets: ['Shape the belonging-survey product', 'Run customer pilots with people teams', 'Draft the go-to-market playbook'] },
];

/* -------------------------------- mentors -------------------------------- */
export type Mentor = {
  id: string;
  name: string;
  initials: string;
  title: string;
  org: string;
  focus: string;
  topics: string[];
  availability: string;
  blurb: string;
};

export const MENTORS: Mentor[] = [
  { id: 'mt1', name: 'Jordan Williams', initials: 'JW', title: 'People Ops Director', org: 'Northstar Labs', focus: 'Early-career HR leaders', topics: ['People ops', 'Career strategy', 'Managing up'], availability: '2 sessions / month', blurb: 'Twelve years turning empathy into operating leverage. I help early HR leaders find the two or three things that actually move a team forward.' },
  { id: 'mt2', name: 'Rina Okafor', initials: 'RO', title: 'VP Talent', org: 'Clarity Labs', focus: 'Interview stories & workforce planning', topics: ['Interviewing', 'Workforce planning', 'Storytelling'], availability: '1 session / month', blurb: 'I read hundreds of candidates a year. The ones who win can name the decision, the work, and the outcome. Let us build that story from your own evidence.' },
  { id: 'mt3', name: 'Mateo Ruiz', initials: 'MR', title: 'HR Business Partner', org: 'Morrow', focus: 'First 90 days in an HRBP seat', topics: ['HRBP', 'Business partnering', 'Onboarding'], availability: '3 sessions / month', blurb: 'I made every mistake available in my first HRBP year so you do not have to. Happy to walk through what your first 90 days should look like.' },
  { id: 'mt4', name: 'Elena Marsh', initials: 'EM', title: 'People Analytics Lead', org: 'Frame Systems', focus: 'Analytics for people teams', topics: ['HR analytics', 'Dashboarding', 'Data storytelling'], availability: '2 sessions / month', blurb: 'Data is how I earn trust in rooms full of operators. Bring a messy question or a half-finished dashboard; we will make it sharper.' },
];

/* -------------------------------- alumni -------------------------------- */
export type Alumni = {
  id: string;
  name: string;
  initials: string;
  program: string;
  year: string;
  company: string;
  path: string;
  shared: string;
};

export const ALUMNI: Alumni[] = [
  { id: 'al1', name: 'Priya Nair', initials: 'PN', program: 'MBA', year: '’22', company: 'Morrow', path: 'MBA → People Partner → Talent lead', shared: '3 shared interests · campus HR association' },
  { id: 'al2', name: 'Darius Cole', initials: 'DC', program: 'MBA', year: '’21', company: 'Latticeworks', path: 'MBA → Recruiting ops → People programs', shared: '1 shared course · Dean’s scholars' },
  { id: 'al3', name: 'Sana Iqbal', initials: 'SI', program: 'MS', year: '’23', company: 'Frame Systems', path: 'MS → Data analyst → People analytics', shared: '2 shared interests · data club' },
  { id: 'al4', name: 'Chris Oyelaran', initials: 'CO', program: 'MBA', year: '’20', company: 'Goodwell', path: 'MBA → L&D → Org development', shared: '1 shared interest · case club' },
];
