// Builds the whole website into dist/: the customer & partner app at / and the owner panel (../admin) at /admin.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_DIR = path.resolve(APP_DIR, '../admin');
const DIST = path.join(APP_DIR, 'dist');

// One backend for both apps: the admin app falls back to the Expo app's API URL
const env = { ...process.env };
if (!env.VITE_API_URL && env.EXPO_PUBLIC_API_URL) env.VITE_API_URL = env.EXPO_PUBLIC_API_URL;

const run = (cmd, cwd) => {
  console.log(`\n> ${cmd}  (${path.relative(APP_DIR, cwd) || '.'})`);
  execSync(cmd, { cwd, env, stdio: 'inherit' });
};

fs.rmSync(DIST, { recursive: true, force: true });
run('npx expo export --platform web --output-dir dist', APP_DIR);

if (!fs.existsSync(path.join(ADMIN_DIR, 'node_modules'))) run('npm ci --include=dev', ADMIN_DIR);
run('npm run build', ADMIN_DIR);

fs.cpSync(path.join(ADMIN_DIR, 'dist'), path.join(DIST, 'admin'), { recursive: true });
console.log('\nWebsite ready in dist/ (owner panel in dist/admin)');
