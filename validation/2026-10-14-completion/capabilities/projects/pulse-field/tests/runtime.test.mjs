import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import dgram from 'node:dgram';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const root=path.resolve(import.meta.dirname,'..');
// Independent test-side OSC subset receiver; expected messages come from the approved plan.
const string=value=>{const b=Buffer.from(value+'\0');return Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);};
function reply(address,value){const int=Buffer.alloc(4);int.writeInt32BE(value);return Buffer.concat([string(address),string(',i'),int]);}
function decode(b){let at=0;const read=()=>{const end=b.indexOf(0,at);assert.ok(end>=at);const v=b.toString('utf8',at,end);at=(end+4)&~3;return v;};const address=read(),tags=read(),args=[];for(const type of tags.slice(1)){if(type==='s')args.push(read());else{args.push(type==='i'?b.readInt32BE(at):b.readFloatBE(at));at+=4;}}return {address,args};}
async function launch(t,{acknowledge=true,fail=false}={}){
 const copy=fs.mkdtempSync(path.join(os.tmpdir(),'pulse-field-test-'));fs.cpSync(root,copy,{recursive:true});
 const listeners=[net.createServer(),net.createServer()];await Promise.all(listeners.map(s=>new Promise(r=>s.listen(0,'127.0.0.1',r))));
 const m=JSON.parse(fs.readFileSync(path.join(copy,'manifest.json')));m.scoreServer.performerPort=listeners[0].address().port;m.scoreServer.monitorPort=listeners[1].address().port;await Promise.all(listeners.map(s=>new Promise(r=>s.close(r))));fs.writeFileSync(path.join(copy,'manifest.json'),JSON.stringify(m));
 const udp=dgram.createSocket('udp4');await new Promise(r=>udp.bind(0,'127.0.0.1',r));const messages=[];
 udp.on('message',(b,remote)=>{const message=decode(b);messages.push(message);if(message.address==='/sync'&&acknowledge){if(fail){udp.send(Buffer.concat([string('/fail'),string(',ss'),string('/d_load'),string('fixture rejected SynthDef')]),remote.port,remote.address);}else udp.send(reply('/synced',message.args[0]),remote.port,remote.address);}});
 const target=`127.0.0.1:${udp.address().port}`;
 const child=spawn(process.execPath,[path.join(copy,'server.mjs'),'--audio-mode','internal'],{cwd:copy,env:{...process.env,PNDS_HOST_IP:'127.0.0.1',PNDS_OSC_TARGET:target,PNDS_AUDIO_OUTPUT_BUS:'8',PNDS_AUDIO_OUTPUT_CHANNELS:'1'},stdio:'pipe'});
 let output='';child.stderr.on('data',b=>output+=b);const closed=new Promise(r=>child.once('close',(code,signal)=>r({code,signal})));
 t.after(async()=>{child.kill('SIGTERM');let exit=await Promise.race([closed,delay(3500).then(()=>null)]);if(!exit){child.kill('SIGKILL');await closed;assert.fail('graceful cleanup exceeded deadline');}udp.close();fs.rmSync(copy,{recursive:true,force:true});});
 const healthUrl=`http://127.0.0.1:${m.scoreServer.performerPort}/__pnds/health`;
 async function health(status){for(let i=0;i<100;i++){try{const h=await(await fetch(healthUrl,{signal:AbortSignal.timeout(100)})).json();if(h.status===status)return h;}catch{}await delay(30);}assert.fail('health timeout '+output);}
 return {copy,m,target,child,closed,messages,health,healthUrl,monitor:`http://127.0.0.1:${m.scoreServer.monitorPort}/`,performer:`http://127.0.0.1:${m.scoreServer.performerPort}/`};
}
test('Internal ready requires owned group acknowledgement; repeated monitor START sends independent mono twelve-second voices and cleans only its group',async t=>{
 const run=await launch(t);const h=await run.health('ready');
 assert.deepEqual(h,{status:'ready',projectId:'pulse-field',audioMode:'internal',audio:{status:'ready',target:run.target,error:null},scoreServer:{performerPort:run.m.scoreServer.performerPort,monitorPort:run.m.scoreServer.monitorPort,error:null}});
 assert.deepEqual(run.messages.filter(x=>x.address==='/g_new').map(x=>x.args),[[1000,1,0]]);
 assert.ok(run.messages.some(x=>x.address==='/d_load'&&x.args[0].endsWith('/pulseField.scsyndef')));
 for(let i=0;i<2;i++){const r=await fetch(run.monitor+'start',{method:'POST'});assert.equal(r.status,200);assert.equal((await r.json()).accepted,true);}
 await delay(20);
 const voices=run.messages.filter(x=>x.address==='/s_new');assert.equal(voices.length,2);
 for(const [i,v]of voices.entries()){assert.equal(v.args[0],'pulseField');assert.equal(v.args[1],1001+i);assert.deepEqual(v.args.slice(2,6),[1,1000,'out',8]);assert.equal(v.args[6],'freq');assert.equal(v.args[7],220);assert.equal(v.args[8],'gain');assert.ok(Math.abs(v.args[9]-0.05)<1e-7);assert.deepEqual(v.args.slice(10),['duration',12]);}
 assert.equal((await fetch(run.performer+'start',{method:'POST'})).status,404);
 assert.match(await(await fetch(run.performer)).text(),/Observe the visual score/);
 assert.match(await(await fetch(run.monitor)).text(),/START/);
 run.child.kill('SIGTERM');assert.deepEqual(await Promise.race([run.closed,delay(3000).then(()=>null)]),{code:0,signal:null});
 assert.deepEqual(run.messages.filter(x=>x.address==='/n_free').map(x=>x.args),[[1000]]);
 assert.ok(!run.messages.some(x=>x.address==='/quit'||x.address==='/g_freeAll'));
 await assert.rejects(fetch(run.healthUrl,{signal:AbortSignal.timeout(200)}));
});
test('missing scsynth acknowledgements remain unready and explicitly fail without starting a voice',async t=>{
 const run=await launch(t,{acknowledge:false});const h=await run.health('error');
 assert.equal(h.audio.status,'error');assert.match(h.audio.error,/acknowledgement timeout/);
 assert.ok(!run.messages.some(x=>x.address==='/g_new'||x.address==='/s_new'));
 const response=await fetch(run.monitor+'start',{method:'POST'});assert.equal(response.status,503);assert.equal((await response.json()).accepted,false);
});
test('scsynth rejects load: health exposes error, START is refused, no root voice or engine quit',async t=>{
 const run=await launch(t,{fail:true});const h=await run.health('error');
 assert.equal(h.audio.status,'error');assert.match(h.audio.error,/rejected project command/);
 assert.equal((await fetch(run.monitor+'start',{method:'POST'})).status,503);
 assert.ok(!run.messages.some(x=>x.address==='/s_new'||x.address==='/quit'));
});
