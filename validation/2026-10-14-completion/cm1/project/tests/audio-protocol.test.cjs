const {test}=require('node:test');
const assert=require('node:assert/strict');
const dgram=require('node:dgram');
const net=require('node:net');
const os=require('node:os');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const osc=require('osc-min');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function port(){const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function setup(t,failGroup){
 const target=dgram.createSocket('udp4');target.bind(0,'127.0.0.1');await once(target,'listening');t.after(()=>target.close());
 const packets=[];
 target.on('message',(bytes,peer)=>{const packet=osc.fromBuffer(bytes);packets.push(packet);let response;
 if(packet.address==='/g_new'&&failGroup)response={address:'/fail',args:[{type:'string',value:'/g_new'},{type:'string',value:'Controlled group creation failure'}]};
 if(packet.address==='/sync')response={address:'/synced',args:packet.args};
 if(response)target.send(osc.toBuffer(response),peer.port,peer.address);
 });
 const performerPort=await port(),monitorPort=await port();
 const child=spawn(process.execPath,[path.resolve(__dirname,'../server.cjs'),'--audio-mode','internal'],{env:{...process.env,CM1_CLAIMS_PATH:path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cm1-audio-test-')),'claims.json'),CM1_PERFORMER_PORT:String(performerPort),CM1_MONITOR_PORT:String(monitorPort),PNDS_HOST_IP:'127.0.0.1',PNDS_OSC_TARGET:`127.0.0.1:${target.address().port}`,PNDS_AUDIO_OUTPUT_BUS:'24',PNDS_AUDIO_OUTPUT_CHANNELS:'2'},stdio:['ignore','pipe','pipe']});
 let log='';child.stderr.on('data',b=>log+=b);const exit=once(child,'exit');let stopped=false;exit.then(()=>stopped=true);
 t.after(async()=>{if(!stopped){child.kill('SIGTERM');await exit;}});
 return {child,exit,packets,performerPort,monitorPort,get log(){return log},get stopped(){return stopped}};
}
test('Internal group creation failure never reports ready',async t=>{
 const s=await setup(t,true);let becameReady=false;
 for(let i=0;i<100&&!s.stopped;i++){try{becameReady||=(await(await fetch(`http://127.0.0.1:${s.performerPort}/__pnds/health`)).json()).status==='ready';}catch{}if(becameReady)break;await delay(20);}
 assert.equal(becameReady,false,'a failed audio group must block ready');assert.equal(s.stopped,true);const [code]=await s.exit;assert.equal(code,1);assert.match(s.log,/Controlled group creation failure/);
});
test('Internal wire protocol owns a group, maps shared tone to Host bus and cleans only its resources',async t=>{
 const s=await setup(t,false);let health;
 for(let i=0;i<100;i++){try{health=await(await fetch(`http://127.0.0.1:${s.performerPort}/__pnds/health`)).json();}catch{}if(health?.status==='ready')break;await delay(20);}
 assert.equal(health.status,'ready');assert.equal(health.audio.status,'ready');assert.equal(health.audio.target.startsWith('127.0.0.1:'),true);
 const root=s.packets.find(p=>p.address==='/g_new').args[0].value;
 assert.deepEqual(s.packets.filter(p=>p.address==='/g_new').map(p=>p.args.slice(1).map(a=>a.value)),[[1,0]]);
 await fetch(`http://127.0.0.1:${s.monitorPort}/start`,{method:'POST'});
 for(let i=0;i<50&&!s.packets.some(p=>p.address==='/s_new');i++)await delay(20);
 const creation=s.packets.find(p=>p.address==='/s_new').args.map(a=>a.value);
 assert.equal(creation[0],'cm1-tone');assert.deepEqual(creation.slice(2,6),[0,root,'out',24]);assert.equal(creation[7],550);assert.ok(Math.abs(creation[9]-0.04)<1e-6);
 // Actual eight-second fixture duration; do not accelerate the source's musical timing.
 for(let i=0;i<500&&!s.packets.some(p=>p.address==='/n_set'&&p.args.some(a=>a.value==='gate'));i++)await delay(20);
 const release=s.packets.find(p=>p.address==='/n_set'&&p.args.some(a=>a.value==='gate'));
 assert.deepEqual(release.args.slice(1).map(a=>a.value),['gate',0]);
 s.child.kill('SIGTERM');const [code]=await s.exit;assert.equal(code,0,s.log);
 assert.deepEqual(s.packets.filter(p=>p.address==='/n_free').map(p=>p.args.map(a=>a.value)),[[root]]);
 assert.equal(s.packets.some(p=>['/quit','/g_freeAll'].includes(p.address)),false);
});
