// Optional read-only maintenance preview of the original p5 fixture, never part of the PNDS runtime.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../source-triple');
const routes={'/':'index.html','/index.html':'index.html','/sketch.js':'sketch.js','/vendor/p5.min.js':'vendor/p5.min.js','/host-preview.html':'../scripts/host-preview.html','/orientation-preview.html':'../scripts/orientation-preview.html'};
const server=http.createServer((req,res)=>{const file=routes[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404).end();return;}res.setHeader('content-type',file.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');fs.createReadStream(path.join(root,file)).pipe(res);});
server.listen(6970,'127.0.0.1',()=>console.log('Original p5 fixture http://127.0.0.1:6970/'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
