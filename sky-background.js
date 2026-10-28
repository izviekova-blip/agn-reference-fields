/* Sky images are for identification only; catalogue photometry is independent. */
(function(root){
 'use strict';
 const SIZE=1400,rad=Math.PI/180;
 const LEGACY={id:'legacy',label:'DESI Legacy Surveys (DR10 + DR9 north)',short:'DESI Legacy Surveys',layer:'ls-dr10',documentation:'https://www.legacysurvey.org/dr10/description/',acknowledgements:'https://www.legacysurvey.org/acknowledgment/'};
 const DSS={id:'dss2',label:'DSS2 / CDS HiPS2FITS',short:'DSS2',hips:'CDS/P/DSS2/color',documentation:'https://alasky.cds.unistra.fr/hips-image-services/hips2fits'};
 function scale(c,size=SIZE){return 2*Math.tan(c.fov/120*rad)/rad*3600/size}
 function requests(c){
  const wcs={NAXIS:2,NAXIS1:SIZE,NAXIS2:SIZE,CTYPE1:'RA---TAN',CTYPE2:'DEC--TAN',CRPIX1:(SIZE+1)/2,CRPIX2:(SIZE+1)/2,CRVAL1:c.ra,CRVAL2:c.dec,CDELT1:-scale(c)/3600,CDELT2:scale(c)/3600,CUNIT1:'deg',CUNIT2:'deg'};
  return [
   {...LEGACY,url:'https://www.legacysurvey.org/viewer/cutout.jpg?'+new URLSearchParams({ra:c.ra,dec:c.dec,layer:LEGACY.layer,pixscale:scale(c),size:SIZE,rotate:0})},
   ...['alasky','alaskybis'].map(host=>({...DSS,url:`https://${host}.cds.unistra.fr/hips-image-services/hips2fits?`+new URLSearchParams({hips:DSS.hips,wcs:JSON.stringify(wcs),format:'jpg'})}))
  ];
 }
 // Conservative display check, not a survey footprint/photometric quality test.
 // Reject empty images and large blank patches instead of presenting them as sky.
 function usablePixels(data,width,height){
  if(width<64||height<64)return false;
  const grid=16;let min=255,max=0,good=0;
  for(let gy=0;gy<grid;gy++)for(let gx=0;gx<grid;gx++){
   let count=0,total=0;
   for(let y=Math.floor(gy*height/grid);y<Math.floor((gy+1)*height/grid);y++)for(let x=Math.floor(gx*width/grid);x<Math.floor((gx+1)*width/grid);x++){
    const i=(y*width+x)*4,v=Math.max(data[i],data[i+1],data[i+2]);
    min=Math.min(min,v);max=Math.max(max,v);total++;
    if(data[i+3]>250&&v>2){count++;good++}
   }
   if(count/total<0.5)return false;
  }
  return good/(width*height)>.9&&max-min>8;
 }
 async function fetchImage(request){
  const response=await fetch(request.url,{signal:AbortSignal.timeout(25000),credentials:'omit'});
  if(!response.ok)throw Error('HTTP '+response.status);
  if(/\/blank\.(jpg|png)(\?|$)/i.test(response.url))throw Error('No image coverage');
  const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('No image returned');
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)});
  const im=new Image();im.src=data;await im.decode();
  if(im.naturalWidth!==SIZE||im.naturalHeight!==SIZE)throw Error('Unexpected cutout dimensions');
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,256,256);
  if(!usablePixels(ctx.getImageData(0,0,256,256).data,256,256))throw Error('Empty or incomplete image');
  return {data,source:{...request,accessed_at:new Date().toISOString(),width:SIZE,height:SIZE,pixel_scale_arcsec:scaleFromUrl(request)}};
 }
 function scaleFromUrl(request){const p=new URL(request.url).searchParams;return request.id==='legacy'?Number(p.get('pixscale')):Math.abs(JSON.parse(p.get('wcs')).CDELT1)*3600}
 async function load(c,{fallback=null,fetcher=fetchImage}={}){
  const failures=[];
  for(const request of requests(c)){
   if(request.id==='dss2'&&fallback)return {...fallback,failures};
   try{return {...await fetcher(request),failures}}catch(error){failures.push({source:request.id,url:request.url,error:String(error.message)})}
  }
  const error=new Error('Sky image services unavailable');error.failures=failures;throw error;
 }
 const api={SIZE,LEGACY,DSS,scale,requests,usablePixels,load};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.SkyBackground=api;
})(typeof globalThis!=='undefined'?globalThis:this);
