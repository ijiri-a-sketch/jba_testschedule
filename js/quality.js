/**
 * quality.js — 品質関所（チェックゲート）ビュー + AlertHelper
 * cmd_023_s8r: bushi2実装の修復（bushi3 サルタヒコ）
 *
 * 機能:
 *   1. 品質関所ビュー（パイプライン表示、チェックリストモーダル、関所通過処理）
 *   2. AlertHelper（4種アラート検出、バッジ表示、リマインド文面生成）
 *   3. Project→Kikaku→Task 3階層対応
 *
 * API:
 *   App.registerView('quality', { init, render })
 *   window.AlertHelper = { getAlerts, renderBadge, generateReminder, ALERT_TYPES }
 *   window.QualityView = { openChecklist, toggleCheck, passGate, copyReminder }
 */
(function() {
  'use strict';

  // ===== CSS注入 =====
  function injectStyles() {
    if (document.getElementById('quality-styles')) return;
    var style = document.createElement('style');
    style.id = 'quality-styles';
    style.textContent =
      '.q-pipeline{display:flex;gap:.5rem;overflow-x:auto;padding:.75rem 0;align-items:flex-start}' +
      '.q-stage{min-width:120px;max-width:180px;flex:0 0 auto;border-radius:8px;padding:.6rem;' +
        'background:var(--surface,#1a1d27);border:1px solid var(--border,#2a2d3a);transition:border-color .2s}' +
      '.q-stage.is-gate{border-color:var(--warning,#f59e0b);border-width:2px}' +
      '.q-stage-name{font-size:.75rem;font-weight:600;color:var(--text,#e2e8f0);margin-bottom:.3rem;word-break:break-all}' +
      '.q-stage-status{font-size:.65rem;padding:.1rem .35rem;border-radius:4px;display:inline-block}' +
      '.q-status-completed{background:var(--success,#34d399);color:#000}' +
      '.q-status-in_progress{background:var(--accent,#6c7cff);color:#fff}' +
      '.q-status-not_started{background:var(--border,#2a2d3a);color:var(--text-muted,#64748b)}' +
      '.q-status-on_hold{background:var(--warning,#f59e0b);color:#000}' +
      '.q-gate-btn{margin-top:.4rem;font-size:.65rem;padding:.2rem .5rem;border-radius:4px;cursor:pointer;' +
        'background:var(--warning,#f59e0b);color:#000;border:none;width:100%}' +
      '.q-gate-btn:hover{opacity:.85}' +
      '.q-arrow{display:flex;align-items:center;color:var(--text-muted,#64748b);font-size:1.2rem;flex:0 0 auto}' +
      '.q-section{margin-bottom:1.5rem}' +
      '.q-section-title{font-size:.9rem;font-weight:600;color:var(--text,#e2e8f0);margin-bottom:.75rem;' +
        'padding-bottom:.3rem;border-bottom:1px solid var(--border,#2a2d3a)}' +
      '.q-summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem}' +
      '.q-summary-card{background:var(--surface,#1a1d27);border:1px solid var(--border,#2a2d3a);' +
        'border-radius:8px;padding:.75rem;cursor:pointer;transition:border-color .2s}' +
      '.q-summary-card:hover{border-color:var(--accent,#6c7cff)}' +
      '.q-summary-name{font-size:.8rem;font-weight:600;color:var(--text,#e2e8f0);margin-bottom:.4rem}' +
      '.q-summary-stats{font-size:.7rem;color:var(--text-muted,#64748b)}' +
      '.q-progress{height:4px;background:var(--border,#2a2d3a);border-radius:2px;margin-top:.4rem;overflow:hidden}' +
      '.q-progress-fill{height:100%;background:var(--success,#34d399);border-radius:2px;transition:width .3s}' +
      '.q-history{width:100%;border-collapse:collapse;font-size:.7rem}' +
      '.q-history th{text-align:left;padding:.4rem .5rem;border-bottom:1px solid var(--border,#2a2d3a);' +
        'color:var(--text-muted,#64748b);font-weight:500}' +
      '.q-history td{padding:.4rem .5rem;border-bottom:1px solid var(--border,#2a2d3a);color:var(--text,#e2e8f0)}' +
      '.q-checklist-item{display:flex;align-items:center;gap:.5rem;padding:.4rem 0;' +
        'border-bottom:1px solid var(--border,#2a2d3a);font-size:.8rem;color:var(--text,#e2e8f0)}' +
      '.q-checklist-item input[type=checkbox]{accent-color:var(--accent,#6c7cff)}' +
      '.q-checklist-item.checked{color:var(--text-muted,#64748b);text-decoration:line-through}' +
      '.q-pass-btn{margin-top:.75rem;padding:.5rem 1rem;border-radius:6px;border:none;cursor:pointer;' +
        'font-size:.8rem;font-weight:600;background:var(--success,#34d399);color:#000;width:100%}' +
      '.q-pass-btn:disabled{opacity:.4;cursor:not-allowed}' +
      '.q-alert-panel{margin-top:1rem}' +
      '.q-alert-item{display:flex;align-items:center;gap:.5rem;padding:.5rem .6rem;margin-bottom:.4rem;' +
        'border-radius:6px;font-size:.75rem;background:var(--surface,#1a1d27);border:1px solid var(--border,#2a2d3a)}' +
      '.q-alert-icon{font-size:1rem;flex:0 0 auto}' +
      '.q-alert-body{flex:1;min-width:0}' +
      '.q-alert-title{font-weight:600;color:var(--text,#e2e8f0)}' +
      '.q-alert-detail{font-size:.65rem;color:var(--text-muted,#64748b);margin-top:.1rem}' +
      '.q-alert-copy{font-size:.6rem;padding:.15rem .4rem;border-radius:3px;cursor:pointer;' +
        'background:var(--accent-dim,#2a2d5a);color:var(--accent-light,#8b9bff);border:none}' +
      '.q-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;' +
        'border-radius:9px;font-size:.6rem;font-weight:700;padding:0 4px}' +
      '.q-badge-red{background:var(--danger,#ef4444);color:#fff}' +
      '.q-badge-yellow{background:var(--warning,#f59e0b);color:#000}' +
      '.q-empty{padding:2rem;text-align:center;color:var(--text-muted,#64748b);font-size:.8rem}';
    document.head.appendChild(style);
  }

  // ===== 定数 =====
  var ALERT_TYPES = {
    overdue: { icon: '\uD83D\uDD34', label: '遅延', color: 'red' },
    onHoldLong: { icon: '\uD83D\uDFE1', label: '長期保留', color: 'yellow' },
    overload: { icon: '\uD83D\uDFE0', label: '過負荷', color: 'yellow' },
    dueThisWeek: { icon: '\uD83D\uDD35', label: '今週期限', color: 'blue' }
  };

  var STATUS_LABELS = {
    not_started: '未着手',
    in_progress: '進行中',
    completed: '完了',
    on_hold: '保留'
  };

  // ===== 3階層走査ユーティリティ =====

  /** 全Project→全Kikaku→全Taskを走査し、callbackに(task, kikaku, project)を渡す */
  function forEachTask(state, callback) {
    if (!state || !state.projects) return;
    state.projects.forEach(function(proj) {
      (proj.kikakus || []).forEach(function(kk) {
        (kk.tasks || []).forEach(function(task) {
          callback(task, kk, proj);
        });
      });
    });
  }

  /** Project→Kikaku→Taskのimmutable更新（stateを直接変更） */
  function updateTaskInState(state, projectId, kikakuId, taskId, updates) {
    var proj = state.projects.find(function(p) { return p.id === projectId; });
    if (!proj) return false;
    var kk = (proj.kikakus || []).find(function(k) { return k.id === kikakuId; });
    if (!kk) return false;
    var task = (kk.tasks || []).find(function(t) { return t.id === taskId; });
    if (!task) return false;
    Object.keys(updates).forEach(function(key) {
      task[key] = updates[key];
    });
    return true;
  }

  /** App.getActiveKikaku()からタスクを検索 */
  function findTaskInActiveKikaku(taskId) {
    var kk = App.getActiveKikaku();
    if (!kk || !kk.tasks) return null;
    return kk.tasks.find(function(t) { return t.id === taskId; }) || null;
  }

  // ===== 日付ヘルパー =====
  function todayDate() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseDate(s) {
    if (!s) return null;
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function diffDays(a, b) {
    return Math.round((b - a) / 864e5);
  }

  function getWeekRange() {
    var today = todayDate();
    var dow = today.getDay();
    var mon = new Date(today);
    mon.setDate(mon.getDate() - (dow === 0 ? 6 : dow - 1));
    var sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    return { start: mon, end: sun };
  }

  function fmtDate(d) {
    if (!d) return '';
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return (m < 10 ? '0' + m : m) + '/' + (day < 10 ? '0' + day : day);
  }

  // ===== AlertHelper =====

  /**
   * 全Project→Kikaku→Taskから4種アラートを検出
   * @param {Object} state - App.getState()
   * @returns {Array} alerts
   */
  function getAlerts(state) {
    if (!state || !state.projects) return [];
    var alerts = [];
    var today = todayDate();
    var week = getWeekRange();
    var workloadMap = {};

    forEachTask(state, function(task, kk, proj) {
      var displayLabel = App.escH(proj.name) + ' / ' + App.escH(kk.name);

      // 1. overdue: planEnd < today && status != completed
      if (task.planEnd && task.status !== 'completed') {
        var planEnd = parseDate(task.planEnd);
        if (planEnd && planEnd < today) {
          var overdueDays = diffDays(planEnd, today);
          alerts.push({
            type: 'overdue',
            taskId: task.id,
            kikakuId: kk.id,
            projectId: proj.id,
            taskName: task.name,
            kikakuName: kk.name,
            projectName: proj.name,
            displayLabel: displayLabel,
            days: overdueDays,
            detail: overdueDays + '日超過'
          });
        }
      }

      // 2. onHoldLong: status==on_hold && 7日超
      if (task.status === 'on_hold' && task.actualStart) {
        var holdStart = parseDate(task.actualStart);
        if (holdStart) {
          var holdDays = diffDays(holdStart, today);
          if (holdDays > 7) {
            alerts.push({
              type: 'onHoldLong',
              taskId: task.id,
              kikakuId: kk.id,
              projectId: proj.id,
              taskName: task.name,
              kikakuName: kk.name,
              projectName: proj.name,
              displayLabel: displayLabel,
              days: holdDays,
              detail: holdDays + '日間保留中'
            });
          }
        }
      }

      // 3. dueThisWeek: planEnd が今週内 && status != completed
      if (task.planEnd && task.status !== 'completed') {
        var pe = parseDate(task.planEnd);
        if (pe && pe >= week.start && pe <= week.end) {
          alerts.push({
            type: 'dueThisWeek',
            taskId: task.id,
            kikakuId: kk.id,
            projectId: proj.id,
            taskName: task.name,
            kikakuName: kk.name,
            projectName: proj.name,
            displayLabel: displayLabel,
            days: diffDays(today, pe),
            detail: fmtDate(pe) + ' 期限'
          });
        }
      }

      // 4. overload: 担当者ごとの日別稼働集計
      if (task.assignee && task.status === 'in_progress' && task.estimatedHours) {
        var key = task.assignee;
        if (!workloadMap[key]) workloadMap[key] = 0;
        workloadMap[key] += task.estimatedHours;
      }
    });

    // overload判定: 担当者の総稼働 > 8h * 5（週40h超を過負荷とみなす簡易版）
    // ※ 日別厳密計算はガントチャートの管轄。ここでは同時進行タスクの合計工数で簡易判定
    Object.keys(workloadMap).forEach(function(assignee) {
      if (workloadMap[assignee] > 40) {
        alerts.push({
          type: 'overload',
          taskId: null,
          kikakuId: null,
          projectId: null,
          taskName: null,
          kikakuName: null,
          projectName: null,
          displayLabel: assignee,
          days: null,
          assignee: assignee,
          totalHours: workloadMap[assignee],
          detail: workloadMap[assignee] + 'h（週上限40h超過）'
        });
      }
    });

    // 優先度順ソート: overdue > onHoldLong > overload > dueThisWeek
    var priority = { overdue: 0, onHoldLong: 1, overload: 2, dueThisWeek: 3 };
    alerts.sort(function(a, b) {
      return (priority[a.type] || 9) - (priority[b.type] || 9);
    });

    return alerts;
  }

  /** アラート数バッジHTML（赤/黄） */
  function renderBadge() {
    var state = App.getState();
    var alerts = getAlerts(state);
    if (!alerts.length) return '';
    var urgent = alerts.filter(function(a) { return a.type === 'overdue'; }).length;
    var cls = urgent > 0 ? 'q-badge q-badge-red' : 'q-badge q-badge-yellow';
    return '<span class="' + cls + '">' + alerts.length + '</span>';
  }

  /** リマインド文面テンプレート生成（コピペ用） */
  function generateReminder(alert) {
    if (!alert) return '';
    var label = alert.displayLabel || '';
    var taskName = alert.taskName || '';

    switch (alert.type) {
      case 'overdue':
        return '\u3010\u30EA\u30DE\u30A4\u30F3\u30C9\u3011' + taskName +
          '\u306E\u671F\u9650\u304C' + alert.days +
          '\u65E5\u8D85\u904E\u3057\u3066\u3044\u307E\u3059\u3002\n' +
          '\u5BFE\u8C61: ' + label + '\n' +
          '\u81F3\u6025\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002';
      case 'onHoldLong':
        return '\u3010\u78BA\u8A8D\u4F9D\u983C\u3011' + taskName +
          '\u304C' + alert.days +
          '\u65E5\u9593\u4FDD\u7559\u4E2D\u3067\u3059\u3002\n' +
          '\u5BFE\u8C61: ' + label + '\n' +
          '\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002';
      case 'dueThisWeek':
        return '\u3010\u671F\u9650\u9593\u8FD1\u3011' + taskName +
          '\u306E\u671F\u9650\u304C\u4ECA\u9031\u3067\u3059\u3002\n' +
          '\u5BFE\u8C61: ' + label + '\n' +
          '\u9032\u6357\u3092\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002';
      case 'overload':
        return '\u3010\u7A3C\u50CD\u6CE8\u610F\u3011' + (alert.assignee || '') +
          '\u3055\u3093\u306E\u7A3C\u50CD\u304C\u4E0A\u9650\u8D85\u904E\u3057\u3066\u3044\u307E\u3059\u3002\n' +
          '\u73FE\u5728\u306E\u9031\u5408\u8A08: ' + (alert.totalHours || 0) + 'h\n' +
          '\u30BF\u30B9\u30AF\u306E\u518D\u914D\u5206\u3092\u3054\u691C\u8A0E\u304F\u3060\u3055\u3044\u3002';
      default:
        return '';
    }
  }

  // ===== 品質関所ビュー =====

  /** パイプライン表示用: 企画内タスクを工程フローで描画 */
  function renderPipeline(kikaku, proj) {
    if (!kikaku || !kikaku.tasks || !kikaku.tasks.length) {
      return '<div class="q-empty">この企画にはまだ工程がありません</div>';
    }

    var html = '<div class="q-pipeline">';
    kikaku.tasks.forEach(function(task, i) {
      if (i > 0) html += '<div class="q-arrow">\u2192</div>';

      var cls = 'q-stage' + (task.isGate ? ' is-gate' : '');
      html += '<div class="' + cls + '">';
      html += '<div class="q-stage-name">' + App.escH(task.name) + '</div>';

      var statusCls = 'q-stage-status q-status-' + (task.status || 'not_started');
      html += '<div class="' + statusCls + '">' +
        (STATUS_LABELS[task.status] || '未着手') + '</div>';

      if (task.assignee) {
        html += '<div style="font-size:.6rem;color:var(--text-muted);margin-top:.2rem">' +
          App.escH(task.assignee) + '</div>';
      }

      if (task.isGate) {
        var checkedCount = 0;
        var totalItems = (task.checklistItems || []).length;
        (task.checklistItems || []).forEach(function(ci) {
          if (ci.checked) checkedCount++;
        });

        if (task.status === 'completed') {
          html += '<div style="font-size:.6rem;color:var(--success);margin-top:.3rem">' +
            '\u2705 通過済み</div>';
        } else {
          html += '<button class="q-gate-btn" onclick="QualityView.openChecklist(\'' +
            proj.id + '\',\'' + kikaku.id + '\',\'' + task.id + '\')">' +
            '\uD83D\uDCCB チェック (' + checkedCount + '/' + totalItems + ')</button>';
        }
      }

      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  /** 関所通過履歴テーブル */
  function renderHistory(kikaku) {
    if (!kikaku || !kikaku.tasks) return '';

    var gateTasks = kikaku.tasks.filter(function(t) {
      return t.isGate && t.status === 'completed' && t.checklistItems && t.checklistItems.length;
    });
    if (!gateTasks.length) return '';

    var html = '<div class="q-section"><div class="q-section-title">関所通過履歴</div>';
    html += '<table class="q-history"><thead><tr>' +
      '<th>工程</th><th>承認者</th><th>通過日時</th><th>項目数</th>' +
      '</tr></thead><tbody>';

    gateTasks.forEach(function(t) {
      var checkedBy = '';
      var checkedAt = '';
      (t.checklistItems || []).forEach(function(ci) {
        if (ci.checkedBy && !checkedBy) checkedBy = ci.checkedBy;
        if (ci.checkedAt && !checkedAt) checkedAt = ci.checkedAt;
      });

      html += '<tr><td>' + App.escH(t.name) + '</td>' +
        '<td>' + App.escH(checkedBy) + '</td>' +
        '<td>' + App.escH(checkedAt ? checkedAt.replace('T', ' ').slice(0, 16) : '') + '</td>' +
        '<td>' + (t.checklistItems || []).length + '</td></tr>';
    });

    html += '</tbody></table></div>';
    return html;
  }

  /** 企画未選択時: 全企画サマリー表示 */
  function renderAllKikakuSummary(proj) {
    if (!proj || !proj.kikakus || !proj.kikakus.length) {
      return '<div class="q-empty">プロジェクトに企画がありません</div>';
    }

    var html = '<div class="q-section"><div class="q-section-title">' +
      App.escH(proj.name) + ' — 全企画の品質状況</div>';
    html += '<div class="q-summary-grid">';

    proj.kikakus.forEach(function(kk) {
      var total = (kk.tasks || []).length;
      var done = 0;
      var gates = 0;
      var gatesPassed = 0;

      (kk.tasks || []).forEach(function(t) {
        if (t.status === 'completed') done++;
        if (t.isGate) {
          gates++;
          if (t.status === 'completed') gatesPassed++;
        }
      });

      var prog = total ? Math.round(done / total * 100) : 0;

      html += '<div class="q-summary-card" onclick="App.navigate(\'kikaku\',{' +
        'projectId:\'' + proj.id + '\',kikakuId:\'' + kk.id + '\'})">';
      html += '<div class="q-summary-name">' + App.escH(kk.name) + '</div>';
      html += '<div class="q-summary-stats">';
      html += '工程: ' + done + '/' + total + ' 完了';
      if (gates > 0) {
        html += ' | 関所: ' + gatesPassed + '/' + gates + ' 通過';
      }
      html += '</div>';
      html += '<div class="q-progress"><div class="q-progress-fill" style="width:' + prog + '%"></div></div>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  /** アラートパネル描画 */
  function renderAlertPanel(state) {
    var alerts = getAlerts(state);
    if (!alerts.length) return '';

    var html = '<div class="q-section"><div class="q-section-title">' +
      '\u26A0 アラート (' + alerts.length + '件)</div>';
    html += '<div class="q-alert-panel">';

    alerts.forEach(function(alert, idx) {
      var typeInfo = ALERT_TYPES[alert.type] || { icon: '\u2753', label: '不明' };
      html += '<div class="q-alert-item">';
      html += '<div class="q-alert-icon">' + typeInfo.icon + '</div>';
      html += '<div class="q-alert-body">';
      html += '<div class="q-alert-title">';
      if (alert.taskName) {
        html += App.escH(alert.taskName);
      } else if (alert.assignee) {
        html += App.escH(alert.assignee);
      }
      html += ' <span style="font-size:.6rem;color:var(--text-muted)">(' + typeInfo.label + ')</span>';
      html += '</div>';
      html += '<div class="q-alert-detail">' + App.escH(alert.displayLabel) +
        ' \u2014 ' + App.escH(alert.detail) + '</div>';
      html += '</div>';
      html += '<button class="q-alert-copy" onclick="QualityView.copyReminder(' + idx + ')" ' +
        'title="リマインド文をコピー">\uD83D\uDCCB コピー</button>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  // ===== チェックリストモーダル =====
  var _currentGate = null;

  function openChecklist(projectId, kikakuId, taskId) {
    var state = App.getState();
    var proj = state.projects.find(function(p) { return p.id === projectId; });
    if (!proj) return;
    var kk = (proj.kikakus || []).find(function(k) { return k.id === kikakuId; });
    if (!kk) return;
    var task = (kk.tasks || []).find(function(t) { return t.id === taskId; });
    if (!task) return;

    _currentGate = { projectId: projectId, kikakuId: kikakuId, taskId: taskId };

    var items = task.checklistItems || [];
    var checkedCount = items.filter(function(ci) { return ci.checked; }).length;
    var allChecked = items.length > 0 && checkedCount === items.length;

    var html = '<div class="modal-header"><h2>\uD83D\uDCCB ' + App.escH(task.name) +
      ' \u2014 \u54C1\u8CEA\u30C1\u30A7\u30C3\u30AF</h2>' +
      '<button onclick="App.closeModal()">\u2715</button></div>';
    html += '<div class="modal-body">';

    if (!items.length) {
      html += '<div class="q-empty">チェック項目が設定されていません</div>';
    } else {
      items.forEach(function(ci, idx) {
        var cls = 'q-checklist-item' + (ci.checked ? ' checked' : '');
        html += '<div class="' + cls + '">';
        html += '<input type="checkbox" ' + (ci.checked ? 'checked' : '') +
          ' onchange="QualityView.toggleCheck(' + idx + ')">';
        html += '<span>' + App.escH(ci.text || ci) + '</span>';
        if (ci.checked && ci.checkedBy) {
          html += '<span style="font-size:.6rem;color:var(--text-muted);margin-left:auto">' +
            App.escH(ci.checkedBy) + '</span>';
        }
        html += '</div>';
      });
    }

    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<span style="font-size:.75rem;color:var(--text-muted)">' +
      checkedCount + ' / ' + items.length + ' \u5B8C\u4E86</span>';
    html += '<button class="btn-secondary" onclick="App.closeModal()">\u9589\u3058\u308B</button>';
    html += '<button class="q-pass-btn" style="width:auto" ' +
      (allChecked ? '' : 'disabled') +
      ' onclick="QualityView.passGate()">' +
      '\u2705 \u95A2\u6240\u901A\u904E</button>';
    html += '</div>';

    App.showModal(html);
  }

  function toggleCheck(idx) {
    if (!_currentGate) return;
    var state = App.getState();
    var proj = state.projects.find(function(p) { return p.id === _currentGate.projectId; });
    if (!proj) return;
    var kk = (proj.kikakus || []).find(function(k) { return k.id === _currentGate.kikakuId; });
    if (!kk) return;
    var task = (kk.tasks || []).find(function(t) { return t.id === _currentGate.taskId; });
    if (!task || !task.checklistItems) return;

    var ci = task.checklistItems[idx];
    if (!ci) return;

    // checklistItemsが文字列配列の場合、オブジェクトに変換
    if (typeof ci === 'string') {
      task.checklistItems[idx] = {
        text: ci,
        checked: true,
        checkedBy: '',
        checkedAt: new Date().toISOString()
      };
    } else {
      ci.checked = !ci.checked;
      if (ci.checked) {
        ci.checkedAt = new Date().toISOString();
        ci.checkedBy = ci.checkedBy || '';
      } else {
        ci.checkedAt = null;
        ci.checkedBy = '';
      }
    }

    Data.save(state);
    // モーダルを再描画
    openChecklist(_currentGate.projectId, _currentGate.kikakuId, _currentGate.taskId);
  }

  function passGate() {
    if (!_currentGate) return;
    var state = App.getState();

    var updated = updateTaskInState(state,
      _currentGate.projectId,
      _currentGate.kikakuId,
      _currentGate.taskId,
      { status: 'completed' }
    );

    if (updated) {
      Data.save(state);
      App.closeModal();
      App.showToast('\u95A2\u6240\u3092\u901A\u904E\u3057\u307E\u3057\u305F', 'success');
      App.renderActiveView();
    }
  }

  /** リマインド文をクリップボードにコピー */
  var _cachedAlerts = null;

  function copyReminder(idx) {
    if (!_cachedAlerts) {
      _cachedAlerts = getAlerts(App.getState());
    }
    var alert = _cachedAlerts[idx];
    if (!alert) return;

    var text = generateReminder(alert);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        App.showToast('\u30EA\u30DE\u30A4\u30F3\u30C9\u6587\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F', 'success');
      });
    } else {
      // fallback
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      App.showToast('\u30EA\u30DE\u30A4\u30F3\u30C9\u6587\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F', 'success');
    }
  }

  // ===== ビュー: render =====
  function render(container) {
    injectStyles();
    _cachedAlerts = null;

    var state = App.getState();
    if (!state) {
      container.innerHTML = '<div class="q-empty">データがありません</div>';
      return;
    }

    var proj = App.getActiveProject();
    var kk = App.getActiveKikaku();

    var html = '<div style="padding:1rem">';

    // タイトル
    html += '<div style="font-size:1.1rem;font-weight:700;color:var(--text,#e2e8f0);margin-bottom:1rem">' +
      '\uD83D\uDEE1 \u54C1\u8CEA\u95A2\u6240</div>';

    if (proj && kk) {
      // 企画選択済み: パイプライン + 履歴
      html += '<div class="q-section"><div class="q-section-title">' +
        App.escH(kk.name) + ' \u2014 \u5DE5\u7A0B\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3</div>';
      html += renderPipeline(kk, proj);
      html += '</div>';
      html += renderHistory(kk);
    } else if (proj) {
      // プロジェクト選択済み、企画未選択: 全企画サマリー
      html += renderAllKikakuSummary(proj);
    } else {
      html += '<div class="q-empty">\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044</div>';
    }

    // アラートパネル（常に表示）
    html += renderAlertPanel(state);

    html += '</div>';
    container.innerHTML = html;
  }

  // ===== ビュー登録 =====
  App.registerView('quality', {
    init: function() {
      injectStyles();
    },
    render: render
  });

  // ===== グローバル公開 =====
  window.AlertHelper = {
    getAlerts: getAlerts,
    renderBadge: renderBadge,
    generateReminder: generateReminder,
    ALERT_TYPES: ALERT_TYPES
  };

  window.QualityView = {
    openChecklist: openChecklist,
    toggleCheck: toggleCheck,
    passGate: passGate,
    copyReminder: copyReminder
  };

})();
