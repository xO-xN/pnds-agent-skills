const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');
const net = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const { io } = require('socket.io-client');
const delay = ms => new Promise(r => setTimeout(r, ms));
async function port() { const s = net.createServer(); s.listen(0, '127.0.0.1'); await once(s,'listening'); const p=s.address().port; await new Promise(r=>s.close(r)); return p; }
async function until(read, expected) { for(let i=0;i<550;i++){ const value=await read(); if(expected(value))return value; await delay(20); } throw new Error('observable state timeout'); }
test('CM1 cold state, START and bounded end through real server', async t => {
  const performerPort=await port(), monitorPort=await port();
  const claimsPath=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cm1-test-')),'claims.json');
  const child=spawn(process.execPath,[path.resolve(__dirname,'../server.cjs'),'--audio-mode','none'],{env:{...process.env,CM1_CLAIMS_PATH:claimsPath,CM1_PERFORMER_PORT:String(performerPort),CM1_MONITOR_PORT:String(monitorPort),PNDS_HOST_IP:'127.0.0.1',PNDS_PERFORMER_URL:`http://127.0.0.1:${performerPort}/?ensemble=CM1#player`},stdio:['ignore','pipe','pipe']});
  let errors=''; child.stderr.on('data',b=>errors+=b);
  const exit=once(child,'exit');
  t.after(async()=>{child.kill('SIGTERM'); const [code]=await exit; assert.equal(code,0,errors);});
  const origin=`http://127.0.0.1:${performerPort}`;
  const get=async p => (await fetch(origin+p)).json();
  const health=await until(async()=>{try{return await get('/__pnds/health')}catch{return null}},s=>s?.status==='ready');
  assert.equal(health.audio.status,'disabled');
  assert.equal((await get('/state')).phase,'waiting');
  assert.match(await (await fetch(`http://127.0.0.1:${monitorPort}/`)).text(),/START/);
  const connect=()=>{const client=io(origin,{transports:['websocket'],autoConnect:false,reconnection:false});t.after(()=>client.close());client.connect();return client;};
  const observer=connect();let latest;observer.on('cm1:state',s=>latest=s);
  await until(()=>latest,s=>s?.players.length===2);
  assert.deepEqual(latest.players.map(p=>p.online),[false,false]);
  const first=connect();await once(first,'connect');first.emit('cm1:join',{id:1});const [joined]=await once(first,'cm1:joined');
  assert.equal(joined.identity,1);assert.equal(joined.recovered,false);assert.deepEqual(joined.restore,{frequency:0.5,gain:0.2});
  const duplicate=connect();await once(duplicate,'connect');duplicate.emit('cm1:join',{id:1});const [rejected]=await once(duplicate,'cm1:rejected');assert.equal(rejected.reason,'Player ID already claimed');
  const second=connect();await once(second,'connect');second.emit('cm1:join',{id:2});await once(second,'cm1:joined');
  // Two controls delivered independently without a shared active-touch variable.
  first.emit('cm1:control',{frequency:0.8});first.emit('cm1:control',{gain:0.6});
  await until(()=>get('/state'),s=>s.tone.frequency===0.8&&s.tone.gain===0.6);
  first.close();
  const recovered=connect();await once(recovered,'connect');recovered.emit('cm1:join',{token:joined.token,id:2});const [restored]=await once(recovered,'cm1:joined');
  assert.equal(restored.identity,1);assert.equal(restored.recovered,true);assert.deepEqual(restored.restore,{frequency:0.8,gain:0.6});
  await until(()=>get('/state'),s=>s.players.every(p=>p.online));
  // A monitor observer never consumes a player claim; malformed controls do not replace valid state.
  recovered.emit('cm1:control',{frequency:-1,gain:'loud'});await delay(50);assert.deepEqual((await get('/state')).tone,{frequency:0.8,gain:0.6});
  const fullUrl=`http://127.0.0.1:${performerPort}/?ensemble=CM1#player`;
  assert.equal((await fetch(fullUrl)).status,200);
  assert.ok((await(await fetch(`http://127.0.0.1:${monitorPort}/config.js`)).text()).includes(fullUrl));
  const qr=await fetch(`http://127.0.0.1:${monitorPort}/qr`);assert.equal(qr.headers.get('content-type'),'image/png');const qrBytes=Buffer.from(await qr.arrayBuffer());if(process.env.CM1_EVIDENCE_DIR){fs.writeFileSync(path.join(process.env.CM1_EVIDENCE_DIR,'full-url-qr.png'),qrBytes);fs.writeFileSync(path.join(process.env.CM1_EVIDENCE_DIR,'full-url-expected.txt'),fullUrl+'\n');}
  assert.deepEqual([...qrBytes.slice(0,8)],[137,80,78,71,13,10,26,10]);
  for(const name of ['theme-follow','locale-follow']){assert.equal((await fetch(`http://127.0.0.1:${monitorPort}/__pnds/${name}.js`)).status,200);assert.equal((await fetch(`${origin}/__pnds/${name}.js`)).status,404);}
  await fetch(`http://127.0.0.1:${monitorPort}/start`,{method:'POST'});
  assert.equal((await get('/state')).phase,'running');
  assert.equal((await fetch(`http://127.0.0.1:${monitorPort}/start`,{method:'POST'})).status,409);
  await until(()=>get('/state'),s=>s.phase==='ended');
  assert.equal((await get('/state')).audioVoices,0);
  child.kill('SIGTERM');const [firstExit]=await exit;assert.equal(firstExit,0,errors);
  const restart=spawn(process.execPath,[path.resolve(__dirname,'../server.cjs'),'--audio-mode','none'],{env:{...process.env,CM1_CLAIMS_PATH:claimsPath,CM1_PERFORMER_PORT:String(performerPort),CM1_MONITOR_PORT:String(monitorPort),PNDS_HOST_IP:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
  const restartExit=once(restart,'exit');t.after(async()=>{restart.kill('SIGTERM');const [code]=await restartExit;assert.equal(code,0);});
  await until(async()=>{try{return await get('/__pnds/health')}catch{return null}},s=>s?.status==='ready');
  assert.equal((await get('/state')).phase,'waiting','new server has a fresh bounded performance');
  assert.deepEqual((await get('/state')).players.map(p=>p.claimed),[true,true]);
  assert.deepEqual((await get('/state')).players.map(p=>p.online),[false,false]);
  const afterRestart=connect();await once(afterRestart,'connect');afterRestart.emit('cm1:join',{token:joined.token});const [restartRestore]=await once(afterRestart,'cm1:joined');
  assert.equal(restartRestore.identity,1);assert.equal(restartRestore.recovered,true);assert.deepEqual(restartRestore.restore,{frequency:0.8,gain:0.6});
});
