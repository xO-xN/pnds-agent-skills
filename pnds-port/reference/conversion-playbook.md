# Conditional p5 / SC / TouchOSC conversion notes

Use only where the author-confirmed plan calls for these technologies. Read the installed App's manifest, runtime, audio, network and page manual first; [platform sources](platform-sources.md) explains discovery. A Template starter is an explicitly obtained, versioned resource, not a required local sibling.

- Move OSCdef interaction semantics into the project's audio/controller layer, retaining mapping math, gates, defaults and voice ownership from the confirmed plan. Compile declared SynthDefs using a discovered `sclang`; missing compilation remains a distribution/startup blocker for those assets.
- Preserve original SynthDef bodies, with explicit output-bus adaptation for Internal ownership. Any audible change needs author agreement. Internal, External or None follows deployment evidence and the plan; no mode is forced by this legacy guide.
- Map TouchOSC controls to web gestures with the actual ranges, arguments, feedback and simultaneous input. Keep gesture state normalized across resize. Inspect actual multitouchness rather than assuming every DOM control makes the complete work correct.
- Preserve meaningful p5 score logic and timing; adapt unsafe host shortcuts using the matched page contract. Keep resize/iframe and unknown query-parameter tolerance. Use in-page input controls for embedded monitor operation.
- If the selected work needs a hub, use its matching released module and manual, preserve room/auth/local-autonomy semantics and never expose tokens in logs. Hub relay, conductor authority and drift policy belong to the plan, not this reference.
- Test actual public join/control/recovery/state interfaces; separately observe cold/warm page rendering, native embedding and real sound/device behavior. Use [validation/handoff](../capabilities/validate-handoff.md). Packaging remains explicit distribution only; none-mode ready is not performance proof.
