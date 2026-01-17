#!/usr/bin/env tsx

import { readFile, writeFile } from 'fs/promises';
import { execSync } from 'child_process';
import { join } from 'path';

type BumpType = 'major' | 'minor' | 'patch';

const PLUGIN_JSON_PATH = '../.claude-plugin/plugin.json';
const MARKETPLACE_JSON_PATH = '../.claude-plugin/marketplace.json';
const CHANGELOG_PATH = '../CHANGELOG.md';
const TARGET_BRANCH = 'stable';

/**
 * Execute a shell command and return the output
 */
function exec(command: string, errorMessage?: string): string {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (error) {
    if (errorMessage) {
      console.error(`❌ ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Check if git working directory is clean
 */
function checkGitClean(): void {
  const status = exec('git status --porcelain');
  if (status) {
    console.error('❌ Git working directory is not clean. Please commit or stash your changes first.');
    process.exit(1);
  }
}

/**
 * Read the current version from plugin.json
 */
async function readCurrentVersion(): Promise<string> {
  try {
    const content = await readFile(PLUGIN_JSON_PATH, 'utf-8');
    const json = JSON.parse(content);

    if (!json.version || typeof json.version !== 'string') {
      throw new Error('Invalid version field in plugin.json');
    }

    return json.version;
  } catch (error) {
    console.error(`❌ Failed to read current version from ${PLUGIN_JSON_PATH}`);
    throw error;
  }
}

/**
 * Calculate the new version based on bump type
 */
function calculateNewVersion(current: string, bump: BumpType): string {
  const versionPattern = /^(\d+)\.(\d+)\.(\d+)$/;
  const match = current.match(versionPattern);

  if (!match) {
    throw new Error(`Invalid version format: ${current}. Expected semantic version (e.g., 1.2.0)`);
  }

  let [, major, minor, patch] = match.map(Number);

  switch (bump) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'patch':
      patch++;
      break;
  }

  return `${major}.${minor}.${patch}`;
}

/**
 * Update version in plugin.json
 */
async function updatePluginJson(newVersion: string): Promise<void> {
  try {
    const content = await readFile(PLUGIN_JSON_PATH, 'utf-8');
    const json = JSON.parse(content);
    json.version = newVersion;

    // Write with 2-space indentation to match existing format
    await writeFile(PLUGIN_JSON_PATH, JSON.stringify(json, null, 2) + '\n');
    console.log(`✅ Updated ${PLUGIN_JSON_PATH}`);
  } catch (error) {
    console.error(`❌ Failed to update ${PLUGIN_JSON_PATH}`);
    throw error;
  }
}

/**
 * Update version in marketplace.json
 */
async function updateMarketplaceJson(newVersion: string): Promise<void> {
  try {
    const content = await readFile(MARKETPLACE_JSON_PATH, 'utf-8');
    const json = JSON.parse(content);

    if (!json.plugins || !Array.isArray(json.plugins) || json.plugins.length === 0) {
      throw new Error('Invalid marketplace.json structure: missing plugins array');
    }

    json.plugins[0].version = newVersion;

    // Write with 2-space indentation to match existing format
    await writeFile(MARKETPLACE_JSON_PATH, JSON.stringify(json, null, 2) + '\n');
    console.log(`✅ Updated ${MARKETPLACE_JSON_PATH}`);
  } catch (error) {
    console.error(`❌ Failed to update ${MARKETPLACE_JSON_PATH}`);
    throw error;
  }
}

/**
 * Update CHANGELOG.md with new version header
 */
async function updateChangelog(newVersion: string): Promise<void> {
  try {
    const content = await readFile(CHANGELOG_PATH, 'utf-8');
    const lines = content.split('\n');

    // Find the line after the intro (after line 7, which is "## [1.2.0] - 2026-01-17")
    // We want to insert the new version header before the first existing version header
    const versionHeaderPattern = /^## \[\d+\.\d+\.\d+\]/;
    const firstVersionIndex = lines.findIndex((line, index) =>
      index >= 7 && versionHeaderPattern.test(line)
    );

    if (firstVersionIndex === -1) {
      throw new Error('Could not find existing version header in CHANGELOG.md');
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Create new version section
    const newSection = [
      `## [${newVersion}] - ${today}`,
      '',
      '### Added',
      '',
      '### Changed',
      '',
      '### Fixed',
      '',
    ];

    // Insert new section before the first existing version
    lines.splice(firstVersionIndex, 0, ...newSection);

    await writeFile(CHANGELOG_PATH, lines.join('\n'));
    console.log(`✅ Updated ${CHANGELOG_PATH}`);
  } catch (error) {
    console.error(`❌ Failed to update ${CHANGELOG_PATH}`);
    throw error;
  }
}

/**
 * Create git commit and tag
 */
function gitCommitAndTag(version: string): void {
  try {
    // Stage the updated files
    exec(`git add ${PLUGIN_JSON_PATH} ${MARKETPLACE_JSON_PATH} ${CHANGELOG_PATH}`);

    // Create commit with co-author
    const commitMessage = `Bump plugin version to ${version}\n\nCo-authored-by: Claude Sonnet 4.5 <noreply@anthropic.com>`;
    exec(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
    console.log(`✅ Created commit: "Bump plugin version to ${version}"`);

    // Create tag
    exec(`git tag v${version}`);
    console.log(`✅ Created tag: v${version}`);
  } catch (error) {
    console.error(`❌ Failed to create git commit and tag`);
    throw error;
  }
}

/**
 * Push commit and tag to remote
 */
function pushToRemote(): void {
  try {
    // Push commit to stable branch
    exec(`git push origin HEAD:${TARGET_BRANCH}`, 'Failed to push commit to origin/stable');
    console.log(`✅ Pushed commit to origin/${TARGET_BRANCH}`);

    // Push tags
    exec('git push origin --tags', 'Failed to push tags');
    console.log(`✅ Pushed tags to origin`);
  } catch (error) {
    console.error(`❌ Failed to push to remote. You may need to push manually.`);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const bumpType = process.argv[2] as BumpType | undefined;

  if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('❌ Usage: npm run bump <major|minor|patch>');
    console.error('\nExamples:');
    console.error('  npm run bump major   # 1.2.0 → 2.0.0');
    console.error('  npm run bump minor   # 1.2.0 → 1.3.0');
    console.error('  npm run bump patch   # 1.2.0 → 1.2.1');
    process.exit(1);
  }

  console.log('\n🚀 Starting version bump process...\n');

  // Check git status
  console.log('Checking git working directory...');
  checkGitClean();
  console.log('✅ Git working directory is clean\n');

  // Read current version
  const currentVersion = await readCurrentVersion();
  console.log(`Current version: ${currentVersion}`);

  // Calculate new version
  const newVersion = calculateNewVersion(currentVersion, bumpType);
  console.log(`New version: ${newVersion}\n`);

  // Update files
  console.log('Updating files...');
  await updatePluginJson(newVersion);
  await updateMarketplaceJson(newVersion);
  await updateChangelog(newVersion);
  console.log('');

  // Git operations
  console.log('Creating git commit and tag...');
  gitCommitAndTag(newVersion);
  console.log('');

  // Push to remote
  console.log('Pushing to remote...');
  pushToRemote();
  console.log('');

  console.log(`\n✨ Successfully bumped version from ${currentVersion} to ${newVersion}!\n`);
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Version bump failed:', error.message);
  process.exit(1);
});
