const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const caption = document.querySelector('#caption');
const zoom = document.querySelector('#zoom');
const panelsEl = document.querySelector('#panelButtons');
const params = new URLSearchParams(location.search);
const state = { layout: 'strip', selected: 0, size: '1920x1080', panels: [] };
const sampleNames = ['woman', 'skyline', 'man', 'woman'];
const images = {};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function panelRects(layout, w, h) {
  const gap = Math.max(8, w * .008);
  if (layout === 'grid') return [[0,0,w/2-gap/2,h/2-gap/2],[w/2+gap/2,0,w/2-gap/2,h/2-gap/2],[0,h/2+gap/2,w/2-gap/2,h/2-gap/2],[w/2+gap/2,h/2+gap/2,w/2-gap/2,h/2-gap/2]];
  if (layout === 'hero') return [[0,0,w*.6-gap/2,h],[w*.6+gap/2,0,w*.4-gap/2,h/2-gap/2],[w*.6+gap/2,h/2+gap/2,w*.4-gap/2,h/2-gap/2]];
  return [[0,0,w/3-gap,h],[w/3+gap/2,0,w/3-gap,h],[w*2/3+gap,0,w/3-gap,h]];
}
function drawPanel(panel, rect) {
  const [x,y,w,h] = rect;
  ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
  ctx.fillStyle = '#d07786'; ctx.fillRect(x,y,w,h);
  if (panel.image) {
    const img = panel.image;
    const scale = Math.max(w/img.width,h/img.height) * panel.zoom;
    const iw = img.width*scale, ih = img.height*scale;
    const px = x+(w-iw)/2 + panel.x*(iw-w)/2;
    const py = y+(h-ih)/2 + panel.y*(ih-h)/2;
    ctx.filter = 'saturate(1.2) contrast(1.07)';
    ctx.drawImage(img,px,py,iw,ih); ctx.filter = 'none';
  }
  const tint = ctx.createLinearGradient(x,y,x+w,y+h);
  tint.addColorStop(0,'rgba(255,137,113,.12)'); tint.addColorStop(.55,'rgba(237,87,139,.06)'); tint.addColorStop(1,'rgba(92,37,112,.28)');
  ctx.fillStyle=tint; ctx.fillRect(x,y,w,h);
  ctx.restore();
}
function drawCover() {
  const [w,h] = state.size.split('x').map(Number);
  if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
  ctx.fillStyle='#24152d'; ctx.fillRect(0,0,w,h);
  panelRects(state.layout,w,h).forEach((r,i)=>drawPanel(state.panels[i],r));
  const wash=ctx.createLinearGradient(0,0,0,h);
  wash.addColorStop(0,'rgba(39,18,52,.2)'); wash.addColorStop(.5,'rgba(31,17,42,0)'); wash.addColorStop(1,'rgba(30,12,38,.65)');
  ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
  const vignette=ctx.createRadialGradient(w*.5,h*.45,h*.15,w*.5,h*.45,Math.max(w,h)*.7);
  vignette.addColorStop(0,'rgba(25,8,30,0)');vignette.addColorStop(1,'rgba(25,8,30,.5)');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  const margin=w*.045;
  ctx.textBaseline='top';ctx.fillStyle='#fff4df';ctx.font=`${Math.max(18,w*.014)}px Arial`;
  ctx.letterSpacing=`${w*.003}px`;ctx.fillText('A SUN-SOAKED ORIGINAL',margin,h*.045);ctx.textAlign='right';ctx.fillText('VICE CITY  /  VOL. 01',w-margin,h*.045);ctx.letterSpacing='0px';ctx.textAlign='left';
  const words=(caption.value.trim() || 'YOUR STORY').toUpperCase().split(/\s+/);
  let lines=[]; let line='';
  for (const word of words) { const next=line ? line+' '+word : word; if (next.length>14 && line) {lines.push(line);line=word;} else line=next; } if(line)lines.push(line); lines=lines.slice(0,3);
  let fontSize=Math.min(w*.16,h*.23); ctx.font=`${fontSize}px Bebas`;
  const maxWidth=Math.max(...lines.map(t=>ctx.measureText(t).width)); if(maxWidth>w*.85)fontSize*=w*.85/maxWidth;
  const lineHeight=fontSize*.83; const bottom=h*.89; const top=bottom-lines.length*lineHeight;
  ctx.font=`${fontSize}px Bebas`;ctx.lineJoin='round';ctx.lineWidth=fontSize*.12;ctx.strokeStyle='#28162b';ctx.shadowColor='#241128';ctx.shadowBlur=fontSize*.05;ctx.shadowOffsetX=fontSize*.045;ctx.shadowOffsetY=fontSize*.06;
  lines.forEach((text,i)=>{const y=top+i*lineHeight;ctx.strokeText(text,margin,y);const gradient=ctx.createLinearGradient(0,y,0,y+fontSize);gradient.addColorStop(0,'#fff9db');gradient.addColorStop(.55,'#ffcfb7');gradient.addColorStop(1,'#ff83a7');ctx.fillStyle=gradient;ctx.fillText(text,margin,y);});
  ctx.shadowColor='transparent';ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.fillStyle='#fff1df';ctx.font=`${Math.max(17,w*.013)}px Arial`;ctx.letterSpacing=`${w*.003}px`;ctx.fillText('GOOD TIMES  /  BAD DECISIONS',margin,h*.93);ctx.textAlign='right';ctx.fillText('✦  THE WORLD IS YOURS',w-margin,h*.93);ctx.textAlign='left';ctx.letterSpacing='0px';
}
function updateControls() {
  document.querySelectorAll('[data-layout]').forEach(b=>b.classList.toggle('active',b.dataset.layout===state.layout));
  const count=panelRects(state.layout,1,1).length;
  panelsEl.replaceChildren();
  for(let i=0;i<count;i++){const b=document.createElement('button');b.textContent=`PANEL 0${i+1}`;b.classList.toggle('active',i===state.selected);b.onclick=()=>{state.selected=i;updateControls();};panelsEl.append(b);}
  zoom.value=state.panels[state.selected].zoom;
}
function setLayout(layout) { state.layout=layout;state.selected=Math.min(state.selected,panelRects(layout,1,1).length-1);updateControls();drawCover(); }
function assignImage(img) { const p=state.panels[state.selected];p.image=img;p.zoom=1;p.x=0;p.y=0;updateControls();drawCover(); }
document.querySelectorAll('[data-layout]').forEach(b=>b.addEventListener('click',()=>setLayout(b.dataset.layout)));
document.querySelectorAll('[data-sample]').forEach(b=>b.addEventListener('click',()=>assignImage(images[b.dataset.sample])));
document.querySelector('#upload').addEventListener('change',event=>{const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=async()=>{try{assignImage(await loadImage(reader.result));}catch{alert('Could not open this image.');}};reader.readAsDataURL(file);event.target.value='';});
zoom.addEventListener('input',()=>{state.panels[state.selected].zoom=Number(zoom.value);drawCover();});
caption.addEventListener('input',drawCover);
document.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click',()=>{state.size=b.dataset.size;drawCover();const a=document.createElement('a');a.download=`vice-city-${state.size}.png`;a.href=canvas.toDataURL('image/png');a.click();document.querySelector('#sizeLabel').textContent=state.size.replace('x',' × ');}));
let drag=null;
canvas.addEventListener('pointerdown',event=>{const box=canvas.getBoundingClientRect();const x=(event.clientX-box.left)/box.width*canvas.width,y=(event.clientY-box.top)/box.height*canvas.height;const index=panelRects(state.layout,canvas.width,canvas.height).findIndex(([px,py,pw,ph])=>x>=px&&x<=px+pw&&y>=py&&y<=py+ph);if(index<0)return;state.selected=index;updateControls();drag={x:event.clientX,y:event.clientY,startX:state.panels[index].x,startY:state.panels[index].y};canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(!drag)return;const p=state.panels[state.selected],box=canvas.getBoundingClientRect();p.x=Math.max(-1,Math.min(1,drag.startX+(event.clientX-drag.x)/box.width*4));p.y=Math.max(-1,Math.min(1,drag.startY+(event.clientY-drag.y)/box.height*4));drawCover();});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
async function start() {
  await document.fonts.ready;
  await Promise.all(['woman','man','skyline'].map(async name=>{images[name]=await loadImage(`samples/${name}.svg`);}));
  state.panels=sampleNames.map(name=>({image:images[name],zoom:1,x:0,y:0}));
  if(params.has('caption'))caption.value=params.get('caption');
  if(['strip','grid','hero'].includes(params.get('layout')))state.layout=params.get('layout');
  if(['1080x1080','1080x1350','1920x1080'].includes(params.get('size')))state.size=params.get('size');
  if(images[params.get('photo')]) {
    state.panels[0].image=images[params.get('photo')];
    if(params.get('photo')==='man') state.panels[2].image=images.woman;
  }
  if(params.get('shot')==='cover')document.body.classList.add('shot-cover');
  updateControls();drawCover();
}
start();
