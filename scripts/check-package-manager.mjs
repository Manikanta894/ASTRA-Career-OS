// Cross-platform replacement for the previous `sh -c` preinstall hook.
// - Requires the package manager to be pnpm (supply-chain / lockfile safety).
// - Removes stray npm/yarn lockfiles that could confuse resolution.
import { existsSync, unlinkSync } from 'node:fs';
import process from 'node:process';

const agent = process.env.npm_config_user_agent || '';

if (!agent.startsWith('pnpm/')) {
  console.error('Use pnpm instead');
  process.exit(1);
}

for (const lockfile of ['package-lock.json', 'yarn.lock']) {
  if (existsSync(lockfile)) {
    unlinkSync(lockfile);
    console.log(`Removed stray ${lockfile}`);
  }
}