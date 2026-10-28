const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {createClient,ENDPOINTS}=require('../catalogue-client.js');
const params={'-source':'II/336/apass9','-c':'178.424 46.211833','-c.rm':8.7686,'-out.max':'20000','-out':"RAJ2000,DEJ2000,g'mag"};
const ok=text=>({ok:true,text:async()=>text});
(async()=>{
 const calls=[];
 const request=createClient({fetchImpl:async(url,options)=>{
  calls.push(url);assert.equal(options.credentials,'omit');
  if(url.startsWith(ENDPOINTS[0]))return {ok:false,status:503};
  return ok('table');
 }});
 const r=await request(params);
 assert.equal(r.text,'table');assert(r.url.startsWith(ENDPOINTS[1]));assert(!isNaN(Date.parse(r.accessed_at)));
 for(const u of calls)assert.deepEqual(Object.fromEntries(new URL(u).searchParams),Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)])));
 calls.length=0;await request(params);assert.equal(calls.length,1);assert(calls[0].startsWith(ENDPOINTS[1]));
 let n=0;
 const unavailable=createClient({fetchImpl:async()=>{n++;throw new TypeError('Failed to fetch')}});
 await assert.rejects(unavailable(params),e=>e.name==='CatalogueConnectionError'&&e.attempts.length===3);assert.equal(n,3);
 // Timeout includes a stalled body after successful HTTP headers.
 n=0;
 const slow=createClient({timeoutMs:5,fetchImpl:async(url,{signal})=>{
  if(++n>1)return ok('recovered');
  return {ok:true,text:()=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}))};
 }});
 assert.equal((await slow(params)).text,'recovered');assert.equal(n,2);
 // Do not sidestep authorization or rate-limit responses through mirrors.
 for(const status of [400,403,429]){
  let count=0;const rejected=createClient({fetchImpl:async()=>{count++;return {ok:false,status}}});
  await assert.rejects(rejected(params));assert.equal(count,1);
 }
 // Exercise the actual app parser/query: a 200 response cannot bypass data validation.
 const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
 let body='<!doctype html><html>Service unavailable</html>';
 const context={requestCatalogue:async()=>({text:body,url:'https://example.test/catalogue',accessed_at:'2026-10-28T00:00:00Z'}),num:v=>v===''?NaN:Number(v),console};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function parseTSV('),source.indexOf('const APASS_COLS')),context);
 const cfg={ra:178.424,dec:46.211833,fov:12,isolation:10,match:1};
 await assert.rejects(context.query('test',['RAJ2000','DEJ2000'],cfg));
 body='#Table test\n#Column RAJ2000\n#Column DEJ2000\n';
 assert.equal((await context.query('test',['RAJ2000','DEJ2000'],cfg)).rows.length,0);
 body+='#INFO overflow\n';
 await assert.rejects(context.query('test',['RAJ2000','DEJ2000'],cfg));
 // Missing/malformed photometric columns must still fail closed.
 await assert.rejects(context.query('test',['RAJ2000','DEJ2000','Vmag'],cfg));
 body='#Table test\n#Column RAJ2000\n#Column DEJ2000\nRAJ2000\tDEJ2000\ndeg\tdeg\n---\t---\n178.4\t46.2\n#INFO overflow\n';
 await assert.rejects(context.query('test',['RAJ2000','DEJ2000'],cfg));
 console.log('PASS: official mirror failover; identical queries; successful URL provenance; preferred endpoint; total failure; body timeout; HTTP rejection; strict app parser.');
})().catch(e=>{console.error(e);process.exitCode=1});
