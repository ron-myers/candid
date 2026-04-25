const fs = require('fs')
const path = require('path')

const source = path.join(__dirname, '..', '..', '.claude-plugin', 'plugin.json')
const dest = path.join(__dirname, '..', 'data', 'plugin.json')

const content = fs.readFileSync(source, 'utf-8')

fs.mkdirSync(path.dirname(dest), { recursive: true })

fs.writeFileSync(dest, content)

console.log('Copied .claude-plugin/plugin.json to docs/data/plugin.json')
