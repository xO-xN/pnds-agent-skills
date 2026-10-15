const dgram = require('node:dgram');
const osc = require('osc-min');
function createAudio(mode){
 let voices=0;
 if(mode==='none')return {get voices(){return voices;},ready:async()=>{},start:()=>{},controls:()=>{},end:()=>{},close:async()=>{}};
 const target=process.env.PNDS_OSC_TARGET;if(!target)throw new Error('Internal requires PNDS_OSC_TARGET');
 const [host,portText]=target.split(':');const port=Number(portText);
 const bus=Number(process.env.PNDS_AUDIO_OUTPUT_BUS||0), channels=Number(process.env.PNDS_AUDIO_OUTPUT_CHANNELS||2);
 if(!Number.isInteger(bus)||bus<0||channels!==2||!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid audio bus, channel count or target');
 const socket=dgram.createSocket('udp4');const group=200000000+Math.floor(Math.random()*100000000), synth=group+1;
 let failure=null;
 socket.on('message',bytes=>{try{const packet=osc.fromBuffer(bytes);if(packet.address==='/fail')failure=new Error(String(packet.args[1]?.value||'scsynth command failed'));}catch{}});
 const send=(address,args=[])=>socket.send(osc.toBuffer({address,args:args.map(v=>({type:typeof v==='string'?'string':Number.isInteger(v)?'integer':'float',value:v}))}),port,host);
 function sync(){return new Promise((resolve,reject)=>{const id=Math.floor(Math.random()*1000000);const timer=setTimeout(()=>{socket.off('message',read);reject(new Error('scsynth sync timed out'));},2000);function read(bytes){let packet;try{packet=osc.fromBuffer(bytes)}catch{return}if(packet.address==='/synced'&&packet.args[0]?.value===id){clearTimeout(timer);socket.off('message',read);if(failure)reject(failure);else resolve();}}socket.on('message',read);send('/sync',[id]);});}
 return {get voices(){return voices;},async ready(){await new Promise((r,j)=>{socket.once('error',j);socket.bind(0,'127.0.0.1',r)});send('/g_new',[group,1,0]);await sync();},start(tone){send('/s_new',['cm1-tone',synth,0,group,'out',bus,'freq',220+660*tone.frequency,'gain',0.2*tone.gain]);voices=1;},controls(tone){if(voices)send('/n_set',[synth,'freq',220+660*tone.frequency,'gain',0.2*tone.gain]);},end(){if(voices)send('/n_set',[synth,'gate',0]);voices=0;},async close(){send('/n_free',[group]);try{await sync();}finally{await new Promise(r=>socket.close(r));}}};
}
module.exports={createAudio};
