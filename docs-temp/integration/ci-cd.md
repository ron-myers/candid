# CI/CD Integration

Run Candid reviews automatically in your CI/CD pipeline.

## Prerequisites

1. Claude Code CLI installed in your CI environment
2. Candid plugin installed
3. API key configured (via `ANTHROPIC_API_KEY` environment variable)

## Key Principles

### Non-Interactive Mode

In CI, you must specify the tone flag to skip interactive prompts:

```bash
claude code "/candid-review --harsh"
# or
claude code "/candid-review --constructive"
```

### Exit Codes

Candid follows standard exit conventions:
- `0` - Review completed (regardless of issues found)
- `1` - Error occurred (git not found, no changes, etc.)

To fail builds on issues, parse the output or use a wrapper script.

## GitHub Actions

### Basic Review on PR

```yaml
name: Code Review

on:
  pull_request:
    branches: [main, stable]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for branch comparison

      - name: Install Claude Code
        run: |
          npm install -g @anthropic-ai/claude-code

      - name: Install Candid
        run: |
          claude code "/plugin marketplace add ron-myers/candid"
          claude code "/plugin install candid@candid"

      - name: Run Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude code "/candid-review --constructive" > review-output.txt 2>&1
          cat review-output.txt

      - name: Upload Review
        uses: actions/upload-artifact@v4
        with:
          name: code-review
          path: review-output.txt
```

### Security-Focused Review

```yaml
name: Security Review

on:
  pull_request:
    paths:
      - 'src/auth/**'
      - 'src/api/**'
      - '**/security/**'

jobs:
  security-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Install Candid
        run: |
          claude code "/plugin marketplace add ron-myers/candid"
          claude code "/plugin install candid@candid"

      - name: Security Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude code "/candid-review --harsh --focus security"
```

### Fail on Critical Issues

```yaml
- name: Run Review and Check for Critical
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    claude code "/candid-review --harsh" > review.txt 2>&1
    cat review.txt

    # Fail if critical issues found
    if grep -q "🔥" review.txt; then
      echo "::error::Critical issues found in code review"
      exit 1
    fi
```

### Post Review as PR Comment

```yaml
- name: Run Review
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    claude code "/candid-review --constructive" > review.txt 2>&1

- name: Post Review Comment
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const review = fs.readFileSync('review.txt', 'utf8');

      // Truncate if too long for GitHub comment
      const maxLength = 65000;
      const truncated = review.length > maxLength
        ? review.substring(0, maxLength) + '\n\n...(truncated)'
        : review;

      github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: `## Candid Code Review\n\n\`\`\`\n${truncated}\n\`\`\``
      });
```

## GitLab CI

### Basic Review

```yaml
code-review:
  stage: test
  image: node:20
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
  before_script:
    - npm install -g @anthropic-ai/claude-code
    - claude code "/plugin marketplace add ron-myers/candid"
    - claude code "/plugin install candid@candid"
  script:
    - claude code "/candid-review --harsh" | tee review.txt
  artifacts:
    paths:
      - review.txt
    expire_in: 1 week
  only:
    - merge_requests
```

### Security Review for Sensitive Paths

```yaml
security-review:
  stage: test
  image: node:20
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
  before_script:
    - npm install -g @anthropic-ai/claude-code
    - claude code "/plugin marketplace add ron-myers/candid"
    - claude code "/plugin install candid@candid"
  script:
    - claude code "/candid-review --harsh --focus security"
  only:
    - merge_requests
  rules:
    - changes:
        - src/auth/**/*
        - src/api/**/*
```

## CircleCI

```yaml
version: 2.1

jobs:
  code-review:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Install Claude Code
          command: npm install -g @anthropic-ai/claude-code
      - run:
          name: Install Candid
          command: |
            claude code "/plugin marketplace add ron-myers/candid"
            claude code "/plugin install candid@candid"
      - run:
          name: Run Code Review
          command: claude code "/candid-review --constructive" | tee review.txt
      - store_artifacts:
          path: review.txt
          destination: code-review

workflows:
  pr-review:
    jobs:
      - code-review
```

## Azure DevOps

```yaml
trigger: none

pr:
  branches:
    include:
      - main
      - stable

pool:
  vmImage: 'ubuntu-latest'

steps:
  - checkout: self
    fetchDepth: 0

  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'

  - script: npm install -g @anthropic-ai/claude-code
    displayName: 'Install Claude Code'

  - script: |
      claude code "/plugin marketplace add ron-myers/candid"
      claude code "/plugin install candid@candid"
    displayName: 'Install Candid'

  - script: claude code "/candid-review --harsh" > $(Build.ArtifactStagingDirectory)/review.txt 2>&1
    displayName: 'Run Code Review'
    env:
      ANTHROPIC_API_KEY: $(ANTHROPIC_API_KEY)

  - task: PublishBuildArtifacts@1
    inputs:
      pathToPublish: $(Build.ArtifactStagingDirectory)/review.txt
      artifactName: 'CodeReview'
```

## Best Practices

### 1. Use Config Files

Instead of flags, commit a `.candid/config.json` to your repo:

```json
{
  "tone": "harsh",
  "focus": "security",
  "exclude": ["*.generated.ts", "vendor/*"]
}
```

This ensures consistent reviews across environments.

### 2. Cache Plugin Installation

Speed up CI by caching the plugin:

```yaml
# GitHub Actions
- uses: actions/cache@v4
  with:
    path: ~/.claude
    key: claude-plugins-${{ hashFiles('.claude-plugin/*') }}
```

### 3. Review Specific Paths

For large repos, review only changed paths:

**Tip:** For Git Flow or custom workflows, configure merge target in `.candid/config.json`:
```json
{"mergeTargetBranches": ["develop"]}
```

```bash
# Get changed files
# Automatically uses configured merge target
# Or specify explicitly for CI:
CHANGED_FILES=$(git diff --name-only origin/develop...HEAD | grep -E '\.(ts|js|py)$' | head -20)

# Review them
claude code "/candid-review $CHANGED_FILES"
```

### 4. Technical.md in CI

Ensure your Technical.md is in the repo so CI reviews use the same standards:

```
project/
├── Technical.md          # or .claude/Technical.md
├── .candid/
│   └── config.json
└── src/
```

### 5. Handle Rate Limits

For high-volume repos, add retry logic:

```bash
MAX_RETRIES=3
RETRY_DELAY=60

for i in $(seq 1 $MAX_RETRIES); do
  claude code "/candid-review --harsh" && break
  echo "Attempt $i failed, retrying in $RETRY_DELAY seconds..."
  sleep $RETRY_DELAY
done
```

### 6. Selective Triggering

Don't review every commit—trigger on meaningful changes:

```yaml
# GitHub Actions - only review code changes
on:
  pull_request:
    paths:
      - 'src/**'
      - 'lib/**'
      - '!**/*.md'
      - '!**/*.json'
```

## Troubleshooting

### "No changes detected"

CI environments may not have full git history. Ensure:
- `fetch-depth: 0` in checkout
- The base branch is fetched

### API Key Issues

Verify your secret is set correctly:
```bash
echo "API key length: ${#ANTHROPIC_API_KEY}"
```

### Timeout

Reviews of large changes can be slow. Increase timeout:
```yaml
- name: Run Review
  timeout-minutes: 30
  run: claude code "/candid-review --harsh"
```

### Interactive Prompts Hanging

Always use `--harsh` or `--constructive` flag in CI. Without it, the review waits for user input.
