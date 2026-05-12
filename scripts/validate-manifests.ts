#!/usr/bin/env tsx

import { readFile } from 'fs/promises';

const MANIFESTS = [
  { path: '../.claude-plugin/plugin.json', versionAt: (j: any) => j.version },
  { path: '../.claude-plugin/marketplace.json', versionAt: (j: any) => j.plugins?.[0]?.version },
  { path: '../.codex-plugin/plugin.json', versionAt: (j: any) => j.version },
  { path: '../.agents/plugins/marketplace.json', versionAt: (j: any) => j.plugins?.[0]?.version },
];

const REQUIRED_KEYS = {
  '../.claude-plugin/plugin.json': ['name', 'description', 'version', 'author', 'license'],
  '../.codex-plugin/plugin.json': ['name', 'description', 'version', 'author', 'license', 'skills'],
  '../.claude-plugin/marketplace.json': ['name', 'owner', 'plugins'],
  '../.agents/plugins/marketplace.json': ['name', 'owner', 'plugins'],
} as const;

async function main(): Promise<void> {
  const versions = new Set<string>();
  const errors: string[] = [];

  for (const { path, versionAt } of MANIFESTS) {
    let json: any;
    try {
      const content = await readFile(path, 'utf-8');
      json = JSON.parse(content);
    } catch (err: any) {
      errors.push(`❌ ${path}: failed to parse — ${err.message}`);
      continue;
    }

    for (const key of REQUIRED_KEYS[path as keyof typeof REQUIRED_KEYS]) {
      if (json[key] === undefined) errors.push(`❌ ${path}: missing required key "${key}"`);
    }

    const v = versionAt(json);
    if (!v || typeof v !== 'string') {
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

main().catch((err) => {
  console.error('💥 Validation failed:', err.message);
  process.exit(1);
});
