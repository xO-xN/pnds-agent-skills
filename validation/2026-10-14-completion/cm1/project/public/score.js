function drawCM1Score(p, state) {
 p.background(16, 29, 33);p.noStroke();
 const elapsed=state.phase==='running'?Math.max(0,Math.min(state.durationMs,Date.now()-state.startedAt)):state.phase==='ended'?state.durationMs:0;
 const progress=elapsed/state.durationMs;
 p.fill(208,226,193);p.textSize(26);p.textAlign(p.LEFT,p.TOP);p.text('SHARED TONE',24,22);
 const w=(p.width-64)/2;
 for(let i=0;i<2;i++){p.fill(progress>=i/2&&progress<(i+1)/2&&state.phase==='running'?'#f2b76b':'#27494d');p.rect(24+i*(w+16),90,w,Math.max(48,p.height-160),12);p.fill('#d0e2c1');p.text(i===0?'GATHER':'RELEASE',40+i*(w+16),112);}
 p.stroke('#f2b76b');p.strokeWeight(4);p.line(24+progress*(p.width-48),80,24+progress*(p.width-48),p.height-32);
 p.noStroke();p.fill('#d0e2c1');p.textSize(16);p.text(`${state.phase.toUpperCase()}  ${(elapsed/1000).toFixed(1)} / 8.0 s`,24,p.height-26);
}
