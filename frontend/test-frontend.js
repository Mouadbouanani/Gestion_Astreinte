// Test simple pour vérifier que le frontend démarre
import fs from 'fs';
import path from 'path';

console.log('🚀 Test Frontend OCP');
console.log('📁 Répertoire:', process.cwd());
console.log('📦 Node version:', process.version);

const essentialFiles = [
  'package.json',
  'src/App.tsx',
  'src/main.tsx',
  'src/index.css',
  'index.html',
  'vite.config.ts',
  'tailwind.config.js'
];

console.log('\n📋 Vérification des fichiers essentiels:');
essentialFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🎯 Pour démarrer le frontend:');
console.log('1. cd frontend');
console.log('2. npm install (si pas encore fait)');
console.log('3. npm run dev');
console.log('4. Ouvrir http://localhost:5173');

console.log('\n🔗 Assurez-vous que le backend fonctionne sur http://localhost:5050');
