# Release Process

This document outlines the complete release process for the Candid plugin, including all steps required for a successful release.

## Overview

The release process consists of three main phases:
1. **Pre-Release**: Prepare CHANGELOG and verify changes
2. **Version Bump**: Update all version references (automated + manual)
3. **Post-Release**: Verify deployment and update documentation

## Prerequisites

Before starting a release, ensure:
- ✅ All changes for the release are merged to `stable` branch
- ✅ Git working directory is clean (`git status` shows no uncommitted changes)
- ✅ You have push access to the repository
- ✅ You're on a branch that can push to `origin/stable`
- ✅ All tests pass and the plugin works correctly

## Phase 1: Pre-Release Preparation

### 1.1 Update CHANGELOG.md

Edit `CHANGELOG.md` and fill in the changes under the `[Unreleased]` section or the current version section:

```markdown
## [Unreleased]

### Added
- List new features here

### Changed
- List changes to existing functionality

### Fixed
- List bug fixes here
```

**Important**: Be thorough and specific. Users rely on this to understand what changed.

### 1.2 Review Changes

Review all changes since the last release:

```bash
# View commits since last release
git log v1.4.2..HEAD --oneline

# View file changes
git diff v1.4.2..HEAD --stat
```

Ensure the CHANGELOG accurately reflects all significant changes.

### 1.3 Determine Version Bump Type

Follow [Semantic Versioning](https://semver.org/):

- **Major** (X.0.0): Breaking changes, incompatible API changes
- **Minor** (x.X.0): New features, backward compatible
- **Patch** (x.x.X): Bug fixes, backward compatible

## Phase 2: Version Bump

### 2.1 Run Automated Version Bump Script

The `bump-version.ts` script automates most of the version update process:

```bash
cd scripts
npm run bump <major|minor|patch>
```

**What this script does:**
1. ✅ Validates git working directory is clean
2. ✅ Reads current version from `.claude-plugin/plugin.json`
3. ✅ Calculates new version
4. ✅ Updates `.claude-plugin/plugin.json`
5. ✅ Updates `.claude-plugin/marketplace.json`
6. ✅ Updates `CHANGELOG.md` (adds new version header with date)
7. ✅ Creates git commit: `"Bump plugin version to X.Y.Z"`
8. ✅ Creates git tag: `vX.Y.Z`
9. ✅ Pushes to `origin/stable`

### 2.2 Update Website Version Badge (CRITICAL - Often Missed!)

**This step is NOT automated and has been missed in recent releases.**

Update the version badge on the homepage:

**File**: `docs/app/(marketing)/page.jsx`

**Line 118**: Change the version number:

```jsx
// BEFORE
<span className="version-dot"></span>
v1.5.0 Now Available for Claude Code

// AFTER (example for 1.6.0)
<span className="version-dot"></span>
v1.6.0 Now Available for Claude Code
```

**Why this matters**: The homepage is the first thing users see. An outdated version number creates confusion and makes the site look unmaintained.

### 2.3 Commit Website Version Update

After updating the homepage version:

```bash
git add docs/app/(marketing)/page.jsx
git commit -m "Update homepage version badge to v1.6.0

Co-authored-by: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin HEAD:stable
```

## Phase 3: Post-Release Verification

### 3.1 Verify Release Artifacts

Check that everything was created correctly:

```bash
# Check the commit was created
git log -1

# Check the tag was created
git tag -l | grep v1.6.0

# Check everything was pushed to remote
git log origin/stable -1
git ls-remote --tags origin | grep v1.6.0
```

### 3.2 Verify Plugin Installation

Test that users can install the new version:

```bash
# In a test environment
claude plugin update candid@candid
```

Verify the correct version is installed:
```bash
claude plugin list | grep candid
```

### 3.3 Verify Website Deployment

If the documentation site auto-deploys:

1. Visit [www.candid.tools](https://www.candid.tools)
2. Check the homepage version badge shows the correct version
3. Verify the changelog is accessible and updated

### 3.4 Create GitHub Release (Optional)

Create a GitHub release for better visibility:

1. Go to https://github.com/ron-myers/candid/releases
2. Click "Draft a new release"
3. Select the tag `vX.Y.Z` you just created
4. Title: `v1.6.0` (or whatever version)
5. Copy the relevant CHANGELOG section into the description
6. Publish release

## Rollback Procedure

If you need to undo a release:

### Before Pushing to Remote

```bash
# Remove the commit
git reset --hard HEAD~1

# Remove the tag
git tag -d vX.Y.Z
```

### After Pushing to Remote

```bash
# Delete the remote tag
git push origin :refs/tags/vX.Y.Z

# Revert the commit (creates a new commit that undoes changes)
git revert HEAD
git push origin HEAD:stable
```

**Then**: Manually revert any other changes (like the website version badge).

## Complete Release Checklist

Use this checklist to ensure nothing is missed:

- [ ] **Pre-Release**
  - [ ] All changes merged to `stable` branch
  - [ ] `CHANGELOG.md` updated with all changes
  - [ ] Git working directory is clean
  - [ ] All tests pass
  - [ ] Version bump type determined (major/minor/patch)

- [ ] **Automated Version Bump**
  - [ ] Navigate to `scripts/` directory
  - [ ] Run `npm run bump <type>`
  - [ ] Verify script completed successfully
  - [ ] Verify commit and tag were pushed to remote

- [ ] **Manual Website Update** ⚠️ CRITICAL
  - [ ] Update version in `docs/app/(marketing)/page.jsx:118`
  - [ ] Commit: "Update homepage version badge to vX.Y.Z"
  - [ ] Push to `origin/stable`

- [ ] **Post-Release Verification**
  - [ ] Verify commit exists: `git log origin/stable -1`
  - [ ] Verify tag exists: `git ls-remote --tags origin | grep vX.Y.Z`
  - [ ] Test plugin installation: `claude plugin update candid@candid`
  - [ ] Verify homepage shows correct version
  - [ ] (Optional) Create GitHub release

- [ ] **Communication**
  - [ ] (Optional) Announce release to users
  - [ ] (Optional) Update any external documentation

## Troubleshooting

### "Git working directory is not clean"
- **Solution**: Commit or stash changes before running bump script
- **Check**: `git status`

### "Failed to push commit to origin/stable"
- **Solution**: Verify push access and remote configuration
- **Check**: `git remote -v`

### "Invalid version format"
- **Solution**: Ensure `.claude-plugin/plugin.json` has valid semantic version
- **Check**: Current version should match pattern `X.Y.Z`

### Website version badge not updating after deployment
- **Solution**: Check if the site needs manual deployment or cache clearing
- **Check**: Look for deployment pipeline logs

## Files Modified During Release

| File | Updated By | Purpose |
|------|------------|---------|
| `.claude-plugin/plugin.json` | Automated script | Plugin manifest version |
| `.claude-plugin/marketplace.json` | Automated script | Marketplace metadata version |
| `CHANGELOG.md` | Automated script | Version header and date |
| `docs/app/(marketing)/page.jsx` | **Manual (line 118)** | Homepage version badge |

## Notes

- The automated script pushes to `stable` branch automatically
- Co-author attribution is added automatically: `Co-authored-by: Claude Sonnet 4.5 <noreply@anthropic.com>`
- CHANGELOG format follows [Keep a Changelog](https://keepachangelog.com/)
- Versioning follows [Semantic Versioning](https://semver.org/)
- **Website version update is manual** and must not be forgotten!

## Future Improvements

Consider automating the website version badge update:
- Add website update to `bump-version.ts` script
- Or create a pre-commit hook to check version consistency
- Or add a CI check that verifies all version references match

---

**Last Updated**: 2026-01-27
**Current Version**: 1.6.0
