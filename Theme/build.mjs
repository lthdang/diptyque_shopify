/**
 * build.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Vite build script for account JS bundles.
 *
 * Produces a self-contained IIFE bundle in assets/ (no hash, no chunks):
 *   assets/account-app.bundle.js    ← Main SPA (/pages/account)
 *
 * Usage:
 *   npm run build          # one-off build
 *   npm run watch          # watch mode for development
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch   = process.argv.includes('--watch');

/** Shared Vite config for each entry */
function sharedConfig(entry, outputName, iifeName) {
  return {
    root: __dirname,
    plugins: [],
    build: {
      watch: isWatch ? {} : null,
      emptyOutDir: false,   // ← CRITICAL: never wipe the assets/ folder
      outDir: 'assets',
      lib: {
        entry:    path.resolve(__dirname, entry),
        name:     iifeName,
        formats:  ['iife'],
        fileName: () => outputName,
      },
      rollupOptions: {
        output: {
          // Disable code-splitting: produce a single self-contained bundle
          inlineDynamicImports: true,
        },
      },
      // Do not minify in watch mode for easier debugging
      minify: isWatch ? false : 'esbuild',
    },
  };
}

async function main() {
  console.log('[build] Building account bundle…');

  await build(sharedConfig(
    'src/account/account-app.js',
    'account-app.bundle.js',
    'DiptyqueAccountApp',
  ));

  console.log('[build] ✓ Done → assets/account-app.bundle.js');
}

main().catch(err => {
  console.error('[build] Failed:', err);
  process.exit(1);
});
