// Author-confirmed: mono sine, hard start/stop, gain 0.05, overlapping 12-second voices.
// This authoring compiler loads standard classes only; never boots or quits scsynth.
(
var output = thisProcess.nowExecutingPath.dirname +/+ "synthdefs";
File.mkdir(output);
SynthDef(\pulseField, { |out=1, freq=220, gain=0.05, duration=12|
    var lifespan = EnvGen.kr(Env([1, 1], [duration]), doneAction:2);
    Out.ar(out, SinOsc.ar(freq, 0, gain) * lifespan);
}).writeDefFile(output);
"Pulse Field SynthDef compiled without audio boot".postln;
0.exit;
)
