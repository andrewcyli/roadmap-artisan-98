import { cpSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// After build, copy prototype HTML to dist
try {
  cpSync(
    resolve(__dirname, 'public/prototype-refined.html'),
    resolve(__dirname, 'dist/prototype-refined.html'),
    { force: true }
  );
  console.log('[postbuild] Copied prototype-refined.html to dist/');
} catch(e) {
  console.warn('[postbuild] Could not copy prototype:', e.message);
}
