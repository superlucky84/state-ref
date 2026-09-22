// Declaration files ship inside `"type": "module"` packages, so TypeScript
// resolves them as ESM under node16/nodenext. That requires explicit relative
// extensions, and a CommonJS consumer needs a parallel .d.cts tree.
import { readdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const SPECIFIER = /(\sfrom\s*|\simport\s*\(\s*)(['"])(\.\.?\/[^'"]*)\2/g;

async function declarations(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await declarations(full)));
    else if (entry.name.endsWith('.d.ts')) found.push(full);
  }
  return found;
}

/** Resolve a bare relative specifier to the file it actually names. */
function target(file, specifier) {
  const base = resolve(dirname(file), specifier);
  if (existsSync(`${base}.d.ts`)) return specifier;
  if (existsSync(join(base, 'index.d.ts')))
    return `${specifier.replace(/\/$/, '')}/index`;
  return null;
}

function rewrite(file, text, extension) {
  return text.replace(SPECIFIER, (match, head, quote, specifier) => {
    if (/\.(js|cjs|mjs|json)$/.test(specifier)) return match;
    const resolved = target(file, specifier);
    if (!resolved) return match;
    return `${head}${quote}${resolved}${extension}${quote}`;
  });
}

/** Only a package that advertises `require` needs a CommonJS declaration tree. */
function servesRequire(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(
    ([key, sub]) => key === 'require' || servesRequire(sub)
  );
}

const packages = process.argv.slice(2);
let patched = 0;
let copied = 0;
let removed = 0;
for (const pkg of packages) {
  const dist = resolve(pkg, 'dist');
  if (!existsSync(dist) || !(await stat(dist)).isDirectory()) continue;
  const manifest = JSON.parse(await readFile(join(pkg, 'package.json'), 'utf8'));
  const dual = servesRequire(manifest.exports);
  for (const file of await declarations(dist)) {
    const text = await readFile(file, 'utf8');
    const esm = rewrite(file, text, '.js');
    if (esm !== text) {
      await writeFile(file, esm);
      patched += 1;
    }
    const cts = file.replace(/\.d\.ts$/, '.d.cts');
    if (dual) {
      await writeFile(cts, rewrite(file, text, '.cjs'));
      copied += 1;
    } else if (existsSync(cts)) {
      await rm(cts);
      removed += 1;
    }
  }
}
console.log(
  `declarations: ${patched} rewritten for node16 ESM, ${copied} .d.cts written` +
    (removed ? `, ${removed} stale .d.cts removed` : '')
);
