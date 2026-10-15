# CM1 Shared Tone maintenance fixture port map

This original fixture is authored for Issue #188 validation, not adapted from a user's artwork. The parent task explicitly chose CM1 for this maintenance acceptance run; no human artistic confirmation is fabricated. The fixture author selected the choices below before implementation. Real user artworks still require their own assessment and author confirmation.

| Source fact / fixture choice | PNDS implementation | Reason and status |
| --- | --- | --- |
| p5 SHARED TONE score, two GATHER / RELEASE panels, progress pointer | Same `drawCM1Score` function in public/score.js; p5 served locally | Preserve score meaning, timing and visual language; Node syntax passed; root/subagent actual source/port browser comparison passed |
| Source START starts eight seconds; no pause/reset/jump | Visible monitor START, server-owned eight-second timer; repeat START refused | Preserve explicit start and end; automated real process test passed |
| SC one shared stereo sine voice; normalized frequency x → 220 + 660x, gain x → 0.2x; defaults 0.5 / 0.2 | Identical SynthDef UGen body, defaults 550 Hz / 0.04; Host private bus; root group owned by project | Preserve sound graph/mapping; actual compiler passed; controlled OSC test passed; actual sound pending |
| Source p5 / SC require simultaneous manual start | PNDS monitor START begins server timer and creates shared synth | Fixture-author technical consolidation, not a change to duration or source section timing |
| One TouchOSC layout, two vertical faders, each 0..1 | Two independent DOM range faders, same range/default and OSC mapping; horizontal visual handles fit both orientations | Fixture-author visual layout adaptation for course browser output; control semantics retained; actual physical touch pending |
| No player ID in source controls | Player 1 / 2 choice, exclusive persisted claim token; monitor presence | Explicit course-required addition chosen for fixture; player ID does not determine voice/output bus |
| Last performer update per parameter changes the shared voice | Shared frequency/gain field independently updated; invalid controls ignored; latest saved per-player controls re-pushed on refresh/rejoin | Original shared-voice policy retained; reconnection adds required course recovery with fixture-author chosen persistence |
| Source has no QR, theme or locale entry | Real fixed QR, players, theme-follow and locale-follow 0.2.0 module bytes copied with provenance; Host full performer URL wins; monitor-only theme/locale routes | Explicit course/Host integration. Browser languages en / zh-CN; actual Host-message browser switching passed; performer remained on original visual palette |
| Claims remembered after disconnect/restart | claims.json records player IDs + last controls; server restart resets piece phase and live connections only | Chosen maintenance-fixture recovery policy; source/published fixture contains no live claim file |
| No hub, roles, samples or third-party UGens | Local Mac + LAN phones; supported internal/none; no telematic, no role selector | CM1-only baseline, not a policy imposed on general creation |

## Evidence-backed N/A

P7 score-feedback affordance: source p5 timeline is only clock driven. TouchOSC controls change SC parameters, and p5 receives no discrete musical event. There is no discrete trigger/visual feedback control to port. Optional pause/reset/jump: neither source sketch nor SC contains those controls; no new controls added.

## Boundaries

Source TouchOSC lexml structure and parser inventory are validated; its GUI import and physical device behavior have not been observed. None health, UDP/OSC wire checks and compiled SynthDef do not prove sound. No App creation open, bundle install round trip, actual phone QR scan, phone sleep/unlock or physical multitouch is marked passed. This fixture verifies the released skill workflow can produce a complete implementation and a validation artifact under those explicit pending conditions.
