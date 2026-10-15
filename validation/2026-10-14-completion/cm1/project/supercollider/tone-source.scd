// Maintenance-authored shared sine voice. Source and PNDS retain identical UGen body and parameter mapping.
SynthDef('cm1-tone', { |out=0, freq=550, gain=0.04, gate=1|
 Out.ar(out, (SinOsc.ar(freq)!2) * Lag.kr(gain,0.03) * EnvGen.kr(Env.asr(0.02,1,0.2),gate,doneAction:2));
}).add;
~start = {
 if(~voice.isNil) {
  ~voice=Synth('cm1-tone',[\out,0,\freq,550,\gain,0.04]);
  SystemClock.sched(8,{~voice.set(\gate,0);~voice=nil;nil});
 };
};
OSCdef(\cm1Freq,{|message| if(~voice.notNil){~voice.set(\freq,220+660*message[1].clip(0,1))}},'/cm1/frequency');
OSCdef(\cm1Gain,{|message| if(~voice.notNil){~voice.set(\gain,0.2*message[1].clip(0,1))}},'/cm1/gain');
// Boot the source server, evaluate this file, press p5 START and evaluate ~start.value together.
// ~stop.value disposes source-owned resources; the PNDS port uses its own root group and Host bus.
~stop={if(~voice.notNil){~voice.free;~voice=nil};OSCdef(\cm1Freq).free;OSCdef(\cm1Gain).free};
