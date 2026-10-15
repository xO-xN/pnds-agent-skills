# QR source provenance — 2026-10-14

Input: explicitly supplied fixed resource /Users/xiaoxiang/Coding/PNDS app 开发/PNDS-App-main/src-tauri/resources/modules/qr. Copied to modules/pnds-qr with all four original files unchanged (qr.js, README.md, compatibility.json, package.json). This was external-agent copying under the requested task, not App module addition, so no App-generated pnds-module.json is fabricated.

Delivery version 0.2.0; Host protocol 1. Runtime dependencies: Node 24, qrcode 1.5.x, Express4-compatible response object (project supplies a minimal adapter; Express is not required/installed). Actual production dependency qrcode 1.5.4 and transitive versions are locked in package-lock.json and present in node_modules. Target App manual is supplied 1.6.1 DEVELOPMENT snapshot, not installed/released evidence.

Adaptation: server.cjs requires modules/pnds-qr/qr, resolves injected full performer URL before LAN fallback, mounts monitor-only /qr and same resolved __config.js; public/monitor.html renders /qr with light backing and URL label/link. No sound/control mapping imported. Source hashes and actual HTTP/independent macOS Vision payload evidence live at /tmp/pnds-161-workflow-results/evidence/qr-module-source.json and case07-*.

README refers to upstream test/modules-display.test.js and its fixture, which are absent from this four-file resource. No hidden checkout was read. Project-owned HTTP/Vision tests exercise the actual public API instead; phone/browser/native acceptance remains pending. This missing test reference is a portability finding, not a claimed unavailable API or test pass.
