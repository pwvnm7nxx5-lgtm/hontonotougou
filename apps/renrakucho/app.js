const els = {
  month: document.querySelector('#monthInput'), day: document.querySelector('#dayInput'), weekday: document.querySelector('#weekdayInput'), body: document.querySelector('#bodyInput'),
  previewMonth: document.querySelector('#previewMonth'), previewDay: document.querySelector('#previewDay'), previewWeekday: document.querySelector('#previewWeekday'), previewText: document.querySelector('#previewText'),
  opacity: document.querySelector('#opacityInput'), fontWeight: document.querySelector('#fontWeightInput'), letterSpacing: document.querySelector('#letterSpacingInput'), print: document.querySelector('#printButton'),
  phraseList: document.querySelector('#phraseList'), phraseInput: document.querySelector('#phraseTemplateInput'), savePhrase: document.querySelector('#savePhraseTemplateButton'),
  circleChar: document.querySelector('#circleCharInput'), insertCircle: document.querySelector('#insertCircleButton'), squareNumber: document.querySelector('#squareNumberInput'), insertSquare: document.querySelector('#insertSquareNumberButton'), circledNumberList: document.querySelector('#circledNumberList'),
};
const storageKey = 'renrakucho-maker-v1';
const defaultState = { month:'', day:'', weekday:'', body:'', opacity:34, fontWeight:400, letterSpacing:4, phrases:['p.','ページ','音読','計ド','漢ド','宿題','プリント','持ち物','音読カード','連絡帳'] };
let state = load();
function load(){ try { return { ...defaultState, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; } catch { return { ...defaultState }; } }
function save(){ localStorage.setItem(storageKey, JSON.stringify(state)); }
function sync(){ els.month.value=state.month; els.day.value=state.day; els.weekday.value=state.weekday; els.body.value=state.body; els.opacity.value=state.opacity; els.fontWeight.value=state.fontWeight; els.letterSpacing.value=state.letterSpacing; }
function tokenNodes(text){ const frag=[]; const re=/\[(丸|四角):([^\]]{1,2})\]/g; let last=0,m; while((m=re.exec(text))){ plain(frag,text.slice(last,m.index)); const s=document.createElement('span'); s.className=m[1]==='丸'?'circled-char':'square-number'; s.textContent=m[2]; frag.push(s); last=re.lastIndex; } plain(frag,text.slice(last)); return frag.length?frag:[document.createTextNode('')]; }
function plain(nodes,text){ if(text) nodes.push(document.createTextNode(text)); }
function insert(text){ const i=els.body, s=i.selectionStart ?? i.value.length, e=i.selectionEnd ?? i.value.length; i.value=i.value.slice(0,s)+text+i.value.slice(e); i.focus(); i.selectionStart=i.selectionEnd=s+text.length; state.body=i.value; render(); }
function renderPhrases(){ els.phraseList.replaceChildren(); state.phrases.forEach(p=>{ const b=document.createElement('button'); b.className='symbol-button'; b.type='button'; b.textContent=p; b.addEventListener('click',()=>insert(p)); els.phraseList.append(b); }); }
function renderNumbers(){ els.circledNumberList.replaceChildren(); ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'].forEach(n=>{ const b=document.createElement('button'); b.className='symbol-button'; b.type='button'; b.textContent=n; b.addEventListener('click',()=>insert(n)); els.circledNumberList.append(b); }); }
function render(){ els.previewMonth.textContent=state.month; els.previewDay.textContent=state.day; els.previewWeekday.textContent=state.weekday; els.previewText.replaceChildren(...tokenNodes(state.body)); els.previewText.style.opacity=Number(state.opacity)/100; els.previewText.style.fontWeight=state.fontWeight; els.previewText.style.letterSpacing=`${state.letterSpacing}px`; renderPhrases(); renderNumbers(); save(); }
[['month','month'],['day','day'],['weekday','weekday'],['body','body'],['opacity','opacity'],['fontWeight','fontWeight'],['letterSpacing','letterSpacing']].forEach(([k,e])=>els[e].addEventListener('input',ev=>{state[k]=ev.target.value; render();}));
els.savePhrase.addEventListener('click',()=>{ const p=els.phraseInput.value.trim(); if(p&&!state.phrases.includes(p)){state.phrases.push(p); els.phraseInput.value=''; render();} });
els.insertCircle.addEventListener('click',()=>{ const c=Array.from(els.circleChar.value.trim()).slice(0,2).join(''); if(c) insert(`[丸:${c}]`); });
els.insertSquare.addEventListener('click',()=>{ const n=String(els.squareNumber.value).replace(/\D/g,'').slice(0,2); if(n) insert(`[四角:${n}]`); });
els.print.addEventListener('click',()=>window.print());
sync(); render();
