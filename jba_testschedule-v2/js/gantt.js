/**
 * gantt.js — ガントチャートビュー（修復版: bushi4報告書に基づく再実装）
 * cmd_023_s6r: RACE-001事後修復
 *
 * 3階層対応: Project → Kikaku(企画/号) → Task
 *
 * 機能:
 *   - 予定バー（青）/実績バー（緑赤黄）の二段表示
 *   - 今日線（赤色縦線）
 *   - 月ヘッダー行
 *   - 土日ハイライト
 *   - 担当者ボール（ラベル表示、クリック変更、履歴記録）
 *   - 横スクロール対応（sticky列固定、動的セル幅）
 *   - 品質関所マーカー（◆表示）
 *   - 遅延/前倒し/予定通りバッジ
 *
 * API依存:
 *   window.App: getState, setState, getActiveProject, getActiveKikaku,
 *               showModal, closeModal, escH, showToast, registerView,
 *               renderActiveView, parseD, fmtD, fmtISO, addDays, diffDays
 *   window.Data: save(state)
 *   window.AlertHelper: (quality.js提供、存在チェックして使用)
 */
(function() {
  'use strict';

  // ===== CSS注入 =====
  function injectStyles() {
    if (document.getElementById('gantt-module-css')) return;
    var style = document.createElement('style');
    style.id = 'gantt-module-css';
    style.textContent = [
      '.gantt-container { padding: .5rem 0; }',
      '.gantt-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: .75rem; padding: 0 .5rem; }',
      '.gantt-header-title { font-size: 1rem; font-weight: 700; color: var(--text, #e0e0e0); }',
      '.gantt-header-scope { font-size: .75rem; color: var(--text-muted, #999); margin-left: .5rem; }',

      '.gantt-scroll-wrapper { overflow-x: auto; overflow-y: auto; max-height: 75vh; position: relative; }',
      '.gantt-table { border-collapse: collapse; min-width: 100%; }',
      '.gantt-table th, .gantt-table td { padding: 0; border: none; }',

      /* ラベル列（sticky） */
      '.gantt-label-col { position: sticky; left: 0; z-index: 2; background: var(--bg, #0f0f1a); min-width: 200px; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: .3rem .5rem !important; font-size: .75rem; color: var(--text, #e0e0e0); border-right: 1px solid var(--border, #333); }',
      '.gantt-label-col.header { z-index: 3; font-weight: 700; font-size: .7rem; color: var(--text-muted, #999); }',

      /* 担当者ラベル */
      '.gantt-assignee { display: inline-block; font-size: .65rem; padding: .1rem .35rem; border-radius: 4px; cursor: pointer; margin-left: .4rem; transition: background .15s; }',
      '.gantt-assignee.assigned { background: var(--accent-dim, rgba(99,102,241,.15)); color: var(--accent-light, #818cf8); }',
      '.gantt-assignee.unassigned { background: rgba(234,179,8,.15); color: var(--color-warning, #eab308); }',
      '.gantt-assignee:hover { opacity: .8; }',

      /* 品質関所マーカー */
      '.gantt-gate-marker { color: #f59e0b; font-size: .75rem; margin-right: .3rem; }',

      /* 日付セル */
      '.gantt-date-cell { position: relative; height: 52px; min-height: 52px; border-left: 1px solid var(--border, #222); }',
      '.gantt-date-cell.weekend { background: rgba(255,255,255,.02); }',
      '.gantt-date-cell.today-col { background: rgba(239,68,68,.05); }',

      /* 月ヘッダー */
      '.gantt-month-header { position: sticky; top: 0; z-index: 2; background: var(--bg, #0f0f1a); text-align: center; font-size: .65rem; color: var(--text-muted, #999); padding: .15rem 0; border-bottom: 1px solid var(--border, #333); }',

      /* 日付ヘッダー */
      '.gantt-date-header { position: sticky; top: 20px; z-index: 2; background: var(--bg, #0f0f1a); text-align: center; font-size: .6rem; color: var(--text-muted, #999); padding: .2rem 0; border-bottom: 1px solid var(--border, #333); }',
      '.gantt-date-header.weekend { color: var(--color-danger, #ef4444); opacity: .7; }',
      '.gantt-date-header.today { color: var(--primary, #6366f1); font-weight: 700; }',

      /* バー: 予定はアウトライン、実績は濃い塗りつぶし */
      '.gantt-bar { position: absolute; height: 10px; border-radius: 3px; z-index: 1; min-width: 3px; }',
      '.gantt-bar.plan { top: 10px; background: rgba(99,102,241,0.15); border: 1.5px solid var(--primary, #6366f1); opacity: 0.4; }',
      '.gantt-bar.actual-ok { top: 30px; background: var(--color-success, #22c55e); opacity: 1; }',
      '.gantt-bar.actual-late { top: 30px; background: var(--color-danger, #ef4444); opacity: 1; }',
      '.gantt-bar.actual-early { top: 30px; background: var(--color-warning, #eab308); opacity: 1; }',

      /* バー上の担当者名 */
      '.gantt-bar-assignee { position: absolute; top: 0px; left: 2px; font-size: .55rem; color: rgba(255,255,255,.8); white-space: nowrap; pointer-events: none; line-height: 10px; }',

      /* 品質関所マーカー（グリッド上） */
      '.gantt-gate-diamond { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: #f59e0b; font-size: .7rem; z-index: 1; }',

      /* 今日線 */
      '.gantt-today-line { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--color-danger, #ef4444); z-index: 2; pointer-events: none; }',

      /* ステータスバッジ */
      '.gantt-badge { font-size: .55rem; padding: .05rem .25rem; border-radius: 3px; margin-left: .3rem; font-weight: 600; }',
      '.gantt-badge.late { background: rgba(239,68,68,.15); color: var(--color-danger, #ef4444); }',
      '.gantt-badge.early { background: rgba(234,179,8,.15); color: var(--color-warning, #eab308); }',
      '.gantt-badge.ontime { background: rgba(34,197,94,.15); color: var(--color-success, #22c55e); }',

      /* モーダル */
      '.gantt-modal-section { margin-bottom: 1rem; }',
      '.gantt-modal-section h4 { font-size: .8rem; margin: 0 0 .5rem; color: var(--text, #e0e0e0); }',
      '.gantt-history-item { font-size: .75rem; padding: .4rem .6rem; background: var(--bg, #0f0f1a); border-radius: 4px; margin-bottom: .3rem; color: var(--text-muted, #999); }',
      '.gantt-history-item .arrow { color: var(--primary, #6366f1); margin: 0 .3rem; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ===== タスク取得（3階層対応） =====
  function getTasks() {
    var kikaku = App.getActiveKikaku();
    if (kikaku && kikaku.tasks) return kikaku.tasks;
    // フォールバック: プロジェクト直下のtasks（旧2階層データ）
    var proj = App.getActiveProject();
    if (proj && proj.tasks) return proj.tasks;
    return [];
  }

  // ===== ヘッダーラベル =====
  function getScopeLabel() {
    var proj = App.getActiveProject();
    var kikaku = App.getActiveKikaku();
    if (proj && kikaku) return App.escH(proj.name) + ' / ' + App.escH(kikaku.name);
    if (proj) return App.escH(proj.name);
    return '';
  }

  // ===== 日付範囲算出 =====
  function calcDateRange(tasks) {
    var allDates = [];
    tasks.forEach(function(t) {
      if (t.planStart) allDates.push(App.parseD(t.planStart));
      if (t.planEnd) allDates.push(App.parseD(t.planEnd));
      if (t.actualStart) allDates.push(App.parseD(t.actualStart));
      if (t.actualEnd) allDates.push(App.parseD(t.actualEnd));
    });
    if (!allDates.length) return null;

    var min = new Date(Math.min.apply(null, allDates));
    var max = new Date(Math.max.apply(null, allDates));
    // 前後に余白2日
    min = App.addDays(min, -2);
    max = App.addDays(max, 2);

    var range = [];
    var cur = new Date(min);
    while (cur <= max) {
      range.push(new Date(cur));
      cur = App.addDays(cur, 1);
    }
    return { dates: range, min: min, max: max };
  }

  // ===== 動的セル幅 =====
  function getCellWidth(totalDays) {
    if (totalDays > 60) return 18;
    if (totalDays > 30) return 24;
    return 32;
  }

  // ===== バー位置算出 =====
  function barPosition(startDate, endDate, rangeMin, cellWidth) {
    if (!startDate || !endDate) return null;
    var leftDays = App.diffDays(rangeMin, startDate);
    var widthDays = App.diffDays(startDate, endDate) + 1;
    if (widthDays < 1) widthDays = 1;
    return {
      left: leftDays * cellWidth,
      width: widthDays * cellWidth
    };
  }

  // ===== 遅延判定 =====
  function getDelayStatus(task) {
    if (!task.planEnd || !task.actualEnd) return null;
    var diff = App.diffDays(App.parseD(task.planEnd), App.parseD(task.actualEnd));
    if (diff > 0) return { type: 'late', days: diff, label: diff + '日遅延' };
    if (diff < 0) return { type: 'early', days: Math.abs(diff), label: Math.abs(diff) + '日前倒し' };
    return { type: 'ontime', days: 0, label: '予定通り' };
  }

  // ===== 担当者変更モーダル =====
  function showAssigneeModal(taskId) {
    var kikaku = App.getActiveKikaku();
    if (!kikaku) return;
    var task = kikaku.tasks.find(function(t) { return t.id === taskId; });
    if (!task) return;

    var state = App.getState();
    var members = state.members || [];
    var current = task.assignee || '';

    var html = '<div class="modal-header"><h2>担当者変更</h2>';
    html += '<button onclick="App.closeModal()">\u2715</button></div>';
    html += '<div class="modal-body">';

    // タスク情報
    html += '<div class="gantt-modal-section">';
    html += '<h4>タスク: ' + App.escH(task.name) + '</h4>';
    html += '<p style="font-size:.75rem;color:var(--text-muted)">現在の担当: <strong>' + (current ? App.escH(current) : '未割当') + '</strong></p>';
    html += '</div>';

    // 担当者選択
    html += '<div class="gantt-modal-section">';
    html += '<h4>新しい担当者</h4>';
    html += '<select id="ganttNewAssignee" style="width:100%;padding:.4rem;border-radius:6px;border:1px solid var(--border,#444);background:var(--surface,#1e1e2e);color:var(--text,#e0e0e0);font-size:.8rem">';
    html += '<option value="">未割当</option>';
    members.forEach(function(m) {
      var sel = m.name === current ? ' selected' : '';
      html += '<option value="' + App.escH(m.name) + '"' + sel + '>' + App.escH(m.name);
      if (m.role) html += ' (' + App.escH(m.role) + ')';
      html += '</option>';
    });
    html += '</select>';
    html += '<div style="margin-top:.5rem"><label style="font-size:.7rem;color:var(--text-muted)">変更メモ（任意）</label>';
    html += '<input type="text" id="ganttAssigneeNote" placeholder="例: レビュー完了のため次工程へ" style="width:100%;padding:.35rem;border-radius:6px;border:1px solid var(--border,#444);background:var(--surface,#1e1e2e);color:var(--text,#e0e0e0);font-size:.75rem;margin-top:.2rem"></div>';
    html += '</div>';

    // ボール受け渡し履歴
    var history = task.assigneeHistory || [];
    if (history.length) {
      html += '<div class="gantt-modal-section">';
      html += '<h4>受け渡し履歴</h4>';
      history.slice().reverse().forEach(function(h) {
        html += '<div class="gantt-history-item">';
        html += '<span>' + (h.from || '未割当') + '</span>';
        html += '<span class="arrow">\u2192</span>';
        html += '<span>' + (h.to || '未割当') + '</span>';
        if (h.timestamp) html += '<span style="margin-left:.5rem;font-size:.65rem;opacity:.6">' + h.timestamp.replace('T', ' ').slice(0, 16) + '</span>';
        if (h.note) html += '<div style="font-size:.65rem;margin-top:.2rem;opacity:.7">' + App.escH(h.note) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button class="btn-secondary" onclick="App.closeModal()">キャンセル</button>';
    html += '<button class="btn-primary" onclick="window._ganttChangeAssignee(\'' + taskId + '\')">変更</button>';
    html += '</div>';

    App.showModal(html);
  }

  // グローバル公開（モーダルのonclickから呼ぶため）
  window._ganttChangeAssignee = function(taskId) {
    var kikaku = App.getActiveKikaku();
    if (!kikaku) return;
    var task = kikaku.tasks.find(function(t) { return t.id === taskId; });
    if (!task) return;

    var selectEl = document.getElementById('ganttNewAssignee');
    var noteEl = document.getElementById('ganttAssigneeNote');
    var newAssignee = selectEl ? selectEl.value : '';
    var note = noteEl ? noteEl.value.trim() : '';
    var oldAssignee = task.assignee || '';

    if (newAssignee === oldAssignee) {
      App.closeModal();
      return;
    }

    // 履歴記録
    if (!task.assigneeHistory) task.assigneeHistory = [];
    task.assigneeHistory.push({
      from: oldAssignee,
      to: newAssignee,
      timestamp: new Date().toISOString(),
      note: note
    });

    task.assignee = newAssignee;
    var state = App.getState();
    Data.save(state);
    App.closeModal();
    App.showToast('担当者を「' + (newAssignee || '未割当') + '」に変更しました', 'success');
    App.renderActiveView();
  };

  // ===== モーダル公開（担当者ラベルクリック用） =====
  window._ganttShowAssigneeModal = function(taskId) {
    showAssigneeModal(taskId);
  };

  // ===== メインレンダリング =====
  function render(container) {
    injectStyles();

    var tasks = getTasks();
    var scopeLabel = getScopeLabel();

    // 空データ
    if (!tasks.length) {
      container.innerHTML = '<div class="gantt-container">' +
        '<div class="gantt-header"><span class="gantt-header-title">ガントチャート</span>' +
        '<span class="gantt-header-scope">' + scopeLabel + '</span></div>' +
        '<p style="color:var(--text-muted);font-size:.85rem;padding:1rem">タスクがありません。タスクを追加してください。</p></div>';
      return;
    }

    var rangeResult = calcDateRange(tasks);
    if (!rangeResult) {
      container.innerHTML = '<div class="gantt-container"><p style="color:var(--text-muted);font-size:.85rem;padding:1rem">日付データがありません。</p></div>';
      return;
    }

    var dates = rangeResult.dates;
    var rangeMin = rangeResult.min;
    var cellWidth = getCellWidth(dates.length);
    var todayISO = App.fmtISO(new Date());
    var dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    // --- HTML構築 ---
    var html = '<div class="gantt-container">';

    // ヘッダー
    html += '<div class="gantt-header">';
    html += '<span class="gantt-header-title">ガントチャート</span>';
    html += '<span class="gantt-header-scope">' + scopeLabel + '</span>';
    html += '</div>';

    // テーブルラッパー
    html += '<div class="gantt-scroll-wrapper">';
    html += '<table class="gantt-table">';

    // --- 月ヘッダー行 ---
    html += '<tr>';
    html += '<th class="gantt-label-col header" rowspan="2" style="vertical-align:bottom">タスク / 担当者</th>';

    var monthGroups = [];
    var currentMonth = null;
    var monthSpan = 0;

    dates.forEach(function(d, idx) {
      var monthKey = d.getFullYear() + '-' + (d.getMonth() + 1);
      if (monthKey !== currentMonth) {
        if (currentMonth !== null) {
          monthGroups.push({ label: currentMonth, span: monthSpan });
        }
        currentMonth = monthKey;
        monthSpan = 1;
      } else {
        monthSpan++;
      }
      if (idx === dates.length - 1) {
        monthGroups.push({ label: currentMonth, span: monthSpan });
      }
    });

    monthGroups.forEach(function(mg) {
      var parts = mg.label.split('-');
      var label = parts[0] + '年' + parts[1] + '月';
      html += '<th class="gantt-month-header" colspan="' + mg.span + '" style="min-width:' + (mg.span * cellWidth) + 'px">' + label + '</th>';
    });
    html += '</tr>';

    // --- 日付ヘッダー行 ---
    html += '<tr>';
    dates.forEach(function(d) {
      var iso = App.fmtISO(d);
      var dow = d.getDay();
      var isWeekend = dow === 0 || dow === 6;
      var isToday = iso === todayISO;
      var cls = 'gantt-date-header';
      if (isWeekend) cls += ' weekend';
      if (isToday) cls += ' today';
      html += '<th class="' + cls + '" style="min-width:' + cellWidth + 'px;width:' + cellWidth + 'px">';
      html += d.getDate() + '<br>' + dayNames[dow];
      html += '</th>';
    });
    html += '</tr>';

    // --- タスク行 ---
    tasks.forEach(function(task) {
      html += '<tr>';

      // ラベル列
      html += '<td class="gantt-label-col">';

      // 品質関所マーカー
      if (task.isGate) {
        html += '<span class="gantt-gate-marker">\u25C6</span>';
      }

      // タスク名
      html += '<span>' + App.escH(task.name) + '</span>';

      // 担当者ラベル
      var assignee = task.assignee || '';
      var assigneeCls = assignee ? 'gantt-assignee assigned' : 'gantt-assignee unassigned';
      var assigneeLabel = assignee ? App.escH(assignee) : '未割当';
      html += '<span class="' + assigneeCls + '" onclick="window._ganttShowAssigneeModal(\'' + task.id + '\')">' + assigneeLabel + '</span>';

      // 遅延バッジ
      var delay = getDelayStatus(task);
      if (delay) {
        html += '<span class="gantt-badge ' + delay.type + '">' + delay.label + '</span>';
      }

      html += '</td>';

      // 日付セル（相対配置ではなく、全日分のセルにバーをオーバーレイ）
      dates.forEach(function(d, colIdx) {
        var iso = App.fmtISO(d);
        var dow = d.getDay();
        var isWeekend = dow === 0 || dow === 6;
        var isToday = iso === todayISO;
        var cls = 'gantt-date-cell';
        if (isWeekend) cls += ' weekend';
        if (isToday) cls += ' today-col';

        html += '<td class="' + cls + '" style="min-width:' + cellWidth + 'px;width:' + cellWidth + 'px">';

        // 最初のセルにのみバーを配置（position:absolute）
        if (colIdx === 0) {
          // 予定バー
          if (task.planStart && task.planEnd) {
            var planPos = barPosition(App.parseD(task.planStart), App.parseD(task.planEnd), rangeMin, cellWidth);
            if (planPos) {
              html += '<div class="gantt-bar plan" style="left:' + planPos.left + 'px;width:' + planPos.width + 'px">';
              if (assignee) {
                html += '<span class="gantt-bar-assignee">' + App.escH(assignee) + '</span>';
              }
              html += '</div>';
            }
          }

          // 実績バー
          if (task.actualStart && task.actualEnd) {
            var actPos = barPosition(App.parseD(task.actualStart), App.parseD(task.actualEnd), rangeMin, cellWidth);
            if (actPos) {
              var actCls = 'gantt-bar ';
              if (delay && delay.type === 'late') actCls += 'actual-late';
              else if (delay && delay.type === 'early') actCls += 'actual-early';
              else actCls += 'actual-ok';
              html += '<div class="' + actCls + '" style="left:' + actPos.left + 'px;width:' + actPos.width + 'px"></div>';
            }
          }

          // 品質関所マーカー（グリッド上）
          if (task.isGate && task.planEnd) {
            var gateDate = App.parseD(task.planEnd);
            var gateDays = App.diffDays(rangeMin, gateDate);
            var gateLeft = gateDays * cellWidth + cellWidth / 2;
            html += '<span class="gantt-gate-diamond" style="left:' + gateLeft + 'px">\u25C6</span>';
          }
        }

        // 今日線（今日のセルに挿入）
        if (isToday && colIdx === 0) {
          var todayDays = App.diffDays(rangeMin, new Date());
          var todayLeft = todayDays * cellWidth + cellWidth / 2;
          html += '<div class="gantt-today-line" style="left:' + todayLeft + 'px"></div>';
        }

        html += '</td>';
      });

      html += '</tr>';
    });

    html += '</table>';
    html += '</div>'; // scroll-wrapper

    // 凡例
    html += '<div style="display:flex;gap:1rem;align-items:center;margin-top:.5rem;padding:0 .5rem;font-size:.65rem;color:var(--text-muted,#999);flex-wrap:wrap">';
    html += '<span>凡例:</span>';
    html += '<span><span style="display:inline-block;width:12px;height:6px;background:rgba(99,102,241,0.15);border:1.5px solid var(--primary,#6366f1);border-radius:2px;margin-right:.2rem;opacity:.6;box-sizing:border-box"></span>予定</span>';
    html += '<span><span style="display:inline-block;width:12px;height:6px;background:var(--color-success,#22c55e);border-radius:2px;margin-right:.2rem"></span>実績（予定通り）</span>';
    html += '<span><span style="display:inline-block;width:12px;height:6px;background:var(--color-danger,#ef4444);border-radius:2px;margin-right:.2rem"></span>実績（遅延）</span>';
    html += '<span><span style="display:inline-block;width:12px;height:6px;background:var(--color-warning,#eab308);border-radius:2px;margin-right:.2rem"></span>実績（前倒し）</span>';
    html += '<span><span style="color:#f59e0b;margin-right:.2rem">\u25C6</span>品質関所</span>';
    html += '<span><span style="display:inline-block;width:2px;height:12px;background:var(--color-danger,#ef4444);margin-right:.2rem"></span>今日</span>';
    html += '</div>';

    html += '</div>'; // container

    container.innerHTML = html;
  }

  // ===== ビュー登録 =====
  App.registerView('gantt', {
    init: function() {
      injectStyles();
    },
    render: function(container) {
      render(container);
    }
  });

})();
