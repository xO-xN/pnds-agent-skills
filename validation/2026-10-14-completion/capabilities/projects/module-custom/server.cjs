const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {qrHandler} = require('./modules/pnds-qr/qr');
const m = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const modeIndex = process.argv.indexOf('--audio-mode');
const mode = modeIndex < 0 ? m.audio.defaultMode : process.argv[modeIndex + 1];
if (mode !== 'none') throw new Error('Existing Score supports None only');
const performerUrl = process.env.PNDS_PERFORMER_URL || `http://${process.env.PNDS_HOST_IP || '127.0.0.1'}:${m.scoreServer.performerPort}/`;
const qr = qrHandler(performerUrl);
const servers = [];
let status = 'starting', readyCount = 0, stopping = false;
// The supplied module accepts an Express-compatible response API.
function qrResponse(res) {
  return {
    status(code) {res.statusCode = code; return this;},
    json(value) {res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value));},
    type(value) {res.setHeader('Content-Type', value); return this;},
    send(value) {res.end(value);},
  };
}
for (const [port, role] of [[m.scoreServer.performerPort, 'performer'], [m.scoreServer.monitorPort, 'monitor']]) {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    res.setHeader('Cache-Control', 'no-store');
    if (pathname === '/__pnds/health') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({status, projectId: m.id, audioMode: mode,
        audio: {status: 'disabled', target: null, error: null},
        scoreServer: {performerPort: m.scoreServer.performerPort, monitorPort: m.scoreServer.monitorPort, error: null}}));
    }
    if (pathname === '/__config.js') {
      res.setHeader('Content-Type', 'text/javascript');
      return res.end('window.PNDS_CONFIG = ' + JSON.stringify({projectId: m.id, role, performerUrl}) + ';');
    }
    if (pathname === '/qr' && role === 'monitor') { res.setHeader('X-PNDS-QR-Source', 'project-custom'); return void qr(req, qrResponse(res)); }
    if (pathname === '/') {
      res.setHeader('Content-Type', 'text/html');
      return res.end(fs.readFileSync(path.join(__dirname, 'public', role + '.html')));
    }
    res.statusCode = 404; res.end('not found');
  });
  server.once('error', (error) => {console.error(error.message); shutdown(1);});
  server.listen(port, '0.0.0.0', () => {if (++readyCount === 2) status = 'ready';});
  servers.push(server);
}
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true; status = 'stopping';
  Promise.all(servers.map(server => new Promise(resolve => {
    server.close(resolve); server.closeIdleConnections(); server.closeAllConnections();
  }))).then(() => {process.exitCode = code;});
}
process.on('SIGTERM', () => shutdown());
process.on('SIGINT', () => shutdown());
