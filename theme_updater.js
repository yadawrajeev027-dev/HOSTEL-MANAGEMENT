const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');
const indexHtml = path.join(__dirname, 'client', 'index.html');

// We are converting a dark theme to a light theme.
// The primary brand color is Royal Blue (#2563EB).

function processContent(content) {
  // 1. Backgrounds
  content = content.replace(/bg-slate-900\/90/g, 'bg-white');
  content = content.replace(/bg-slate-900\/80/g, 'bg-white');
  content = content.replace(/bg-slate-900\/60/g, 'bg-white');
  content = content.replace(/bg-slate-950\/60/g, 'bg-white');
  content = content.replace(/bg-slate-900/g, 'bg-white'); // Cards, Sidebar, Navbar
  content = content.replace(/bg-slate-950/g, 'bg-[#F5F7FB]'); // Inner panels, inputs
  
  content = content.replace(/bg-slate-800\/50/g, 'bg-slate-50');
  content = content.replace(/bg-slate-800/g, 'bg-slate-50'); 
  content = content.replace(/hover:bg-slate-800/g, 'hover:bg-slate-100');
  content = content.replace(/hover:bg-slate-700/g, 'hover:bg-slate-200');

  // 2. Borders
  content = content.replace(/border-slate-800\/80/g, 'border-slate-200');
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  content = content.replace(/border-slate-700/g, 'border-slate-300');
  content = content.replace(/border-slate-600/g, 'border-slate-300');

  // 3. Text Colors (Wait, if we replace text-white with text-slate-900, we break buttons)
  // Let's first protect buttons that need white text.
  content = content.replace(/text-white(.*?)bg-brand-/g, 'TEXT_WHITE_PROTECTED$1bg-brand-');
  content = content.replace(/bg-brand-(.*?)text-white/g, 'bg-brand-$1TEXT_WHITE_PROTECTED');
  content = content.replace(/text-white(.*?)bg-red-/g, 'TEXT_WHITE_PROTECTED$1bg-red-');
  content = content.replace(/bg-red-(.*?)text-white/g, 'bg-red-$1TEXT_WHITE_PROTECTED');
  content = content.replace(/text-white(.*?)bg-emerald-/g, 'TEXT_WHITE_PROTECTED$1bg-emerald-');
  content = content.replace(/bg-emerald-(.*?)text-white/g, 'bg-emerald-$1TEXT_WHITE_PROTECTED');

  // Now replace the rest
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/text-slate-100/g, 'text-slate-900');
  content = content.replace(/text-slate-200/g, 'text-slate-700');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/text-slate-400/g, 'text-slate-500');
  content = content.replace(/text-slate-500/g, 'text-slate-400');
  content = content.replace(/hover:text-white/g, 'hover:text-slate-900');

  // Restore protected white text
  content = content.replace(/TEXT_WHITE_PROTECTED/g, 'text-white');

  // 4. Brand colors (Royal blue)
  content = content.replace(/text-brand-400/g, 'text-brand-600');
  content = content.replace(/text-brand-300/g, 'text-brand-600');
  content = content.replace(/bg-brand-500\/10/g, 'bg-brand-50');
  content = content.replace(/bg-brand-500\/20/g, 'bg-brand-100');
  content = content.replace(/border-brand-500\/30/g, 'border-brand-200');
  content = content.replace(/hover:border-brand-500\/50/g, 'hover:border-brand-300');
  content = content.replace(/hover:border-brand-500\/30/g, 'hover:border-brand-300');

  // 5. Stat colors (Accent / Success / Warning / Danger)
  content = content.replace(/text-amber-400/g, 'text-amber-600');
  content = content.replace(/text-emerald-400/g, 'text-emerald-600');
  content = content.replace(/text-sky-400/g, 'text-cyan-600'); // Cyan for accent
  content = content.replace(/text-sky-300/g, 'text-cyan-600');
  content = content.replace(/text-red-400/g, 'text-red-600');
  content = content.replace(/text-red-300/g, 'text-red-600');
  
  content = content.replace(/bg-amber-500\/10/g, 'bg-amber-50');
  content = content.replace(/bg-emerald-500\/10/g, 'bg-emerald-50');
  content = content.replace(/bg-sky-500\/10/g, 'bg-cyan-50');
  content = content.replace(/bg-red-500\/10/g, 'bg-red-50');
  content = content.replace(/bg-red-500\/20/g, 'bg-red-100');
  content = content.replace(/border-red-500\/20/g, 'border-red-200');
  content = content.replace(/border-red-500\/30/g, 'border-red-300');
  content = content.replace(/hover:border-amber-500\/30/g, 'hover:border-amber-300');
  content = content.replace(/hover:border-emerald-500\/30/g, 'hover:border-emerald-300');
  content = content.replace(/hover:border-sky-500\/30/g, 'hover:border-cyan-300');
  content = content.replace(/hover:border-red-500\/30/g, 'hover:border-red-300');

  // 6. Overlays
  content = content.replace(/bg-black\/60/g, 'bg-slate-900\/40');
  content = content.replace(/bg-black\/80/g, 'bg-slate-900\/50');

  // 7. Inputs Fixes
  content = content.replace(/focus:border-brand-500/g, 'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none');

  // 8. Gradients
  content = content.replace(/from-brand-950/g, 'from-brand-50');
  content = content.replace(/to-slate-900/g, 'to-white');
  content = content.replace(/via-slate-900/g, 'via-white');

  return content;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = processContent(content);
  fs.writeFileSync(filePath, newContent, 'utf8');
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

// Process index.html separately
if (fs.existsSync(indexHtml)) {
  let indexContent = fs.readFileSync(indexHtml, 'utf8');
  indexContent = indexContent.replace(/bg-slate-900 text-slate-100/, 'bg-[#F5F7FB] text-slate-900');
  fs.writeFileSync(indexHtml, indexContent, 'utf8');
}

traverseDir(srcDir);
console.log('Done mapping classes!');
