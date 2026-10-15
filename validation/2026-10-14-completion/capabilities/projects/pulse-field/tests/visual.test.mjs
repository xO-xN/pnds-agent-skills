import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('monitor preserves 100→600px twelve-second growth and repeated START resets without blocking another tone request',async()=>{
 let click,frame,now=100;const score={style:{}},connection={textContent:''};const starts=[];
 const context={document:{querySelector:selector=>selector==='#score'?score:selector==='#connection'?connection:{addEventListener:(_,handler)=>click=handler}},performance:{now:()=>now},requestAnimationFrame:callback=>frame=callback,fetch:(url,options)=>{starts.push({url,method:options.method});return Promise.resolve({ok:true,json:async()=>({accepted:true})});}};
 vm.runInNewContext(fs.readFileSync(new URL('../public/monitor.js',import.meta.url),'utf8'),context);
 click();assert.equal(score.style.width,'100px');frame(6100);assert.equal(score.style.width,'350px');
 now=6200;click();assert.equal(score.style.width,'100px');assert.deepEqual(starts,[{url:'./start',method:'POST'},{url:'./start',method:'POST'}]);
 frame(12200);assert.equal(score.style.width,'350px');frame(18200);assert.equal(score.style.width,'600px');frame(30200);assert.equal(score.style.width,'600px');
 await Promise.resolve();assert.equal(connection.textContent,'');
});
