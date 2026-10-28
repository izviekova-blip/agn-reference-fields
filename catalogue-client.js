/* Official VizieR ASU endpoints. No third-party proxy or catalogue substitution. */
(function(root){
 'use strict';
 const ENDPOINTS=Object.freeze([
  'https://vizier.cds.unistra.fr/viz-bin/asu-tsv',
  'https://vizier.cfa.harvard.edu/viz-bin/asu-tsv',
  'https://vizier.nao.ac.jp/viz-bin/asu-tsv'
 ]);
 function createClient({fetchImpl=(...args)=>fetch(...args),timeoutMs=25000}={}){
  let preferred=ENDPOINTS[0];
  return async function request(params){
   const endpoints=[preferred,...ENDPOINTS.filter(e=>e!==preferred)],attempts=[];
   for(const endpoint of endpoints){
    const url=endpoint+'?'+new URLSearchParams(params),controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
     // Keep the timeout active while downloading the body as well as the headers.
     const response=await fetchImpl(url,{signal:controller.signal,credentials:'omit'});
     if(!response.ok){
      const error=new Error('HTTP '+response.status);
      error.retryable=response.status>=500||response.status===408;
      throw error;
     }
     const text=await response.text();
     preferred=endpoint;
     return {text,url,accessed_at:new Date().toISOString()};
    }catch(error){
     attempts.push({host:new URL(endpoint).host,reason:controller.signal.aborted?'timeout':error.message});
     if(error.retryable===false)break;
    }finally{clearTimeout(timer)}
   }
   const error=new Error(attempts.map(a=>a.host+': '+a.reason).join('; '));
   error.name='CatalogueConnectionError';error.attempts=attempts;throw error;
  };
 }
 const api={createClient,ENDPOINTS};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.CatalogueClient=api;
})(typeof globalThis!=='undefined'?globalThis:this);
