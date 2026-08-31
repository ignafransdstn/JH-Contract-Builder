const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3002;
const buildPath = path.join(__dirname, 'build');

// Check if build directory exists
if (!fs.existsSync(buildPath)) {
  console.error('❌ ERROR: Build directory not found!');
  console.error('');
  console.error('This server is for PRODUCTION mode only.');
  console.error('');
  console.error('For DEVELOPMENT mode, use:');
  console.error('  npm start');
  console.error('');
  console.error('To create production build:');
  console.error('  npm run build');
  console.error('');
  process.exit(1);
}

// Serve static files from the build directory
app.use(express.static(buildPath));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Frontend running on http://localhost:${PORT}`);
  console.log(`✓ Serving from production build`);
  console.log(`✓ Press Ctrl+C to stop`);
});
