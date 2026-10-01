const fs = require('fs');
const path = require('path');

const prototypesDir = path.join(__dirname, '..', 'prototypes');

const isDir = (p) => fs.statSync(p).isDirectory();

const compareVersions = (a, b) => {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const prettify = (slug) =>
  slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const jsonPath = path.join(__dirname, '..', 'prototypes.json');

let existing = [];
try { existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) {}
const oldChanges = (slug, version) => {
  const proto = existing.find(p => p.slug === slug);
  const ver = proto && proto.versions.find(v => v.version === version);
  return (ver && ver.changes) || [];
};

const readChangesFile = (versionPath) => {
  const file = path.join(versionPath, 'changes.txt');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*[-*]\s+/, '').trim())
    .filter(Boolean);
};

const prototypes = fs.readdirSync(prototypesDir)
  .filter(name => isDir(path.join(prototypesDir, name)))
  .sort()
  .map(slug => {
    const prototypePath = path.join(prototypesDir, slug);
    const versions = fs.readdirSync(prototypePath)
      .filter(name => isDir(path.join(prototypePath, name)) && /^v\d/.test(name))
      .sort(compareVersions);

    return {
      name: prettify(slug),
      slug,
      versions: versions.map((v, i) => ({
        version: v,
        tag: i === versions.length - 1 ? 'latest' : '',
        changes: readChangesFile(path.join(prototypePath, v)) || oldChanges(slug, v)
      }))
    };
  })
  .filter(g => g.versions.length > 0);

fs.writeFileSync(
  jsonPath,
  JSON.stringify(prototypes, null, 2) + '\n'
);