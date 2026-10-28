/* Native multi-catalogue photometry; no user magnitude, colour or band cuts.
   Catalogue candidates are not certified photometric standards. */
const Science = (() => {
  const n = v => v === null || v === undefined || String(v).trim() === '' ? NaN : Number(v);
  const LIMITS=Object.freeze({ruwe:1.4,kinematicSNR:3,isolation:10,ipdMultiPeak:2,photometricError:.05,ps1Scatter:.05,minPS1Measurements:3,maxUnpropagatedPM:50,targetError:.3,targetMatchAPASS:2,targetMatchPS1:1,brightnessClose:1,brightnessWindow:3,brightnessReserve:4});
  // Conservative bright limits published by the PS1 archive; not user magnitude cuts.
  const PS1_BRIGHT=Object.freeze({g:14.5,r:15,i:15,z:14,y:13});
  const isPS1 = c => /PS1|Pan-STARRS/i.test(c || '');
  const isAPASS = c => /APASS/i.test(c || '');
  function photometry(catalog, band) {
    if (isPS1(catalog)) return {band:band+'_P1',label:band+'ₚ₁',system:'Pan-STARRS1',zero_point:'AB',kind:'mean PSF',transformed:false};
    if (isAPASS(catalog) && ['B','V'].includes(band)) return {band,label:band,system:'Johnson',zero_point:'Vega',kind:'catalogue',transformed:false};
    if (isAPASS(catalog) && ['g','r','i'].includes(band)) return {band:band+"'",label:band+'′',system:'Sloan / APASS',zero_point:'AB',kind:'catalogue',transformed:false};
    if (isAPASS(catalog) && band === 'R') return {band:'Rc_est',label:'R꜀ (est.)',system:'Cousins estimate',zero_point:'Vega',kind:'Lupton (2005) r−i applied to APASS Sloan',transformed:true,transformation:'Rc = 0.7064 r + 0.2936 i - 0.1439',fit_scatter_mag:0.0072,system_transfer_uncertainty:'not quantified; provisional',reference:'https://www.sdss3.org/dr8/algorithms/sdssUBVRITransform.php'};
    return {band,label:band,system:'supplied table',zero_point:'unverified',kind:'supplied',transformed:false};
  }
  // Every available native passband is retained. Quality notes never become
  // user magnitude, colour, or uncertainty cuts.
  function measurements(raw,catalog) {
    const ap=isAPASS(catalog),bands=ap?['B','V','g','r','i']:['g','r','i','z','y'];
    return bands.flatMap(band=>{
      const col=ap&&['g','r','i'].includes(band)?band+"'mag":band+'mag',mag=n(raw[col]);
      if(!Number.isFinite(mag)||mag===-999)return [];
      const err=n(raw['e_'+col]),warnings=[];let eligible=err>0&&err<=LIMITS.photometricError;
      if(err>LIMITS.photometricError)warnings.push('Похибка > 0.05 mag; лише довідково');
      if(!(err>0))warnings.push('Похибка недоступна');
      if(ap){
        if(n(raw['u_e_'+col])!==0||!(n(raw.nobs)>=2)){eligible=false;warnings.push('APASS: немає підтверджених повторних вимірювань');}
      }else{
        const f=n(raw[band+'Flags']),count=n(raw['o_'+col]);
        if(!Number.isFinite(f)){eligible=false;warnings.push('Прапорці якості недоступні');}
        else {if(f&(1|2|4|8192)||!(f&24))eligible=false;if(f&3)warnings.push('Сумнівна якість вимірювання');if(f&4)warnings.push('Синтетична фотометрія');if(f&8192)warnings.push('Ознака протяжності у смузі');if(!(f&24))warnings.push('PS1: немає прапорця виміряної фотометрії');}
        if(!(count>=LIMITS.minPS1Measurements)){eligible=false;warnings.push('PS1: менше трьох вимірювань');}
        const scatter=n(raw[band+'magStd']);
        if(!(scatter>=0&&scatter<=LIMITS.ps1Scatter)){eligible=false;warnings.push('PS1: розкид > 0.05 mag або недоступний');}
        if(mag<PS1_BRIGHT[band]){eligible=false;warnings.push('PS1: яскравіше консервативної межі насичення');}
      }
      return [{...photometry(catalog,band),native_band:band,catalog,mag,err:err>0?err:null,error_kind:ap?(n(raw['u_e_'+col])===0?'standard deviation of observations':'single-observation / unverified uncertainty'):'error of mean PSF magnitude',scatter_mag:ap?(n(raw['u_e_'+col])===0&&err>0?err:null):(n(raw[band+'magStd'])>=0?n(raw[band+'magStd']):null),measurements:ap?null:n(raw['o_'+col]),eligible,warnings}];
    });
  }
  function objectChecks(raw,catalog) {
    const reasons=[],warnings=[];
    if(isPS1(catalog)){
      const q=n(raw.Qual),o=n(raw.f_objID);
      if(Number.isFinite(q)){
        if(q&3)reasons.push('PS1: протяжне джерело');
        if(q&192)reasons.push('PS1: сумнівна якість');
        if(!(q&4))reasons.push('PS1: немає доброї власної фотометрії');
      }else reasons.push('PS1: прапорці якості недоступні');
      if(Number.isFinite(o)){if(o&2044)reasons.push('PS1: QSO, змінність, транзієнт або рухоме джерело');if(o&3)reasons.push('PS1: сумнівна якість');}
      else reasons.push('PS1: прапорці якості недоступні');
    }
    // Do not call large scatter confirmed variability. Hold such sources for
    // light-curve review, including an APASS counterpart merged with this record.
    if(isPS1(catalog))for(const band of ['g','r','i','z','y']){
      const f=n(raw[band+'Flags']),err=n(raw['e_'+band+'mag']);
      if(Number.isInteger(f)&&f>=0&&(f&24)&&!(f&(1|2|4|8192))&&n(raw['o_'+band+'mag'])>=LIMITS.minPS1Measurements&&err>0&&err<=LIMITS.photometricError&&n(raw[band+'mag'])>=PS1_BRIGHT[band]&&n(raw[band+'magStd'])>LIMITS.ps1Scatter)
        reasons.push('PS1: великий розкид повторних вимірювань — потрібна перевірка часового ряду');
    }
    return {reasons,warnings};
  }
  function gaiaChecks(s,t){
    if(!t){s.reasons.push('Немає надійного Gaia-відповідника');return;}
    if(s.ambiguous)s.reasons.push('Неоднозначний Gaia-матч');
    const ruwe=n(t.RUWE),ep=n(t.e_Plx),er=n(t.e_pmRA),ed=n(t.e_pmDE),pm=Math.hypot(n(t.pmRA),n(t.pmDE));
    s.plx_snr=ep>0?n(t.Plx)/ep:null;
    s.pm_snr=er>0&&ed>0?pm/Math.hypot(er,ed):null;
    if(!(ruwe>0&&ruwe<LIMITS.ruwe))s.reasons.push('Gaia: RUWE ≥ 1.4 або відсутня');
    if(!(s.plx_snr>=LIMITS.kinematicSNR||s.pm_snr>=LIMITS.kinematicSNR))s.reasons.push('Gaia: недостатня значущість паралаксу / власного руху');
    if(n(t.Dup)!==0)s.reasons.push('Gaia: дубльоване джерело або прапорець відсутній');
    if(!(n(t.IPDfmp)>=0&&n(t.IPDfmp)<=LIMITS.ipdMultiPeak))s.reasons.push('Gaia: множинні піки IPD > 2% або дані відсутні');
    const flag=String(t.VarFlag||'').trim().toUpperCase();s.gaia_variability=flag||'MISSING';
    if(flag==='VARIABLE')s.reasons.push('Gaia VARIABLE');
    else if(!['NOT_AVAILABLE','CONSTANT'].includes(flag))s.reasons.push('Gaia: прапорець змінності недоступний');
    if(s.nn!==null&&!(n(s.nn)>=LIMITS.isolation))s.reasons.push('Gaia-сусід ближче 10″');
    if(pm>LIMITS.maxUnpropagatedPM)s.reasons.push('Власний рух > 50 mas/yr: потрібне епохове зіставлення');
  }
  function estimateTarget(catalogues,centre,distance){
    const matches=[],estimates=[];
    for(const cat of catalogues){
      const ap=isAPASS(cat.catalog),radius=ap?LIMITS.targetMatchAPASS:LIMITS.targetMatchPS1;
      const nearby=cat.rows.map(raw=>({raw,ra:n(raw.RAJ2000),dec:n(raw.DEJ2000)})).filter(p=>Number.isFinite(p.ra)&&Number.isFinite(p.dec)).map(p=>({...p,distance:distance(p,centre)})).filter(p=>p.distance<=radius).sort((a,b)=>a.distance-b.distance);
      const match={catalog:cat.catalog,table:cat.table,radius_arcsec:radius,count:nearby.length,status:nearby.length===1?'unique positional association':nearby.length?'ambiguous':'no counterpart'};
      matches.push(match);if(nearby.length!==1)continue;
      const p=nearby[0],raw=p.raw;Object.assign(match,{ra:p.ra,dec:p.dec,separation_arcsec:p.distance,raw});
      // The target may be variable, a quasar, or extended: candidate-star
      // astrometric/variability gates must NOT be applied to its brightness.
      for(const m of measurements(raw,cat.catalog)){
        if(!(m.err>0&&m.err<=LIMITS.targetError))continue;
        if(ap){if(![0,1].includes(n(raw['u_e_'+(m.native_band.match(/^[gri]$/)?m.native_band+"'mag":m.native_band+'mag')]))||n(raw.Vmag)<10)continue;}
        else {const f=n(raw[m.native_band+'Flags']);if(!Number.isInteger(f)||f<0||!(f&24)||(f&7)||!(n(raw['o_'+m.native_band+'mag'])>=1)||m.mag<PS1_BRIGHT[m.native_band])continue;}
        estimates.push({...m,eligible:undefined,purpose:'rough target brightness, not a comparison-star measurement',separation_arcsec:p.distance,ra:p.ra,dec:p.dec,table:cat.table,accessed_at:cat.accessed_at,extended:!ap&&Boolean(n(raw.Qual)&3),epoch:ap?null:raw.Epoch||null});
      }
    }
    const order=['V','r_P1','g_P1','i_P1',"r'","g'","i'",'B','z_P1','y_P1'];
    estimates.sort((a,b)=>order.indexOf(a.band)-order.indexOf(b.band));
    return {status:estimates.length?'approximate':'unavailable',primary:estimates[0]||null,estimates,matches,method:'unique positional match; APASS V preferred; native systems only; no epoch correction or magnitude transformation',caveat:'archival catalogue brightness may differ from current target brightness; AGN host/aperture/PSF mismatch is not corrected'};
  }
  function brightnessComparison(star,target){
    const pairs=(target?.estimates||[]).flatMap(t=>star.photometry.filter(p=>p.eligible&&p.band===t.band&&p.system===t.system&&p.zero_point===t.zero_point&&p.catalog===t.catalog).map(p=>({catalog:p.catalog,band:p.band,label:p.label,system:p.system,zero_point:p.zero_point,target_mag:t.mag,target_err:t.err,star_mag:p.mag,star_err:p.err,delta:p.mag-t.mag,abs_delta:Math.abs(p.mag-t.mag)})));
    // Target estimates already have deterministic V / r_P1 / g_P1 priority.
    const c=pairs[0];if(!c)return {tier:target?.estimates?.length?'unknown':'catalogue_only',comparisons:[]};
    return {...c,tier:c.abs_delta<=LIMITS.brightnessClose?'close':c.abs_delta<=LIMITS.brightnessWindow?'near':c.abs_delta<=LIMITS.brightnessReserve?'reserve':'outside',comparisons:pairs};
  }
  function finalScreen(stars,target=null){
    for(const s of stars){
      if(!s.photometry.some(p=>p.eligible))s.reasons.push('Немає жодної смуги з надійною повторною фотометрією та похибкою ≤ 0.05 mag');
      s.reasons=[...new Set(s.reasons)];s.accepted=s.reasons.length===0;s.selected=s.accepted;
      s.role='SPARE';s.validation_status=s.accepted?'catalogue-screened candidate; time-series validation pending':'excluded by automatic screening';
    }
    const v=s=>s.photometry.find(p=>isAPASS(p.catalog)&&p.band==='V'&&p.eligible);
    for(const s of stars){s.apass_v=Boolean(v(s));s.brightness=brightnessComparison(s,target);s.recommendation=s.accepted?s.brightness.tier:'excluded';}
    const accepted=stars.filter(s=>s.accepted),hasTarget=Boolean(target?.estimates?.length);
    let pool=hasTarget?accepted.filter(s=>['close','near'].includes(s.brightness.tier)):accepted;
    if(hasTarget&&!pool.length)pool=accepted.filter(s=>s.brightness.tier==='reserve');
    const primary=pool.filter(s=>s.apass_v&&(!hasTarget||s.brightness.band==='V'));
    const selected=new Set(primary.length?primary:pool);
    for(const s of stars)s.selected=selected.has(s);
    const tiers={close:0,near:1,reserve:2,outside:3,unknown:4,catalogue_only:4,excluded:5};
    stars.sort((a,b)=>Number(b.accepted)-Number(a.accepted)||tiers[a.recommendation]-tiers[b.recommendation]||Number(b.apass_v)-Number(a.apass_v)||(a.brightness.abs_delta??Infinity)-(b.brightness.abs_delta??Infinity)||(v(a)?.err??Infinity)-(v(b)?.err??Infinity)||a.ra-b.ra||a.dec-b.dec);
    stars.forEach((s,i)=>s.id=String(i+1));return stars;
  }
  // Merge only unique-per-catalogue links to the same Gaia source. Ambiguous
  // detections remain separate and carry an explicit association warning.
  function mergeRecords(records) {
    const counts=new Map();
    for(const r of records)if(r.gaia_id&&!r.ambiguous){const k=r.source+'|'+r.gaia_id;counts.set(k,(counts.get(k)||0)+1);}
    const duplicatedIds=new Set(records.filter(r=>r.gaia_id&&counts.get(r.source+'|'+r.gaia_id)>1).map(r=>r.gaia_id));
    const merged=[],groups=new Map();
    for(const r of records){
      if(duplicatedIds.has(r.gaia_id))r.reasons.push('Неоднозначність: кілька джерел одного каталогу мають спільний Gaia ID');
      const unique=r.gaia_id&&!r.ambiguous&&counts.get(r.source+'|'+r.gaia_id)===1;
      if(r.gaia_id&&counts.get(r.source+'|'+r.gaia_id)>1)r.warnings.push('Кілька джерел одного каталогу біля цієї зорі Gaia; відповідність потребує перевірки');
      const key=unique?r.gaia_id:null,existing=key&&groups.get(key);
      if(existing){existing.photometry.push(...r.photometry);existing.catalogue_records.push(...r.catalogue_records);existing.reasons.push(...r.reasons);existing.warnings.push(...r.warnings);existing.variability_checks.push(...(r.variability_checks||[]));}
      else {const copy={...r,variability_checks:[...(r.variability_checks||[])],photometry:[...r.photometry],catalogue_records:[...r.catalogue_records],reasons:[...r.reasons],warnings:[...r.warnings]};merged.push(copy);if(key)groups.set(key,copy);}
    }
    merged.sort((a,b)=>Number(Boolean(a.reasons.length))-Number(Boolean(b.reasons.length))||a.ra-b.ra||a.dec-b.dec);
    merged.forEach((s,i)=>{
      s.id=String(i+1);s.reasons=[...new Set(s.reasons)];s.warnings=[...new Set(s.warnings)];
      s.accepted=!s.reasons.length;s.selected=s.accepted;s.role='REF';
      s.sources=[...new Set(s.photometry.map(p=>p.catalog))];s.source=s.sources.join(' + ');
      // Legacy fields are retained for saved-file compatibility only.
      s.mag=s.photometry[0]?.mag??null;s.err=s.photometry[0]?.err??null;
    });
    return merged;
  }
  function curatedError(star,band) {
    if(band==='R' && (!(n(star.er)>0)||!(n(star.ei)>0)))return null;
    return n(star['e'+band])>0?n(star['e'+band]):null;
  }
  return {LIMITS,PS1_BRIGHT,photometry,measurements,objectChecks,gaiaChecks,estimateTarget,brightnessComparison,finalScreen,mergeRecords,curatedError};
})();
if(typeof module!=='undefined')module.exports=Science;
