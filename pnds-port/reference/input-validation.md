# Phase 1 — Input validation 输入契约

The input is a **triple 三件套**: p5.js source + SuperCollider file(s) + TouchOSC file(s). The three kinds form one work and are all required. Optional attachments: performer instructions (docx/pdf/md/txt), an OpenProcessing URL (metadata only).

## Required inputs and acceptance checks

### p5.js source — must be the CODE, not a link

- Accept: the actual JavaScript (pasted, or a file like `sketch.js` / `index.js`). OpenProcessing embeds sketches as one or more js files; multiple files are fine, keep their names.
- An OpenProcessing URL alone is **not** acceptable: the site is behind Cloudflare and its API (`https://openprocessing.org/api/sketch/<id>`) returns metadata + a file base URL but not the code. If the user supplies only a URL:
  1. Fetch the API endpoint for title/description (useful metadata for the port map).
  2. Tell the user exactly what to submit: open the sketch page → code tab → copy all files (or download if the license allows), and paste/attach them.
- Checks: the code parses (`node --check` on each file); contains `setup`/`draw` (global mode) or `p5.Instance`/`new p5(` (instance mode). p5-version-specific libraries used by the sketch (the API response's `engineURL` field names the p5 version) — note the version for the port.

### SuperCollider — one or more `.scd`

- Checks per file: contains at least one `SynthDef(...)`; extract def names (needed later for the naming contract); scan for third-party UGens — anything outside sc3 core/plugins (e.g. `Quarks` imports, `SCPlugIn`-style names you don't recognize) → flag now, STOP later at the stop-criteria gate unless the user resolves it.
- Note (do not reject): `OSCdef`/`NetAddr`/`Routine` blocks, `s.options.*` settings, buffer/sample dependencies (`Buffer.read` etc. — sample files must then also be submitted; if referenced samples are missing → STOP), MIDI-level logic.

### TouchOSC — one or more `.tosc`

- Check: `node tools/tosc-parser.mjs <file>` exits 0 and reports at least one control with an OSC path. .tosc files are zlib-compressed XML; the parser sniffs gzip/zlib/raw automatically.
- The files do NOT contain host/port (connection targets live in the TouchOSC app, not the file) — never go hunting for them; the port assumes the original pointed at the machine running SuperCollider.

### Optional: performer instructions

- Extract text: `textutil -convert txt -stdout "<file.docx>"` (macOS). For pdf, `pdftotext` if available, else read manually.
- Treat as evidence for performer-facing semantics (defaults, cue structure, who does what), never as override for code facts — contradictions are stop-criterion ④.

## Stop message template

When validation fails, stop and reply with exactly this shape (do not start any analysis):

```
输入不完整，暂不开始制作。缺少/有问题：
- <文件或内容>：<期望的格式，实际发现了什么>
请补充后重新提交。已通过校验的部分：<列出>。
```

## Ambiguity vs. invalidity

Unparseable = invalid (stop). Parseable but semantically ambiguous (e.g. a control that sends to an address nothing listens to) = NOT a validation failure — that is analysis material (dead content), handled in Phase 2.
