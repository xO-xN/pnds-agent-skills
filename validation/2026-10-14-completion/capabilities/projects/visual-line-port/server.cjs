const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const modeIndex = process.argv.indexOf('--audio-mode');
const mode = modeIndex < 0 ? manifest.audio.defaultMode : process.argv[modeIndex + 1];
if (mode !== 'none') throw new Error('Cyan Twelve supports None mode only');
let status = 'starting';
let readyCount = 0;
const assets = new Map([
  ['/monitor.js', ['monitor.js', 'text/javascript; charset=utf-8']],
  ['/timeline.js', ['timeline.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);
const servers = ['performer', 'monitor'].map((role) => {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    res.setHeader('Cache-Control', 'no-store');
    if (pathname === '/__pnds/health') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({status, projectId: manifest.id, audioMode: mode,
        audio: {status: 'disabled', target: null, error: null},
        scoreServer: {performerPort: manifest.scoreServer.performerPort, monitorPort: manifest.scoreServer.monitorPort, error: null}}));
    }
    const asset = pathname === '/' ? [role + '.html', 'text/html; charset=utf-8'] : assets.get(pathname);
    if (!asset) { res.writeHead(404); return res.end('Not found'); }
    res.setHeader('Content-Type', asset[1]);
    return res.end(fs.readFileSync(path.join(__dirname, 'public', asset[0])));
  });
  server.once('error', (error) => {console.error(error.message); shutdown(1);});
  server.listen(manifest.scoreServer[role + 'Port'], '0.0.0.0', () => {
    readyCount += 1;
    if (readyCount === 2) status = 'ready';
  });
  return server;
});
let stopping = false;
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  status = 'stopping';
  Promise.all(servers.map(server => new Promise(resolve => {
    server.close(resolve);
    server.closeIdleConnections();
    server.closeAllConnections();
  }))).then(() => {process.exitCode = code;});
}
process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
