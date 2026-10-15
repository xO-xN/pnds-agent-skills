// Controlled protocol receiver for browser acceptance only; not scsynth/audio validation.
import fs from 'node:fs';
import path from 'node:path';
import dgram from 'node:dgram';
import {spawn} from 'node:child_process';
const source=path.resolve(process.argv[2]??'/tmp/pnds161-acceptance-projects/pulse-field');
const log=process.argv[3];
const udp=dgram.createSocket('udp4');
const records=[];
const text=value=>{const b=Buffer.from(value+'\0');return Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);};
udp.on('message',(b,r)=>{let at=0;const read=()=>{const end=b.indexOf(0,at),v=b.toString('utf8',at,end);at=(end+4)&~3;return v;};const address=read(),tags=read(),args=[];for(const t of tags.slice(1)){if(t==='s')args.push(read());else{args.push(t==='i'?b.readInt32BE(at):b.readFloatBE(at));at+=4;}}records.push({date:new Date().toISOString(),address,args});if(log)fs.writeFileSync(log,JSON.stringify(records,null,2)+'\n');if(address==='/sync'){const i=Buffer.alloc(4);i.writeInt32BE(args[0]);udp.send(Buffer.concat([text('/synced'),text(',i'),i]),r.port,r.address);}});
await new Promise(r=>udp.bind(0,'127.0.0.1',r));
const child=spawn(process.execPath,[path.join(source,'server.mjs'),'--audio-mode','internal'],{cwd:source,env:{...process.env,PNDS_OSC_TARGET:`127.0.0.1:${udp.address().port}`,PNDS_AUDIO_OUTPUT_BUS:'8',PNDS_AUDIO_OUTPUT_CHANNELS:'1'},stdio:'inherit'});
child.on('close',code=>{udp.close();process.exitCode=code??1;});
process.on('SIGTERM',()=>child.kill('SIGTERM'));process.on('SIGINT',()=>child.kill('SIGTERM'));
console.log(JSON.stringify({source,performer:'http://127.0.0.1:6878/',monitor:'http://127.0.0.1:6879/',receiver:'controlled OSC acknowledgements; not audio engine'}));
