#!/usr/bin/env node
// tosc-parser.mjs — parse a Hexler TouchOSC .tosc file into a control inventory (JSON).
//
// Usage: node tosc-parser.mjs <file.tosc> [<file2.tosc> ...]
// Output: one JSON object per file on stdout (array if multiple).
//
// The .tosc format is zlib-compressed XML. Controls are nested <node type="...">
// elements; each carries <properties> (name, frame, steps, ...) and a <messages>
// block whose <osc> path is a sequence of partials (CONSTANT literals and
// PROPERTY references such as `name` or `parent.name`) and whose <arguments>
// are VALUE partials bound to control variables (x, y, page) with conversions
// (FLOAT / INTEGER) and scales. This parser reports both the raw path template
// and the path resolved against actual node/parent names.
//
// Pure Node, no dependencies. Exits non-zero with a readable message on failure.

import fs from "node:fs";
import zlib from "node:zlib";

function inflate(buf) {
  if (buf[0] === 0x1f && buf[1] === 0x8b) return zlib.gunzipSync(buf);
  if (buf[0] === 0x78) return zlib.inflateSync(buf);
  return buf; // assume raw XML
}

const cdata = (s) => {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : s;
};

// Split the document into a node tree using open/close tags only.
// TouchOSC XML is machine-generated and consistently quoted single-quoted
// attributes; a tolerant scan over <node / </node> tokens is sufficient.
function buildTree(xml) {
  const tokenRe = /<node\b[^>]*>|<\/node>/g;
  const root = { children: [], own: xml };
  const stack = [root];
  let m;
  while ((m = tokenRe.exec(xml)) !== null) {
    if (m[0] === "</node>") {
      if (stack.length === 1) throw new Error("unexpected closing <node> tag");
      const node = stack.pop();
      node.end = m.index;
      // own content = from end of open tag to first child open (or close)
      const firstChild = node.children[0];
      node.ownXml = xml.slice(node.openEnd, firstChild ? firstChild.start : m.index);
    } else {
      const type = (m[0].match(/type=['"]([^'"]*)['"]/) || [])[1] || "?";
      const id = (m[0].match(/ID=['"]([^'"]*)['"]/) || [])[1] || "";
      const node = { type, id, start: m.index, openEnd: m.index + m[0].length, children: [] };
      const parent = stack[stack.length - 1];
      if (parent.children.length === 0) {
        // this is the parent's first child; nothing to do here (ownXml set on close)
      }
      parent.children.push(node);
      stack.push(node);
    }
  }
  if (stack.length !== 1) throw new Error(`unbalanced <node> tags (depth ${stack.length})`);
  return root;
}

function parseProperties(ownXml) {
  const props = {};
  const propRe = /<property type=['"]([^'"]*)['"]><key><!\[CDATA\[([^\]]*)\]\]><\/key>([\s\S]*?)<\/property>/g;
  let m;
  while ((m = propRe.exec(ownXml)) !== null) {
    const [, kind, key, body] = m;
    if (kind === "r") {
      const v = {};
      for (const f of ["x", "y", "w", "h"]) {
        const fm = body.match(new RegExp(`<${f}>([^<]*)</${f}>`));
        if (fm) v[f] = Number(fm[1]);
      }
      props[key] = v;
    } else {
      const vm = body.match(/<value>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/value>/);
      const raw = vm ? (vm[1] !== undefined ? vm[1] : vm[2]) : "";
      props[key] = kind === "i" || kind === "f" ? Number(raw) : kind === "b" ? raw === "1" || raw === "true" : raw;
    }
  }
  return props;
}

function parseMessages(ownXml) {
  const out = { osc: null, midi: null };
  const oscBlock = ownXml.match(/<osc>([\s\S]*?)<\/osc>/);
  if (oscBlock) {
    const b = oscBlock[1];
    const partialRe =
      /<partial><type>([^<]*)<\/type><conversion>([^<]*)<\/conversion><value><!\[CDATA\[([^\]]*)\]\]><\/value>(?:<scaleMin>([^<]*)<\/scaleMin><scaleMax>([^<]*)<\/scaleMax>)?<\/partial>/g;
    const path = [];
    let m;
    const pathBlock = b.match(/<path>([\s\S]*?)<\/path>/);
    if (pathBlock) {
      while ((m = partialRe.exec(pathBlock[1])) !== null) {
        path.push({ type: m[1], conversion: m[2], value: cdata(m[3]) });
      }
    }
    const args = [];
    const argBlock = b.match(/<arguments>([\s\S]*?)<\/arguments>/);
    if (argBlock) {
      while ((m = partialRe.exec(argBlock[1])) !== null) {
        args.push({
          type: m[1],
          conversion: m[2],
          variable: cdata(m[3]),
          scaleMin: m[4] !== undefined ? Number(m[4]) : undefined,
          scaleMax: m[5] !== undefined ? Number(m[5]) : undefined,
        });
      }
    }
    const enabled = (b.match(/<enabled>([^<]*)<\/enabled>/) || [])[1];
    out.osc = { enabled: enabled === "1", path, args };
  }
  const midiBlock = ownXml.match(/<midi>([\s\S]*?)<\/midi>/);
  if (midiBlock) {
    const b = midiBlock[1];
    const type = (b.match(/<message><type>([^<]*)<\/type>/) || [])[1] || null;
    const enabled = (b.match(/<enabled>([^<]*)<\/enabled>/) || [])[1];
    out.midi = { enabled: enabled === "1", type };
  }
  return out;
}

// Resolve a path template against this node's name and its ancestors' names.
// PROPERTY 'name' → this node; PROPERTY 'parent.name' → nearest named ancestor;
// anything else stays symbolic so nothing is silently misread.
function resolvePath(path, nodeName, ancestorNames) {
  return path
    .map((p) => {
      if (p.type === "CONSTANT") return p.value;
      if (p.type === "PROPERTY" && p.value === "name") return nodeName;
      if (p.type === "PROPERTY" && p.value === "parent.name")
        return ancestorNames.length ? ancestorNames[ancestorNames.length - 1] : "?";
      if (p.type === "VALUE" || p.type === "INDEX") return `<${p.type.toLowerCase()}:${p.value}>`;
      return `<${p.type}:${p.value}>`;
    })
    .join("");
}

function collect(nodes, parentNames, acc) {
  for (const n of nodes) {
    if (n.type === "?") continue;
    const props = parseProperties(n.ownXml || "");
    const messages = parseMessages(n.ownXml || "");
    const entry = {
      type: n.type,
      id: n.id,
      name: props.name ?? null,
      frame: props.frame ?? null,
    };
    if (typeof props.steps === "number") entry.steps = props.steps;
    if (typeof props.text === "string" && props.text !== "") entry.text = props.text;
    if (messages.osc) {
      entry.osc = {
        enabled: messages.osc.enabled,
        pathTemplate: messages.osc.path.map((p) => `${p.type}:${p.value}`).join(" | "),
        pathResolved: resolvePath(messages.osc.path, entry.name ?? "?", parentNames),
        args: messages.osc.args,
      };
    }
    if (messages.midi && messages.midi.enabled) entry.midi = messages.midi;
    entry.children = [];
    acc.push(entry);
    const childNames = [...parentNames, ...(entry.name ? [entry.name] : [])];
    collect(n.children, childNames, entry.children);
  }
}

function parseFile(file) {
  const raw = fs.readFileSync(file);
  const xml = inflate(raw).toString("utf8");
  if (!/<node\b/.test(xml)) throw new Error("not a TouchOSC XML node layout");
  const tree = buildTree(xml);
  if (!tree.children.length) throw new Error("TouchOSC layout has no root node");
  const canvas = {
    // root GROUP frame carries the canvas size in .tosc files
    frame: parseProperties(tree.children[0]?.ownXml || "").frame ?? null,
  };
  const controls = [];
  collect(tree.children, [], controls);
  return { file, canvas, controls };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node tosc-parser.mjs <file.tosc> [...]");
  process.exit(2);
}
const results = [];
for (const f of files) {
  try {
    results.push(parseFile(f));
  } catch (err) {
    console.error(`tosc-parser: failed on ${f}: ${err.message}`);
    process.exit(1);
  }
}
console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
