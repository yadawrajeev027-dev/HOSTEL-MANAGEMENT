const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');

const map = {
  // Backgrounds
  'bg-white': 'bg-white dark:bg-slate-900',
  'bg-\\[#F5F7FB\\]': 'bg-[#F5F7FB] dark:bg-slate-950',
  'bg-slate-50': 'bg-slate-50 dark:bg-slate-800',
  'bg-slate-100': 'bg-slate-100 dark:bg-slate-800',
  'hover:bg-slate-50': 'hover:bg-slate-50 dark:hover:bg-slate-800',
  'hover:bg-slate-100': 'hover:bg-slate-100 dark:hover:bg-slate-700',
  'hover:bg-slate-200': 'hover:bg-slate-200 dark:hover:bg-slate-700',

  // Text
  'text-slate-900': 'text-slate-900 dark:text-white',
  'text-slate-800': 'text-slate-800 dark:text-slate-200',
  'text-slate-700': 'text-slate-700 dark:text-slate-200',
  'text-slate-600': 'text-slate-600 dark:text-slate-300',
  'text-slate-500': 'text-slate-500 dark:text-slate-400',
  'text-slate-400': 'text-slate-400 dark:text-slate-500',
  'hover:text-slate-900': 'hover:text-slate-900 dark:hover:text-white',

  // Borders
  'border-slate-200': 'border-slate-200 dark:border-slate-800',
  'border-slate-300': 'border-slate-300 dark:border-slate-700',
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We only want to replace standalone classes (not parts of other words)
  // For example, 'bg-white' shouldn't match 'bg-white/50' unless we explicitly want it.
  
  for (const [light, darkVariant] of Object.entries(map)) {
    // Only replace if it doesn't ALREADY have the dark variant to prevent doubling
    if (content.includes(darkVariant)) continue;
    
    // Find standalone light class
    const regex = new RegExp(`(?<=['"\\s>])${escapeRegExp(light)}(?=['"\\s<])`, 'g');
    content = content.replace(regex, darkVariant);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
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

traverseDir(srcDir);
console.log('Added dark mode variants!');
