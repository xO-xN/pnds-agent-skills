const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const express = require('express');
const { Server } = require('socket.io');
const { attachPlayers } = require('./modules/pnds-players/protocol');
const { qrHandler } = require('./modules/pnds-qr/qr');
const { createAudio } = require('./audio.cjs');
const manifest = require('./manifest.json');
const arg = process.argv.indexOf('--audio-mode');
const mode = arg < 0 ? manifest.audio.defaultMode : process.argv[arg + 1];
if (!manifest.audio.supportedModes.includes(mode)) throw new Error('Unsupported audio mode');
const ports = { performerPort: Number(process.env.CM1_PERFORMER_PORT || manifest.scoreServer.performerPort), monitorPort: Number(process.env.CM1_MONITOR_PORT || manifest.scoreServer.monitorPort) };
const performerUrl = process.env.PNDS_PERFORMER_URL || `http://${process.env.PNDS_HOST_IP || '127.0.0.1'}:${ports.performerPort}/`;
const origin = `http://127.0.0.1:${ports.performerPort}`;
const events = { join:'cm1:join',joined:'cm1:joined',rejected:'cm1:rejected',control:'cm1:control',action:'cm1:action',state:'cm1:state' };
const performer=express(), monitor=express();
const performerServer=http.createServer(performer), monitorServer=http.createServer(monitor);
const io=new Server(performerServer,{cors:{origin:true}});
const claims=new Map(), live=new Map();
const claimsPath=process.env.CM1_CLAIMS_PATH || path.join(__dirname,'claims.json');
if(fs.existsSync(claimsPath)) for(const [key,value] of Object.entries(JSON.parse(fs.readFileSync(claimsPath)))) claims.set(key,value);
const persist=()=>fs.writeFileSync(claimsPath,JSON.stringify(Object.fromEntries(claims)));
const audio=createAudio(mode);
let phase='waiting', startedAt=null, endTimer=null, status='starting';
const durationMs=8000;
let tone={frequency:0.5,gain:0.2};
function snapshot(){return {phase,startedAt,durationMs,serverTime:Date.now(),tone,audioVoices:audio.voices,players:[1,2].map(id=>({id,claimed:[...claims.values()].some(c=>c.id===id),online:[...live.values()].some(token=>claims.get(token)?.id===id)}))};}
const players=attachPlayers(io,{events,policy:{
  join({socketId,token,payload}){
    let recovered=claims.has(token);
    if(!recovered){const id=payload?.id;if(![1,2].includes(id))return {status:'rejected',reason:'Choose Player 1 or 2'};if([...claims.values()].some(c=>c.id===id))return {status:'rejected',reason:'Player ID already claimed'};token=crypto.randomUUID();claims.set(token,{id,controls:{frequency:0.5,gain:0.2}});persist();}
    // A persisted claim transfers to the reconnecting socket. Late packets and release from the previous socket are ignored.
    for(const [socket,claim] of live)if(claim===token)live.delete(socket);
    live.set(socketId,token);
    return {token,identity:claims.get(token).id,recovered,restore:claims.get(token).controls};
  },
  control({socketId,token},payload){if(live.get(socketId)!==token)return;const claim=claims.get(token);if(!payload||typeof payload!=='object')return;for(const key of ['frequency','gain'])if(Number.isFinite(payload[key])&&payload[key]>=0&&payload[key]<=1){claim.controls[key]=payload[key];tone={...tone,[key]:payload[key]};}persist();if(phase==='running')audio.controls(tone);},
  release({socketId,token}){if(live.get(socketId)===token)live.delete(socketId);},
  snapshot,
},onError:error=>console.error(error.message)});
function start(){if(phase!=='waiting')return false;phase='running';startedAt=Date.now();audio.start(tone);players.broadcast();endTimer=setTimeout(()=>{phase='ended';audio.end();players.broadcast();},durationMs);return true;}
performer.get('/__pnds/health',(req,res)=>res.json({status,projectId:manifest.id,audioMode:mode,audio:{status:mode==='none'?'disabled':status,target:mode==='none'?null:process.env.PNDS_OSC_TARGET,error:null},scoreServer:{...ports,error:null}}));
performer.get('/state',(req,res)=>res.json(snapshot()));
monitor.post('/start',(req,res)=>res.status(start()?200:409).json(snapshot()));
monitor.get('/qr',qrHandler(performerUrl,{format:'png',width:320}));
for(const app of [performer,monitor]){
 app.get('/config.js',(req,res)=>res.type('application/javascript').send(`window.CM1=${JSON.stringify({events,origin,performerUrl,tokenKey:manifest.id+'-claim-v1'})};`));
 app.get('/players-client.js',(req,res)=>res.sendFile(path.join(__dirname,'modules/pnds-players/client.js')));
 app.use('/assets',express.static(path.join(__dirname,'public')));
}
monitor.get('/socket.io/socket.io.js',(req,res)=>res.sendFile(path.join(__dirname,'node_modules/socket.io/client-dist/socket.io.js')));
monitor.get('/p5.js',(req,res)=>res.sendFile(path.join(__dirname,'node_modules/p5/lib/p5.min.js')));
for(const name of ['theme-follow','locale-follow'])monitor.get(`/__pnds/${name}.js`,(req,res)=>res.sendFile(path.join(__dirname,`modules/pnds-${name}/${name}.js`)));
performer.get('/',(req,res)=>res.sendFile(path.join(__dirname,'public/performer.html')));
monitor.get('/',(req,res)=>res.sendFile(path.join(__dirname,'public/monitor.html')));
async function listen(server,port){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'0.0.0.0',resolve);});}
let closing=false;
async function stop(){if(closing)return;closing=true;status='stopping';clearTimeout(endTimer);await players.close();await audio.close();await new Promise(r=>io.close(r));await Promise.all([performerServer,monitorServer].map(s=>new Promise(r=>s.close(r))));console.log('CM1 stopped cleanly');}
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>stop().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)}));
(async()=>{await audio.ready();await Promise.all([listen(performerServer,ports.performerPort),listen(monitorServer,ports.monitorPort)]);status='ready';console.log(JSON.stringify({status,ports,performerUrl}));})().catch(async error=>{console.error(error);await stop();process.exit(1);});
