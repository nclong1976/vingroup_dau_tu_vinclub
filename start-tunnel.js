import localtunnel from 'localtunnel';
import fs from 'fs';
import path from 'path';

(async () => {
  try {
    console.log("Starting localtunnel on port 3000...");
    const tunnel = await localtunnel({ port: 3000 });

    console.log("Tunnel is active at URL:", tunnel.url);

    // Read the current .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Replace or append APP_URL
    if (envContent.includes('APP_URL=')) {
      envContent = envContent.replace(/APP_URL="[^"]*"/g, `APP_URL="${tunnel.url}"`);
      envContent = envContent.replace(/APP_URL='[^']*'/g, `APP_URL="${tunnel.url}"`);
      envContent = envContent.replace(/APP_URL=[^\r\n]*/g, `APP_URL="${tunnel.url}"`);
    } else {
      envContent += `\nAPP_URL="${tunnel.url}"`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log("Updated .env with APP_URL:", tunnel.url);

    // Call the setup-webhook API endpoint
    try {
      console.log("Registering webhook with Telegram...");
      const setupRes = await fetch("http://localhost:3000/api/telegram/setup-webhook");
      const setupData = await setupRes.json();
      console.log("Telegram Webhook Registration Response:", setupData);
    } catch (e) {
      console.log("Could not register webhook yet (server might be starting up). We will register it shortly.");
    }

    tunnel.on('close', () => {
      console.log('Tunnel closed.');
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });

    // Keep-alive: Prevent Node.js from exiting
    setInterval(() => {
      // Keep-alive loop
    }, 1000 * 60 * 60);

  } catch (err) {
    console.error("Error starting localtunnel:", err);
  }
})();
