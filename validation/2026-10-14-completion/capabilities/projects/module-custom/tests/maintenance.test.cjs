const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net');
const {spawn}=require('node:child_process');
const {setTimeout:delay}=require('node:timers/promises');
const root=path.resolve(__dirname,'..');
async function launch(t,mode='none') {
 const copy=fs.mkdtempSync(path.join(os.tmpdir(),'pnds-runtime-case-'));
 fs.cpSync(root,copy,{recursive:true});
 const listeners=[net.createServer(),net.createServer()];
 await Promise.all(listeners.map(s=>new Promise((resolve,reject)=>{s.once('error',reject);s.listen(0,'127.0.0.1',resolve);}))); 
 const manifest=JSON.parse(fs.readFileSync(path.join(copy,'manifest.json')));
 manifest.scoreServer.performerPort=listeners[0].address().port;manifest.scoreServer.monitorPort=listeners[1].address().port;
 await Promise.all(listeners.map(s=>new Promise(r=>s.close(r))));
 fs.writeFileSync(path.join(copy,'manifest.json'),JSON.stringify(manifest));
 const child=spawn(process.execPath,[path.join(copy,'server.cjs'),'--audio-mode',mode],{cwd:copy,stdio:'pipe'});
 let output='';child.stderr.on('data',b=>output+=b);
 const closed=new Promise(r=>child.once('close',(code,signal)=>r({code,signal})));
 t.after(async()=>{child.kill('SIGTERM');const exit=await Promise.race([closed,delay(2000).then(()=>null)]);if(!exit){child.kill('SIGKILL');await closed;assert.fail('shutdown exceeded two seconds');}fs.rmSync(copy,{recursive:true,force:true});});
 return {manifest,child,closed,get output(){return output;}};
}
test('selected LAN reaches original performer/monitor after matching loopback health; clean stop',async t=>{
 const run=await launch(t),m=run.manifest;
 const addresses=Object.values(os.networkInterfaces()).flat().filter(x=>x.family==='IPv4'&&!x.internal);
 assert.ok(addresses.length,'test requires actual nonloopback LAN address');const lan=addresses[0].address;
 const performer=`http://127.0.0.1:${m.scoreServer.performerPort}/`;let health;
 for(let i=0;i<80;i++){try{health=await(await fetch(performer+'__pnds/health',{signal:AbortSignal.timeout(100)})).json();if(health.status==='ready')break;}catch{}await delay(25);}
 assert.deepEqual(health,{status:'ready',projectId:m.id,audioMode:'none',audio:{status:'disabled',target:null,error:null},scoreServer:{performerPort:m.scoreServer.performerPort,monitorPort:m.scoreServer.monitorPort,error:null}});
 for(const role of ['performer','monitor']){const r=await fetch(`http://${lan}:${m.scoreServer[role+'Port']}/`,{signal:AbortSignal.timeout(1000)});assert.equal(r.status,200);assert.equal(await r.text(),fs.readFileSync(path.join(root,'public',role+'.html'),'utf8'));}
 run.child.kill('SIGTERM');assert.deepEqual(await Promise.race([run.closed,delay(2000).then(()=>null)]),{code:0,signal:null});
 await assert.rejects(fetch(performer+'__pnds/health',{signal:AbortSignal.timeout(200)}));
});
test('unsupported Internal mode exits before ready and preserves None policy',async t=>{
 const run=await launch(t,'internal');const exit=await Promise.race([run.closed,delay(1500).then(()=>null)]);
 assert.ok(exit,'unsupported mode must exit');assert.equal(exit.code,1);assert.match(run.output,/None|none/);
});

test('project custom QR source survives maintenance and still serves 360px PNG plus project header',async t=>{
 const run=await launch(t),m=run.manifest;
 const base=`http://127.0.0.1:${m.scoreServer.monitorPort}/`;
 for(let i=0;i<80;i++){try{const h=await(await fetch(base+'__pnds/health')).json();if(h.status==='ready')break;}catch{}await delay(25);}
 const response=await fetch(base+'qr');assert.equal(response.status,200);
 const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.readUInt32BE(16),360);assert.equal(bytes.readUInt32BE(20),360);
 assert.equal(response.headers.get('x-pnds-qr-source'),'project-custom');
 assert.equal((await fetch(`http://127.0.0.1:${m.scoreServer.performerPort}/qr`)).status,404);
});
