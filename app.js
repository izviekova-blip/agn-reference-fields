'use strict';
const $=id=>document.getElementById(id),rad=Math.PI/180;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>v===null||v===undefined||String(v).trim()===''?NaN:Number(v),fmt=(v,n=3)=>Number.isFinite(num(v))?num(v).toFixed(n):'—';
let current=null,fields=[],locals=[],busy=false,bg=null;
let statusSource='',statusError=false;
function message(s,error=false){statusSource=s;statusError=error;$('status').textContent=tr(s);$('status').classList.toggle('error',error);translateDOM($('status'))}
function coordinate(v,isRA){let s=v.trim().replace(/[−–]/g,'-'),a=s.split(/[:\s]+/);if(a.length===1){let x=Number(s);if(!s||!Number.isFinite(x)||x<(isRA?0:-90)||x>=(isRA?360:90.00000001))throw Error('Координати поза межами: RA 0 ≤ RA < 360°, Dec −90…+90°.');return x}if(a.length!==3||a.some(v=>!Number.isFinite(Number(v))))throw Error('Формат координат: градуси або три компоненти через двокрапку.');let [h,m,sec]=a.map(Number);if(m<0||m>=60||sec<0||sec>=60||isRA&&(h<0||h>=24))throw Error('Некоректні години, хвилини або секунди.');let x=(Math.abs(h)+m/60+sec/3600)*(s.startsWith('-')?-1:1)*(isRA?15:1);if(isRA?(x<0||x>=360):Math.abs(x)>90)throw Error('Координати поза допустимими межами.');return x}
function project(ra,dec,c){let a=(ra-c.ra)*rad,d=dec*rad,d0=c.dec*rad,cosc=Math.sin(d0)*Math.sin(d)+Math.cos(d0)*Math.cos(d)*Math.cos(a);if(cosc<=0)return [Infinity,Infinity];let x=Math.cos(d)*Math.sin(a)/cosc,y=(Math.cos(d0)*Math.sin(d)-Math.sin(d0)*Math.cos(d)*Math.cos(a))/cosc;let span=2*Math.tan(c.fov/120*rad);return [380-x/span*640,380-y/span*640]}
function separation(a,b){let d1=a.dec*rad,d2=b.dec*rad,dr=(a.ra-b.ra)*rad,dd=d1-d2;return 2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dd/2)**2+Math.cos(d1)*Math.cos(d2)*Math.sin(dr/2)**2)))/rad*3600}
function download(content,name,type){let u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;a.textContent=tr('Завантажити ')+name;let old=document.getElementById('lastExport');if(old){URL.revokeObjectURL(old.href);old.remove()}a.id='lastExport';a.style.cssText='display:block;margin:10px 0;font-size:12px;text-decoration:underline';document.querySelector('.exports').after(a);a.click();message('Файл '+name+' сформовано. Якщо завантаження не почалося, скористайтеся посиланням під кнопками експорту.')}
const filename=()=>String(current?.name||'field').replace(/[^\p{L}\p{N}_-]/gu,'_');
function provenance(){return {...current,photometric_systems:[...new Map(current.stars.flatMap(s=>s.photometry||[]).map(p=>[p.catalog+'|'+p.band,{catalog:p.catalog,band:p.band,system:p.system,zero_point:p.zero_point,transformed:p.transformed}])).values()],selection_status:'automatically screened candidates / curated sequence; never a guarantee of non-variability',observer_checks:{linearity:false,saturation:false,time_series_stability:false,instrumental_colour_transformation:false},background:bg?'DSS2 color / CDS HiPS2FITS':'catalogue positions only',chart_style:$('white').checked?'monochrome sky / red target arrow / green selected-star markers':'screen colour',photometry_unchanged_by_chart_style:true,creator:'Reference Field Lab — Inna Izviekova',generator_version:'1.5',collection_doi:'10.5281/zenodo.22036357',doi_scope:'AGN Reference Fields curated collection; not the web generator',epoch_check:'No proper-motion epoch propagation; manual verification required',exported_at:new Date().toISOString()}}
const localText=(uk,en)=>lang==='uk'?uk:en;
const systemLabel=(catalog,band)=>{let p=Science.photometry(catalog,band);let system=p.system==='supplied table'?localText('надана таблиця','supplied table'):p.system==='Cousins estimate'?localText('оцінка Cousins','Cousins estimate'):p.system;let zero=p.zero_point==='unverified'?localText('система не підтверджена','unverified zero point'):p.zero_point;return `${p.label} · ${system} · ${zero}`};
function chartSVG({monochrome=false}={}){
 if(!current)return '';
 const dense=current.stars.filter(s=>s.selected).length>80;
 const print=monochrome||$('white').checked,ink=print?'#111111':'#d6dfcc',paper=print?'#ececeb':'#17251f',line=print?'#c7c7c7':'#33463a',accent=print?'#00843d':'#bdce83';
 let r=`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1658" viewBox="0 0 760 840" role="img" aria-label="${esc(current.name)} finding chart"><defs><clipPath id="plotClip"><rect x="60" y="60" width="640" height="640"/></clipPath><filter id="paperImage" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="-0.92" intercept="0.92"/><feFuncG type="linear" slope="-0.92" intercept="0.92"/><feFuncB type="linear" slope="-0.92" intercept="0.92"/></feComponentTransfer></filter></defs><rect width="760" height="840" fill="${paper}"/><g font-family="Arial,sans-serif" fill="${ink}"><text x="60" y="28" font-size="16">${esc(current.name.slice(0,42))} · ${fmt(current.fov,1)}′ × ${fmt(current.fov,1)}′</text><text x="60" y="47" font-size="11">${esc(localText('Усі доступні смуги · магнітуди та джерела в таблиці','All available bands · magnitudes and sources in the table'))}</text><text x="700" y="28" text-anchor="end" font-size="9">${esc(localText('МАПА СТАНДАРТІВ','FINDING CHART'))}</text>`;
 if(bg)r+=`<image x="60" y="60" width="640" height="640" href="${bg}" ${print?'filter="url(#paperImage)"':''}/>`;
 if(!print)for(let t=0;t<=4;t++){let a=60+t*160;r+=`<path d="M${a} 60V700 M60 ${a}H700" stroke="${line}" stroke-width=".7" ${bg?'opacity=".3"':''}/>`}
 r+=`<g clip-path="url(#plotClip)">`;
 for(const star of current.stars){if(star.accepted===false||star.selected!==true)continue;let [x,y]=project(star.ra,star.dec,current);if(x<60||x>700||y<60||y>700)continue;let selected=star.selected!==false,colour=accent;let radius=dense?2:3;
 r+=`<g class="selected-point" data-star="${esc(star.id)}" tabindex="0" role="button" aria-label="${esc(localText('Зоря ','Star ')+star.id)}, ${esc(star.source)}"><title>${esc(star.id)} · ${esc(star.source)}</title><circle cx="${x}" cy="${y}" r="12" fill="transparent"/><circle cx="${x}" cy="${y}" r="${radius}" fill="${print?'#111111':colour}" opacity="${selected?1:print?.35:.25}"/>`;
 if(selected){let labelX=x>635?x-13:x+13,labelY=y<85?y+20:y-10;r+=`${print?`<circle cx="${x}" cy="${y}" r="${dense?6:10}" fill="none" stroke="#ffffff" stroke-width="3.6"/>`:""}<circle cx="${x}" cy="${y}" r="${dense?6:10}" fill="none" stroke="${colour}" stroke-width="${print?1.8:1}"/><text x="${labelX}" y="${labelY}" text-anchor="${x>635?'end':'start'}" fill="${colour}" font-size="${dense?9:12}" paint-order="stroke" stroke="${paper}" stroke-width="${dense?2:3}" stroke-linejoin="round">${esc(star.id)}${star.role==='CHECK'?' [C]':''}</text>`}r+='</g>';
 }
 const targetInk=print?'#d7191c':'#dcaa79';
 if(print)r+=`<g class="target-arrow" transform="translate(14 -14)"><title>${esc(localText('Об’єкт дослідження','Target'))}</title><path d="M425 335L391 369" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/><path d="M425 335L391 369" fill="none" stroke="${targetInk}" stroke-width="2.8" stroke-linecap="round"/><path d="M384 376L389 362L398 371Z" fill="${targetInk}" stroke="#ffffff" stroke-width="1" stroke-linejoin="round"/></g>`;
 else r+=`<path d="M362 380H374 M386 380H398 M380 362V374 M380 386V398" stroke="${targetInk}" stroke-width="1.5"/><circle cx="380" cy="380" r="6" fill="none" stroke="${targetInk}"/>`;
 r+=`</g><path d="M84 116V78L81 85M84 78L87 85 M116 116H78L85 113M78 116L85 119" stroke="${ink}" fill="none"/><text x="80" y="72" font-size="10">N</text><text x="65" y="120" font-size="10">E</text>`;
 let scale=current.fov/5,px=2*Math.tan(scale/120*rad)/(2*Math.tan(current.fov/120*rad))*640;
 r+=`<path d="M${700-px} 720H700 M${700-px} 716V724 M700 716V724" stroke="${ink}"/><text x="${700-px/2}" y="740" text-anchor="middle" font-size="11">${fmt(scale,1)} arcmin</text><text x="60" y="723" font-size="11">ICRS · RA ${fmt(current.ra,6)}° · Dec ${fmt(current.dec,6)}° · TAN</text><text x="60" y="744" font-size="10">${esc(current.catalog)}${bg?' · DSS2 / CDS HiPS2FITS':''}</text><text x="60" y="764" font-size="10">${esc(localText('Магнітуди — з каталогу; фон — для ідентифікації.','Catalogue magnitudes; background image for identification.'))}</text><text x="60" y="784" font-size="10">${esc(localText('Кандидати / авторська послідовність; стабільність перевіряється окремо.','Candidates / curated sequence; stability requires independent validation.'))}</text><text x="60" y="816" font-size="11" letter-spacing=".7">REFERENCE FIELD LAB · INNA IZVIEKOVA</text><text x="700" y="816" text-anchor="end" font-size="9">${new Date().toISOString().slice(0,10)}</text></g></svg>`;
 return r;
}
function draw(){if(!current)return;updatePaperExport();$('chart').innerHTML=chartSVG();ChartViewport.mount(current);$('background').textContent=bg?'Прибрати DSS2':'Додати зображення DSS2';$('chartTitle').textContent=current.name;$('chartMeta').textContent=`${current.catalog} · ${fmt(current.fov,1)}′`;$('modeBadge').textContent=current.mode==='curated'?'ГОТОВЕ ПОЛЕ':localText('БЛИСК + ЯКІСТЬ','BRIGHTNESS + QUALITY');$('chartNote').textContent=(bg?'DSS2 / CDS HiPS2FITS + каталожні позиції':'Схема каталожних позицій')+' · північ угорі, схід ліворуч · TAN';$('aladin').href='https://aladin.cds.unistra.fr/AladinLite/?target='+encodeURIComponent(current.ra+' '+current.dec)+'&fov='+current.fov/60;$('audit').textContent=JSON.stringify(provenance(),null,2);$('chart').querySelectorAll('[data-star]').forEach(e=>{const toggle=()=>{let s=current.stars.find(s=>String(s.id)===e.dataset.star);if(s.accepted===false)return;s.selected=!s.selected;refreshSelection()};e.onclick=toggle;e.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle()}}});skyStatus(current,current.sky_status||(bg?'ready':'hidden'),current.sky_error||'');translateDOM()}
function ensurePhotometry(field){
 if(!field.original && field.screening_version!=='1.5'){
  for(const s of field.stars){s.accepted=false;s.selected=false;s.reasons=[...new Set([...(s.reasons||[]),'Для цього збереженого поля потрібен запит до каталогів. Натисніть «Знайти зорі».'])];}
 }

 for(const s of field.stars){
  if(Array.isArray(s.photometry)&&s.photometry.length)continue;
  const original=field.original?.stars.find(o=>String(o.id)===String(s.id)),catalog=s.source||field.catalog||'Supplied standard-star table';
  s.photometry=original?['B','V','g','r','i','R'].filter(b=>Number.isFinite(num(original[b]))).map(b=>({...Science.photometry(catalog,b),native_band:b,catalog,mag:num(original[b]),err:Science.curatedError(original,b),warnings:[...(Science.curatedError(original,b)===null?['Похибка недоступна']:[]),...(b==='R'?['R꜀: попередня оцінка Lupton з APASS; систематика не оцінена']:[])]})):[{...Science.photometry(catalog,field.band),native_band:field.band,catalog,mag:num(s.mag),err:num(s.err)>0?num(s.err):null,warnings:[]}].filter(p=>Number.isFinite(p.mag));
 }
}
function photometryHTML(s){
 const catalogs=[...new Set(s.photometry.map(p=>p.catalog))];
 return catalogs.map(c=>`<div class="photometry-block"><strong class="catalog-name">${esc(c)}</strong><div class="band-values">${s.photometry.filter(p=>p.catalog===c).sort((a,b)=>s.apass_v?Number(b.band==='V')-Number(a.band==='V'):0).map(p=>`<div class="band-value"><b>${esc(p.label)}</b> <span>${fmt(p.mag)} <span class="uncertainty">± ${fmt(p.err)}</span></span><small>${esc(p.system)} · ${esc(p.zero_point)}${p.transformed?' · '+localText('оцінка','estimate'):''}</small>${p.scatter_mag!=null?`<small>${localText('Розкид σ','Scatter σ')} ${fmt(p.scatter_mag,3)} mag</small>`:''}${typeof p.eligible==='boolean'?`<small class="${p.eligible?'eligible-band':'measurement-warning'}">${p.eligible?localText('Пройшла перевірку фотометрії','Passed photometry screening'):localText('Лише довідково','Reference only')}</small>`:''}${p.warnings?.length?`<small class="measurement-warning">${esc(p.warnings.map(tr).join('; '))}</small>`:''}</div>`).join('')}</div></div>`).join('');
}
function sourceLinks(s){return [...new Set(s.photometry.map(p=>p.catalog))].map(c=>{
 let table=/PS1|Pan-STARRS/.test(c)?'II/349/ps1':/APASS/.test(c)?'II/336/apass9':null;
 let url=table?'https://vizier.cds.unistra.fr/viz-bin/VizieR?-source='+encodeURIComponent(table)+'&-c='+encodeURIComponent(s.ra+' '+s.dec)+'&-c.rs=3':current.source_url;
 return url?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(c)} ↗</a>`:'';
}).join('<br>')}
function refreshSelection(){
 draw();$('sampleSummary').textContent=recommendationSummary();
 const stars=new Map(current.stars.map(s=>[String(s.id),s]));
 $('rows').querySelectorAll('[data-select]').forEach(el=>{const star=stars.get(el.dataset.select);el.checked=star.selected;el.closest('tr').classList.toggle('selected',star.selected)});
 $('count').textContent=localText(`${current.stars.filter(s=>s.selected).length} на мапі стандартів · ${current.stars.filter(s=>s.accepted!==false).length} кандидатів`,`${current.stars.filter(s=>s.selected).length} on finding chart · ${current.stars.filter(s=>s.accepted!==false).length} candidates`);
}
function render(){
 ensurePhotometry(current);draw();$('originalChart').hidden=!current.original?.static_chart;if(current.original?.static_chart)$('originalChart').href=current.original.static_chart;
 let shown=current.stars.filter(s=>current.mode==='curated'||s.accepted!==false||$('showRejected').checked);
 $('resultTitle').textContent=localText('Зорі та всі доступні магнітуди','Stars and all available magnitudes');
 $('count').textContent=localText(`${current.stars.filter(s=>s.selected).length} на мапі стандартів · ${current.stars.filter(s=>s.accepted!==false).length} кандидатів`,`${current.stars.filter(s=>s.selected).length} on finding chart · ${current.stars.filter(s=>s.accepted!==false).length} candidates`);
 $('resultNote').textContent=(current.note||'')+(current.catalogue_status?.failed?.length?' '+localText('Частковий результат — недоступно: ','Partial result — unavailable: ')+current.catalogue_status.failed.join(', '):'')+(current.catalogue_status?.not_covered?.length?' '+localText('Поза покриттям: ','Outside coverage: ')+current.catalogue_status.not_covered.join(', '):'');
 const accepted=current.stars.filter(s=>s.accepted!==false),apassCount=accepted.filter(s=>s.photometry.some(p=>/APASS/.test(p.catalog))).length,psOnly=accepted.filter(s=>s.photometry.some(p=>/PS1|Pan-STARRS/.test(p.catalog))&&!s.photometry.some(p=>/APASS/.test(p.catalog))).length,vCount=accepted.filter(s=>s.photometry.some(p=>/APASS/.test(p.catalog)&&p.band==='V'&&p.eligible)).length;
 $('sampleSummary').textContent=recommendationSummary();renderTargetEstimate();
 $('rows').innerHTML=shown.length?shown.map((s,i)=>`${current.mode!=='curated'&&(i===0||s.recommendation!==shown[i-1].recommendation)?`<tr class="group-heading"><th colspan="5">${s.accepted===false?localText('Відхилені джерела','Excluded sources'):s.recommendation==='primary_apass_v'?localText('Рекомендовані спочатку · APASS V','Recommended first · APASS V'):localText('Додаткові кандидати · інші смуги та каталоги','Additional candidates · other bands and catalogues')}</th></tr>`:''}<tr class="${s.selected?'selected':''}"><td><input type="checkbox" aria-label="${esc(localText('Вибрати зорю ','Select star ')+s.id)}" data-select="${esc(s.id)}" ${s.selected?'checked':''} ${s.accepted===false?'disabled':''}></td><td><strong class="star-number">${esc(s.id)}</strong><details class="role-picker"><summary>${localText('Роль','Role')}: ${esc(s.role)}</summary><select aria-label="${esc(localText('Роль зорі ','Star role ')+s.id)}" data-role="${esc(s.id)}">${['REF','CHECK','SPARE'].map(r=>`<option ${s.role===r?'selected':''}>${r}</option>`).join('')}</select></details></td><td class="coordinates">${fmt(s.ra,6)}<br>${fmt(s.dec,6)}</td><td class="all-photometry">${photometryHTML(s)}</td><td class="source-status"><span class="pill ${s.accepted===false?'bad':''}">${s.accepted===false?localText('Не рекомендовано','Not recommended'):current.mode==='curated'?localText('Авторська послідовність','Curated sequence'):recommendationPill(s)}</span>${brightnessHTML(s)}${sourceLinks(s)}${s.reasons?.length?`<small class="measurement-warning">${esc(s.reasons.map(tr).join('; '))}</small>`:''}${s.warnings?.length?`<details><summary>${localText('Зауваження','Notes')} (${s.warnings.length})</summary><small>${esc(s.warnings.map(tr).join('; '))}</small></details>`:''}<details><summary>Gaia</summary><small>${esc(s.gaia_id||'—')}<br>RUWE ${fmt(s.ruwe,2)} · NN ${fmt(s.nn,1)}″</small></details>${s.variability_checks?.length?`<details><summary>${localText('Перевірка змінності','Variability checks')}</summary><small>${esc([...new Map(s.variability_checks.map(c=>[c.catalog,c])).values()].map(c=>c.catalog+': '+(c.catalog==='Gaia DR3'?c.status:c.matches?.length?localText('є запис','catalogue association'):localText('запису немає','no catalogue association'))).join('; '))}</small></details>`:''}</td></tr>`).join(''):`<tr><td colspan="5">${localText('Кандидатів у цьому полі не знайдено. Перегляньте джерела з зауваженнями або збільште поле зору.','No candidates found in this field. Review sources that are not recommended or expand the field of view.')}</td></tr>`;
 $('rows').querySelectorAll('[data-select]').forEach(e=>e.onchange=()=>{current.stars.find(s=>String(s.id)===e.dataset.select).selected=e.checked;refreshSelection()});
 $('rows').querySelectorAll('[data-role]').forEach(e=>e.onchange=()=>{current.stars.find(s=>String(s.id)===e.dataset.role).role=e.value;render()});selectionAdvice();translateDOM();
}
function loadCurated(f,scroll=false){bg=f.background_data||null;current={name:f.name,ra:f.ra_deg,dec:f.dec_deg,fov:f.field_fov_deg*60,band:'all',catalog:f.photometry_catalog||'APASS DR9',mode:'curated',source_url:f.source_url,created_at:'2026-10-21',note:(f.screening_update?f.screening_update+' ':'')+f.validation_note+' '+f.reference_note,original:f,stars:f.stars.map(s=>({...s,id:String(s.id),mag:s.V,err:Science.curatedError(s,'V'),source:s.catalog||f.photometry_catalog,accepted:!s.current_warning,selected:!s.current_warning,role:s.current_warning?'SPARE':'REF',reasons:s.current_warning?[s.current_warning]:[],warnings:[]}))};setForm();render();message('Відкрито авторське поле. Це збережені дані; новий запит до каталогів ще не виконувався.');if(scroll)$('builder').scrollIntoView({behavior:'smooth'})}
function setForm(){for(let [k,v] of Object.entries({object:current.name,ra:current.ra,dec:current.dec,fov:current.fov}))$(k).value=v;}
function selectionAdvice(){
 $('selectionAdvice').innerHTML='<strong>'+localText('ПОРАДА','TIP')+'</strong><p>'+localText('Найкраще підійдуть зорі, найближчі за магнітудою до об’єкта в тій самій смузі й системі. Наприклад, для цілі 18 mag шукайте близькі за блиском зорі, а не 12 mag. Це рекомендація: пошук не обмежує магнітуди.','Prefer stars closest in magnitude to your target in the same band and system. For an 18 mag target, prefer similarly bright stars over 12 mag stars. This is guidance: the search does not restrict magnitudes.')+'</p><p>'+localText('Номер у таблиці відповідає номеру на мапі стандартів. Усі доступні вимірювання показані разом; «—» означає відсутню похибку, не нуль. Зніміть позначку біля зорі, щоб прибрати її з мапи стандартів.','Table numbers match the finding chart. All available measurements appear together; “—” means an unavailable uncertainty, not zero. Uncheck a star to remove it from the finding chart.')+'</p><details><summary>'+localText('Для диференціальної фотометрії: REF і CHECK','For differential photometry: REF and CHECK')+'</summary><p>'+localText('Після перевірки на кадрах призначте зорі порівняння REF та окрему контрольну CHECK через «Роль» біля номера. CHECK не включайте в ансамбль REF. Автоматичне відображення всіх кандидатів не означає рекомендацію використовувати їх усі в ансамблі.','After validating your images, assign comparison stars REF and a separate check star CHECK using “Role” beside the number. Keep CHECK outside the REF ensemble. Showing all candidates does not recommend using all of them in an ensemble.')+'</p></details>';
}
const requestCatalogue=CatalogueClient.createClient();
function parseTSV(s,coordName,requiredColumns=[]){
 if(/truncated|overflow/i.test(s))throw Error('Ліміт каталогу: зменште поле зору.');
 if(/QUERY_STATUS[^\n]*ERROR|#ERROR|#INFO[^\n]*Error=|<html/i.test(s))throw Error('Каталог повернув помилку.');
 const declared=[...s.matchAll(/^#Column\s+(\S+)/gm)].map(m=>m[1]);
 if(requiredColumns.some(c=>!declared.includes(c)))throw Error('Немає очікуваних колонок у відповіді каталогу.');
 const lines=s.split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#'));
 const idx=lines.findIndex(l=>l.split('\t').map(x=>x.trim()).includes(coordName));
 if(idx<0){if(!lines.length&&declared.includes(coordName)&&/#Table\s/.test(s))return [];throw Error('Немає очікуваних колонок у відповіді каталогу.')}
 const cols=lines[idx].split('\t').map(x=>x.trim()),decName=coordName==='RA_ICRS'?'DE_ICRS':coordName==='RAdeg'?'DEdeg':'DEJ2000';
 if(!cols.includes(decName)||requiredColumns.some(c=>!cols.includes(c)))throw Error('Немає очікуваних колонок у відповіді каталогу.');
 const separator=lines.findIndex((l,i)=>i>idx&&l.split('\t').every(v=>/^-+$/.test(v.trim())));
 if(separator<0)throw Error('Пошкоджена таблиця каталогу; відбір зупинено.');
 const rows=lines.slice(separator+1).map(l=>{
  const values=l.split('\t');if(values.length!==cols.length)throw Error('Пошкоджена таблиця каталогу; відбір зупинено.');
  const row=Object.fromEntries(values.map((v,i)=>[cols[i],v.trim()])),ra=num(row[coordName]),dec=num(row[decName]);
  if(!(Number.isFinite(ra)&&ra>=0&&ra<360&&Number.isFinite(dec)&&dec>=-90&&dec<=90))throw Error('Пошкоджена таблиця каталогу; відбір зупинено.');
  return row;
 });
 if(rows.length>=20000)throw Error('Ліміт каталогу: зменште поле зору.');return rows;
}
async function query(cat,cols,c){
 const params={'-source':cat,'-c':`${c.ra} ${c.dec}`,'-c.rm':c.fov/Math.sqrt(2)+(c.isolation+c.match)/60+0.1,'-out.max':'20000','-out':cols.join(',')};
 let result;
 try{result=await requestCatalogue(params)}catch(error){
  if(error.name==='CatalogueConnectionError'){console.warn('VizieR connection failed',cat,error.attempts);throw error;}
  throw error;
 }
 // A successful connection is not a successful scientific check: validate all
 // requested columns, coordinates and truncation before accepting any rows.
 return {rows:parseTSV(result.text,cols.find(c=>['RA_ICRS','RAJ2000','RAdeg'].includes(c)),cols),url:result.url,accessed_at:result.accessed_at};
}
const APASS_COLS=['RAJ2000','DEJ2000','B-V','e_B-V','nobs','u_e_Bmag','u_e_Vmag',"u_e_g'mag","u_e_r'mag","u_e_i'mag",'Bmag','e_Bmag','Vmag','e_Vmag',"g'mag","e_g'mag","r'mag","e_r'mag","i'mag","e_i'mag"];
const PS1_COLS=['RAJ2000','DEJ2000','objID','f_objID','Qual','Epoch',...['g','r','i','z','y'].flatMap(b=>[b+'Flags','o_'+b+'mag',b+'magStd',b+'mag','e_'+b+'mag'])];
const VARIABLE_CATALOGUES=[
 {catalog:'VSX',table:'B/vsx/vsx',cols:['RAJ2000','DEJ2000','Name','V','Type'],id:'Name'},
 {catalog:'ASAS-SN',table:'II/366/catv2021',cols:['RAJ2000','DEJ2000','ASASSN-V','Type'],id:'ASASSN-V'},
 {catalog:'ZTF variables (Chen 2020)',table:'J/ApJS/249/18/table2',cols:['RAJ2000','DEJ2000','ID','Type'],id:'ID'},
 {catalog:'ZTF suspected (Chen 2020)',table:'J/ApJS/249/18/table3',cols:['RAJ2000','DEJ2000','ID'],id:'ID'}
];
$('form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;let cfg;
 try{cfg={name:$('object').value.trim()||'Field',ra:coordinate($('ra').value,true),dec:coordinate($('dec').value,false),fov:num($('fov').value),match:1,isolation:10,exclude:10,variable_match:3};if(!(cfg.fov>=1&&cfg.fov<=40))throw Error(tr('Поле зору має бути від 1 до 40 кутових хвилин.'));if(Math.abs(cfg.dec)>89.8)throw Error('Ця версія не підтримує поля ближче 0.2° до полюса.');}
 catch(err){message(err.message,true);return}
 busy=true;$('generate').disabled=true;$('generate').textContent=tr('Запит до каталогів…');
 message('Перевіряємо фотометрію, якість Gaia та змінність у Gaia, VSX, ASAS-SN і ZTF…');
 try{
  const photoJobs=[{catalog:'APASS DR9',table:'II/336/apass9',cols:APASS_COLS}];
  if(cfg.dec+cfg.fov/120>=-30)photoJobs.push({catalog:'PS1 DR1',table:'II/349/ps1',cols:PS1_COLS});
  const gaiaJob={catalog:'Gaia DR3',table:'I/355/gaiadr3',cols:['Source','RA_ICRS','DE_ICRS','RUWE','VarFlag','Plx','e_Plx','pmRA','e_pmRA','pmDE','e_pmDE','Dup','IPDfmp']};
  const jobs=[...photoJobs,gaiaJob,...VARIABLE_CATALOGUES];
  const responses=await Promise.allSettled(jobs.map(j=>query(j.table,j.cols,cfg)));
  const failed=responses.flatMap((r,i)=>r.status==='rejected'?[{catalog:jobs[i].catalog,error:r.reason}]:[]);
  if(failed.length){
   const connectionOnly=failed.every(f=>f.error.name==='CatalogueConnectionError');
   if(connectionOnly){
    console.warn('Catalogue request diagnostics',failed);
    const serverError=failed.some(f=>f.error.attempts?.some(a=>/^HTTP 5\d\d$/.test(a.reason)));
    const error=new Error(serverError
     ?'Зовнішні сервери каталогів VizieR повернули серверну помилку. Це збій сервісу даних; побудову мапи стандартів тимчасово призупинено. Спробуйте пізніше. Готові поля залишаються доступними.'
     :'Немає зв’язку із зовнішніми серверами каталогів VizieR. Сайт не може отримати дані для побудови мапи стандартів. Спробуйте пізніше. Готові поля залишаються доступними.');
    error.userMessage=true;throw error;
   }
   throw Error(tr('Перевірку не завершено; нові кандидати не призначені. Недоступно: ')+failed.map(f=>f.catalog+(f.error.name==='CatalogueConnectionError'?'':': '+f.error.message)).join(' | '));
  }
  const results=responses.map((r,i)=>({...jobs[i],...r.value})),available=results.slice(0,photoJobs.length),ga=results[photoJobs.length],variableResults=results.slice(photoJobs.length+1);
  if(available.reduce((n,p)=>n+p.rows.length,0)>12000||ga.rows.length>12000)throw Error('Занадто щільне поле для браузерного зіставлення. Зменште поле зору.');
  const g=ga.rows.map(t=>({...t,ra:num(t.RA_ICRS),dec:num(t.DE_ICRS)})).filter(t=>Number.isFinite(t.ra)&&Number.isFinite(t.dec));
  const variableLists=variableResults.map(q=>({...q,positions:q.rows.map(t=>({...t,ra:num(t.RAJ2000),dec:num(t.DEJ2000)}))}));
  const neighborCache=new Map(),records=[];
  for(const ph of available)for(const p of ph.rows){
   const position={ra:num(p.RAJ2000),dec:num(p.DEJ2000)};if(!Number.isFinite(position.ra)||!Number.isFinite(position.dec))continue;
   const [x,y]=project(position.ra,position.dec,cfg);if(x<60||x>700||y<60||y>700)continue;
   const photometry=Science.measurements(p,ph.catalog);if(!photometry.length)continue;
   const s={...position,source:ph.catalog,photometry,catalogue_records:[{catalog:ph.catalog,raw:p}],...Science.objectChecks(p,ph.catalog),variability_checks:[]};
   const matches=g.map(t=>({t,d:separation(s,t)})).filter(m=>m.d<=cfg.match).sort((a,b)=>a.d-b.d),m=matches[0];
   if(m){
    const t=m.t;s.gaia_id=t.Source;s.gaia_match_arcsec=m.d;s.gaia_raw=t;s.ruwe=num(t.RUWE);s.ambiguous=matches.length>1;
    if(!neighborCache.has(t.Source)){let nearest=Infinity;for(const other of g)if(other.Source!==t.Source)nearest=Math.min(nearest,separation(t,other));neighborCache.set(t.Source,Number.isFinite(nearest)?nearest:null)}
    s.nn=neighborCache.get(t.Source);
    if(matches.some(m=>String(m.t.VarFlag).toUpperCase()==='VARIABLE'))s.reasons.push('Gaia VARIABLE');
   }
   Science.gaiaChecks(s,m?.t);
   s.variability_checks.push({catalog:'Gaia DR3',status:m?String(m.t.VarFlag):'no counterpart',source_id:s.gaia_id||null});
   for(const q of variableLists){
    const found=q.positions.map(t=>({t,d:Math.min(separation(s,t),m?separation(m.t,t):Infinity)})).filter(x=>x.d<=cfg.variable_match);
    s.variability_checks.push({catalog:q.catalog,table:q.table,status:found.length?'catalogue association — excluded':'no catalogue association (not evidence of constancy)',matches:found.map(x=>({id:x.t[q.id],type:x.t.Type||null,vsx_flag:x.t.V??null,separation_arcsec:x.d}))});
    if(found.length){const label=q.catalog==='VSX'&&found.every(x=>String(x.t.V)==='2')?'VSX: запис потребує перевірки (V=2)':'Каталог змінності: '+q.catalog;s.reasons.push(label+' · '+found.map(x=>x.t[q.id]).join(', '));}
   }
   if(separation(s,cfg)<cfg.exclude)s.reasons.push('Область цілі');
   records.push(s);
  }
  const target_photometry=Science.estimateTarget(available,cfg,separation);
  const stars=Science.finalScreen(Science.mergeRecords(records),target_photometry);bg=null;
  const stages={catalogue_detections:records.length,merged_sources:stars.length,gaia_associated:stars.filter(s=>s.gaia_id).length,accepted:stars.filter(s=>s.accepted).length,excluded:stars.filter(s=>!s.accepted).length};
  current={name:cfg.name,ra:cfg.ra,dec:cfg.dec,fov:cfg.fov,band:'all',catalog:available.map(p=>p.catalog).join(' + '),mode:'generated',target_photometry,screening_version:'1.5',criteria:{...cfg,...Science.LIMITS,magnitude_limits:null,band_limits:null,colour_cut:null,merge:'unique per-catalogue Gaia identity',photometry_requirement:'primary: eligible APASS V; additional: any eligible native band; all measurements retained',recommendation_order:'same-system |delta mag| tiers; APASS V priority within a tier; then magnitude distance and V uncertainty',default_markers:'APASS V within 3 mag, else other common bands within 3 mag, else reserve within 4 mag; if target unavailable, catalogue priority only'},created_at:new Date().toISOString(),queries:results.map(q=>({catalog:q.catalog,table:q.table,url:q.url,accessed_at:q.accessed_at,rows:q.rows.length})),catalogue_status:{queried:jobs.map(j=>j.catalog),available:jobs.map(j=>j.catalog),failed:[],not_covered:photoJobs.length===1?['PS1 DR1 (Dec < −30°)']:[]},screening_counts:stages,note:'Позначені лише кандидати, що пройшли автоматичний відбір. Відомі та підозрювані змінні виключені за перевіреними каталогами. Відсутність запису про змінність не доводить сталості; остаточна перевірка — за часовими рядами.',stars};
  render();
  loadSkyBackground(current);
  message(localText(`Відбір завершено: ${stages.accepted} кандидатів із ${stages.merged_sources} джерел. Відхилено: ${stages.excluded}.`,`Screening complete: ${stages.accepted} candidates from ${stages.merged_sources} sources. Excluded: ${stages.excluded}.`));
 }catch(err){message(err.userMessage?err.message:tr('Запит не завершився. ')+err.message,true)}
 finally{busy=false;$('generate').disabled=false;$('generate').textContent=tr('Знайти зорі та побудувати ↗')}
};
$('selectAll').onclick=()=>{if(current){current.stars.forEach(s=>s.selected=s.accepted!==false);refreshSelection()}};$('clearAll').onclick=()=>{if(current){current.stars.forEach(s=>s.selected=false);refreshSelection()}};
$('example').onclick=()=>loadCurated(fields[0]);$('white').onchange=draw;$('showRejected').onchange=render;
$('svg').onclick=()=>{if(current)download(chartSVG(),filename()+'.svg','image/svg+xml')};
function updatePaperExport(){
 const count=current?.stars.filter(s=>s.accepted!==false&&s.selected===true).length||0;
 $('paperExport').hidden=!$('white').checked;
 $('paperPNG').disabled=$('paperSVG').disabled=count===0;
 $('paperSelection').textContent=count?localText(`Вибрано зір: ${count}. Збережуться лише їхні позначки.`,`Selected stars: ${count}. Only their markers will be exported.`):localText('Оберіть хоча б одну зорю в таблиці нижче.','Select at least one star in the table below.');
}
function paperReady(){return current&&current.stars.some(s=>s.accepted!==false&&s.selected===true)}
async function exportPNG(forPaper=false){
 if(!current||(forPaper&&!paperReady()))return;
 const name=filename()+(forPaper?'_paper':'')+'.png';
 const svg=chartSVG({monochrome:forPaper});let url;
 try{
  url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  const im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src=url});
  const canvas=document.createElement('canvas');canvas.width=3000;canvas.height=Math.round(3000*840/760);
  canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw Error('PNG encoding failed');download(blob,name,'image/png');
 }catch(e){message(localText('Не вдалося створити PNG. Спробуйте зберегти SVG.','Could not create PNG. Try saving SVG.'),true)}
 finally{if(url)URL.revokeObjectURL(url)}
}
$('png').onclick=()=>exportPNG();
$('paperPNG').onclick=()=>exportPNG(true);
$('paperSVG').onclick=()=>{if(paperReady())download(chartSVG({monochrome:true}),filename()+'_paper.svg','image/svg+xml')};
$('csv').onclick=()=>{
 if(!current)return;ensurePhotometry(current);
 const cols=['id','role','selected','accepted','ra','dec','catalog','band','mag','err','photometric_system','zero_point','transformed','recommendation','delta_mag','comparison_band','target_mag','target_catalog','target_status','error_kind','scatter_mag','eligible','measurement_notes','variability_checks','gaia_id','reasons','warnings','field_name','field_ra','field_dec','fov_arcmin','generated_at'];
 const cell=v=>'"'+String(Array.isArray(v)?v.join('; '):v??'').replace(/"/g,'""')+'"';
 const data=current.stars.flatMap(s=>s.photometry.map(p=>({...s,catalog:p.catalog,band:p.band,mag:p.mag,err:p.err,photometric_system:p.system,zero_point:p.zero_point,transformed:p.transformed,eligible:p.eligible,error_kind:p.error_kind,scatter_mag:p.scatter_mag,delta_mag:s.brightness?.delta,comparison_band:s.brightness?.band,target_mag:s.brightness?.target_mag,target_catalog:s.brightness?.catalog,target_status:current.target_photometry?.status,variability_checks:JSON.stringify(s.variability_checks||[]),measurement_notes:p.warnings,field_name:current.name,field_ra:current.ra,field_dec:current.dec,fov_arcmin:current.fov,generated_at:current.created_at})));
 download([cols.join(','),...data.map(s=>cols.map(k=>cell(s[k])).join(','))].join('\n'),filename()+'.csv','text/csv;charset=utf-8');
};
$('json').onclick=()=>{if(current)download(JSON.stringify(provenance(),null,2),filename()+'.json','application/json')};
function skyStatus(c,state,error=''){
 if(current!==c)return;c.sky_status=state;c.sky_error=error;
 $('skyStatus').textContent=state==='loading'?localText('Завантажується зображення неба DSS2…','Loading the DSS2 sky image…'):state==='failed'?localText('Зображення неба не завантажилося. Зараз показано лише схему позицій; натисніть «Додати зображення DSS2», щоб повторити.','Sky image could not load. Only a position diagram is shown; select “Add DSS2 image” to retry.'):state==='hidden'?localText('Фон неба вимкнено.','Sky background is hidden.'):'';
 $('skyStatus').classList.toggle('error',state==='failed');$('background').disabled=state==='loading';
 $('background').textContent=tr(state==='loading'?'Завантаження DSS2…':bg?'Прибрати DSS2':'Додати зображення DSS2');
}
async function loadSkyBackground(c){
 if(!c||current!==c||c.sky_status==='loading')return;skyStatus(c,'loading');
 try{
  const u='https://alasky.cds.unistra.fr/hips-image-services/hips2fits?'+new URLSearchParams({hips:'CDS/P/DSS2/color',width:1400,height:1400,projection:'TAN',coordsys:'icrs',ra:c.ra,dec:c.dec,fov:c.fov/60,rotation_angle:0,format:'jpg'});
  const r=await fetch(u,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status);
  const blob=await r.blob();if(!blob.type.startsWith('image/'))throw Error('No image returned');
  const data=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(blob)});
  // Reject invalid images before using them in scientific exports.
  const im=new Image();im.src=data;await im.decode();
  if(current===c){bg=data;c.image_query=u;c.image_accessed_at=new Date().toISOString();c.background_data=data;skyStatus(c,'ready');draw();}
 }catch(e){skyStatus(c,'failed',String(e.message));}
}
$('background').onclick=()=>{if(!current)return;if(bg){bg=null;skyStatus(current,'hidden');draw()}else loadSkyBackground(current)};

function mini(f){let c={ra:f.ra_deg,dec:f.dec_deg,fov:f.field_fov_deg*60};return '<svg class="mini" viewBox="0 0 180 100" aria-hidden="true"><path d="M10 10H170V90H10Z M90 10V90 M10 50H170" fill="none" stroke="#cdd3c1"/>'+f.stars.map(s=>{let [x,y]=project(s.ra,s.dec,c);return `<circle cx="${10+(x-60)/640*160}" cy="${10+(y-60)/640*80}" r="2.5" fill="#6c825a"/>`}).join('')+'<path d="M85 50H95 M90 45V55" stroke="#aa9569"/></svg>'}
function collection(){ $('fieldCards').innerHTML=fields.map((f,i)=>`<article class="field-card"><p>${esc(f.filter)} · ${f.stars.length} COMPARISON STARS</p><h3>${esc(f.name)}</h3>${mini(f)}<p>${esc(f.aliases)}</p><button data-field="${i}">Відкрити поле ↗</button><a href="${esc(f.source_url)}" target="_blank" rel="noopener">Оригінальна мапа стандартів й таблиці ↗</a></article>`).join('');$('fieldCards').querySelectorAll('[data-field]').forEach(b=>b.onclick=()=>loadCurated(fields[Number(b.dataset.field)],true));renderLocals();translateDOM()}
function renderLocals(){$('localCards').innerHTML=locals.map((f,i)=>`<article class="field-card"><p>НА ЦЬОМУ ПРИСТРОЇ</p><h3>${esc(f.name)}</h3><p>${f.band==='all'?localText('Усі смуги','All bands'):esc(f.band)} · ${f.stars.length} зір</p><button data-local="${i}">Відкрити</button><button data-delete="${i}">Видалити локальну копію</button></article>`).join('');$('localCards').querySelectorAll('[data-local]').forEach(b=>b.onclick=()=>{current=structuredClone(locals[Number(b.dataset.local)]);bg=current.background_data||null;current.sky_status=bg?'ready':'idle';setForm();render();if(!bg)loadSkyBackground(current);$('builder').scrollIntoView({behavior:'smooth'})});$('localCards').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{locals.splice(Number(b.dataset.delete),1);persist();renderLocals();translateDOM()})}
function persist(){try{localStorage.setItem('referenceFieldLab.v1',JSON.stringify(locals));return true}catch(e){message('Збереження браузера недоступне. Експортуйте JSON.',true);return false}}
$('save').onclick=()=>{if(!current)return;locals.push(provenance());if(persist()){message('Збережено в цьому браузері. Для резервної копії завантажте JSON.');renderLocals();translateDOM()}};
function validateImport(f){if(!f||typeof f.name!=='string'||f.name.length>100||!Number.isFinite(f.ra)||f.ra<0||f.ra>=360||!Number.isFinite(f.dec)||Math.abs(f.dec)>90||!Number.isFinite(f.fov)||f.fov<1||f.fov>40||!['all','V','B','g','r','i','z','y','R'].includes(f.band)||!Array.isArray(f.stars)||f.stars.length>20000)throw Error('Некоректна структура поля. Використайте JSON, експортований із лабораторії.');let ids=new Set();for(let s of f.stars){if(typeof s.id!=='string'||!/^[a-zA-Z0-9_-]{1,40}$/.test(s.id)||ids.has(s.id)||!Number.isFinite(s.ra)||s.ra<0||s.ra>=360||!Number.isFinite(s.dec)||Math.abs(s.dec)>90||s.mag!==null&&!Number.isFinite(s.mag)||s.err!==null&&!Number.isFinite(s.err))throw Error('Некоректні дані зорі');ids.add(s.id);s.role=['REF','CHECK','SPARE'].includes(s.role)?s.role:'SPARE';s.selected=Boolean(s.selected);s.reasons=Array.isArray(s.reasons)?s.reasons.map(String):[];s.warnings=Array.isArray(s.warnings)?s.warnings.map(String):[];if(s.photometry!==undefined&&(!Array.isArray(s.photometry)||s.photometry.length>40||s.photometry.some(p=>!p||typeof p.catalog!=='string'||typeof p.band!=='string'||typeof p.label!=='string'||typeof p.system!=='string'||typeof p.zero_point!=='string'||!Number.isFinite(p.mag)||p.err!==null&&!Number.isFinite(p.err)||!Array.isArray(p.warnings))))throw Error('Некоректна структура фотометрії')}f.mode='imported';f.note='Імпортована локальна мапа стандартів. Походження і якість даних перевіряє користувач. '+(f.note||'');return f}
$('import').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{if(f.size>10000000)throw Error('Максимум 10 MB');let d=JSON.parse(await f.text()),a=Array.isArray(d)?d:[d];let checked=a.map(validateImport);locals.push(...checked);persist();renderLocals();translateDOM();message(`Імпортовано ${checked.length} полів локально.`)}catch(err){message(err.message,true);alert(tr(err.message))}e.target.value=''};
$('exportCollection').onclick=()=>download(JSON.stringify(locals,null,2),'reference-field-lab-collection.json','application/json');
const citations={ack:'Finding charts were prepared with Reference Field Lab (Inna Izviekova). For curated sequences, cite AGN Reference Fields (https://doi.org/10.5281/zenodo.22036357), specifying the version used.',bib:'@misc{izviekova_agn_reference_fields,\n  author = {Izviekova, Inna},\n  title = {AGN Reference Fields},\n  publisher = {Zenodo},\n  doi = {10.5281/zenodo.22036357},\n  url = {https://doi.org/10.5281/zenodo.22036357},\n  note = {All-versions DOI; specify the exact release used}\n}',ua:'Мапи стандартів підготовлено за допомогою Reference Field Lab (Інна Ізвєкова). Для авторських послідовностей цитуйте AGN Reference Fields (https://doi.org/10.5281/zenodo.22036357), зазначаючи використану версію.'};let citation='ack';$('citationText').textContent=citations[citation];document.querySelectorAll('[data-cite]').forEach(b=>b.onclick=()=>{citation=b.dataset.cite;$('citationText').textContent=citations[citation];document.querySelectorAll('[data-cite]').forEach(x=>x.classList.toggle('active',x===b))});$('copyCitation').onclick=async()=>{try{await navigator.clipboard.writeText(citations[citation]);$('copyStatus').textContent=tr('Скопійовано.')}catch(e){$('copyStatus').textContent=tr('Виділіть і скопіюйте текст вручну.')}};
(async()=>{try{let r=await fetch('fields.json');if(!r.ok)throw Error('Не вдалося завантажити колекцію');fields=await r.json();try{locals=JSON.parse(localStorage.getItem('referenceFieldLab.v1')||'[]');if(!Array.isArray(locals))locals=[]}catch(e){locals=[]}collection();loadCurated(fields[0]);if(location.hash.startsWith('#field=')){let f=fields.find(f=>f.slug===location.hash.slice(7));if(f)loadCurated(f,true)}}catch(e){message(e.message,true)}})();

$('language').onclick=()=>{lang=lang==='uk'?'en':'uk';try{localStorage.setItem('referenceFieldLab.language',lang)}catch{}if(current)render();collection();message(statusSource,statusError);translateDOM();if(citation!=='bib'){citation=lang==='uk'?'ua':'ack';$('citationText').textContent=citations[citation];document.querySelectorAll('[data-cite]').forEach(b=>b.classList.toggle('active',b.dataset.cite===citation))}};
if(lang==='uk'){citation='ua';$('citationText').textContent=citations.ua;document.querySelectorAll('[data-cite]').forEach(b=>b.classList.toggle('active',b.dataset.cite==='ua'))}translateDOM();


