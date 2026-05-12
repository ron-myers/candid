#!/usr/bin/env tsx

import { readFile } from 'fs/promises';

type Manifest = {
  version?: unknown;
  plugins?: Array<{ version?: unknown }>;
  [key: string]: unknown;
};

type ManifestSpec = {
  path: string;
  versionAt: (j: Manifest) => unknown;
};

const MANIFESTS: ManifestSpec[] = [
  { path: '../.claude-plugin/plugin.json', versionAt: (j) => j.version },
  { path: '../.claude-plugin/marketplace.json', versionAt: (j) => j.plugins?.[0]?.version },
  { path: '../.codex-plugin/plugin.json', versionAt: (j) => j.version },
  { path: '../.agents/plugins/marketplace.json', versionAt: (j) => j.plugins?.[0]?.version },
];

const REQUIRED_KEYS: Record<string, readonly string[]> = {
  '../.claude-plugin/plugin.json': ['name', 'description', 'version', 'author', 'license'],
  '../.codex-plugin/plugin.json': ['name', 'description', 'version', 'author', 'license', 'skills'],
  '../.claude-plugin/marketplace.json': ['name', 'owner', 'plugins'],
  '../.agents/plugins/marketplace.json': ['name', 'owner', 'plugins'],
};

async function main(): Promise<void> {
  const versions = new Set<string>();
  const errors: string[] = [];

  for (const { path, versionAt } of MANIFESTS) {
    let json: Manifest;
    try {
      const content = await readFile(path, 'utf-8');
      json = JSON.parse(content) as Manifest;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`❌ ${path}: failed to parse — ${message}`);
      continue;
    }

    for (const key of REQUIRED_KEYS[path]) {
      if (json[key] === undefined) errors.push(`❌ ${path}: missing required key "${key}"`);
    }

    const v = versionAt(json);
    if (typeof v !== 'string' || v.length === 0) {
      errors.push(`❌ ${path}: missing or invalid version`);
    } else {
      versions.add(v);
      console.log(`✅ ${path} — version ${v}`);
    }
  }

  if (versions.size > 1) {
    errors.push(`❌ Version mismatch across manifests: ${[...versions].join(', ')}`);
  }

  if (errors.length) {
    console.error('\n' + errors.join('\n'));
    process.exit(1);
  }

  console.log(`\n✨ All 4 manifests valid and in lockstep at v${[...versions][0]}.`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('💥 Validation failed:', message);
  process.exit(1);
});
