// playwright_tests/global-teardown.js
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Running global teardown / cleanup tasks...');

  // Example: remove temp folder if it exists
  const tempDir = path.resolve(__dirname, 'temp'); // adjust if you have temp files
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`✅ Removed temporary folder: ${tempDir}`);
    } catch (err) {
      console.warn('⚠️ Could not remove temp folder:', err.message);
    }
  }

  // Example: remove old Playwright artifacts if needed
  const artifactsDir = path.resolve(__dirname, 'test-results', 'artifacts'); // optional
  if (fs.existsSync(artifactsDir)) {
    try {
      fs.rmSync(artifactsDir, { recursive: true, force: true });
      console.log(`✅ Removed old artifacts folder: ${artifactsDir}`);
    } catch (err) {
      console.warn('⚠️ Could not remove artifacts folder:', err.message);
    }
  }

  // Add other cleanup tasks here if necessary
  // For example: stopping mock servers if you prefer to manage them here instead of the bash script

  console.log('✅ Global teardown finished.');
};
