import {readFile,writeFile} from 'node:fs/promises';
import {evaluateGame} from '../dist/playtest.mjs';
const results=[];
for(const name of ['gutter-duel','last-light'])results.push(evaluateGame(JSON.parse(await readFile(new URL('../dist/examples/'+name+'.json',import.meta.url)))));
const report={createdAt:new Date().toISOString(),results};
await writeFile(new URL('../submission/playtest-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
for(const r of results)console.log(r.game+': '+r.matches+' matches; seat wins '+r.wins.join('/')+'; ties '+r.ties+'; scoreless '+r.scorelessPercent+'%. '+r.findings.join(' '));
