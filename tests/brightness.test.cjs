const assert=require('node:assert/strict'),S=require('../science.js');
const base={RAJ2000:10,DEJ2000:0,Vmag:18,e_Vmag:.15,u_e_Vmag:0,nobs:4};
const cat=(rows,catalog='APASS DR9')=>({catalog,table:'test',rows});
const dist=(a,b)=>Math.hypot(a.ra-b.ra,a.dec-b.dec)*3600,centre={ra:10,dec:0};
const t=S.estimateTarget([cat([base])],centre,dist);
assert.equal(t.primary.band,'V');assert.equal(t.primary.mag,18);assert.equal(t.primary.err,.15);
// A rough target measurement can be usable even though it fails reference-star gates.
assert(!S.measurements(base,'APASS DR9')[0].eligible);
assert.equal(S.estimateTarget([cat([])],centre,dist).status,'unavailable');
assert.equal(S.estimateTarget([cat([base,{...base,RAJ2000:10.0001}])],centre,dist).status,'unavailable');
assert.equal(S.estimateTarget([cat([{...base,RAJ2000:10.01}])],centre,dist).status,'unavailable');
for(const error of ['',0,-999,.301])assert.equal(S.estimateTarget([cat([{...base,e_Vmag:error}])],centre,dist).status,'unavailable');
assert.equal(S.estimateTarget([cat([{...base,u_e_Vmag:''}])],centre,dist).status,'unavailable');
const psRaw={RAJ2000:10,DEJ2000:0,Qual:5,f_objID:128,rmag:18.5,e_rmag:.02,rmagStd:.3,rFlags:24+8192,o_rmag:10};
const tp=S.estimateTarget([cat([psRaw],'PS1 DR1')],centre,dist);
assert.equal(tp.primary.band,'r_P1');assert(tp.primary.extended); // variable/extended targets are allowed
assert.equal(S.estimateTarget([cat([{...psRaw,rFlags:4}],'PS1 DR1')],centre,dist).status,'unavailable');
assert.equal(S.estimateTarget([cat([{...psRaw,rmag:12}],'PS1 DR1')],centre,dist).status,'unavailable');
assert.equal(S.estimateTarget([cat([base]),cat([psRaw],'PS1 DR1')],centre,dist).primary.band,'V');
const star=(mag,id='x',changes={})=>({ra:1,dec:0,gaia_id:id,reasons:[],warnings:[],photometry:S.measurements({Vmag:mag,e_Vmag:.02,u_e_Vmag:0,nobs:4},'APASS DR9'),...changes});
for(const [m,tier] of [[17,'close'],[19,'close'],[15,'near'],[21,'near'],[14,'reserve'],[22,'reserve'],[12,'outside']]){
 const b=S.brightnessComparison(star(m),t);assert.equal(b.tier,tier);assert.equal(b.delta,m-18);
}
const wrong=star(18);wrong.photometry[0].band='r_P1';assert.equal(S.brightnessComparison(wrong,t).tier,'unknown');
for(const key of ['system','zero_point','catalog']){const s=star(18);s.photometry[0][key]='different';assert.equal(S.brightnessComparison(s,t).tier,'unknown');}
const result=S.finalScreen([star(12,'bright'),star(18.2,'close'),star(20,'near'),star(21.5,'reserve')],t);
assert.deepEqual(result.filter(s=>s.selected).map(s=>s.gaia_id),['close','near']);assert(result.every(s=>s.accepted));
assert.deepEqual(S.finalScreen([star(21.5,'reserve'),star(12,'far')],t).filter(s=>s.selected).map(s=>s.gaia_id),['reserve']);
assert(!S.finalScreen([star(12)],t)[0].selected);
assert(S.finalScreen([star(12)],{estimates:[]})[0].selected);
assert(!S.finalScreen([star(18,'bad',{reasons:['Gaia VARIABLE']})],t)[0].selected);
const raw={Qual:4,f_objID:33554432,rmag:17,e_rmag:.01,rFlags:24,o_rmag:10,rmagStd:.02};
assert(S.measurements(raw,'PS1 DR1')[0].eligible);
assert.equal(S.objectChecks(raw,'PS1 DR1').reasons.length,0);
const scattered={...raw,rmagStd:.15};assert(!S.measurements(scattered,'PS1 DR1')[0].eligible);assert(S.objectChecks(scattered,'PS1 DR1').reasons.some(x=>x.includes('розкид')));
assert(!S.measurements({...raw,rmagStd:''},'PS1 DR1')[0].eligible);
assert(!S.measurements({...raw,rFlags:0},'PS1 DR1')[0].eligible);
assert(!S.measurements({...raw,rmag:14},'PS1 DR1')[0].eligible);
assert.equal(S.measurements({...base,e_Vmag:.02},'APASS DR9')[0].error_kind,'standard deviation of observations');
// Real parser: a corrupt coordinate in a variable list must not silently disappear.
const fs=require('node:fs'),vm=require('node:vm'),app=fs.readFileSync(require.resolve('../app.js'),'utf8'),c={num:v=>v==null||String(v).trim()===''?NaN:Number(v)};vm.createContext(c);
vm.runInContext(app.slice(app.indexOf('function parseTSV('),app.indexOf('async function query(')),c);
const header='#Table test\n#Column RAJ2000\n#Column DEJ2000\nRAJ2000\tDEJ2000\ndeg\tdeg\n----------\t----------\n';
assert.equal(c.parseTSV(header+'10\t20','RAJ2000',['RAJ2000','DEJ2000']).length,1);
for(const line of ['10\t','10\tbad','10','10\t91','360\t20'])assert.throws(()=>c.parseTSV(header+line,'RAJ2000',['RAJ2000','DEJ2000']));
assert.throws(()=>c.parseTSV(header+'10\t20\n#INFO overflow','RAJ2000',['RAJ2000','DEJ2000']));
console.log('PASS: rough target photometry; positional ambiguity; missing/saturated target; native-system isolation; ±1/3/4 boundaries; no-target/reserve fallbacks; variability veto; PS1 scatter and bright limits; corrupt catalogue rows fail closed.');
