# Development Scripts

This directory contains automation scripts for the Candid plugin development workflow.

## bump-version.ts

Automates version bumping, changelog updates, and release tagging for the Candid plugin.

### What It Does

The script performs the following operations in sequence:

1. **Validates** that your git working directory is clean
2. **Reads** the current version from `.claude-plugin/plugin.json`
3. **Calculates** the new version based on semantic versioning rules
4. **Updates** version in all required files:
   - `.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json`
   - `CHANGELOG.md` (adds new version header with today's date)
   - `docs/app/(marketing)/page.jsx` (updates homepage version badge)
5. **Creates** a git commit with the message: `"Bump plugin version to X.Y.Z"`
6. **Tags** the commit with `vX.Y.Z`
7. **Pushes** the commit and tag to `origin/stable`

### Installation

First time setup (run from the `scripts/` directory):

```bash
cd scripts
npm install
```

This installs the required dependencies (`tsx` and `@types/node`).

### Usage

Run from the `scripts/` directory:

```bash
cd scripts
npm run bump <bump-type>
```

**Bump types:**
- `major` - Increment major version (1.2.0 → 2.0.0)
- `minor` - Increment minor version (1.2.0 → 1.3.0)
- `patch` - Increment patch version (1.2.0 → 1.2.1)

### Examples

**Patch release** (bug fixes):
```bash
cd scripts
npm run bump patch
# 1.2.0 → 1.2.1
```

**Minor release** (new features, backward compatible):
```bash
cd scripts
npm run bump minor
# 1.2.0 → 1.3.0
```

**Major release** (breaking changes):
```bash
cd scripts
npm run bump major
# 1.2.0 → 2.0.0
```

### Requirements

Before running the script:
- ✅ Working directory must be clean (no uncommitted changes)
- ✅ You must be on a branch that can push to `origin/stable`
- ✅ You must have push access to the repository

### What Gets Updated

**Files modified:**
- `.claude-plugin/plugin.json` - Plugin manifest
- `.claude-plugin/marketplace.json` - Marketplace metadata
- `CHANGELOG.md` - Adds new version header with today's date
- `docs/app/(marketing)/page.jsx` - Homepage version badge

**Git operations:**
- Commit created with message: `Bump plugin version to X.Y.Z`
- Co-author added: `Co-authored-by: Claude Sonnet 4.5 <noreply@anthropic.com>`
- Tag created: `vX.Y.Z`
- Pushed to: `origin/stable`

### CHANGELOG Format

The script adds a new version section to CHANGELOG.md:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

### Changed

### Fixed
```

You should fill in the Added/Changed/Fixed sections before running the script, or edit them after the version bump.

### Troubleshooting

**Error: "Git working directory is not clean"**
- Solution: Commit or stash your changes before running the script
- Check with: `git status`

**Error: "Failed to push commit to origin/stable"**
- Solution: Ensure you have push access and the remote is configured correctly
- Check remote: `git remote -v`
- Check branch: `git branch -a`

**Error: "Invalid version format"**
- Solution: Ensure `.claude-plugin/plugin.json` has a valid semantic version (e.g., "1.2.0")

**Script runs but no push happens**
- The script will create the commit and tag locally
- If push fails, you can manually push with:
  ```bash
  git push origin HEAD:stable
  git push origin --tags
  ```

### Workflow

Typical release workflow:

1. **Update CHANGELOG.md** with your changes under the appropriate sections
2. **Ensure git is clean**: `git status`
3. **Navigate to scripts directory**: `cd scripts`
4. **Run version bump**: `npm run bump patch` (or `minor`/`major`)
5. **Verify the release**:
   - Check that files were updated correctly
   - Check the git log: `git log -1`
   - Check the tag: `git tag -l`
6. **The script automatically pushes** to `origin/stable`

### Advanced: Manual Rollback

If you need to undo a version bump (before pushing):

```bash
# Remove the commit
git reset --hard HEAD~1

# Remove the tag
git tag -d vX.Y.Z
```

If you already pushed and need to rollback:

```bash
# Delete the remote tag
git push origin :refs/tags/vX.Y.Z

# Revert the commit (creates a new commit that undoes the changes)
git revert HEAD
git push origin HEAD:stable
```

### Technical Details

- **Language**: TypeScript (executed with `tsx`)
- **Configuration**: Uses `tsconfig.json` from scripts directory
- **Node version**: Requires Node.js 18+ (for ES2022 features)
- **Semantic versioning**: Follows [semver.org](https://semver.org/) specification
- **Changelog format**: Follows [Keep a Changelog](https://keepachangelog.com/) standard
