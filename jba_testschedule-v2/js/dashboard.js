/**
 * dashboard.js — ダッシュボード拡張ビュー + AlertHelper
 * cmd_023 Phase3 s9r（bushi3実装の再現）
 *
 * App.registerView('dashboard', { init, render }) でダッシュボード画面を拡張。
 * app.js の fallback dashboard を上書きし、以下の機能を提供:
 *   - プロジェクトカード一覧（ランクバッジ/アラートバッジ/担当者アイコン/進捗バー）
 *   - 全プロジェクト横断サマリーバー
 *   - 今週期限タスクパネル
 *   - AlertHelper（window.AlertHelper — 他モジュール連携用）
 *   - 自己完結型CSS注入
 *
 * 後方互換: 旧 project.tasks 直接配列と新 project.kikakus[].tasks の両方に対応。
 *
 * 使用API:
 *   App.getState() / App.navigate() / App.escH() / App.showToast()
 *   App.parseD() / App.fmtD() / App.fmtISO() / App.diffDays()
 *   App._showNewProjectModal()
 *   Data.getAllTasks(project) / Data.STATUS_LABELS
 */
(function() {
  'use strict';

  // ===== CSS注入 =====
  var CSS_INJECTED = false;
  function injectCSS() {
    if (CSS_INJECTED) return;
    CSS_INJECTED = true;
    var style = document.createElement('style');
    style.textContent = [
      /* サマリーバー */
      '.dash-summary { display:flex; flex-wrap:wrap; gap:.75rem; margin-bottom:1.25rem; padding:1rem; background:var(--surface, #1a1d27); border:1px solid var(--border, #2a2d3a); border-radius:8px; }',
      '.dash-summary-item { display:flex; flex-direction:column; align-items:center; min-width:80px; padding:.4rem .75rem; }',
      '.dash-summary-label { font-size:.65rem; color:var(--text-muted, #71717a); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.25rem; }',
      '.dash-summary-value { font-size:1.4rem; font-weight:700; }',
      '.dash-summary-value.blue { color:var(--accent-light, #818cf8); }',
      '.dash-summary-value.green { color:var(--success, #4ade80); }',
      '.dash-summary-value.red { color:var(--danger, #f87171); }',
      '.dash-summary-value.yellow { color:var(--warning, #fbbf24); }',
      '.dash-summary-value.orange { color:#fb923c; }',

      /* 今週期限パネル */
      '.dash-deadline-panel { margin-bottom:1.25rem; padding:1rem; background:var(--surface, #1a1d27); border:1px solid var(--border, #2a2d3a); border-radius:8px; }',
      '.dash-deadline-title { font-size:.85rem; font-weight:600; margin-bottom:.75rem; display:flex; align-items:center; gap:.5rem; }',
      '.dash-deadline-badge { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 6px; border-radius:10px; font-size:.7rem; font-weight:700; }',
      '.dash-deadline-badge.urgent { background:var(--danger, #f87171); color:#fff; }',
      '.dash-deadline-badge.normal { background:var(--accent-dim, #312e81); color:var(--accent-light, #818cf8); }',
      '.dash-deadline-list { list-style:none; padding:0; margin:0; }',
      '.dash-deadline-item { display:flex; align-items:center; gap:.75rem; padding:.5rem .4rem; border-bottom:1px solid var(--border, #2a2d3a); font-size:.8rem; }',
      '.dash-deadline-item:last-child { border-bottom:none; }',
      '.dash-deadline-date { min-width:50px; font-weight:600; color:var(--text-muted, #71717a); }',
      '.dash-deadline-date.overdue { color:var(--danger, #f87171); }',
      '.dash-deadline-date.today { color:var(--warning, #fbbf24); }',
      '.dash-deadline-project { font-size:.7rem; color:var(--text-dim, #52525b); margin-left:auto; max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.dash-deadline-assignee { font-size:.7rem; padding:.1rem .4rem; border-radius:4px; background:var(--accent-dim, #312e81); color:var(--accent-light, #818cf8); }',
      '.dash-deadline-empty { padding:.75rem; font-size:.8rem; color:var(--text-muted, #71717a); text-align:center; }',

      /* プロジェクトカード拡張 */
      '.dash-card-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:.5rem; }',
      '.dash-card-badges { display:flex; gap:.35rem; flex-wrap:wrap; }',
      '.dash-rank-badge { font-size:.6rem; font-weight:700; padding:.15rem .4rem; border-radius:4px; letter-spacing:.03em; }',
      '.dash-rank-badge.rank-A { background:#166534; color:#4ade80; }',
      '.dash-rank-badge.rank-B { background:#1e3a5f; color:#60a5fa; }',
      '.dash-rank-badge.rank-C { background:#713f12; color:#fbbf24; }',
      '.dash-rank-badge.rank-D { background:#7f1d1d; color:#fca5a5; }',
      '.dash-alert-badge { font-size:.6rem; font-weight:700; padding:.15rem .4rem; border-radius:4px; background:var(--danger, #f87171); color:#fff; }',
      '.dash-card-assignees { display:flex; gap:.2rem; margin-top:.5rem; flex-wrap:wrap; }',
      '.dash-assignee-chip { font-size:.6rem; padding:.1rem .35rem; border-radius:3px; background:var(--accent-dim, #312e81); color:var(--accent-light, #818cf8); max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.dash-card-client { font-size:.7rem; color:var(--text-muted, #71717a); margin-bottom:.4rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.dash-card-meta { display:flex; gap:.75rem; font-size:.7rem; color:var(--text-dim, #52525b); margin-top:.35rem; }',

      /* セクションタイトル */
      '.dash-section-title { font-size:.9rem; font-weight:600; margin-bottom:.75rem; padding-bottom:.5rem; border-bottom:1px solid var(--border, #2a2d3a); }',

      /* アラートリスト */
      '.dash-alerts-panel { margin-bottom:1.25rem; padding:1rem; background:var(--surface, #1a1d27); border:1px solid var(--danger, #f87171)44; border-radius:8px; }',
      '.dash-alert-item { display:flex; align-items:center; gap:.75rem; padding:.4rem .4rem; font-size:.8rem; border-bottom:1px solid var(--border, #2a2d3a); }',
      '.dash-alert-item:last-child { border-bottom:none; }',
      '.dash-alert-icon { font-size:1rem; flex-shrink:0; }',
      '.dash-alert-text { flex:1; }',

      /* 最近の更新パネル */
      '.dash-recent-panel { margin-bottom:1.25rem; padding:1rem; background:var(--surface, #1a1d27); border:1px solid var(--border, #2a2d3a); border-radius:8px; }',
      '.dash-recent-item { display:flex; align-items:center; gap:.6rem; padding:.45rem .4rem; border-bottom:1px solid var(--border, #2a2d3a); font-size:.8rem; cursor:pointer; transition:background .12s; }',
      '.dash-recent-item:last-child { border-bottom:none; }',
      '.dash-recent-item:hover { background:var(--surface2, #242836); }',
      '.dash-recent-task { flex:1; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.dash-recent-meta { font-size:.65rem; color:var(--text-dim, #52525b); white-space:nowrap; }',
      '.dash-recent-status { font-size:.6rem; padding:.1rem .35rem; border-radius:3px; white-space:nowrap; }',
      '.dash-recent-status.completed { background:rgba(74,222,128,.12); color:var(--success, #4ade80); }',
      '.dash-recent-status.in_progress { background:rgba(129,140,248,.12); color:var(--accent-light, #818cf8); }',
      '.dash-recent-status.not_started { background:rgba(113,113,122,.12); color:var(--text-muted, #71717a); }',
      '.dash-recent-status.on_hold { background:rgba(251,191,36,.12); color:var(--warning, #fbbf24); }',

      /* 次のアクション */
      '.dash-next-action { font-size:.7rem; color:var(--text-muted, #71717a); margin-top:.4rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.dash-next-action .next-label { color:var(--accent-light, #818cf8); font-weight:600; }',
      '.dash-next-action .all-done { color:var(--success, #4ade80); }',

      /* メンバー案内カード */
      '.welcome-card { margin-bottom:1.25rem; padding:1.25rem; background:linear-gradient(135deg, rgba(99,102,241,.08), rgba(99,102,241,.02)); border:1px solid var(--accent-dim, #312e81); border-radius:8px; }',
      '.welcome-card h3 { font-size:.9rem; font-weight:700; margin-bottom:.4rem; }',
      '.welcome-card p { font-size:.8rem; color:var(--text-muted, #71717a); margin-bottom:.75rem; }',
      '.welcome-card button { padding:.45rem 1rem; border-radius:6px; font-size:.8rem; background:var(--accent, #6366f1); color:#fff; border:none; cursor:pointer; font-weight:600; transition:background .15s; }',
      '.welcome-card button:hover { background:var(--accent-light, #818cf8); }',

      /* 進捗バー色段階（style.css側のクラスにマッチするフォールバック） */
      '.progress-bar.danger .progress-bar-fill { background:var(--danger, #f87171) !important; }',
      '.progress-bar.warning .progress-bar-fill { background:var(--warning, #fbbf24) !important; }',
      '.progress-bar.success .progress-bar-fill { background:var(--success, #4ade80) !important; }',

      /* ダッシュボード全体 */
      '.dash-container { padding:0; }',
      '@media (max-width:768px) { .dash-summary { gap:.4rem; } .dash-summary-item { min-width:60px; padding:.3rem .4rem; } .dash-summary-value { font-size:1.1rem; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ===== ヘルパー: 後方互換 =====

  /**
   * プロジェクトから全企画を取得（旧フォーマット対応）
   * 旧: project.tasks → 仮想企画1つにラップ
   * 新: project.kikakus
   */
  function getKikakus(project) {
    if (!project) return [];
    if (project.kikakus && project.kikakus.length) return project.kikakus;
    // 旧フォーマット: tasks直下
    if (project.tasks && project.tasks.length) {
      return [{ id: '_legacy', name: project.name, tasks: project.tasks, rank: project.rank || '' }];
    }
    return project.kikakus || [];
  }

  /**
   * プロジェクトの全タスクをフラットに取得
   */
  function getAllTasks(project) {
    var tasks = [];
    var kikakus = getKikakus(project);
    kikakus.forEach(function(k) {
      (k.tasks || []).forEach(function(t) {
        tasks.push({ task: t, kikaku: k, project: project });
      });
    });
    return tasks;
  }

  /**
   * 全プロジェクトの全タスクを取得
   */
  function getAllTasksGlobal(state) {
    var tasks = [];
    (state.projects || []).forEach(function(p) {
      getAllTasks(p).forEach(function(item) {
        tasks.push(item);
      });
    });
    return tasks;
  }

  // ===== ヘルパー: 日付 =====

  function todayStr() {
    return App.fmtISO(new Date());
  }

  function getWeekRange() {
    var now = new Date();
    var day = now.getDay(); // 0=日
    var diff = day === 0 ? -6 : 1 - day; // 月曜開始
    var monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() + diff);
    var sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }

  // ===== ヘルパー: 統計 =====

  function computeProjectStats(project) {
    var items = getAllTasks(project);
    var total = items.length;
    var completed = 0, delayed = 0, early = 0, inProgress = 0, onHold = 0;
    var totalHours = 0;
    var assignees = {};
    var today = todayStr();

    items.forEach(function(item) {
      var t = item.task;
      totalHours += (t.estimatedHours || 0);
      if (t.assignee) assignees[t.assignee] = true;

      if (t.status === 'completed') {
        completed++;
        if (t.planEnd && t.actualEnd) {
          var d = App.diffDays(App.parseD(t.planEnd), App.parseD(t.actualEnd));
          if (d > 0) delayed++;
          else if (d < 0) early++;
        }
      } else if (t.status === 'in_progress') {
        inProgress++;
        // 進行中で予定超過
        if (t.planEnd && t.planEnd < today) delayed++;
      } else if (t.status === 'on_hold') {
        onHold++;
      }
    });

    return {
      total: total,
      completed: completed,
      delayed: delayed,
      early: early,
      inProgress: inProgress,
      onHold: onHold,
      totalHours: totalHours,
      progress: total ? Math.round(completed / total * 100) : 0,
      assignees: Object.keys(assignees),
      kikakuCount: getKikakus(project).length
    };
  }

  function computeGlobalStats(state) {
    var total = 0, completed = 0, delayed = 0, early = 0, inProgress = 0, onHold = 0;
    var totalHours = 0;
    var projectCount = (state.projects || []).length;
    var kikakuCount = 0;
    var today = todayStr();

    (state.projects || []).forEach(function(p) {
      kikakuCount += getKikakus(p).length;
      getAllTasks(p).forEach(function(item) {
        var t = item.task;
        total++;
        totalHours += (t.estimatedHours || 0);
        if (t.status === 'completed') {
          completed++;
          if (t.planEnd && t.actualEnd) {
            var d = App.diffDays(App.parseD(t.planEnd), App.parseD(t.actualEnd));
            if (d > 0) delayed++;
            else if (d < 0) early++;
          }
        } else if (t.status === 'in_progress') {
          inProgress++;
          if (t.planEnd && t.planEnd < today) delayed++;
        } else if (t.status === 'on_hold') {
          onHold++;
        }
      });
    });

    return {
      projectCount: projectCount,
      kikakuCount: kikakuCount,
      total: total,
      completed: completed,
      delayed: delayed,
      early: early,
      inProgress: inProgress,
      onHold: onHold,
      totalHours: totalHours,
      progress: total ? Math.round(completed / total * 100) : 0
    };
  }

  // ===== ヘルパー: 今週期限タスク =====

  function getThisWeekDeadlines(state) {
    var range = getWeekRange();
    var results = [];
    var today = todayStr();

    (state.projects || []).forEach(function(p) {
      getAllTasks(p).forEach(function(item) {
        var t = item.task;
        if (t.status === 'completed') return;
        if (!t.planEnd) return;
        var endDate = App.parseD(t.planEnd);
        if (!endDate) return;
        // 今週内 or 既に超過（未完了）
        if (endDate <= range.end) {
          results.push({
            task: t,
            kikaku: item.kikaku,
            project: p,
            isOverdue: t.planEnd < today,
            isToday: t.planEnd === today
          });
        }
      });
    });

    // 日付順ソート
    results.sort(function(a, b) {
      if (a.task.planEnd < b.task.planEnd) return -1;
      if (a.task.planEnd > b.task.planEnd) return 1;
      return 0;
    });

    return results;
  }

  // ===== AlertHelper連携 =====
  // master版は quality.js が window.AlertHelper として定義。
  // dashboard.jsはquality.js版APIを使用する。
  // getProjectAlertCount はdashboard.js固有のためローカル関数として残す。

  function getAlertHelper() {
    return window.AlertHelper || null;
  }

  /**
   * プロジェクト単位のアラート数を取得（ダッシュボード固有）
   */
  function getProjectAlertCount(state, projectId) {
    var ah = getAlertHelper();
    if (ah && ah.getAlerts) {
      // quality.js版のgetAlertsからprojectIdでフィルタ
      var alerts = ah.getAlerts(state);
      var count = 0;
      alerts.forEach(function(a) {
        if (a.projectId === projectId) count++;
      });
      return count;
    }
    // フォールバック: AlertHelper未定義時
    var count = 0;
    var today = todayStr();
    var p = (state.projects || []).find(function(x) { return x.id === projectId; });
    if (!p) return 0;
    getAllTasks(p).forEach(function(item) {
      var t = item.task;
      if (t.status !== 'completed' && t.planEnd && t.planEnd < today) count++;
      if (t.status === 'on_hold') count++;
    });
    return count;
  }

  // ===== 描画: サマリーバー =====

  function renderSummary(state) {
    var stats = computeGlobalStats(state);
    var html = '<div class="dash-summary">';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">プロジェクト</div><div class="dash-summary-value blue">' + stats.projectCount + '</div></div>';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">企画</div><div class="dash-summary-value blue">' + stats.kikakuCount + '</div></div>';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">全工程</div><div class="dash-summary-value blue">' + stats.total + '</div></div>';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">完了</div><div class="dash-summary-value green">' + stats.completed + '</div></div>';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">進行中</div><div class="dash-summary-value blue">' + stats.inProgress + '</div></div>';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">遅延</div><div class="dash-summary-value red">' + stats.delayed + '</div></div>';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">前倒し</div><div class="dash-summary-value yellow">' + stats.early + '</div></div>';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">保留</div><div class="dash-summary-value orange">' + stats.onHold + '</div></div>';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">進捗率</div><div class="dash-summary-value ' + (stats.progress >= 80 ? 'green' : stats.progress >= 50 ? 'yellow' : 'red') + '">' + stats.progress + '%</div></div>';
    html += '<div class="dash-summary-item"><div class="dash-summary-label">総工数</div><div class="dash-summary-value blue">' + stats.totalHours + 'h</div></div>';
    html += '</div>';
    return html;
  }

  // ===== ヘルパー: 次のアクション =====

  function getNextAction(project) {
    var items = getAllTasks(project);
    for (var i = 0; i < items.length; i++) {
      var t = items[i].task;
      if (t.status !== 'completed') {
        return t;
      }
    }
    return null;
  }

  // ===== 描画: 最近の更新 =====

  function renderRecentUpdates(state) {
    var allItems = getAllTasksGlobal(state);
    if (!allItems.length) return '';

    // updatedAt or createdAt で降順ソート
    var sorted = allItems.slice().sort(function(a, b) {
      var aTime = a.task.updatedAt || a.task.createdAt || '';
      var bTime = b.task.updatedAt || b.task.createdAt || '';
      if (aTime > bTime) return -1;
      if (aTime < bTime) return 1;
      return 0;
    });

    var recent = sorted.slice(0, 5);
    // タイムスタンプが全てなければ表示しない
    var hasAnyTimestamp = recent.some(function(item) {
      return item.task.updatedAt || item.task.createdAt;
    });
    if (!hasAnyTimestamp) return '';

    var html = '<div class="dash-recent-panel">';
    html += '<div class="dash-deadline-title">';
    html += '<span>\uD83D\uDD04</span> \u6700\u8FD1\u306E\u66F4\u65B0';
    html += '</div>';

    recent.forEach(function(item) {
      var t = item.task;
      var ts = t.updatedAt || t.createdAt || '';
      var timeLabel = ts ? ts.replace('T', ' ').slice(0, 16) : '';
      var statusLabel = (Data.STATUS_LABELS && Data.STATUS_LABELS[t.status]) || t.status || '';
      var statusCls = t.status || 'not_started';

      html += '<div class="dash-recent-item" onclick="App.navigate(\'kikaku\',{projectId:\'' + item.project.id + '\',kikakuId:\'' + item.kikaku.id + '\'})">';
      html += '<span class="dash-recent-task">' + App.escH(t.name) + '</span>';
      html += '<span class="dash-recent-status ' + statusCls + '">' + App.escH(statusLabel) + '</span>';
      if (t.assignee) {
        html += '<span class="dash-deadline-assignee">' + App.escH(t.assignee) + '</span>';
      }
      html += '<span class="dash-recent-meta">' + App.escH(item.project.name) + ' / ' + App.escH(item.kikaku.name) + '</span>';
      html += '<span class="dash-recent-meta">' + App.escH(timeLabel) + '</span>';
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  // ===== 描画: アラートパネル =====

  function renderAlerts(state) {
    var ah = getAlertHelper();
    var alerts = ah ? ah.getAlerts(state) : [];
    if (!alerts.length) return '';

    var html = '<div class="dash-alerts-panel">';
    html += '<div class="dash-deadline-title">';
    html += '<span>\u26A0\uFE0F</span> アラート';
    html += '<span class="dash-deadline-badge urgent">' + alerts.length + '</span>';
    html += '</div>';

    var shown = alerts.slice(0, 10); // 最大10件表示
    shown.forEach(function(a) {
      var icon = a.type === 'overdue' ? '\u23F0' :
                 a.type === 'stale_hold' ? '\u23F8\uFE0F' :
                 a.type === 'overload' ? '\uD83D\uDD25' : '\u2139\uFE0F';
      var severityColor = a.severity === 'critical' ? 'color:var(--danger)' :
                          a.severity === 'warning' ? 'color:var(--warning)' : '';

      html += '<div class="dash-alert-item">';
      html += '<span class="dash-alert-icon">' + icon + '</span>';
      html += '<span class="dash-alert-text" style="' + severityColor + '">' + App.escH(a.message) + '</span>';
      if (a.assignee) {
        html += '<span class="dash-deadline-assignee">' + App.escH(a.assignee) + '</span>';
      }
      if (a.type === 'overdue') {
        html += '<button style="font-size:.65rem;padding:.2rem .5rem;border:1px solid var(--border);border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer" onclick="DashboardView._copyReminder(\'' + a.taskId + '\')" title="リマインド文面をコピー">\uD83D\uDCCB</button>';
      }
      html += '</div>';
    });

    if (alerts.length > 10) {
      html += '<div style="padding:.4rem;font-size:.7rem;color:var(--text-muted);text-align:center">他 ' + (alerts.length - 10) + ' 件のアラート</div>';
    }
    html += '</div>';
    return html;
  }

  // ===== 描画: 今週期限パネル =====

  function renderDeadlines(state) {
    var deadlines = getThisWeekDeadlines(state);
    var overdueCount = deadlines.filter(function(d) { return d.isOverdue; }).length;

    var html = '<div class="dash-deadline-panel">';
    html += '<div class="dash-deadline-title">';
    html += '<span>\uD83D\uDCC5</span> 今週の期限';
    if (deadlines.length) {
      var badgeCls = overdueCount > 0 ? 'urgent' : 'normal';
      html += '<span class="dash-deadline-badge ' + badgeCls + '">' + deadlines.length + '</span>';
    }
    html += '</div>';

    if (!deadlines.length) {
      html += '<div class="dash-deadline-empty">今週期限の工程はありません</div>';
    } else {
      html += '<ul class="dash-deadline-list">';
      var shown = deadlines.slice(0, 15);
      shown.forEach(function(d) {
        var dateCls = d.isOverdue ? ' overdue' : d.isToday ? ' today' : '';
        var dateLabel = d.isOverdue ? '\u8D85\u904E' : App.fmtD(App.parseD(d.task.planEnd));
        var statusLabel = Data.STATUS_LABELS[d.task.status] || d.task.status;

        html += '<li class="dash-deadline-item" onclick="App.navigate(\'kikaku\',{projectId:\'' + d.project.id + '\',kikakuId:\'' + d.kikaku.id + '\'})" style="cursor:pointer">';
        html += '<span class="dash-deadline-date' + dateCls + '">' + dateLabel + '</span>';
        html += '<span>' + App.escH(d.task.name) + '</span>';
        html += '<span style="font-size:.65rem;padding:.1rem .3rem;border-radius:3px;background:var(--surface);color:var(--text-muted)">' + statusLabel + '</span>';
        if (d.task.assignee) {
          html += '<span class="dash-deadline-assignee">' + App.escH(d.task.assignee) + '</span>';
        }
        html += '<span class="dash-deadline-project">' + App.escH(d.project.name) + '</span>';
        html += '</li>';
      });
      html += '</ul>';
      if (deadlines.length > 15) {
        html += '<div style="padding:.4rem;font-size:.7rem;color:var(--text-muted);text-align:center">他 ' + (deadlines.length - 15) + ' 件</div>';
      }
    }
    html += '</div>';
    return html;
  }

  // ===== 描画: プロジェクトカード =====

  function renderProjectCards(state) {
    var projects = state.projects || [];
    var html = '<div class="dash-section-title">\uD83D\uDCBC \u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u4E00\u89A7</div>';
    html += '<div class="dashboard-grid">';

    projects.forEach(function(p) {
      var stats = computeProjectStats(p);
      var alertCount = getProjectAlertCount(state, p.id);

      html += '<div class="project-card" onclick="App.navigate(\'project\',{projectId:\'' + p.id + '\'})">';

      // ヘッダー（名前 + バッジ）
      html += '<div class="dash-card-header">';
      html += '<div class="project-card-name">' + App.escH(p.name) + '</div>';
      html += '<div class="dash-card-badges">';
      if (p.rank) {
        html += '<span class="dash-rank-badge rank-' + App.escH(p.rank) + '">' + App.escH(p.rank) + '</span>';
      }
      if (alertCount > 0) {
        html += '<span class="dash-alert-badge">' + alertCount + '</span>';
      }
      html += '</div></div>';

      // クライアント
      if (p.client) {
        html += '<div class="dash-card-client">' + App.escH(p.client) + '</div>';
      }

      // 統計
      html += '<div class="project-card-stats">';
      html += '<span>\uD83D\uDCC1 ' + stats.kikakuCount + ' \u4F01\u753B</span>';
      html += '<span>\u5168 <b>' + stats.total + '</b> \u5DE5\u7A0B</span>';
      html += '<span style="color:var(--success)">\u5B8C\u4E86 ' + stats.completed + '</span>';
      if (stats.delayed > 0) {
        html += '<span style="color:var(--danger)">\u9045\u5EF6 ' + stats.delayed + '</span>';
      }
      if (stats.inProgress > 0) {
        html += '<span style="color:var(--accent-light)">\u9032\u884C\u4E2D ' + stats.inProgress + '</span>';
      }
      html += '</div>';

      // 進捗バー（色段階クラス: danger/warning/success）
      var barClass = stats.progress < 30 ? 'danger' : stats.progress < 70 ? 'warning' : 'success';
      html += '<div class="progress-bar ' + barClass + '"><div class="progress-bar-fill" style="width:' + stats.progress + '%"></div></div>';

      // フッター
      html += '<div class="project-card-footer">';
      html += '<span>\u9032\u6357 ' + stats.progress + '%</span>';
      html += '<span>' + stats.totalHours + 'h</span>';
      html += '</div>';

      // 次のアクション
      var nextAction = getNextAction(p);
      html += '<div class="dash-next-action">';
      if (nextAction) {
        html += '<span class="next-label">\u6B21: </span>' + App.escH(nextAction.name);
        if (nextAction.assignee) {
          html += '\uFF08' + App.escH(nextAction.assignee) + '\uFF09';
        }
      } else if (stats.total > 0 && stats.completed === stats.total) {
        html += '<span class="all-done">\u2705 \u5168\u5DE5\u7A0B\u5B8C\u4E86</span>';
      }
      html += '</div>';

      // 担当者アイコン
      if (stats.assignees.length) {
        html += '<div class="dash-card-assignees">';
        var shown = stats.assignees.slice(0, 5);
        shown.forEach(function(name) {
          html += '<span class="dash-assignee-chip">' + App.escH(name) + '</span>';
        });
        if (stats.assignees.length > 5) {
          html += '<span class="dash-assignee-chip">+' + (stats.assignees.length - 5) + '</span>';
        }
        html += '</div>';
      }

      html += '</div>'; // project-card
    });

    // 新規プロジェクト追加カード
    html += '<div class="project-card-add" onclick="App._showNewProjectModal()">\uFF0B \u65B0\u898F\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8</div>';
    html += '</div>'; // dashboard-grid
    return html;
  }

  // ===== メイン描画 =====

  function render(container) {
    injectCSS();
    var state = App.getState();
    if (!state) {
      container.innerHTML = '<div class="placeholder" style="padding:2rem;color:var(--text-muted)">データを読み込み中...</div>';
      return;
    }

    var html = '<div class="dash-container">';

    // 0. メンバー未登録時の案内カード
    var members = state.members || [];
    if (!members.length) {
      html += '<div class="welcome-card">';
      html += '<h3>\uD83D\uDC64 \u307E\u305A\u30C1\u30FC\u30E0\u30E1\u30F3\u30D0\u30FC\u3092\u767B\u9332\u3057\u307E\u3057\u3087\u3046</h3>';
      html += '<p>\u62C5\u5F53\u8005\u3092\u30A2\u30B5\u30A4\u30F3\u3059\u308B\u306B\u306F\u3001\u5148\u306B\u30C1\u30FC\u30E0\u30E1\u30F3\u30D0\u30FC\u306E\u767B\u9332\u304C\u5FC5\u8981\u3067\u3059\u3002</p>';
      html += '<button onclick="App.navigate(\'members\')">\u30E1\u30F3\u30D0\u30FC\u3092\u767B\u9332\u3059\u308B \u2192</button>';
      html += '</div>';
    }

    // 1. サマリーバー
    html += renderSummary(state);

    // 2. アラート（あれば）
    html += renderAlerts(state);

    // 3. 最近の更新
    html += renderRecentUpdates(state);

    // 4. 今週期限
    html += renderDeadlines(state);

    // 5. プロジェクトカード
    html += renderProjectCards(state);

    html += '</div>';
    container.innerHTML = html;
  }

  // ===== リマインドコピー =====

  function _copyReminder(taskId) {
    var state = App.getState();
    var ah = getAlertHelper();
    var alerts = ah ? ah.getAlerts(state) : [];
    var alert = alerts.find(function(a) { return a.taskId === taskId; });
    if (!alert) return;

    var text = ah ? ah.generateReminder(alert) : '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        App.showToast('リマインド文面をコピーしました', 'success');
      });
    } else {
      // フォールバック
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); App.showToast('リマインド文面をコピーしました', 'success'); }
      catch(e) { App.showToast('コピーに失敗しました', 'error'); }
      document.body.removeChild(ta);
    }
  }

  // ===== ビュー登録 =====

  App.registerView('dashboard', {
    init: function() {
      injectCSS();
    },
    render: render
  });

  // ===== 公開API =====

  window.DashboardView = {
    render: render,
    computeProjectStats: computeProjectStats,
    computeGlobalStats: computeGlobalStats,
    getThisWeekDeadlines: getThisWeekDeadlines,
    getKikakus: getKikakus,
    getAllTasks: getAllTasks,
    getAllTasksGlobal: getAllTasksGlobal,
    _copyReminder: _copyReminder
  };

  // window.AlertHelper はquality.jsがmaster版として定義済み。
  // dashboard.jsでは上書きしない。

})();
