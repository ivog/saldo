// Bundelt de Vite-build (dist/) tot één HTML-bestand zonder externe assets,
// zodat de app als losse pagina (bijv. een claude.ai Artifact) gepubliceerd kan worden.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const asset = (href) => readFileSync(join(dist, href.replace(/^\//, '')), 'utf8')

const head = html.match(/<head>([\s\S]*)<\/head>/)[1]
const keep = [...head.matchAll(/<(?:title|link rel="(?:icon|preconnect|stylesheet)" href="https?:|link rel="icon")[^>]*>(?:[^<]*<\/title>)?/g)]
  .map((m) => m[0])
  .filter((tag) => !tag.includes('/assets/'))
// Title eerst: alleen de eerste 8KB wordt gescand.
keep.sort((a, b) => (b.startsWith('<title') ? 1 : 0) - (a.startsWith('<title') ? 1 : 0))

const css = [...head.matchAll(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+)"/g)].map((m) => asset(m[1])).join('\n')
const js = [...head.matchAll(/<script type="module"[^>]*src="(\/assets\/[^"]+)"/g)]
  .map((m) => asset(m[1]).replace(/<\/script/gi, '<\\/script'))
  .join('\n')

const out = `${keep.join('\n')}
<style>
${css}
</style>
<div id="app"></div>
<script type="module">
${js}
</script>
`
writeFileSync(join(dist, 'saldo.html'), out)
console.log(`dist/saldo.html (${(out.length / 1024).toFixed(1)} kB)`)
