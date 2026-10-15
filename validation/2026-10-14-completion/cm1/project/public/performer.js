let player=null;
const controls={frequency:0.5,gain:0.2};
const status=document.querySelector('#status');
function connect(){if(player)player.close();player=PNDSPlayers.connectPlayer({io,origin:location.origin,events:CM1.events,tokenKey:CM1.tokenKey,storage:localStorage,makeJoin:token=>({token,id:Number(document.querySelector('#id').value)})});
 player.onChange(state=>{status.textContent=state.joined?`Player ${state.identity} · ${state.recovered?'restored':'joined'}`:state.rejectedReason||state.error||'Connecting…';document.querySelector('#controls').classList.toggle('hidden',!state.joined);document.querySelector('#id').disabled=state.joined;document.querySelector('#join').disabled=state.joined;if(state.joined){Object.assign(controls,state.restore||{});for(const key of ['frequency','gain']){document.querySelector('#'+key).value=controls[key];document.querySelector('#'+key+'-value').value=controls[key];}player.sendControls({...controls});}});
}
document.querySelector('#join').addEventListener('click',connect);
for(const key of ['frequency','gain'])document.querySelector('#'+key).addEventListener('input',event=>{controls[key]=Number(event.target.value);document.querySelector('#'+key+'-value').value=controls[key];player?.sendControls({...controls});});
const observer=PNDSPlayers.connectObserver({io,origin:location.origin,events:CM1.events});observer.onState(state=>{document.querySelector('#phase').textContent=state.phase==='waiting'?'Waiting for START':state.phase==='ended'?'Ended · sound released':'Playing · simultaneous controls enabled';});
if(localStorage.getItem(CM1.tokenKey))connect();
addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
addEventListener('pagehide',()=>{player?.close();observer.close();});
