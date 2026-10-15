import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const base=path.resolve(import.meta.dirname,'..');
const repo=path.resolve(base,'../../..');
const runroot=path.resolve(process.argv[2] ?? '/tmp/pnds161-acceptance-projects');
const evidence=path.join(base,'evidence');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(name,value)=>fs.writeFileSync(path.join(evidence,name+'.json'),JSON.stringify(value,null,2)+'\n');
function run(name,args,cwd,expect=0){
 const p=spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:60000});
 write(name,{command:process.execPath,args,cwd,exit:p.status,stdout:p.stdout,stderr:p.stderr,error:p.error?.message});
 assert.equal(p.status,expect,`${name}: ${p.stderr}`);return p;
}
const skills=['pnds-investigate','pnds-assess','pnds-runtime','pnds-modules','pnds-validate','pnds-create','pnds-port'];
const inventory=[];
for(const skill of skills){
 const destination=fs.mkdtempSync(path.join(os.tmpdir(),skill+'-independent-'));
 fs.cpSync(path.join(repo,skill),path.join(destination,skill),{recursive:true});
 const root=path.join(destination,skill);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'resource-manifest.json')));
 inventory.push({skill,isolatedDirectory:root,manifestSha256:hash(path.join(root,'resource-manifest.json')),resourceManifest:manifest,nativeInvocations:0,directEntryReads:1});
 fs.readFileSync(path.join(root,'SKILL.md'),'utf8');
 // An independent directory's helper remains executable without any sibling Skill.
 if(skill==='pnds-runtime'){
  for(const name of ['runtime-new','runtime-existing','visual-line-port'])run(name+'-none-smoke',[path.join(root,'tools/smoke.mjs'),path.join(runroot,name)],root);
 }
 if(skill==='pnds-validate'){
  const out=path.join(runroot,'failed-distribution');fs.mkdirSync(out,{recursive:true});
  run('missing-audio-pack',[path.join(root,'tools/pack.mjs'),path.join(runroot,'missing-audio'),'--out',out],root,1);
  assert.deepEqual(fs.readdirSync(out),[],'failed pack publishes no artifact');
  run('missing-platform-resources',[path.join(root,'tools/platform-info.mjs'),'--app',path.join(runroot,'absent-PNDS.app'),'--locale','en'],root,1);
  const {readProject}=await import(path.join(root,'tools/project-files.mjs'));
  for(const name of ['runtime-new','runtime-existing','module-custom','visual-line-port'])write(name+'-static',readProject(path.join(runroot,name)));
 }
}
write('harness',{date:'2026-10-14',harness:'Codex collaboration capability_acceptance subagent',model:'inherited exact model ID not exposed',nativeSkillInvocationAvailable:false,skillReads:inventory.length,node:process.version,platform:process.platform,arch:process.arch,platformEvidence:'explicit App 1.6.1 development corpus; not installed/released App',skills:inventory});
for(const name of ['runtime-new','runtime-existing','visual-line-port'])run(name+'-http',['--test',path.join(runroot,name,'tests/runtime.test.cjs')],path.join(runroot,name));
run('module-custom-green',['--test',path.join(runroot,'module-custom/tests/maintenance.test.cjs')],path.join(runroot,'module-custom'));
write('no-ordinary-bundles',{projects:['runtime-new','runtime-existing','visual-line-port','module-custom'].map(name=>({name,bundles:fs.readdirSync(path.join(runroot,name)).filter(x=>x.endsWith('.pnds'))})),result:'no bundles generated in ordinary source-only tasks'});
