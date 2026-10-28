const assert=require('node:assert/strict');
const S=require('../science.js');
assert.equal(S.photometry('APASS DR9','V').zero_point,'Vega');
assert.equal(S.photometry('APASS DR9','r').label,'r′');
assert.equal(S.photometry('PS1 DR1','r').label,'rₚ₁');
assert.equal(S.photometry('Supplied standard-star table','V').zero_point,'unverified');
assert.equal(S.curatedError({er:.034,ei:0,eR:.025},'R'),null);
assert.equal(S.curatedError({er:.043,ei:.082,eR:.039422177},'R'),.039422177);
// Missing B, a bright V, a faint r, a missing error and single observations
// must not hide a star or its other available passbands.
const ap=S.measurements({Bmag:'',Vmag:12,e_Vmag:0,u_e_Vmag:1,"r'mag":21,"e_r'mag":.4},'APASS DR9');
assert.equal(ap.length,2);assert.deepEqual(ap.map(p=>p.mag),[12,21]);assert.equal(ap[0].err,null);assert(ap[0].warnings.length);
const ps=S.measurements({gmag:-999,rmag:18,e_rmag:.01,rFlags:8,o_rmag:4,rmagStd:.02,imag:17.5,e_imag:.02,iFlags:4,o_imag:1},'PS1 DR1');
assert.equal(ps.length,2);assert.equal(ps[0].band,'r_P1');assert(ps[1].warnings.length);
assert.equal(S.objectChecks({Qual:4,f_objID:33554432},'PS1 DR1').reasons.length,0);
assert(S.objectChecks({Qual:5,f_objID:33554432},'PS1 DR1').reasons.length);
assert(S.objectChecks({Qual:4,f_objID:33554432+128},'PS1 DR1').reasons.length);
function row(source,ra,gaia,photometry){return {source,ra,dec:30,gaia_id:gaia,photometry,catalogue_records:[{catalog:source}],reasons:[],warnings:[]};}
const merged=S.mergeRecords([row('APASS DR9',10,'123',ap),row('PS1 DR1',10.0001,'123',ps),row('PS1 DR1',11,'124',ps)]);
assert.equal(merged.length,2);assert.equal(merged[0].photometry.length,4);assert.equal(merged[0].sources.length,2);assert(merged.every(s=>s.selected));
assert.equal(merged[0].photometry.filter(p=>p.band==='r_P1').length,1);assert.equal(merged[0].photometry.filter(p=>p.band==="r'").length,1);
const ambiguous=S.mergeRecords([row('APASS DR9',10,'123',ap),row('APASS DR9',10.0002,'123',ap),row('PS1 DR1',10.0001,'123',ps)]);
assert.equal(ambiguous.length,3);assert(ambiguous[0].warnings.length);
const variable=row('PS1 DR1',10.0001,'123',ps);variable.reasons=['Gaia VARIABLE'];
const bad=S.mergeRecords([row('APASS DR9',10,'123',ap),variable]);assert.equal(bad[0].accepted,false);assert.equal(bad[0].selected,false);
const many=S.mergeRecords(Array.from({length:20},(_,i)=>row('APASS DR9',i,'id'+i,ap)));
assert.equal(many.filter(s=>s.selected).length,20);assert.deepEqual(many.map(s=>s.id),Array.from({length:20},(_,i)=>String(i+1)));
console.log('PASS: all native bands; missing B/errors; no brightness cuts or six-star cap; distinct systems; unique cross-catalogue merging; ambiguous matches; known-variable exclusion; curated transformed errors.');
// Hard gates are independent of brightness and missing passbands.
const goodGaia={RUWE:1,Plx:1,e_Plx:.1,pmRA:2,e_pmRA:.1,pmDE:1,e_pmDE:.1,Dup:0,IPDfmp:0,VarFlag:'NOT_AVAILABLE'};
function gaiaTest(changes={},starChanges={}){const s={reasons:[],nn:20,...starChanges};S.gaiaChecks(s,{...goodGaia,...changes});return s;}
assert.equal(gaiaTest().reasons.length,0);
const missing={reasons:[]};S.gaiaChecks(missing);assert(missing.reasons.length);
for(const c of [{RUWE:1.4},{Dup:1},{IPDfmp:3},{VarFlag:'VARIABLE'},{VarFlag:''},{Plx:-2,pmRA:0,pmDE:0},{pmRA:51}]) assert(gaiaTest(c).reasons.length,JSON.stringify(c));
assert(gaiaTest({},{nn:9}).reasons.length);assert(gaiaTest({},{ambiguous:true}).reasons.length);
assert(ps[0].eligible);assert(!ps[1].eligible);assert(ap.every(p=>!p.eligible));
const goodAP=S.measurements({Vmag:12,e_Vmag:.01,u_e_Vmag:0,nobs:3},'APASS DR9');
assert(goodAP[0].eligible);
assert.equal(S.finalScreen(S.mergeRecords([row('APASS DR9',1,'1',ap)]))[0].accepted,false);
assert.equal(S.finalScreen(S.mergeRecords([row('APASS DR9',1,'1',ap),row('PS1 DR1',1,'1',ps)]))[0].accepted,true);
assert(S.finalScreen(ambiguous).every(s=>!s.accepted));
assert.equal(S.finalScreen(S.mergeRecords(Array.from({length:20},(_,i)=>row('APASS DR9',i,'g'+i,goodAP)))).filter(s=>s.accepted).length,20);
for(const catalogue of ['VSX','ASAS-SN','ZTF variables','ZTF suspected']){let v=row('PS1 DR1',1,'1',ps);v.reasons=['Каталог змінності: '+catalogue];assert.equal(S.finalScreen([v])[0].accepted,false);}
console.log('PASS: strict Gaia and photometry gates, missing-data rejection, duplicate veto propagation, multi-catalogue variability veto, no magnitude/count restriction.');
const fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const parseContext={num:v=>v==null||String(v).trim()===''?NaN:Number(v)};
vm.createContext(parseContext);vm.runInContext(app.slice(app.indexOf('function parseTSV('),app.indexOf('async function query('))+';this.parse=parseTSV',parseContext);
const validEmpty='#Table\tconfirmed:\n#Column\tRAJ2000\t(F9.5)\n#Column\tDEJ2000\t(F9.5)\n';
assert.equal(parseContext.parse(validEmpty,'RAJ2000',['RAJ2000','DEJ2000']).length,0);
assert.throws(()=>parseContext.parse(validEmpty,'RAJ2000',['RAJ2000','DEJ2000','Type']));
assert.throws(()=>parseContext.parse('#INFO\tError=Table not found','RAJ2000',[]));
assert.throws(()=>parseContext.parse('','RAJ2000',[]));
console.log('PASS: explicit empty catalogue schema accepted; wrong columns, missing tables and empty server replies fail closed.');
const firstV=S.measurements({Vmag:16,e_Vmag:.02,u_e_Vmag:0,nobs:3},'APASS DR9');
const betterV=S.measurements({Vmag:14,e_Vmag:.01,u_e_Vmag:0,nobs:3},'APASS DR9');
const prioritized=S.finalScreen(S.mergeRecords([row('PS1 DR1',1,'ps',ps),row('APASS DR9',2,'v1',firstV),row('APASS DR9',3,'v2',betterV)]));
assert.deepEqual(prioritized.map(s=>s.gaia_id),['v2','v1','ps']);
assert.deepEqual(prioritized.map(s=>s.selected),[true,true,false]);
assert.equal(prioritized[2].accepted,true);assert.equal(prioritized[2].recommendation,'catalogue_only');
const noV=S.finalScreen(S.mergeRecords([row('PS1 DR1',1,'ps',ps),row('APASS DR9',2,'ap',S.measurements({Bmag:14,e_Bmag:.02,u_e_Bmag:0,nobs:3},'APASS DR9'))]));
assert(noV.every(s=>s.selected&&s.recommendation==='catalogue_only'));
console.log('PASS: APASS V priority, V uncertainty ordering, additional candidates retained and unmarked, no-V fallback without mislabelling B/PS1 as V.');
