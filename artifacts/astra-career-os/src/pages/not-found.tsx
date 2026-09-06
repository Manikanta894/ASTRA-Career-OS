import { Compass, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

const links = [
  { label: 'Student workspace', href: '/student/dashboard', sub: 'Signals, gaps and next best action' },
  { label: 'University command center', href: '/university/dashboard', sub: 'Cohort readiness and placement' },
  { label: 'Recruiter overview', href: '/recruiter/dashboard', sub: 'Talent, pipeline and offers' },
];

export default function NotFound() {
  return (
    <div
      className="grid min-h-screen w-full place-items-center p-6 text-[hsl(38_45%_96%)]"
      style={{
        background:
          'radial-gradient(46rem 30rem at 88% -10%, hsl(32 96% 62% / .14), transparent 55%), radial-gradient(40rem 28rem at -6% 110%, hsl(219 60% 48% / .14), transparent 58%), linear-gradient(168deg, hsl(228 36% 10%) 0%, hsl(226 31% 14%) 48%, hsl(225 29% 17%) 100%)',
      }}
    >
      <div className="w-full max-w-lg text-center">
        <div
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
          style={{ background: 'hsl(32 96% 62% / .14)', border: '1px solid hsl(32 96% 62% / .35)', color: 'hsl(32 96% 62%)' }}
        >
          <Compass size={28} />
        </div>
        <p className="mono mt-6 text-[.66rem] font-bold uppercase tracking-[.22em] text-[hsl(32_96%_62%)]">Off the career map</p>
        <h1 className="display mt-3 text-5xl font-bold tracking-tight">Page not found</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[hsl(38_45%_96%_/_0.62)]">
          This route isn't part of your workspace. Head back to a home base and pick up the signal from there.
        </p>
        <div className="mt-8 space-y-2 text-left">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors"
              style={{ background: 'hsl(227 30% 16% / .6)', border: '1px solid hsl(38 45% 96% / .1)' }}
            >
              <span>
                <span className="block text-sm font-bold">{l.label}</span>
                <span className="block text-xs text-[hsl(38_45%_96%_/_0.55)]">{l.sub}</span>
              </span>
              <ArrowRight size={15} className="shrink-0 text-[hsl(176_62%_62%)] transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
