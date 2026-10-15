var dir=thisProcess.nowExecutingPath.dirname +/+ "synthdefs";
SynthDef('cm1-tone', { |out=0, freq=550, gain=0.04, gate=1|
 Out.ar(out, (SinOsc.ar(freq)!2) * Lag.kr(gain,0.03) * EnvGen.kr(Env.asr(0.02,1,0.2),gate,doneAction:2));
}).writeDefFile(dir);
"CM1 SynthDef compiled without booting audio".postln;
0.exit;
