const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create dist/frontend directory if it doesn't exist
const distFrontendDir = path.join(distDir, 'frontend');
if (!fs.existsSync(distFrontendDir)) {
  fs.mkdirSync(distFrontendDir, { recursive: true });
}

// Copy frontend files to dist/frontend
const frontendDir = path.join(__dirname, 'frontend');
copyFolderRecursiveSync(frontendDir, distDir);

// Copy worker.js to dist
fs.copyFileSync(
  path.join(__dirname, 'worker.js'),
  path.join(distDir, 'worker.js')
);

// Copy wrangler.toml to dist
fs.copyFileSync(
  path.join(__dirname, 'wrangler.toml'),
  path.join(distDir, 'wrangler.toml')
);

// Copy package.json to dist
const packageJson = require('./package.json');
// Simplify package.json for deployment
const deployPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  main: packageJson.main,
  dependencies: {
    '@cloudflare/kv-asset-handler': packageJson.dependencies['@cloudflare/kv-asset-handler'],
    '@n8n/chat': packageJson.dependencies['@n8n/chat']
  }
};
fs.writeFileSync(
  path.join(distDir, 'package.json'),
  JSON.stringify(deployPackageJson, null, 2)
);

console.log('Build completed successfully!');

/**
 * Copy a folder recursively
 * @param {string} source - Source folder
 * @param {string} target - Target folder
 */
function copyFolderRecursiveSync(source, target) {
  const targetFolder = path.join(target, path.basename(source));
  
  // Create target folder if it doesn't exist
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Copy all files and subfolders
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        fs.copyFileSync(curSource, path.join(targetFolder, file));
      }
    });
  }
}
