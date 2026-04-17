/**
 * heatmap.js — 稼働ヒートマップビュー
 * cmd_023 Phase3b-s7 再実装（bushi12: ツクヨミ）
 *
 * データ階層: Project → Kikaku → Task
 * 3モード: 企画単位 / プロジェクト横断 / 全体横断
 *
 * 使用するApp API:
 *   App.getActiveKikaku()        — 現在の企画
 *   App.getActiveProject()       — 現在のプロジェクト
 *   App.getState()               — state全体
 *   App.showModal(html)          — モーダル表示
 *   App.closeModal()             — モーダル閉じ
 *   App.escH(str)                — HTMLエスケープ
 *   App.parseD(s), App.fmtD(d), App.addDays(d,n), App.diffDays(a,b)
 *   Data.getAllTasks(project)     — PJ横断タスク取得
 *   Data.STATUS_LABELS           — ステータス日本語ラベル
 *
 * ヒートマップ閾値:
 *   0-4h: 緑（余裕） / 4-7h: 黄（適正） / 7-8h: オレンジ（注意） / 8h+: 赤（パンク警告）
 */
(function() {
  'use strict';

  // ===== 定数 =====
  var MODES = [
    { key: 'kikaku',  label: '企画単位' },
    { key: 'project', label: 'プロジェクト横断' },
    { key: 'all',     label: '全体横断' }
  ];

  var THRESHOLDS = [
    { max: 4,  cls: 'hm-green',  label: '0-4h 余裕' },
    { max: 7,  cls: 'hm-yellow', label: '4-7h 適正' },
    { max: 8,  cls: 'hm-orange', label: '7-8h 注意' },
    { max: Infinity, cls: 'hm-red', label: '8h+ 超過' }
  ];

  var WEEKLY_LIMIT = 40;
  var MONTHLY_LIMIT = 160;

  var currentMode = 'kikaku';

  // ===== ユーティリティ =====
  function getColorClass(hours) {
    for (var i = 0; i < THRESHOLDS.length; i++) {
      if (hours <= THRESHOLDS[i].max) return THRESHOLDS[i].cls;
    }
    return 'hm-red';
  }

  function isWeekend(d) {
    var day = d.getDay();
    return day === 0 || day === 6;
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  function getWeekKey(d) {
    var tmp = new Date(d);
    tmp.setDate(tmp.getDate() - tmp.getDay());
    return App.fmtISO(tmp);
  }

  function getMonthKey(d) {
    return d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);
  }

  // ===== タスク収集 =====
  function collectTasks() {
    var state = App.getState();
    var tasks = [];

    if (currentMode === 'kikaku') {
      var kikaku = App.getActiveKikaku();
      var proj = App.getActiveProject();
      if (kikaku && kikaku.tasks) {
        kikaku.tasks.forEach(function(t) {
          tasks.push({ task: t, projectName: proj ? proj.name : '', kikakuName: kikaku.name });
        });
      }
    } else if (currentMode === 'project') {
      var proj2 = App.getActiveProject();
      if (proj2) {
        var all = Data.getAllTasks(proj2);
        all.forEach(function(item) {
          tasks.push({ task: item.task, projectName: proj2.name, kikakuName: item.kikaku.name });
        });
      }
    } else {
      // 全体横断
      (state.projects || []).forEach(function(p) {
        var all = Data.getAllTasks(p);
        all.forEach(function(item) {
          tasks.push({ task: item.task, projectName: p.name, kikakuName: item.kikaku.name });
        });
      });
    }

    return tasks;
  }

  // ===== マトリクス構築 =====
  function buildMatrix(taskItems) {
    // 担当者一覧と日付範囲を算出
    var assignees = {};
    var minDate = null;
    var maxDate = null;

    taskItems.forEach(function(item) {
      var t = item.task;
      var name = t.assignee || '（未割当）';
      if (!assignees[name]) assignees[name] = [];

      var start = App.parseD(t.planStart);
      var end = App.parseD(t.planEnd);
      if (!start || !end) return;

      assignees[name].push(item);

      if (!minDate || start < minDate) minDate = start;
      if (!maxDate || end > maxDate) maxDate = end;
    });

    if (!minDate || !maxDate) return null;

    // 前後に余白を追加
    minDate = App.addDays(minDate, -2);
    maxDate = App.addDays(maxDate, 2);

    // 日付配列の生成
    var dates = [];
    var cur = new Date(minDate);
    while (cur <= maxDate) {
      dates.push(new Date(cur));
      cur = App.addDays(cur, 1);
    }

    // 担当者名のソート（未割当は末尾）
    var names = Object.keys(assignees).sort(function(a, b) {
      if (a === '（未割当）') return 1;
      if (b === '（未割当）') return -1;
      return a.localeCompare(b, 'ja');
    });

    // 稼働時間マトリクス構築: matrix[name][dateISO] = { hours, tasks[] }
    var matrix = {};
    names.forEach(function(name) {
      matrix[name] = {};
      dates.forEach(function(d) {
        matrix[name][App.fmtISO(d)] = { hours: 0, tasks: [] };
      });
    });

    taskItems.forEach(function(item) {
      var t = item.task;
      var name = t.assignee || '（未割当）';
      var start = App.parseD(t.planStart);
      var end = App.parseD(t.planEnd);
      if (!start || !end || !matrix[name]) return;

      var days = App.diffDays(start, end) + 1;
      if (days < 1) days = 1;
      var hoursPerDay = (t.estimatedHours || 0) / days;

      var d = new Date(start);
      while (d <= end) {
        var key = App.fmtISO(d);
        if (matrix[name][key]) {
          matrix[name][key].hours += hoursPerDay;
          matrix[name][key].tasks.push(item);
        }
        d = App.addDays(d, 1);
      }
    });

    return { names: names, dates: dates, matrix: matrix };
  }

  // ===== 週/月合計の算出 =====
  function calcWeeklyTotals(name, dates, matrix) {
    var weeks = {};
    dates.forEach(function(d) {
      var wk = getWeekKey(d);
      if (!weeks[wk]) weeks[wk] = 0;
      var key = App.fmtISO(d);
      if (matrix[name] && matrix[name][key]) {
        weeks[wk] += matrix[name][key].hours;
      }
    });
    return weeks;
  }

  function calcMonthlyTotals(name, dates, matrix) {
    var months = {};
    dates.forEach(function(d) {
      var mk = getMonthKey(d);
      if (!months[mk]) months[mk] = 0;
      var key = App.fmtISO(d);
      if (matrix[name] && matrix[name][key]) {
        months[mk] += matrix[name][key].hours;
      }
    });
    return months;
  }

  // ===== 超過日数バッジ =====
  function countOverDays(name, dates, matrix) {
    var count = 0;
    dates.forEach(function(d) {
      var key = App.fmtISO(d);
      if (matrix[name] && matrix[name][key] && matrix[name][key].hours > 8) {
        count++;
      }
    });
    return count;
  }

  // ===== サマリーチップ =====
  function buildSummaryChips(data) {
    var totalHours = 0;
    var overCount = 0;
    data.names.forEach(function(name) {
      data.dates.forEach(function(d) {
        var key = App.fmtISO(d);
        var cell = data.matrix[name][key];
        if (cell) {
          totalHours += cell.hours;
          if (cell.hours > 8) overCount++;
        }
      });
    });

    var html = '<div class="hm-summary">';
    html += '<div class="stat-chip">担当者 <span class="val blue">' + data.names.length + '名</span></div>';
    html += '<div class="stat-chip">期間 <span class="val blue">' + data.dates.length + '日</span></div>';
    html += '<div class="stat-chip">総工数 <span class="val blue">' + Math.round(totalHours) + 'h</span></div>';
    html += '<div class="stat-chip">超過セル <span class="val ' + (overCount > 0 ? 'red' : 'green') + '">' + overCount + '件</span></div>';
    html += '</div>';
    return html;
  }

  // ===== 凡例 =====
  function buildLegend() {
    var html = '<div class="hm-legend">';
    html += '<span class="hm-legend-label">凡例:</span>';
    THRESHOLDS.forEach(function(th) {
      html += '<span class="hm-legend-item"><span class="hm-legend-swatch ' + th.cls + '"></span>' + th.label + '</span>';
    });
    html += '</div>';
    return html;
  }

  // ===== モーダル =====
  function showCellModal(name, dateISO, cell) {
    var d = App.parseD(dateISO);
    var dateStr = d ? (d.getMonth() + 1) + '/' + d.getDate() : dateISO;
    var html = '<div class="modal-header"><h2>' + App.escH(name) + ' — ' + dateStr + '</h2>';
    html += '<button onclick="App.closeModal()">\u2715</button></div>';
    html += '<div class="modal-body">';
    html += '<div style="margin-bottom:.75rem;font-size:.85rem;color:var(--text-muted)">合計: <b>' + cell.hours.toFixed(1) + 'h</b></div>';

    if (cell.hours > 8) {
      html += '<div style="padding:.5rem .75rem;margin-bottom:.75rem;border-radius:6px;background:var(--danger-dim);color:var(--danger);font-size:.8rem">';
      html += '\u26A0 8h超過 — タスク再配分を検討してください</div>';
    }

    if (cell.tasks.length === 0) {
      html += '<p style="color:var(--text-dim);font-size:.85rem">タスクなし</p>';
    } else {
      html += '<table style="width:100%;font-size:.8rem;border-collapse:collapse">';
      html += '<tr style="border-bottom:1px solid var(--border)"><th style="text-align:left;padding:.3rem .5rem">タスク名</th>';
      html += '<th style="text-align:left;padding:.3rem .5rem">PJ / 企画</th>';
      html += '<th style="text-align:right;padding:.3rem .5rem">工数</th>';
      html += '<th style="text-align:center;padding:.3rem .5rem">状態</th></tr>';
      cell.tasks.forEach(function(item) {
        var t = item.task;
        var statusLabel = Data.STATUS_LABELS[t.status] || t.status;
        html += '<tr style="border-bottom:1px solid var(--border)">';
        html += '<td style="padding:.3rem .5rem">' + App.escH(t.name) + '</td>';
        html += '<td style="padding:.3rem .5rem;color:var(--text-muted)">' + App.escH(item.projectName) + ' / ' + App.escH(item.kikakuName) + '</td>';
        html += '<td style="padding:.3rem .5rem;text-align:right">' + (t.estimatedHours || 0) + 'h</td>';
        html += '<td style="padding:.3rem .5rem;text-align:center"><span class="status-badge ' + t.status + '">' + statusLabel + '</span></td>';
        html += '</tr>';
      });
      html += '</table>';
    }
    html += '</div>';

    if (typeof App.showModal === 'function') {
      App.showModal(html);
    }
  }

  // ===== メイン描画 =====
  function render(container) {
    var taskItems = collectTasks();

    if (!taskItems.length) {
      container.innerHTML = '<div class="placeholder" style="padding:2rem;color:var(--text-muted)">' +
        '稼働ヒートマップ — 表示するタスクがありません。タスクに担当者と工数を設定してください。</div>';
      return;
    }

    var data = buildMatrix(taskItems);
    if (!data) {
      container.innerHTML = '<div class="placeholder" style="padding:2rem;color:var(--text-muted)">' +
        '稼働ヒートマップ — 日付データのあるタスクがありません。</div>';
      return;
    }

    var today = new Date();
    var todayISO = App.fmtISO(today);

    // --- モード切替ボタン ---
    var html = '<div class="hm-container">';
    html += '<div class="hm-toolbar">';
    html += '<div class="hm-mode-btns">';
    MODES.forEach(function(m) {
      var active = m.key === currentMode ? ' active' : '';
      html += '<button class="tab-btn' + active + '" data-hm-mode="' + m.key + '">' + m.label + '</button>';
    });
    html += '</div>';
    html += buildLegend();
    html += '</div>';

    // --- サマリーチップ ---
    html += buildSummaryChips(data);

    // --- グリッドテーブル ---
    var colCount = data.dates.length + 3; // name + dates + 週合計 + 月合計
    html += '<div class="hm-scroll">';
    html += '<table class="hm-table">';

    // ヘッダ行: 日付
    html += '<thead><tr><th class="hm-sticky-col hm-header-name">担当者</th>';
    data.dates.forEach(function(d) {
      var iso = App.fmtISO(d);
      var wkend = isWeekend(d) ? ' hm-weekend' : '';
      var todayCls = iso === todayISO ? ' hm-today-col' : '';
      html += '<th class="hm-date-header' + wkend + todayCls + '">' + App.fmtD(d) + '</th>';
    });
    html += '<th class="hm-total-header">週計</th>';
    html += '<th class="hm-total-header">月計</th>';
    html += '</tr></thead>';

    // データ行
    html += '<tbody>';
    data.names.forEach(function(name) {
      var overDays = countOverDays(name, data.dates, data.matrix);
      var weeklyTotals = calcWeeklyTotals(name, data.dates, data.matrix);
      var monthlyTotals = calcMonthlyTotals(name, data.dates, data.matrix);

      // 最大の週合計・月合計を取得
      var maxWeek = 0, maxMonth = 0;
      Object.keys(weeklyTotals).forEach(function(k) { if (weeklyTotals[k] > maxWeek) maxWeek = weeklyTotals[k]; });
      Object.keys(monthlyTotals).forEach(function(k) { if (monthlyTotals[k] > maxMonth) maxMonth = monthlyTotals[k]; });

      html += '<tr>';
      // 行ヘッダ（担当者名 + 超過日数バッジ）
      html += '<td class="hm-sticky-col hm-row-header">';
      html += '<span class="hm-member-name">' + App.escH(name) + '</span>';
      if (overDays > 0) {
        html += '<span class="hm-over-badge">' + overDays + '日超過</span>';
      }
      html += '</td>';

      // 日付セル
      data.dates.forEach(function(d) {
        var iso = App.fmtISO(d);
        var cell = data.matrix[name][iso];
        var hours = cell ? cell.hours : 0;
        var cls = hours > 0 ? getColorClass(hours) : 'hm-empty';
        var wkend = isWeekend(d) ? ' hm-weekend' : '';
        var todayCls = iso === todayISO ? ' hm-today-col' : '';
        var pulse = hours > 8 ? ' hm-pulse' : '';

        html += '<td class="hm-cell ' + cls + wkend + todayCls + pulse + '" ';
        html += 'data-hm-name="' + App.escH(name) + '" data-hm-date="' + iso + '" ';
        html += 'title="' + App.escH(name) + ' ' + App.fmtD(d) + ': ' + hours.toFixed(1) + 'h">';
        if (hours > 0) {
          html += '<span class="hm-hours">' + hours.toFixed(1) + '</span>';
        }
        if (hours > 8) {
          html += '<span class="hm-warn-badge">!</span>';
        }
        html += '</td>';
      });

      // 週合計
      var weekCls = maxWeek > WEEKLY_LIMIT ? ' hm-total-over' : '';
      html += '<td class="hm-total-cell' + weekCls + '">' + Math.round(maxWeek) + 'h</td>';

      // 月合計
      var monthCls = maxMonth > MONTHLY_LIMIT ? ' hm-total-over' : '';
      html += '<td class="hm-total-cell' + monthCls + '">' + Math.round(maxMonth) + 'h</td>';

      html += '</tr>';
    });
    html += '</tbody></table></div>';

    html += '</div>';

    // --- スタイル注入 ---
    html += buildStyles();

    container.innerHTML = html;

    // --- イベントバインド ---
    bindEvents(container, data);
  }

  // ===== イベントバインド =====
  function bindEvents(container, data) {
    // モード切替
    var btns = container.querySelectorAll('[data-hm-mode]');
    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentMode = btn.dataset.hmMode;
        render(container);
      });
    });

    // セルクリック → モーダル
    var cells = container.querySelectorAll('.hm-cell[data-hm-name]');
    cells.forEach(function(cell) {
      cell.addEventListener('click', function() {
        var name = cell.dataset.hmName;
        var dateISO = cell.dataset.hmDate;
        if (data.matrix[name] && data.matrix[name][dateISO]) {
          showCellModal(name, dateISO, data.matrix[name][dateISO]);
        }
      });
    });
  }

  // ===== スコープ付きCSS =====
  function buildStyles() {
    return '<style>' +
      '.hm-container{padding:.5rem 0}' +
      '.hm-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem}' +
      '.hm-mode-btns{display:flex;gap:.25rem}' +
      '.hm-legend{display:flex;align-items:center;gap:.6rem;font-size:.7rem;color:var(--text-muted)}' +
      '.hm-legend-label{font-weight:600}' +
      '.hm-legend-item{display:flex;align-items:center;gap:.2rem}' +
      '.hm-legend-swatch{display:inline-block;width:14px;height:14px;border-radius:3px}' +
      '.hm-legend-swatch.hm-green{background:var(--success)}' +
      '.hm-legend-swatch.hm-yellow{background:var(--warning)}' +
      '.hm-legend-swatch.hm-orange{background:#f97316}' +
      '.hm-legend-swatch.hm-red{background:var(--danger)}' +
      '.hm-summary{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem}' +
      '.hm-scroll{overflow:auto;max-height:70vh;border:1px solid var(--border);border-radius:8px;background:var(--surface)}' +
      '.hm-table{border-collapse:collapse;font-size:.75rem;white-space:nowrap}' +
      '.hm-table th,.hm-table td{padding:.25rem .4rem;text-align:center;border:1px solid var(--border)}' +
      '.hm-sticky-col{position:sticky;left:0;z-index:2;background:var(--surface);min-width:110px;text-align:left}' +
      '.hm-header-name{z-index:3}' +
      '.hm-date-header{font-size:.65rem;color:var(--text-muted);min-width:44px}' +
      '.hm-row-header{display:flex;align-items:center;gap:.3rem;font-weight:500}' +
      '.hm-member-name{overflow:hidden;text-overflow:ellipsis}' +
      '.hm-over-badge{font-size:.55rem;padding:.1rem .3rem;border-radius:3px;background:var(--danger-dim);color:var(--danger);white-space:nowrap}' +
      '.hm-cell{cursor:pointer;min-width:44px;height:28px;position:relative;transition:filter .15s}' +
      '.hm-cell:hover{filter:brightness(1.2);outline:2px solid var(--accent)}' +
      '.hm-empty{background:transparent}' +
      '.hm-green{background:var(--success-dim);color:var(--success)}' +
      '.hm-yellow{background:var(--warning-dim);color:var(--warning)}' +
      '.hm-orange{background:rgba(249,115,22,.18);color:#f97316}' +
      '.hm-red{background:var(--danger-dim);color:var(--danger)}' +
      '.hm-weekend{opacity:.6}' +
      '.hm-today-col{box-shadow:inset 0 0 0 2px var(--accent)}' +
      '.hm-pulse{animation:hmPulse 1.5s ease-in-out infinite}' +
      '@keyframes hmPulse{0%,100%{opacity:1}50%{opacity:.65}}' +
      '.hm-hours{font-size:.65rem;font-weight:600}' +
      '.hm-warn-badge{position:absolute;top:1px;right:1px;font-size:.5rem;font-weight:700;color:var(--danger);background:var(--surface);border-radius:50%;width:12px;height:12px;display:flex;align-items:center;justify-content:center;line-height:1}' +
      '.hm-total-header{font-size:.65rem;color:var(--text-muted);min-width:48px;background:var(--surface2)}' +
      '.hm-total-cell{font-size:.7rem;font-weight:600;background:var(--surface2);color:var(--text)}' +
      '.hm-total-over{color:var(--danger);background:var(--danger-dim)}' +
      '</style>';
  }

  // ===== ビュー登録 =====
  App.registerView('heatmap', {
    init: function() {},
    render: render
  });

})();
