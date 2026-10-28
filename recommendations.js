/* Presentation for transparent, same-system brightness recommendations. */
function tierLabel(tier){
 const names={close:['Найближчі за блиском · |Δm| ≤ 1','Closest brightness · |Δm| ≤ 1'],near:['Розширений вибір · 1 < |Δm| ≤ 3','Wider choice · 1 < |Δm| ≤ 3'],reserve:['Резерв · 3 < |Δm| ≤ 4','Reserve · 3 < |Δm| ≤ 4'],outside:['Поза ±4 mag · лише ручний вибір','Outside ±4 mag · manual selection only'],unknown:['Немає спільної смуги з ціллю','No common band with target'],catalogue_only:['Каталожні кандидати · блиск цілі невідомий','Catalogue candidates · target brightness unknown'],excluded:['Відхилені джерела','Excluded sources']};
 const p=names[tier]||names.catalogue_only;return localText(...p);
}
function brightnessHTML(s){
 const b=s.brightness;if(!b)return '';
 if(!Number.isFinite(b.delta))return `<small>${esc(tierLabel(b.tier))}</small>`;
 return `<small class="brightness-note"><b>Δ${esc(b.label)} ${b.delta>=0?'+':''}${fmt(b.delta,2)} mag</b> · ${esc(b.system)} / ${esc(b.zero_point)}<br>${esc(localText('Ціль ≈ ','Target ≈ '))}${fmt(b.target_mag,2)} · ${esc(localText('зоря ','star '))}${fmt(b.star_mag,2)}</small>`;
}
function recommendationPill(s){
 if(!s.brightness)return localText('Каталожний кандидат','Catalogue candidate');
 const prefix=s.apass_v?'APASS V · ':'';
 return prefix+localText('кандидат','candidate');
}
function renderTargetEstimate(){
 const el=$('targetEstimate'),t=current.target_photometry;
 el.hidden=current.mode!=='generated';if(el.hidden)return;
 if(!t?.primary){el.innerHTML=`<strong>${localText('Блиск цілі не визначено','Target brightness unavailable')}</strong><p>${localText('Немає однозначного відповідника з придатною фотометрією біля введених координат. Рекомендації за Δm не застосовані; показано лише каталожний пріоритет APASS V. Назва об’єкта — підпис, пошук виконується за координатами.','No unique counterpart with usable photometry at the supplied coordinates. No Δm recommendation is applied; only the APASS V catalogue priority is used. The object name is a label; matching uses coordinates.')}</p>`;return;}
 const p=t.primary;
 el.innerHTML=`<span class="eyebrow">${localText('ОРІЄНТИР БЛИСКУ · АВТОМАТИЧНО','BRIGHTNESS GUIDE · AUTOMATIC')}</span><h3>${esc(p.label)} ≈ ${fmt(p.mag,2)} mag</h3><p>${esc(p.catalog)} · ${esc(p.system)} · ${esc(p.zero_point)}<br>${localText('Каталожна невизначеність','Catalogue uncertainty')}: ${fmt(p.err,3)} mag · ${localText('відстань','separation')} ${fmt(p.separation_arcsec,2)}″</p><p>${localText('Найближчі: ±1 mag. Розширений вибір: ±3; резерв: ±4. APASS V має пріоритет серед придатних кандидатів у вікні.','Closest: ±1 mag. Wider choice: ±3; reserve: ±4. APASS V has priority among eligible candidates in the window.')}</p><p>${localText('Архівна оцінка: змінність і світло галактики можуть змінити цей орієнтир.','Archival estimate: variability and host light may change this brightness guide.')}</p><details><summary>${localText('Усі оцінки та обмеження','All estimates and limitations')}</summary><p>${localText('Це архівний приблизний блиск, не поточне вимірювання. Для змінної цілі або AGN можливі зміни блиску й домішка галактики. PSF-фотометрія не є повним блиском галактики. Відповідник визначено за положенням; перевірте його на зображенні.','This is approximate archival brightness, not a current measurement. Variable targets or AGN may have changed, and host light may contribute. PSF photometry is not a galaxy’s total brightness. The association is positional; verify it on the image.')}</p><ul>${t.estimates.map(m=>`<li>${esc(m.catalog)} · ${esc(m.label)} ${fmt(m.mag,3)} ± ${fmt(m.err,3)} · ${esc(m.system)} / ${esc(m.zero_point)}</li>`).join('')}</ul><p>${localText('Порівнюємо лише спільні смуги одного каталогу й системи. Не переводимо rₚ₁, r′ чи Gaia G у V. Повні параметри зіставлення є в JSON.','Only common bands in the same catalogue and system are compared. No conversion from rₚ₁, r′ or Gaia G to V. Full matching details are in JSON.')}</p></details>`;
}
function recommendationSummary(){
 if(current.mode!=='generated')return '';
 if(!current.target_photometry?.primary)return localText('Блиск цілі невідомий: Δm не обчислюється. Початкові позначки — APASS V, якщо доступна; інакше інші кандидати. Перевірте їхню придатність на кадрах.','Target brightness is unknown: Δm is not calculated. Initial markers use APASS V if available, otherwise other candidates. Validate their suitability in your images.');
 const a=current.stars.filter(s=>s.accepted),selected=a.filter(s=>s.selected),v=selected.filter(s=>s.apass_v),close=a.filter(s=>s.brightness?.tier==='close');
 return localText(`Перевірку пройшли ${a.length} кандидатів; у межах ±1 mag: ${close.length}. На мапі стандартів: ${selected.length} (з APASS V: ${v.length}). Спочатку обираємо APASS V у межах ±3 mag; якщо їх немає — інші спільні смуги; якщо немає й таких — резерв ±4. Решта залишаються в таблиці. Це попередній вибір, не готовий ансамбль REF.`,`Screening passed: ${a.length} candidates; within ±1 mag: ${close.length}. On finding chart: ${selected.length} (with APASS V: ${v.length}). Initial selection uses APASS V within ±3 mag, then other common bands if needed, then the ±4 reserve. All others remain in the table. This is a shortlist, not a validated REF ensemble.`);
}
