(function(){
'use strict';
const C = window.CONCEPTS.map((c,i)=>Object.assign({id:i},c));
const W = window.WEEKS;
const BY = Object.fromEntries(C.map(c=>[c.name,c]));
const $app = document.getElementById('app');

// ---------- storage ----------
const KEY='pq_v1';
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}}
let S = Object.assign({fav:[],mem:[],st:{},hist:[],mode:'write',weeks:[],imp:false,onlyFav:false,skipMem:false,noRep:false,n:10,seen:[],dexBy:'w',memF:'all',hide:false,pairG:'전체'}, load());
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
const fav=id=>S.fav.includes(id), mem=id=>S.mem.includes(id);
function toggle(arr,id){const i=S[arr].indexOf(id); if(i<0)S[arr].push(id); else S[arr].splice(i,1); save();}

// ---------- utils ----------
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\(.*?\)/g,'').replace(/[\s\-–—_·.,'’"“”()\/\[\]:;!?~]/g,'');
function isRight(c,input){
  const v=norm(input); if(!v) return false;
  const opts=[c.name,...(c.alias||[]),(window.PRON||{})[c.name]||''].filter(Boolean).map(norm);
  return opts.includes(v);
}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1500);}
function acc(){let c=0,w=0;for(const k in S.st){c+=S.st[k].c||0;w+=S.st[k].w||0;}return {c,w,t:c+w,p:c+w?Math.round(c/(c+w)*100):null};}

// ---------- theme ----------
const themeBtn=document.getElementById('themeBtn');
function isDark(){const t=document.documentElement.dataset.theme;return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;}
function paintTheme(){themeBtn.textContent=isDark()?'☀️':'🌙';}
themeBtn.onclick=()=>{const n=isDark()?'light':'dark';document.documentElement.dataset.theme=n;try{localStorage.setItem('pq_theme',n);}catch(e){}paintTheme();};
paintTheme();

// ---------- pool ----------
function pool(){
  let p=C;
  if(S.weeks.length) p=p.filter(c=>S.weeks.includes(c.w));
  if(S.imp) p=p.filter(c=>c.imp);
  if(S.onlyFav) p=p.filter(c=>fav(c.id));
  if(S.skipMem) p=p.filter(c=>!mem(c.id));
  if(S.noRep){const q=p.filter(c=>!S.seen.includes(c.id)); if(q.length) p=q;}
  return p;
}

// ---------- HOME ----------
const MODES=[
 ['write','✍️','설명 → 용어 쓰기','설명을 보고 용어를 직접 입력'],
 ['mc','🔢','설명 → 4지선다','같은 주제의 헷갈리는 보기 중 고르기'],
 ['rev','🔁','용어 → 설명 고르기','용어를 보고 맞는 설명 고르기']
];
function home(){
  const a=acc(), p=pool(), n=S.n==='all'?p.length:Math.min(S.n,p.length);
  $app.innerHTML=`
  <section class="hero">
    <small>식물생산과학입문 시험 대비</small>
    <h1>식물생산 개념 퀴즈</h1>
    <p>1~7주차 · 개념 ${C.length}개 · 헷갈리는 쌍 ${window.PAIRS.length}개</p>
    <div class="kpis"><div class="kpi"><b>${S.mem.length}</b><span>외움</span></div><div class="kpi"><b>${a.p==null?'-':a.p+'%'}</b><span>정답률</span></div></div>
  </section>
  ${studyCard()}
  <h2 class="sec">🎯 유형별 훈련 <span class="h-sub">서술형·계산까지 대비</span></h2>
  <div class="drills">
    <button class="dr" data-go="drill/calc"><span>🧮</span><b>계산 문제</b><small>DLI·ADT·양액·이형접합<br>숫자가 매번 바뀜</small></button>
    <button class="dr" data-go="drill/order"><span>🔢</span><b>순서 맞추기</b><small>메탄 발생·분류 계급 등<br>${window.ORDERS.length}세트</small></button>
    <button class="dr" data-go="drill/list"><span>📋</span><b>나열하기</b><small>메탄 저감·광수용체 등<br>모두 고르기 ${window.LISTS.length}문제</small></button>
    <button class="dr" data-go="drill/essay"><span>✍️</span><b>서술형</b><small>모범답안·키워드<br>자동 체크 ${window.ESSAYS.length}문제</small></button>
  </div>
  <h2 class="sec">🧩 개념 퀴즈 · 문제 유형</h2>
  ${MODES.map(m=>`<button class="opt ${S.mode===m[0]?'on':''}" data-mode="${m[0]}"><span class="ic">${m[1]}</span><span><b>${m[2]}</b><small>${m[3]}</small></span><span class="rad">${S.mode===m[0]?'✓':''}</span></button>`).join('')}
  <h2 class="sec">범위</h2>
  <div class="chips" id="wk">
    <button class="chip ${!S.weeks.length?'on':''}" data-w="0">전체</button>
    ${Object.keys(W).map(k=>`<button class="chip ${S.weeks.includes(+k)?'on':''}" data-w="${k}">${k}주차</button>`).join('')}
    <button class="chip ${S.imp?'on':''}" id="impBtn" style="margin-left:auto">🔥 시험 중요만</button>
  </div>
  <div class="toggles">
    <button class="tg ${S.onlyFav?'on':''}" data-t="onlyFav"><span class="bx">${S.onlyFav?'✓':''}</span><span><b>⭐ 즐겨찾기만</b><small>${S.fav.length}개</small></span></button>
    <button class="tg ${S.skipMem?'on':''}" data-t="skipMem"><span class="bx">${S.skipMem?'✓':''}</span><span><b>외운 것 빼기</b><small>${S.mem.length}개 제외</small></span></button>
    <button class="tg ${S.noRep?'on':''}" data-t="noRep"><span class="bx">${S.noRep?'✓':''}</span><span><b>한 바퀴</b><small>중복 없이</small></span></button>
  </div>
  <h2 class="sec">문제 수</h2>
  <div class="chips" id="nq">${[10,20,30,'all'].map(v=>`<button class="chip ${S.n===v?'on':''}" data-n="${v}">${v==='all'?'전체':v+'문제'}</button>`).join('')}</div>
  <p class="count">출제 가능 <b>${p.length}개</b> · 이번에 <b>${n}문제</b></p>
  <button class="big" id="go" ${p.length<1?'disabled':''}>퀴즈 시작</button>`;
  $app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.go;});
  $app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{S.mode=b.dataset.mode;save();home();});
  $app.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{const w=+b.dataset.w; if(!w) S.weeks=[]; else {const i=S.weeks.indexOf(w); i<0?S.weeks.push(w):S.weeks.splice(i,1);} save();home();});
  document.getElementById('impBtn').onclick=()=>{S.imp=!S.imp;save();home();};
  $app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S[b.dataset.t]=!S[b.dataset.t];save();home();});
  $app.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{const v=b.dataset.n;S.n=v==='all'?'all':+v;save();home();});
  document.getElementById('go').onclick=()=>{
    let p=shuf(pool()); p=p.slice(0,S.n==='all'?p.length:S.n);
    if(S.noRep){p.forEach(c=>{if(!S.seen.includes(c.id))S.seen.push(c.id);}); if(pool().length===0||C.every(c=>S.seen.includes(c.id))) S.seen=[]; save();}
    startQuiz(p.map(c=>({c,mode:S.mode})),'퀴즈');
  };
}

// ---------- QUIZ ----------
let Q=null;
function distractors(c,n,field){
  const same=shuf(C.filter(x=>x.id!==c.id&&x.cat===c.cat));
  const wk=shuf(C.filter(x=>x.id!==c.id&&x.w===c.w&&x.cat!==c.cat));
  const rest=shuf(C.filter(x=>x.id!==c.id&&x.w!==c.w));
  const out=[];for(const x of [...same,...wk,...rest]){if(out.length>=n)break; if(!out.some(o=>o[field]===x[field])&&x[field]!==c[field]) out.push(x);} return out;
}
function startQuiz(items,label,after){
  Q={after,items:items.map(it=>{
      if(it.mode==='write') return it;
      const field=it.mode==='rev'?'def':'name';
      const opts=it.pair? shuf([it.c,it.other]) : shuf([it.c,...distractors(it.c,3,field)]);
      return Object.assign({},it,{opts,field});
    }),i:0,ok:0,wrong:[],label,answered:false,after};
  location.hash='quiz'; renderQ();
}
function record(c,ok){const s=S.st[c.id]||(S.st[c.id]={c:0,w:0});ok?s.c++:s.w++;save();}
function renderQ(){
  if(!Q){location.hash='home';return;}
  if(Q.i>=Q.items.length) return result();
  const it=Q.items[Q.i], c=it.c, tot=Q.items.length;
  const head=`<div class="qtop"><button class="x" id="quit">✕</button><div class="prog"><i style="width:${Q.i/tot*100}%"></i></div><span class="qn">${Q.i+1}/${tot}</span></div>`;
  const tags=`<div class="tags" style="margin-bottom:8px"><span class="tag w">${c.w}주차</span><span class="tag">${esc(c.cat)}</span>${c.imp?'<span class="tag imp">🔥 시험</span>':''}</div>`;
  let body='';
  if(it.mode==='write'){
    body=`<div class="ask">이 설명에 해당하는 용어는?</div><div class="stem">${esc(c.def)}</div>
      <input class="ans-in" id="in" placeholder="용어 입력 (한글/영어 모두 가능)" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div id="fb"></div>
      <div class="qbtns"><button class="skip" id="skip">모르겠어요</button><button class="big" id="sub">확인</button></div>`;
  } else if(it.mode==='rev'){
    body=`<div class="ask">이 용어의 설명으로 옳은 것은?</div><div class="stem term">${esc(c.name)}</div>
      <div class="choices">${it.opts.map((o,k)=>`<button class="ch" data-k="${k}">${'①②③④'[k]} ${esc(o.def)}</button>`).join('')}</div><div id="fb"></div><div class="qbtns" id="nx"></div>`;
  } else {
    body=`<div class="ask">${it.pair?'둘 중 이 설명에 해당하는 것은?':'이 설명에 해당하는 용어는?'}</div><div class="stem">${esc(c.def)}</div>
      <div class="choices">${it.opts.map((o,k)=>`<button class="ch" data-k="${k}">${'①②③④'[k]} ${esc(o.name)}</button>`).join('')}</div><div id="fb"></div><div class="qbtns" id="nx"></div>`;
  }
  $app.innerHTML=head+`<div class="qcard">${tags}${body}</div>`;
  Q.answered=false;
  document.getElementById('quit').onclick=()=>{if(Q.i===0||confirmQuit()){Q=null;location.hash='home';}};
  if(it.mode==='write'){
    const inp=document.getElementById('in'); inp.focus();
    const submit=()=>{ if(Q.answered){next();return;} judge(isRight(c,inp.value),inp.value); };
    document.getElementById('sub').onclick=submit;
    inp.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();submit();}};
    document.getElementById('skip').onclick=()=>{ if(!Q.answered) judge(false,''); };
  } else {
    $app.querySelectorAll('.ch').forEach(b=>b.onclick=()=>{
      if(Q.answered) return; const o=it.opts[+b.dataset.k]; const ok=o.id===c.id;
      $app.querySelectorAll('.ch').forEach(x=>{x.disabled=true; if(it.opts[+x.dataset.k].id===c.id) x.classList.add('ok');});
      if(!ok) b.classList.add('no');
      judge(ok,o.name);
    });
  }
}
function confirmQuit(){return true;}
function judge(ok,given){
  const it=Q.items[Q.i], c=it.c; Q.answered=true;
  record(c,ok); if(ok) Q.ok++; else Q.wrong.push({c,given});
  const fb=document.getElementById('fb');
  fb.innerHTML=`<div class="fb ${ok?'ok':'no'}"><b class="h">${ok?'정답! 👏':'오답'}</b>${ok&&it.mode==='write'?'':'정답: <b>'+esc(c.name)+'</b><br>'}${it.mode==='rev'?'':'<span style="color:var(--sub)">'+esc(c.def)+'</span>'}</div>`;
  const nx=it.mode==='write'?null:document.getElementById('nx');
  if(it.mode==='write'){
    const inp=document.getElementById('in'); inp.readOnly=true;
    document.getElementById('sub').textContent=Q.i+1<Q.items.length?'다음 →':'결과 보기';
    document.getElementById('skip').style.display='none';
    setTimeout(()=>document.getElementById('sub').focus(),0);
  } else {
    nx.innerHTML=`<button class="big" id="sub">${Q.i+1<Q.items.length?'다음 →':'결과 보기'}</button>`;
    document.getElementById('sub').onclick=next;
  }
}
function next(){Q.i++;renderQ();window.scrollTo(0,0);}
function result(){
  const tot=Q.items.length, sc=Math.round(Q.ok/tot*100);
  S.hist.unshift({t:Date.now(),label:Q.label,ok:Q.ok,tot});S.hist=S.hist.slice(0,30);save();
  const wr=Q.wrong;
  $app.innerHTML=`<div class="card result"><div style="color:var(--sub);font-weight:700">${esc(Q.label)} 결과</div><div class="sc">${sc}점</div><div>${tot}문제 중 <b>${Q.ok}개</b> 정답</div></div>
  ${wr.length?`<div class="card"><b>틀린 문제 ${wr.length}개</b><ul class="wl">${wr.map(w=>`<li><b>${esc(w.c.name)}</b>${w.given?` <span style="color:var(--sub)">(내 답: ${esc(w.given)})</span>`:''}<small>${esc(w.c.def)}</small></li>`).join('')}</ul></div>`:'<div class="card" style="text-align:center">🎉 모두 맞혔어요!</div>'}
  <div class="row">${wr.length?'<button class="big" id="retry">틀린 것만 다시</button>':''}<button class="big ghost" id="home">처음으로</button></div>${Q.after?`<button class="big" style="margin-top:10px" id="aft">${Q.after.text}</button>`:''}`;
  const items=Q.items;
  if(wr.length) document.getElementById('retry').onclick=()=>startQuiz(shuf(items.filter(it=>wr.some(w=>w.c.id===it.c.id))).map(it=>({c:it.c,mode:it.mode,pair:it.pair,other:it.other})),'틀린 문제 다시');
  document.getElementById('home').onclick=()=>{Q=null;location.hash='home';};
  if(Q.after){const h=Q.after.hash;document.getElementById('aft').onclick=()=>{Q=null;location.hash=h;};}
}

// ---------- DEX ----------
let dexQ='';const closed=new Set();
function dex(){
  const by=S.dexBy;
  $app.innerHTML=`<input class="search" id="sq" placeholder="용어·설명 검색" value="${esc(dexQ)}">
  <div class="seg"><button class="${by==='w'?'on':''}" data-by="w">주차별</button><button class="${by==='cat'?'on':''}" data-by="cat">주제별</button><button class="${by==='imp'?'on':''}" data-by="imp">🔥 시험 중요</button></div>
  <div class="bar-row"><button class="chip ${S.dexFav?'on':''}" id="df">⭐ 즐겨찾기만 ${S.fav.length}</button><span><button class="link" id="ea">모두 펴기</button> <button class="link" id="ec">모두 접기</button></span></div>
  <div id="dl"></div>`;
  const sq=document.getElementById('sq'); sq.oninput=()=>{dexQ=sq.value;list();};
  $app.querySelectorAll('[data-by]').forEach(b=>b.onclick=()=>{S.dexBy=b.dataset.by;save();closed.clear();dex();});
  document.getElementById('df').onclick=()=>{S.dexFav=!S.dexFav;save();dex();};
  document.getElementById('ea').onclick=()=>{closed.clear();list();};
  document.getElementById('ec').onclick=()=>{groups().forEach(g=>closed.add(g[0]));list();};
  list();
}
function groups(){
  const q=norm(dexQ);
  let items=C.filter(c=>!q||norm(c.name+c.def+(c.alias||[]).join('')).includes(q));
  if(S.dexFav) items=items.filter(c=>fav(c.id));
  const by=S.dexBy, m=new Map();
  if(by==='imp') items=items.filter(c=>c.imp);
  for(const c of items){const k=by==='cat'?c.cat:(c.w+'주차 · '+W[c.w]); if(!m.has(k))m.set(k,[]); m.get(k).push(c);}
  return [...m.entries()];
}
function ccard(c){return `<div class="cc"><button class="star ${fav(c.id)?'on':''}" data-f="${c.id}" aria-label="즐겨찾기">${fav(c.id)?'★':'☆'}</button><h3>${esc(c.name)}</h3><p>${esc(c.def)}</p><div class="tags"><span class="tag w">${c.w}주차</span><span class="tag">${esc(c.cat)}</span>${c.imp?'<span class="tag imp">🔥 시험</span>':''}${mem(c.id)?'<span class="tag">✅ 외움</span>':''}</div></div>`;}
function list(){
  const g=groups(), el=document.getElementById('dl');
  el.innerHTML=g.length?g.map(([k,arr])=>`<div class="grp ${closed.has(k)?'closed':''}" data-g="${esc(k)}"><div class="grp-h"><span><b>${esc(k)}</b><small>${arr.length}개</small></span><span class="ar">▾</span></div><div class="grp-b">${arr.map(ccard).join('')}</div></div>`).join(''):'<p class="empty">검색 결과가 없어요</p>';
  el.querySelectorAll('.grp-h').forEach(h=>h.onclick=()=>{const k=h.parentNode.dataset.g;closed.has(k)?closed.delete(k):closed.add(k);h.parentNode.classList.toggle('closed');});
  el.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{toggle('fav',+b.dataset.f);const on=fav(+b.dataset.f);b.classList.toggle('on',on);b.textContent=on?'★':'☆';toast(on?'즐겨찾기에 추가':'즐겨찾기 해제');});
}

// ---------- CHECK (암기) ----------
const shown=new Set();
function check(){
  const f=S.memF; let items=C;
  if(f==='todo') items=C.filter(c=>!mem(c.id)); else if(f==='done') items=C.filter(c=>mem(c.id)); else if(f==='fav') items=C.filter(c=>fav(c.id)); else if(f==='imp') items=C.filter(c=>c.imp);
  const pct=Math.round(S.mem.length/C.length*100);
  $app.innerHTML=`<div class="mem-top"><b>${S.mem.length}</b> / ${C.length}개 외움 · ${pct}%</div><div class="mbar"><i style="width:${pct}%"></i></div>
  <div class="seg">${[['all','전체'],['todo','미암기'],['done','암기'],['imp','🔥'],['fav','⭐']].map(x=>`<button class="${f===x[0]?'on':''}" data-mf="${x[0]}">${x[1]}</button>`).join('')}</div>
  <div class="sw"><div><b>용어 가리기</b><small>설명만 보고 떠올린 뒤, 용어 칸을 눌러 확인하세요</small></div><button class="switch ${S.hide?'on':''}" id="hd" aria-label="용어 가리기"></button></div>
  <div id="ml">${items.length?items.map(c=>{const hid=S.hide&&!shown.has(c.id);return `<div class="mc ${mem(c.id)?'done':''}"><div class="mc-b"><button class="star ${fav(c.id)?'on':''}" data-f="${c.id}">${fav(c.id)?'★':'☆'}</button><div class="nm" data-r="${c.id}" style="${hid?'background:var(--gl);color:var(--g);border-radius:8px;padding:2px 10px;cursor:pointer;display:inline-block;font-size:13.5px':''}">${hid?'👀 탭해서 용어 보기':esc(c.name)}</div><p>${esc(c.def)}</p><div class="tags" style="margin-top:6px"><span class="tag w">${c.w}주차</span><span class="tag">${esc(c.cat)}</span></div></div><button class="ck" data-m="${c.id}">${mem(c.id)?'✅ 외웠어요':'⬜ 체크'}</button></div>`;}).join(''):'<p class="empty">해당하는 개념이 없어요</p>'}</div>`;
  $app.querySelectorAll('[data-mf]').forEach(b=>b.onclick=()=>{S.memF=b.dataset.mf;save();check();});
  document.getElementById('hd').onclick=()=>{S.hide=!S.hide;shown.clear();save();check();};
  $app.querySelectorAll('[data-r]').forEach(el=>el.onclick=()=>{const id=+el.dataset.r;if(!S.hide)return;shown.add(id);el.removeAttribute('style');el.textContent=C[id].name;});
  $app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const id=+b.dataset.m;toggle('mem',id);const on=mem(id);b.textContent=on?'✅ 외웠어요':'⬜ 체크';b.parentNode.classList.toggle('done',on);const pct=Math.round(S.mem.length/C.length*100);$app.querySelector('.mem-top').innerHTML=`<b>${S.mem.length}</b> / ${C.length}개 외움 · ${pct}%`;$app.querySelector('.mbar i').style.width=pct+'%';if(f==='todo'||f==='done')setTimeout(check,250);});
  $app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{toggle('fav',+b.dataset.f);const on=fav(+b.dataset.f);b.classList.toggle('on',on);b.textContent=on?'★':'☆';});
}

// ---------- PAIRS ----------
function pairItems(ps){const out=[];for(const p of ps){const a=BY[p.a],b=BY[p.b];out.push({c:a,other:b,mode:'mc',pair:true},{c:b,other:a,mode:'mc',pair:true});}return out;}
function pairs(){
  const P=window.PAIRS, gs=['전체',...new Set(P.map(p=>p.g))], g=S.pairG;
  const list=P.filter(p=>g==='전체'||p.g===g);
  $app.innerHTML=`<button class="big" id="allp">🔀 전체 쌍 섞어서 맞히기 (20문제)</button>
  <div class="chips" style="margin:12px 0">${gs.map(x=>`<button class="chip ${g===x?'on':''}" data-pg="${esc(x)}">${esc(x)}</button>`).join('')}</div>
  <h2 class="sec">헷갈리는 쌍 <span style="color:var(--sub);font-weight:600;font-size:13px">${list.length}쌍 · 둘을 비교해서 외우세요</span></h2>
  ${list.map((p,i)=>{const a=BY[p.a],b=BY[p.b];return `<div class="pc"><div class="pc-h"><span class="n">${i+1}</span>${esc(p.a)} <span style="color:var(--sub);font-size:13px">vs</span> ${esc(p.b)}</div>
   <table class="pt"><tr><th>구분</th><th>${esc(p.a)}</th><th>${esc(p.b)}</th></tr>${p.rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
   <div class="defs"><div><b>${esc(a.name)}</b>${esc(a.def)}</div><div><b>${esc(b.name)}</b>${esc(b.def)}</div></div>
   <button class="go" data-pi="${P.indexOf(p)}">🎯 이 쌍 맞히기 (2문제)</button></div>`;}).join('')}`;
  document.getElementById('allp').onclick=()=>startQuiz(shuf(pairItems(P)).slice(0,20),'헷갈리는 쌍');
  $app.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{S.pairG=b.dataset.pg;save();pairs();});
  $app.querySelectorAll('[data-pi]').forEach(b=>b.onclick=()=>{const p=P[+b.dataset.pi];startQuiz(shuf(pairItems([p])),p.a+' vs '+p.b);});
}

// ---------- STATS ----------
function stats(){
  const a=acc();
  const wrongs=C.filter(c=>S.st[c.id]&&S.st[c.id].w>0).sort((x,y)=>(S.st[y.id].w-S.st[y.id].c)-(S.st[x.id].w-S.st[x.id].c));
  const wk=Object.keys(W).map(k=>{let c=0,w=0;C.filter(x=>x.w==k).forEach(x=>{const s=S.st[x.id];if(s){c+=s.c;w+=s.w;}});return {k,c,w,p:c+w?Math.round(c/(c+w)*100):null};});
  $app.innerHTML=`<div class="stat-grid"><div class="card"><b>${a.t}</b><span>푼 문제</span></div><div class="card"><b>${a.p==null?'-':a.p+'%'}</b><span>정답률</span></div><div class="card"><b>${S.mem.length}</b><span>외운 개념</span></div></div>
  <div class="card"><b>주차별 정답률</b>${wk.map(x=>`<div class="wk"><span class="lb">${x.k}주차 ${esc(W[x.k])}</span><span class="tr"><i style="width:${x.p||0}%"></i></span><span class="vl">${x.p==null?'-':x.p+'%'}</span></div>`).join('')}</div>
  <div class="card"><div class="bar-row" style="margin:0 0 6px"><b>📕 오답 노트 ${wrongs.length}개</b>${wrongs.length?'<button class="link" id="wq">오답만 다시 풀기</button>':''}</div>
  ${wrongs.length?`<ul class="wl">${wrongs.slice(0,40).map(c=>`<li><b>${esc(c.name)}</b> <span style="color:var(--sub);font-size:12.5px">✗${S.st[c.id].w} ✓${S.st[c.id].c}</span><small>${esc(c.def)}</small></li>`).join('')}</ul>`:'<p class="empty">아직 틀린 문제가 없어요</p>'}</div>
  <div class="card"><b>최근 기록</b>${S.hist.length?`<ul class="wl">${S.hist.slice(0,10).map(h=>`<li>${new Date(h.t).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})} · ${esc(h.label)} <b style="color:var(--g)">${h.ok}/${h.tot}</b></li>`).join('')}</ul>`:'<p class="empty">퀴즈를 풀면 여기에 쌓여요</p>'}</div>
  <button class="danger" id="rs">기록 초기화</button>`;
  if(wrongs.length) document.getElementById('wq').onclick=()=>startQuiz(shuf(wrongs).slice(0,20).map(c=>({c,mode:S.mode==='rev'?'rev':'mc'})),'오답 노트');
  document.getElementById('rs').onclick=()=>{if(confirm('푼 기록과 오답 노트를 지울까요? (즐겨찾기·외운 것은 유지)')){S.st={};S.hist=[];save();stats();}};
}

// ---------- 공부 루트 카드 ----------
const T=window.TOON;
function toonRead(){return S.toonRead||(S.toonRead=[]);}
const CARDS=[['00','🔥 찐핵심 15'],['01','1주 벼·녹색혁명·기후'],['02','2주 작물·옥밀보감·콩'],['03','3주 원예학·작물분류'],['04','4주 온도·광량·광질'],['05','5주 스마트팜·에너지·제어'],['06','6주 수경·EC·pH'],['07','7주 생식·멘델·육종']];
function studyCard(){
  return `<div class="route">
    <div class="route-h"><b>📚 쉽게 공부하는 순서</b><span>요약 카드 ${CARDS.length}장</span></div>
    <ol class="steps"><li><b>1. 요약 카드</b> 빨간 글씨만</li><li><b>2. 개념 퀴즈</b> 주차별</li><li><b>3. 유형별 훈련</b> 계산·서술형</li><li><b>4. 오답만 다시</b> 기록 탭</li></ol>
    <button class="big" data-go="toon">📇 요약 카드 보기</button>
  </div>`;
}
function toonList(){
  $app.innerHTML=`<section class="hero toon-hero"><small>시험 직전 벼락치기</small><h1>요약 카드</h1><p>빨간 글씨만 읽어도 됩니다 · 찐핵심 15부터</p></section>
  <div class="chips" id="cj">${CARDS.map(c=>`<button class="chip" data-j="${c[0]}">${c[0]==='00'?'찐핵심':(+c[0])+'주'}</button>`).join('')}</div>
  ${CARDS.map(c=>`<h2 class="sec" id="c${c[0]}">${c[1]}</h2><img src="img/${c[0]}.png" alt="${c[1]}" loading="lazy" style="width:100%;border-radius:16px;display:block;box-shadow:0 2px 8px rgba(0,0,0,.08)">`).join('')}
  <button class="big" style="margin-top:18px" data-go="home">🧩 퀴즈로 확인하기</button>`;
  $app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.go;});
  $app.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>document.getElementById('c'+b.dataset.j).scrollIntoView({behavior:'smooth'}));
}
// ---------- 캐릭터 SVG ----------
function face(f,cx,cy,dark){
  const ink=dark?'#1d2a1f':'#2b2b2b';
  const eyes={smile:`<path d="M${cx-14} ${cy-2} q5 -6 10 0 M${cx+4} ${cy-2} q5 -6 10 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    wow:`<circle cx="${cx-9}" cy="${cy-3}" r="4.5" fill="${ink}"/><circle cx="${cx+9}" cy="${cy-3}" r="4.5" fill="${ink}"/><circle cx="${cx-8}" cy="${cy-5}" r="1.5" fill="#fff"/><circle cx="${cx+10}" cy="${cy-5}" r="1.5" fill="#fff"/>`,
    sad:`<path d="M${cx-14} ${cy-4} q5 4 10 0 M${cx+4} ${cy-4} q5 4 10 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    think:`<circle cx="${cx-9}" cy="${cy-3}" r="3.5" fill="${ink}"/><path d="M${cx+4} ${cy-3} h10" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
    cool:`<circle cx="${cx-9}" cy="${cy-3}" r="3.5" fill="${ink}"/><circle cx="${cx+9}" cy="${cy-3}" r="3.5" fill="${ink}"/>`}[f]||'';
  const mouth={smile:`<path d="M${cx-8} ${cy+9} q8 9 16 0" stroke="${ink}" stroke-width="3" fill="#ff8a80" stroke-linecap="round"/>`,
    wow:`<ellipse cx="${cx}" cy="${cy+12}" rx="5" ry="6" fill="${ink}"/>`,
    sad:`<path d="M${cx-7} ${cy+14} q7 -7 14 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    think:`<path d="M${cx-5} ${cy+12} h10" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
    cool:`<path d="M${cx-8} ${cy+9} q8 7 16 -2" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`}[f]||'';
  const blush=`<ellipse cx="${cx-20}" cy="${cy+6}" rx="5" ry="3" fill="#ff8a80" opacity=".5"/><ellipse cx="${cx+20}" cy="${cy+6}" rx="5" ry="3" fill="#ff8a80" opacity=".5"/>`;
  return eyes+mouth+blush;
}
function charSVG(who,f,flip){
  const t=flip?' transform="translate(120,0) scale(-1,1)"':'';
  if(who==='doc') return `<svg viewBox="0 0 120 130" class="ch-svg"><g${t}>
   <g stroke="#2e7d32" stroke-width="3" stroke-linecap="round" fill="none"><path d="M18 60 q-12 -4 -14 -14"/><path d="M102 60 q12 -4 14 -14"/><path d="M30 26 q-6 -14 2 -22"/><path d="M90 26 q6 -14 -2 -22"/><path d="M60 18 v-14"/><path d="M28 110 q-8 8 -4 16"/><path d="M92 110 q8 8 4 16"/></g>
   <ellipse cx="60" cy="68" rx="46" ry="48" fill="#81c784" stroke="#2e7d32" stroke-width="3"/>
   <circle cx="40" cy="48" r="5" fill="#a5d6a7"/><circle cx="84" cy="90" r="6" fill="#a5d6a7"/><circle cx="34" cy="92" r="4" fill="#a5d6a7"/>
   ${face(f,60,66)}
   <g fill="none" stroke="#3e2723" stroke-width="3"><circle cx="51" cy="63" r="10"/><circle cx="69" cy="63" r="10"/><path d="M61 63 h-2"/></g>
   </g></svg>`;
  return `<svg viewBox="0 0 120 130" class="ch-svg"><g${t}>
   <path d="M60 30 q-2 -16 -18 -22 q12 -2 20 10 q6 -14 22 -12 q-12 8 -22 24z" fill="#66bb6a" stroke="#2e7d32" stroke-width="2.5"/>
   <path d="M60 30 v-6" stroke="#2e7d32" stroke-width="3"/>
   <circle cx="60" cy="72" r="44" fill="#ffe0b2" stroke="#e6a96b" stroke-width="3"/>
   <path d="M20 62 q8 -32 40 -34 q32 2 40 34 q-12 -12 -40 -14 q-28 2 -40 14z" fill="#5d4037"/>
   ${face(f,60,76)}
   <path d="M30 116 q30 20 60 0 v14 h-60z" fill="#42a5f5"/>
   </g></svg>`;
}

// ---------- 그림 패널 SVG ----------
const FIG={
 timeline:`<svg viewBox="0 0 600 150"><defs><marker id="ta" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6z" fill="currentColor"/></marker></defs>
  <line x1="20" y1="60" x2="585" y2="60" stroke="currentColor" stroke-width="4" marker-end="url(#ta)"/>
  ${[['🧫','LUCA','38~40억 년',70],['🌊','시아노박테리아','27억 년, 산소 광합성',225],['💨','산소 대발생','혐기성 멸종',380],['🫧','세포내공생','진핵세포 탄생',525]].map(x=>`<g text-anchor="middle"><circle cx="${x[3]}" cy="60" r="24" fill="var(--card)" stroke="var(--g)" stroke-width="3"/><text x="${x[3]}" y="69" font-size="30.0">${x[0]}</text><text x="${x[3]}" y="108" font-size="20.0" font-weight="800" fill="currentColor">${x[1]}</text><text x="${x[3]}" y="130" font-size="16.2" fill="var(--sub)">${x[2]}</text></g>`).join('')}</svg>`,
 barcode:`<svg viewBox="0 0 600 170" font-size="18.0"><text x="10" y="22" font-weight="800" fill="var(--blue)">🦠 세균 = 16S rRNA (97% 이상 → 같은 종)</text>
  <rect x="10" y="34" width="580" height="30" rx="6" fill="var(--bluel)" stroke="var(--blue)"/>${[70,190,310,430,520].map(x=>`<rect x="${x}" y="34" width="40" height="30" fill="var(--blue)"/>`).join('')}
  <text x="10" y="84" font-size="15.0" fill="var(--sub)">연한 칸 = 보존 영역(프라이머 붙는 곳) · 진한 칸 = 변이 영역(종 구분)</text>
  <text x="10" y="118" font-weight="800" fill="var(--g)">🍄 곰팡이 = ITS</text>
  <g text-anchor="middle" font-weight="700"><rect x="10" y="128" width="140" height="32" rx="6" fill="var(--gl)" stroke="var(--g)"/><text x="80" y="149" fill="currentColor">18S</text><rect x="150" y="128" width="90" height="32" fill="#e53935"/><text x="195" y="149" fill="#fff">ITS1</text><rect x="240" y="128" width="70" height="32" fill="var(--gl)" stroke="var(--g)"/><text x="275" y="149" fill="currentColor">5.8S</text><rect x="310" y="128" width="90" height="32" fill="#e53935"/><text x="355" y="149" fill="#fff">ITS2</text><rect x="400" y="128" width="190" height="32" rx="6" fill="var(--gl)" stroke="var(--g)"/><text x="495" y="149" fill="currentColor">28S</text></g></svg>`,
 seqgen:`<svg viewBox="0 0 600 190" font-size="14">${[['1세대','Sanger','ddNTP로 멈춤','정확, 느림·비쌈','#78909c',10],['2세대','Illumina','브릿지 증폭','대량·저렴, 150~300bp','#1e88e5',205],['3세대','Nanopore','구멍 통과 전압','수십 kb~Mb, 반복 해결','#8e24aa',400]].map(x=>`<g><rect x="${x[5]}" y="10" width="185" height="170" rx="14" fill="${x[4]}"/><text x="${x[5]+92}" y="40" text-anchor="middle" fill="#fff" font-size="13" opacity=".9">${x[0]}</text><text x="${x[5]+92}" y="68" text-anchor="middle" fill="#fff" font-size="22" font-weight="800">${x[1]}</text><text x="${x[5]+92}" y="104" text-anchor="middle" fill="#fff">${x[2]}</text><text x="${x[5]+92}" y="134" text-anchor="middle" fill="#fff" font-size="12.5">${x[3]}</text><text x="${x[5]+92}" y="166" text-anchor="middle" font-size="22">${x[1]==='Sanger'?'🐢':x[1]==='Illumina'?'🖨️':'🚇'}</text></g>`).join('')}</svg>`,
 fair:`<svg viewBox="0 0 600 120" text-anchor="middle">${[['F','Findable','찾을 수 있게','#2e7d32'],['A','Accessible','접근 가능하게','#1e88e5'],['I','Interoperable','표준으로 호환','#fb8c00'],['R','Reusable','다시 쓸 수 있게','#8e24aa']].map((x,i)=>`<g><rect x="${8+i*148}" y="8" width="138" height="104" rx="14" fill="${x[3]}"/><text x="${77+i*148}" y="54" fill="#fff" font-size="38" font-weight="900">${x[0]}</text><text x="${77+i*148}" y="80" fill="#fff" font-size="15" font-weight="700">${x[1]}</text><text x="${77+i*148}" y="100" fill="#fff" font-size="12.5">${x[2]}</text></g>`).join('')}</svg>`,
 fastq:`<svg viewBox="0 0 600 200" font-size="15"><rect x="8" y="8" width="270" height="184" rx="12" fill="var(--bluel)"/><text x="22" y="36" font-weight="800" fill="var(--blue)">FASTA (2줄)</text><g font-family="monospace" font-size="16"><text x="22" y="74" fill="#e53935">&gt;seq1 E.coli</text><text x="22" y="100" fill="currentColor">ATGCGTACGTTA</text></g><text x="22" y="150" font-size="13" fill="var(--sub)">이름표 + 서열</text><text x="22" y="170" font-size="13" fill="var(--sub)">품질 정보 없음</text>
  <rect x="294" y="8" width="298" height="184" rx="12" fill="var(--gl)"/><text x="308" y="36" font-weight="800" fill="var(--g)">FASTQ (4줄)</text><g font-family="monospace" font-size="16"><text x="308" y="70" fill="#e53935">@read1</text><text x="308" y="100" fill="currentColor">ATGCGTAC</text><text x="308" y="130" fill="#e53935">+</text><text x="308" y="160" fill="currentColor">IIII#!+I</text></g><g font-size="12.5" fill="var(--sub)"><text x="440" y="70">① ID</text><text x="440" y="100">② 서열</text><text x="440" y="130">③ +</text><text x="440" y="160">④ 품질(성적표)</text></g></svg>`,
 blast:`<svg viewBox="0 0 600 110" font-size="13.5" text-anchor="middle">${['단어로 쪼개기','Hit 찾기','확장 → HSP','Gap 허용','점수 계산'].map((t,i)=>`<g><rect x="${4+i*120}" y="20" width="108" height="64" rx="12" fill="${i===4?'#8e24aa':'var(--card)'}" stroke="#8e24aa" stroke-width="2"/><text x="${58+i*120}" y="48" font-size="20" fill="${i===4?'#fff':'#8e24aa'}" font-weight="900">${i+1}</text><text x="${58+i*120}" y="70" fill="${i===4?'#fff':'currentColor'}" font-weight="700">${t}</text>${i<4?`<text x="${117+i*120}" y="57" fill="#8e24aa" font-size="16">▶</text>`:''}</g>`).join('')}<text x="300" y="104" fill="var(--sub)" font-size="12.5">DNA 단어 길이 기본값 11 또는 7 · 단백질 3 (짧을수록 민감도↑ 속도↓)</text></svg>`,
 ortho:`<svg viewBox="0 0 600 220" font-size="16.1"><g stroke="currentColor" stroke-width="3" fill="none"><path d="M300 20 v40"/><path d="M180 60 h240"/><path d="M180 60 v50"/><path d="M420 60 v50"/><path d="M120 110 h120"/><path d="M360 110 h120"/><path d="M120 110 v50"/><path d="M240 110 v50"/><path d="M360 110 v50"/><path d="M480 110 v50"/></g>
  <circle cx="300" cy="60" r="9" fill="#1e88e5"/><text x="316" y="50" fill="#1e88e5" font-weight="800">유전자 중복 (같은 종 안)</text>
  <circle cx="180" cy="110" r="9" fill="#e53935"/><circle cx="420" cy="110" r="9" fill="#e53935"/><text x="20" y="100" fill="#e53935" font-weight="800">종 분화</text>
  <g text-anchor="middle" font-weight="800" fill="currentColor"><text x="120" y="182">종1 · 1a</text><text x="240" y="182">종2 · 1a</text><text x="360" y="182">종1 · 1b</text><text x="480" y="182">종2 · 1b</text></g>
  <g text-anchor="middle" fill="var(--g)" font-weight="800"><text x="180" y="145">Ortholog</text><text x="420" y="145">Ortholog</text></g>
  <path d="M120 194 Q240 222 360 194" stroke="#8e24aa" stroke-width="2.5" fill="none" stroke-dasharray="6 4"/><text x="240" y="216" text-anchor="middle" fill="#8e24aa" font-weight="800">Paralog</text></svg>`,
 n50:`<svg viewBox="0 0 600 160" font-size="16.1"><text x="10" y="22" font-weight="800" fill="currentColor">총 100kb: 30, 25, 20, 15, 10 kb</text>
  <g text-anchor="middle" font-weight="700"><rect x="10" y="36" width="174" height="36" fill="#2e7d32"/><text x="97" y="60" fill="#fff">30</text><rect x="184" y="36" width="145" height="36" fill="#e53935"/><text x="256" y="60" fill="#fff">25 ← N50</text><rect x="329" y="36" width="116" height="36" fill="#a5d6a7"/><text x="387" y="60" fill="#1d2a1f">20</text><rect x="445" y="36" width="87" height="36" fill="#c8e6c9"/><text x="488" y="60" fill="#1d2a1f">15</text><rect x="532" y="36" width="58" height="36" fill="#e8f5e9"/><text x="561" y="60" fill="#1d2a1f">10</text></g>
  <line x1="300" y1="28" x2="300" y2="84" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 4"/><text x="300" y="100" text-anchor="middle" fill="var(--sub)">50kb(절반)</text>
  <text x="10" y="128" fill="currentColor">30 + 25 = 55 ≥ 50 → <tspan fill="#e53935" font-weight="800">N50 = 25kb</tspan>, <tspan fill="#e53935" font-weight="800">L50 = 2개</tspan></text>
  <text x="10" y="150" font-size="14.4" fill="var(--sub)">N50 클수록 · L50 작을수록 좋은 조립</text></svg>`,
 genes:`<svg viewBox="0 0 600 120" font-size="16.1" text-anchor="middle"><text x="40" y="34" font-weight="800" fill="currentColor">원핵</text><rect x="80" y="14" width="500" height="30" rx="6" fill="#2e7d32"/><text x="330" y="34" fill="#fff" font-weight="700">ATG ───── 쭉 이어진 코딩 ───── TAA</text>
  <text x="40" y="94" font-weight="800" fill="currentColor">진핵</text><rect x="80" y="74" width="100" height="30" rx="6" fill="#1e88e5"/><text x="130" y="94" fill="#fff">Exon</text><line x1="180" y1="89" x2="270" y2="89" stroke="var(--sub)" stroke-width="4" stroke-dasharray="6 4"/><text x="225" y="70" font-size="13.8" fill="var(--sub)">Intron(광고)</text><rect x="270" y="74" width="90" height="30" rx="6" fill="#1e88e5"/><text x="315" y="94" fill="#fff">Exon</text><line x1="360" y1="89" x2="460" y2="89" stroke="var(--sub)" stroke-width="4" stroke-dasharray="6 4"/><rect x="460" y="74" width="120" height="30" rx="6" fill="#1e88e5"/><text x="520" y="94" fill="#fff">Exon</text></svg>`,
 rnaseq:`<svg viewBox="0 0 600 170" font-size="13" text-anchor="middle">${['설계','시퀀싱','품질관리','매핑','정량','차등발현','기능분석','시각화'].map((t,i)=>{const x=8+(i%4)*148,y=i<4?10:92;return `<g><rect x="${x}" y="${y}" width="136" height="66" rx="12" fill="${i<4?'#5e35b1':'#1e88e5'}"/><text x="${x+68}" y="${y+28}" fill="#fff" font-size="20" font-weight="900">${i+1}</text><text x="${x+68}" y="${y+52}" fill="#fff" font-weight="700">${t}</text></g>`;}).join('')}</svg>`,
 volcano:`<svg viewBox="0 0 420 270" font-size="12.5"><line x1="40" y1="230" x2="400" y2="230" stroke="currentColor" stroke-width="2"/><line x1="40" y1="20" x2="40" y2="230" stroke="currentColor" stroke-width="2"/><line x1="40" y1="150" x2="400" y2="150" stroke="#e53935" stroke-dasharray="5 4"/><line x1="160" y1="20" x2="160" y2="230" stroke="var(--sub)" stroke-dasharray="5 4"/><line x1="280" y1="20" x2="280" y2="230" stroke="var(--sub)" stroke-dasharray="5 4"/>
  <g fill="#9aa5b1">${[[200,220],[230,215],[215,205],[190,200],[245,210],[175,190],[260,195],[210,180],[235,170],[185,165],[250,140],[195,130]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5"/>`).join('')}</g>
  <g fill="#e53935">${[[300,120],[320,90],[350,60],[340,110],[370,40]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5"/>`).join('')}</g>
  <g fill="#1e88e5">${[[140,110],[110,80],[90,55],[125,130]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5"/>`).join('')}</g>
  <text x="352" y="30" text-anchor="middle" fill="#e53935" font-weight="800">발현 증가↑</text><text x="90" y="40" text-anchor="middle" fill="#1e88e5" font-weight="800">발현 감소↓</text>
  <text x="220" y="252" text-anchor="middle" fill="currentColor">X축: log2 Fold Change</text><text x="16" y="125" transform="rotate(-90 16 125)" text-anchor="middle" fill="currentColor">Y축: −log10(P)</text></svg>`
};

// ---------- 웹툰 목록 ----------
function _oldToonList(){
  const read=toonRead();
  $app.innerHTML=`<section class="hero toon-hero"><small>읽기만 해도 이해되는</small><h1>균박사의 미생물 웹툰</h1><p>1화 = 1주차 · 5분이면 끝 · 끝나면 3문제 확인</p><div class="kpis"><div class="kpi"><b>${read.length}/${T.length}</b><span>읽음</span></div></div></section>
  <div class="cast"><div>${charSVG('doc','smile')}<b>균박사</b><small>학점 4.5 미생물 선배</small></div><div>${charSVG('kid','wow')}<b>새싹이</b><small>시험 앞둔 원예과 신입생</small></div></div>
  ${T.map(e=>`<a class="ep" href="#toon/${e.ep}" style="--c:${e.color}"><span class="ep-n">${e.ep}화</span><span class="ep-e">${e.emoji}</span><span class="ep-t"><b>${esc(e.title)}</b><small>${e.w}주차 · ${esc(e.sub)}</small></span><span class="ep-s">${read.includes(e.ep)?'✅':'›'}</span></a>`).join('')}`;
}
function bubble(who,text,side){return `<div class="bb ${side} ${who}"><span class="bb-n">${who==='doc'?'균박사':'새싹이'}</span>${text}</div>`;}
function panel(p){
  if(p.t==='board') return `<div class="pn board"><div class="board-t">📌 ${esc(p.title)}</div><div class="board-b">${p.html}</div></div>`;
  if(p.t==='fig') return `<div class="pn figp"><div class="fig-t">🖼️ ${esc(p.title)}</div><div class="fig-s">${FIG[p.svg]||''}</div><div class="fig-c">${esc(p.cap)}</div></div>`;
  const sideOf=w=>p.L&&p.L[0]===w?'l':'r';
  return `<div class="pn talk" style="--bgp:${p.bg||'#e8f5e9'}">${p.cap?`<div class="cap">${esc(p.cap)}</div>`:''}
   <div class="stage"><div class="actor l">${p.L?charSVG(p.L[0],p.L[1]):''}</div><div class="prop">${p.prop||''}</div><div class="actor r">${p.R?charSVG(p.R[0],p.R[1],true):''}</div></div>
   <div class="bbs">${p.lines.map(l=>bubble(l[0],l[1],sideOf(l[0]))).join('')}</div></div>`;
}
function toonView(n){
  const e=T.find(x=>x.ep===n); if(!e){location.hash='toon';return;}
  const nx=T.find(x=>x.ep===n+1);
  $app.innerHTML=`<div class="qtop"><a class="x" href="#toon">← 목록</a><span class="qn">${e.ep}화 / ${T.length}화</span></div>
  <div class="cover" style="--c:${e.color}"><small>EP.${e.ep} · ${e.w}주차</small><h1>${e.emoji} ${esc(e.title)}</h1><p>${esc(e.sub)}</p></div>
  ${e.panels.map(panel).join('')}
  <div class="pn memo"><div class="board-t">✏️ 오늘의 한 줄 암기 (노트에 적기)</div><ul>${e.memo.map(m=>`<li>${esc(m)}</li>`).join('')}</ul></div>
  <button class="big" id="tq">🎯 이해했는지 3문제로 확인</button>
  ${nx?`<a class="big ghost" style="margin-top:10px;text-align:center" href="#toon/${nx.ep}">다음 화: ${esc(nx.title)} →</a>`:''}`;
  document.getElementById('tq').onclick=()=>{
    if(!toonRead().includes(e.ep)){S.toonRead.push(e.ep);save();}
    const cs=shuf(e.quiz.map(nm=>BY[nm]).filter(Boolean)).slice(0,3);
    const modes=['mc','write','rev'];
    startQuiz(cs.map((c,i)=>({c,mode:modes[i%3]})),`${e.ep}화 확인 문제`, nx?{text:`▶ 다음 화: ${nx.title}`,hash:'toon/'+nx.ep}:{text:'🎯 유형별 훈련 하러 가기',hash:'home'});
  };
}

// ---------- 유형별 훈련 ----------
function drillHead(title,sub){return `<div class="qtop"><a class="x" href="#home">←</a><b style="font-size:17px">${title}</b></div><p class="count" style="text-align:left;margin-top:0">${sub}</p>`;}
let D=null;
function drill(kind){
  if(kind==='calc') return calcDrill();
  if(kind==='order') return orderDrill();
  if(kind==='list') return listDrill();
  if(kind==='essay') return essayDrill();
  location.hash='home';
}
function drillScore(label,ok,tot){S.hist.unshift({t:Date.now(),label,ok,tot});S.hist=S.hist.slice(0,30);save();}
// 계산
function calcDrill(){
  D={n:0,ok:0,tot:10};
  const nextQ=()=>{
    if(D.n>=D.tot){drillScore('계산 훈련',D.ok,D.tot);$app.innerHTML=drillHead('🧮 계산 문제','')+`<div class="card result"><div class="sc">${D.ok}/${D.tot}</div><p>숫자가 매번 바뀌니 여러 번 풀어보세요!</p></div><div class="row"><button class="big" id="again">한 번 더</button><a class="big ghost" style="text-align:center" href="#home">처음으로</a></div>`;document.getElementById('again').onclick=calcDrill;return;}
    const g=window.CALC[Math.floor(Math.random()*window.CALC.length)](); D.cur=g;
    $app.innerHTML=drillHead('🧮 계산 문제',`${D.n+1}/${D.tot} · 맞힌 수 ${D.ok}`)+`<div class="qcard"><div class="tags" style="margin-bottom:8px"><span class="tag">${g.tag}</span></div><div class="stem">${esc(g.q)}</div><div class="choices">${g.opts.map((o,k)=>`<button class="ch" data-k="${k}">${'①②③④'[k]||''} ${esc(o)}</button>`).join('')}</div><div id="fb"></div><div class="qbtns" id="nx"></div></div>`;
    $app.querySelectorAll('.ch').forEach(b=>b.onclick=()=>{
      const o=g.opts[+b.dataset.k], ok=o===g.a; if(ok)D.ok++;
      $app.querySelectorAll('.ch').forEach(x=>{x.disabled=true;if(g.opts[+x.dataset.k]===g.a)x.classList.add('ok');}); if(!ok)b.classList.add('no');
      document.getElementById('fb').innerHTML=`<div class="fb ${ok?'ok':'no'}"><b class="h">${ok?'정답! 👏':'오답'}</b>정답: <b>${esc(g.a)}</b><br><span>📐 풀이: ${g.exp}</span></div>`;
      document.getElementById('nx').innerHTML=`<button class="big" id="nb">다음 →</button>`; document.getElementById('nb').onclick=()=>{D.n++;nextQ();window.scrollTo(0,0);};
    });
  };
  nextQ();
}
// 순서
function orderDrill(){
  const sets=shuf(window.ORDERS).slice(0,6); D={i:0,ok:0,sets};
  const nextQ=()=>{
    if(D.i>=sets.length){drillScore('순서 맞추기',D.ok,sets.length);$app.innerHTML=drillHead('🔢 순서 맞추기','')+`<div class="card result"><div class="sc">${D.ok}/${sets.length}</div><p>완벽하게 맞힌 세트 수</p></div><div class="row"><button class="big" id="again">다른 세트</button><a class="big ghost" style="text-align:center" href="#home">처음으로</a></div>`;document.getElementById('again').onclick=orderDrill;return;}
    const s=sets[D.i]; const pool=shuf(s.items); const picked=[];
    const draw=()=>{
      $app.innerHTML=drillHead('🔢 순서 맞추기',`${D.i+1}/${sets.length} · ${s.w}주차 · 순서대로 눌러주세요`)+`<div class="qcard"><div class="stem">${esc(s.title)}</div>
      <ol class="ord-picked">${s.items.map((_,k)=>`<li class="${picked[k]!=null?'f':''}">${picked[k]!=null?esc(picked[k]):'&nbsp;'}</li>`).join('')}</ol>
      <div class="ord-pool">${pool.map((t,k)=>`<button class="chip ${picked.includes(t)?'used':''}" data-k="${k}" ${picked.includes(t)?'disabled':''}>${esc(t)}</button>`).join('')}</div>
      <div id="fb"></div><div class="qbtns" id="nx">${picked.length?'<button class="skip" id="undo">↩ 하나 취소</button>':''}</div></div>`;
      $app.querySelectorAll('.ord-pool .chip').forEach(b=>b.onclick=()=>{picked.push(pool[+b.dataset.k]); if(picked.length===s.items.length) check(); else draw();});
      const u=document.getElementById('undo'); if(u) u.onclick=()=>{picked.pop();draw();};
    };
    const check=()=>{
      draw(); const ok=picked.every((t,k)=>t===s.items[k]); if(ok)D.ok++;
      $app.querySelectorAll('.ord-picked li').forEach((li,k)=>li.classList.add(picked[k]===s.items[k]?'okk':'nok'));
      $app.querySelectorAll('.ord-pool .chip').forEach(b=>b.disabled=true);
      document.getElementById('fb').innerHTML=`<div class="fb ${ok?'ok':'no'}"><b class="h">${ok?'완벽해요! 👏':'아쉬워요'}</b>정답 순서<ol style="margin:4px 0 0;padding-left:20px">${s.items.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>`;
      document.getElementById('nx').innerHTML=`<button class="big" id="nb">다음 →</button>`; document.getElementById('nb').onclick=()=>{D.i++;nextQ();window.scrollTo(0,0);};
    };
    draw();
  };
  nextQ();
}
// 나열
function listDrill(){
  const qs=shuf(window.LISTS).slice(0,8); D={i:0,ok:0};
  const nextQ=()=>{
    if(D.i>=qs.length){drillScore('나열하기',D.ok,qs.length);$app.innerHTML=drillHead('📋 나열하기','')+`<div class="card result"><div class="sc">${D.ok}/${qs.length}</div><p>빠짐없이 다 고른 문제 수</p></div><div class="row"><button class="big" id="again">다른 문제</button><a class="big ghost" style="text-align:center" href="#home">처음으로</a></div>`;document.getElementById('again').onclick=listDrill;return;}
    const q=qs[D.i], opts=shuf([...q.ans,...q.wrong]), sel=new Set();
    $app.innerHTML=drillHead('📋 나열하기',`${D.i+1}/${qs.length} · ${q.w}주차 · 정답 ${q.ans.length}개`)+`<div class="qcard"><div class="stem">${esc(q.q)}</div><div class="ord-pool">${opts.map((t,k)=>`<button class="chip" data-k="${k}">${esc(t)}</button>`).join('')}</div><div id="fb"></div><div class="qbtns" id="nx"><button class="big" id="sub">채점하기</button></div></div>`;
    $app.querySelectorAll('.ord-pool .chip').forEach(b=>b.onclick=()=>{const k=+b.dataset.k;sel.has(k)?sel.delete(k):sel.add(k);b.classList.toggle('on');});
    document.getElementById('sub').onclick=()=>{
      let ok=true; $app.querySelectorAll('.ord-pool .chip').forEach(b=>{const t=opts[+b.dataset.k],isA=q.ans.includes(t),s=sel.has(+b.dataset.k);b.disabled=true;b.classList.remove('on');if(isA)b.classList.add(s?'cok':'cmiss');else if(s)b.classList.add('cno');if(isA!==s)ok=false;});
      if(ok)D.ok++;
      document.getElementById('fb').innerHTML=`<div class="fb ${ok?'ok':'no'}"><b class="h">${ok?'모두 정답! 👏':'아쉬워요'}</b>정답: <b>${q.ans.map(esc).join(' · ')}</b><br><small>초록 = 맞게 고름 · 점선 = 놓친 정답 · 빨강 = 잘못 고름</small></div>`;
      document.getElementById('nx').innerHTML=`<button class="big" id="nb">다음 →</button>`; document.getElementById('nb').onclick=()=>{D.i++;nextQ();window.scrollTo(0,0);};
    };
  };
  nextQ();
}
// 서술형
function essayDrill(){
  const all=window.ESSAYS; const done=S.essayDone||(S.essayDone=[]);
  $app.innerHTML=drillHead('✍️ 서술형 연습','직접 써 본 뒤 모범답안과 비교하세요. 핵심 키워드가 들어갔는지 자동으로 표시해요.')+
   all.map((e,i)=>`<button class="opt" data-e="${i}"><span class="ic">${done.includes(i)?'✅':'✍️'}</span><span><b>${esc(e.q)}</b><small>${e.w}주차</small></span></button>`).join('');
  $app.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>essayOne(+b.dataset.e));
}
function essayOne(i){
  const e=window.ESSAYS[i];
  $app.innerHTML=`<div class="qtop"><button class="x" id="bk">← 목록</button><span class="qn">${e.w}주차 서술형</span></div><div class="qcard"><div class="stem">${esc(e.q)}</div>
  <textarea class="ans-in essay" id="ta" placeholder="정의 → 첫째·둘째 → 예시 순서로 써 보세요"></textarea><div class="kw">채점 키워드: ${e.k.map(k=>`<span class="tag">${esc(k)}</span>`).join(' ')}</div>
  <div id="fb"></div><div class="qbtns"><button class="skip" id="peek">답 먼저 보기</button><button class="big" id="sub">채점하기</button></div></div>`;
  document.getElementById('bk').onclick=essayDrill;
  const show=(txt)=>{
    const n=s=>s.toLowerCase().replace(/[\s\-–·,]/g,'');
    const hit=e.k.filter(k=>n(txt).includes(n(k)));
    document.querySelector('.kw').innerHTML='채점 키워드: '+e.k.map(k=>`<span class="tag ${hit.includes(k)?'':'imp'}">${hit.includes(k)?'✓':'✗'} ${esc(k)}</span>`).join(' ');
    document.getElementById('fb').innerHTML=`${txt?`<div class="fb ${hit.length>=Math.ceil(e.k.length*0.7)?'ok':'no'}"><b class="h">키워드 ${hit.length}/${e.k.length}개 포함</b>${hit.length>=Math.ceil(e.k.length*0.7)?'핵심을 잘 썼어요!':'빠진 키워드(✗)를 넣어서 다시 써 보세요.'}</div>`:''}<div class="fb ok" style="background:var(--bluel)"><b class="h" style="color:var(--blue)">📝 모범답안</b>${esc(e.a)}</div>`;
    const d=S.essayDone||(S.essayDone=[]); if(!d.includes(i)){d.push(i);save();}
    document.querySelector('.qbtns').innerHTML=`<button class="skip" id="bl">목록</button><button class="big" id="nx">${i+1<window.ESSAYS.length?'다음 문제 →':'처음으로'}</button>`;
    document.getElementById('bl').onclick=essayDrill;
    document.getElementById('nx').onclick=()=>{i+1<window.ESSAYS.length?essayOne(i+1):essayDrill();window.scrollTo(0,0);};
  };
  document.getElementById('sub').onclick=()=>show(document.getElementById('ta').value);
  document.getElementById('peek').onclick=()=>show('');
}

// ---------- router ----------
function route(){
  const h=(location.hash||'#home').slice(1);
  document.querySelectorAll('.tabbar a').forEach(a=>a.classList.toggle('on',a.dataset.tab===h||(h==='quiz'&&a.dataset.tab==='home')));
  if(h==='quiz'){ if(Q) renderQ(); else {location.hash='home';} return; }
  document.querySelectorAll('.tabbar a').forEach(a=>{if(a.dataset.tab==='toon'&&h.startsWith('toon'))a.classList.add('on');if(a.dataset.tab==='home'&&h.startsWith('drill'))a.classList.add('on');});
  Q=null;
  if(h.startsWith('toon/')){ toonView(+h.split('/')[1]); window.scrollTo(0,0); return; }
  if(h.startsWith('drill/')){ drill(h.split('/')[1]); window.scrollTo(0,0); return; }
  ({home,dex,check,pairs,stats,toon:toonList}[h]||home)();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
if(window.annotateKo){ new MutationObserver(()=>{ if(window.__ann) return; window.__ann=1; try{window.annotateKo($app);}finally{window.__ann=0;} }).observe($app,{childList:true,subtree:true}); }
route();
})();
