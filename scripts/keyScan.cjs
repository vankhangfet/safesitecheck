/**
 * Looks for key-shaped text (NFR2.6). It reports where something was found, never the text
 * itself, so a real key could not leak into a log through this check.
 *
 * Run it with: npm run check:key-scan
 */
const fs = require('fs');
const path = require('path');

const KEY_PATTERNS = [
  // A bearer token written out in a file.
  { name: 'bearer-token', regex: /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/ },
  // Prefixed API keys such as sk-..., ts_..., jev-...
  { name: 'prefixed-key', regex: /\b(?:sk|pk|ts|tsk|jev)[-_][A-Za-z0-9_-]{20,}/i },
  // A long unbroken token that mixes letters and digits.
  {
    name: 'long-token',
    regex: /\b(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{40,}\b/,
  },
];

const TEXT_EXTENSIONS = new Set([
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.json',
  '.html',
  '.css',
  '.map',
  '.txt',
  '.log',
  '.md',
]);
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git']);

/** Returns one entry per line that holds key-shaped text: { line, pattern }. */
function findKeyShapedText(text) {
  const findings = [];
  text.split(/\r?\n/).forEach((lineText, index) => {
    for (const { name, regex } of KEY_PATTERNS) {
      if (regex.test(lineText)) findings.push({ line: index + 1, pattern: name });
    }
  });
  return findings;
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full));
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

/** Scans the build, the source (which holds the tests), scripts, test output and log files. */
function scanProject(root) {
  const targets = ['dist', 'src', 'scripts', 'coverage'].flatMap((name) =>
    listFiles(path.join(root, name)),
  );
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.log')) targets.push(path.join(root, entry.name));
  }
  const results = [];
  for (const file of targets) {
    const findings = findKeyShapedText(fs.readFileSync(file, 'utf8'));
    if (findings.length > 0) results.push({ file: path.relative(root, file), findings });
  }
  return { scanned: targets.length, results };
}

module.exports = { findKeyShapedText, scanProject, KEY_PATTERNS };

if (require.main === module) {
  const { scanned, results } = scanProject(path.resolve(__dirname, '..'));
  if (results.length > 0) {
    for (const { file, findings } of results) {
      for (const { line, pattern } of findings)
        console.error(`key-shaped text (${pattern}): ${file}:${line}`);
    }
    console.error('Key scan FAILED. Remove the text; it is not printed here on purpose.');
    process.exit(1);
  }
  console.log(`Key scan passed: ${scanned} files checked, nothing key-shaped found.`);
}
