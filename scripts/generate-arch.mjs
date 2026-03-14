#!/usr/bin/env node
/**
 * scripts/generate-arch.mjs
 *
 * Statically analyses the CampusPulse source tree and produces
 * docs/architecture.md with four sections:
 *
 *   1. Module graph       — NestJS module imports
 *   2. Dependency graph   — class-level injection wiring
 *   3. Layer diagram      — every component in its architectural layer
 *   4. Port → implementation table
 *
 * No runtime bootstrapping. No database connection. Runs anywhere with Node 18+.
 *
 * Usage:  node scripts/generate-arch.mjs
 *         pnpm arch
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, '..');
const SRC     = join(ROOT, 'src');
const OUT_DIR = join(ROOT, 'docs');
const OUT     = join(OUT_DIR, 'architecture.md');

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Walk a directory tree and return all non-spec .ts files. */
function collectTs(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectTs(full, acc);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts') && !entry.endsWith('.d.ts')) {
      acc.push(full);
    }
  }
  return acc;
}

/** Produce a stable Mermaid node id from any string. */
const nid = (name) => name.replace(/[^a-zA-Z0-9]/g, '_');

/** Render a Mermaid node with a consistent «if» label for interfaces. */
const ifNode  = (name) => `${nid(name)}(["«if» ${name}"])`;
const clsNode = (name) => `${nid(name)}["${name}"]`;

// ─── Layer classification ─────────────────────────────────────────────────────

function classifyLayer(rel) {
  if (rel.includes('/ports/'))         return 'port';
  if (rel.includes('/interfaces/'))    return 'port';
  if (rel.includes('/repositories/'))  return 'infrastructure';
  if (rel.includes('/domain/'))        return 'domain';
  if (rel.includes('/dto/'))           return 'http';
  if (rel.includes('/mappers/'))       return 'application';
  if (rel.includes('/filters/'))       return 'http';
  if (rel.includes('/rules/'))         return 'application';
  if (rel.includes('/helpers/'))       return 'application';
  if (rel.includes('.controller.ts'))  return 'http';
  if (rel.includes('.service.ts'))     return 'application';
  if (rel.includes('.module.ts'))      return 'module';
  return 'other';
}

// ─── File parser ──────────────────────────────────────────────────────────────

function parseFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const rel = relative(SRC, filePath).replace(/\\/g, '/');
  const parts = rel.split('/');
  const module = parts.length > 1 ? parts[0] : 'root';
  const layer  = classifyLayer(rel);

  // Strip comments so TSDoc @example blocks don't produce phantom declarations
  const src = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')  // block comments (covers /** ... */)
    .replace(/\/\/.*/g, '');           // line comments

  const isInjectable = src.includes('@Injectable()');
  const isController  = src.includes('@Controller(');
  const isModule      = src.includes('@Module(');

  // ── Class declaration ──────────────────────────────────────────────────────
  const classMatch = src.match(
    /export\s+(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+([\w,\s<>]+))?/
  );
  const className       = classMatch?.[1] ?? null;
  const implementsList  = (classMatch?.[2] ?? '')
    .split(',')
    .map(s => s.replace(/<.*>/, '').trim())   // strip generics
    .filter(Boolean);

  // ── Interface declaration ──────────────────────────────────────────────────
  // Capture the first exported interface name in this file.
  const ifaceMatch    = src.match(/^export\s+interface\s+(\w+)/m);
  const rawIfaceName  = ifaceMatch?.[1] ?? null;

  // Only surfaces as a node when it is a meaningful architectural type:
  //   port layer  → interface names starting with I, or SimilarityRule
  //   domain layer→ any exported interface
  const isPortIface   = rawIfaceName && layer === 'port' &&
    (rawIfaceName.startsWith('I') || rawIfaceName === 'SimilarityRule');
  const isDomainIface = rawIfaceName && layer === 'domain';

  const interfaceName = (isPortIface || isDomainIface) ? rawIfaceName : null;

  // ── Injection token constants ──────────────────────────────────────────────
  // Matches:  export const EVENT_READER = 'EVENT_READER' as const;
  const tokenRe = /export\s+const\s+(\w+)\s*=\s*['"]\w+['"]\s+as\s+const/g;
  const tokens  = [...src.matchAll(tokenRe)].map(m => m[1]);

  // ── Constructor dependencies ───────────────────────────────────────────────
  const deps = [];
  const PRIMITIVES = new Set([
    'string', 'number', 'boolean', 'Logger',
    'EntityManager', 'EntityRepository',
  ]);

  // @Inject(TOKEN) + private readonly field: Type
  const injectRe = /@Inject\(['"]?(\w+)['"]?\)[\s\S]{0,120}?private\s+readonly\s+\w+:\s*(\w+)/g;
  for (const m of src.matchAll(injectRe)) {
    deps.push({ via: m[1], type: m[2] });
  }

  // Direct class injection (private readonly field: ClassName)
  const directRe = /private\s+readonly\s+\w+:\s*(\w+)/g;
  for (const m of src.matchAll(directRe)) {
    const type = m[1];
    if (PRIMITIVES.has(type)) continue;
    if (deps.some(d => d.type === type || d.via === type)) continue;
    deps.push({ via: null, type });
  }

  // ── Module imports / exports ───────────────────────────────────────────────
  let moduleImports = [];
  let moduleExports = [];

  if (isModule) {
    const SKIP_MODULES = new Set(['MikroOrmModule', 'ConfigModule']);

    const impBlock = src.match(/imports\s*:\s*\[([^\]]*)\]/s)?.[1] ?? '';
    moduleImports  = [...impBlock.matchAll(/(\w+Module)/g)]
      .map(m => m[1])
      .filter(n => !SKIP_MODULES.has(n));

    const expBlock = src.match(/exports\s*:\s*\[([^\]]*)\]/s)?.[1] ?? '';
    moduleExports  = [...expBlock.matchAll(/(\w+)/g)]
      .map(m => m[1]);
  }

  // Skip files that contribute nothing to the diagrams
  if (!className && !interfaceName && tokens.length === 0) return null;

  return {
    file: rel, module, layer,
    className, implementsList,
    interfaceName,
    isInjectable, isController, isModule,
    tokens, deps,
    moduleImports, moduleExports,
  };
}

// ─── Parse all source files ───────────────────────────────────────────────────

const parsed   = collectTs(SRC).map(parseFile).filter(Boolean);
const classes  = parsed.filter(p => p.className);
const modules  = parsed.filter(p => p.isModule);

// All surfaced interfaces (port + domain)
const allIfaces     = parsed.filter(p => p.interfaceName);
// Port-layer interfaces only (for the dep graph ports subgraph)
const portIfaces    = allIfaces.filter(p => p.layer === 'port');
// Domain-layer interfaces only
const domainIfaces  = allIfaces.filter(p => p.layer === 'domain');

// className → record lookup
const byName = Object.fromEntries(classes.map(p => [p.className, p]));

// ─── Diagram 1: Module Graph ──────────────────────────────────────────────────

function buildModuleGraph() {
  const L = [
    'graph TD',
    '  %% NestJS module imports — framework modules omitted for clarity',
    '',
  ];

  for (const m of modules) {
    const shape = m.className === 'AppModule'
      ? `([${m.className}])`
      : `[${m.className}]`;
    L.push(`  ${nid(m.className)}${shape}`);
  }
  L.push('');

  for (const m of modules) {
    for (const imp of m.moduleImports) {
      L.push(`  ${nid(m.className)} -->|imports| ${nid(imp)}`);
    }
  }

  L.push('');
  L.push('  classDef root    fill:#1a1a2e,stroke:#e94560,color:#fff,font-weight:bold');
  L.push('  classDef feature fill:#16213e,stroke:#0f3460,color:#e0e0e0');
  L.push(`  class ${nid('AppModule')} root`);
  for (const m of modules) {
    if (m.className !== 'AppModule') L.push(`  class ${nid(m.className)} feature`);
  }

  return L.join('\n');
}

// ─── Diagram 2: Dependency Graph ─────────────────────────────────────────────

function buildDependencyGraph() {
  const L = [
    'graph LR',
    '  %% Class-level dependency injection',
    '  %% Solid arrow → direct dependency    Dashed arrow -.-> via port token',
    '',
  ];

  // One subgraph per NestJS module, containing its injectable/controller classes
  const injectable = classes.filter(p => p.isInjectable || p.isController);
  const grouped    = {};
  for (const p of injectable) (grouped[p.module] ??= []).push(p);

  for (const [mod, items] of Object.entries(grouped)) {
    L.push(`  subgraph ${nid(mod)} ["${mod}"]`);
    for (const item of items) L.push(`    ${clsNode(item.className)}`);
    L.push('  end');
    L.push('');
  }

  // Edges — only draw when the target is a known class
  for (const p of injectable) {
    for (const dep of p.deps) {
      if (!byName[dep.type]) continue;
      const arrow = dep.via ? '-.->|port|' : '-->';
      L.push(`  ${nid(p.className)} ${arrow} ${nid(dep.type)}`);
    }
  }

  // Port interface subgraph — shown as reference nodes (no edges needed;
  // the token labels on dashed arrows already convey the relationship)
  L.push('');
  L.push('  subgraph ports_sg ["port interfaces"]');
  for (const p of portIfaces) L.push(`    ${ifNode(p.interfaceName)}`);
  L.push('  end');

  L.push('');
  L.push('  classDef ctrl  fill:#0f3460,stroke:#e94560,color:#fff');
  L.push('  classDef svc   fill:#16213e,stroke:#533483,color:#e0e0e0');
  L.push('  classDef infra fill:#1a1a2e,stroke:#2196f3,color:#b0bec5');
  L.push('  classDef port  fill:none,stroke:#78909c,color:#90a4ae,stroke-dasharray:5 5');

  for (const p of injectable) {
    const cls = p.isController ? 'ctrl'
      : p.layer === 'infrastructure' ? 'infra'
      : 'svc';
    L.push(`  class ${nid(p.className)} ${cls}`);
  }
  for (const p of portIfaces) L.push(`  class ${nid(p.interfaceName)} port`);

  return L.join('\n');
}

// ─── Diagram 3: Layer Diagram ─────────────────────────────────────────────────

function buildLayerDiagram() {
  const LAYER_ORDER  = ['http', 'application', 'port', 'domain', 'infrastructure'];
  const LAYER_LABELS = {
    http:           'HTTP Layer · Controllers · DTOs · Filters',
    application:    'Application Layer · Services · Mappers · Rules',
    port:           'Port Layer · Interfaces · Tokens',
    domain:         'Domain Layer · Types · Errors',
    infrastructure: 'Infrastructure Layer · Repositories · ORM',
  };
  const LAYER_CLS    = {
    http: 'http', application: 'app', port: 'port', domain: 'domain', infrastructure: 'infra',
  };

  const L = [
    'graph TB',
    '  %% Layers — arrows show the only allowed dependency direction',
    '',
  ];

  // Collect unique component names per layer (class or interface, no duplicates)
  const emitted = new Set();

  for (const layer of LAYER_ORDER) {
    const items = [];

    // Classes in this layer
    for (const p of classes.filter(q => q.layer === layer)) {
      if (emitted.has(p.className)) continue;
      emitted.add(p.className);
      items.push({ name: p.className, isIface: false });
    }

    // Interfaces in this layer (port-layer and domain-layer)
    for (const p of allIfaces.filter(q => q.layer === layer)) {
      if (emitted.has(p.interfaceName)) continue;
      emitted.add(p.interfaceName);
      items.push({ name: p.interfaceName, isIface: true });
    }

    if (!items.length) continue;

    L.push(`  subgraph ${nid(layer)} ["${LAYER_LABELS[layer]}"]`);
    for (const item of items) {
      L.push(`    ${item.isIface ? ifNode(item.name) : clsNode(item.name)}`);
    }
    L.push('  end');
    L.push('');
  }

  // Inter-layer dependency arrows (downward only)
  L.push('  http          --> application');
  L.push('  application   --> port');
  L.push('  port          --> domain');
  L.push('  infrastructure --> port');

  L.push('');
  L.push('  classDef http   fill:#0d47a1,stroke:#1565c0,color:#e3f2fd');
  L.push('  classDef app    fill:#1b5e20,stroke:#2e7d32,color:#e8f5e9');
  L.push('  classDef port   fill:#4a148c,stroke:#6a1b9a,color:#f3e5f5');
  L.push('  classDef domain fill:#e65100,stroke:#ef6c00,color:#fff3e0');
  L.push('  classDef infra  fill:#37474f,stroke:#455a64,color:#eceff1');

  // Apply classes — iterate layer_order to ensure correct class is used
  const classified = new Set();
  for (const layer of LAYER_ORDER) {
    const cls = LAYER_CLS[layer];

    for (const p of classes.filter(q => q.layer === layer)) {
      if (classified.has(p.className)) continue;
      classified.add(p.className);
      L.push(`  class ${nid(p.className)} ${cls}`);
    }
    for (const p of allIfaces.filter(q => q.layer === layer)) {
      if (classified.has(p.interfaceName)) continue;
      classified.add(p.interfaceName);
      L.push(`  class ${nid(p.interfaceName)} ${cls}`);
    }
  }

  return L.join('\n');
}

// ─── Section 4: Port → Implementation table ───────────────────────────────────

function buildPortTable() {
  const rows = [];

  for (const p of classes) {
    for (const iface of p.implementsList) {
      const portFile = portIfaces.find(x => x.interfaceName === iface);
      if (!portFile) continue;

      // Token is declared in the same file as the interface, by convention
      const token = portFile.tokens[0] ?? '—';
      rows.push({ interface: iface, token, implementation: p.className, module: p.module });
    }
  }

  if (!rows.length) return '_No port implementations detected._';

  return [
    '| Port Interface | Injection Token | Implementation | Module |',
    '|---------------|----------------|---------------|--------|',
    ...rows.map(r =>
      `| \`${r.interface}\` | \`${r.token}\` | \`${r.implementation}\` | \`${r.module}\` |`
    ),
  ].join('\n');
}

// ─── Assemble and write the document ─────────────────────────────────────────

const doc = `# CampusPulse — Architecture

> Auto-generated by \`scripts/generate-arch.mjs\` — do not edit by hand.
> Regenerate after any structural change: \`pnpm arch\`

---

## 1. Module Graph

NestJS module imports. Framework modules (ConfigModule, MikroOrmModule) are omitted.

\`\`\`mermaid
${buildModuleGraph()}
\`\`\`

---

## 2. Dependency Injection Graph

Classes grouped by module. **Solid arrows** are direct class dependencies.
**Dashed arrows** are dependencies injected via a port token.

\`\`\`mermaid
${buildDependencyGraph()}
\`\`\`

---

## 3. Layer Diagram

Every component placed in its architectural layer.
Arrows show the only allowed dependency direction — no layer may depend on a layer above it.

\`\`\`mermaid
${buildLayerDiagram()}
\`\`\`

---

## 4. Port → Implementation Map

${buildPortTable()}

---

## Layer Rules

| Layer | Contains | May depend on |
|-------|----------|---------------|
| **HTTP** | Controllers, DTOs, Filters | Application, Domain, \`@common\` |
| **Application** | Services, Mappers, Rules | Domain, Ports, \`@common\` |
| **Port** | Interfaces, Tokens | Domain, \`@common\` |
| **Domain** | Types, Errors | \`@common\` only |
| **Infrastructure** | Repositories, ORM adapters | Domain, Ports |

---

_Generated: ${new Date().toISOString()}_
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, doc, 'utf8');

console.log('✓  docs/architecture.md written');
console.log(`   Modules parsed:       ${modules.length}`);
console.log(`   Classes parsed:       ${classes.length}`);
console.log(`   Port interfaces:      ${portIfaces.length}`);
console.log(`   Domain interfaces:    ${domainIfaces.length}`);
console.log(`   Port implementations: ${classes.filter(p => p.implementsList.some(i => portIfaces.find(x => x.interfaceName === i))).length}`);
