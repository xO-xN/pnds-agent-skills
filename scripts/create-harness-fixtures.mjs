import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
if (!input) throw new Error('usage: node scripts/create-harness-fixtures.mjs <new-output-directory>');
const output = path.resolve(input);
if (fs.existsSync(output)) throw new Error('fixture output already exists; choose a new directory');
fs.mkdirSync(output, { recursive: true });
const write = (name, content) => { const file = path.join(output, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
write('browser-source/index.html', `<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pulse Field</title><style>body{background:#112033;color:#fff;font-family:system-ui}#score{height:100px;width:100px;background:#61d9ed}button{font-size:20px}</style><button id="start">START</button><div id="score"></div><script>
let began=0, audio; const duration=12000;
document.querySelector('#start').onclick=()=>{audio??=new AudioContext();audio.resume();const oscillator=audio.createOscillator(), gain=audio.createGain();oscillator.frequency.value=220;gain.gain.value=0.05;oscillator.connect(gain).connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+12);began=performance.now();};
function frame(t){if(began){const elapsed=t-began;document.querySelector('#score').style.width=Math.min(600,100+elapsed/24)+'px';if(elapsed>=duration)began=0;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
</script></html>`);
write('browser-source/README.md', '# Pulse Field\nOriginal is a standalone browser work. START runs a 12-second widening cyan block with one continuous 220 Hz sine tone. No TouchOSC, p5 or SuperCollider material exists. The author has not yet chosen how PNDS should reproduce browser audio.\n');
write('partial-source/description.txt', 'A Max patch controls eight loudspeakers from gestures. The patch and sample files are not supplied. The creator wants to assess PNDS possibilities; no rewrite is authorized.\n');
const manifest = { schemaVersion: 1, id: 'existing-score', name: 'Existing Score', version: '0.4.2', scoreServer: { entry: 'server.cjs', workingDirectory: '.', performerPort: 6868, monitorPort: 6869 }, audio: { defaultMode: 'none', supportedModes: ['none'] } };
write('existing-project/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
write('existing-project/package.json', JSON.stringify({ name: 'existing-score', private: true, engines: { node: '>=24 <25' }, scripts: { check: 'node --check server.cjs' } }, null, 2) + '\n');
write('existing-project/server.cjs', `const http = require('node:http'); const fs = require('node:fs'); const path = require('node:path'); const m = JSON.parse(fs.readFileSync('manifest.json')); const servers=[];
for (const [port, role] of [[m.scoreServer.performerPort,'performer'],[m.scoreServer.monitorPort,'monitor']]) servers.push(http.createServer((req,res)=>{
if(req.url==='/__pnds/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({status:'ready',projectId:m.id,audioMode:'none',audio:{status:'disabled',target:null,error:null},scoreServer:{performerPort:m.scoreServer.performerPort,monitorPort:m.scoreServer.monitorPort,error:null}}));}
if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end(fs.readFileSync(path.join('public',role+'.html')));}
res.statusCode=404;res.end('not found');}).listen(port,'127.0.0.1'));
process.on('SIGTERM',()=>servers.forEach(server=>server.close()));process.on('SIGINT',()=>servers.forEach(server=>server.close()));\n`);
write('existing-project/public/performer.html', '<!doctype html><html><title>Performer</title><p>Observe the visual score.</p></html>\n');
write('existing-project/public/monitor.html', '<!doctype html><html><title>Monitor</title><button id="start">START</button><p id="caption">Existing cyan bar</p></html>\n');
write('existing-project/public/shared.js', 'export const tokenKey = "existing-score-claim-v1";\n');
write('existing-project/docs/decisions.md', '# Decisions\nAuthor confirmed this visual-only None-mode work. Preserve identity existing-score and token namespace existing-score-claim-v1; do not add sound or performer controls.\n');
write('existing-project/docs/creator-handoff.md', '# Creator handoff\n\n- [ ] existing-caption: Rename the monitor caption to “Shared cyan bar”; preserve the performer wording and START.\n');
write('existing-project/docs/validation.md', '# Validation\nStructure: fixture only; App native opening, sound and devices have not been tested.\n');
write('cm1-source/sketch.js', `let startedAt=null; function setup(){createCanvas(600,400);let start=createButton('START');start.mousePressed(()=>{startedAt=millis();});} function draw(){background('#112033');if(startedAt!==null){let elapsed=min(5000,millis()-startedAt);fill('#61d9ed');rect(20,100,elapsed/10,80);if(elapsed>=5000)startedAt=null;}}\n`);
write('cm1-source/tone.scd', `SynthDef(\\courseTone, { |out=0, freq=220, gate=1| Out.ar(out, SinOsc.ar(freq) * EnvGen.kr(Env.asr(0.01,0.05,0.1),gate,doneAction:2)); }).add;\nOSCdef(\\courseFreq,{|msg| ~tone.set(\\freq,msg[1].linexp(0,1,110,880));},'/freq');\n`);
write('cm1-source/controls.tosc', `<node type='GROUP' ID='root'><properties><property type='s'><key><![CDATA[name]]></key><value><![CDATA[Players]]></value></property></properties><node type='FADER' ID='freq'><properties><property type='s'><key><![CDATA[name]]></key><value><![CDATA[freq]]></value></property></properties><messages><osc><enabled>1</enabled><path><partial><type>CONSTANT</type><conversion>STRING</conversion><value><![CDATA[/freq]]></value></partial></path><arguments><partial><type>VALUE</type><conversion>FLOAT</conversion><value><![CDATA[x]]></value><scaleMin>0</scaleMin><scaleMax>1</scaleMax></partial></arguments></osc></messages></node></node>\n`);
write('cm1-source/README.md', '# CM1 input fixture\nSynthetic inspection material, not a polished real-world course acceptance input. The snippet does not show synth creation/default/voice ownership; ask the author before implementing. Five-second visual lifecycle and one UI are supplied. No live TouchOSC import, SC compile, browser or phone validation has been performed.\n');
console.log(JSON.stringify({ output, cases: ['browser-source', 'partial-source', 'existing-project', 'cm1-source'] }, null, 2));
