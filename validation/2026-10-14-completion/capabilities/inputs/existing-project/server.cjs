const http = require('node:http'); const fs = require('node:fs'); const path = require('node:path'); const m = JSON.parse(fs.readFileSync('manifest.json')); const servers=[];
for (const [port, role] of [[m.scoreServer.performerPort,'performer'],[m.scoreServer.monitorPort,'monitor']]) servers.push(http.createServer((req,res)=>{
if(req.url==='/__pnds/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({status:'ready',projectId:m.id,audioMode:'none',audio:{status:'disabled',target:null,error:null},scoreServer:{performerPort:m.scoreServer.performerPort,monitorPort:m.scoreServer.monitorPort,error:null}}));}
if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end(fs.readFileSync(path.join('public',role+'.html')));}
res.statusCode=404;res.end('not found');}).listen(port,'127.0.0.1'));
process.on('SIGTERM',()=>servers.forEach(server=>server.close()));process.on('SIGINT',()=>servers.forEach(server=>server.close()));
