const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const sourceDir = path.join(__dirname, '..', '.next', 'server', 'app')
const outputDir = path.join(__dirname, '..', 'public', '_pagefind')
const indexFile = path.join(outputDir, 'pagefind.js')

// Check that the Next.js build output exists
if (!fs.existsSync(sourceDir)) {
  console.error('✗ Error: .next/server/app directory not found.')
  console.error('  Next.js build may have failed or not completed.')
  process.exit(1)
}

// Run pagefind to generate search index
try {
  console.log('Running pagefind to generate search index...')
  execSync('pagefind --site .next/server/app --output-path public/_pagefind', {
    stdio: 'inherit'
  })
} catch (error) {
  console.error('✗ Failed to generate search index:', error.message)
  process.exit(1)
}

// Verify that pagefind actually generated the index
if (!fs.existsSync(indexFile)) {
  console.error('✗ Error: pagefind.js was not generated.')
  console.error('  Check that HTML files have data-pagefind-body attributes.')
  console.error('  Expected file:', indexFile)
  process.exit(1)
}

console.log('✓ Search index generated successfully')
