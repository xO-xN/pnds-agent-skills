// Author-confirmed original: every START overlaps tones and resets the visual clock.
let began=null;
const duration=12000;
const score=document.querySelector('#score');
const connection=document.querySelector('#connection');
document.querySelector('#start').addEventListener('click',()=>{
 began=performance.now();score.style.width='100px';connection.textContent='';
 fetch('./start',{method:'POST'}).then(async response=>{
  if(!response.ok)throw new Error('The project audio is not ready');
  const result=await response.json();if(!result.accepted)throw new Error('START was not accepted');
 }).catch(error=>{connection.textContent=error.message;});
});
function frame(now){
 if(began!==null){const elapsed=now-began;score.style.width=Math.min(600,100+elapsed/24)+'px';if(elapsed>=duration)began=null;}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
