/**
 * Builds the extension into dist/ for Edge and Chrome. One code base, four bundles:
 * background, content (page side), popup and options.
 *
 * Run it with: npm run build
 */
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { disallowedContentInputs, manifestProblems } = require('./checkBuild.cjs');
const { renderIcon } = require('./icons.cjs');
const { scanProject } = require('./keyScan.cjs');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const ENTRIES = [
  { name: 'background', input: 'src/background/background.ts' },
  { name: 'content', input: 'src/content/content.ts' },
  { name: 'popup', input: 'src/popup/popup.ts' },
  { name: 'options', input: 'src/options/options.ts' },
];

const STATIC_FILES = [
  ['manifest.json', 'manifest.json'],
  ['src/popup/popup.html', 'popup.html'],
  ['src/popup/popup.css', 'popup.css'],
  ['src/options/options.html', 'options.html'],
  ['src/options/options.css', 'options.css'],
];

const ICON_SIZES = [16, 32, 48, 128];

async function bundle(entry) {
  const result = await esbuild.build({
    entryPoints: [path.join(root, entry.input)],
    outfile: path.join(dist, `${entry.name}.js`),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome110'],
    minify: false,
    sourcemap: false,
    legalComments: 'none',
    metafile: true,
    logLevel: 'silent',
    tsconfig: path.join(root, 'tsconfig.json'),
  });
  return Object.keys(result.metafile.inputs);
}

async function main() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });

  const problems = [];
  for (const entry of ENTRIES) {
    const inputs = await bundle(entry);
    if (entry.name === 'content') {
      const extra = disallowedContentInputs(inputs);
      if (extra.length > 0)
        problems.push(`the page-side bundle holds code it must not: ${extra.join(', ')}`);
    }
    console.log(`built dist/${entry.name}.js from ${inputs.length} source files`);
  }

  for (const [from, to] of STATIC_FILES)
    fs.copyFileSync(path.join(root, from), path.join(dist, to));
  for (const size of ICON_SIZES) {
    fs.writeFileSync(path.join(dist, 'icons', `icon${size}.png`), renderIcon(size));
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8'));
  problems.push(...manifestProblems(manifest));

  const { results } = scanProject(root);
  for (const { file } of results.filter((result) => result.file.startsWith('dist'))) {
    problems.push(`key-shaped text in ${file}`);
  }

  if (problems.length > 0) {
    for (const problem of problems) console.error(`BUILD CHECK FAILED: ${problem}`);
    process.exit(1);
  }
  console.log('build checks passed: page-side bundle, manifest permissions, key scan of dist/');
}

main().catch((error) => {
  console.error(`build failed: ${error.message}`);
  process.exit(1);
});
