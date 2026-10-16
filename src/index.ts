import { serve } from 'bun'
import { readdirSync } from 'fs'
import path from 'path'
import index from './index.html'

/**
 * Fichiers de public/ servis tels quels (CV…), comme sur GitHub Pages où le build
 * les copie à la racine du site. Sans ça, la route '/*' renverrait index.html.
 */
const PUBLIC_DIR = path.resolve(import.meta.dir, '..', 'public')

function publicRoutes(): Record<string, Response> {
  const routes: Record<string, Response> = {}
  let files: string[] = []
  try {
    files = readdirSync(PUBLIC_DIR, { recursive: true }) as string[]
  } catch {
    return routes
  }
  for (const file of files) {
    if (path.basename(file).startsWith('.')) continue
    const blob = Bun.file(path.join(PUBLIC_DIR, file))
    routes['/' + file.split(path.sep).join('/')] = new Response(blob)
  }
  return routes
}

const server = serve({
  routes: {
    ...publicRoutes(),
    // Toutes les autres adresses renvoient l'application
    '/*': index,
  },

  development: process.env.NODE_ENV !== 'production' && {
    // Rechargement à chaud dans le navigateur
    hmr: true,
    // Affiche les logs du navigateur dans le terminal
    console: true,
  },
})

console.log(`🚀 Server running at ${server.url}`)
