// Print the CHANGELOG.md section for a version (default: the version in package.json).
// Used by the deploy workflow to write the GitHub Release notes.
//
//   node scripts/release-notes.mjs [version]
import { readFileSync } from 'node:fs';
import { getReleaseNotes } from './lib/release.mjs';

const version = process.argv[2] ?? JSON.parse(readFileSync('package.json', 'utf8')).version;
const notes = getReleaseNotes(readFileSync('CHANGELOG.md', 'utf8'), version);

if (!notes) {
  console.error(`release-notes: CHANGELOG.md has no section (or an empty one) for ${version}`);
  process.exit(1);
}
console.log(notes);
