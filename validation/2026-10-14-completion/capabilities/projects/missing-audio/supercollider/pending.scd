SynthDef(\pending, { |out=0| Out.ar(out, SinOsc.ar(220) * 0.05) }).writeDefFile;
