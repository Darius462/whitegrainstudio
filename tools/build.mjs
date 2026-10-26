import { mkdir, copyFile, cp, writeFile } from 'node:fs/promises';
const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel.');
if (!url.startsWith('https://') || (!key.startsWith('sb_publishable_') && key.split('.').length !== 3)) throw new Error('Invalid Supabase public configuration.');
if (key.split('.').length === 3) {
  const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  if (payload.role !== 'anon') throw new Error('Use the anon/publishable key, never a service role key.');
}
await mkdir('dist', { recursive: true });
for (const file of ['index.html','styles.css','script.js','backend.js','admin.html','admin.js','admin.css']) await copyFile(file, `dist/${file}`);
await cp('assets', 'dist/assets', { recursive: true });
await writeFile('dist/config.js', `window.WHITEGRAIN_CONFIG = ${JSON.stringify({supabaseUrl:url,supabaseKey:key})};\n`);
console.log('Whitegrain built into dist/');
