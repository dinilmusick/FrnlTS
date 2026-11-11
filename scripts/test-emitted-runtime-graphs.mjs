import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const builtins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
const portableExternalImports = new Set([
  '@dinilmusick/gutts/browser',
  'react',
  'react/jsx-runtime',
  'zustand',
  'zustand/vanilla',
  'zod',
]);

const entries = [
  ['root', 'dist/index.js'],
  ['runtime', 'dist/runtime/index.js'],
  ['react', 'dist/react/index.js'],
];

function importsFrom(source) {
  const found = new Set();
  const patterns = [
    /\bimport\s*(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:\*\s+as\s+[\w$]+|\*|\{[^}]*\})\s+from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.add(match[1]);
  }
  return [...found];
}

function resolveLocal(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.js`, `${base}.mjs`, `${base}.cjs`, path.join(base, 'index.js')];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function inspectEntry(label, relativeEntry) {
  const entry = path.resolve(root, relativeEntry);
  assert.ok(fs.existsSync(entry), `Build output missing for ${label}: ${relativeEntry}; run pnpm build first`);
  const visited = new Set();
  const pending = [entry];
  const external = new Set();

  while (pending.length) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    const source = fs.readFileSync(file, 'utf8');

    for (const specifier of importsFrom(source)) {
      assert.ok(!builtins.has(specifier), `${label} emitted graph imports Node builtin "${specifier}" from ${path.relative(root, file)}`);
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const resolved = resolveLocal(file, specifier);
        assert.ok(resolved, `Unresolved emitted relative import "${specifier}" from ${path.relative(root, file)}`);
        pending.push(resolved);
        continue;
      }
      external.add(specifier);
      assert.ok(
        portableExternalImports.has(specifier),
        `${label} emitted graph contains an unapproved external dependency "${specifier}" in ${path.relative(root, file)}`,
      );
      assert.ok(
        !specifier.startsWith('@ultrst-armada/frnlts/cli') &&
        !specifier.startsWith('@ultrst-armada/frnlts/validate') &&
        !specifier.startsWith('typescript') &&
        !specifier.startsWith('tsup'),
        `${label} runtime graph must not include CLI/build/validation tooling: ${specifier}`,
      );
    }
  }

  return {
    entry: relativeEntry,
    emittedModules: visited.size,
    externalImports: [...external].sort(),
  };
}

assert.equal(packageJson.name, '@ultrst-armada/frnlts');
const results = entries.map(([label, entry]) => inspectEntry(label, entry));

const semanticInput = fs.readFileSync(path.join(root, 'src/runtime/semantic-input.ts'), 'utf8');
assert.match(
  semanticInput,
  /from\s+['"]@dinilmusick\/gutts\/browser['"]/,
  'Semantic input must use GutTS browser exports, never the Node-oriented package root',
);
assert.doesNotMatch(
  semanticInput,
  /from\s+['"]@dinilmusick\/gutts['"]/,
  'Semantic input must not import the GutTS package root',
);

console.log(JSON.stringify({
  package: packageJson.name,
  checks: results,
  policy: 'Emitted root/runtime/React graphs contain only portable external imports and no Node builtins or tooling edges.',
}, null, 2));
