(function(){
"use strict";

/* ===== CONSTANTS ===== */
var SK='creative-task-mgr-v3';
var SL=['not_started','in_progress','completed'];
var SLA={not_started:'未着手',in_progress:'進行中',completed:'完了'};
var ROLES=['director','writer','designer','editor','proofreader','desk','camera','sales','other'];
var RLAB={director:'ディレクター',writer:'ライター',designer:'デザイナー',editor:'編集',proofreader:'校閲者',desk:'デスク',camera:'カメラマン',sales:'営業',other:'その他'};
var COLORS=['#FF3B30','#007AFF','#34C759','#FF9500','#AF52DE','#00C7BE','#FFD60A','#FF2D55','#5856D6','#64D2FF'];
var ROLE_COLORS={director:'#dc2626',writer:'#2563eb',designer:'#9333ea',editor:'#16a34a',proofreader:'#7c3aed',desk:'#0d9488',camera:'#d97706',sales:'#0891b2',other:'#64748b'};
var FMT_PRESETS={
  shanaiho:{name:'社内報・紙媒体（25工程）',steps:[
    {n:'テーマ確定',h:2},
    {n:'企画案作成',h:16},
    {n:'企画案 社内チェック（デスク）',h:4},
    {n:'企画案ご提出（クライアント）',h:2},
    {n:'企画案お戻し確認',h:4},
    {n:'展開案・構成案作成',h:16},
    {n:'展開案ご提出（クライアント）',h:2},
    {n:'展開案お戻し確認・修正',h:8},
    {n:'取材準備（事前シート・アポ取り）',h:8},
    {n:'取材・撮影実施',h:16},
    {n:'執筆・デザイン制作',h:40},
    {n:'デスクチェック',h:4},
    {n:'初校提出（社内校閲）',h:2},
    {n:'校閲実施（初校）',h:8},
    {n:'初校ご提出（クライアント）',h:2},
    {n:'初校お戻し確認・修正',h:8},
    {n:'再校提出（社内チェック）',h:2},
    {n:'再校ご提出（クライアント）',h:2},
    {n:'再校お戻し確認・修正',h:8},
    {n:'校閲実施（再校）',h:4},
    {n:'三校提出・最終確認',h:4},
    {n:'色校データ製版入稿',h:4},
    {n:'色校確認・赤字戻し',h:4},
    {n:'校了・最終データ入稿',h:2},
    {n:'印刷・納品・発送',h:4}]},
  web:{name:'Web制作（15工程）',steps:[
    {n:'要件定義・ヒアリング',h:8},
    {n:'ワイヤーフレーム作成',h:16},
    {n:'WF社内チェック（デスク）',h:4},
    {n:'WFご提出（クライアント）',h:2},
    {n:'WFお戻し確認・修正',h:8},
    {n:'デザインカンプ作成',h:24},
    {n:'デザイン社内チェック（デスク）',h:4},
    {n:'デザインご提出（クライアント）',h:2},
    {n:'デザインお戻し確認・修正',h:8},
    {n:'コーディング',h:40},
    {n:'テスト・検証',h:8},
    {n:'テスト環境ご確認（クライアント）',h:8},
    {n:'修正対応',h:8},
    {n:'最終確認・上長承認',h:4},
    {n:'公開・リリース',h:4}]},
  video:{name:'映像制作（19工程）',steps:[
    {n:'企画・構成案作成',h:16},
    {n:'構成案 社内チェック（デスク）',h:4},
    {n:'構成案ご提出（クライアント）',h:2},
    {n:'構成案お戻し確認・修正',h:4},
    {n:'シナリオ・絵コンテ作成',h:16},
    {n:'シナリオ社内チェック（デスク）',h:4},
    {n:'シナリオご提出（クライアント）',h:2},
    {n:'シナリオお戻し確認・修正',h:4},
    {n:'撮影準備・ロケハン',h:8},
    {n:'撮影実施',h:16},
    {n:'編集（仮編集）',h:24},
    {n:'仮編 社内チェック',h:4},
    {n:'仮編ご提出（クライアント）',h:2},
    {n:'仮編お戻し確認・修正',h:8},
    {n:'MA・テロップ・仕上げ',h:16},
    {n:'完パケ社内チェック',h:4},
    {n:'完パケご提出（クライアント）',h:2},
    {n:'最終修正',h:4},
    {n:'納品',h:2}]},
  sns:{name:'SNS運用（11工程）',steps:[
    {n:'企画・テーマ設定',h:4},
    {n:'企画社内チェック（デスク）',h:2},
    {n:'素材収集・撮影',h:8},
    {n:'原稿・クリエイティブ作成',h:8},
    {n:'デスクチェック',h:2},
    {n:'社内承認（上長）',h:2},
    {n:'クライアント承認',h:4},
    {n:'修正対応',h:4},
    {n:'投稿・配信',h:2},
    {n:'効果測定・レポート作成',h:8},
    {n:'レポートご提出',h:2}]}
};
var FMT14=FMT_PRESETS.shanaiho.steps;
var customFmts=[];

/* ===== UTIL ===== */
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function escH(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML}
function todayS(){var d=new Date(),m=d.getMonth()+1,dd=d.getDate();return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(dd<10?'0'+dd:dd)}
function parseD(s){if(!s)return null;var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function fmtD(d){if(!d)return'';var m=d.getMonth()+1,dd=d.getDate();return(m<10?'0'+m:m)+'/'+(dd<10?'0'+dd:dd)}
function fmtISO(d){if(!d)return'';var y=d.getFullYear(),m=d.getMonth()+1,dd=d.getDate();return y+'-'+(m<10?'0'+m:m)+'-'+(dd<10?'0'+dd:dd)}
function addD(d,n){var r=new Date(d);r.setDate(r.getDate()+n);return r}
function diffD(a,b){return Math.round((b-a)/864e5)}
function doff(base,n){return fmtISO(addD(parseD(base),n))}
function p2(n){return n<10?'0'+n:''+n}

/* ===== 日本の祝日判定 ===== */
var JP_HOLIDAYS={};
function buildJPHolidays(year){
  var h={};
  function add(m,d){h[year+'-'+p2(m)+'-'+p2(d)]=true}
  add(1,1);add(1,2);add(1,3);
  var jan2mon=new Date(year,0,1);while(jan2mon.getDay()!==1)jan2mon.setDate(jan2mon.getDate()+1);jan2mon.setDate(jan2mon.getDate()+7);add(1,jan2mon.getDate());
  add(2,11);
  add(2,23);
  var shunbun=Math.floor(20.8431+0.242194*(year-1980)-Math.floor((year-1980)/4));add(3,shunbun);
  add(4,29);
  add(5,3);add(5,4);add(5,5);
  var jul3mon=new Date(year,6,1);while(jul3mon.getDay()!==1)jul3mon.setDate(jul3mon.getDate()+1);jul3mon.setDate(jul3mon.getDate()+14);add(7,jul3mon.getDate());
  add(8,11);
  var sep3mon=new Date(year,8,1);while(sep3mon.getDay()!==1)sep3mon.setDate(sep3mon.getDate()+1);sep3mon.setDate(sep3mon.getDate()+14);add(9,sep3mon.getDate());
  var shubun=Math.floor(23.2488+0.242194*(year-1980)-Math.floor((year-1980)/4));add(9,shubun);
  var oct2mon=new Date(year,9,1);while(oct2mon.getDay()!==1)oct2mon.setDate(oct2mon.getDate()+1);oct2mon.setDate(oct2mon.getDate()+7);add(10,oct2mon.getDate());
  add(11,3);add(11,23);
  return h;
}
function isHoliday(isoDate){
  var y=parseInt(isoDate.slice(0,4));
  if(!JP_HOLIDAYS[y])JP_HOLIDAYS[y]=buildJPHolidays(y);
  return !!JP_HOLIDAYS[y][isoDate];
}

/* ===== STATE ===== */
var S;

function saveLocal(){try{localStorage.setItem(SK,JSON.stringify(S))}catch(e){if(e.name==='QuotaExceededError'||e.code===22)toast('ストレージ容量が不足しています。バックアップを取得してから不要な案件を削除してください','err')}}

/* ===== Supabase 同期ステータス ===== */
var _dbSyncTimer = null;
var _dbAvailable = false;  // initSupabase成功後にtrue
var _dbSyncing = false;

function save(){
  saveLocal();
  updateSaveTs();
  // Supabaseへの非同期保存（デバウンス: 連続saveをまとめる）
  if(_dbAvailable && typeof dbSaveFullState === 'function'){
    if(_dbSyncTimer) clearTimeout(_dbSyncTimer);
    _dbSyncTimer = setTimeout(function(){
      if(_dbSyncing) return;
      _dbSyncing = true;
      dbSaveFullState(S).then(function(){
        _dbSyncing = false;
        var el = document.getElementById('lastSave');
        if(el){
          var n = new Date();
          el.textContent = '☁ 同期済: '+n.getFullYear()+'-'+p2(n.getMonth()+1)+'-'+p2(n.getDate())+' '+p2(n.getHours())+':'+p2(n.getMinutes());
        }
      }).catch(function(err){
        _dbSyncing = false;
        console.error('[DB] save failed:', err);
        var el = document.getElementById('lastSave');
        if(el) el.textContent = '⚠ DB同期失敗（ローカル保存済）';
      });
    }, 1500);  // 1.5秒デバウンス
  }
}

function loadLocal(){
  try{var d=localStorage.getItem(SK);if(d){S=JSON.parse(d);migrate();return true}}catch(e){}
  return false;
}

function load(){
  return loadLocal();
}

/* ===== Supabase 読み込み（非同期・ローカルが空のとき用） ===== */
async function loadFromDB(){
  if(!_dbAvailable) return false;
  try{
    var members = await dbGetMembers();
    var projects = await dbGetProjects();
    var timeSchedule = await dbGetTimeSchedule();

    // データが一切なければ失敗扱い（初回セットアップ想定）
    if((!members || members.length===0) && (!projects || projects.length===0)){
      return false;
    }

    S = {
      projects: projects || [],
      members: members || [],
      activeProjectId: '',
      activeGouId: '',
      activeKikakuId: '',
      currentScreen: 'dashboard',
      activeView: 'table',
      timeSchedule: timeSchedule || {}
    };
    migrate();
    saveLocal();  // ローカルにもキャッシュ
    return true;
  }catch(e){
    console.error('[DB] load failed:', e);
    return false;
  }
}

function updateSaveTs(){var el=document.getElementById('lastSave');if(!el)return;var n=new Date();el.textContent='最終保存: '+n.getFullYear()+'-'+p2(n.getMonth()+1)+'-'+p2(n.getDate())+' '+p2(n.getHours())+':'+p2(n.getMinutes())}

/* ===== MIGRATION (3-tier → 4-tier) ===== */
function migrate(){
  if(!S.projects)return;
  var changed=false;
  S.projects.forEach(function(p){
    if(p.kikakus&&!p.gous){
      p.gous=[{id:uid(),name:'デフォルト号',kikakus:p.kikakus}];
      delete p.kikakus;
      changed=true;
    }
    if(!p.gous)p.gous=[];
    if(!p.members)p.members=[];
  });
  if(!S.activeGouId)S.activeGouId=null;
  if(!S.timeSchedule)S.timeSchedule={};
  if(changed)save();
}

/* ===== FACTORY ===== */
function mkProj(o){o=o||{};return{id:o.id||uid(),name:o.name||'',client:o.client||'',mediaType:o.mediaType||'shanaiho',members:o.members||[],gous:o.gous||[],createdAt:o.createdAt||new Date().toISOString()}}
function mkGou(o){o=o||{};return{id:o.id||uid(),name:o.name||'',kikakus:o.kikakus||[]}}
function mkKikaku(o){o=o||{};return{id:o.id||uid(),name:o.name||'',tasks:o.tasks||[]}}
function mkTask(o){o=o||{};return{id:o.id||uid(),name:o.name||'',planStart:o.planStart||todayS(),planEnd:o.planEnd||todayS(),actualStart:o.actualStart||'',actualEnd:o.actualEnd||'',status:o.status||'not_started',assignee:o.assignee||'',estimatedHours:o.estimatedHours||0,note:o.note||'',assigneeHistory:o.assigneeHistory||[]}}
function mkMember(o){o=o||{};return{id:o.id||uid(),name:o.name||'',role:o.role||'other',color:o.color||COLORS[0]}}

/* ===== GETTERS ===== */
function getProj(){return S.projects.find(function(p){return p.id===S.activeProjectId})||null}
function getGou(){
  var p=getProj();if(!p||!p.gous.length)return null;
  return p.gous.find(function(g){return g.id===S.activeGouId})||p.gous[0];
}
function getKikaku(){
  var g=getGou();if(!g||!g.kikakus.length)return null;
  return g.kikakus.find(function(k){return k.id===S.activeKikakuId})||g.kikakus[0];
}
function getMember(name){return S.members.find(function(m){return m.name===name})||null}
function getRoleColor(mem){if(!mem)return'#8b8fa8';return ROLE_COLORS[mem.role]||'#8b8fa8'}
function getMemberById(id){return S.members.find(function(m){return m.id===id})||null}
function getProjMembers(p){
  if(!p||!p.members||!p.members.length)return S.members;
  return p.members.map(function(mid){return getMemberById(mid)}).filter(Boolean);
}

/* ===== NAVIGATION ===== */
function nav(scr,opts){
  opts=opts||{};
  closeSidebar();
  if(opts.pid)S.activeProjectId=opts.pid;
  if(opts.gid)S.activeGouId=opts.gid;
  if(opts.kid)S.activeKikakuId=opts.kid;
  if(scr!=='members'){memberDetailId=null;memberDetailWeekOffset=0}
  if(scr==='project'){var p=getProj();if(p&&p.gous.length){S.activeGouId=p.gous[0].id}else{S.activeGouId=null}S.activeKikakuId=null}
  if(scr==='gou'){var g=getGou();if(g&&g.kikakus.length)S.activeKikakuId=g.kikakus[0].id;else S.activeKikakuId=null}
  S.currentScreen=scr;save();renderAll();
  saveLocal();
  var histState={scr:scr,pid:S.activeProjectId,gid:S.activeGouId,kid:S.activeKikakuId};
  if(!opts._popstate)history.pushState(histState,'',null);
}
window.nav=nav;

function switchView(v){
  S.activeView=v;save();
  document.querySelectorAll('.tab-btn[data-v]').forEach(function(b){b.classList.toggle('active',b.dataset.v===v)});
  renderView();
}
window.switchView=switchView;

/* ===== TOAST ===== */
function toast(msg,type){
  var c=document.getElementById('toastC');if(!c)return;
  var t=document.createElement('div');t.className='toast toast-'+(type||'info');t.textContent=msg;c.appendChild(t);
  requestAnimationFrame(function(){t.classList.add('show')});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},300)},2500);
}

/* ===== CLIPBOARD ===== */
function copyToClip(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){toast('コピーしました','ok')}).catch(function(){fallbackCopy(text)});
  } else {fallbackCopy(text)}
}
function fallbackCopy(text){
  var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');toast('コピーしました','ok')}catch(e){toast('コピーに失敗しました','err')}
  document.body.removeChild(ta);
}

/* ===== MODAL ===== */
function showModal(html){var b=document.getElementById('modalBg'),m=document.getElementById('modalBox');if(b&&m){m.innerHTML=html;b.classList.remove('hidden')}}
function closeModal(){var b=document.getElementById('modalBg');if(b)b.classList.add('hidden')}
window.closeModal=closeModal;

/* ===== RENDER ALL ===== */
function renderAll(){
  var scr=S.currentScreen;
  var isK=scr==='kikaku';
  var tb=document.getElementById('toolbar'),sb=document.getElementById('sumbar'),kt=document.getElementById('ktabs');
  if(tb)tb.classList.toggle('hidden',!isK);
  if(sb)sb.classList.toggle('hidden',!isK);
  if(kt)kt.classList.toggle('hidden',!isK);

  ['dashArea','projArea','gouArea','kikakuArea','membersArea','fmtArea','ichiranArea','daiwariArea'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.classList.add('hidden');
  });

  var map={dashboard:'dashArea',project:'projArea',gou:'gouArea',kikaku:'kikakuArea',members:'membersArea',fmt:'fmtArea',ichiran:'ichiranArea',daiwari:'daiwariArea'};
  var target=map[scr];
  if(target){var el=document.getElementById(target);if(el)el.classList.remove('hidden')}

  ['navDash','navMembers','navFmt','navIchiran','navDaiwari'].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.remove('active')});
  if(scr==='dashboard'){var nd=document.getElementById('navDash');if(nd)nd.classList.add('active')}
  if(scr==='members'){var nm=document.getElementById('navMembers');if(nm)nm.classList.add('active')}
  if(scr==='fmt'){var nf=document.getElementById('navFmt');if(nf)nf.classList.add('active')}
  if(scr==='ichiran'){var ni=document.getElementById('navIchiran');if(ni)ni.classList.add('active')}
  if(scr==='daiwari'){var nw=document.getElementById('navDaiwari');if(nw)nw.classList.add('active')}

  renderSidebar();renderBC();

  if(scr==='dashboard')renderDashboard();
  else if(scr==='project')renderProjectView();
  else if(scr==='gou')renderGouView();
  else if(scr==='kikaku'){
    document.querySelectorAll('.tab-btn[data-v]').forEach(function(b){b.classList.toggle('active',b.dataset.v===S.activeView)});
    renderSummary();renderKTabs();renderView();populateFilterAssignee();
  }
  else if(scr==='members')renderMembers();
  else if(scr==='fmt')renderFmtSettings();
  else if(scr==='ichiran')renderIchiran();
  else if(scr==='daiwari')renderDaiwari();
}

/* ===== BREADCRUMB ===== */
function renderBC(){
  var el=document.getElementById('bc');if(!el)return;
  var scr=S.currentScreen;
  if(scr==='dashboard'){el.innerHTML='';return}
  if(scr==='members'){el.innerHTML='<a onclick="nav(\'dashboard\')">ダッシュボード</a><span class="sep">›</span>チームメンバー';return}
  if(scr==='ichiran'){el.innerHTML='<a onclick="nav(\'dashboard\')">ダッシュボード</a><span class="sep">›</span>案件一覧';return}
  if(scr==='daiwari'){el.innerHTML='<a onclick="nav(\'dashboard\')">ダッシュボード</a><span class="sep">›</span>台割';return}
  if(scr==='fmt'){el.innerHTML='<a onclick="nav(\'dashboard\')">ダッシュボード</a><span class="sep">›</span>FMT設定';return}
  var p=getProj();
  if(scr==='project'){el.innerHTML='<a onclick="nav(\'dashboard\')">ダッシュボード</a><span class="sep">›</span>'+escH(p?p.name:'');return}
  var g=getGou();
  if(scr==='gou'){
    el.innerHTML='<a onclick="nav(\'dashboard\')">ダッシュボード</a><span class="sep">›</span><a onclick="nav(\'project\',{pid:\''+((p&&p.id)||'')+'\'})">'+escH(p?p.name:'')+'</a><span class="sep">›</span>'+escH(g?g.name:'');return;
  }
  if(scr==='kikaku'){
    var k=getKikaku();
    el.innerHTML='<a onclick="nav(\'dashboard\')">ダッシュボード</a><span class="sep">›</span><a onclick="nav(\'project\',{pid:\''+((p&&p.id)||'')+'\'})">'+escH(p?p.name:'')+'</a><span class="sep">›</span><a onclick="nav(\'gou\',{pid:\''+((p&&p.id)||'')+'\',gid:\''+((g&&g.id)||'')+'\'})">'+escH(g?g.name:'')+'</a><span class="sep">›</span>'+escH(k?k.name:'');
    return;
  }
}

/* ===== SIDEBAR ===== */
function renderSidebar(){
  var el=document.getElementById('projList');if(!el)return;
  var h='';
  S.projects.forEach(function(p){
    var act=p.id===S.activeProjectId&&(S.currentScreen==='project'||S.currentScreen==='gou'||S.currentScreen==='kikaku');
    var clientLabel=p.client?p.client:p.name;
    h+='<div class="sitem-group'+(act?' active':'')+'">';
    h+='<div class="sitem" onclick="navProject(\''+p.id+'\')">';
    h+='<span class="sitem-client">'+escH(clientLabel)+'</span>';
    h+='<span class="sitem-acts"><button onclick="event.stopPropagation();renProjUI(\''+p.id+'\')" title="名前変更">✎</button>';
    h+='<button class="del" onclick="event.stopPropagation();delProjUI(\''+p.id+'\')" title="削除">✕</button></span></div>';
    if(p.client&&p.name!==p.client){
      h+='<div class="sitem-sub-label">'+escH(p.name)+'</div>';
    }
    if(act&&p.gous.length){
      h+='<div class="sitem-gous">';
      p.gous.forEach(function(g){
        var gAct=g.id===S.activeGouId;
        var tt=0,dn=0;
        g.kikakus.forEach(function(k){k.tasks.forEach(function(t){tt++;if(t.status==='completed')dn++})});
        var prog=tt?Math.round(dn/tt*100):0;
        h+='<div class="sitem-gou'+(gAct?' active':'')+'" onclick="event.stopPropagation();nav(\'gou\',{pid:\''+p.id+'\',gid:\''+g.id+'\'})">';
        h+='<span>📦 '+escH(g.name)+'</span>';
        h+='<span class="sitem-gou-prog">'+prog+'%</span>';
        h+='</div>';
      });
      h+='</div>';
    }
    h+='</div>';
  });
  el.innerHTML=h;
}
function navProject(pid){
  var p=S.projects.find(function(pp){return pp.id===pid});
  if(p&&p.gous.length===1){
    nav('gou',{pid:pid,gid:p.gous[0].id});
  } else {
    nav('project',{pid:pid});
  }
}
window.navProject=navProject;

/* ===== DASHBOARD ===== */
var dashTab='overview';
function switchDashTab(t){dashTab=t;renderDashboard()}
window.switchDashTab=switchDashTab;

function renderDashboard(){
  var el=document.getElementById('dashArea');if(!el)return;
  var tdy=new Date();var tMonth=tdy.getMonth()+1;var tDate=tdy.getDate();var tDow=DAYS_JP[tdy.getDay()];
  var todayLabel=tdy.getFullYear()+'年'+tMonth+'月'+tDate+'日('+tDow+')';
  var h='<div class="dash"><div style="display:flex;align-items:center;gap:.8rem;margin-bottom:1rem"><div class="dash-title" style="margin-bottom:0">ダッシュボード</div><div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;padding:.3rem .8rem;border-radius:var(--radius-sm);font-size:.8rem;font-weight:700;white-space:nowrap">📅 '+todayLabel+'</div><div style="flex:1"></div>';
  h+='<button class="tbtn" onclick="showExcelImportModal()">📥 Excel取込</button>';
  h+='<button class="tbtn" onclick="exportExcel()">📤 Excel出力</button></div>';
  h+='<div class="dash-tabs">';
  h+='<div class="dash-tab'+(dashTab==='overview'?' active':'')+'" onclick="switchDashTab(\'overview\')">📊 概要</div>';
  h+='<div class="dash-tab'+(dashTab==='capacity'?' active':'')+'" onclick="switchDashTab(\'capacity\')">👤 メンバー稼働</div>';
  h+='<div class="dash-tab'+(dashTab==='remind'?' active':'')+'" onclick="switchDashTab(\'remind\')">🔔 リマインド</div>';
  h+='</div>';
  if(dashTab==='overview'){h+=renderDashOverview()}
  else if(dashTab==='capacity'){h+=renderCapacityView()}
  else if(dashTab==='remind'){h+=renderRemindersHTML()}
  h+='</div>';
  el.innerHTML=h;
}

function renderDashOverview(){
  var h='';
  if(!S.members.length){
    h+='<div class="info-card" style="border-color:var(--accent);margin-bottom:1rem"><h3>👤 まずチームメンバーを登録しましょう</h3>';
    h+='<p style="font-size:.78rem;color:var(--text-muted);margin-bottom:.5rem">メンバーを登録すると、担当者のアサインや色分けができます。</p>';
    h+='<button class="btn-p" onclick="nav(\'members\')" style="font-size:.78rem;padding:.3rem .8rem">メンバーを登録する</button></div>';
  }
  h+='<div class="dash-grid">';
  S.projects.forEach(function(p){
    var tt=0,dn=0,ns=0;
    p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){tt++;if(t.status==='completed')dn++;if(t.status==='not_started')ns++})})});
    var prog=tt?Math.round(dn/tt*100):0;
    var barClass=prog<30?'danger':prog<70?'warning':'success';
    var ip=tt-dn-ns;
    h+='<div class="pcard" onclick="nav(\'project\',{pid:\''+p.id+'\'})">';
    h+='<div class="pcard-name">'+escH(p.name)+'</div>';
    if(p.client)h+='<div class="pcard-sub">'+escH(p.client)+'</div>';
    h+='<div class="pcard-stats"><span>📁 '+p.gous.length+' 号</span><span>全 '+tt+' 工程</span><span style="color:var(--success)">完了 '+dn+'</span><span style="color:var(--accent-light)">進行中 '+ip+'</span></div>';
    h+='<div class="pbar"><div class="pbar-fill '+barClass+'" style="width:'+prog+'%;background:var(--'+barClass+')"></div></div>';
    h+='<div class="pcard-foot"><span>進捗 '+prog+'%</span></div></div>';
  });
  h+='<div class="pcard-add" onclick="showNewProjectModal()">＋ 新規プロジェクト</div>';
  h+='</div>';
  if(S.projects.length){
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-top:1rem">';
    h+='<div class="info-card"><h3>📋 次のアクション</h3>';
    var nextTasks=[];
    S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
      if(t.status!=='completed')nextTasks.push({t:t,pn:p.name,kn:k.name});
    })})})});
    nextTasks.sort(function(a,b){return(a.t.planEnd||'z').localeCompare(b.t.planEnd||'z')});
    var shown=nextTasks.slice(0,5);
    if(!shown.length)h+='<div style="font-size:.78rem;color:var(--text-dim)">全タスク完了！</div>';
    shown.forEach(function(item){
      var mem=getMember(item.t.assignee);var rc=getRoleColor(mem);
      h+='<div class="info-item">';
      if(mem)h+='<span class="assignee-dot" style="background:'+rc+'"></span>';
      h+='<span style="flex:1;font-size:.75rem">'+escH(item.t.name)+'</span>';
      h+='<span style="font-size:.65rem;color:var(--text-dim)">~'+escH(item.t.planEnd||'')+'</span></div>';
    });
    h+='</div>';
    h+='<div class="info-card"><h3>🕐 最近の更新</h3>';
    var recent=[];
    S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
      if(t.actualEnd||t.actualStart)recent.push({t:t,kn:k.name});
    })})})});
    recent.sort(function(a,b){return(b.t.actualEnd||b.t.actualStart||'').localeCompare(a.t.actualEnd||a.t.actualStart||'')});
    var recentShown=recent.slice(0,5);
    if(!recentShown.length)h+='<div style="font-size:.78rem;color:var(--text-dim)">まだ更新はありません</div>';
    recentShown.forEach(function(item){
      h+='<div class="info-item"><span class="sbadge '+item.t.status+'" style="font-size:.6rem">'+SLA[item.t.status]+'</span>';
      h+='<span style="flex:1;font-size:.75rem">'+escH(item.t.name)+'</span>';
      h+='<span style="font-size:.65rem;color:var(--text-dim)">'+escH(item.t.actualEnd||item.t.actualStart||'')+'</span></div>';
    });
    h+='</div></div>';
    h+=renderWorkloadAlertMembers();
    h+=renderAlertsHTML();
    h+=renderDeadlinesHTML();
  }
  return h;
}

/* ===== CAPACITY VIEW ===== */
function renderCapacityView(){
  if(!S.members.length)return '<div class="info-card"><p style="font-size:.78rem;color:var(--text-muted)">メンバーが登録されていません。</p></div>';
  var memberTasks={};
  S.members.forEach(function(m){memberTasks[m.name]=[]});
  S.projects.forEach(function(p){
    p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
      if(!t.assignee||!memberTasks[t.assignee])return;
      memberTasks[t.assignee].push({task:t,proj:p.name,gou:g.name,kikaku:k.name});
    })})});
  });
  var h='';
  S.members.forEach(function(m){
    var tasks=memberTasks[m.name]||[];
    var rc=getRoleColor(m);
    var activeT=tasks.filter(function(x){return x.task.status!=='completed'});
    var doneT=tasks.filter(function(x){return x.task.status==='completed'});
    var totalH=0;activeT.forEach(function(x){totalH+=(x.task.estimatedHours||0)});
    var loadLevel=totalH>60?'danger':totalH>40?'warning':'success';
    var loadLabel=totalH>60?'過負荷':totalH>40?'注意':'適正';
    h+='<div class="info-card" style="margin-bottom:.6rem">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">';
    h+='<div style="display:flex;align-items:center;gap:.5rem">';
    h+='<span class="member-dot" style="background:'+rc+';width:14px;height:14px"></span>';
    h+='<span style="font-weight:700;color:'+rc+'">'+escH(m.name)+'</span>';
    h+='<span style="font-size:.65rem;color:var(--text-muted)">'+escH(RLAB[m.role]||m.role)+'</span>';
    h+='</div>';
    h+='<div style="display:flex;align-items:center;gap:.5rem">';
    h+='<span style="font-size:.7rem;font-weight:600">進行中 '+activeT.length+'件</span>';
    h+='<span style="font-size:.7rem;color:var(--text-dim)">完了 '+doneT.length+'件</span>';
    h+='<span style="font-size:.7rem;font-weight:700">'+Math.round(totalH)+'h</span>';
    h+='<span style="font-size:.6rem;padding:.1rem .4rem;border-radius:8px;font-weight:600;background:var(--'+loadLevel+'-dim);color:var(--'+loadLevel+')">'+loadLabel+'</span>';
    h+='</div></div>';
    if(activeT.length){
      var maxH=80;
      var barW=Math.min(100,Math.round(totalH/maxH*100));
      h+='<div style="height:6px;background:var(--surface3);border-radius:3px;margin-bottom:.5rem;overflow:hidden">';
      h+='<div style="height:100%;width:'+barW+'%;background:var(--'+loadLevel+');border-radius:3px;transition:width .3s"></div></div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:4px">';
      activeT.sort(function(a,b){return(a.task.planEnd||'z').localeCompare(b.task.planEnd||'z')});
      activeT.forEach(function(item){
        var t=item.task;
        var bg='var(--accent-dim)';var border='var(--accent)';var txtC='var(--accent-light)';
        var isOverdue=t.planEnd&&t.planEnd<todayS()&&t.status!=='completed';
        if(isOverdue){bg='var(--danger-dim)';border='var(--danger)';txtC='var(--danger)'}
        h+='<div style="padding:.2rem .5rem;border-radius:var(--radius-xs);background:'+bg+';border-left:3px solid '+border+';font-size:.72rem;line-height:1.3;max-width:220px" title="'+escH(item.proj+' / '+item.kikaku)+'">';
        h+='<div style="font-weight:600;color:'+txtC+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escH(t.name)+'</div>';
        h+='<div style="color:var(--text-dim);display:flex;gap:.4rem;align-items:center">';
        h+='<span class="sbadge '+t.status+'" style="font-size:.65rem;padding:.05rem .25rem">'+SLA[t.status]+'</span>';
        if(t.planEnd)h+='<span>~'+escH(t.planEnd)+'</span>';
        if(t.estimatedHours)h+='<span>'+t.estimatedHours+'h</span>';
        if(isOverdue)h+='<span style="color:var(--danger);font-weight:700">超過</span>';
        h+='</div></div>';
      });
      h+='</div>';
    } else {
      h+='<div style="font-size:.7rem;color:var(--text-dim)">現在タスクなし</div>';
    }
    h+='</div>';
  });
  return h;
}

/* ===== WORKLOAD ALERT MEMBERS ===== */
function renderWorkloadAlertMembers(){
  if(!S.members.length)return '';
  var memberLoad={};
  S.members.forEach(function(m){memberLoad[m.name]={hours:0,tasks:[],overdue:0}});
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    if(t.status==='completed'||!t.assignee||!memberLoad[t.assignee])return;
    if(t.status==='in_progress')memberLoad[t.assignee].hours+=(t.estimatedHours||0);
    memberLoad[t.assignee].tasks.push({name:t.name,proj:p.name,status:t.status,planEnd:t.planEnd});
    if(t.planEnd&&t.planEnd<todayS())memberLoad[t.assignee].overdue++;
  })})})});
  var alertMembers=[];
  Object.keys(memberLoad).forEach(function(name){
    var d=memberLoad[name];
    var level=d.hours>60?'過負荷':d.hours>40?'注意':null;
    if(level||d.overdue>0){
      var mem=getMember(name);
      alertMembers.push({name:name,mem:mem,hours:d.hours,tasks:d.tasks,overdue:d.overdue,level:level});
    }
  });
  if(!alertMembers.length)return '';
  alertMembers.sort(function(a,b){return b.hours-a.hours});
  var h='<div class="alert-panel" style="margin-top:1rem"><h3>👤 稼働アラートメンバー <span class="alert-badge red">'+alertMembers.length+'</span></h3>';
  alertMembers.forEach(function(am){
    var rc=am.mem?getRoleColor(am.mem):'var(--text-muted)';
    var bg=am.level==='過負荷'?'var(--danger-dim)':am.overdue?'var(--warning-dim)':'var(--surface2)';
    var labelColor=am.level==='過負荷'?'var(--danger)':am.overdue?'var(--warning)':'var(--text-muted)';
    h+='<div style="padding:.5rem .6rem;border-radius:var(--radius-sm);background:'+bg+';margin-bottom:.4rem;border-left:3px solid '+rc+'">';
    h+='<div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.3rem">';
    if(am.mem)h+='<span class="assignee-dot" style="background:'+rc+'"></span>';
    h+='<strong style="color:'+rc+';font-size:.8rem">'+escH(am.name)+'</strong>';
    if(am.level)h+='<span style="font-size:.6rem;padding:.1rem .4rem;border-radius:8px;font-weight:600;background:'+bg+';color:'+labelColor+'">'+am.level+' ('+Math.round(am.hours)+'h)</span>';
    if(am.overdue)h+='<span style="font-size:.6rem;padding:.1rem .4rem;border-radius:8px;font-weight:600;background:var(--danger-dim);color:var(--danger)">超過'+am.overdue+'件</span>';
    h+='</div>';
    var shown=am.tasks.slice(0,3);
    shown.forEach(function(tk){
      h+='<div style="font-size:.65rem;color:var(--text-muted);margin-left:1.2rem">・'+escH(tk.name)+' ('+escH(tk.proj)+')'+(tk.planEnd&&tk.planEnd<todayS()?' <span style="color:var(--danger)">超過</span>':'')+'</div>';
    });
    if(am.tasks.length>3)h+='<div style="font-size:.6rem;color:var(--text-dim);margin-left:1.2rem">...他'+(am.tasks.length-3)+'件</div>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

/* ===== REMINDERS ===== */
var remindProjFilter='';
function switchRemindProj(val){remindProjFilter=val;renderDashboard()}
window.switchRemindProj=switchRemindProj;

function renderRemindersHTML(){
  var today=todayS();var todayD=parseD(today);
  if(remindProjFilter){
    var projExists=S.projects.some(function(p){return p.id===remindProjFilter});
    if(!projExists)remindProjFilter='';
  }
  var groups={overdue:[],today:[],prevDay:[],in3d:[],in1w:[]};
  var projGroups=[];
  S.projects.forEach(function(p){
    if(remindProjFilter&&p.id!==remindProjFilter)return;
    var pg={proj:p,overdue:[],today:[],prevDay:[],in3d:[],in1w:[]};
    (p.gous||[]).forEach(function(g){(g.kikakus||[]).forEach(function(k){(k.tasks||[]).forEach(function(t){
      if(t.status==='completed')return;
      if(!t.planEnd)return;
      var endD=parseD(t.planEnd);
      if(!endD||isNaN(endD.getTime()))return;
      var diff=diffD(todayD,endD);
      var who=t.assignee||'担当者未定';
      var tname=t.name;
      var pname=p.name;
      var msg;
      if(diff<0){
        msg=who+'さん、「'+tname+'」（'+pname+'）が'+Math.abs(diff)+'日超過しています。至急対応をお願いします。';
        groups.overdue.push({diff:diff,msg:msg,assignee:t.assignee||''});
        pg.overdue.push({diff:diff,msg:msg,assignee:t.assignee||''});
      } else if(diff===0){
        msg=who+'さん、「'+tname+'」（'+pname+'）の期限は本日です。';
        groups.today.push({diff:diff,msg:msg,assignee:t.assignee||''});
        pg.today.push({diff:diff,msg:msg,assignee:t.assignee||''});
      } else if(diff===1){
        msg=who+'さん、「'+tname+'」（'+pname+'）の期限は明日です。';
        groups.prevDay.push({diff:diff,msg:msg,assignee:t.assignee||''});
        pg.prevDay.push({diff:diff,msg:msg,assignee:t.assignee||''});
      } else if(diff<=3){
        msg=who+'さん、「'+tname+'」（'+pname+'）の期限が'+diff+'日後（'+t.planEnd+'）です。';
        groups.in3d.push({diff:diff,msg:msg,assignee:t.assignee||''});
        pg.in3d.push({diff:diff,msg:msg,assignee:t.assignee||''});
      } else if(diff<=7){
        msg=who+'さん、「'+tname+'」（'+pname+'）の期限が'+diff+'日後（'+t.planEnd+'）です。';
        groups.in1w.push({diff:diff,msg:msg,assignee:t.assignee||''});
        pg.in1w.push({diff:diff,msg:msg,assignee:t.assignee||''});
      }
    })})});
    var total=pg.overdue.length+pg.today.length+pg.prevDay.length+pg.in3d.length+pg.in1w.length;
    if(total>0)projGroups.push(pg);
  });
  window._remindGroups=groups;
  window._remindProjGroups=projGroups;
  var h='<div class="remind-card"><h3>🔔 リマインド文言</h3>';
  if(S.projects.length>=1){
    h+='<div style="margin-bottom:.6rem"><select onchange="switchRemindProj(this.value)" style="font-size:.75rem;padding:.25rem .5rem">';
    h+='<option value=""'+(remindProjFilter===''?' selected':'')+'>全プロジェクト</option>';
    S.projects.forEach(function(p){
      h+='<option value="'+p.id+'"'+(remindProjFilter===p.id?' selected':'')+'>'+escH(p.name)+'</option>';
    });
    h+='</select></div>';
  }
  var gDefs=[
    {key:'overdue',label:'🔴 超過',cls:'overdue',items:groups.overdue},
    {key:'today',label:'🟣 当日',cls:'today-remind',items:groups.today},
    {key:'prevDay',label:'🟡 前日（明日期限）',cls:'prev-day',items:groups.prevDay},
    {key:'in3d',label:'🟠 3日以内',cls:'in3d',items:groups.in3d},
    {key:'in1w',label:'🔵 1週間以内',cls:'in1w',items:groups.in1w}
  ];
  var totalAll=groups.overdue.length+groups.today.length+groups.prevDay.length+groups.in3d.length+groups.in1w.length;
  gDefs.forEach(function(gd){
    gd.items.sort(function(a,b){return a.diff-b.diff});
    h+='<div class="remind-group">';
    h+='<div class="remind-group-hdr '+gd.cls+'"><span>'+gd.label+' ('+gd.items.length+'件)</span>';
    if(gd.items.length)h+='<button class="remind-copy" onclick="copyRemindGroupByKey(\''+gd.key+'\')">グループコピー</button>';
    h+='</div>';
    if(gd.items.length){
      gd.items.forEach(function(item){
        h+='<div class="remind-item">'+escH(item.msg)+'</div>';
      });
    } else {
      h+='<div class="remind-item" style="color:var(--text-dim);font-style:italic">該当なし</div>';
    }
    h+='</div>';
  });
  if(totalAll>0){
    h+='<button class="remind-copyall" onclick="copyAllReminds()">📋 全リマインド一括コピー ('+totalAll+'件)</button>';
  }
  h+='</div>';
  return h;
}

function copyRemindGroupByKey(key){
  if(!window._remindGroups||!window._remindGroups[key])return;
  var items=window._remindGroups[key];
  if(!items||!items.length)return;
  copyToClip(items.map(function(i){return i.msg}).join('\n'));
}
window.copyRemindGroupByKey=copyRemindGroupByKey;

function copyAllReminds(){
  if(!window._remindGroups)return;
  var lines=[];
  ['overdue','today','prevDay','in3d','in1w'].forEach(function(key){
    var items=window._remindGroups[key];
    if(items&&items.length){
      var labels={overdue:'超過',today:'当日',prevDay:'前日',in3d:'3日以内',in1w:'1週間以内'};
      lines.push('【'+labels[key]+'】');
      items.forEach(function(item){lines.push(item.msg)});
    }
  });
  copyToClip(lines.join('\n'));
}
window.copyAllReminds=copyAllReminds;

/* ===== PROJECT VIEW ===== */
var projViewMode='list';
function switchProjView(mode){projViewMode=mode;renderProjectView()}
window.switchProjView=switchProjView;

function renderProjectView(){
  var el=document.getElementById('projArea');if(!el)return;
  var p=getProj();if(!p){el.innerHTML='<div class="dash"><p style="color:var(--text-muted)">プロジェクトが見つかりません</p></div>';return}
  var h='<div class="proj-view">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">';
  h+='<div class="dash-title" style="margin-bottom:0">'+escH(p.name)+'</div>';
  h+='<div style="display:flex;gap:.4rem">';
  h+='<button class="tbtn" onclick="showProjMembersModal()">👤 担当者設定</button>';
  h+='<button class="tbtn" onclick="showNewGouModal()">＋ 新規号</button>';
  h+='</div></div>';
  if(p.client)h+='<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.5rem">クライアント: '+escH(p.client)+'</div>';
  var pmems=getProjMembers(p);
  if(p.members&&p.members.length){
    h+='<div style="display:flex;gap:.3rem;margin-bottom:.5rem;flex-wrap:wrap">';
    pmems.forEach(function(m){
      var prc=getRoleColor(m);
      h+='<span style="font-size:.65rem;padding:.15rem .4rem;border-radius:10px;background:'+hexToRgba(prc,0.12)+';color:'+prc+';border:1px solid '+hexToRgba(prc,0.3)+'"><span class="assignee-dot" style="background:'+prc+'"></span>'+escH(m.name)+'</span>';
    });
    h+='</div>';
  }
  h+='<div class="proj-tabs">';
  h+='<button class="proj-tab'+(projViewMode==='list'?' active':'')+'" onclick="switchProjView(\'list\')">📁 号一覧</button>';
  h+='<button class="proj-tab'+(projViewMode==='schedule'?' active':'')+'" onclick="switchProjView(\'schedule\')">📊 全体スケジュール</button>';
  h+='</div>';
  if(projViewMode==='schedule'){
    h+=renderProjectGanttHTML(p);
  } else {
    h+='<div class="dash-grid">';
    p.gous.forEach(function(g){
      var tt=0,dn=0;
      g.kikakus.forEach(function(k){k.tasks.forEach(function(t){tt++;if(t.status==='completed')dn++})});
      var prog=tt?Math.round(dn/tt*100):0;
      var barClass=prog<30?'danger':prog<70?'warning':'success';
      h+='<div class="pcard" onclick="nav(\'gou\',{pid:\''+p.id+'\',gid:\''+g.id+'\'})">';
      h+='<div class="pcard-name">'+escH(g.name)+'</div>';
      h+='<div class="pcard-stats"><span>📄 '+g.kikakus.length+' 企画</span><span>全 '+tt+' 工程</span><span style="color:var(--success)">完了 '+dn+'</span></div>';
      h+='<div class="pbar"><div class="pbar-fill" style="width:'+prog+'%;background:var(--'+barClass+')"></div></div>';
      h+='<div class="pcard-foot"><span>進捗 '+prog+'%</span>';
      h+='<span class="sitem-acts" style="opacity:1"><button onclick="event.stopPropagation();renGouUI(\''+p.id+'\',\''+g.id+'\')">✎</button>';
      h+='<button class="del" onclick="event.stopPropagation();delGouUI(\''+p.id+'\',\''+g.id+'\')">✕</button></span></div></div>';
    });
    h+='<div class="pcard-add" onclick="showNewGouModal()">＋ 新規号を追加</div>';
    h+='</div>';
  }
  h+='</div>';
  el.innerHTML=h;
}

/* ===== PROJECT SCHEDULE MATRIX ===== */
function renderProjectGanttHTML(p){
  if(!p.gous.length)return '<div style="padding:1rem;color:var(--text-muted)">号がありません</div>';
  var h='';
  p.gous.forEach(function(g){
    var gDn=0,gTt=0;
    g.kikakus.forEach(function(k){k.tasks.forEach(function(t){gTt++;if(t.status==='completed')gDn++})});
    var gProg=gTt?Math.round(gDn/gTt*100):0;
    h+='<div style="margin-bottom:1.5rem">';
    h+='<div style="font-size:.85rem;font-weight:700;margin-bottom:.5rem;color:var(--accent-light)">📦 '+escH(g.name)+' <span style="font-size:.7rem;color:var(--text-muted)">(進捗'+gProg+'%)</span></div>';
    var kikakuList=g.kikakus.filter(function(k){return k.tasks.length>0});
    if(!kikakuList.length){
      h+='<div style="font-size:.75rem;color:var(--text-dim);padding:.5rem">企画がありません</div>';
    } else {
      var allTasks=[];
      kikakuList.forEach(function(k){k.tasks.forEach(function(t){allTasks.push(t)})});
      var data=buildScheduleMatrix(kikakuList,allTasks);
      h+=renderScheduleMatrixHTML(data);
    }
    h+='<div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.3rem">';
    g.kikakus.forEach(function(k){
      h+='<button class="tbtn" onclick="addTaskFromSchedule(\''+k.id+'\')" style="font-size:.65rem">＋ '+escH(k.name)+'に工程追加</button>';
    });
    h+='</div>';
    h+='</div>';
  });
  return h;
}

/* ===== GOU VIEW ===== */
var gouViewTab='list';
function switchGouTab(t){gouViewTab=t;renderGouView()}
window.switchGouTab=switchGouTab;

function renderGouView(){
  var el=document.getElementById('gouArea');if(!el)return;
  var p=getProj(),g=getGou();
  if(!p||!g){el.innerHTML='<div class="dash"><p style="color:var(--text-muted)">号が見つかりません</p></div>';return}
  // Summary stats
  var totalT=0,doneT=0,lateT=0;
  g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    totalT++;if(t.status==='completed')doneT++;
    if(t.planEnd&&t.status!=='completed'&&t.planEnd<todayS())lateT++;
  })});
  var prog=totalT?Math.round(doneT/totalT*100):0;

  var h='<div class="proj-view">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.3rem">';
  var clientLabel=p.client||p.name;
  h+='<div><div class="dash-title" style="margin-bottom:0">'+escH(clientLabel)+'</div>';
  h+='<div style="font-size:.72rem;color:var(--text-muted)">'+escH(g.name)+' — '+g.kikakus.length+'企画 / '+totalT+'工程 / 進捗'+prog+'%'+(lateT?' / <span style="color:var(--danger)">遅延'+lateT+'</span>':'')+'</div></div>';
  h+='<div style="display:flex;gap:.4rem">';
  h+='<button class="tbtn" onclick="showCSVModal(\'daiwari\')">📥 CSV取込</button>';
  h+='<button class="tbtn" onclick="showNewKikakuModal()">＋ 新規企画</button>';
  h+='</div></div>';
  // Tab buttons
  h+='<div class="proj-tabs" style="margin-bottom:.6rem">';
  h+='<button class="proj-tab'+(gouViewTab==='list'?' active':'')+'" onclick="switchGouTab(\'list\')">📁 企画一覧</button>';
  h+='<button class="proj-tab'+(gouViewTab==='schedule'?' active':'')+'" onclick="switchGouTab(\'schedule\')">📊 スケジュール</button>';
  h+='<button class="proj-tab'+(gouViewTab==='pageMatrix'?' active':'')+'" onclick="switchGouTab(\'pageMatrix\')">📈 ページ進捗</button>';
  h+='<button class="proj-tab'+(gouViewTab==='table'?' active':'')+'" onclick="switchGouTab(\'table\')">📋 テーブル</button>';
  h+='<button class="proj-tab'+(gouViewTab==='daiwari'?' active':'')+'" onclick="switchGouTab(\'daiwari\')">📐 台割</button>';
  h+='<button class="proj-tab'+(gouViewTab==='alert'?' active':'')+'" onclick="switchGouTab(\'alert\')">🔔 アラート</button>';
  h+='</div>';

  if(gouViewTab==='schedule'){
    var kikakuList=g.kikakus.filter(function(k){return k.tasks.length>0});
    if(!kikakuList.length){
      h+='<div style="font-size:.75rem;color:var(--text-dim);padding:1rem">スケジュールデータがありません</div>';
    } else {
      var allTasks=[];
      kikakuList.forEach(function(k){k.tasks.forEach(function(t){allTasks.push(t)})});
      var data=buildScheduleMatrix(kikakuList,allTasks);
      h+=renderScheduleMatrixHTML(data);
    }
  } else if(gouViewTab==='pageMatrix'){
    h+=renderGouPageMatrixHTML(g);
  } else if(gouViewTab==='table'){
    h+=renderGouTableHTML(g,p);
  } else if(gouViewTab==='daiwari'){
    h+=renderGouDaiwariHTML(g);
  } else if(gouViewTab==='alert'){
    h+=renderGouAlertHTML(g);
  } else {
    // Default: list of kikaku cards
    h+='<div class="dash-grid">';
    g.kikakus.forEach(function(k,ki){
      var tt=k.tasks.length,dn=0;k.tasks.forEach(function(t){if(t.status==='completed')dn++});
      var kprog=tt?Math.round(dn/tt*100):0;
      var barClass=kprog<30?'danger':kprog<70?'warning':'success';
      h+='<div class="pcard" onclick="nav(\'kikaku\',{pid:\''+p.id+'\',gid:\''+g.id+'\',kid:\''+k.id+'\'})">';
      h+='<div class="pcard-name" style="display:flex;align-items:center;gap:.4rem">'+escH(k.name);
      h+='<span style="display:flex;gap:2px;margin-left:auto">';
      h+='<button onclick="event.stopPropagation();moveKikakuInGou(\''+p.id+'\',\''+g.id+'\',\''+k.id+'\',-1)" style="font-size:.65rem;padding:1px 4px;border:1px solid var(--border);border-radius:3px;cursor:pointer;background:var(--surface)'+(ki===0?';opacity:.3':'')+'" title="上に移動">▲</button>';
      h+='<button onclick="event.stopPropagation();moveKikakuInGou(\''+p.id+'\',\''+g.id+'\',\''+k.id+'\',1)" style="font-size:.65rem;padding:1px 4px;border:1px solid var(--border);border-radius:3px;cursor:pointer;background:var(--surface)'+(ki===g.kikakus.length-1?';opacity:.3':'')+'" title="下に移動">▼</button>';
      h+='</span></div>';
      h+='<div class="pcard-stats"><span>全 '+tt+' 工程</span><span style="color:var(--success)">完了 '+dn+'</span></div>';
      h+='<div class="pbar"><div class="pbar-fill" style="width:'+kprog+'%;background:var(--'+barClass+')"></div></div>';
      h+='<div class="pcard-foot"><span>進捗 '+kprog+'%</span>';
      h+='<span class="sitem-acts" style="opacity:1"><button onclick="event.stopPropagation();renKikakuUI(\''+p.id+'\',\''+g.id+'\',\''+k.id+'\')">✎</button>';
      h+='<button class="del" onclick="event.stopPropagation();delKikakuUI(\''+p.id+'\',\''+g.id+'\',\''+k.id+'\')">✕</button></span></div></div>';
    });
    h+='<div class="pcard-add" onclick="showNewKikakuModal()">＋ 新規企画を追加</div>';
    h+='</div>';
  }
  h+='</div>';
  el.innerHTML=h;
  if(gouViewTab==='table')initTaskRowDragDrop();
}

function renderGouTableHTML(g,p){
  var kikakus=g.kikakus.slice().sort(function(a,b){
    var pa=parsePageRange(a.meta&&a.meta.pageNum?a.meta.pageNum:'');
    var pb=parsePageRange(b.meta&&b.meta.pageNum?b.meta.pageNum:'');
    return (pa?pa.start:9999)-(pb?pb.start:9999);
  });
  var h='<div style="overflow-x:auto"><table class="tbl"><thead><tr><th style="width:25px"></th><th>企画</th><th>工程名</th><th>担当者</th><th>ステータス</th><th>予定開始</th><th>予定終了</th><th>備考</th></tr></thead><tbody>';
  kikakus.forEach(function(k){
    var pInfo=parsePageRange(k.meta&&k.meta.pageNum?k.meta.pageNum:'');
    var pBadge=pInfo?'<span style="font-size:.6rem;padding:1px 5px;border-radius:8px;background:#dbeafe;color:#1e40af;margin-left:.3rem">'+pInfo.count+'P</span>':'';
    if(!k.tasks.length){
      h+='<tr><td></td><td colspan="7" style="font-size:.88rem;font-weight:600;color:var(--text-muted)">'+escH(k.name)+pBadge+' — 工程なし</td></tr>';
      return;
    }
    k.tasks.forEach(function(t,ti){
      h+='<tr class="task-drag-row" draggable="true" data-kid="'+k.id+'" data-tid="'+t.id+'">';
      h+='<td class="drag-handle" style="cursor:grab;text-align:center;color:var(--text-muted)">☰</td>';
      if(ti===0) h+='<td rowspan="'+k.tasks.length+'" style="font-size:.92rem;font-weight:700;vertical-align:top;border-right:2px solid var(--border);line-height:1.3">'+escH(k.name)+pBadge+'</td>';
      h+='<td style="font-size:.72rem">'+escH(t.name)+'</td>';
      h+='<td style="font-size:.72rem">'+escH(t.assignee||'')+'</td>';
      h+='<td style="font-size:.72rem"><span class="sts sts-'+t.status+'">'+SLA[t.status]+'</span></td>';
      h+='<td style="font-size:.72rem">'+escH(t.planStart||'')+'</td>';
      h+='<td style="font-size:.72rem">'+escH(t.planEnd||'')+'</td>';
      h+='<td style="font-size:.72rem">'+escH(t.note||'')+'</td>';
      h+='</tr>';
    });
  });
  h+='</tbody></table></div>';
  return h;
}

var gouDaiwariMode='grid';
function switchGouDaiwariMode(m){gouDaiwariMode=m;renderGouView()}
window.switchGouDaiwariMode=switchGouDaiwariMode;

function renderGouDaiwariHTML(g){
  var arts=buildGouArticles(g);
  var totalPages=0;
  arts.forEach(function(a){if(a.pageInfo)totalPages+=a.pageInfo.count});

  var h='<div class="daiwari-controls" style="border:none;padding:.3rem 0">';
  h+='<span style="font-size:.65rem;color:var(--text-dim)">'+arts.length+'企画 / 約'+totalPages+'ページ</span>';
  h+='<div class="daiwari-view-toggle">';
  h+='<button class="'+(gouDaiwariMode==='grid'?'active':'')+'" onclick="switchGouDaiwariMode(\'grid\')">グリッド</button>';
  h+='<button class="'+(gouDaiwariMode==='table'?'active':'')+'" onclick="switchGouDaiwariMode(\'table\')">テーブル</button>';
  h+='</div></div>';
  h+=renderDaiwariSection(arts,gouDaiwariMode);
  return h;
}

function renderGouPageMatrixHTML(g){
  if(!g||!g.kikakus.length)return '<div style="padding:1rem;color:var(--text-muted)">企画がありません</div>';

  var sorted=g.kikakus.slice().map(function(k){
    var pr=parsePageRange((k.meta&&k.meta.pageNum)?k.meta.pageNum:'');
    return {k:k,pr:pr,sort:pr?(pr.start!==null?pr.start:99999):99999};
  });
  sorted.sort(function(a,b){return a.sort-b.sort});

  // Collect unique task names
  var allTaskNames=[];var taskNameSet={};
  var templateK=sorted[0].k;
  sorted.forEach(function(s){if(s.k.tasks.length>templateK.tasks.length)templateK=s.k});
  templateK.tasks.forEach(function(t){if(!taskNameSet[t.name]){taskNameSet[t.name]=true;allTaskNames.push(t.name)}});
  sorted.forEach(function(s){s.k.tasks.forEach(function(t){if(!taskNameSet[t.name]){taskNameSet[t.name]=true;allTaskNames.push(t.name)}})});

  var lookup={};
  sorted.forEach(function(s){lookup[s.k.id]={};s.k.tasks.forEach(function(t){lookup[s.k.id][t.name]=t})});

  var stIcon={not_started:'⚪',in_progress:'🔵',completed:'✅'};
  var stBg={not_started:'#f8fafc',in_progress:'#eff6ff',completed:'#f0fdf4'};
  var stBorder={not_started:'#e2e8f0',in_progress:'#bfdbfe',completed:'#bbf7d0'};

  var h='<div style="overflow:auto;max-height:calc(100vh - 240px)">';
  h+='<table class="tv page-matrix">';

  // Header row 1
  h+='<thead><tr><th rowspan="2" style="position:sticky;left:0;z-index:10;background:var(--surface);min-width:180px;text-align:left">工程</th>';
  sorted.forEach(function(s){
    var kName=s.k.name.replace(/\s*\([^)]*\)$/,'');
    var pgStr=(s.k.meta&&s.k.meta.pageNum)?s.k.meta.pageNum:'';
    var pgCount=s.pr&&s.pr.count?s.pr.count+'P':'';
    var bgClr=(s.pr&&s.pr.isCover)?'#fef3c7':'#f0f9ff';
    var bdrClr=(s.pr&&s.pr.isCover)?'#fbbf24':'#7dd3fc';
    h+='<th colspan="2" style="text-align:center;background:'+bgClr+';border:1px solid '+bdrClr+';padding:.4rem .3rem;white-space:normal;word-break:break-all;min-width:120px" title="'+escH(s.k.name)+'">';
    h+=escH(kName);
    if(pgStr)h+='<br><span style="color:#4338ca;font-weight:700">'+escH(pgStr)+' '+pgCount+'</span>';
    var done=0;s.k.tasks.forEach(function(t){if(t.status==='completed')done++});
    var pct=s.k.tasks.length?Math.round(done/s.k.tasks.length*100):0;
    var barClr=pct===100?'#22c55e':pct>0?'#3b82f6':'#e2e8f0';
    h+='<div style="background:#e5e7eb;border-radius:4px;height:5px;overflow:hidden;margin-top:4px"><div style="background:'+barClr+';height:100%;width:'+pct+'%"></div></div>';
    h+='<span style="color:var(--text-dim)">'+pct+'%</span>';
    h+='</th>';
  });
  h+='</tr>';

  // Header row 2
  h+='<tr>';
  sorted.forEach(function(){
    h+='<th style="text-align:center;color:var(--text-muted);padding:.2rem;min-width:50px">状態</th>';
    h+='<th style="text-align:center;color:var(--text-muted);padding:.2rem;min-width:60px">担当</th>';
  });
  h+='</tr></thead>';

  // Body
  h+='<tbody>';
  allTaskNames.forEach(function(tName,ri){
    var rowBg=ri%2===0?'var(--surface)':'var(--surface2)';
    h+='<tr>';
    h+='<td style="position:sticky;left:0;z-index:5;background:'+rowBg+';font-weight:600;padding:.4rem .6rem;white-space:nowrap;border-right:2px solid var(--border)">'+escH(tName)+'</td>';
    sorted.forEach(function(s){
      var t=lookup[s.k.id][tName];
      if(!t){
        h+='<td style="text-align:center;background:'+rowBg+';color:#cbd5e1">—</td>';
        h+='<td style="background:'+rowBg+'"></td>';
        return;
      }
      var icon=stIcon[t.status]||'⚪';
      var bg=stBg[t.status]||'#f8fafc';
      var bdr=stBorder[t.status]||'#e2e8f0';
      h+='<td style="text-align:center;background:'+bg+';border:1px solid '+bdr+';padding:.3rem .2rem;cursor:pointer" onclick="cycleStatusInGou(\''+s.k.id+'\',\''+t.id+'\')" title="'+escH(tName)+' — '+SLA[t.status]+'">';
      h+=icon;
      if(t.planEnd)h+='<div style="color:var(--text-dim)">〜'+t.planEnd.substring(5)+'</div>';
      h+='</td>';
      if(t.assignee){
        var mem=getMember(t.assignee);
        var rc=getRoleColor(mem);
        var shortName=t.assignee.length>5?t.assignee.substring(0,5)+'…':t.assignee;
        h+='<td style="text-align:center;font-weight:600;color:'+rc+';padding:.2rem;white-space:nowrap" title="'+escH(t.assignee)+'">'+escH(shortName)+'</td>';
      } else {
        h+='<td style="text-align:center;color:var(--text-dim)">—</td>';
      }
    });
    h+='</tr>';
  });
  h+='</tbody></table></div>';

  var totalPages=0;
  sorted.forEach(function(s){totalPages+=(s.pr&&s.pr.count?s.pr.count:0)});
  h+='<div style="padding:.5rem 0;color:var(--text-muted);border-top:1px solid var(--border);margin-top:.5rem">';
  h+='📐 合計: '+sorted.length+'企画 / '+totalPages+'ページ / '+allTaskNames.length+'工程';
  h+='</div>';
  return h;
}

function renderGouAlertHTML(g){
  var today=todayS();
  var alerts=[];
  g.kikakus.forEach(function(k){
    k.tasks.forEach(function(t){
      if(t.status==='completed')return;
      if(t.planEnd&&t.planEnd<today){
        alerts.push({type:'overdue',kikaku:k.name,task:t.name,assignee:t.assignee,date:t.planEnd,days:diffD(parseD(t.planEnd),new Date())});
      } else if(t.planEnd){
        var daysLeft=diffD(new Date(),parseD(t.planEnd));
        if(daysLeft<=3&&daysLeft>=0){
          alerts.push({type:'soon',kikaku:k.name,task:t.name,assignee:t.assignee,date:t.planEnd,days:daysLeft});
        }
      }
      if(t.status==='not_started'&&t.planStart&&t.planStart<=today){
        alerts.push({type:'not_started',kikaku:k.name,task:t.name,assignee:t.assignee,date:t.planStart,days:diffD(parseD(t.planStart),new Date())});
      }
    });
  });
  alerts.sort(function(a,b){return (a.type==='overdue'?0:a.type==='not_started'?1:2)-(b.type==='overdue'?0:b.type==='not_started'?1:2)||a.days-b.days});
  if(!alerts.length)return '<div style="padding:1rem;color:var(--text-muted);font-size:.75rem">アラートはありません</div>';
  var h='<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>種別</th><th>企画</th><th>工程</th><th>担当者</th><th>期限</th><th>状態</th></tr></thead><tbody>';
  alerts.forEach(function(a){
    var icon=a.type==='overdue'?'🔴 遅延':a.type==='not_started'?'🟡 未着手':'🟠 期限間近';
    var detail=a.type==='overdue'?a.days+'日超過':a.type==='not_started'?a.days+'日経過':'残り'+a.days+'日';
    h+='<tr style="font-size:.72rem">';
    h+='<td>'+icon+'</td><td>'+escH(a.kikaku)+'</td><td>'+escH(a.task)+'</td>';
    h+='<td>'+escH(a.assignee||'未アサイン')+'</td><td>'+escH(a.date)+'</td><td>'+detail+'</td></tr>';
  });
  h+='</tbody></table></div>';
  return h;
}

/* ===== KIKAKU TABS ===== */
function renderKTabs(){
  var g=getGou(),el=document.getElementById('ktabs');if(!el||!g)return;
  var h='';
  g.kikakus.forEach(function(k){
    h+='<button class="tab-btn'+(k.id===S.activeKikakuId?' active':'')+'" onclick="nav(\'kikaku\',{kid:\''+k.id+'\'})">'+escH(k.name)+'</button>';
  });
  h+='<button class="tab-btn" onclick="showNewKikakuModal()" style="color:var(--text-dim)">＋</button>';
  el.innerHTML=h;
}

/* ===== SUMMARY ===== */
function renderSummary(){
  var g=getGou(),el=document.getElementById('sumbar');if(!el)return;
  if(!g||!g.kikakus.length){el.innerHTML='<div class="chip">工程なし</div>';return}
  var tt=0,lt=0,dn=0,th=0;
  g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    tt++;
    if(t.status==='completed')dn++;
    th+=(t.estimatedHours||0);
    if(t.planEnd&&t.actualEnd&&diffD(parseD(t.planEnd),parseD(t.actualEnd))>0)lt++;
  })});
  if(!tt){el.innerHTML='<div class="chip">工程なし</div>';return}
  el.innerHTML='<div class="chip">総数 <span class="v blue">'+tt+'</span></div>'+
    '<div class="chip">完了 <span class="v green">'+dn+'</span></div>'+
    '<div class="chip">遅延 <span class="v red">'+lt+'</span></div>'+
    '<div class="chip">進捗 <span class="v blue">'+Math.round(dn/tt*100)+'%</span></div>'+
    '<div class="chip">総工数 <span class="v blue">'+th+'h</span></div>';
}

/* ===== VIEW SWITCH ===== */
function renderView(){
  if(S.activeView==='schedule')renderScheduleMatrix();
  else if(S.activeView==='pageMatrix')renderPageMatrix();
  else renderTable();
}

/* ===== CONTEXT HEADER (Client > Gou > ...) ===== */
function renderContextHeader(){
  var p=getProj();var g=getGou();
  if(!p)return '';
  var clientName=p.client||p.name;
  var gouName=g?g.name:'';
  var totalKikakus=g?g.kikakus.length:0;
  var totalPages=0;
  if(g)g.kikakus.forEach(function(k){var pr=parsePageRange((k.meta&&k.meta.pageNum)?k.meta.pageNum:'');if(pr&&pr.count)totalPages+=pr.count});
  var h='<div style="display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;background:linear-gradient(135deg,#1e3a8a,#2563eb);border-radius:var(--radius-sm);margin-bottom:.8rem;flex-wrap:wrap">';
  h+='<span style="font-size:.75rem;font-weight:700;color:#fff">'+escH(clientName)+'</span>';
  if(gouName){h+='<span style="color:#93c5fd;font-size:.7rem">▸</span><span style="font-size:.72rem;font-weight:600;color:#dbeafe">'+escH(gouName)+'</span>'}
  h+='<span style="flex:1"></span>';
  h+='<span style="font-size:.75rem;color:#93c5fd">'+totalKikakus+'企画 / '+totalPages+'P</span>';
  h+='</div>';
  return h;
}

/* ===== TABLE VIEW ===== */
function renderTable(){
  var el=document.getElementById('viewContent');if(!el)return;
  var g=getGou();
  if(!g||!g.kikakus.length){el.innerHTML='<div class="dash"><p style="color:var(--text-muted)">企画がありません</p></div>';return}
  var today=todayS();
  var h=renderContextHeader();
  // Sort kikakus by page order
  var sortedKiks=g.kikakus.slice().sort(function(a,b){
    var pa=parsePageRange((a.meta&&a.meta.pageNum)?a.meta.pageNum:'');
    var pb=parsePageRange((b.meta&&b.meta.pageNum)?b.meta.pageNum:'');
    var sa=pa?(pa.start!==null?pa.start:99999):99999;
    var sb=pb?(pb.start!==null?pb.start:99999):99999;
    return sa-sb;
  });
  sortedKiks.forEach(function(k){
    var kPageStr=(k.meta&&k.meta.pageNum)?k.meta.pageNum:'';
    var kPR=parsePageRange(kPageStr);
    var kPC=kPR&&kPR.count?kPR.count:0;
    var pageBg=kPR&&kPR.isCover?'linear-gradient(135deg,#fef3c7,#fde68a)':'linear-gradient(135deg,#eef2ff,#dbeafe)';
    var pageTxt=kPR&&kPR.isCover?'#92400e':'#1e40af';
    h+='<div class="kik-block" data-kid="'+k.id+'" style="margin-bottom:1.5rem">';
    h+='<div class="kik-header" style="display:flex;align-items:center;gap:.6rem;padding:.5rem 1rem;background:'+pageBg+';border:1px solid var(--border);border-radius:var(--radius-sm) var(--radius-sm) 0 0;flex-wrap:wrap">';
    if(kPageStr){h+='<span style="font-size:.85rem;font-weight:800;color:'+pageTxt+';white-space:nowrap">'+escH(kPageStr)+'</span><span style="font-size:.7rem;color:'+pageTxt+';opacity:.6">'+kPC+'P</span><span style="color:'+pageTxt+';opacity:.3">|</span>'}
    h+='<span style="font-size:.78rem;font-weight:700;color:var(--accent-light);cursor:pointer;white-space:nowrap" onclick="editKikakuNameInline(\''+k.id+'\')" title="クリックで名前変更">'+escH(k.name)+'</span>';
    // 担当者サマリーバッジ
    var kAssignees={};
    k.tasks.forEach(function(t2){if(t2.assignee){kAssignees[t2.assignee]=(kAssignees[t2.assignee]||0)+1}});
    var kAssigneeKeys=Object.keys(kAssignees);
    if(kAssigneeKeys.length){
      h+='<span style="display:flex;gap:.25rem;flex-wrap:wrap;align-items:center">';
      kAssigneeKeys.forEach(function(aName){
        var aMem=getMember(aName);
        var aClr=getRoleColor(aMem);
        h+='<span style="font-size:.75rem;padding:.12rem .35rem;background:'+aClr+'18;color:'+aClr+';border:1px solid '+aClr+'40;border-radius:10px;font-weight:600;white-space:nowrap" title="'+escH(aName)+': '+kAssignees[aName]+'工程">'+escH(aName)+'<span style="margin-left:.15rem;opacity:.7">'+kAssignees[aName]+'</span></span>';
      });
      h+='</span>';
    }
    h+='<span style="flex:1"></span>';
    var kDn=0;k.tasks.forEach(function(t2){if(t2.status==="completed")kDn++});
    var kProg=k.tasks.length?Math.round(kDn/k.tasks.length*100):0;
    h+='<span style="font-size:.65rem;color:var(--text-muted);white-space:nowrap">'+k.tasks.length+'工程 / 進捗'+kProg+'%</span></div>';
    if(!k.tasks.length){
      h+='<div style="padding:.5rem 1rem;border:1px solid var(--border);border-top:none;font-size:.75rem;color:var(--text-dim)">工程なし</div>';
    } else {
      h+='<table class="tv" style="border-radius:0"><thead><tr><th style="width:24px"></th><th style="width:30px">#</th><th>工程名</th><th>担当者</th>';
      h+='<th>📅予定開始</th><th>📅予定終了</th>';
      h+='<th>工数(h)</th><th>ステータス</th><th>備考</th><th style="width:30px"></th></tr></thead><tbody>';
      k.tasks.forEach(function(t,i){
        var isDueToday=t.planEnd===today&&t.status!=='completed';
        h+='<tr class="task-drag-row" draggable="true" data-tid="'+t.id+'" data-kid="'+k.id+'"'+(isDueToday?' style="box-shadow:inset 3px 0 0 var(--warning)"':'')+'>';
        h+='<td style="cursor:grab;text-align:center;color:var(--text-dim);font-size:.7rem;padding:0 .2rem" title="ドラッグで並び替え">☰</td>';
        h+='<td style="color:var(--text-dim);font-size:.65rem">'+(i+1)+'</td>';
        h+='<td class="ed" data-f="name" data-t="'+t.id+'" data-k="'+k.id+'">'+escH(t.name)+'</td>';
        var mem=getMember(t.assignee);
        var rc=getRoleColor(mem);
        h+='<td class="ed" data-f="assignee" data-t="'+t.id+'" data-k="'+k.id+'" data-tp="assignee">';
        if(mem)h+='<span class="assignee-dot" style="background:'+rc+'"></span><span style="color:'+rc+'">'+escH(t.assignee)+'</span>';
        else h+=escH(t.assignee||'—');
        h+='</td>';
        h+='<td class="ed td-plan" data-f="planStart" data-t="'+t.id+'" data-k="'+k.id+'" data-tp="date">'+escH(t.planStart)+'</td>';
        h+='<td class="ed td-plan" data-f="planEnd" data-t="'+t.id+'" data-k="'+k.id+'" data-tp="date">'+escH(t.planEnd)+'</td>';
        h+='<td class="ed" data-f="estimatedHours" data-t="'+t.id+'" data-k="'+k.id+'" data-tp="number">'+(t.estimatedHours||0)+'</td>';
        h+='<td><select class="status-sel '+t.status+'" onchange="setStatusInGou(\''+k.id+'\',\''+t.id+'\',this.value)" style="font-size:.65rem;padding:.1rem .2rem;border-radius:10px;font-weight:600;border:1px solid var(--border);cursor:pointer">';
        SL.forEach(function(st){h+='<option value="'+st+'"'+(t.status===st?' selected':'')+'>'+SLA[st]+'</option>'});
        h+='</select></td>';
        h+='<td class="ed" data-f="note" data-t="'+t.id+'" data-k="'+k.id+'">'+escH(t.note||'—')+'</td>';
        h+='<td><button class="row-del" onclick="delTaskInGou(\''+k.id+'\',\''+t.id+'\')">✕</button></td>';
        h+='</tr>';
      });
      h+='</tbody></table>';
    }
    h+='<button class="add-row" onclick="addTaskToKikaku(\''+k.id+'\')" style="border:1px solid var(--border);border-top:none;border-radius:0 0 var(--radius-sm) var(--radius-sm)">＋ 工程を追加</button>';
    h+='</div>'; // close kik-block
  });
  el.innerHTML=h;
  el.querySelectorAll('td.ed').forEach(function(td){
    td.addEventListener('click',function(){startEditGou(td)});
  });
  // Drag & drop for task rows
  initTaskRowDragDrop(el);
}

function initTaskRowDragDrop(container){
  var rows=container.querySelectorAll('tr.task-drag-row');
  rows.forEach(function(row){
    row.addEventListener('dragstart',function(e){
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',row.dataset.tid+'|'+row.dataset.kid);
      row.style.opacity='.4';
    });
    row.addEventListener('dragend',function(){
      row.style.opacity='1';
      rows.forEach(function(r){r.style.borderTop='';r.style.borderBottom=''});
    });
    row.addEventListener('dragover',function(e){
      e.preventDefault();
      e.dataTransfer.dropEffect='move';
      rows.forEach(function(r){r.style.borderTop='';r.style.borderBottom=''});
      var rect=row.getBoundingClientRect();
      if(e.clientY<rect.top+rect.height/2){
        row.style.borderTop='3px solid var(--accent)';
      } else {
        row.style.borderBottom='3px solid var(--accent)';
      }
    });
    row.addEventListener('dragleave',function(){
      row.style.borderTop='';row.style.borderBottom='';
    });
    row.addEventListener('drop',function(e){
      e.preventDefault();
      rows.forEach(function(r){r.style.borderTop='';r.style.borderBottom=''});
      var data=e.dataTransfer.getData('text/plain').split('|');
      var fromTid=data[0],fromKid=data[1];
      var toTid=row.dataset.tid,toKid=row.dataset.kid;
      if(fromTid===toTid)return;
      var g=getGou();if(!g)return;
      var fromK=g.kikakus.find(function(k){return k.id===fromKid});
      var toK=g.kikakus.find(function(k){return k.id===toKid});
      if(!fromK||!toK)return;
      var fromIdx=fromK.tasks.findIndex(function(t){return t.id===fromTid});
      if(fromIdx<0)return;
      var moved=fromK.tasks.splice(fromIdx,1)[0];
      var toIdx=toK.tasks.findIndex(function(t){return t.id===toTid});
      if(toIdx<0){toK.tasks.push(moved)}
      else{
        var rect2=row.getBoundingClientRect();
        if(e.clientY>rect2.top+rect2.height/2)toIdx++;
        toK.tasks.splice(toIdx,0,moved);
      }
      save();renderAll();
    });
  });
}

/* ===== PAGE MATRIX VIEW ===== */
function renderPageMatrix(){
  var el=document.getElementById('viewContent');if(!el)return;
  var g=getGou();
  if(!g||!g.kikakus.length){el.innerHTML='<div class="dash"><p style="color:var(--text-muted)">企画がありません</p></div>';return}

  // Sort kikakus by page order
  var sorted=g.kikakus.slice().map(function(k){
    var pr=parsePageRange((k.meta&&k.meta.pageNum)?k.meta.pageNum:'');
    return {k:k,pr:pr,sort:pr?(pr.start!==null?pr.start:99999):99999};
  });
  sorted.sort(function(a,b){return a.sort-b.sort});

  // Collect all unique task names across kikakus (preserving order from the longest kikaku)
  var allTaskNames=[];
  var taskNameSet={};
  // First pass: find the kikaku with the most tasks as the "template"
  var templateK=sorted[0].k;
  sorted.forEach(function(s){if(s.k.tasks.length>templateK.tasks.length)templateK=s.k});
  templateK.tasks.forEach(function(t){if(!taskNameSet[t.name]){taskNameSet[t.name]=true;allTaskNames.push(t.name)}});
  // Second pass: add any task names not in template
  sorted.forEach(function(s){
    s.k.tasks.forEach(function(t){if(!taskNameSet[t.name]){taskNameSet[t.name]=true;allTaskNames.push(t.name)}});
  });

  // Build lookup: kikaku id -> { taskName -> task }
  var lookup={};
  sorted.forEach(function(s){
    lookup[s.k.id]={};
    s.k.tasks.forEach(function(t){lookup[s.k.id][t.name]=t});
  });

  // Status colors & icons
  var stIcon={not_started:'⚪',in_progress:'🔵',completed:'✅'};
  var stBg={not_started:'#f8fafc',in_progress:'#eff6ff',completed:'#f0fdf4'};
  var stBorder={not_started:'#e2e8f0',in_progress:'#bfdbfe',completed:'#bbf7d0'};

  // Each kikaku = 2 columns: status + assignee
  var PM_COLS=2;

  // === Render ===
  var h=renderContextHeader();
  h+='<div style="overflow:auto;max-height:calc(100vh - 200px)">';
  h+='<table class="tv page-matrix" style="font-size:.7rem;border-collapse:separate;border-spacing:0">';

  // Header row 1: Kikaku name + page info (colspan=2)
  h+='<thead><tr><th rowspan="2" style="position:sticky;left:0;z-index:10;background:var(--surface);min-width:160px;text-align:left">工程</th>';
  sorted.forEach(function(s){
    var kName=s.k.name.replace(/\s*\([^)]*\)$/,'');
    var pgStr=(s.k.meta&&s.k.meta.pageNum)?s.k.meta.pageNum:'';
    var pgCount=s.pr&&s.pr.count?s.pr.count+'P':'';
    var bgClr=(s.pr&&s.pr.isCover)?'#fef3c7':'#f0f9ff';
    var bdrClr=(s.pr&&s.pr.isCover)?'#fbbf24':'#7dd3fc';
    h+='<th colspan="'+PM_COLS+'" style="text-align:center;background:'+bgClr+';border:1px solid '+bdrClr+';font-size:.72rem;font-weight:700;padding:.3rem .2rem;white-space:normal;word-break:break-all;min-width:100px" title="'+escH(s.k.name)+'">';
    h+=escH(kName);
    if(pgStr)h+='<br><span style="font-size:.7rem;color:#4338ca;font-weight:700">'+escH(pgStr)+' '+pgCount+'</span>';
    // Progress bar
    var done=0;s.k.tasks.forEach(function(t){if(t.status==='completed')done++});
    var pct=s.k.tasks.length?Math.round(done/s.k.tasks.length*100):0;
    var barClr=pct===100?'#22c55e':pct>0?'#3b82f6':'#e2e8f0';
    h+='<div style="background:#e5e7eb;border-radius:4px;height:4px;overflow:hidden;margin-top:3px"><div style="background:'+barClr+';height:100%;width:'+pct+'%"></div></div>';
    h+='<span style="font-size:.68rem;color:var(--text-dim)">'+pct+'%</span>';
    h+='</th>';
  });
  h+='</tr>';

  // Header row 2: status / assignee sub-headers
  h+='<tr>';
  sorted.forEach(function(){
    h+='<th style="text-align:center;font-size:.7rem;color:var(--text-muted);padding:.1rem;min-width:40px">状態</th>';
    h+='<th style="text-align:center;font-size:.7rem;color:var(--text-muted);padding:.1rem;min-width:50px">担当</th>';
  });
  h+='</tr></thead>';

  // Body: one row per task name
  h+='<tbody>';
  allTaskNames.forEach(function(tName,ri){
    var rowBg=ri%2===0?'var(--surface)':'var(--surface2)';
    h+='<tr>';
    h+='<td style="position:sticky;left:0;z-index:5;background:'+rowBg+';font-weight:600;padding:.35rem .5rem;white-space:nowrap;border-right:2px solid var(--border)">'+escH(tName)+'</td>';
    sorted.forEach(function(s){
      var t=lookup[s.k.id][tName];
      if(!t){
        h+='<td style="text-align:center;background:'+rowBg+';color:#cbd5e1;font-size:.65rem">—</td>';
        h+='<td style="background:'+rowBg+'"></td>';
        return;
      }
      var icon=stIcon[t.status]||'⚪';
      var bg=stBg[t.status]||'#f8fafc';
      var bdr=stBorder[t.status]||'#e2e8f0';
      // Status cell
      h+='<td style="text-align:center;background:'+bg+';border:1px solid '+bdr+';padding:.2rem .15rem;cursor:pointer" onclick="cycleStatusInGou(\''+s.k.id+'\',\''+t.id+'\')" title="'+escH(tName)+' — '+SLA[t.status]+'">';
      h+=icon;
      if(t.planEnd)h+='<div style="font-size:.68rem;color:var(--text-dim)">〜'+t.planEnd.substring(5)+'</div>';
      h+='</td>';
      // Assignee cell
      if(t.assignee){
        var mem=getMember(t.assignee);
        var rc=getRoleColor(mem);
        var shortName=t.assignee.length>4?t.assignee.substring(0,4)+'…':t.assignee;
        h+='<td style="text-align:center;font-size:.72rem;font-weight:600;color:'+rc+';padding:.1rem;white-space:nowrap" title="'+escH(t.assignee)+'">'+escH(shortName)+'</td>';
      } else {
        h+='<td style="text-align:center;font-size:.7rem;color:var(--text-dim)">—</td>';
      }
    });
    h+='</tr>';
  });
  h+='</tbody></table></div>';

  // Summary
  var totalPages=0;
  sorted.forEach(function(s){var pr2=s.pr;totalPages+=(pr2&&pr2.count?pr2.count:0)});
  h+='<div style="padding:.5rem 1rem;font-size:.68rem;color:var(--text-muted);border-top:1px solid var(--border);margin-top:.5rem">';
  h+='📐 合計: '+sorted.length+'企画 / '+totalPages+'ページ / '+allTaskNames.length+'工程';
  h+='</div>';

  el.innerHTML=h;
}

/* Table helpers for multi-kikaku table */
function findTaskInGou(kid,tid){
  var g=getGou();if(!g)return null;
  var k=g.kikakus.find(function(x){return x.id===kid});if(!k)return null;
  var t=k.tasks.find(function(x){return x.id===tid});
  return t||null;
}

function cycleStatusInGou(kid,tid){
  var t=findTaskInGou(kid,tid);if(!t)return;
  var idx=SL.indexOf(t.status);
  t.status=SL[(idx+1)%SL.length];
  if(t.status==='in_progress'&&!t.actualStart)t.actualStart=todayS();
  if(t.status==='completed'&&!t.actualEnd)t.actualEnd=todayS();
  save();renderAll();
}
window.cycleStatusInGou=cycleStatusInGou;

function setStatusInGou(kid,tid,newStatus){
  var t=findTaskInGou(kid,tid);if(!t)return;
  t.status=newStatus;
  if(newStatus==='in_progress'&&!t.actualStart)t.actualStart=todayS();
  if(newStatus==='completed'&&!t.actualEnd)t.actualEnd=todayS();
  save();renderAll();
}
window.setStatusInGou=setStatusInGou;

function delTaskInGou(kid,tid){
  var g=getGou();if(!g)return;
  var k=g.kikakus.find(function(x){return x.id===kid});if(!k)return;
  if(confirm('この工程を削除しますか？')){
    k.tasks=k.tasks.filter(function(x){return x.id!==tid});
    save();renderAll();
  }
}
window.delTaskInGou=delTaskInGou;

function addTaskToKikaku(kid){
  var g=getGou();if(!g)return;
  var k=g.kikakus.find(function(x){return x.id===kid});if(!k)return;
  k.tasks.push(mkTask({name:'新規工程'}));save();renderAll();
}
window.addTaskToKikaku=addTaskToKikaku;

function insertTaskAtIndex(kid,idx){
  var g=getGou();if(!g)return;
  var k=g.kikakus.find(function(x){return x.id===kid});if(!k)return;
  var name=prompt('挿入する工程名を入力してください','新規工程');
  if(name===null||!name.trim())return;
  k.tasks.splice(idx,0,mkTask({name:name.trim()}));
  save();renderAll();
  toast('工程「'+name.trim()+'」を挿入しました','ok');
}
window.insertTaskAtIndex=insertTaskAtIndex;

function moveTaskInKikaku(kid,tid,dir){
  var g=getGou();if(!g)return;
  var k=g.kikakus.find(function(x){return x.id===kid});if(!k)return;
  var idx=k.tasks.findIndex(function(x){return x.id===tid});if(idx<0)return;
  var newIdx=idx+dir;
  if(newIdx<0||newIdx>=k.tasks.length)return;
  var tmp=k.tasks[idx];k.tasks[idx]=k.tasks[newIdx];k.tasks[newIdx]=tmp;
  save();renderAll();
}
window.moveTaskInKikaku=moveTaskInKikaku;

function editKikakuNameInline(kid){
  var g=getGou();if(!g)return;
  var k=g.kikakus.find(function(x){return x.id===kid});if(!k)return;
  var newName=prompt('企画名を入力してください',k.name);
  if(newName!==null&&newName.trim()){
    k.name=newName.trim();save();renderAll();
    toast('企画名を変更しました','ok');
  }
}
window.editKikakuNameInline=editKikakuNameInline;

function startEditGou(td){
  if(td.querySelector('input,select'))return;
  var f=td.dataset.f,tid=td.dataset.t,kid=td.dataset.k,tp=td.dataset.tp;
  var t=findTaskInGou(kid,tid);if(!t)return;
  var val=t[f]||'';
  var inp;
  if(tp==='assignee'){
    inp=document.createElement('select');
    inp.innerHTML='<option value="">— 未割当 —</option>';
    var p=getProj();var pmems=getProjMembers(p);
    pmems.forEach(function(m){
      inp.innerHTML+='<option value="'+escH(m.name)+'"'+(m.name===val?' selected':'')+'>'+escH(m.name)+'</option>';
    });
  } else if(tp==='date'){
    inp=document.createElement('input');inp.type='date';inp.value=val;
  } else if(tp==='number'){
    inp=document.createElement('input');inp.type='number';inp.min='0';inp.step='0.25';inp.value=val;
  } else {
    inp=document.createElement('input');inp.type='text';inp.value=val;
  }
  td.textContent='';td.appendChild(inp);inp.focus();
  if(inp.select)inp.select();
  function commit(){
    var nv=inp.value.trim();
    if(tp==='number')nv=parseFloat(nv)||0;
    if(tp==='date'){
      if(f==='planStart'&&nv&&t.planEnd&&nv>t.planEnd){t.planEnd=nv}
      if(f==='planEnd'&&nv&&t.planStart&&nv<t.planStart){toast('終了日は開始日以降にしてください','err');inp.value=t[f]||'';renderAll();return}
    }
    if(f==='assignee'&&nv!==t[f])recordAssigneeChange(t,t[f],nv);
    t[f]=nv;save();renderAll();
  }
  inp.addEventListener('blur',commit);
  inp.addEventListener('keydown',function(e){
    if(e.key==='Enter'){e.preventDefault();inp.blur()}
    if(e.key==='Escape'){inp.value=t[f]||'';inp.blur()}
  });
}

function startEdit(td){
  if(td.querySelector('input,select'))return;
  var f=td.dataset.f,tid=td.dataset.t,tp=td.dataset.tp;
  var k=getKikaku();if(!k)return;
  var t=k.tasks.find(function(x){return x.id===tid});if(!t)return;
  var val=t[f]||'';
  var inp;
  if(tp==='assignee'){
    inp=document.createElement('select');
    inp.innerHTML='<option value="">— 未割当 —</option>';
    var p=getProj();
    var pmems=getProjMembers(p);
    pmems.forEach(function(m){
      inp.innerHTML+='<option value="'+escH(m.name)+'"'+(m.name===val?' selected':'')+'>'+escH(m.name)+'</option>';
    });
  } else if(tp==='date'){
    inp=document.createElement('input');inp.type='date';inp.value=val;
  } else if(tp==='number'){
    inp=document.createElement('input');inp.type='number';inp.min='0';inp.step='0.25';inp.value=val;
  } else {
    inp=document.createElement('input');inp.type='text';inp.value=val;
  }
  td.textContent='';td.appendChild(inp);inp.focus();
  if(inp.select)inp.select();
  function commit(){
    var nv=inp.value.trim();
    if(tp==='number')nv=parseFloat(nv)||0;
    if(tp==='date'){
      if(f==='planStart'&&nv&&t.planEnd&&nv>t.planEnd){t.planEnd=nv}
      if(f==='planEnd'&&nv&&t.planStart&&nv<t.planStart){toast('終了日は開始日以降にしてください','err');inp.value=t[f]||'';renderAll();return}
    }
    if(f==='assignee'&&nv!==t[f])recordAssigneeChange(t,t[f],nv);
    t[f]=nv;save();renderAll();
  }
  inp.addEventListener('blur',commit);
  inp.addEventListener('keydown',function(e){
    if(e.key==='Enter'){e.preventDefault();inp.blur()}
    if(e.key==='Escape'){inp.value=t[f]||'';inp.blur()}
  });
}

/* ===== SCHEDULE MATRIX ===== */
var DAYS_JP=['日','月','火','水','木','金','土'];

function buildScheduleMatrix(kikakus,allTasks){
  var allD=[];
  allTasks.forEach(function(t){
    if(t.planStart)allD.push(parseD(t.planStart));
    if(t.planEnd)allD.push(parseD(t.planEnd));
    if(t.actualStart)allD.push(parseD(t.actualStart));
    if(t.actualEnd)allD.push(parseD(t.actualEnd));
  });
  if(!allD.length)return null;
  var minD=new Date(Math.min.apply(null,allD));
  var maxD=new Date(Math.max.apply(null,allD));
  minD.setHours(0,0,0,0);maxD.setHours(0,0,0,0);
  var totalDays=diffD(minD,maxD)+1;
  if(totalDays<1)totalDays=1;
  if(totalDays>200)totalDays=200;
  var todayISO=todayS();
  var todayD=parseD(todayISO);
  var dates=[];
  for(var di=0;di<totalDays;di++){
    var d=addD(minD,di);
    var iso=fmtISO(d);
    var dow=d.getDay();
    var twoWkISO=fmtISO(addD(todayD,14));
    var isNearDeadline=iso>todayISO&&iso<=twoWkISO;
    var lbl=(d.getMonth()+1)+'/'+d.getDate()+'('+DAYS_JP[dow]+')';
    if(iso===todayISO)lbl='▶ '+lbl+' 今日';
    dates.push({date:d,iso:iso,dow:dow,label:lbl,isWeekend:dow===0||dow===6,isHoliday:isHoliday(iso),isToday:iso===todayISO,isNearDeadline:isNearDeadline});
  }
  var matrix={};
  kikakus.forEach(function(k){
    matrix[k.id]={};
    k.tasks.forEach(function(t){
      if(!t.planStart||!t.planEnd)return;
      var ps=parseD(t.planStart),pe=parseD(t.planEnd);
      var sd=diffD(minD,ps),ed=diffD(minD,pe);
      for(var di2=Math.max(0,sd);di2<=Math.min(totalDays-1,ed);di2++){
        var key=dates[di2].iso;
        if(!matrix[k.id][key])matrix[k.id][key]=[];
        matrix[k.id][key].push(t);
      }
    });
  });
  return {dates:dates,matrix:matrix,kikakus:kikakus};
}

function renderScheduleMatrixHTML(data){
  if(!data)return '<div style="padding:1rem;color:var(--text-muted)">日付データがありません</div>';
  var kLen=data.kikakus.length;
  // Sort kikakus by page order for schedule
  var schedSorted=data.kikakus.slice().sort(function(a,b){
    var pa=parsePageRange((a.meta&&a.meta.pageNum)?a.meta.pageNum:'');
    var pb=parsePageRange((b.meta&&b.meta.pageNum)?b.meta.pageNum:'');
    var sa=pa?(pa.start!==null?pa.start:99999):99999;
    var sb=pb?(pb.start!==null?pb.start:99999):99999;
    return sa-sb;
  });
  data.kikakus=schedSorted;
  var h='<div class="sched-wrap-outer"><div class="sched-wrap"><table class="sched"><thead>';
  // Row 1: Page number + Page count (primary)
  h+='<tr><th rowspan="3" style="min-width:80px">日付</th>';
  data.kikakus.forEach(function(k){
    var pgStr=(k.meta&&k.meta.pageNum)?k.meta.pageNum:'';
    var pr=parsePageRange(pgStr);
    var pgCount=pr&&pr.count?pr.count+'P':'';
    var bgClr=(pr&&pr.isCover)?'#fef3c7':'#eef2ff';
    var txtClr=(pr&&pr.isCover)?'#92400e':'#1e40af';
    if(!pgStr){bgClr='var(--surface2)';txtClr='var(--text-dim)'}
    h+='<th colspan="2" style="text-align:center;padding:.3rem .3rem;background:'+bgClr+';color:'+txtClr+';font-size:.75rem;font-weight:800;border-bottom:2px solid '+txtClr+'40">';
    h+=(pgStr?escH(pgStr):'—');
    if(pgCount)h+=' <span style="font-size:.7rem;font-weight:400;opacity:.6">'+pgCount+'</span>';
    h+='</th>';
  });
  h+='</tr>';
  // Row 2: Kikaku name (subtitle)
  h+='<tr>';
  data.kikakus.forEach(function(k){
    var kName=k.name.replace(/\s*\([^)]*\)$/,'');
    h+='<th colspan="2" style="text-align:center;font-size:.75rem;font-weight:400;color:var(--text-muted);padding:.15rem .3rem;background:var(--surface2);white-space:normal;word-break:break-all" title="'+escH(k.name)+'">'+escH(kName)+'</th>';
  });
  h+='</tr>';
  // Row 3: 担当者 / タスク
  h+='<tr>';
  data.kikakus.forEach(function(){
    h+='<th style="min-width:80px;font-size:.6rem;padding:.1rem .3rem">担当者</th>';
    h+='<th style="min-width:120px;font-size:.6rem;padding:.1rem .3rem">タスク</th>';
  });
  h+='</tr></thead><tbody>';
  var startMatrix={};
  data.kikakus.forEach(function(k){
    startMatrix[k.id]={};
    k.tasks.forEach(function(t){
      if(!t.planStart)return;
      var key=t.planStart;
      if(!startMatrix[k.id][key])startMatrix[k.id][key]=[];
      startMatrix[k.id][key].push(t);
    });
  });
  data.dates.forEach(function(dr){
    var cls=dr.isToday?' today':(dr.isHoliday?' holiday':(dr.isWeekend?' weekend':''));
    if(dr.isNearDeadline&&!dr.isToday)cls+=' near-deadline';
    h+='<tr class="'+cls.trim()+'">';
    h+='<td>'+dr.label+'</td>';
    data.kikakus.forEach(function(k){
      var tasks=startMatrix[k.id][dr.iso]||[];
      var spanTasks=data.matrix[k.id][dr.iso]||[];
      h+='<td style="vertical-align:top;padding:.2rem .3rem">';
      if(tasks.length){
        tasks.forEach(function(t){
          var mem=getMember(t.assignee);
          var roleColor=getRoleColor(mem);
          var extraStyle='';
          if(t.status==='completed')extraStyle='opacity:.5;text-decoration:line-through;';
          h+='<div style="font-size:.7rem;margin-bottom:2px;display:flex;align-items:center;gap:3px;'+extraStyle+'">';
          if(mem){
            h+='<span class="assignee-dot" style="background:'+roleColor+';width:8px;height:8px"></span>';
            h+='<span style="color:'+roleColor+';font-weight:600;white-space:nowrap">'+escH(t.assignee)+'</span>';
          } else {
            h+='<span style="color:var(--text-dim);font-size:.65rem">未割当</span>';
          }
          h+='</div>';
        });
      } else if(spanTasks.length){
        h+='<div style="font-size:.6rem;color:var(--text-dim);text-align:center">│</div>';
      }
      h+='</td>';
      h+='<td data-date="'+dr.iso+'" data-kid="'+k.id+'" ondragover="schedDragOver(event)" ondragleave="schedDragLeave(event)" ondrop="schedDrop(event)" style="vertical-align:top;padding:.2rem .3rem;cursor:pointer" onclick="schedCellClick(event,\''+k.id+'\',\''+dr.iso+'\')">';
      if(tasks.length){
        tasks.forEach(function(t){
          var mem=getMember(t.assignee);
          var roleColor=getRoleColor(mem);
          var bgAlpha='0.15';
          var borderColor=roleColor;
          var extraStyle='';
          if(t.status==='completed'){bgAlpha='0.06';extraStyle='text-decoration:line-through;opacity:.5;'}
          var dur='';
          if(t.planStart&&t.planEnd){var dd=diffD(parseD(t.planStart),parseD(t.planEnd))+1;if(dd>1)dur=' <span style="font-size:.65rem;color:var(--text-dim)">('+dd+'日)</span>'}
          h+='<div class="sched-task" draggable="true" data-tid="'+t.id+'" onclick="openSchedEdit(this,\''+t.id+'\')" ondragstart="schedDragStart(event,\''+t.id+'\')" ondragend="schedDragEnd(event)" style="border-left-color:'+borderColor+';background:'+hexToRgba(roleColor,bgAlpha)+';'+extraStyle+'">';
          h+='<div style="display:flex;align-items:center;gap:4px">';
          h+='<span class="sbadge '+t.status+'" style="font-size:.65rem;padding:.05rem .25rem;cursor:pointer" onclick="event.stopPropagation();cycleStatusGlobal(\''+t.id+'\')" title="クリックでステータス変更">'+SLA[t.status]+'</span>';
          h+='<span style="font-size:.7rem;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escH(t.name)+'</span>';
          h+=dur;
          h+='</div></div>';
        });
      } else if(spanTasks.length){
        spanTasks.forEach(function(t){
          var mem2=getMember(t.assignee);
          var rc2=getRoleColor(mem2);
          var bgA2=t.status==='completed'?'0.04':'0.08';
          h+='<div style="height:4px;border-radius:2px;margin:2px 0;background:'+hexToRgba(rc2,bgA2)+';border-left:2px solid '+rc2+'" title="'+escH(t.name)+'"></div>';
        });
      }
      h+='</td>';
    });
    h+='</tr>';
  });
  h+='</tbody></table></div></div>';
  return h;
}

/* ===== SCHEDULE EDIT POPOVER ===== */
var _schedPopover=null;
function closeSchedEdit(){
  if(_schedPopover&&_schedPopover.parentNode)_schedPopover.parentNode.removeChild(_schedPopover);
  _schedPopover=null;
}

function openSchedEdit(el,tid){
  closeSchedEdit();
  var foundTask=null,foundProj=null;
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    if(t.id===tid){foundTask=t;foundProj=p}
  })})})});
  if(!foundTask)return;
  var t=foundTask;
  var rect=el.getBoundingClientRect();
  var pop=document.createElement('div');
  pop.className='sched-popover';
  var left=rect.right+8;
  var top=rect.top;
  if(left+300>window.innerWidth)left=rect.left-270;
  if(top+300>window.innerHeight)top=window.innerHeight-310;
  if(top<10)top=10;
  pop.style.left=left+'px';
  pop.style.top=top+'px';
  var pmems=foundProj?getProjMembers(foundProj):S.members;
  var ih='<div style="font-size:.8rem;font-weight:700;margin-bottom:.6rem;display:flex;align-items:center;justify-content:space-between">';
  ih+=escH(t.name)+'<button onclick="closeSchedEdit()" style="font-size:.9rem;color:var(--text-muted)">✕</button></div>';
  ih+='<div class="sp-row"><label>担当者</label><select id="spAssignee">';
  ih+='<option value="">— 未割当 —</option>';
  pmems.forEach(function(m){
    ih+='<option value="'+escH(m.name)+'"'+(m.name===t.assignee?' selected':'')+'>'+escH(m.name)+' ('+escH(RLAB[m.role]||'')+')</option>';
  });
  ih+='</select></div>';
  ih+='<div class="sp-row"><label>ステータス</label><select id="spStatus">';
  SL.forEach(function(s){ih+='<option value="'+s+'"'+(s===t.status?' selected':'')+'>'+SLA[s]+'</option>'});
  ih+='</select></div>';
  ih+='<div class="sp-row" style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem">';
  ih+='<div><label>予定開始</label><input type="date" id="spPlanStart" value="'+(t.planStart||'')+'"></div>';
  ih+='<div><label>予定終了</label><input type="date" id="spPlanEnd" value="'+(t.planEnd||'')+'"></div>';
  ih+='</div>';
  ih+='<div class="sp-row" style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem">';
  ih+='<div><label>実績開始</label><input type="date" id="spActStart" value="'+(t.actualStart||'')+'"></div>';
  ih+='<div><label>実績終了</label><input type="date" id="spActEnd" value="'+(t.actualEnd||'')+'"></div>';
  ih+='</div>';
  ih+='<div class="sp-row"><label>備考</label><input type="text" id="spNote" value="'+escH(t.note||'')+'" placeholder="備考..."></div>';
  ih+='<div class="sp-actions">';
  ih+='<button class="btn-s" onclick="closeSchedEdit()">キャンセル</button>';
  ih+='<button class="btn-p" onclick="saveSchedEdit(\''+t.id+'\')">保存</button>';
  ih+='</div>';
  pop.innerHTML=ih;
  document.body.appendChild(pop);
  _schedPopover=pop;
  setTimeout(function(){
    document.addEventListener('mousedown',_schedOutsideClick);
  },50);
}
window.openSchedEdit=openSchedEdit;

function _schedOutsideClick(e){
  if(_schedPopover&&!_schedPopover.contains(e.target)&&!e.target.closest('.sched-task')){
    closeSchedEdit();
    document.removeEventListener('mousedown',_schedOutsideClick);
  }
}

function cycleStatusGlobal(tid){
  var foundTask=null;
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    if(t.id===tid)foundTask=t;
  })})})});
  if(!foundTask)return;
  var idx=SL.indexOf(foundTask.status);
  foundTask.status=SL[(idx+1)%SL.length];
  if(foundTask.status==='in_progress'&&!foundTask.actualStart)foundTask.actualStart=todayS();
  if(foundTask.status==='completed'&&!foundTask.actualEnd)foundTask.actualEnd=todayS();
  save();renderAll();
}
window.cycleStatusGlobal=cycleStatusGlobal;

function saveSchedEdit(tid){
  var foundTask=null;
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    if(t.id===tid)foundTask=t;
  })})})});
  if(!foundTask)return;
  var t=foundTask;
  var newAssignee=(document.getElementById('spAssignee')||{}).value||'';
  if(newAssignee!==t.assignee)recordAssigneeChange(t,t.assignee,newAssignee);
  t.assignee=newAssignee;
  t.status=(document.getElementById('spStatus')||{}).value||t.status;
  t.planStart=(document.getElementById('spPlanStart')||{}).value||t.planStart;
  t.planEnd=(document.getElementById('spPlanEnd')||{}).value||t.planEnd;
  t.actualStart=(document.getElementById('spActStart')||{}).value||'';
  t.actualEnd=(document.getElementById('spActEnd')||{}).value||'';
  t.note=(document.getElementById('spNote')||{}).value||'';
  if(t.status==='in_progress'&&!t.actualStart)t.actualStart=todayS();
  if(t.status==='completed'&&!t.actualEnd)t.actualEnd=todayS();
  save();
  closeSchedEdit();
  document.removeEventListener('mousedown',_schedOutsideClick);
  renderAll();
  toast('更新しました','ok');
}
window.saveSchedEdit=saveSchedEdit;
window.closeSchedEdit=closeSchedEdit;

function hexToRgba(hex,alpha){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+','+alpha+')';
}

/* ===== SCHEDULE VIEW (per kikaku) ===== */
function renderScheduleMatrix(){
  var k=getKikaku(),el=document.getElementById('viewContent');if(!el)return;
  var g=getGou();
  if(!k){el.innerHTML='<div class="dash"><p style="color:var(--text-muted)">企画が選択されていません</p></div>';return}
  var addBtns='<div style="display:flex;gap:.4rem;padding:.5rem 1rem;flex-wrap:wrap">';
  if(g){
    g.kikakus.forEach(function(kk){
      addBtns+='<button class="tbtn" onclick="addTaskFromSchedule(\''+kk.id+'\')" style="font-size:.7rem">＋ '+escH(kk.name)+'に工程追加</button>';
    });
  } else {
    addBtns+='<button class="tbtn" onclick="addTaskFromSchedule(\''+k.id+'\')" style="font-size:.7rem">＋ 工程を追加</button>';
  }
  addBtns+='</div>';
  if(!k.tasks.length){
    el.innerHTML='<div class="dash"><p style="color:var(--text-muted)">表示するタスクがありません</p></div>'+addBtns;
    return;
  }
  var kikakuList=g?g.kikakus.filter(function(kk){return kk.tasks.length>0}):[];
  if(!kikakuList.length)kikakuList=[k];
  var allTasks=[];
  kikakuList.forEach(function(kk){kk.tasks.forEach(function(t){allTasks.push(t)})});
  var data=buildScheduleMatrix(kikakuList,allTasks);
  el.innerHTML=renderContextHeader()+renderScheduleMatrixHTML(data)+addBtns;
}

function addTaskFromSchedule(kid){
  var foundK=null;
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){
    if(k.id===kid)foundK=k;
  })})});
  if(!foundK){
    var g2=getGou();
    if(g2){foundK=g2.kikakus.find(function(x){return x.id===kid})}
  }
  if(!foundK)return;
  var name=prompt('新規工程名を入力してください','新規工程');
  if(name===null||!name.trim())return;
  foundK.tasks.push(mkTask({name:name.trim(),planStart:todayS(),planEnd:todayS()}));
  save();renderAll();
  toast('工程「'+name.trim()+'」を追加しました','ok');
}
window.addTaskFromSchedule=addTaskFromSchedule;

/* ===== SCHEDULE CELL CLICK REGISTRATION ===== */
function schedCellClick(event,kid,dateISO){
  if(event.target.closest('.sched-task'))return;
  if(event.target.closest('.sbadge'))return;
  closeSchedEdit();
  openSchedCellRegister(event.currentTarget,kid,dateISO);
}
window.schedCellClick=schedCellClick;

var _schedCellPop=null;
function closeSchedCellRegister(){
  if(_schedCellPop&&_schedCellPop.parentNode)_schedCellPop.parentNode.removeChild(_schedCellPop);
  _schedCellPop=null;
}
window.closeSchedCellRegister=closeSchedCellRegister;

function openSchedCellRegister(td,kid,dateISO){
  closeSchedCellRegister();
  var rect=td.getBoundingClientRect();
  var pop=document.createElement('div');
  pop.className='sched-popover';
  var left=rect.right+8;var top=rect.top;
  if(left+300>window.innerWidth)left=rect.left-270;
  if(top+300>window.innerHeight)top=window.innerHeight-310;
  if(top<10)top=10;
  pop.style.left=left+'px';pop.style.top=top+'px';
  var foundProj=null;
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){
    if(k.id===kid)foundProj=p;
  })})});
  var pmems=foundProj?getProjMembers(foundProj):S.members;
  var ih='<div style="font-size:.8rem;font-weight:700;margin-bottom:.6rem;display:flex;align-items:center;justify-content:space-between">';
  ih+='新規工程登録<button onclick="closeSchedCellRegister()" style="font-size:.9rem;color:var(--text-muted)">✕</button></div>';
  ih+='<div class="sp-row"><label>工程名</label><input type="text" id="scRegName" placeholder="工程名..." value=""></div>';
  ih+='<div class="sp-row"><label>担当者</label><select id="scRegAssignee"><option value="">— 未割当 —</option>';
  pmems.forEach(function(m){ih+='<option value="'+escH(m.name)+'">'+escH(m.name)+' ('+escH(RLAB[m.role]||'')+')</option>'});
  ih+='</select></div>';
  ih+='<div class="sp-row" style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem">';
  ih+='<div><label>開始日</label><input type="date" id="scRegStart" value="'+dateISO+'"></div>';
  ih+='<div><label>終了日</label><input type="date" id="scRegEnd" value="'+dateISO+'"></div>';
  ih+='</div>';
  ih+='<div class="sp-actions">';
  ih+='<button class="btn-s" onclick="closeSchedCellRegister()">キャンセル</button>';
  ih+='<button class="btn-p" onclick="saveSchedCellRegister(\''+kid+'\')">登録</button>';
  ih+='</div>';
  pop.innerHTML=ih;
  document.body.appendChild(pop);
  _schedCellPop=pop;
  setTimeout(function(){var inp=document.getElementById('scRegName');if(inp)inp.focus()},50);
}

function saveSchedCellRegister(kid){
  var name=(document.getElementById('scRegName').value||'').trim();
  if(!name){toast('工程名を入力してください','warn');return}
  var assignee=document.getElementById('scRegAssignee').value;
  var planStart=document.getElementById('scRegStart').value;
  var planEnd=document.getElementById('scRegEnd').value;
  var foundK=null;
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){
    if(k.id===kid)foundK=k;
  })})});
  if(!foundK){var g2=getGou();if(g2)foundK=g2.kikakus.find(function(x){return x.id===kid})}
  if(!foundK){toast('企画が見つかりません','warn');return}
  foundK.tasks.push(mkTask({name:name,assignee:assignee,planStart:planStart,planEnd:planEnd}));
  save();closeSchedCellRegister();renderAll();
  toast('工程「'+name+'」を登録しました','ok');
}
window.saveSchedCellRegister=saveSchedCellRegister;

/* ===== MEMBERS VIEW ===== */
var membersTab='list';
var memberSearchQuery='';
function switchMembersTab(tab){membersTab=tab;memberSearchQuery='';renderMembers()}
window.switchMembersTab=switchMembersTab;
function updateMemberSearch(val){memberSearchQuery=val;var c=document.getElementById('memberListContainer');if(c){c.innerHTML=renderMembersListContent()}else{renderMembers()}}
window.updateMemberSearch=updateMemberSearch;
function normalizeMemberSearch(s){return s.toLowerCase().replace(/[\uff01-\uff5e]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-0xFEE0)})}

function renderMembers(){
  if(memberDetailId){renderMemberDetailView();return}
  var el=document.getElementById('membersArea');if(!el)return;
  var h='<div class="members-view"><div class="dash-title">チームメンバー</div>';
  h+='<div class="tab-group" style="margin-bottom:.75rem">';
  h+='<button class="tab-btn'+(membersTab==='list'?' active':'')+'" onclick="switchMembersTab(\'list\')">👤 一覧</button>';
  h+='<button class="tab-btn'+(membersTab==='daily'?' active':'')+'" onclick="switchMembersTab(\'daily\')">📅 日別</button>';
  h+='<button class="tab-btn'+(membersTab==='workload'?' active':'')+'" onclick="switchMembersTab(\'workload\')">📊 稼働状況</button>';
  h+='</div>';
  if(membersTab==='list') h+=renderMembersListTab();
  else if(membersTab==='daily') h+=renderMembersDailyTab();
  else h+=renderMemberWorkload();
  h+='</div>';
  el.innerHTML=h;
}

function renderMembersListTab(){
  var h='<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">';
  h+='<button class="tbtn" onclick="showNewMemberModal()">＋ メンバーを追加</button>';
  h+='<input type="text" id="memberSearchInput" placeholder="名前で検索..." oninput="updateMemberSearch(this.value)" value="'+escH(memberSearchQuery)+'" style="font-size:.78rem;padding:.3rem .6rem;border-radius:var(--radius-sm);border:1px solid var(--border);width:200px">';
  h+='</div>';
  h+='<div id="memberListContainer">'+renderMembersListContent()+'</div>';
  return h;
}
function renderMembersListContent(){
  if(!S.members.length){
    return'<div class="info-card"><p style="font-size:.78rem;color:var(--text-muted)">まだメンバーが登録されていません。</p></div>';
  }
  var h='';
  var searchNorm=normalizeMemberSearch(memberSearchQuery);
  var filteredMembers=S.members.filter(function(m){
    if(!searchNorm)return true;
    return normalizeMemberSearch(m.name).indexOf(searchNorm)>=0;
  });
  var groups=[
    {label:'ディレクション（ディレクター・編集・デスク・校閲）',roles:['director','editor','desk','proofreader'],members:[]},
    {label:'クリエイティブ（デザイナー・ライター・カメラマン）',roles:['designer','writer','camera'],members:[]},
    {label:'その他（営業・その他）',roles:['sales','other'],members:[]}
  ];
  filteredMembers.forEach(function(m){
    var placed=false;
    groups.forEach(function(g){if(g.roles.indexOf(m.role)>=0){g.members.push(m);placed=true}});
    if(!placed)groups[2].members.push(m);
  });
  var roleOrder={director:0,editor:1,desk:2,proofreader:3,designer:4,writer:5,camera:6,sales:7,other:8};
  groups.forEach(function(g){
    g.members.sort(function(a,b){
      var ra=roleOrder[a.role]||99,rb=roleOrder[b.role]||99;
      return ra!==rb?ra-rb:a.name.localeCompare(b.name,'ja');
    });
  });
  h+='<div style="display:flex;gap:.6rem;margin-bottom:.75rem;flex-wrap:wrap;font-size:.72rem">';
  ROLES.forEach(function(r){h+='<span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;border-radius:50%;background:'+(ROLE_COLORS[r]||'#8b8fa8')+'"></span>'+escH(RLAB[r])+'</span>'});
  h+='</div>';
  if(searchNorm&&!filteredMembers.length){
    h+='<div class="info-card"><p style="font-size:.78rem;color:var(--text-muted)">「'+escH(memberSearchQuery)+'」に一致するメンバーはいません。</p></div>';
    return h;
  }
  groups.forEach(function(g){
    if(!g.members.length)return;
    h+='<div style="margin-bottom:1rem">';
    h+='<div style="font-size:.75rem;font-weight:700;color:var(--text-muted);margin-bottom:.4rem;padding:.2rem .4rem;background:var(--surface2);border-radius:var(--radius-xs)">'+escH(g.label)+' <span style="font-weight:400">('+g.members.length+'名)</span></div>';
    g.members.forEach(function(m){
      var rc=ROLE_COLORS[m.role]||'#8b8fa8';
      h+='<div class="member-card" style="cursor:pointer" onclick="showMemberDetail(\''+m.id+'\')">';
      h+='<div class="member-dot" style="background:'+rc+'"></div>';
      h+='<div class="member-info"><div class="member-name" style="color:'+rc+'">'+escH(m.name)+'</div>';
      h+='<div class="member-role">'+escH(RLAB[m.role]||m.role)+'</div></div>';
      h+='<div class="member-acts"><button onclick="event.stopPropagation();editMemberUI(\''+m.id+'\')">編集</button>';
      h+='<button class="del" onclick="event.stopPropagation();delMemberUI(\''+m.id+'\')">削除</button></div></div>';
    });
    h+='</div>';
  });
  return h;
}

function renderMembersDailyTab(){
  var todayD=parseD(todayS());
  var h='<div style="font-size:.8rem;font-weight:700;margin-bottom:.5rem">📅 日別稼働時間（今後2週間）</div>';
  var stats={};
  S.members.forEach(function(m){stats[m.name]={dailyH:{}}});
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    if(!t.assignee||!stats[t.assignee])return;
    var s=stats[t.assignee];
    if(t.planStart&&t.planEnd&&t.status!=='completed'){
      var ps=parseD(t.planStart),pe=parseD(t.planEnd);
      if(ps&&pe){var days=diffD(ps,pe)+1;if(days<1)days=1;var hPD=(t.estimatedHours||0)/days;
        for(var di=0;di<days&&di<60;di++){var dISO=fmtISO(addD(ps,di));if(!s.dailyH[dISO])s.dailyH[dISO]=0;s.dailyH[dISO]+=hPD}
      }
    }
  })})})});
  var dayCount=14;
  h+='<div style="overflow-x:auto"><table class="tv" style="font-size:.7rem"><thead><tr><th>メンバー</th>';
  var dayDates=[];
  for(var di2=0;di2<dayCount;di2++){
    var dd=addD(todayD,di2);
    var dISO2=fmtISO(dd);dayDates.push(dISO2);
    var dow2=dd.getDay();var isWE=dow2===0||dow2===6;var isHL=isHoliday(dISO2);
    var dayLabel=(dd.getMonth()+1)+'/'+dd.getDate();
    var thStyle='min-width:45px;text-align:center;';
    if(isHL)thStyle+='background:rgba(239,68,68,.12);color:var(--danger)';
    else if(isWE)thStyle+='background:rgba(100,116,139,.15);color:var(--text-muted)';
    h+='<th style="'+thStyle+'">'+dayLabel+'</th>';
  }
  h+='<th>計</th></tr></thead><tbody>';
  S.members.forEach(function(m){
    var s=stats[m.name];if(!s)return;
    var hasAny=false;dayDates.forEach(function(d){if(s.dailyH[d])hasAny=true});
    if(!hasAny)return;
    var rc=getRoleColor(m);var weekTotal=0;
    h+='<tr><td style="cursor:pointer" onclick="showMemberDetail(\''+m.id+'\')"><span class="assignee-dot" style="background:'+rc+'"></span><span style="color:'+rc+';font-weight:600">'+escH(m.name)+'</span></td>';
    dayDates.forEach(function(dISO){
      var dh=s.dailyH[dISO]||0;weekTotal+=dh;
      var bg=dh>8?'var(--danger-dim)':dh>4?'var(--warning-dim)':dh>0?'var(--accent-dim)':'';
      var clr=dh>8?'var(--danger)':dh>4?'var(--warning)':dh>0?'var(--accent-light)':'var(--text-dim)';
      h+='<td style="text-align:center;background:'+bg+';color:'+clr+';font-weight:'+(dh>0?'600':'400')+'">'+(dh>0?dh.toFixed(1):'-')+'</td>';
    });
    h+='<td style="font-weight:700;text-align:center">'+weekTotal.toFixed(1)+'</td></tr>';
  });
  h+='</tbody></table></div>';
  return h;
}
/* ===== メンバー詳細ページ（Googleカレンダー風） ===== */
var memberDetailId=null;
var memberDetailWeekOffset=0;
function showMemberDetail(mid){
  memberDetailId=mid;memberDetailWeekOffset=0;
  renderMemberDetailView();
}
window.showMemberDetail=showMemberDetail;

function memberDetailNav(dir){
  memberDetailWeekOffset+=dir;
  renderMemberDetailView();
}
window.memberDetailNav=memberDetailNav;

var memberDetailViewMode='calendar'; // 'calendar' or 'timeline'
function switchMemberDetailMode(mode){memberDetailViewMode=mode;renderMemberDetailView()}
window.switchMemberDetailMode=switchMemberDetailMode;

function closeMemberDetail(){memberDetailId=null;renderMembers()}
window.closeMemberDetail=closeMemberDetail;

function memberDetailGoToday(){memberDetailWeekOffset=0;renderMemberDetailView()}
window.memberDetailGoToday=memberDetailGoToday;

function renderMemberDetailView(){
  var el=document.getElementById('membersArea');if(!el)return;
  var m=getMemberById(memberDetailId);if(!m){memberDetailId=null;renderMembers();return}
  var rc=getRoleColor(m);

  // Collect all tasks for this member
  var tasks=[];
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    if(t.assignee===m.name)tasks.push({task:t,proj:p.name,gou:g.name,kikaku:k.name,tid:t.id});
  })})})});

  // Week range
  var todayD=parseD(todayS());
  var weekStart=addD(todayD,memberDetailWeekOffset*7-todayD.getDay()+1); // Monday
  var days=[];
  for(var i=0;i<7;i++){
    var d=addD(weekStart,i);
    days.push({date:d,iso:fmtISO(d),dow:d.getDay()});
  }

  var h='<div class="members-view">';
  // Header
  h+='<div style="display:flex;align-items:center;gap:.8rem;margin-bottom:1rem">';
  h+='<button class="tbtn" onclick="closeMemberDetail()">← 戻る</button>';
  h+='<div class="member-dot" style="background:'+rc+';width:24px;height:24px"></div>';
  h+='<div><div style="font-size:1rem;font-weight:700;color:'+rc+'">'+escH(m.name)+'</div>';
  h+='<div style="font-size:.72rem;color:var(--text-muted)">'+escH(RLAB[m.role]||m.role)+'</div></div>';
  h+='<div style="margin-left:auto;font-size:.72rem;color:var(--text-muted)">タスク: '+tasks.length+'件（進行中: '+tasks.filter(function(x){return x.task.status==='in_progress'}).length+'）</div>';
  h+='</div>';

  // Week navigation + view toggle
  var weekLabel=fmtD(weekStart)+' 〜 '+fmtD(addD(weekStart,6));
  h+='<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">';
  h+='<button class="tbtn" onclick="memberDetailNav(-1)">◀</button>';
  h+='<button class="tbtn" onclick="memberDetailGoToday()">今週</button>';
  h+='<span style="font-size:.82rem;font-weight:600;min-width:140px;text-align:center">'+weekLabel+'</span>';
  h+='<button class="tbtn" onclick="memberDetailNav(1)">▶</button>';
  h+='<div style="flex:1"></div>';
  h+='<div class="tab-group">';
  h+='<button class="tab-btn'+(memberDetailViewMode==='calendar'?' active':'')+'" onclick="switchMemberDetailMode(\'calendar\')">📅 カレンダー</button>';
  h+='<button class="tab-btn'+(memberDetailViewMode==='timeline'?' active':'')+'" onclick="switchMemberDetailMode(\'timeline\')">⏰ タイムライン</button>';
  h+='</div>';
  h+='</div>';

  if(memberDetailViewMode==='timeline'){
    h+=renderMemberTimeline(m,tasks,days,rc);
  } else {
    h+=renderMemberCalendar(m,tasks,days,rc);
  }

  // Task list summary below
  h+='<div style="margin-top:1.5rem"><div style="font-size:.82rem;font-weight:700;margin-bottom:.5rem">📋 全タスク一覧</div>';
  h+='<table class="tv" style="font-size:.72rem"><thead><tr><th>タスク名</th><th>企画</th><th>予定開始</th><th>予定終了</th><th>工数</th><th>ステータス</th></tr></thead><tbody>';
  var sorted=tasks.slice().sort(function(a,b){return(a.task.planStart||'z').localeCompare(b.task.planStart||'z')});
  sorted.forEach(function(x){
    var t=x.task;
    h+='<tr style="'+(t.status==='completed'?'opacity:.5;text-decoration:line-through':'')+'">';
    h+='<td style="font-weight:600">'+escH(t.name)+'</td>';
    h+='<td style="color:var(--text-muted)">'+escH(x.kikaku)+'</td>';
    h+='<td>'+escH(t.planStart||'-')+'</td><td>'+escH(t.planEnd||'-')+'</td>';
    h+='<td>'+(t.estimatedHours||'-')+'h</td>';
    h+='<td><span class="sbadge '+t.status+'">'+SLA[t.status]+'</span></td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';

  h+='</div>';
  el.innerHTML=h;
}

/* Calendar view (existing block view) */
function renderMemberCalendar(m,tasks,days,rc){
  var DNAMES=['月','火','水','木','金','土','日'];
  var h='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">';
  days.forEach(function(d,i){
    var isWE=d.dow===0||d.dow===6;var isHL=isHoliday(d.iso);var isToday=d.iso===todayS();
    var bgH=isHL?'rgba(239,68,68,.1)':isWE?'rgba(100,116,139,.12)':'var(--surface2)';
    var clrH=isHL?'var(--danger)':isWE?'var(--text-muted)':'var(--text)';
    h+='<div style="background:'+bgH+';padding:.35rem .4rem;text-align:center;font-size:.72rem;font-weight:700;color:'+clrH+'">';
    h+=DNAMES[i]+' '+(d.date.getMonth()+1)+'/'+d.date.getDate();
    if(isToday)h+=' <span style="background:var(--danger);color:#fff;padding:0 4px;border-radius:8px;font-size:.6rem">今日</span>';
    h+='</div>';
  });
  days.forEach(function(d){
    var isWE=d.dow===0||d.dow===6;var isHL=isHoliday(d.iso);var isToday=d.iso===todayS();
    var bg=isHL?'rgba(239,68,68,.04)':isWE?'rgba(100,116,139,.06)':'var(--surface)';
    if(isToday)bg='rgba(220,38,38,.04)';
    h+='<div style="background:'+bg+';min-height:120px;padding:.3rem">';
    var dayTasks=tasks.filter(function(x){var t=x.task;if(!t.planStart||!t.planEnd)return false;return t.planStart<=d.iso&&t.planEnd>=d.iso});
    if(!dayTasks.length){h+='<div style="font-size:.65rem;color:var(--text-dim);text-align:center;padding-top:2rem">—</div>'}
    else{dayTasks.forEach(function(x){
      var t=x.task;var stColor=t.status==='completed'?'var(--success)':t.status==='in_progress'?'var(--accent)':'var(--text-muted)';
      var opacity=t.status==='completed'?'0.5':'1';var txtDeco=t.status==='completed'?'text-decoration:line-through;':'';
      h+='<div onclick="openSchedEdit(this,\''+x.tid+'\')" style="opacity:'+opacity+';padding:.3rem .4rem;margin-bottom:3px;border-radius:var(--radius-xs);border-left:4px solid '+stColor+';background:'+hexToRgba(rc,0.1)+';cursor:pointer;font-size:.68rem;line-height:1.3;'+txtDeco+'">';
      h+='<div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escH(x.proj+' / '+x.kikaku)+'">'+escH(t.name)+'</div>';
      h+='<div style="font-size:.6rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escH(x.kikaku)+'</div>';
      if(t.estimatedHours)h+='<div style="font-size:.65rem;color:var(--text-dim)">'+t.estimatedHours+'h</div>';
      h+='</div>';
    })}
    h+='</div>';
  });
  h+='</div>';
  return h;
}

/* Timeline view (Google Calendar-style hourly slots) */
function renderMemberTimeline(m,tasks,days,rc){
  var DNAMES=['月','火','水','木','金','土','日'];
  var HOURS=[9,10,11,12,13,14,15,16,17,18];
  var mid=m.id;
  if(!S.timeSchedule)S.timeSchedule={};

  var h='<div style="overflow-x:auto">';
  h+='<table style="width:100%;border-collapse:collapse;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:.72rem;table-layout:fixed">';

  // Header row: time | Mon | Tue | ... | Sun
  h+='<thead><tr><th style="background:var(--surface2);border:1px solid var(--border);padding:.35rem .4rem;width:50px;font-size:.65rem;color:var(--text-muted);position:sticky;left:0;z-index:5">時間</th>';
  days.forEach(function(d,i){
    var isWE=d.dow===0||d.dow===6;var isHL=isHoliday(d.iso);var isToday=d.iso===todayS();
    var bgH=isHL?'rgba(239,68,68,.12)':isWE?'rgba(100,116,139,.15)':'var(--surface2)';
    var clrH=isHL?'var(--danger)':isWE?'var(--text-muted)':'var(--text)';
    h+='<th style="background:'+bgH+';border:1px solid var(--border);padding:.35rem .4rem;text-align:center;font-size:.68rem;font-weight:700;color:'+clrH+'">';
    h+=DNAMES[i]+' '+(d.date.getMonth()+1)+'/'+d.date.getDate();
    if(isToday)h+=' <span style="background:var(--danger);color:#fff;padding:0 3px;border-radius:6px;font-size:.65rem">今日</span>';
    h+='</th>';
  });
  h+='</tr></thead><tbody>';

  // Hour rows
  HOURS.forEach(function(hour){
    var isLunch=hour===12;
    h+='<tr>';
    h+='<td style="border:1px solid var(--border);padding:.2rem .3rem;font-size:.65rem;font-weight:600;color:var(--text-muted);text-align:center;background:'+(isLunch?'rgba(217,119,6,.06)':'var(--surface)')+';position:sticky;left:0;z-index:5">'+p2(hour)+':00</td>';

    days.forEach(function(d){
      var isWE=d.dow===0||d.dow===6;var isHL=isHoliday(d.iso);var isToday=d.iso===todayS();
      var cellBg=isHL?'rgba(239,68,68,.03)':isWE?'rgba(100,116,139,.05)':isLunch?'rgba(217,119,6,.03)':'var(--surface)';
      if(isToday)cellBg='rgba(220,38,38,.03)';

      // Check if this slot has a scheduled task
      var schedKey=mid+':'+d.iso;
      var slotData=getTimeSlot(schedKey,hour);

      if(slotData){
        // Find task info
        var taskInfo=tasks.find(function(x){return x.tid===slotData.taskId});
        if(taskInfo){
          var t=taskInfo.task;
          var stColor=t.status==='completed'?'var(--success)':t.status==='in_progress'?'var(--accent)':'var(--text-muted)';
          h+='<td style="border:1px solid var(--border);padding:2px;background:'+cellBg+';vertical-align:top">';
          h+='<div style="padding:.2rem .3rem;border-radius:var(--radius-xs);border-left:3px solid '+stColor+';background:'+hexToRgba(rc,0.12)+';cursor:pointer;font-size:.62rem;line-height:1.25;height:100%" onclick="showTimeSlotMenu(\''+schedKey+'\','+hour+',\''+d.iso+'\',\''+mid+'\')">';
          h+='<div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escH(t.name)+'</div>';
          h+='<div style="font-size:.65rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escH(taskInfo.kikaku)+'</div>';
          h+='</div></td>';
        } else {
          // Task no longer valid, render empty
          h+='<td style="border:1px solid var(--border);padding:2px;background:'+cellBg+';cursor:pointer" onclick="showTimeSlotPicker(\''+schedKey+'\','+hour+',\''+d.iso+'\',\''+mid+'\')">';
          h+='<div style="height:28px"></div></td>';
        }
      } else {
        h+='<td style="border:1px solid var(--border);padding:2px;background:'+cellBg+';cursor:pointer" onclick="showTimeSlotPicker(\''+schedKey+'\','+hour+',\''+d.iso+'\',\''+mid+'\')">';
        h+='<div style="height:28px"></div></td>';
      }
    });
    h+='</tr>';
  });

  h+='</tbody></table></div>';

  // Unscheduled tasks for this week (tasks active this week but not placed in timeline)
  var weekStart=days[0].iso,weekEnd=days[6].iso;
  var activeTasks=tasks.filter(function(x){
    var t=x.task;if(t.status==='completed')return false;
    if(!t.planStart||!t.planEnd)return false;
    return t.planEnd>=weekStart&&t.planStart<=weekEnd;
  });
  var scheduledTids={};
  days.forEach(function(d){
    var schedKey=mid+':'+d.iso;
    var slots=S.timeSchedule[schedKey];
    if(slots){slots.forEach(function(sl){scheduledTids[sl.taskId]=true})}
  });
  var unscheduled=activeTasks.filter(function(x){return!scheduledTids[x.tid]});

  if(unscheduled.length){
    h+='<div style="margin-top:.75rem;padding:.5rem;background:var(--surface2);border-radius:var(--radius-sm)">';
    h+='<div style="font-size:.72rem;font-weight:700;color:var(--text-muted);margin-bottom:.4rem">📌 未配置タスク（クリックで時間割に追加）</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:4px">';
    unscheduled.forEach(function(x){
      var t=x.task;
      var stColor=t.status==='in_progress'?'var(--accent)':'var(--text-muted)';
      h+='<div style="padding:.2rem .5rem;border-radius:var(--radius-xs);border-left:3px solid '+stColor+';background:'+hexToRgba(rc,0.1)+';font-size:.72rem;cursor:pointer" onclick="quickScheduleTask(\''+mid+'\',\''+x.tid+'\')" title="'+escH(x.proj+' / '+x.kikaku)+'">';
      h+='<span style="font-weight:600">'+escH(t.name)+'</span>';
      if(t.estimatedHours)h+=' <span style="color:var(--text-dim)">'+t.estimatedHours+'h</span>';
      h+='</div>';
    });
    h+='</div></div>';
  }

  return h;
}

/* Time schedule helpers */
function getTimeSlot(schedKey,hour){
  var slots=S.timeSchedule[schedKey];
  if(!slots)return null;
  return slots.find(function(s){return s.hour===hour})||null;
}

function setTimeSlot(schedKey,hour,taskId){
  if(!S.timeSchedule[schedKey])S.timeSchedule[schedKey]=[];
  // Remove existing slot at this hour
  S.timeSchedule[schedKey]=S.timeSchedule[schedKey].filter(function(s){return s.hour!==hour});
  if(taskId)S.timeSchedule[schedKey].push({hour:hour,taskId:taskId});
  if(!S.timeSchedule[schedKey].length)delete S.timeSchedule[schedKey];
  save();
}

function removeTimeSlot(schedKey,hour){
  setTimeSlot(schedKey,hour,null);
}

function showTimeSlotPicker(schedKey,hour,dateISO,memberId){
  var m=getMemberById(memberId);if(!m)return;
  // Get tasks active on this date for this member
  var avail=[];
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    if(t.assignee!==m.name||t.status==='completed')return;
    if(t.planStart&&t.planEnd&&t.planStart<=dateISO&&t.planEnd>=dateISO){
      avail.push({tid:t.id,name:t.name,kikaku:k.name});
    }
  })})})});

  if(!avail.length){toast('この日に割り当て可能なタスクがありません','info');return}

  var hm='<div class="modal-hdr"><h2>⏰ '+p2(hour)+':00 にタスクを配置</h2><button onclick="closeModal()">✕</button></div>';
  hm+='<div class="modal-body">';
  hm+='<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.5rem">'+dateISO+' '+p2(hour)+':00 のスロット</div>';
  avail.forEach(function(a){
    hm+='<div class="sitem" style="cursor:pointer;padding:.5rem .6rem" onclick="setTimeSlot(\''+schedKey+'\','+hour+',\''+a.tid+'\');closeModal();renderMemberDetailView()">';
    hm+='<span class="sitem-name" style="font-weight:600">'+escH(a.name)+'</span>';
    hm+='<span style="font-size:.65rem;color:var(--text-muted)">'+escH(a.kikaku)+'</span></div>';
  });
  hm+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">キャンセル</button></div>';
  showModal(hm);
}
window.showTimeSlotPicker=showTimeSlotPicker;

function showTimeSlotMenu(schedKey,hour,dateISO,memberId){
  var slot=getTimeSlot(schedKey,hour);
  var hm='<div class="modal-hdr"><h2>⏰ '+p2(hour)+':00 スロット</h2><button onclick="closeModal()">✕</button></div>';
  hm+='<div class="modal-body">';
  if(slot){
    hm+='<div style="font-size:.78rem;margin-bottom:.5rem">このスロットのタスクを変更または削除できます。</div>';
    hm+='<button class="btn-p" style="width:100%;margin-bottom:.4rem" onclick="removeTimeSlot(\''+schedKey+'\','+hour+');closeModal();renderMemberDetailView()">🗑 このスロットを空にする</button>';
    hm+='<button class="btn-s" style="width:100%" onclick="closeModal();showTimeSlotPicker(\''+schedKey+'\','+hour+',\''+dateISO+'\',\''+memberId+'\')">🔄 別のタスクに変更</button>';
  }
  hm+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">閉じる</button></div>';
  showModal(hm);
}
window.showTimeSlotMenu=showTimeSlotMenu;

function quickScheduleTask(memberId,taskId){
  // Find first available slot in this week
  var todayD=parseD(todayS());
  var weekStart=addD(todayD,memberDetailWeekOffset*7-todayD.getDay()+1);
  var HOURS=[9,10,11,12,13,14,15,16,17,18];
  for(var di=0;di<7;di++){
    var d=addD(weekStart,di);var dISO=fmtISO(d);
    // Check task is active on this day
    var foundTask=null;
    S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
      if(t.id===taskId)foundTask=t;
    })})})});
    if(!foundTask||!foundTask.planStart||!foundTask.planEnd)continue;
    if(foundTask.planStart>dISO||foundTask.planEnd<dISO)continue;

    var schedKey=memberId+':'+dISO;
    for(var hi=0;hi<HOURS.length;hi++){
      if(!getTimeSlot(schedKey,HOURS[hi])){
        setTimeSlot(schedKey,HOURS[hi],taskId);
        renderMemberDetailView();
        toast('「'+foundTask.name+'」を'+dISO+' '+p2(HOURS[hi])+':00に配置','ok');
        return;
      }
    }
  }
  toast('空きスロットがありません','err');
}
window.quickScheduleTask=quickScheduleTask;
window.setTimeSlot=setTimeSlot;
window.removeTimeSlot=removeTimeSlot;
window.renderMemberDetailView=renderMemberDetailView;

function renderMemberWorkload(){
  var h='<div style="margin-top:1.5rem"><div class="dash-title">📊 メンバー稼働状況</div>';

  // Collect per-member stats
  var stats={};
  S.members.forEach(function(m){stats[m.name]={total:0,active:0,completed:0,tasks:[],dailyH:{}}});

  var allDates=[];
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    if(!t.assignee||!stats[t.assignee])return;
    var s=stats[t.assignee];
    s.total++;
    if(t.status==='completed')s.completed++;
    else s.active++;
    s.tasks.push({name:t.name,proj:p.name,kikaku:k.name,planStart:t.planStart,planEnd:t.planEnd,status:t.status,hours:t.estimatedHours||0});

    // Build daily hours map
    if(t.planStart&&t.planEnd&&t.status!=='completed'){
      var ps=parseD(t.planStart),pe=parseD(t.planEnd);
      if(ps&&pe){
        allDates.push(ps);allDates.push(pe);
        var days=diffD(ps,pe)+1;if(days<1)days=1;
        var hPerDay=(t.estimatedHours||0)/days;
        for(var di=0;di<days&&di<60;di++){
          var dISO=fmtISO(addD(ps,di));
          if(!s.dailyH[dISO])s.dailyH[dISO]=0;
          s.dailyH[dISO]+=hPerDay;
        }
      }
    }
  })})})});

  // Summary table
  h+='<table class="tv" style="margin-bottom:1rem"><thead><tr><th>メンバー</th><th>役職</th><th>進行中</th><th>完了</th><th>合計タスク</th><th>稼働時間(h)</th><th>負荷</th></tr></thead><tbody>';
  S.members.forEach(function(m){
    var s=stats[m.name]||{total:0,active:0,completed:0,tasks:[]};
    var totalH=0;s.tasks.forEach(function(t2){totalH+=t2.hours});
    var rc=getRoleColor(m);
    var loadLevel=totalH>60?'danger':totalH>40?'warning':'success';
    h+='<tr>';
    h+='<td><span class="assignee-dot" style="background:'+rc+'"></span><span style="color:'+rc+';font-weight:600">'+escH(m.name)+'</span></td>';
    h+='<td style="font-size:.7rem;color:var(--text-muted)">'+escH(RLAB[m.role]||m.role)+'</td>';
    h+='<td style="color:var(--accent-light);font-weight:600">'+s.active+'</td>';
    h+='<td style="color:var(--success)">'+s.completed+'</td>';
    h+='<td>'+s.total+'</td>';
    h+='<td style="font-weight:600">'+Math.round(totalH)+'h</td>';
    h+='<td><span style="display:inline-block;padding:.1rem .4rem;border-radius:8px;font-size:.65rem;font-weight:600;background:var(--'+loadLevel+'-dim);color:var(--'+loadLevel+')">'+(totalH>60?'過負荷':totalH>40?'注意':'適正')+'</span></td>';
    h+='</tr>';
  });
  h+='</tbody></table>';

  // Daily workload heatmap table (next 14 days)
  var todayD=parseD(todayS());
  var dayCount=14;
  h+='<div style="font-size:.8rem;font-weight:700;margin-bottom:.5rem">📅 日別稼働時間（今後2週間）</div>';
  h+='<div style="overflow-x:auto"><table class="tv" style="font-size:.7rem"><thead><tr><th>メンバー</th>';
  var dayDates=[];
  for(var di2=0;di2<dayCount;di2++){
    var dd=addD(todayD,di2);
    dayDates.push(fmtISO(dd));
    var dow2=dd.getDay();
    var dISO2=fmtISO(dd);
    var isWE=dow2===0||dow2===6;
    var isHL=isHoliday(dISO2);
    var dayLabel=(dd.getMonth()+1)+'/'+dd.getDate();
    var thStyle='min-width:45px;text-align:center;';
    if(isHL)thStyle+='background:rgba(239,68,68,.12);color:var(--danger)';
    else if(isWE)thStyle+='background:rgba(100,116,139,.15);color:var(--text-muted)';
    h+='<th style="'+thStyle+'">'+ dayLabel+'</th>';
  }
  h+='<th>計</th></tr></thead><tbody>';

  S.members.forEach(function(m){
    var s=stats[m.name];if(!s)return;
    var rc=getRoleColor(m);
    var weekTotal=0;
    h+='<tr><td><span class="assignee-dot" style="background:'+rc+'"></span>'+escH(m.name)+'</td>';
    dayDates.forEach(function(dISO){
      var dh=s.dailyH[dISO]||0;
      weekTotal+=dh;
      var bg=dh>8?'var(--danger-dim)':dh>4?'var(--warning-dim)':dh>0?'var(--accent-dim)':'';
      var clr=dh>8?'var(--danger)':dh>4?'var(--warning)':dh>0?'var(--accent-light)':'var(--text-dim)';
      h+='<td style="text-align:center;background:'+bg+';color:'+clr+';font-weight:'+(dh>0?'600':'400')+'">'+(dh>0?dh.toFixed(1):'-')+'</td>';
    });
    h+='<td style="font-weight:700;text-align:center">'+weekTotal.toFixed(1)+'</td></tr>';
  });
  h+='</tbody></table></div>';

  h+='</div>';
  return h;
}
/* ===== CSV IMPORT ===== */
var csvData=null;
var csvHeaders=[];

function showCSVModal(forceType){
  csvData=null;csvHeaders=[];
  var h='<div class="modal-hdr"><h2>📥 CSV取込</h2><button onclick="closeModal()">✕</button></div>';
  h+='<div class="modal-body">';
  if(forceType==='daiwari'){
    h+='<div class="field"><label>取込タイプ</label><select id="csvType" disabled><option value="daiwari" selected>台割CSV（企画名,ページ数,担当者,備考）</option></select></div>';
  } else if(forceType==='schedule'){
    h+='<div class="field"><label>取込タイプ</label><select id="csvType" disabled><option value="schedule" selected>スケジュールCSV（企画名,工程名,予定開始,予定終了,担当者）</option></select></div>';
  } else {
    h+='<div class="field"><label>取込タイプ</label><select id="csvType"><option value="daiwari">台割CSV（企画名,ページ数,担当者,備考）</option><option value="schedule">スケジュールCSV（企画名,工程名,予定開始,予定終了,担当者）</option></select></div>';
  }
  h+='<div class="csv-drop" id="csvDrop" onclick="document.getElementById(\'csvFile\').click()">ここにCSVファイルをドロップ<br>またはクリックして選択<input type="file" id="csvFile" accept=".csv" style="display:none" onchange="handleCSVFile(this.files[0])"></div>';
  h+='<div id="csvPreviewArea"></div>';
  h+='</div>';
  h+='<div class="modal-foot"><button class="btn-s" onclick="closeModal()">キャンセル</button><button class="btn-p" id="csvApplyBtn" onclick="applyCSV()" style="display:none">反映する</button></div>';
  showModal(h);

  setTimeout(function(){
    var drop=document.getElementById('csvDrop');
    if(!drop)return;
    drop.addEventListener('dragover',function(e){e.preventDefault();drop.classList.add('dragover')});
    drop.addEventListener('dragleave',function(){drop.classList.remove('dragover')});
    drop.addEventListener('drop',function(e){
      e.preventDefault();drop.classList.remove('dragover');
      if(e.dataTransfer.files.length)handleCSVFile(e.dataTransfer.files[0]);
    });
  },100);
}
window.showCSVModal=showCSVModal;

function handleCSVFile(file){
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    var buf=new Uint8Array(e.target.result);
    var text;
    // Try UTF-8 first
    try{
      text=new TextDecoder('utf-8',{fatal:true}).decode(buf);
    }catch(err){
      // Fallback to Shift_JIS
      try{text=new TextDecoder('shift_jis').decode(buf)}catch(err2){text=new TextDecoder('utf-8').decode(buf)}
    }
    parseCSVText(text);
  };
  reader.readAsArrayBuffer(file);
}
window.handleCSVFile=handleCSVFile;

function parseCSVText(text){
  var lines=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(function(l){return l.trim()});
  if(!lines.length){toast('CSVが空です','err');return}
  csvHeaders=parseCSVLine(lines[0]);
  csvData=[];
  for(var i=1;i<lines.length;i++){
    csvData.push(parseCSVLine(lines[i]));
  }
  renderCSVPreview();
}

function parseCSVLine(line){
  var result=[],cur='',inQ=false;
  for(var i=0;i<line.length;i++){
    var c=line[i];
    if(inQ){
      if(c==='"'&&i+1<line.length&&line[i+1]==='"'){cur+='"';i++}
      else if(c==='"')inQ=false;
      else cur+=c;
    } else {
      if(c==='"')inQ=true;
      else if(c===','){result.push(cur.trim());cur=''}
      else cur+=c;
    }
  }
  result.push(cur.trim());
  return result;
}

function renderCSVPreview(){
  var area=document.getElementById('csvPreviewArea');if(!area)return;
  if(!csvData||!csvData.length){area.innerHTML='';return}

  var type=document.getElementById('csvType');
  var isD=type&&type.value==='daiwari';

  var h='<div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.3rem">プレビュー（最大5行）</div>';
  h+='<div class="csv-preview"><table><thead><tr>';
  csvHeaders.forEach(function(hd){h+='<th>'+escH(hd)+'</th>'});
  h+='</tr></thead><tbody>';
  var showN=Math.min(csvData.length,5);
  for(var i=0;i<showN;i++){
    h+='<tr>';csvData[i].forEach(function(c){h+='<td>'+escH(c)+'</td>'});h+='</tr>';
  }
  h+='</tbody></table></div>';
  if(csvData.length>5)h+='<div style="font-size:.65rem;color:var(--text-dim)">...他 '+(csvData.length-5)+' 行</div>';

  // Column mapping
  h+='<div style="font-size:.72rem;font-weight:600;margin:.5rem 0 .3rem;color:var(--text-muted)">列マッピング</div>';
  h+='<div class="csv-mapping">';
  if(isD){
    h+=csvMappingSelect('企画名','csvMapKikaku');
    h+=csvMappingSelect('ページ数','csvMapPages');
    h+=csvMappingSelect('担当者','csvMapAssignee');
    h+=csvMappingSelect('備考','csvMapNote');
  } else {
    h+=csvMappingSelect('企画名','csvMapKikaku');
    h+=csvMappingSelect('工程名','csvMapTask');
    h+=csvMappingSelect('予定開始','csvMapStart');
    h+=csvMappingSelect('予定終了','csvMapEnd');
    h+=csvMappingSelect('担当者','csvMapAssignee');
  }
  h+='</div>';

  area.innerHTML=h;
  var applyBtn=document.getElementById('csvApplyBtn');if(applyBtn)applyBtn.style.display='';

  // Auto-map columns by header name
  autoMapColumns(isD);
}

function csvMappingSelect(label,id){
  var h='<label>'+label+': <select id="'+id+'"><option value="-1">— 未選択 —</option>';
  csvHeaders.forEach(function(hd,i){h+='<option value="'+i+'">'+escH(hd)+'</option>'});
  h+='</select></label>';
  return h;
}

function autoMapColumns(isDaiwari){
  var mappings=isDaiwari?
    [{id:'csvMapKikaku',keys:['企画','名前','name']},{id:'csvMapPages',keys:['ページ','page']},{id:'csvMapAssignee',keys:['担当','assignee']},{id:'csvMapNote',keys:['備考','note','メモ']}]:
    [{id:'csvMapKikaku',keys:['企画','name']},{id:'csvMapTask',keys:['工程','タスク','task']},{id:'csvMapStart',keys:['開始','start','予定開始']},{id:'csvMapEnd',keys:['終了','end','予定終了']},{id:'csvMapAssignee',keys:['担当','assignee']}];

  mappings.forEach(function(map){
    var sel=document.getElementById(map.id);if(!sel)return;
    csvHeaders.forEach(function(hd,i){
      var lower=hd.toLowerCase();
      map.keys.forEach(function(k){
        if(lower.indexOf(k.toLowerCase())>=0)sel.value=i;
      });
    });
  });
}

function applyCSV(){
  if(!csvData||!csvData.length){toast('CSVデータがありません','err');return}
  var g=getGou();if(!g){toast('号を選択してください','err');return}

  var type=document.getElementById('csvType');
  var isD=type&&type.value==='daiwari';

  if(isD){
    var kiIdx=parseInt((document.getElementById('csvMapKikaku')||{}).value);
    if(kiIdx<0){toast('企画名列を指定してください','err');return}
    var noteIdx=parseInt((document.getElementById('csvMapNote')||{}).value);
    var assIdx=parseInt((document.getElementById('csvMapAssignee')||{}).value);
    var count=0;
    csvData.forEach(function(row){
      var kname=row[kiIdx];if(!kname)return;
      var k=mkKikaku({name:kname});
      // Add default FMT tasks
      var today2=todayS();var day2=0;
      FMT14.forEach(function(f){
        var dur=Math.max(1,Math.ceil(f.h/8));
        var tsk=mkTask({name:f.n,planStart:doff(today2,day2),planEnd:doff(today2,day2+dur-1),estimatedHours:f.h});
        if(assIdx>=0&&row[assIdx])tsk.assignee=row[assIdx];
        k.tasks.push(tsk);
        day2+=dur;
      });
      g.kikakus.push(k);count++;
    });
    save();closeModal();renderAll();
    toast(count+'件の企画を取り込みました','ok');
  } else {
    var kiIdx2=parseInt((document.getElementById('csvMapKikaku')||{}).value);
    var tkIdx=parseInt((document.getElementById('csvMapTask')||{}).value);
    var stIdx=parseInt((document.getElementById('csvMapStart')||{}).value);
    var enIdx=parseInt((document.getElementById('csvMapEnd')||{}).value);
    var asIdx2=parseInt((document.getElementById('csvMapAssignee')||{}).value);
    if(tkIdx<0){toast('工程名列を指定してください','err');return}

    var kikakuMap={};
    csvData.forEach(function(row){
      var kname=(kiIdx2>=0?row[kiIdx2]:'')||'インポート企画';
      var tname=row[tkIdx];if(!tname)return;
      if(!kikakuMap[kname])kikakuMap[kname]=[];
      var tsk=mkTask({name:tname});
      if(stIdx>=0&&row[stIdx])tsk.planStart=normalizeDate(row[stIdx]);
      if(enIdx>=0&&row[enIdx])tsk.planEnd=normalizeDate(row[enIdx]);
      if(asIdx2>=0&&row[asIdx2])tsk.assignee=row[asIdx2];
      kikakuMap[kname].push(tsk);
    });

    var count2=0;
    Object.keys(kikakuMap).forEach(function(kname){
      var existing=g.kikakus.find(function(k){return k.name===kname});
      if(existing){
        kikakuMap[kname].forEach(function(t){existing.tasks.push(t)});
      } else {
        var k2=mkKikaku({name:kname,tasks:kikakuMap[kname]});
        g.kikakus.push(k2);
      }
      count2+=kikakuMap[kname].length;
    });
    save();closeModal();renderAll();
    toast(count2+'件のタスクを取り込みました','ok');
  }
}
window.applyCSV=applyCSV;

function normalizeDate(s){
  if(!s)return todayS();
  // Support: YYYY/MM/DD, YYYY-MM-DD, MM/DD, M/D
  s=s.replace(/\//g,'-');
  var parts=s.split('-');
  if(parts.length===3)return parts[0]+'-'+p2(parseInt(parts[1]))+'-'+p2(parseInt(parts[2]));
  if(parts.length===2){var y=new Date().getFullYear();return y+'-'+p2(parseInt(parts[0]))+'-'+p2(parseInt(parts[1]))}
  return todayS();
}
/* ===== MODALS ===== */

// New Project
function showNewProjectModal(){
  var h='<div class="modal-hdr"><h2>新規プロジェクト作成</h2><button onclick="closeModal()">✕</button></div>';
  h+='<div class="modal-body">';
  h+='<div class="field"><label>プロジェクト名</label><input type="text" id="npN" placeholder="例: ダイハツ工業 社内報"></div>';
  h+='<div class="field"><label>クライアント名</label><input type="text" id="npC" placeholder="例: ダイハツ工業株式会社"></div>';
  h+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">キャンセル</button><button class="btn-p" onclick="execNewProj()">作成</button></div>';
  showModal(h);
  setTimeout(function(){var e=document.getElementById('npN');if(e)e.focus()},100);
}
window.showNewProjectModal=showNewProjectModal;

function execNewProj(){
  var n=(document.getElementById('npN')||{}).value;
  if(!n||!n.trim()){toast('プロジェクト名を入力してください','err');return}
  var c=(document.getElementById('npC')||{}).value||'';
  var p=mkProj({name:n.trim(),client:c.trim()});
  S.projects.push(p);S.activeProjectId=p.id;save();closeModal();
  nav('project',{pid:p.id});
  toast('プロジェクト「'+n.trim()+'」を作成しました','ok');
}
window.execNewProj=execNewProj;

// New Gou
function showNewGouModal(){
  var p=getProj();if(!p){toast('プロジェクトを先に選択してください','err');return}
  var h='<div class="modal-hdr"><h2>新規号作成</h2><button onclick="closeModal()">✕</button></div>';
  h+='<div class="modal-body">';
  h+='<div class="field"><label>号名</label><input type="text" id="ngN" placeholder="例: vol.42 夏号"></div>';
  h+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">キャンセル</button><button class="btn-p" onclick="execNewGou()">作成</button></div>';
  showModal(h);
  setTimeout(function(){var e=document.getElementById('ngN');if(e)e.focus()},100);
}
window.showNewGouModal=showNewGouModal;

function execNewGou(){
  var p=getProj();if(!p)return;
  var n=(document.getElementById('ngN')||{}).value;
  if(!n||!n.trim()){toast('号名を入力してください','err');return}
  var g=mkGou({name:n.trim()});
  p.gous.push(g);S.activeGouId=g.id;save();closeModal();
  nav('gou',{pid:p.id,gid:g.id});
  toast('号「'+n.trim()+'」を作成しました','ok');
}
window.execNewGou=execNewGou;

// New Kikaku
function showNewKikakuModal(){
  var g=getGou();if(!g){toast('号を先に選択してください','err');return}
  var h='<div class="modal-hdr"><h2>新規企画作成</h2><button onclick="closeModal()">✕</button></div>';
  h+='<div class="modal-body">';
  h+='<div class="field"><label>企画名</label><input type="text" id="nkN" placeholder="例: 表紙・目次"></div>';
  h+='<div class="field"><label>FMTテンプレート</label><select id="nkFmt">';
  h+='<option value="">なし（空の企画）</option>';
  Object.keys(FMT_PRESETS).forEach(function(key){
    h+='<option value="preset:'+key+'"'+(key==='shanaiho'?' selected':'')+'>'+escH(FMT_PRESETS[key].name)+'</option>';
  });
  loadCustomFmts();
  customFmts.forEach(function(cf,i){
    h+='<option value="custom:'+i+'">'+escH(cf.name)+'</option>';
  });
  h+='</select></div>';
  h+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">キャンセル</button><button class="btn-p" onclick="execNewKikaku()">作成</button></div>';
  showModal(h);
  setTimeout(function(){var e=document.getElementById('nkN');if(e)e.focus()},100);
}
window.showNewKikakuModal=showNewKikakuModal;

function execNewKikaku(){
  var p=getProj(),g=getGou();if(!p||!g)return;
  var n=(document.getElementById('nkN')||{}).value;
  if(!n||!n.trim()){toast('企画名を入力してください','err');return}
  var fmtSel=(document.getElementById('nkFmt')||{}).value||'';
  var k=mkKikaku({name:n.trim()});
  if(fmtSel){
    var steps=null;
    if(fmtSel.indexOf('preset:')===0){
      var pkey=fmtSel.slice(7);
      if(FMT_PRESETS[pkey])steps=FMT_PRESETS[pkey].steps;
    } else if(fmtSel.indexOf('custom:')===0){
      loadCustomFmts();
      var cidx=parseInt(fmtSel.slice(7));
      if(customFmts[cidx])steps=customFmts[cidx].steps;
    }
    if(steps){
      var today2=todayS();var day=0;
      steps.forEach(function(f){
        var dur=Math.max(1,Math.ceil(f.h/8));
        k.tasks.push(mkTask({name:f.n,planStart:doff(today2,day),planEnd:doff(today2,day+dur-1),estimatedHours:f.h}));
        day+=dur;
      });
    }
  }
  g.kikakus.push(k);S.activeKikakuId=k.id;S.activeView='table';save();closeModal();
  nav('kikaku',{pid:p.id,gid:g.id,kid:k.id});
  toast('企画「'+n.trim()+'」を作成しました','ok');
}
window.execNewKikaku=execNewKikaku;

// New Member
function showNewMemberModal(editId){
  var existing=editId?S.members.find(function(m){return m.id===editId}):null;
  var title=existing?'メンバー編集':'新規メンバー登録';
  var h='<div class="modal-hdr"><h2>'+title+'</h2><button onclick="closeModal()">✕</button></div>';
  h+='<div class="modal-body">';
  h+='<div class="field"><label>名前</label><input type="text" id="mmN" value="'+escH(existing?existing.name:'')+'" placeholder="例: 田中 太郎"></div>';
  h+='<div class="field"><label>役割</label><select id="mmR" onchange="updateRolePreview()">';
  ROLES.forEach(function(r){
    var rc2=ROLE_COLORS[r]||'#8b8fa8';
    h+='<option value="'+r+'"'+(existing&&existing.role===r?' selected':'')+'>'+escH(RLAB[r])+'</option>';
  });
  h+='</select></div>';
  // Role color preview
  h+='<div class="field"><label>役割カラー</label><div id="mmColorPreview" style="display:flex;align-items:center;gap:.5rem;font-size:.75rem;color:var(--text-muted)"><span class="member-dot" style="background:'+(ROLE_COLORS[(existing?existing.role:'director')]||'#8b8fa8')+'"></span>役割に応じた色が自動適用されます</div></div>';
  h+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">キャンセル</button>';
  h+='<button class="btn-p" onclick="execMember('+(editId?"'"+editId+"'":"null")+')">'+( existing?'更新':'追加')+'</button></div>';
  showModal(h);
  setTimeout(function(){var e=document.getElementById('mmN');if(e)e.focus()},100);
}
window.showNewMemberModal=showNewMemberModal;

function updateRolePreview(){
  var sel=document.getElementById('mmR');if(!sel)return;
  var rc=ROLE_COLORS[sel.value]||'#8b8fa8';
  var prev=document.getElementById('mmColorPreview');
  if(prev)prev.innerHTML='<span class="member-dot" style="background:'+rc+'"></span>'+escH(RLAB[sel.value]||sel.value)+'の色が適用されます';
}
window.updateRolePreview=updateRolePreview;

function execMember(editId){
  var n=(document.getElementById('mmN')||{}).value;
  if(!n||!n.trim()){toast('名前を入力してください','err');return}
  var r=(document.getElementById('mmR')||{}).value||'other';
  if(editId){
    var m=S.members.find(function(x){return x.id===editId});
    if(m){m.name=n.trim();m.role=r}
  } else {
    S.members.push(mkMember({name:n.trim(),role:r}));
  }
  save();closeModal();renderAll();
  toast(editId?'メンバーを更新しました':'メンバーを追加しました','ok');
}
window.execMember=execMember;

// Project Members Modal
function showProjMembersModal(){
  var p=getProj();if(!p)return;
  if(!S.members.length){toast('先にグローバルメンバーを登録してください','err');return}
  var h='<div class="modal-hdr"><h2>プロジェクト担当者設定</h2><button onclick="closeModal()">✕</button></div>';
  h+='<div class="modal-body">';
  h+='<div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.5rem">このプロジェクトに参加するメンバーを選択してください。<br>未選択の場合、全メンバーが表示されます。</div>';
  h+='<div class="pm-list">';
  S.members.forEach(function(m){
    var checked=p.members&&p.members.indexOf(m.id)>=0;
    h+='<label class="pm-item"><input type="checkbox" value="'+m.id+'"'+(checked?' checked':'')+' class="pm-cb">';
    h+='<span class="member-dot" style="background:'+getRoleColor(m)+';width:10px;height:10px"></span>';
    h+=escH(m.name)+' <span style="color:var(--text-dim);font-size:.65rem">('+escH(RLAB[m.role]||m.role)+')</span></label>';
  });
  h+='</div>';
  h+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">キャンセル</button><button class="btn-p" onclick="saveProjMembers()">保存</button></div>';
  showModal(h);
}
window.showProjMembersModal=showProjMembersModal;

function saveProjMembers(){
  var p=getProj();if(!p)return;
  var cbs=document.querySelectorAll('.pm-cb');
  var ids=[];
  cbs.forEach(function(cb){if(cb.checked)ids.push(cb.value)});
  p.members=ids;
  save();closeModal();renderAll();
  toast('担当者を更新しました','ok');
}
window.saveProjMembers=saveProjMembers;

function editMemberUI(id){showNewMemberModal(id)}
window.editMemberUI=editMemberUI;

function delMemberUI(id){
  var m=S.members.find(function(x){return x.id===id});
  if(m&&confirm('「'+m.name+'」を削除しますか？')){
    S.members=S.members.filter(function(x){return x.id!==id});
    // Remove from all project members lists
    S.projects.forEach(function(p){
      if(p.members)p.members=p.members.filter(function(mid){return mid!==id});
    });
    save();renderAll();
  }
}
window.delMemberUI=delMemberUI;

/* ===== UI ACTIONS ===== */
function cycleStatus(tid){
  var k=getKikaku();if(!k)return;
  var t=k.tasks.find(function(x){return x.id===tid});if(!t)return;
  var idx=SL.indexOf(t.status);
  t.status=SL[(idx+1)%SL.length];
  if(t.status==='in_progress'&&!t.actualStart)t.actualStart=todayS();
  if(t.status==='completed'&&!t.actualEnd)t.actualEnd=todayS();
  save();renderAll();
}
window.cycleStatus=cycleStatus;

function addTaskUI(){
  var k=getKikaku();if(!k)return;
  k.tasks.push(mkTask({name:'新規工程'}));save();renderAll();
}
window.addTaskUI=addTaskUI;

function delTaskUI(tid){
  var k=getKikaku();if(!k)return;
  if(confirm('この工程を削除しますか？')){
    k.tasks=k.tasks.filter(function(x){return x.id!==tid});
    save();renderAll();
  }
}
window.delTaskUI=delTaskUI;

function renProjUI(id){
  var p=S.projects.find(function(x){return x.id===id});if(!p)return;
  var n=prompt('新しいプロジェクト名',p.name);
  if(n!==null&&n.trim()){p.name=n.trim();save();renderAll()}
}
window.renProjUI=renProjUI;

function delProjUI(id){
  var p=S.projects.find(function(x){return x.id===id});
  if(p&&confirm('「'+p.name+'」を削除しますか？\n全号・企画・工程も削除されます。')){
    S.projects=S.projects.filter(function(x){return x.id!==id});
    if(S.activeProjectId===id){S.activeProjectId=S.projects.length?S.projects[0].id:null;S.activeGouId=null;S.activeKikakuId=null}
    save();nav('dashboard');
  }
}
window.delProjUI=delProjUI;

function renGouUI(pid,gid){
  var p=S.projects.find(function(x){return x.id===pid});if(!p)return;
  var g=p.gous.find(function(x){return x.id===gid});if(!g)return;
  var n=prompt('新しい号名',g.name);
  if(n!==null&&n.trim()){g.name=n.trim();save();renderAll()}
}
window.renGouUI=renGouUI;

function delGouUI(pid,gid){
  var p=S.projects.find(function(x){return x.id===pid});if(!p)return;
  var g=p.gous.find(function(x){return x.id===gid});
  if(g&&confirm('号「'+g.name+'」を削除しますか？')){
    p.gous=p.gous.filter(function(x){return x.id!==gid});
    if(S.activeGouId===gid)S.activeGouId=p.gous.length?p.gous[0].id:null;
    save();renderAll();
  }
}
window.delGouUI=delGouUI;

function renKikakuUI(pid,gid,kid){
  var p=S.projects.find(function(x){return x.id===pid});if(!p)return;
  var g=p.gous.find(function(x){return x.id===gid});if(!g)return;
  var k=g.kikakus.find(function(x){return x.id===kid});if(!k)return;
  var n=prompt('新しい企画名',k.name);
  if(n!==null&&n.trim()){k.name=n.trim();save();renderAll()}
}
window.renKikakuUI=renKikakuUI;

function delKikakuUI(pid,gid,kid){
  var p=S.projects.find(function(x){return x.id===pid});if(!p)return;
  var g=p.gous.find(function(x){return x.id===gid});if(!g)return;
  var k=g.kikakus.find(function(x){return x.id===kid});
  if(k&&confirm('企画「'+k.name+'」を削除しますか？')){
    g.kikakus=g.kikakus.filter(function(x){return x.id!==kid});
    if(S.activeKikakuId===kid)S.activeKikakuId=g.kikakus.length?g.kikakus[0].id:null;
    save();renderAll();
  }
}
window.delKikakuUI=delKikakuUI;

function moveKikakuInGou(pid,gid,kid,dir){
  var p=S.projects.find(function(x){return x.id===pid});if(!p)return;
  var g=p.gous.find(function(x){return x.id===gid});if(!g)return;
  var idx=g.kikakus.findIndex(function(x){return x.id===kid});if(idx<0)return;
  var newIdx=idx+dir;
  if(newIdx<0||newIdx>=g.kikakus.length)return;
  var tmp=g.kikakus[idx];g.kikakus[idx]=g.kikakus[newIdx];g.kikakus[newIdx]=tmp;
  save();renderAll();
}
window.moveKikakuInGou=moveKikakuInGou;

/* ===== ALERT SYSTEM (FR-05) ===== */
var ALERT_TYPES={
  overdue:{icon:'🔴',label:'遅延',severity:'critical'},
  onHoldLong:{icon:'🟡',label:'長期保留',severity:'warning'},
  overload:{icon:'🟠',label:'過負荷',severity:'warning'},
  dueThisWeek:{icon:'🔵',label:'今週期限',severity:'info'}
};

function getAlerts(){
  var today=todayS();var todayD=parseD(today);
  var alerts=[];
  // Get this week's end (Sunday)
  var weekEnd=addD(todayD,7-todayD.getDay());

  // Per-task alerts
  S.projects.forEach(function(p){
    p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
      if(t.status==='completed')return;
      var context=p.name+' / '+g.name+' / '+k.name;

      // Overdue
      if(t.planEnd&&t.status!=='completed'){
        var endD=parseD(t.planEnd);
        var diff=diffD(todayD,endD);
        if(diff<0){
          alerts.push({type:'overdue',task:t,context:context,days:Math.abs(diff),
            msg:escH((t.assignee||'担当者未定')+'さん、「'+t.name+'」が'+Math.abs(diff)+'日超過しています。至急対応をお願いします。'),
            reminder:'【リマインド】'+t.name+'の期限が'+Math.abs(diff)+'日超過しています。対象: '+context+'。至急ご確認ください。'
          });
        }
        // Due this week
        else if(diff<=7&&diff>0){
          alerts.push({type:'dueThisWeek',task:t,context:context,days:diff,
            msg:escH((t.assignee||'担当者未定')+'さん、「'+t.name+'」の期限が'+diff+'日後です。'),
            reminder:'【期限間近】'+t.name+'の期限が'+diff+'日後（'+t.planEnd+'）です。対象: '+context+'。進捗をご確認ください。'
          });
        }
      }

    })})});
  });

  // Overload check (weekly hours per member)
  var memberHours={};
  S.projects.forEach(function(p){
    p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
      if(t.status==='in_progress'&&t.assignee&&t.estimatedHours){
        if(!memberHours[t.assignee])memberHours[t.assignee]=0;
        memberHours[t.assignee]+=t.estimatedHours;
      }
    })})});
  });
  Object.keys(memberHours).forEach(function(name){
    if(memberHours[name]>40){
      alerts.push({type:'overload',task:null,context:'',days:0,
        msg:escH(name+'さんの稼働が上限超過: '+memberHours[name]+'h'),
        reminder:'【稼働注意】'+name+'さんの稼働が上限超過しています。現在の合計: '+memberHours[name]+'h。タスクの再配分をご検討ください。'
      });
    }
  });

  // Sort: overdue first, then hold, then overload, then due
  var order={overdue:0,onHoldLong:1,overload:2,dueThisWeek:3};
  alerts.sort(function(a,b){return(order[a.type]||9)-(order[b.type]||9)||(b.days-a.days)});
  return alerts;
}

function renderAlertsHTML(){
  var alerts=getAlerts();
  if(!alerts.length)return '';

  var critical=alerts.filter(function(a){return a.type==='overdue'}).length;
  var warning=alerts.filter(function(a){return a.type==='onHoldLong'||a.type==='overload'}).length;

  var h='<div class="alert-panel"><h3>⚠️ アラート ';
  if(critical)h+='<span class="alert-badge red">'+critical+'</span> ';
  if(warning)h+='<span class="alert-badge yellow">'+warning+'</span> ';
  h+='<span class="alert-badge blue">'+alerts.length+'</span>';
  h+='</h3>';

  var shown=alerts.slice(0,15);
  shown.forEach(function(a,i){
    var at=ALERT_TYPES[a.type];
    var alertMem=a.task?getMember(a.task.assignee):null;
    var alertRc=alertMem?getRoleColor(alertMem):'';
    h+='<div class="alert-item">';
    h+='<span class="alert-icon">'+at.icon+'</span>';
    if(alertMem)h+='<span class="assignee-dot" style="background:'+alertRc+';margin-right:4px"></span>';
    h+='<span class="alert-msg">';
    if(a.task&&a.task.assignee)h+='<strong style="color:'+(alertRc||'var(--text)')+'">'+escH(a.task.assignee)+'</strong> ';
    h+=a.msg;
    if(a.context)h+=' <span style="font-size:.6rem;color:var(--text-dim)">'+escH(a.context)+'</span>';
    h+='</span>';
    h+='<button class="alert-copy" onclick="copyToClip(window._alerts['+i+'].reminder)">コピー</button>';
    h+='</div>';
  });
  if(alerts.length>15)h+='<div style="font-size:.72rem;color:var(--text-dim);padding:.3rem .5rem">...他 '+(alerts.length-15)+' 件</div>';

  h+='<button class="remind-copyall" onclick="copyAllAlerts()" style="margin-top:.5rem">📋 全アラート一括コピー</button>';
  h+='</div>';

  window._alerts=alerts;
  return h;
}

function copyAllAlerts(){
  if(!window._alerts)return;
  copyToClip(window._alerts.map(function(a){return a.reminder}).join('\n\n'));
}
window.copyAllAlerts=copyAllAlerts;

/* ===== THIS WEEK'S DEADLINES ===== */
function renderDeadlinesHTML(){
  var today=todayS();var todayD=parseD(today);
  var items=[];
  S.projects.forEach(function(p){
    p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
      if(t.status==='completed')return;
      if(!t.planEnd)return;
      var diff=diffD(todayD,parseD(t.planEnd));
      if(diff<=7){
        items.push({t:t,pn:p.name,kn:k.name,gn:g.name,diff:diff,date:t.planEnd});
      }
    })})});
  });
  if(!items.length)return '';

  items.sort(function(a,b){return a.diff-b.diff});

  var overdueN=items.filter(function(i){return i.diff<0}).length;
  var h='<div class="alert-panel"><h3>📅 今週の期限 ';
  if(overdueN)h+='<span class="alert-badge red">超過'+overdueN+'</span> ';
  h+='<span class="alert-badge blue">'+items.length+'</span></h3>';

  h+='<table class="deadline-table"><thead><tr><th>期限日</th><th>工程</th><th>ステータス</th><th>担当者</th><th>案件</th></tr></thead><tbody>';
  var showN=Math.min(items.length,20);
  for(var i=0;i<showN;i++){
    var it=items[i];
    var mem=getMember(it.t.assignee);
    var dateLabel=it.diff<0?fmtD(parseD(it.date))+' ('+Math.abs(it.diff)+'日超過)':fmtD(parseD(it.date));
    h+='<tr><td'+(it.diff<0?' class="overdue-date"':'')+'>'+dateLabel+'</td>';
    h+='<td>'+escH(it.t.name)+'</td>';
    h+='<td><span class="sbadge '+it.t.status+'">'+SLA[it.t.status]+'</span></td>';
    h+='<td>';
    if(mem)h+='<span class="assignee-dot" style="background:'+getRoleColor(mem)+'"></span>';
    h+=escH(it.t.assignee||'未割当')+'</td>';
    h+='<td style="font-size:.65rem;color:var(--text-dim)">'+escH(it.pn)+'</td></tr>';
  }
  h+='</tbody></table>';
  if(items.length>20)h+='<div style="font-size:.65rem;color:var(--text-dim);padding:.3rem">...他 '+(items.length-20)+' 件</div>';
  h+='</div>';
  return h;
}

/* ===== FILTER SYSTEM ===== */
function populateFilterAssignee(){
  var sel=document.getElementById('filterAssignee');if(!sel)return;
  var current=sel.value;
  var h='<option value="">全担当者</option>';
  var names={};
  var p=getProj();
  if(p){var pmems=getProjMembers(p);pmems.forEach(function(m){names[m.name]=m.color})}
  else{S.members.forEach(function(m){names[m.name]=m.color})}
  Object.keys(names).forEach(function(n){h+='<option value="'+escH(n)+'">'+escH(n)+'</option>'});
  sel.innerHTML=h;
  if(current)sel.value=current;
}

function applyFilters(){
  var status=(document.getElementById('filterStatus')||{}).value||'';
  var assignee=(document.getElementById('filterAssignee')||{}).value||'';
  var text=((document.getElementById('filterText')||{}).value||'').toLowerCase();

  var rows=document.querySelectorAll('#viewContent .tv tbody tr');
  rows.forEach(function(row){
    var tid=row.dataset.tid;if(!tid)return;
    var k=getKikaku();if(!k)return;
    var t=k.tasks.find(function(x){return x.id===tid});if(!t){row.style.display='';return}

    var show=true;
    if(status&&t.status!==status)show=false;
    if(assignee&&t.assignee!==assignee)show=false;
    if(text){
      var haystack=(t.name+' '+t.assignee+' '+(t.note||'')).toLowerCase();
      if(haystack.indexOf(text)<0)show=false;
    }
    row.style.display=show?'':'none';
  });
}
window.applyFilters=applyFilters;

/* ===== CSV EXPORT ===== */
function exportCSV(){
  var k=getKikaku();
  if(!k||!k.tasks.length){toast('エクスポートするタスクがありません','err');return}
  var g=getGou(),p=getProj();
  var bom='\uFEFF';
  var lines=['"工程名","担当者","予定開始","予定終了","実績開始","実績終了","工数(h)","ステータス","備考"'];
  k.tasks.forEach(function(t){
    lines.push([t.name,t.assignee||'',t.planStart||'',t.planEnd||'',t.actualStart||'',t.actualEnd||'',t.estimatedHours||0,SLA[t.status]||t.status,t.note||''].map(function(v){return '"'+String(v).replace(/"/g,'""')+'"'}).join(','));
  });
  var blob=new Blob([bom+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  var fname=(p?p.name:'export')+'_'+(g?g.name:'')+'_'+(k?k.name:'')+'.csv';
  a.download=fname.replace(/[\/\\:*?"<>|]/g,'_');
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  toast('CSVをエクスポートしました','ok');
}
window.exportCSV=exportCSV;

/* ===== BACKUP / RESTORE ===== */
function showBackupModal(){
  var h='<div class="modal-hdr"><h2>💾 バックアップ / 復元</h2><button onclick="closeModal()">✕</button></div>';
  h+='<div class="modal-body">';
  h+='<div style="margin-bottom:1rem"><div style="font-size:.78rem;font-weight:600;margin-bottom:.4rem">📤 バックアップ（JSON出力）</div>';
  h+='<div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.4rem">全プロジェクト・メンバー・設定をJSONファイルとしてダウンロードします。</div>';
  h+='<button class="btn-p" onclick="exportJSON()" style="font-size:.78rem;padding:.3rem .8rem">バックアップをダウンロード</button></div>';
  h+='<div style="border-top:1px solid var(--border);padding-top:1rem"><div style="font-size:.78rem;font-weight:600;margin-bottom:.4rem">📥 復元（JSONアップロード）</div>';
  h+='<div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.4rem">⚠️ 現在のデータは上書きされます。</div>';
  h+='<input type="file" id="restoreFile" accept=".json" onchange="importJSON(this.files[0])" style="font-size:.75rem"></div>';
  h+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">閉じる</button></div>';
  showModal(h);
}
window.showBackupModal=showBackupModal;

function exportJSON(){
  var blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='task-manager-backup-'+todayS()+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  toast('バックアップをダウンロードしました','ok');
}
window.exportJSON=exportJSON;


function importJSON(file){
  if(!file)return;
  if(!confirm('現在のデータを上書きします。よろしいですか？'))return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(!data.projects||!data.members){toast('無効なバックアップファイルです','err');return}
      S=data;migrate();save();closeModal();renderAll();
      toast('復元しました（PJ:'+S.projects.length+'件, メンバー:'+S.members.length+'名）','ok');
    }catch(err){toast('ファイルの読み込みに失敗しました','err')}
  };
  reader.readAsText(file);
}
window.importJSON=importJSON;

/* ===== SCHEDULE DRAG & DROP ===== */
var _dragTid=null;

function schedDragStart(e,tid){
  _dragTid=tid;
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain',tid);
  setTimeout(function(){e.target.classList.add('dragging')},0);
}
window.schedDragStart=schedDragStart;

function schedDragEnd(e){
  e.target.classList.remove('dragging');
  _dragTid=null;
  // Clean up all drag-over highlights
  document.querySelectorAll('.drag-over').forEach(function(el){el.classList.remove('drag-over')});
}
window.schedDragEnd=schedDragEnd;

function schedDragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  var td=e.target.closest('td[data-date]');
  if(td)td.classList.add('drag-over');
}
window.schedDragOver=schedDragOver;

function schedDragLeave(e){
  var td=e.target.closest('td[data-date]');
  if(td)td.classList.remove('drag-over');
}
window.schedDragLeave=schedDragLeave;

function schedDrop(e){
  e.preventDefault();
  var td=e.target.closest('td[data-date]');
  if(!td)return;
  td.classList.remove('drag-over');
  var newDate=td.dataset.date;
  var tid=e.dataTransfer.getData('text/plain')||_dragTid;
  if(!tid||!newDate)return;

  // Find the task
  var foundTask=null;
  S.projects.forEach(function(p){p.gous.forEach(function(g){g.kikakus.forEach(function(k){k.tasks.forEach(function(t){
    if(t.id===tid)foundTask=t;
  })})})});
  if(!foundTask)return;

  var t=foundTask;
  // Calculate the shift: difference between drop date and task's plan start
  var oldStart=parseD(t.planStart);
  var newStart=parseD(newDate);
  if(!oldStart||!newStart)return;
  var shift=diffD(oldStart,newStart);
  if(shift===0)return;

  // Shift both planStart and planEnd by the same amount
  var oldEnd=parseD(t.planEnd);
  t.planStart=fmtISO(addD(oldStart,shift));
  if(oldEnd)t.planEnd=fmtISO(addD(oldEnd,shift));

  // Also shift actual dates if they exist
  if(t.actualStart){var as=parseD(t.actualStart);if(as)t.actualStart=fmtISO(addD(as,shift))}
  if(t.actualEnd){var ae=parseD(t.actualEnd);if(ae)t.actualEnd=fmtISO(addD(ae,shift))}

  save();renderAll();
  toast('「'+t.name+'」を'+Math.abs(shift)+'日'+(shift>0?'後':'前')+'に移動しました','ok');
}
window.schedDrop=schedDrop;
/* ===== FMT SETTINGS VIEW ===== */
function loadCustomFmts(){
  try{var d=localStorage.getItem('custom-fmts');if(d)customFmts=JSON.parse(d)}catch(e){}
}
function saveCustomFmts(){
  try{localStorage.setItem('custom-fmts',JSON.stringify(customFmts))}catch(e){}
}

function renderFmtSettings(){
  var el=document.getElementById('fmtArea');if(!el)return;
  loadCustomFmts();
  var h='<div class="members-view"><div class="dash-title">FMT（フォーマットテンプレート）設定</div>';
  h+='<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.5rem">企画作成時に使用する工程テンプレートを管理します。全FMTを編集・カスタマイズできます。</div>';
  h+='<button class="tbtn" style="margin-bottom:1rem" onclick="showNewFmtModal()">＋ 新規FMT作成</button>';

  // All FMTs: presets (editable) + custom
  h+='<div style="font-size:.8rem;font-weight:700;margin-bottom:.5rem">📦 プリセットFMT</div>';
  Object.keys(FMT_PRESETS).forEach(function(key){
    var p=FMT_PRESETS[key];
    h+='<div class="info-card" style="margin-bottom:.5rem"><h3 style="display:flex;align-items:center;justify-content:space-between">'+escH(p.name);
    h+='<span style="display:flex;gap:.3rem"><button class="tbtn" onclick="editPresetFmt(\''+key+'\')" style="font-size:.65rem;padding:.15rem .4rem">編集</button></span></h3>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:.3rem">';
    p.steps.forEach(function(s,i){
      h+='<span style="font-size:.65rem;padding:.15rem .4rem;background:var(--surface2);border-radius:var(--radius-xs);color:var(--text-muted)">'+(i+1)+'. '+escH(s.n)+' ('+s.h+'h)</span>';
    });
    h+='</div></div>';
  });

  if(customFmts.length){
    h+='<div style="font-size:.8rem;font-weight:700;margin:1rem 0 .5rem">📝 カスタムFMT</div>';
    customFmts.forEach(function(cf,ci){
      h+='<div class="info-card" style="margin-bottom:.5rem"><h3 style="display:flex;align-items:center;justify-content:space-between">'+escH(cf.name);
      h+='<span style="display:flex;gap:.3rem"><button class="tbtn" onclick="editFmtUI('+ci+')" style="font-size:.65rem;padding:.15rem .4rem">編集</button>';
      h+='<button class="tbtn" onclick="delFmtUI('+ci+')" style="font-size:.65rem;padding:.15rem .4rem;color:var(--danger)">削除</button></span></h3>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:.3rem">';
      cf.steps.forEach(function(s,i){
        h+='<span style="font-size:.65rem;padding:.15rem .4rem;background:var(--accent-dim);border-radius:var(--radius-xs);color:var(--accent-light)">'+(i+1)+'. '+escH(s.n)+' ('+s.h+'h)</span>';
      });
      h+='</div></div>';
    });
  }

  h+='</div>';
  el.innerHTML=h;
}

/* FMT step editor helpers */
function buildFmtStepEditorHTML(steps){
  var h='<div class="field"><label>工程一覧</label>';
  h+='<div id="fmtStepList" style="margin-bottom:.4rem">';
  (steps||[]).forEach(function(s,i){
    h+=fmtStepRowHTML(i,s.n,s.h);
  });
  h+='</div>';
  h+='<button type="button" class="tbtn" onclick="addFmtStep()" style="font-size:.7rem">＋ 工程を追加</button>';
  h+='</div>';
  return h;
}

function fmtStepRowHTML(idx,name,hours){
  return '<div class="fmt-step-row" style="display:flex;align-items:center;gap:.3rem;margin-bottom:.3rem" data-idx="'+idx+'">'
    +'<span style="font-size:.65rem;color:var(--text-dim);min-width:18px;text-align:right">'+(idx+1)+'.</span>'
    +'<input type="text" class="fmt-sn" value="'+escH(name||'')+'" placeholder="工程名" style="flex:1;font-size:.75rem;padding:.25rem .4rem">'
    +'<input type="number" class="fmt-sh" value="'+(hours||8)+'" min="0" step="0.25" style="width:60px;font-size:.75rem;padding:.25rem .4rem" title="工数(h)">'
    +'<span style="font-size:.65rem;color:var(--text-dim)">h</span>'
    +'<button type="button" onclick="moveFmtStep(this,-1)" style="font-size:.7rem;color:var(--text-muted);padding:1px 4px" title="上へ">▲</button>'
    +'<button type="button" onclick="moveFmtStep(this,1)" style="font-size:.7rem;color:var(--text-muted);padding:1px 4px" title="下へ">▼</button>'
    +'<button type="button" onclick="removeFmtStep(this)" style="font-size:.7rem;color:var(--danger);padding:1px 4px" title="削除">✕</button>'
    +'</div>';
}

function addFmtStep(){
  var list=document.getElementById('fmtStepList');if(!list)return;
  var idx=list.children.length;
  var div=document.createElement('div');
  div.innerHTML=fmtStepRowHTML(idx,'',8);
  list.appendChild(div.firstChild);
  renumberFmtSteps();
  var inputs=list.querySelectorAll('.fmt-step-row:last-child .fmt-sn');
  if(inputs.length)inputs[inputs.length-1].focus();
}
window.addFmtStep=addFmtStep;

function removeFmtStep(btn){
  var row=btn.closest('.fmt-step-row');if(!row)return;
  row.parentNode.removeChild(row);
  renumberFmtSteps();
}
window.removeFmtStep=removeFmtStep;

function moveFmtStep(btn,dir){
  var row=btn.closest('.fmt-step-row');if(!row)return;
  var list=row.parentNode;
  if(dir===-1&&row.previousElementSibling){
    list.insertBefore(row,row.previousElementSibling);
  } else if(dir===1&&row.nextElementSibling){
    list.insertBefore(row.nextElementSibling,row);
  }
  renumberFmtSteps();
}
window.moveFmtStep=moveFmtStep;

function renumberFmtSteps(){
  var list=document.getElementById('fmtStepList');if(!list)return;
  var rows=list.querySelectorAll('.fmt-step-row');
  rows.forEach(function(r,i){
    var num=r.querySelector('span');if(num)num.textContent=(i+1)+'.';
  });
}

function collectFmtSteps(){
  var list=document.getElementById('fmtStepList');if(!list)return[];
  var steps=[];
  list.querySelectorAll('.fmt-step-row').forEach(function(row){
    var n=row.querySelector('.fmt-sn').value.trim();
    var h=parseFloat(row.querySelector('.fmt-sh').value)||0;
    if(n)steps.push({n:n,h:h});
  });
  return steps;
}

function editPresetFmt(key){
  var p=FMT_PRESETS[key];if(!p)return;
  var h='<div class="modal-hdr"><h2>FMT編集: '+escH(p.name)+'</h2><button onclick="closeModal()">✕</button></div>';
  h+='<div class="modal-body">';
  h+='<div class="field"><label>FMT名</label><input type="text" id="fmtName" value="'+escH(p.name)+'"></div>';
  h+=buildFmtStepEditorHTML(p.steps);
  h+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">キャンセル</button>';
  h+='<button class="btn-p" onclick="execPresetFmt(\''+key+'\')">更新</button></div>';
  showModal(h);
}
window.editPresetFmt=editPresetFmt;

function execPresetFmt(key){
  var name=(document.getElementById('fmtName')||{}).value;
  if(!name||!name.trim()){toast('FMT名を入力してください','err');return}
  var steps=collectFmtSteps();
  if(!steps.length){toast('工程を1つ以上入力してください','err');return}
  FMT_PRESETS[key]={name:name.trim(),steps:steps};
  if(key==='shanaiho')FMT14=steps;
  closeModal();renderAll();
  toast('「'+name.trim()+'」を更新しました','ok');
}
window.execPresetFmt=execPresetFmt;

function showNewFmtModal(editIdx){
  loadCustomFmts();
  var existing=(editIdx!==undefined&&editIdx!==null)?customFmts[editIdx]:null;
  var title=existing?'FMT編集':'新規FMT作成';
  var h='<div class="modal-hdr"><h2>'+title+'</h2><button onclick="closeModal()">✕</button></div>';
  h+='<div class="modal-body">';
  h+='<div class="field"><label>FMT名</label><input type="text" id="fmtName" value="'+escH(existing?existing.name:'')+'" placeholder="例: 広報誌制作"></div>';
  h+=buildFmtStepEditorHTML(existing?existing.steps:[]);
  h+='</div><div class="modal-foot"><button class="btn-s" onclick="closeModal()">キャンセル</button>';
  h+='<button class="btn-p" onclick="execFmt('+(editIdx!==undefined&&editIdx!==null?editIdx:'null')+')">'+( existing?'更新':'作成')+'</button></div>';
  showModal(h);
}
window.showNewFmtModal=showNewFmtModal;

function execFmt(editIdx){
  var name=(document.getElementById('fmtName')||{}).value;
  if(!name||!name.trim()){toast('FMT名を入力してください','err');return}
  var steps=collectFmtSteps();
  if(!steps.length){toast('工程を1つ以上入力してください','err');return}
  loadCustomFmts();
  if(editIdx!==null&&editIdx!==undefined&&customFmts[editIdx]){
    customFmts[editIdx]={name:name.trim(),steps:steps};
  } else {
    customFmts.push({name:name.trim(),steps:steps});
  }
  saveCustomFmts();closeModal();renderAll();
  toast('FMT「'+name.trim()+'」を保存しました','ok');
}
window.execFmt=execFmt;

function editFmtUI(idx){showNewFmtModal(idx)}
window.editFmtUI=editFmtUI;

function delFmtUI(idx){
  loadCustomFmts();
  if(!customFmts[idx])return;
  if(confirm('FMT「'+customFmts[idx].name+'」を削除しますか？')){
    customFmts.splice(idx,1);saveCustomFmts();renderAll();
  }
}
window.delFmtUI=delFmtUI;

/* ===== EXCEL IMPORT ===== */
var _excelParsed=null;

function showExcelImportModal(){
  var h='<div style="padding:1rem"><h3 style="margin-bottom:.8rem">📥 Excel取込（案件一覧シート）</h3>';
  h+='<p style="font-size:.72rem;color:var(--text-muted);margin-bottom:.8rem">大阪関ヶ原形式の案件一覧シート（.xlsx）を取り込みます。各タブが1つの案件として登録されます。</p>';
  h+='<div class="csv-drop" id="excelDropZone" style="border:2px dashed var(--border);border-radius:var(--radius);padding:2rem;text-align:center;cursor:pointer;margin-bottom:.8rem" onclick="document.getElementById(\'excelFileInput\').click()" ondragover="event.preventDefault();this.style.borderColor=\'var(--accent)\'" ondragleave="this.style.borderColor=\'var(--border)\'" ondrop="event.preventDefault();this.style.borderColor=\'var(--border)\';handleExcelDrop(event)">';
  h+='<div style="font-size:2rem;margin-bottom:.4rem">📄</div>';
  h+='<div style="font-size:.75rem;color:var(--text-muted)">クリックまたはドラッグ＆ドロップで .xlsx ファイルを選択</div>';
  h+='<input type="file" id="excelFileInput" accept=".xlsx,.xls" style="display:none" onchange="handleExcelFileSelect(event)"></div>';
  h+='<div id="excelPreviewArea"></div>';
  h+='<div style="display:flex;gap:.4rem;justify-content:flex-end;margin-top:.8rem">';
  h+='<button class="tbtn" onclick="closeModal()">キャンセル</button>';
  h+='<button class="tbtn" id="excelApplyBtn" style="display:none;background:var(--accent);color:#fff;border-color:var(--accent)" onclick="applyExcelImport()">取込実行</button>';
  h+='</div></div>';
  showModal(h);
}
window.showExcelImportModal=showExcelImportModal;

function handleExcelDrop(e){
  var f=e.dataTransfer.files;
  if(f&&f.length)processExcelFile(f[0]);
}
window.handleExcelDrop=handleExcelDrop;

function handleExcelFileSelect(e){
  var f=e.target.files;
  if(f&&f.length)processExcelFile(f[0]);
}
window.handleExcelFileSelect=handleExcelFileSelect;

function processExcelFile(file){
  if(!window.XLSX){toast('SheetJS ライブラリが読み込まれていません','err');return}
  var ext=(file.name||'').split('.').pop().toLowerCase();
  if(ext!=='xlsx'&&ext!=='xls'){toast('.xlsx または .xls ファイルを選択してください','err');return}
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=new Uint8Array(e.target.result);
      var wb=XLSX.read(data,{type:'array',cellDates:false});
      _excelParsed=parseExcelWorkbook(wb);
      renderExcelPreview(_excelParsed);
    }catch(err){
      toast('Excelファイルの読み込みに失敗しました: '+err.message,'err');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseExcelWorkbook(wb){
  var tabs=wb.SheetNames.filter(function(n){return n!=='一覧'});
  var result=[];
  tabs.forEach(function(tabName){
    var ws=wb.Sheets[tabName];
    var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});
    if(rows.length<11)return;
    var parsed=parseExcelTab(tabName,rows);
    if(parsed)result.push(parsed);
  });
  return result;
}

function parseExcelTab(tabName,rows){
  // Row 0: client names in even cols (5,7,9... 0-based)
  // Row 1: page numbers in even cols
  // Row 2: article names in even cols
  // Rows 3-8: role assignments (企画担当者,企画,取材,執筆,編集,デザイン)
  // Row 9: header row (月,日,曜日,client,JBA,then スケジュール/名入れ pairs)
  // Row 10+: date rows

  var row0=rows[0]||[];var row1=rows[1]||[];var row2=rows[2]||[];
  var row3=rows[3]||[];var row4=rows[4]||[];var row5=rows[5]||[];
  var row6=rows[6]||[];var row7=rows[7]||[];var row8=rows[8]||[];

  // Extract client name from first non-empty even col
  var clientName='';
  for(var ci=5;ci<row0.length;ci+=2){
    if(row0[ci]&&String(row0[ci]).trim()){clientName=String(row0[ci]).trim();break}
  }

  // Extract articles (column pairs starting from col 5)
  var articles=[];
  for(var ai=5;ai<Math.max(row1.length,row2.length);ai+=2){
    var pageNum=row1[ai]?String(row1[ai]).trim():'';
    var artName=row2[ai]?String(row2[ai]).trim():'';
    if(!artName&&!pageNum)continue;
    var designer=row8[ai]?String(row8[ai]).trim():'';
    var kikakuPerson=row4[ai]?String(row4[ai]).trim():'';
    var interviewPerson=row5[ai]?String(row5[ai]).trim():'';
    var writerPerson=row6[ai]?String(row6[ai]).trim():'';
    var editorPerson=row7[ai]?String(row7[ai]).trim():'';
    articles.push({
      colIndex:ai,
      pageNum:pageNum,
      name:artName||pageNum,
      designer:designer,
      kikaku:kikakuPerson,
      interview:interviewPerson,
      writer:writerPerson,
      editor:editorPerson
    });
  }

  // Extract date rows and schedule events
  var dateRows=[];
  for(var ri=10;ri<rows.length;ri++){
    var row=rows[ri];if(!row)continue;
    var dateVal=row[1]; // col B = date
    if(!dateVal)continue;
    var dateISO=parseDateFromExcel(dateVal);
    if(!dateISO)continue;
    var clientEvent=row[3]?String(row[3]).trim():'';
    var jbaEvent=row[4]?String(row[4]).trim():'';

    var artEvents=[];
    articles.forEach(function(art){
      var schedVal=row[art.colIndex]?String(row[art.colIndex]).trim():'';
      var nameVal=row[art.colIndex+1]?String(row[art.colIndex+1]).trim():'';
      artEvents.push({schedule:schedVal,assignee:nameVal});
    });
    dateRows.push({date:dateISO,clientEvent:clientEvent,jbaEvent:jbaEvent,events:artEvents});
  }

  // Build tasks per article from consecutive events
  var articleTasks=[];
  articles.forEach(function(art,artIdx){
    var tasks=[];
    var activeTask=null;
    dateRows.forEach(function(dr){
      var ev=dr.events[artIdx];
      if(!ev)return;
      var txt=ev.schedule;
      var isCont=(txt==='｜'||txt==='↓'||txt==='|'||txt==='↓　未確定');
      if(isCont){
        if(activeTask)activeTask.planEnd=dr.date;
      } else if(txt){
        if(activeTask)tasks.push(activeTask);
        activeTask={name:txt,planStart:dr.date,planEnd:dr.date,assignee:ev.assignee||art.designer||'',status:'not_started'};
      } else {
        if(activeTask){tasks.push(activeTask);activeTask=null}
      }
    });
    if(activeTask)tasks.push(activeTask);
    articleTasks.push(tasks);
  });

  // Client/JBA milestone tasks
  var milestoneTasks=[];
  dateRows.forEach(function(dr){
    if(dr.clientEvent){milestoneTasks.push({name:'【クライアント】'+dr.clientEvent,planStart:dr.date,planEnd:dr.date,assignee:'',status:'not_started'})}
    if(dr.jbaEvent){milestoneTasks.push({name:'【JBA】'+dr.jbaEvent,planStart:dr.date,planEnd:dr.date,assignee:'',status:'not_started'})}
  });

  return {
    tabName:tabName,
    clientName:clientName,
    articles:articles,
    articleTasks:articleTasks,
    milestoneTasks:milestoneTasks,
    dateRows:dateRows,
    totalTasks:articleTasks.reduce(function(s,t){return s+t.length},0)+milestoneTasks.length
  };
}

function parseDateFromExcel(val){
  if(!val)return null;
  var s=String(val).trim();
  // Try ISO format: "2026-04-13 00:00:00" or "2026-04-13"
  var m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m)return m[1]+'-'+p2(+m[2])+'-'+p2(+m[3]);
  // Try Date object
  if(val instanceof Date&&!isNaN(val.getTime())){return fmtISO(val)}
  // Try serial number (Excel date serial)
  var num=parseFloat(s);
  if(!isNaN(num)&&num>40000&&num<60000){
    var d=new Date((num-25569)*86400000);
    if(!isNaN(d.getTime()))return fmtISO(d);
  }
  return null;
}

function groupParsedTabs(parsed){
  // Group tabs by clientName → same client = same project, each tab = gou
  var groups={};var order=[];
  parsed.forEach(function(tab,i){
    var key=tab.clientName||tab.tabName;
    if(!groups[key]){groups[key]={clientName:tab.clientName,tabs:[]};order.push(key)}
    groups[key].tabs.push({tab:tab,idx:i});
  });
  return order.map(function(k){return groups[k]});
}

function extractGouName(tabName){
  // 【近畿日本鉄道様】ひかり 2026年4月号 → ひかり 2026年4月号
  // 【ダイハツ工業様】DAIHATSU NEWS 2026年5・6 → DAIHATSU NEWS 2026年5・6
  var m=tabName.match(/^【[^】]+】\s*(.+)$/);
  return m?m[1]:tabName;
}

function renderExcelPreview(parsed){
  var area=document.getElementById('excelPreviewArea');
  if(!area)return;
  if(!parsed||!parsed.length){area.innerHTML='<p style="color:var(--text-muted);font-size:.72rem">取り込めるタブが見つかりませんでした</p>';return}
  var groups=groupParsedTabs(parsed);
  var h='<div class="excel-preview"><table><thead><tr>';
  h+='<th class="check-col"><input type="checkbox" checked onchange="toggleAllExcelTabs(this.checked)"></th>';
  h+='<th>クライアント</th><th>号名</th><th>企画数</th><th>推定P数</th><th>タスク数</th>';
  h+='</tr></thead><tbody>';
  groups.forEach(function(grp){
    var isMulti=grp.tabs.length>1;
    grp.tabs.forEach(function(entry,gi){
      var tab=entry.tab;var i=entry.idx;
      var totalP=0;
      tab.articles.forEach(function(a){var pi=parsePageRange(a.pageNum);if(pi)totalP+=pi.count});
      h+='<tr><td class="check-col"><input type="checkbox" checked data-tab-idx="'+i+'"></td>';
      if(gi===0&&isMulti){
        h+='<td rowspan="'+grp.tabs.length+'" style="font-weight:600;vertical-align:top;border-right:2px solid var(--border)">'+escH(grp.clientName)+(isMulti?'<br><span style="font-size:.6rem;color:var(--text-muted)">'+grp.tabs.length+'号まとめ</span>':'')+'</td>';
      } else if(!isMulti){
        h+='<td>'+escH(grp.clientName)+'</td>';
      }
      h+='<td>'+escH(extractGouName(tab.tabName))+'</td>';
      h+='<td>'+tab.articles.length+'</td>';
      h+='<td>'+totalP+'p</td>';
      h+='<td>'+tab.totalTasks+'</td></tr>';
    });
  });
  h+='</tbody></table></div>';
  h+='<div style="font-size:.7rem;color:var(--text-muted);margin-top:.3rem">'+groups.length+'クライアント / '+parsed.length+'号 / 合計'+parsed.reduce(function(s,t){return s+t.totalTasks},0)+'タスク</div>';
  area.innerHTML=h;
  var btn=document.getElementById('excelApplyBtn');if(btn)btn.style.display='';
}

function toggleAllExcelTabs(checked){
  document.querySelectorAll('#excelPreviewArea input[data-tab-idx]').forEach(function(cb){cb.checked=checked});
}
window.toggleAllExcelTabs=toggleAllExcelTabs;

function applyExcelImport(){
  if(!_excelParsed)return;
  var selectedIdxs=[];
  document.querySelectorAll('#excelPreviewArea input[data-tab-idx]').forEach(function(cb){
    if(cb.checked)selectedIdxs.push(parseInt(cb.dataset.tabIdx));
  });
  if(!selectedIdxs.length){toast('取り込むタブを選択してください','err');return}

  // Group selected tabs by clientName
  var clientGroups={};var clientOrder=[];
  selectedIdxs.forEach(function(idx){
    var tab=_excelParsed[idx];
    if(!tab)return;
    var key=tab.clientName||tab.tabName;
    if(!clientGroups[key]){clientGroups[key]=[];clientOrder.push(key)}
    clientGroups[key].push(tab);
  });

  // Check for duplicate projects (by client name)
  var dupeClients=[];
  clientOrder.forEach(function(cname){
    var existing=S.projects.find(function(p){return p.client===cname});
    if(existing)dupeClients.push(cname);
  });
  if(dupeClients.length){
    if(!confirm('以下のクライアントは既に存在します。上書きしますか？\n\n'+dupeClients.join('\n'))){return}
    dupeClients.forEach(function(cname){
      S.projects=S.projects.filter(function(p){return p.client!==cname});
    });
  }

  var importedProjects=0;
  var importedGous=0;
  var allMemberNames={};

  clientOrder.forEach(function(cname){
    var tabsForClient=clientGroups[cname];
    // Project name = publication title from first tab (without brackets)
    var projName=extractGouName(tabsForClient[0].tabName);
    // If multiple gous, use a common name
    if(tabsForClient.length>1){
      // Find common prefix of gou names
      var gouNames=tabsForClient.map(function(t){return extractGouName(t.tabName)});
      var common=gouNames[0];
      for(var i=1;i<gouNames.length;i++){
        while(gouNames[i].indexOf(common)!==0&&common.length>0){common=common.substring(0,common.length-1)}
      }
      common=common.replace(/\s+$/,'');
      if(common.length>2)projName=common;
    }

    var proj=mkProj({name:projName,client:cname,mediaType:'shanaiho'});

    tabsForClient.forEach(function(tab){
      var gouName=extractGouName(tab.tabName);
      var gou=mkGou({name:gouName});

      // Create kikakus from articles
      tab.articles.forEach(function(art,ai){
        var kik=mkKikaku({name:art.name+(art.pageNum?' ('+art.pageNum+')':'')});
        kik.meta={designer:art.designer||'',kikaku:art.kikaku||'',interview:art.interview||'',writer:art.writer||'',editor:art.editor||'',pageNum:art.pageNum||''};
        var tasks=tab.articleTasks[ai]||[];
        tasks.forEach(function(t){
          kik.tasks.push(mkTask({name:t.name,planStart:t.planStart,planEnd:t.planEnd,assignee:t.assignee,status:t.status}));
        });
        gou.kikakus.push(kik);
      });

      // Add milestones as a separate kikaku if any
      if(tab.milestoneTasks.length){
        var mileKik=mkKikaku({name:'全体マイルストーン'});
        tab.milestoneTasks.forEach(function(t){
          mileKik.tasks.push(mkTask({name:t.name,planStart:t.planStart,planEnd:t.planEnd}));
        });
        gou.kikakus.push(mileKik);
      }

      proj.gous.push(gou);
      importedGous++;

      // Collect member names
      tab.articles.forEach(function(art){
        [art.designer,art.kikaku,art.interview,art.writer,art.editor].forEach(function(n){
          if(n&&n!=='ー'&&n!=='未アサイン'&&n!=='未定'&&n!=='寄稿')allMemberNames[n]=true;
        });
      });
      tab.articleTasks.forEach(function(ats){
        ats.forEach(function(t){
          if(t.assignee&&t.assignee!=='ー'&&t.assignee!=='未アサイン')allMemberNames[t.assignee]=true;
        });
      });
    });

    S.projects.push(proj);
    importedProjects++;
  });

  // Register unique members
  Object.keys(allMemberNames).forEach(function(name){
    var names=name.split(/[・、,\/]/);
    names.forEach(function(n){
      n=n.replace(/[（(].*[）)]/g,'').trim();
      if(!n)return;
      var exists=S.members.some(function(m){return m.name===n});
      if(!exists){
        S.members.push(mkMember({name:n,role:'other'}));
      }
    });
  });

  save();closeModal();renderAll();
  toast(importedProjects+'クライアント / '+importedGous+'号を取り込みました','ok');
  _excelParsed=null;
}
window.applyExcelImport=applyExcelImport;

/* ===== EXCEL EXPORT ===== */
function exportExcel(){
  if(!window.XLSX){toast('SheetJS ライブラリが読み込まれていません','err');return}
  if(!S.projects.length){toast('エクスポートする案件がありません','err');return}

  var wb=XLSX.utils.book_new();
  var allSheetData=[];

  S.projects.forEach(function(proj){
    proj.gous.forEach(function(gou){
      if(!gou.kikakus.length)return;
      var kikakus=gou.kikakus.filter(function(k){return k.name!=='全体マイルストーン'});
      if(!kikakus.length)return;

      // Find global date range for this gou
      var allDates=[];
      gou.kikakus.forEach(function(k){k.tasks.forEach(function(t){
        if(t.planStart)allDates.push(t.planStart);
        if(t.planEnd)allDates.push(t.planEnd);
      })});
      if(!allDates.length)return;
      allDates.sort();
      var minDate=parseD(allDates[0]);
      var maxDate=parseD(allDates[allDates.length-1]);
      var totalDays=diffD(minDate,maxDate)+1;
      if(totalDays>400)totalDays=400;

      // Build worksheet data
      var wsData=[];
      var numArts=kikakus.length;

      // Row 0: client name
      var r0=['','','','',''];
      kikakus.forEach(function(k){r0.push(proj.client||proj.name);r0.push('')});
      wsData.push(r0);

      // Row 1: page/section
      var r1=['','','','',''];
      kikakus.forEach(function(k){
        var pMatch=k.name.match(/\(([^)]+)\)$/);
        r1.push(pMatch?pMatch[1]:k.name);r1.push('');
      });
      wsData.push(r1);

      // Row 2: article names
      var r2=['','','','',''];
      kikakus.forEach(function(k){
        var artName=k.name.replace(/\s*\([^)]*\)$/,'');
        r2.push(artName);r2.push('');
      });
      wsData.push(r2);

      // Rows 3-8: role assignments (extracted from kikaku meta or task assignees)
      ['企画担当者','企画','取材','執筆','編集','デザイン'].forEach(function(role){
        var rr=[role,'','','',''];
        kikakus.forEach(function(k){
          var person='';
          if(k.meta){
            if(role==='企画担当者')person=k.meta.kikaku||'';
            else if(role==='企画')person=k.meta.kikaku||'';
            else if(role==='取材')person=k.meta.interview||'';
            else if(role==='執筆')person=k.meta.writer||'';
            else if(role==='編集')person=k.meta.editor||'';
            else if(role==='デザイン')person=k.meta.designer||'';
          }
          if(!person){
            // Fallback: find assignee from tasks matching role keyword
            k.tasks.forEach(function(t){
              if(person)return;
              if(role==='デザイン'&&(t.name.indexOf('制作')>=0||t.name.indexOf('デザイン')>=0))person=t.assignee||'';
              else if(role==='執筆'&&(t.name.indexOf('執筆')>=0||t.name.indexOf('取材')>=0))person=t.assignee||'';
              else if(role==='編集'&&(t.name.indexOf('CK')>=0||t.name.indexOf('校閲')>=0||t.name.indexOf('チェック')>=0))person=t.assignee||'';
            });
          }
          rr.push(person);rr.push('');
        });
        wsData.push(rr);
      });

      // Row 9: header
      var r9=['月','日','曜日',proj.client||'','JBA'];
      kikakus.forEach(function(){r9.push('スケジュール');r9.push('名入れ')});
      wsData.push(r9);

      // Build task lookup per kikaku: date -> event text
      var taskMaps=[];
      kikakus.forEach(function(k){
        var map={};
        k.tasks.forEach(function(t){
          if(!t.planStart||!t.planEnd)return;
          var ps=parseD(t.planStart),pe=parseD(t.planEnd);
          var span=diffD(ps,pe);
          map[t.planStart]={text:t.name,assignee:t.assignee||''};
          for(var dd=1;dd<=span;dd++){
            var contDate=fmtISO(addD(ps,dd));
            if(!map[contDate])map[contDate]={text:'｜',assignee:''};
          }
        });
        taskMaps.push(map);
      });

      // Milestone lookup
      var milestoneKik=gou.kikakus.find(function(k){return k.name==='全体マイルストーン'});
      var clientMilestones={};var jbaMilestones={};
      if(milestoneKik){
        milestoneKik.tasks.forEach(function(t){
          if(t.name.indexOf('【クライアント】')===0)clientMilestones[t.planStart]=t.name.replace('【クライアント】','');
          else if(t.name.indexOf('【JBA】')===0)jbaMilestones[t.planStart]=t.name.replace('【JBA】','');
        });
      }

      // Date rows
      var curMonth='';
      for(var di=0;di<totalDays;di++){
        var d=addD(minDate,di);
        var iso=fmtISO(d);
        var monthLabel=(d.getMonth()+1)+'月';
        var dow=d.getDay();
        var dowLabel=DAYS_JP[dow];
        var row=[monthLabel!==curMonth?monthLabel:'',iso,dowLabel,clientMilestones[iso]||'',jbaMilestones[iso]||''];
        if(monthLabel!==curMonth)curMonth=monthLabel;

        kikakus.forEach(function(k,ki){
          var entry=taskMaps[ki][iso];
          row.push(entry?entry.text:'');
          row.push(entry?entry.assignee:'');
        });
        wsData.push(row);
      }

      var ws=XLSX.utils.aoa_to_sheet(wsData);
      // Set column widths
      var cols=[{wch:5},{wch:12},{wch:4},{wch:20},{wch:20}];
      kikakus.forEach(function(){cols.push({wch:18});cols.push({wch:10})});
      ws['!cols']=cols;

      var sheetName=gou.name.substring(0,31); // Excel max 31 chars
      XLSX.utils.book_append_sheet(wb,ws,sheetName);
      allSheetData.push({proj:proj,gou:gou,kikakus:kikakus,taskMaps:taskMaps,minDate:minDate,totalDays:totalDays});
    });
  });

  // Build 一覧 sheet
  if(allSheetData.length>=1){
    buildIchiranSheet(wb,allSheetData);
  }

  // Download
  var fileName='案件一覧_'+todayS()+'.xlsx';
  XLSX.writeFile(wb,fileName);
  toast('Excelファイルを出力しました','ok');
}
window.exportExcel=exportExcel;

function buildIchiranSheet(wb,allData){
  // Find global date range
  var globalMin=null,globalMax=null;
  allData.forEach(function(d){
    if(!globalMin||d.minDate<globalMin)globalMin=d.minDate;
    var maxD=addD(d.minDate,d.totalDays-1);
    if(!globalMax||maxD>globalMax)globalMax=maxD;
  });
  if(!globalMin||!globalMax)return;
  var totalDays=diffD(globalMin,globalMax)+1;
  if(totalDays>400)totalDays=400;

  var wsData=[];
  // Header row 0: project/client names spanning
  var h0=['','','','',''];
  allData.forEach(function(d){
    d.kikakus.forEach(function(k,ki){
      h0.push(d.proj.client||d.proj.name);h0.push('');
    });
  });
  wsData.push(h0);

  // Header row 1: article names
  var h1=['','','','',''];
  allData.forEach(function(d){
    d.kikakus.forEach(function(k){
      h1.push(k.name.replace(/\s*\([^)]*\)$/,''));h1.push('');
    });
  });
  wsData.push(h1);

  // Header row 2: schedule/名入れ
  var h2=['月','日','曜日','',''];
  allData.forEach(function(d){
    d.kikakus.forEach(function(){h2.push('スケジュール');h2.push('名入れ')});
  });
  wsData.push(h2);

  // Date rows
  var curMonth='';
  for(var di=0;di<totalDays;di++){
    var dd=addD(globalMin,di);
    var iso=fmtISO(dd);
    var monthLabel=(dd.getMonth()+1)+'月';
    var row=[monthLabel!==curMonth?monthLabel:'',iso,DAYS_JP[dd.getDay()],'',''];
    if(monthLabel!==curMonth)curMonth=monthLabel;

    allData.forEach(function(d){
      d.kikakus.forEach(function(k,ki){
        var entry=d.taskMaps[ki][iso];
        row.push(entry?entry.text:'');
        row.push(entry?entry.assignee:'');
      });
    });
    wsData.push(row);
  }

  var ws=XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb,ws,'一覧');
}
/* ===== ICHIRAN (一覧) VIEW ===== */
var ichiranDateFrom='';
var ichiranDateTo='';

function renderIchiran(){
  var el=document.getElementById('ichiranArea');if(!el)return;

  // Collect all projects with kikakus and tasks
  var allArts=[];
  S.projects.forEach(function(proj){
    proj.gous.forEach(function(gou){
      gou.kikakus.forEach(function(kik){
        if(!kik.tasks.length)return;
        allArts.push({proj:proj,gou:gou,kik:kik});
      });
    });
  });

  if(!allArts.length){
    el.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-muted)"><p style="font-size:1.2rem;margin-bottom:.5rem">📊</p><p>案件データがありません。Excelファイルを取り込むか、案件を作成してください。</p></div>';
    return;
  }

  // Find global date range
  var allDates=[];
  allArts.forEach(function(a){
    a.kik.tasks.forEach(function(t){
      if(t.planStart)allDates.push(t.planStart);
      if(t.planEnd)allDates.push(t.planEnd);
    });
  });
  allDates.sort();
  var minD=parseD(ichiranDateFrom||allDates[0]);
  var maxD=parseD(ichiranDateTo||allDates[allDates.length-1]);
  if(!minD||!maxD){el.innerHTML='<div style="padding:2rem;color:var(--text-muted)">日付データがありません</div>';return}
  var totalDays=diffD(minD,maxD)+1;
  if(totalDays>500)totalDays=500;

  // Controls
  var h='<div class="ichiran-controls">';
  h+='<label>期間:</label>';
  h+='<input type="date" id="ichiranFrom" value="'+(ichiranDateFrom||fmtISO(minD))+'" onchange="setIchiranRange()">';
  h+='<span>〜</span>';
  h+='<input type="date" id="ichiranTo" value="'+(ichiranDateTo||fmtISO(maxD))+'" onchange="setIchiranRange()">';
  h+='<button class="ibtn" onclick="setIchiranQuick(\'month\')">今月</button>';
  h+='<button class="ibtn" onclick="setIchiranQuick(\'quarter\')">今四半期</button>';
  h+='<button class="ibtn" onclick="setIchiranQuick(\'all\')">全期間</button>';
  h+='<div style="flex:1"></div>';
  h+='<button class="ibtn" onclick="exportExcel()">📤 Excel出力</button>';
  var ichiTotalPages=0;
  allArts.forEach(function(a){var pr=parsePageRange((a.kik.meta&&a.kik.meta.pageNum)?a.kik.meta.pageNum:'');if(pr&&pr.count)ichiTotalPages+=pr.count});
  h+='<span style="color:var(--text-dim);font-size:.62rem">'+S.projects.length+'案件 / '+allArts.length+'企画 / '+ichiTotalPages+'P</span>';
  h+='</div>';

  // Sort allArts by page order within each project>gou
  allArts.forEach(function(a){
    var pr=parsePageRange((a.kik.meta&&a.kik.meta.pageNum)?a.kik.meta.pageNum:'');
    a._pr=pr;
    a._sortPage=pr?(pr.start!==null?pr.start:99999):99999;
    a._pgLabel=(a.kik.meta&&a.kik.meta.pageNum)?a.kik.meta.pageNum:'';
    a._pgCount=pr&&pr.count?pr.count:0;
  });
  var projGroups={};var projOrder=[];
  allArts.forEach(function(a){
    var pid=a.proj.id;
    if(!projGroups[pid]){projGroups[pid]=[];projOrder.push(pid)}
    projGroups[pid].push(a);
  });
  projOrder.forEach(function(pid){
    projGroups[pid].sort(function(a,b){return a._sortPage-b._sortPage});
  });
  allArts=[];
  projOrder.forEach(function(pid){allArts=allArts.concat(projGroups[pid])});

  // Each art = 2 columns: task + assignee
  var COLS_PER_ART=2;

  // Build header spans
  // Row 1: Client (colspan = arts_in_project * 2)
  var clientSpans=[];var prevCid='';var cCount=0;
  allArts.forEach(function(a,i){
    var cid=a.proj.id;
    if(cid===prevCid){cCount++}
    else{if(i>0)clientSpans.push({name:allArts[i-1].proj.client||allArts[i-1].proj.name,count:cCount});cCount=1;prevCid=cid}
  });
  if(allArts.length)clientSpans.push({name:allArts[allArts.length-1].proj.client||allArts[allArts.length-1].proj.name,count:cCount});

  // Row 2: Gou (colspan = arts_in_gou * 2)
  var gouSpans=[];var prevGid='';var gCount=0;
  allArts.forEach(function(a,i){
    var gid=a.proj.id+'_'+a.gou.id;
    if(gid===prevGid){gCount++}
    else{if(i>0)gouSpans.push({name:allArts[i-1].gou.name,count:gCount});gCount=1;prevGid=gid}
  });
  if(allArts.length)gouSpans.push({name:allArts[allArts.length-1].gou.name,count:gCount});

  // Table
  h+='<div class="ichiran-wrap"><table class="ichiran-table"><thead>';

  // Header row 1: Client names
  h+='<tr><th rowspan="3" class="ichiran-date" style="min-width:80px">日付</th>';
  clientSpans.forEach(function(cs){
    h+='<th colspan="'+(cs.count*COLS_PER_ART)+'" style="text-align:center;background:#1e40af;color:#fff;font-size:.7rem;font-weight:700;padding:.35rem .3rem;border:1px solid #1e3a8a">'+escH(cs.name)+'</th>';
  });
  h+='</tr>';

  // Header row 2: Gou names
  h+='<tr>';
  gouSpans.forEach(function(gs){
    h+='<th colspan="'+(gs.count*COLS_PER_ART)+'" style="text-align:center;background:#dbeafe;color:#1e40af;font-size:.62rem;font-weight:600;padding:.25rem .2rem;border:1px solid #93c5fd">'+escH(gs.name)+'</th>';
  });
  h+='</tr>';

  // Header row 3: Kikaku name + page (colspan=2 each: task col + assignee col)
  h+='<tr>';
  allArts.forEach(function(a){
    var kName=a.kik.name.replace(/\s*\([^)]*\)$/,'');
    var pgInfo=a._pgLabel?(a._pgLabel+' '+a._pgCount+'P'):'';
    var bgClr=(a._pr&&a._pr.isCover)?'#fef3c7':'#f0f9ff';
    var bdrClr=(a._pr&&a._pr.isCover)?'#fbbf24':'#7dd3fc';
    h+='<th style="text-align:center;font-size:.75rem;font-weight:600;color:var(--text);padding:.5rem .6rem;white-space:normal;word-break:break-all;background:'+bgClr+';border:1px solid '+bdrClr+';min-width:120px" title="'+escH(a.kik.name)+'">'+escH(kName);
    if(pgInfo)h+='<br><span style="font-size:.7rem;color:#4338ca;font-weight:700">'+escH(pgInfo)+'</span>';
    h+='</th>';
    h+='<th style="text-align:center;font-size:.7rem;font-weight:400;color:var(--text-muted);padding:.1rem;background:'+bgClr+';border:1px solid '+bdrClr+';min-width:50px;width:50px">担当</th>';
  });
  h+='</tr></thead><tbody>';

  // Build task lookup per art: date -> task event
  var artMaps=[];
  allArts.forEach(function(a){
    var map={};
    a.kik.tasks.forEach(function(t){
      if(!t.planStart)return;
      var ps=parseD(t.planStart);
      if(!ps)return;
      map[t.planStart]={text:t.name,assignee:t.assignee,isStart:true,status:t.status};
      if(t.planEnd&&t.planEnd!==t.planStart){
        var pe=parseD(t.planEnd);
        var span=diffD(ps,pe);
        for(var dd=1;dd<=span;dd++){
          var contDate=fmtISO(addD(ps,dd));
          if(!map[contDate])map[contDate]={text:'│',assignee:t.assignee,isStart:false,status:t.status};
        }
      }
    });
    artMaps.push(map);
  });

  // Date rows
  var todayISO=todayS();
  var todayDate=parseD(todayISO);
  var twoWeeksLater=addD(todayDate,14);
  var twoWeeksISO=fmtISO(twoWeeksLater);
  for(var di=0;di<totalDays;di++){
    var d=addD(minD,di);
    var iso=fmtISO(d);
    var dow=d.getDay();
    var cls='';
    if(iso===todayISO)cls='today';
    else if(isHoliday(iso))cls='holiday';
    else if(dow===0||dow===6)cls='weekend';
    // 今日〜2週間以内: 薄赤背景
    if(iso>todayISO&&iso<=twoWeeksISO&&cls!=='today')cls+=(cls?' ':'')+'near-deadline';

    h+='<tr class="'+cls+'">';
    var dateLabel=(d.getMonth()+1)+'/'+d.getDate()+'('+DAYS_JP[dow]+')';
    if(iso===todayISO)dateLabel='▶ '+dateLabel+' 今日';
    h+='<td class="ichiran-date">'+dateLabel+'</td>';

    allArts.forEach(function(a,ai){
      var entry=artMaps[ai][iso];
      // Task column
      if(entry&&entry.isStart){
        var evClass=classifyEvent(entry.text);
        h+='<td class="ev-cell '+evClass+'" title="'+escH(entry.text)+'">'+escH(truncateEv(entry.text))+'</td>';
      } else if(entry){
        h+='<td class="ev-cell ev-cont">│</td>';
      } else {
        h+='<td></td>';
      }
      // Assignee column
      if(entry&&entry.assignee){
        var evMem=getMember(entry.assignee);
        var evClr=getRoleColor(evMem);
        var shortA=entry.assignee.length>4?entry.assignee.substring(0,4)+'…':entry.assignee;
        h+='<td style="font-size:.72rem;font-weight:600;color:'+evClr+';text-align:center;white-space:nowrap;padding:.1rem .15rem" title="'+escH(entry.assignee)+'">'+escH(shortA)+'</td>';
      } else {
        h+='<td></td>';
      }
    });
    h+='</tr>';
  }

  h+='</tbody></table></div>';
  el.innerHTML=h;
}

function classifyEvent(text){
  if(!text)return'';
  if(text.indexOf('ご提出')>=0||text.indexOf('ご入稿')>=0)return'ev-submission';
  if(text.indexOf('お戻し')>=0||text.indexOf('戻し')>=0)return'ev-return';
  if(text.indexOf('制作')>=0||text.indexOf('執筆')>=0||text.indexOf('デザイン')>=0)return'ev-production';
  if(text.indexOf('CK')>=0||text.indexOf('チェック')>=0||text.indexOf('確認')>=0||text.indexOf('校閲')>=0||text.indexOf('校了')>=0)return'ev-review';
  if(text.indexOf('【')>=0||text.indexOf('会議')>=0||text.indexOf('入稿')>=0)return'ev-milestone';
  return'';
}

function truncateEv(text){
  if(!text)return'';
  if(text.length<=10)return text;
  return text.substring(0,10)+'…';
}

function setIchiranRange(){
  var f=document.getElementById('ichiranFrom');
  var t=document.getElementById('ichiranTo');
  if(f)ichiranDateFrom=f.value;
  if(t)ichiranDateTo=t.value;
  renderIchiran();
}
window.setIchiranRange=setIchiranRange;

function setIchiranQuick(mode){
  var now=new Date();
  if(mode==='month'){
    ichiranDateFrom=now.getFullYear()+'-'+p2(now.getMonth()+1)+'-01';
    var lastDay=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    ichiranDateTo=now.getFullYear()+'-'+p2(now.getMonth()+1)+'-'+p2(lastDay);
  } else if(mode==='quarter'){
    var qStart=Math.floor(now.getMonth()/3)*3;
    ichiranDateFrom=now.getFullYear()+'-'+p2(qStart+1)+'-01';
    var qEnd=new Date(now.getFullYear(),qStart+3,0).getDate();
    ichiranDateTo=now.getFullYear()+'-'+p2(qStart+3)+'-'+p2(qEnd);
  } else {
    ichiranDateFrom='';ichiranDateTo='';
  }
  renderIchiran();
}
window.setIchiranQuick=setIchiranQuick;

/* ===== PAGE COUNT PARSER & DAIWARI (台割) ===== */
var daiwariViewMode='grid'; // 'grid' or 'table'
var daiwariFilterProj='';

function parsePageRange(str){
  if(!str)return null;
  var s=String(str).trim();
  if(!s)return null;
  // H1=表紙(1p), H2=表紙裏(1p), H3=裏表紙裏(1p), H4=裏表紙(1p)
  var hm=s.match(/^H(\d)$/i);
  if(hm){
    var hn=parseInt(hm[1]);
    var labels={1:'表紙(H1)',2:'表紙裏(H2)',3:'裏表紙裏(H3)',4:'裏表紙(H4)'};
    var sortOrder={1:0,2:0.5,3:9998,4:9999};
    return {start:sortOrder[hn]!==undefined?sortOrder[hn]:hn,end:sortOrder[hn]!==undefined?sortOrder[hn]:hn,count:1,label:labels[hn]||'H'+hn,raw:s,isCover:true,coverType:'H'+hn};
  }
  // p.2-9, p.10-11, P2-9 etc
  var rm=s.match(/^[pP]\.?\s*(\d+)\s*[-~〜]\s*(\d+)/);
  if(rm){
    var a=parseInt(rm[1]),b=parseInt(rm[2]);
    return {start:a,end:b,count:b-a+1,label:'p.'+a+'-'+b,raw:s,isCover:false};
  }
  // p.10, P10 etc (single page)
  var sm=s.match(/^[pP]\.?\s*(\d+)$/);
  if(sm){
    var n=parseInt(sm[1]);
    return {start:n,end:n,count:1,label:'p.'+n,raw:s,isCover:false};
  }
  // Just a number
  var nm=s.match(/^(\d+)$/);
  if(nm){
    var n2=parseInt(nm[1]);
    return {start:n2,end:n2,count:1,label:'p.'+n2,raw:s,isCover:false};
  }
  // Unknown format but has content
  return {start:null,end:null,count:1,label:s,raw:s,isCover:false};
}

function buildGouArticles(gou){
  var arts=[];
  gou.kikakus.forEach(function(kik){
    var pageMatch=kik.name.match(/\(([^)]+)\)$/);
    var pageStr=(kik.meta&&kik.meta.pageNum)?kik.meta.pageNum:(pageMatch?pageMatch[1]:'');
    var baseName=kik.name.replace(/\s*\([^)]*\)$/,'');
    var pageInfo=parsePageRange(pageStr);
    var minDate='',maxDate='';
    kik.tasks.forEach(function(t){
      if(t.planStart&&(!minDate||t.planStart<minDate))minDate=t.planStart;
      if(t.planEnd&&(!maxDate||t.planEnd>maxDate))maxDate=t.planEnd;
    });
    arts.push({name:baseName,pageStr:pageStr,pageInfo:pageInfo,taskCount:kik.tasks.length,minDate:minDate,maxDate:maxDate,kikaku:kik});
  });
  arts.sort(function(a,b){
    if(!a.pageInfo&&!b.pageInfo)return 0;
    if(!a.pageInfo)return 1;
    if(!b.pageInfo)return -1;
    return a.pageInfo.start-b.pageInfo.start;
  });
  return arts;
}

function renderDaiwariSection(arts,viewMode){
  var h='';
  if(viewMode==='grid'){
    h+='<div class="daiwari-grid">';
    arts.forEach(function(art,ai){
      var pi2=art.pageInfo;
      var isSpread=pi2&&pi2.count>=2&&!pi2.isCover;
      var isCover=pi2&&pi2.isCover;
      var colorClass='daiwari-color-'+(ai%8);
      h+='<div class="daiwari-page '+colorClass+(isCover?' cover':'')+(isSpread?' spread':'')+'">';
      h+='<div class="daiwari-page-num">'+(pi2?pi2.label:(art.pageStr||'—'))+'</div>';
      h+='<div class="daiwari-page-title">'+escH(art.name)+'</div>';
      if(pi2&&pi2.count>1&&!pi2.isCover){
        h+='<div class="daiwari-page-notes">'+pi2.count+'ページ構成</div>';
      }
      var roles=extractRolesFromKikaku(art.kikaku);
      if(roles.length){
        h+='<div class="daiwari-page-roles">';
        roles.forEach(function(r){
          h+='<div><span class="role-label">'+escH(r.role)+'</span><span class="role-name">'+escH(r.name)+'</span></div>';
        });
        h+='</div>';
      }
      // Progress
      var tt=art.taskCount,dn=0;
      art.kikaku.tasks.forEach(function(t){if(t.status==='completed')dn++});
      var prog=tt?Math.round(dn/tt*100):0;
      var barClass=prog<30?'danger':prog<70?'warning':'success';
      h+='<div style="margin-top:.3rem"><div class="pbar" style="height:6px"><div class="pbar-fill" style="width:'+prog+'%;background:var(--'+barClass+')"></div></div></div>';
      if(art.minDate&&art.maxDate){
        h+='<div style="font-size:.6rem;color:var(--text-dim);margin-top:.15rem">'+art.minDate.substring(5).replace('-','/')+' 〜 '+art.maxDate.substring(5).replace('-','/')+'</div>';
      }
      h+='</div>';
    });
    h+='</div>';
  } else {
    h+='<table class="daiwari-table"><thead><tr>';
    h+='<th>ページ</th><th>企画名</th><th>ページ数</th><th>担当</th><th>工程数</th><th>進捗</th><th>期間</th>';
    h+='</tr></thead><tbody>';
    arts.forEach(function(art,ai){
      var pi2=art.pageInfo;
      var colorClass='daiwari-color-'+(ai%8);
      var tt=art.taskCount,dn=0;
      art.kikaku.tasks.forEach(function(t){if(t.status==='completed')dn++});
      var prog=tt?Math.round(dn/tt*100):0;
      var barClass=prog<30?'danger':prog<70?'warning':'success';
      h+='<tr class="'+colorClass+'">';
      h+='<td style="font-weight:600">'+(pi2?pi2.label:(art.pageStr||'—'))+'</td>';
      h+='<td>'+escH(art.name)+'</td>';
      h+='<td style="text-align:center">'+(pi2?pi2.count:'—')+'</td>';
      var roles=extractRolesFromKikaku(art.kikaku);
      var roleStr=roles.map(function(r){return r.role+':'+r.name}).join(' / ');
      h+='<td style="font-size:.65rem">'+escH(roleStr||'—')+'</td>';
      h+='<td style="text-align:center">'+art.taskCount+'</td>';
      h+='<td><div class="pbar" style="width:60px;height:10px;display:inline-block;vertical-align:middle"><div class="pbar-fill" style="width:'+prog+'%;background:var(--'+barClass+')"></div></div> <span style="font-size:.6rem">'+prog+'%</span></td>';
      h+='<td style="font-size:.65rem">'+(art.minDate&&art.maxDate?art.minDate.substring(5).replace('-','/')+' 〜 '+art.maxDate.substring(5).replace('-','/'):' —')+'</td>';
      h+='</tr>';
    });
    h+='</tbody></table>';
  }
  return h;
}

function renderDaiwari(){
  var el=document.getElementById('daiwariArea');if(!el)return;

  // Collect project > gou > articles structure
  var projData=[];
  S.projects.forEach(function(proj){
    var gouList=[];
    proj.gous.forEach(function(gou){
      var arts=buildGouArticles(gou);
      if(arts.length)gouList.push({gou:gou,articles:arts});
    });
    if(gouList.length)projData.push({proj:proj,gouList:gouList});
  });

  if(!projData.length){
    el.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-muted)"><p style="font-size:1.2rem;margin-bottom:.5rem">📐</p><p>台割データがありません。Excelファイルを取り込むか、案件を作成してください。</p></div>';
    return;
  }

  // Controls
  var h='<div class="daiwari-controls">';
  h+='<label style="color:var(--text-muted);font-size:.65rem">案件:</label>';
  h+='<select id="daiwariProjFilter" onchange="filterDaiwari()">';
  h+='<option value="">全案件</option>';
  projData.forEach(function(pd){
    var sel=daiwariFilterProj===pd.proj.id?' selected':'';
    h+='<option value="'+pd.proj.id+'"'+sel+'>'+escH(pd.proj.client||pd.proj.name)+'</option>';
  });
  h+='</select>';
  h+='<div class="daiwari-view-toggle">';
  h+='<button class="'+(daiwariViewMode==='grid'?'active':'')+'" onclick="setDaiwariView(\'grid\')">グリッド</button>';
  h+='<button class="'+(daiwariViewMode==='table'?'active':'')+'" onclick="setDaiwariView(\'table\')">テーブル</button>';
  h+='</div>';
  h+='<div style="flex:1"></div>';
  var totalPages=0;var totalGous=0;
  projData.forEach(function(pd){pd.gouList.forEach(function(gl){totalGous++;gl.articles.forEach(function(a){if(a.pageInfo)totalPages+=a.pageInfo.count})})});
  h+='<span style="color:var(--text-dim);font-size:.62rem">'+projData.length+'案件 / '+totalGous+'号 / 約'+totalPages+'ページ</span>';
  h+='</div>';

  h+='<div class="daiwari-wrap">';

  var filtered=daiwariFilterProj?projData.filter(function(pd){return pd.proj.id===daiwariFilterProj}):projData;

  filtered.forEach(function(pd){
    var proj=pd.proj;
    var hasMultiGou=pd.gouList.length>1;

    // Project header
    var projPages=0;var projArts=0;
    pd.gouList.forEach(function(gl){gl.articles.forEach(function(a){projArts++;if(a.pageInfo)projPages+=a.pageInfo.count})});
    h+='<div class="daiwari-project">';
    h+='<h3>'+escH(proj.client||proj.name)+(hasMultiGou?' — '+pd.gouList.length+'号':'')+' — '+projArts+'企画 / 約'+projPages+'ページ</h3>';

    pd.gouList.forEach(function(gl){
      var gou=gl.gou;
      var arts=gl.articles;
      var gouPages=0;
      arts.forEach(function(a){if(a.pageInfo)gouPages+=a.pageInfo.count});

      // Gou sub-header (only if multiple gous)
      if(hasMultiGou){
        h+='<div style="font-size:.78rem;font-weight:700;margin:.8rem 0 .4rem;padding:.25rem .5rem;background:var(--surface2);border-radius:var(--radius-xs);border-left:3px solid var(--accent);display:flex;align-items:center;justify-content:space-between">';
        h+='<span>📦 '+escH(gou.name)+'</span>';
        h+='<span style="font-size:.62rem;color:var(--text-muted);font-weight:400">'+arts.length+'企画 / '+gouPages+'P</span>';
        h+='</div>';
      }

      h+=renderDaiwariSection(arts,daiwariViewMode);
    });

    h+='</div>';
  });

  h+='</div>';
  el.innerHTML=h;
}

function extractRolesFromKikaku(kik){
  var roles=[];
  // Prefer meta (from Excel import) if available
  if(kik.meta){
    if(kik.meta.designer)roles.push({role:'デザイン',name:kik.meta.designer});
    if(kik.meta.writer)roles.push({role:'執筆',name:kik.meta.writer});
    if(kik.meta.editor)roles.push({role:'編集',name:kik.meta.editor});
    if(kik.meta.kikaku)roles.push({role:'企画',name:kik.meta.kikaku});
    if(kik.meta.interview)roles.push({role:'取材',name:kik.meta.interview});
  }
  if(roles.length)return roles;
  // Fallback: guess from task assignees
  var seen={};
  kik.tasks.forEach(function(t){
    if(t.assignee&&!seen[t.assignee]){
      seen[t.assignee]=true;
      var role='担当';
      if(t.name.indexOf('デザイン')>=0||t.name.indexOf('制作')>=0)role='制作';
      else if(t.name.indexOf('執筆')>=0||t.name.indexOf('取材')>=0)role='執筆';
      else if(t.name.indexOf('CK')>=0||t.name.indexOf('チェック')>=0||t.name.indexOf('確認')>=0||t.name.indexOf('校閲')>=0)role='校閲';
      else if(t.name.indexOf('企画')>=0)role='企画';
      roles.push({role:role,name:t.assignee});
    }
  });
  return roles;
}

function filterDaiwari(){
  var sel=document.getElementById('daiwariProjFilter');
  daiwariFilterProj=sel?sel.value:'';
  renderDaiwari();
}
window.filterDaiwari=filterDaiwari;

function setDaiwariView(mode){
  daiwariViewMode=mode;
  renderDaiwari();
}
window.setDaiwariView=setDaiwariView;
/* ===== ASSIGNEE CHANGE HISTORY ===== */
function recordAssigneeChange(task,oldAssignee,newAssignee){
  if(!task.assigneeHistory)task.assigneeHistory=[];
  task.assigneeHistory.push({from:oldAssignee||'',to:newAssignee||'',timestamp:new Date().toISOString()});
}

/* ===== SIDEBAR TOGGLE (responsive) ===== */
function toggleSidebar(){
  var sb=document.getElementById('sidebar'),ov=document.getElementById('sidebarOverlay');
  if(sb)sb.classList.toggle('open');
  if(ov)ov.classList.toggle('show');
}
function closeSidebar(){
  var sb=document.getElementById('sidebar'),ov=document.getElementById('sidebarOverlay');
  if(sb)sb.classList.remove('open');
  if(ov)ov.classList.remove('show');
}
window.toggleSidebar=toggleSidebar;
window.closeSidebar=closeSidebar;

/* ===== ZOOM ===== */
var _zoomLevel=parseInt(localStorage.getItem('app-zoom')||'100',10);
function applyZoom(){
  document.documentElement.style.fontSize=(_zoomLevel/100*15)+'px';
  var el=document.getElementById('zoomLevel');if(el)el.textContent=_zoomLevel+'%';
  localStorage.setItem('app-zoom',String(_zoomLevel));
}
function zoomIn(){_zoomLevel=Math.min(150,_zoomLevel+10);applyZoom()}
function zoomOut(){_zoomLevel=Math.max(70,_zoomLevel-10);applyZoom()}
function zoomReset(){_zoomLevel=100;applyZoom()}
window.zoomIn=zoomIn;window.zoomOut=zoomOut;window.zoomReset=zoomReset;
applyZoom();

/* ===== BROWSER HISTORY (back button) ===== */
window.addEventListener('popstate',function(e){
  if(e.state&&e.state.scr){
    S.activeProjectId=e.state.pid||'';
    S.activeGouId=e.state.gid||'';
    S.activeKikakuId=e.state.kid||'';
    S.currentScreen=e.state.scr;
    renderAll();
  }
});

/* ===== INIT ===== */
async function init(){
  // 1. Supabase 初期化を試みる
  if(typeof initSupabase === 'function'){
    _dbAvailable = initSupabase();
  }

  // 2. データ読み込み優先順: Supabase → localStorage → 空
  var loaded = false;

  if(_dbAvailable){
    // まずSupabaseから読む
    loaded = await loadFromDB();
  }

  if(!loaded){
    // Supabaseが使えない or データ無し → localStorageから
    loaded = load();
  }

  if(!loaded){
    // それも無ければ空データで初期化
    S = {projects:[],members:[],activeProjectId:'',activeGouId:'',activeKikakuId:'',currentScreen:'dashboard',activeView:'table',timeSchedule:{}};
    save();
  }

  renderAll();
  history.replaceState({scr:S.currentScreen,pid:S.activeProjectId,gid:S.activeGouId,kid:S.activeKikakuId},'',null);

  // 3. 起動完了後、DB接続状態をフッターに表示
  var el = document.getElementById('lastSave');
  if(el && _dbAvailable) el.textContent += ' · ☁ DB接続OK';
  else if(el && !_dbAvailable) el.textContent += ' · 📦 ローカルのみ';
}

init();

})();
