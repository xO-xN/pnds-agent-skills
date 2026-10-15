# CM1 Shared Tone Validation

Maintenance-authored acceptance fixture for PNDS App v1.6.1 development contract, not a user artwork. This is an editable source and validation bundle, with native App, actual phone and audio acceptance pending.

Scan → select Player 1 or 2 → JOIN → monitor START → eight-second GATHER / RELEASE → automatic end. Two faders act on one shared stereo sine voice; player numbers do not allocate output channels or separate voices. Last valid performer update sets each shared parameter.

Node 24: `npm ci --ignore-scripts`, `npm run check`, `npm test`. Runtime production dependencies are packaged. `node server.cjs --audio-mode none` serves performer on 6968 and monitor on 6969. Internal requires Host-injected scsynth target and bus; runtime does not compile or boot audio. Restart the server for a fresh performance. Saved claims restore player ID and controls; deleting claims.json in a stopped maintenance fixture explicitly resets its roster.

See source author decisions, validation and handoff in docs/.
