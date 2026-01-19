const fs = require('fs')
const path = require('path')

const source = path.join(__dirname, '..', '..', 'CHANGELOG.md')
const dest = path.join(__dirname, '..', 'app', 'docs', 'resources', 'changelog', 'page.mdx')

// Read the source changelog
const content = fs.readFileSync(source, 'utf-8')

// Create the destination directory if it doesn't exist
fs.mkdirSync(path.dirname(dest), { recursive: true })

// Write to the destination
fs.writeFileSync(dest, content)

console.log('Copied CHANGELOG.md to docs/app/docs/resources/changelog/page.mdx')
