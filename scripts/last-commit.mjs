import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = join(__dirname, '..');

let date;
try {
  date = execSync(`git -C "${projectDir}" log -1 --format=%cd --date=short`, { encoding: 'utf-8' }).trim();
} catch {
  try {
    date = execSync('git log -1 --format=%cd --date=short', { encoding: 'utf-8' }).trim();
  } catch {
    date = new Date().toISOString().slice(0, 10);
  }
}
const data = { lastCommitDate: date };
const outDir = join(projectDir, 'src', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'last-commit.json'), JSON.stringify(data));
console.log(`Last commit date: ${date}`);
