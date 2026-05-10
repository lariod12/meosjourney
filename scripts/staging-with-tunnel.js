import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 5555;
const VITE_READY_PATTERN = /ready in/i;
const CLOUDFLARE_URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

console.log('\n🚀 Starting Staging Environment with Cloudflare Tunnel...\n');

// Start Vite dev server (use cmd /c for Windows)
const viteProcess = spawn('cmd', ['/c', 'pnpm', 'vite', '--mode', 'staging', '--port', PORT.toString()], {
  cwd: join(__dirname, '..'),
  stdio: ['inherit', 'pipe', 'pipe']
});

let viteReady = false;
let cloudflaredProcess = null;
let tunnelUrl = null;

// Handle Vite stdout
viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);

  // Check if Vite is ready
  if (!viteReady && VITE_READY_PATTERN.test(output)) {
    viteReady = true;
    console.log('\n✅ Vite server is ready!\n');

    // Start cloudflared tunnel
    startCloudflaredTunnel();
  }
});

// Handle Vite stderr
viteProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle Vite exit
viteProcess.on('close', (code) => {
  console.log(`\n❌ Vite process exited with code ${code}`);
  if (cloudflaredProcess) {
    cloudflaredProcess.kill();
  }
  process.exit(code);
});

function startCloudflaredTunnel() {
  console.log('🌐 Starting Cloudflare Tunnel...\n');

  cloudflaredProcess = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${PORT}`], {
    stdio: ['inherit', 'pipe', 'pipe']
  });

  // Handle cloudflared stdout
  cloudflaredProcess.stdout.on('data', (data) => {
    const output = data.toString();

    // Check for Cloudflare URL
    const match = output.match(CLOUDFLARE_URL_PATTERN);
    if (match && !tunnelUrl) {
      tunnelUrl = match[0];
      displayTunnelInfo();
    }

    // Only show important cloudflared logs
    if (output.includes('error') || output.includes('ERR')) {
      process.stdout.write(output);
    }
  });

  // Handle cloudflared stderr
  cloudflaredProcess.stderr.on('data', (data) => {
    const output = data.toString();

    // Check for Cloudflare URL in stderr (cloudflared outputs URL here)
    const match = output.match(CLOUDFLARE_URL_PATTERN);
    if (match && !tunnelUrl) {
      tunnelUrl = match[0];
      displayTunnelInfo();
    }

    // Show stderr output
    process.stderr.write(output);
  });

  // Handle cloudflared exit
  cloudflaredProcess.on('close', (code) => {
    console.log(`\n❌ Cloudflared process exited with code ${code}`);
    if (viteProcess) {
      viteProcess.kill();
    }
    process.exit(code);
  });
}

function displayTunnelInfo() {
  console.log('\n' + '='.repeat(80));
  console.log('🎉 STAGING ENVIRONMENT READY!');
  console.log('='.repeat(80));
  console.log(`\n📍 Local:      http://localhost:${PORT}`);
  console.log(`🌍 Public:     ${tunnelUrl}`);
  console.log('\n' + '='.repeat(80));
  console.log('💡 Share the public URL to test on any device!');
  console.log('⚠️  Press Ctrl+C to stop both servers');
  console.log('='.repeat(80) + '\n');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...');
  if (viteProcess) viteProcess.kill();
  if (cloudflaredProcess) cloudflaredProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down...');
  if (viteProcess) viteProcess.kill();
  if (cloudflaredProcess) cloudflaredProcess.kill();
  process.exit(0);
});
