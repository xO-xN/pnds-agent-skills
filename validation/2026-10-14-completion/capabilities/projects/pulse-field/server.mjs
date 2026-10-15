import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import dgram from 'node:dgram';
const root=import.meta.dirname;
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const index=process.argv.indexOf('--audio-mode');
const mode=index<0?manifest.audio.defaultMode:process.argv[index+1];
if(mode!=='internal')throw new Error('Pulse Field supports Internal only; sound must not silently become None');
const target=process.env.PNDS_OSC_TARGET;
const match=/^127\.0\.0\.1:(\d+)$/.exec(target??'');
if(!match||Number(match[1])<1||Number(match[1])>65535)throw new Error('Internal requires injected loopback PNDS_OSC_TARGET');
const outputBus=Number(process.env.PNDS_AUDIO_OUTPUT_BUS);
if(!Number.isInteger(outputBus)||outputBus<1||outputBus>2147483646||process.env.PNDS_AUDIO_OUTPUT_CHANNELS!=='1')throw new Error('Internal mono requires an injected private output bus and one output channel');
const groupId=1000;
let nodeId=1001,sequence=1,status='starting',audioStatus='starting',audioError=null,serverError=null,groupOwned=false,stopping=false;
const udp=dgram.createSocket('udp4');
const pending=new Map();
function text(value){const b=Buffer.from(value+'\0');return Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);}
function packet(address,args=[]){
 return Buffer.concat([text(address),text(','+args.map(x=>x[0]).join('')),...args.map(([type,value])=>{if(type==='s')return text(value);const b=Buffer.alloc(4);if(type==='i')b.writeInt32BE(value);else b.writeFloatBE(value);return b;})]);
}
function send(address,args=[]){return new Promise((resolve,reject)=>udp.send(packet(address,args),Number(match[1]),match[0].split(':')[0],error=>error?reject(error):resolve()));}
function sync(){
 const id=sequence++;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(id);reject(new Error('scsynth acknowledgement timeout'));},1200);
  pending.set(id,{resolve:()=>{clearTimeout(timer);pending.delete(id);resolve();},reject:error=>{clearTimeout(timer);pending.delete(id);reject(error);}});
  send('/sync',[['i',id]]).catch(error=>pending.get(id)?.reject(error));
 });
}
udp.on('message',(b,remote)=>{
 if(remote.address!=='127.0.0.1'||remote.port!==Number(match[1]))return;
 try{
  let offset=0;const read=()=>{const end=b.indexOf(0,offset);if(end<offset)throw new Error('invalid OSC string');const value=b.toString('utf8',offset,end);offset=(end+4)&~3;return value;};
  const address=read(),tags=read();
  if(address==='/synced'&&tags===',i')pending.get(b.readInt32BE(offset))?.resolve();
  if(address==='/fail'){
   const error=new Error('scsynth rejected project command');audioError=error.message;audioStatus='error';status='error';
   for(const wait of [...pending.values()])wait.reject(error);
  }
 }catch{/* Ignore malformed or unrelated replies; pending sync has a bounded deadline. */}
});
udp.on('error',error=>{audioError=error.message;audioStatus='error';status='error';for(const wait of [...pending.values()])wait.reject(error);});
const assets=new Map([['/monitor.js',['monitor.js','text/javascript']],['/style.css',['style.css','text/css']]]);
const servers=[];
const listenerReady=[];
for(const role of ['performer','monitor']){
 const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;res.setHeader('Cache-Control','no-store');
  if(pathname==='/__pnds/health'){
   res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({status,projectId:manifest.id,audioMode:mode,audio:{status:audioStatus,target,error:audioError},scoreServer:{performerPort:manifest.scoreServer.performerPort,monitorPort:manifest.scoreServer.monitorPort,error:serverError}}));
  }
  if(pathname==='/start'&&req.method==='POST'&&role==='monitor'){
   if(status!=='ready'){res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({accepted:false,error:'not-ready'}));}
   if(nodeId>=2147480000){res.writeHead(503);return res.end('project node range exhausted');}
   try{
    const voice=nodeId++;
    await send('/s_new',[['s','pulseField'],['i',voice],['i',1],['i',groupId],['s','out'],['i',outputBus],['s','freq'],['f',220],['s','gain'],['f',0.05],['s','duration'],['f',12]]);
    res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({accepted:true,voice}));
   }catch(error){audioError=error.message;audioStatus='error';status='error';res.writeHead(503);return res.end('audio-send-failed');}
  }
  const asset=pathname==='/'?[role+'.html','text/html']:assets.get(pathname);
  if(!asset){res.writeHead(404);return res.end('not found');}
  res.setHeader('Content-Type',asset[1]);res.end(fs.readFileSync(path.join(root,'public',asset[0])));
 });
 listenerReady.push(new Promise((resolve,reject)=>{server.once('error',error=>{serverError=error.message;status='error';reject(error);});server.listen(manifest.scoreServer[role+'Port'],'0.0.0.0',resolve);}));
 servers.push(server);
}
async function initialize(){
 try{
  await new Promise((resolve,reject)=>{udp.once('error',reject);udp.bind(0,'127.0.0.1',resolve);});
  await Promise.all(listenerReady);
  if(stopping)return;
  await send('/d_load',[['s',path.join(root,manifest.audio.synthdefs[0])]]);await sync();
  if(stopping)return;
  groupOwned=true;await send('/g_new',[['i',groupId],['i',1],['i',0]]);await sync();
  if(stopping)return;
  audioStatus='ready';status='ready';
 }catch(error){if(!stopping){audioError=error.message;audioStatus='error';status='error';}}
}
async function shutdown(){
 if(stopping)return;stopping=true;status='stopping';
 for(const wait of [...pending.values()])wait.reject(new Error('project stopping'));
 await Promise.all(servers.map(server=>new Promise(resolve=>{server.close(resolve);server.closeIdleConnections();server.closeAllConnections();})));
 try{if(groupOwned){await send('/n_free',[['i',groupId]]);await sync();}}catch(error){console.error('Project cleanup:',error.message);process.exitCode=1;}
 await new Promise(resolve=>udp.close(resolve));
}
process.on('SIGINT',()=>void shutdown());process.on('SIGTERM',()=>void shutdown());
void initialize();
