const fs = require('fs-extra');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const wwwDir = path.join(__dirname, '../android-app/www');

async function copyToAndroid() {
  try {
    console.log('📦 Copying dist/ to android-app/www/...');

    // Check if dist exists
    if (!fs.existsSync(distDir)) {
      console.error('❌ dist/ folder not found. Run "pnpm build" first.');
      process.exit(1);
    }

    // Remove old www content
    await fs.emptyDir(wwwDir);

    // Copy dist to www
    await fs.copy(distDir, wwwDir);

    console.log('✅ Copy completed successfully');
    console.log(`   ${distDir} → ${wwwDir}`);
  } catch (error) {
    console.error('❌ Copy failed:', error);
    process.exit(1);
  }
}

copyToAndroid();
