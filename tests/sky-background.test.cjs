const assert=require('node:assert/strict'),S=require('../sky-background.js');
const c={ra:178.424,dec:46.211833,fov:12},requests=S.requests(c);
const url=new URL(requests[0].url);
assert.equal(url.searchParams.get('layer'),'ls-dr10');assert.equal(Number(url.searchParams.get('size')),1400);
const scale=Number(url.searchParams.get('pixscale'));
assert(Math.abs(2*Math.atan(scale*1400/7200*Math.PI/180)*180/Math.PI*60-c.fov)<1e-12);
const wcs=JSON.parse(new URL(requests[1].url).searchParams.get('wcs'));
assert.equal(wcs.CDELT1,-scale/3600);assert.equal(wcs.CDELT2,scale/3600);assert.equal(wcs.CRPIX1,700.5);
function image(){const a=new Uint8ClampedArray(256*256*4);for(let i=0;i<a.length;i+=4){a[i]=20+(i/4)%32;a[i+1]=30;a[i+2]=40;a[i+3]=255}return a}
const good=image();assert(S.usablePixels(good,256,256));
assert(!S.usablePixels(new Uint8ClampedArray(good.length),256,256));
const flat=new Uint8ClampedArray(good.length).fill(255);assert(!S.usablePixels(flat,256,256));
const partial=image();for(let y=0;y<50;y++)for(let x=0;x<256;x++)partial.fill(0,(y*256+x)*4,(y*256+x+1)*4);assert(!S.usablePixels(partial,256,256));
(async()=>{
 let calls=[];const fetcher=async r=>{calls.push(r.id);if(r.id==='legacy')throw Error('empty');return {data:'DSS',source:r}};
 let result=await S.load(c,{fetcher});assert.equal(result.source.id,'dss2');assert.deepEqual(calls,['legacy','dss2']);assert.equal(result.failures.length,1);
 calls=[];const fallback={data:'embedded DSS',source:S.DSS};result=await S.load(c,{fetcher,fallback});assert.equal(result.data,'embedded DSS');assert.deepEqual(calls,['legacy']);
 result=await S.load(c,{fallback,fetcher:async r=>({data:'DESI',source:r})});assert.equal(result.source.id,'legacy');
 await assert.rejects(S.load(c,{fetcher:async()=>{throw Error('offline')}}));
 console.log('PASS: matching TAN geometry; blank/partial-image rejection; DESI priority; cached DSS preservation; live DSS fallback; total failure.');
})().catch(e=>{console.error(e);process.exitCode=1});
