/* Viewing only: the exported SVG always uses the complete scientific field. */
const ChartViewport=(()=>{
 const host=document.getElementById('chart'),out=document.getElementById('zoomLevel');
 let scale=1,x=0,y=0,field=null,drag=null,suppressClick=false;const pointers=new Map();
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function apply(){x=clamp(x,0,760-760/scale);y=clamp(y,0,840-840/scale);host.querySelector('svg')?.setAttribute('viewBox',`${x} ${y} ${760/scale} ${840/scale}`);out.textContent=Math.round(scale*100)+'%';document.getElementById('zoomOut').disabled=scale<=1;document.getElementById('zoomIn').disabled=scale>=12;host.classList.toggle('zoomed',scale>1)}
 function point(cx,cy){const r=host.querySelector('svg').getBoundingClientRect(),unit=Math.min(r.width/760,r.height/840);return {fx:clamp((cx-r.left-(r.width-760*unit)/2)/(760*unit),0,1),fy:clamp((cy-r.top-(r.height-840*unit)/2)/(840*unit),0,1),unit};}
 function zoom(next,cx,cy){let p=cx===undefined?{fx:.5,fy:.5}:point(cx,cy),nx=clamp(next,1,12);x+=p.fx*760*(1/scale-1/nx);y+=p.fy*840*(1/scale-1/nx);scale=nx;apply()}
 function reset(){scale=1;x=y=0;apply()}
 function mount(value){if(field!==value){field=value;scale=1;x=y=0;pointers.clear();drag=null;}apply()}
 document.getElementById('zoomIn').onclick=()=>zoom(scale*1.5);
 document.getElementById('zoomOut').onclick=()=>zoom(scale/1.5);
 document.getElementById('zoomReset').onclick=reset;
 host.addEventListener('wheel',e=>{if(!host.querySelector('svg'))return;e.preventDefault();zoom(scale*Math.exp(-e.deltaY*.002),e.clientX,e.clientY)},{passive:false});
 function gesture(){const a=[...pointers.values()];return a.length===2?{cx:(a[0].x+a[1].x)/2,cy:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}:null}
 host.addEventListener('pointerdown',e=>{if(e.button!==0)return;suppressClick=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,pinch:gesture()};host.classList.add('dragging')});
 host.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)||!drag)return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=gesture();
  if(g&&drag.pinch){suppressClick=true;host.setPointerCapture(e.pointerId);const before=point(g.cx,g.cy);x-=(g.cx-drag.pinch.cx)/before.unit/scale;y-=(g.cy-drag.pinch.cy)/before.unit/scale;zoom(scale*g.d/Math.max(1,drag.pinch.d),g.cx,g.cy);drag.pinch=g;return;}
  if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>4)suppressClick=true;
  if(suppressClick){host.setPointerCapture(e.pointerId);const p=point(e.clientX,e.clientY);x-=(e.clientX-drag.lastX)/p.unit/scale;y-=(e.clientY-drag.lastY)/p.unit/scale;apply()}
  drag.lastX=e.clientX;drag.lastY=e.clientY;
 });
 function end(e){pointers.delete(e.pointerId);if(!pointers.size){drag=null;host.classList.remove('dragging')}else {const p=[...pointers.values()][0];drag={startX:p.x,startY:p.y,lastX:p.x,lastY:p.y,pinch:null}}}
 host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);
 host.addEventListener('pointerleave',e=>{if(!host.hasPointerCapture(e.pointerId))end(e)});
 host.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false}},true);
 host.addEventListener('keydown',e=>{if(e.target!==host)return;let handled=true;if(['+','='].includes(e.key))zoom(scale*1.5);else if(e.key==='-')zoom(scale/1.5);else if(e.key==='Home'||e.key==='0')reset();else if(e.key==='ArrowLeft')x-=60/scale;else if(e.key==='ArrowRight')x+=60/scale;else if(e.key==='ArrowUp')y-=60/scale;else if(e.key==='ArrowDown')y+=60/scale;else handled=false;if(handled){e.preventDefault();apply()}});
 return {mount};
})();
