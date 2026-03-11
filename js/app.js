/**
 * app.js — 初期化・状態管理・ルーティング・ビュー切替
 * cmd_023 Phase3a-s5 コアフレームワーク
 *
 * データ階層: Project（案件）→ Kikaku（企画/号/特集）→ Task（工程）
 *
 * API契約（他モジュールが使用する）:
 *   window.App.getState()                    — 現在のstate全体を返す
 *   window.App.setState(partial)             — stateを部分更新し保存+再描画
 *   window.App.getActiveProject()            — 現在選択中のプロジェクトを返す
 *   window.App.getActiveKikaku()             — 現在選択中の企画を返す
 *   window.App.navigate(screen, opts)        — 画面遷移
 *   window.App.showModal(html)               — モーダル表示
 *   window.App.closeModal()                  — モーダル閉じ
 *   window.App.escH(str)                     — HTMLエスケープ
 *   window.App.showToast(msg, type)          — トースト通知
 *   window.App.registerView(name, {init, render})  — ビュー登録
 *   window.App.renderActiveView()            — アクティブビューを再描画
 */
(function() {
  'use strict';

  // ===== State =====
  var state = null;
  var views = {};

  // ===== 日付ユーティリティ =====
  function parseD(s) {
    if (!s) return null;
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function fmtD(d) {
    if (!d) return '';
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return (m < 10 ? '0' + m : m) + '/' + (day < 10 ? '0' + day : day);
  }

  function fmtISO(d) {
    if (!d) return '';
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function addDays(d, n) {
    var r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  function diffDays(a, b) {
    return Math.round((b - a) / 864e5);
  }

  // ===== HTMLエスケープ =====
  function escH(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ===== State管理 =====
  function getState() {
    return state;
  }

  function setState(partial) {
    if (!partial) return;
    Object.keys(partial).forEach(function(k) {
      state[k] = partial[k];
    });
    Data.save(state);
    _updateLastSaveTimestamp();
    renderAll();
  }

  /** フッターに最終保存タイムスタンプを表示 */
  function _updateLastSaveTimestamp() {
    var el = document.getElementById('lastSaveTimestamp');
    if (!el) return;
    var now = new Date();
    var y = now.getFullYear();
    var mo = now.getMonth() + 1;
    var d = now.getDate();
    var h = now.getHours();
    var mi = now.getMinutes();
    var ts = y + '-' + (mo < 10 ? '0' + mo : mo) + '-' + (d < 10 ? '0' + d : d) +
      ' ' + (h < 10 ? '0' + h : h) + ':' + (mi < 10 ? '0' + mi : mi);
    el.textContent = '最終保存: ' + ts;
  }

  function getActiveProject() {
    if (!state) return null;
    if (!state.activeProjectId && state.projects.length) {
      state.activeProjectId = state.projects[0].id;
    }
    return state.projects.find(function(p) { return p.id === state.activeProjectId; }) || null;
  }

  function getActiveKikaku() {
    var proj = getActiveProject();
    if (!proj || !proj.kikakus || !proj.kikakus.length) return null;
    if (!state.activeKikakuId) {
      state.activeKikakuId = proj.kikakus[0].id;
    }
    return proj.kikakus.find(function(k) { return k.id === state.activeKikakuId; }) || proj.kikakus[0];
  }

  // ===== プロジェクト操作 =====
  function addProject(opts) {
    var p = Data.createProject(opts);
    state.projects.push(p);
    state.activeProjectId = p.id;
    state.activeKikakuId = null;
    Data.save(state);
    return p;
  }

  function deleteProject(id) {
    state.projects = state.projects.filter(function(p) { return p.id !== id; });
    if (state.activeProjectId === id) {
      state.activeProjectId = state.projects.length ? state.projects[0].id : null;
      state.activeKikakuId = null;
    }
    Data.save(state);
  }

  function renameProject(id, name) {
    var p = state.projects.find(function(x) { return x.id === id; });
    if (p) { p.name = name; Data.save(state); }
  }

  // ===== 企画操作 =====
  function addKikaku(proj, opts) {
    var k = Data.createKikaku(opts);
    proj.kikakus.push(k);
    state.activeKikakuId = k.id;
    Data.save(state);
    return k;
  }

  function deleteKikaku(proj, kikakuId) {
    proj.kikakus = proj.kikakus.filter(function(k) { return k.id !== kikakuId; });
    if (state.activeKikakuId === kikakuId) {
      state.activeKikakuId = proj.kikakus.length ? proj.kikakus[0].id : null;
    }
    Data.save(state);
  }

  function renameKikaku(proj, kikakuId, name) {
    var k = proj.kikakus.find(function(x) { return x.id === kikakuId; });
    if (k) { k.name = name; Data.save(state); }
  }

  // ===== タスク操作 =====
  function addTask(kikaku, opts) {
    var t = Data.createTask(opts);
    kikaku.tasks.push(t);
    Data.save(state);
    return t;
  }

  function updateTask(kikaku, taskId, field, value) {
    var t = kikaku.tasks.find(function(x) { return x.id === taskId; });
    if (t) {
      if (field === 'estimatedHours') value = parseFloat(value) || 0;
      if (field === 'assignee' && t.assignee !== value) {
        t.assigneeHistory.push({
          from: t.assignee,
          to: value,
          timestamp: Data.now(),
          note: ''
        });
      }
      t[field] = value;
      Data.save(state);
    }
  }

  function deleteTask(kikaku, taskId) {
    kikaku.tasks = kikaku.tasks.filter(function(x) { return x.id !== taskId; });
    Data.save(state);
  }

  // ===== ナビゲーション =====
  // screens: dashboard / project / kikaku / fmt_settings / folder_db / members
  function navigate(screen, opts) {
    opts = opts || {};
    if (opts.projectId) {
      state.activeProjectId = opts.projectId;
      if (screen === 'project') {
        // プロジェクト選択時、最初の企画を自動選択
        var proj = getActiveProject();
        if (proj && proj.kikakus.length) {
          state.activeKikakuId = proj.kikakus[0].id;
        } else {
          state.activeKikakuId = null;
        }
      }
    }
    if (opts.kikakuId) {
      state.activeKikakuId = opts.kikakuId;
    }
    state.currentScreen = screen;
    Data.save(state);
    renderScreen();
  }

  // ===== ビュー管理 =====
  function registerView(name, handler) {
    views[name] = handler;
    if (handler.init) handler.init();
  }

  function renderActiveView() {
    var viewName = state.activeView || 'table';
    var container = document.getElementById('viewContent');
    if (!container) return;
    if (views[viewName] && views[viewName].render) {
      views[viewName].render(container);
    } else {
      container.innerHTML = '<div class="placeholder" style="padding:2rem;color:var(--text-muted);">' +
        escH(viewName) + ' ビュー（実装中）</div>';
    }
  }

  function switchView(name) {
    state.activeView = name;
    Data.save(state);
    document.querySelectorAll('.tab-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.view === name);
    });
    renderActiveView();
  }

  // ===== モーダル =====
  function showModal(html) {
    var overlay = document.getElementById('appModalOverlay');
    var body = document.getElementById('appModalBody');
    if (overlay && body) {
      body.innerHTML = html;
      overlay.classList.remove('hidden');
    }
  }

  function closeModal() {
    var overlay = document.getElementById('appModalOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // ===== トースト =====
  function showToast(msg, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = msg;
    container.appendChild(toast);

    requestAnimationFrame(function() { toast.classList.add('show'); });

    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // ===== 画面描画 =====
  function renderScreen() {
    var scr = state.currentScreen;
    var isKikaku = scr === 'kikaku';
    var isProj = scr === 'project';

    // ツールバー・サマリーの表示切替
    var toolbar = document.getElementById('projectToolbar');
    var summaryBar = document.getElementById('summaryBar');
    if (toolbar) toolbar.classList.toggle('hidden', !isKikaku);
    if (summaryBar) summaryBar.classList.toggle('hidden', !isKikaku);

    // 企画切替タブの表示切替
    var kikakuTabsEl = document.getElementById('kikakuTabs');
    if (kikakuTabsEl) kikakuTabsEl.classList.toggle('hidden', !isKikaku);

    // メインビューの表示切替
    var isMembers = scr === 'members';

    var dashArea = document.getElementById('dashboardArea');
    var projArea = document.getElementById('projectViewArea');
    var kikakuArea = document.getElementById('kikakuViewArea');
    var fmtArea = document.getElementById('fmtSettingsArea');
    var folderArea = document.getElementById('folderDbArea');
    var membersArea = document.getElementById('membersArea');

    if (dashArea) dashArea.classList.toggle('hidden', scr !== 'dashboard');
    if (projArea) projArea.classList.toggle('hidden', !isProj);
    if (kikakuArea) kikakuArea.classList.toggle('hidden', !isKikaku);
    if (fmtArea) fmtArea.classList.toggle('hidden', scr !== 'fmt_settings');
    if (folderArea) folderArea.classList.toggle('hidden', scr !== 'folder_db');
    if (membersArea) membersArea.classList.toggle('hidden', !isMembers);

    // サイドバーナビ
    var dashBtn = document.getElementById('dashboardNavBtn');
    var fmtBtn = document.getElementById('fmtNavBtn');
    var folderBtn = document.getElementById('folderNavBtn');
    var membersBtn = document.getElementById('membersNavBtn');
    if (dashBtn) dashBtn.classList.toggle('active', scr === 'dashboard');
    if (fmtBtn) fmtBtn.classList.toggle('active', scr === 'fmt_settings');
    if (folderBtn) folderBtn.classList.toggle('active', scr === 'folder_db');
    if (membersBtn) membersBtn.classList.toggle('active', isMembers);

    renderSidebar();
    renderBreadcrumb();

    if (scr === 'dashboard') {
      renderDashboard();
    } else if (isProj) {
      renderProjectView();
    } else if (isKikaku) {
      renderSummary();
      renderKikakuTabs();
      renderActiveView();
    } else if (scr === 'fmt_settings') {
      if (views['fmt_settings'] && views['fmt_settings'].render) {
        var el = document.getElementById('fmtSettingsArea');
        if (el) views['fmt_settings'].render(el);
      }
    } else if (scr === 'folder_db') {
      if (views['folder_db'] && views['folder_db'].render) {
        var el2 = document.getElementById('folderDbArea');
        if (el2) views['folder_db'].render(el2);
      }
    } else if (isMembers) {
      if (views['members'] && views['members'].render) {
        var membersEl = document.getElementById('membersArea');
        if (membersEl) views['members'].render(membersEl);
      }
    }
  }

  // ===== パンくず =====
  function renderBreadcrumb() {
    var el = document.getElementById('breadcrumb');
    if (!el) return;
    var scr = state.currentScreen;
    if (scr === 'dashboard') {
      el.innerHTML = '';
    } else if (scr === 'fmt_settings') {
      el.innerHTML = '<a onclick="App.navigate(\'dashboard\')">ダッシュボード</a><span class="sep">\u203A</span><span>FMT設定</span>';
    } else if (scr === 'folder_db') {
      el.innerHTML = '<a onclick="App.navigate(\'dashboard\')">ダッシュボード</a><span class="sep">\u203A</span><span>フォルダDB設計</span>';
    } else if (scr === 'members') {
      el.innerHTML = '<a onclick="App.navigate(\'dashboard\')">ダッシュボード</a><span class="sep">\u203A</span><span>チームメンバー</span>';
    } else if (scr === 'project') {
      var proj = getActiveProject();
      el.innerHTML = '<a onclick="App.navigate(\'dashboard\')">ダッシュボード</a><span class="sep">\u203A</span><span>' +
        (proj ? escH(proj.name) : '') + '</span>';
    } else if (scr === 'kikaku') {
      var proj2 = getActiveProject();
      var kikaku = getActiveKikaku();
      el.innerHTML = '<a onclick="App.navigate(\'dashboard\')">ダッシュボード</a><span class="sep">\u203A</span>' +
        '<a onclick="App.navigate(\'project\',{projectId:\'' + (proj2 ? proj2.id : '') + '\'})">' +
        (proj2 ? escH(proj2.name) : '') + '</a><span class="sep">\u203A</span><span>' +
        (kikaku ? escH(kikaku.name) : '') + '</span>';
    }
  }

  // ===== サイドバー =====
  function renderSidebar() {
    var el = document.getElementById('projectList');
    if (!el) return;
    var html = '';
    state.projects.forEach(function(p) {
      var isActive = p.id === state.activeProjectId &&
        (state.currentScreen === 'project' || state.currentScreen === 'kikaku');
      var cls = 'sidebar-item' + (isActive ? ' active' : '');
      html += '<div class="' + cls + '" onclick="App.navigate(\'project\',{projectId:\'' + p.id + '\'})">';
      html += '<span class="sidebar-item-name">' + escH(p.name) + '</span>';
      html += '<span class="sidebar-item-actions">';
      html += '<button onclick="event.stopPropagation();App._renameProjectUI(\'' + p.id + '\')" title="名前変更">\u270E</button>';
      html += '<button class="del" onclick="event.stopPropagation();App._deleteProjectUI(\'' + p.id + '\')" title="削除">\u2715</button>';
      html += '</span></div>';
    });
    el.innerHTML = html;
  }

  // ===== ダッシュボード =====
  function renderDashboard() {
    var el = document.getElementById('dashboardArea');
    if (!el) return;

    if (views['dashboard'] && views['dashboard'].render) {
      views['dashboard'].render(el);
      return;
    }

    var html = '<div class="dashboard-view"><div class="dashboard-title">プロジェクト一覧</div><div class="dashboard-grid">';
    state.projects.forEach(function(p) {
      var totalTasks = 0, doneTasks = 0, notStartedTasks = 0;
      (p.kikakus || []).forEach(function(k) {
        (k.tasks || []).forEach(function(t) {
          totalTasks++;
          if (t.status === 'completed') doneTasks++;
          if (t.status === 'not_started') notStartedTasks++;
        });
      });
      var prog = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0;
      var inProg = totalTasks - doneTasks - notStartedTasks;
      var kikakuCount = (p.kikakus || []).length;

      html += '<div class="project-card" onclick="App.navigate(\'project\',{projectId:\'' + p.id + '\'})">';
      html += '<div class="project-card-name">' + escH(p.name) + '</div>';
      if (p.client) html += '<div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.4rem">' + escH(p.client) + '</div>';
      html += '<div class="project-card-stats">';
      html += '<span>\uD83D\uDCC1 ' + kikakuCount + ' 企画</span>';
      html += '<span>全 <b>' + totalTasks + '</b> 工程</span>';
      html += '<span style="color:var(--success)">完了 ' + doneTasks + '</span>';
      html += '<span style="color:var(--accent-light)">進行中 ' + inProg + '</span>';
      html += '</div>';
      html += '<div class="progress-bar"><div class="progress-bar-fill" style="width:' + prog + '%"></div></div>';
      html += '<div class="project-card-footer"><span>進捗 ' + prog + '%</span><span>' + totalTasks + ' 工程</span></div>';
      html += '</div>';
    });
    html += '<div class="project-card-add" onclick="App._showNewProjectModal()">\uFF0B 新規プロジェクト</div>';
    html += '</div></div>';
    el.innerHTML = html;
  }

  // ===== プロジェクトビュー（企画一覧） =====
  function renderProjectView() {
    var el = document.getElementById('projectViewArea');
    if (!el) return;
    var proj = getActiveProject();
    if (!proj) {
      el.innerHTML = '<div class="dashboard-view"><p style="color:var(--text-muted)">プロジェクトが見つかりません</p></div>';
      return;
    }

    var html = '<div class="dashboard-view">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
    html += '<div class="dashboard-title" style="margin-bottom:0">' + escH(proj.name) + ' — 企画一覧</div>';
    html += '<button class="toolbar-btn" onclick="App._showNewKikakuModal()">\uFF0B 新規企画</button>';
    html += '</div>';

    if (proj.client || proj.mediaName) {
      html += '<div style="font-size:.8rem;color:var(--text-muted);margin-bottom:1rem">';
      if (proj.client) html += 'クライアント: ' + escH(proj.client) + ' ';
      if (proj.mediaName) html += '| 媒体: ' + escH(proj.mediaName);
      html += '</div>';
    }

    html += '<div class="dashboard-grid">';
    (proj.kikakus || []).forEach(function(k) {
      var total = (k.tasks || []).length;
      var done = 0;
      (k.tasks || []).forEach(function(t) { if (t.status === 'completed') done++; });
      var prog = total ? Math.round(done / total * 100) : 0;

      html += '<div class="project-card" onclick="App.navigate(\'kikaku\',{projectId:\'' + proj.id + '\',kikakuId:\'' + k.id + '\'})">';
      html += '<div class="project-card-name">' + escH(k.name) + '</div>';
      if (k.issueNumber) html += '<div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.3rem">' + escH(k.issueNumber) + '</div>';
      if (k.rank) html += '<span style="font-size:.65rem;padding:.1rem .4rem;border-radius:4px;background:var(--accent-dim);color:var(--accent-light)">ランク ' + escH(k.rank) + '</span> ';
      html += '<div class="project-card-stats" style="margin-top:.5rem">';
      html += '<span>全 <b>' + total + '</b> 工程</span>';
      html += '<span style="color:var(--success)">完了 ' + done + '</span>';
      html += '</div>';
      html += '<div class="progress-bar"><div class="progress-bar-fill" style="width:' + prog + '%"></div></div>';
      html += '<div class="project-card-footer">';
      html += '<span>進捗 ' + prog + '%</span>';
      html += '<span class="sidebar-item-actions" style="opacity:1">';
      html += '<button onclick="event.stopPropagation();App._renameKikakuUI(\'' + proj.id + '\',\'' + k.id + '\')" title="名前変更">\u270E</button>';
      html += '<button class="del" onclick="event.stopPropagation();App._deleteKikakuUI(\'' + proj.id + '\',\'' + k.id + '\')" title="削除">\u2715</button>';
      html += '</span>';
      html += '</div>';
      html += '</div>';
    });
    html += '<div class="project-card-add" onclick="App._showNewKikakuModal()">\uFF0B 新規企画を追加</div>';
    html += '</div></div>';
    el.innerHTML = html;
  }

  // ===== 企画内タブ（企画切替） =====
  function renderKikakuTabs() {
    var proj = getActiveProject();
    var tabsEl = document.getElementById('kikakuTabs');
    if (!tabsEl || !proj) return;

    var html = '';
    (proj.kikakus || []).forEach(function(k) {
      var isActive = k.id === state.activeKikakuId;
      html += '<button class="tab-btn' + (isActive ? ' active' : '') + '" ' +
        'onclick="App.navigate(\'kikaku\',{kikakuId:\'' + k.id + '\'})">' +
        escH(k.name) + '</button>';
    });
    html += '<button class="tab-btn" onclick="App._showNewKikakuModal()" style="color:var(--text-dim)">\uFF0B</button>';
    tabsEl.innerHTML = html;
  }

  // ===== サマリーバー =====
  function renderSummary() {
    var kikaku = getActiveKikaku();
    var el = document.getElementById('summaryBar');
    if (!el) return;
    if (!kikaku || !kikaku.tasks || !kikaku.tasks.length) {
      el.innerHTML = '<div class="stat-chip">工程なし</div>';
      return;
    }
    var total = kikaku.tasks.length, late = 0, early = 0, done = 0, totalHours = 0;
    kikaku.tasks.forEach(function(t) {
      if (t.status === 'completed') done++;
      totalHours += (t.estimatedHours || 0);
      if (t.planEnd && t.actualEnd) {
        var d = diffDays(parseD(t.planEnd), parseD(t.actualEnd));
        if (d > 0) late++;
        else if (d < 0) early++;
      }
    });
    var html = '<div class="stat-chip">総数 <span class="val blue">' + total + '</span></div>';
    html += '<div class="stat-chip">完了 <span class="val green">' + done + '</span></div>';
    html += '<div class="stat-chip">遅延 <span class="val red">' + late + '</span></div>';
    html += '<div class="stat-chip">前倒し <span class="val yellow">' + early + '</span></div>';
    html += '<div class="stat-chip">進捗 <span class="val blue">' + Math.round(done / total * 100) + '%</span></div>';
    html += '<div class="stat-chip">総工数 <span class="val blue">' + totalHours + 'h</span></div>';
    el.innerHTML = html;
  }

  // ===== UIアクション =====
  function renderAll() {
    renderScreen();
  }

  // --- 媒体タイプ→FMT自動マッピング ---
  var MEDIA_TYPES = [
    { value: 'shanaiho',  label: '社内報',   fmtId: 'fmt_print' },
    { value: 'kohoushi',  label: '広報誌',   fmtId: 'fmt_print' },
    { value: 'web',       label: 'Web',      fmtId: 'fmt_web' },
    { value: 'video',     label: '映像',     fmtId: 'fmt_video' },
    { value: 'sns',       label: 'SNS',      fmtId: 'fmt_sns' },
    { value: 'other',     label: 'その他',   fmtId: '' }
  ];

  // --- 新規プロジェクト ---
  function _showNewProjectModal() {
    var html = '<div class="modal-header"><h2>新規プロジェクト作成</h2>' +
      '<button onclick="App.closeModal()">\u2715</button></div>' +
      '<div class="modal-body">' +
      '<div class="np-field"><label>プロジェクト名（案件/クライアント名）</label>' +
      '<input type="text" id="npName" value="" placeholder="例: ダイハツ工業 社内報"></div>' +
      '<div class="np-field"><label>クライアント名</label>' +
      '<input type="text" id="npClient" value="" placeholder="例: ダイハツ工業株式会社"></div>' +
      '<div class="np-field"><label>媒体名</label>' +
      '<input type="text" id="npMedia" value="" placeholder="例: 社内報「つながり」"></div>' +
      '<div class="np-field"><label>媒体タイプ</label>' +
      '<select id="npMediaType" onchange="App._onMediaTypeChange()">';
    MEDIA_TYPES.forEach(function(mt) {
      html += '<option value="' + mt.value + '">' + escH(mt.label) + '</option>';
    });
    html += '</select></div>' +
      '</div>' +
      '<div class="modal-footer">' +
      '<button class="btn-secondary" onclick="App.closeModal()">キャンセル</button>' +
      '<button class="btn-primary" onclick="App._executeNewProject()">作成</button>' +
      '</div>';
    showModal(html);
  }

  function _onMediaTypeChange() {
    // 媒体タイプ変更時の自動処理（将来的なFMT連動フック）
  }

  function _executeNewProject() {
    var nameEl = document.getElementById('npName');
    var clientEl = document.getElementById('npClient');
    var mediaEl = document.getElementById('npMedia');
    var mediaTypeEl = document.getElementById('npMediaType');
    if (!nameEl) return;

    var name = nameEl.value.trim();
    if (!name) { showToast('プロジェクト名を入力してください', 'error'); return; }

    var mediaType = mediaTypeEl ? mediaTypeEl.value : 'other';

    var proj = addProject({
      name: name,
      client: clientEl ? clientEl.value.trim() : '',
      mediaName: mediaEl ? mediaEl.value.trim() : '',
      mediaType: mediaType
    });

    Data.save(state);
    closeModal();
    navigate('project', { projectId: proj.id });
    showToast('プロジェクト「' + name + '」を作成しました', 'success');
  }

  // --- 新規企画 ---
  function _showNewKikakuModal() {
    var proj = getActiveProject();
    if (!proj) { showToast('プロジェクトを先に選択してください', 'error'); return; }

    // プロジェクトの媒体タイプからFMTを自動推奨
    var autoFmtId = '';
    if (proj.mediaType) {
      for (var i = 0; i < MEDIA_TYPES.length; i++) {
        if (MEDIA_TYPES[i].value === proj.mediaType) {
          autoFmtId = MEDIA_TYPES[i].fmtId || '';
          break;
        }
      }
    }

    var html = '<div class="modal-header"><h2>新規企画作成</h2>' +
      '<button onclick="App.closeModal()">\u2715</button></div>' +
      '<div class="modal-body">' +
      '<div class="np-field"><label>企画名</label>' +
      '<input type="text" id="nkName" value="" placeholder="例: vol.42 夏号 / 特集: 新入社員紹介"></div>' +
      '<div class="np-field"><label>号数・発行月</label>' +
      '<input type="text" id="nkIssue" value="" placeholder="例: vol.42 / 2026年6月号"></div>' +
      '<div class="np-field"><label>案件ランク</label>' +
      '<select id="nkRank"><option value="">なし</option>';
    Data.RANK_LIST.forEach(function(r) {
      html += '<option value="' + r + '">ランク ' + r + '</option>';
    });
    html += '</select></div>' +
      '<div class="np-field"><label>FMTテンプレート</label>' +
      '<select id="nkFmt"><option value="">テンプレートなし</option>';
    state.fmts.forEach(function(f) {
      var sel = f.id === autoFmtId ? ' selected' : '';
      html += '<option value="' + f.id + '"' + sel + '>' + escH(f.name) + '</option>';
    });
    html += '</select>';
    if (autoFmtId) {
      html += '<div style="font-size:.7rem;color:var(--text-muted);margin-top:.2rem">※ 媒体タイプに基づき自動選択されています</div>';
    }
    html += '</div>' +
      '</div>' +
      '<div class="modal-footer">' +
      '<button class="btn-secondary" onclick="App.closeModal()">キャンセル</button>' +
      '<button class="btn-primary" onclick="App._executeNewKikaku()">作成</button>' +
      '</div>';
    showModal(html);
  }

  function _executeNewKikaku() {
    var proj = getActiveProject();
    if (!proj) return;

    var nameEl = document.getElementById('nkName');
    var issueEl = document.getElementById('nkIssue');
    var rankEl = document.getElementById('nkRank');
    var fmtEl = document.getElementById('nkFmt');
    if (!nameEl) return;

    var name = nameEl.value.trim();
    if (!name) { showToast('企画名を入力してください', 'error'); return; }

    var fmtId = fmtEl ? fmtEl.value : '';
    var kikaku = addKikaku(proj, {
      name: name,
      issueNumber: issueEl ? issueEl.value.trim() : '',
      rank: rankEl ? rankEl.value : '',
      fmtId: fmtId || null
    });

    // FMTからタスク自動生成
    if (fmtId) {
      var fmt = state.fmts.find(function(f) { return f.id === fmtId; });
      if (fmt) {
        fmt.actions.forEach(function(a) {
          addTask(kikaku, { name: a.name, estimatedHours: a.defaultHours });
        });
      }
    }

    Data.save(state);
    closeModal();
    // 企画作成後、即テーブルビューに遷移
    state.activeView = 'table';
    navigate('kikaku', { projectId: proj.id, kikakuId: kikaku.id });
    showToast('企画「' + name + '」を作成しました', 'success');
  }

  function _renameProjectUI(id) {
    var p = state.projects.find(function(x) { return x.id === id; });
    if (!p) return;
    var name = prompt('新しいプロジェクト名', p.name);
    if (name !== null && name.trim()) {
      renameProject(id, name.trim());
      renderAll();
    }
  }

  function _deleteProjectUI(id) {
    var p = state.projects.find(function(x) { return x.id === id; });
    if (p && confirm('「' + p.name + '」を削除しますか？\n含まれる全企画・工程も削除されます。')) {
      deleteProject(id);
      renderAll();
    }
  }

  function _renameKikakuUI(projId, kikakuId) {
    var p = state.projects.find(function(x) { return x.id === projId; });
    if (!p) return;
    var k = p.kikakus.find(function(x) { return x.id === kikakuId; });
    if (!k) return;
    var name = prompt('新しい企画名', k.name);
    if (name !== null && name.trim()) {
      renameKikaku(p, kikakuId, name.trim());
      renderAll();
    }
  }

  function _deleteKikakuUI(projId, kikakuId) {
    var p = state.projects.find(function(x) { return x.id === projId; });
    if (!p) return;
    var k = p.kikakus.find(function(x) { return x.id === kikakuId; });
    if (k && confirm('企画「' + k.name + '」を削除しますか？\n含まれる全工程も削除されます。')) {
      deleteKikaku(p, kikakuId);
      renderAll();
    }
  }

  // ===== サイドバー切替（モバイル） =====
  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  }

  // ===== 初期化 =====
  function init() {
    var loaded = Data.load();
    if (loaded) {
      state = loaded;
    } else {
      state = Data.createDefaultState();
      // サンプルプロジェクト
      var proj = Data.createProject({ name: 'ブランドサイト リニューアル', client: 'サンプル株式会社' });
      var kikaku = Data.createKikaku({ name: 'メインサイト刷新' });
      var samples = [
        {name: '企画・コンセプト策定', planStart: '2026-02-02', planEnd: '2026-02-04', actualStart: '2026-02-02', actualEnd: '2026-02-06', status: 'completed', note: '要件定義含む', estimatedHours: 24},
        {name: 'デザインカンプ作成', planStart: '2026-02-05', planEnd: '2026-02-09', actualStart: '2026-02-07', actualEnd: '2026-02-10', status: 'completed', note: '3案作成', estimatedHours: 40},
        {name: 'コーディング・実装', planStart: '2026-02-10', planEnd: '2026-02-16', actualStart: '2026-02-11', actualEnd: '2026-02-17', status: 'completed', note: 'レスポンシブ対応', estimatedHours: 56},
        {name: 'クライアントレビュー', planStart: '2026-02-17', planEnd: '2026-02-18', actualStart: '2026-02-18', actualEnd: '2026-02-21', status: 'completed', note: '修正要望多数', estimatedHours: 8},
        {name: '修正対応', planStart: '2026-02-19', planEnd: '2026-02-21', actualStart: '2026-02-22', actualEnd: '2026-02-23', status: 'completed', note: 'デザイン微調整', estimatedHours: 20},
        {name: '最終チェック・納品', planStart: '2026-02-22', planEnd: '2026-02-22', actualStart: '2026-02-24', actualEnd: '2026-02-24', status: 'completed', note: '納品完了', estimatedHours: 6}
      ];
      samples.forEach(function(s) {
        kikaku.tasks.push(Data.createTask(s));
      });
      proj.kikakus.push(kikaku);
      state.projects.push(proj);
      state.currentScreen = 'dashboard';
      Data.save(state);
    }

    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== 公開API =====
  window.App = {
    // State管理
    getState: getState,
    setState: setState,
    getActiveProject: getActiveProject,
    getActiveKikaku: getActiveKikaku,

    // ナビゲーション
    navigate: navigate,
    switchView: switchView,
    renderAll: renderAll,

    // モーダル
    showModal: showModal,
    closeModal: closeModal,

    // トースト
    showToast: showToast,

    // ユーティリティ
    escH: escH,
    parseD: parseD,
    fmtD: fmtD,
    fmtISO: fmtISO,
    addDays: addDays,
    diffDays: diffDays,

    // ビュー管理
    registerView: registerView,
    renderActiveView: renderActiveView,

    // プロジェクト操作
    addProject: addProject,
    deleteProject: deleteProject,
    renameProject: renameProject,

    // 企画操作
    addKikaku: addKikaku,
    deleteKikaku: deleteKikaku,
    renameKikaku: renameKikaku,

    // タスク操作
    addTask: addTask,
    updateTask: updateTask,
    deleteTask: deleteTask,

    // 内部UIアクション
    _showNewProjectModal: _showNewProjectModal,
    _executeNewProject: _executeNewProject,
    _onMediaTypeChange: _onMediaTypeChange,
    _showNewKikakuModal: _showNewKikakuModal,
    _executeNewKikaku: _executeNewKikaku,
    _renameProjectUI: _renameProjectUI,
    _deleteProjectUI: _deleteProjectUI,
    _renameKikakuUI: _renameKikakuUI,
    _deleteKikakuUI: _deleteKikakuUI,
    toggleSidebar: toggleSidebar
  };

})();
