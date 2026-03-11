/**
 * table.js — テーブルビュー（タスク一覧）完全版
 * cmd_023_s10r 再実装 by bushi5（スクナヒコナ）
 *
 * 機能:
 *   - 11カラムテーブル + インライン編集
 *   - フィルタバー（ステータス/担当者/テキスト検索）
 *   - ドラッグ&ドロップ並び替え
 *   - 記事詳細パネル（FR-09）
 *   - 担当者ドロップダウン（state.members連携）
 *   - ステータスバッジ循環切替
 *   - 行追加/削除
 *   - 3階層対応（Project→Kikaku→Task）
 *
 * API: App.registerView('table', { init, render })
 */
(function() {
  'use strict';

  // ===== ローカル状態 =====
  var filterStatus = '';
  var filterAssignee = '';
  var filterText = '';
  var expandedTaskId = null;
  var dragSrcIndex = null;

  // ===== ユーティリティ =====
  function esc(s) { return App.escH(s); }

  function getKikaku() { return App.getActiveKikaku(); }

  function todayISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function isDelayed(task) {
    return task.actualEnd && task.planEnd && task.actualEnd > task.planEnd;
  }

  function getMembers() {
    var st = App.getState();
    return (st && st.members) ? st.members : [];
  }

  function getFilteredTasks(kikaku) {
    if (!kikaku || !kikaku.tasks) return [];
    return kikaku.tasks.filter(function(t) {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterAssignee && t.assignee !== filterAssignee) return false;
      if (filterText) {
        var q = filterText.toLowerCase();
        var haystack = (t.name + ' ' + (t.assignee || '') + ' ' + (t.note || '')).toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function getUniqueAssignees(kikaku) {
    if (!kikaku || !kikaku.tasks) return [];
    var seen = {};
    var result = [];
    kikaku.tasks.forEach(function(t) {
      if (t.assignee && !seen[t.assignee]) {
        seen[t.assignee] = true;
        result.push(t.assignee);
      }
    });
    return result.sort();
  }

  // ===== ステータスバッジ色 =====
  function statusClass(status) {
    var map = {
      not_started: 'badge-gray',
      in_progress: 'badge-blue',
      completed: 'badge-green',
      on_hold: 'badge-yellow'
    };
    return map[status] || 'badge-gray';
  }

  // ===== フィルタバー描画 =====
  function renderFilterBar(container, kikaku) {
    var bar = document.createElement('div');
    bar.className = 'table-filter-bar';

    // ステータスフィルタ
    var statusSel = document.createElement('select');
    statusSel.className = 'table-filter-select';
    statusSel.innerHTML = '<option value="">全ステータス</option>';
    Data.STATUS_LIST.forEach(function(s) {
      var opt = document.createElement('option');
      opt.value = s;
      opt.textContent = Data.STATUS_LABELS[s];
      if (s === filterStatus) opt.selected = true;
      statusSel.appendChild(opt);
    });
    statusSel.addEventListener('change', function() {
      filterStatus = statusSel.value;
      renderTable(container, kikaku);
    });

    // 担当者フィルタ
    var assigneeSel = document.createElement('select');
    assigneeSel.className = 'table-filter-select';
    assigneeSel.innerHTML = '<option value="">全担当者</option>';
    var members = getMembers();
    var assignees = getUniqueAssignees(kikaku);
    // メンバーマスターを優先、なければタスクから取得
    var optionList = members.length > 0
      ? members.map(function(m) { return m.name; })
      : assignees;
    optionList.forEach(function(name) {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (name === filterAssignee) opt.selected = true;
      assigneeSel.appendChild(opt);
    });
    assigneeSel.addEventListener('change', function() {
      filterAssignee = assigneeSel.value;
      renderTable(container, kikaku);
    });

    // テキスト検索
    var searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.className = 'table-filter-search';
    searchBox.placeholder = '工程名・担当者・備考で検索...';
    searchBox.value = filterText;
    var searchTimer = null;
    searchBox.addEventListener('input', function() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function() {
        filterText = searchBox.value.trim();
        renderTable(container, kikaku);
        // 再描画後にフォーカスを戻す
        var newSearch = container.querySelector('.table-filter-search');
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      }, 300);
    });

    // フィルタクリアボタン
    var clearBtn = document.createElement('button');
    clearBtn.className = 'table-filter-clear';
    clearBtn.textContent = 'クリア';
    clearBtn.style.display = (filterStatus || filterAssignee || filterText) ? '' : 'none';
    clearBtn.addEventListener('click', function() {
      filterStatus = '';
      filterAssignee = '';
      filterText = '';
      renderTable(container, kikaku);
    });

    bar.appendChild(statusSel);
    bar.appendChild(assigneeSel);
    bar.appendChild(searchBox);
    bar.appendChild(clearBtn);
    return bar;
  }

  // ===== 担当者セルのドロップダウン =====
  function createAssigneeDropdown(td, task, kikaku) {
    var members = getMembers();
    var sel = document.createElement('select');
    sel.className = 'table-inline-select';

    // 空オプション
    var emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '-- 未設定 --';
    sel.appendChild(emptyOpt);

    if (members.length > 0) {
      members.forEach(function(m) {
        var opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = m.name + ' (' + (Data.ROLE_LABELS[m.role] || m.role) + ')';
        if (m.name === task.assignee) opt.selected = true;
        sel.appendChild(opt);
      });
    } else {
      // メンバーマスター未登録時: タスクの既存担当者をオプション化
      var assignees = getUniqueAssignees(kikaku);
      assignees.forEach(function(name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === task.assignee) opt.selected = true;
        sel.appendChild(opt);
      });
      // 手動入力オプション
      var manualOpt = document.createElement('option');
      manualOpt.value = '__manual__';
      manualOpt.textContent = '+ 手動入力...';
      sel.appendChild(manualOpt);
    }

    function commit() {
      var val = sel.value;
      if (val === '__manual__') {
        // 手動入力に切り替え
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'table-inline-input';
        input.value = task.assignee || '';
        td.textContent = '';
        td.appendChild(input);
        input.focus();
        input.select();
        input.addEventListener('blur', function() {
          App.updateTask(kikaku, task.id, 'assignee', input.value.trim());
          App.renderAll();
        });
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
          if (e.key === 'Escape') { App.renderAll(); }
        });
        return;
      }
      App.updateTask(kikaku, task.id, 'assignee', val);
      App.renderAll();
    }

    sel.addEventListener('change', commit);
    sel.addEventListener('blur', function() {
      // 何もしない（changeで処理済み）。Escape対応
    });
    sel.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { App.renderAll(); }
    });

    td.textContent = '';
    td.appendChild(sel);
    sel.focus();
  }

  // ===== インライン編集 =====
  function setupInlineEdit(td, task, field, type, kikaku) {
    td.addEventListener('click', function(e) {
      e.stopPropagation();
      if (td.querySelector('input,select,textarea')) return;

      // 担当者はドロップダウン
      if (field === 'assignee') {
        createAssigneeDropdown(td, task, kikaku);
        return;
      }

      var val = task[field] || '';
      var input;
      if (type === 'date') {
        input = document.createElement('input');
        input.type = 'date';
        input.className = 'table-inline-input';
        input.value = val;
      } else if (type === 'number') {
        input = document.createElement('input');
        input.type = 'number';
        input.className = 'table-inline-input';
        input.min = '0';
        input.step = '0.5';
        input.value = val;
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'table-inline-input';
        input.value = val;
      }

      td.textContent = '';
      td.appendChild(input);
      input.focus();
      input.select();

      function commit() {
        var nv = input.value.trim();
        if (type === 'number') nv = parseFloat(nv) || 0;
        App.updateTask(kikaku, task.id, field, nv);
        App.renderAll();
      }

      input.addEventListener('blur', commit);
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { App.renderAll(); }
      });
    });
  }

  // ===== ステータスバッジ =====
  function createStatusBadge(task, kikaku) {
    var span = document.createElement('span');
    span.className = 'status-badge ' + task.status + ' ' + statusClass(task.status);
    span.textContent = Data.STATUS_LABELS[task.status] || task.status;
    span.title = 'クリックで切替';
    span.style.cursor = 'pointer';
    span.addEventListener('click', function(e) {
      e.stopPropagation();
      var idx = Data.STATUS_LIST.indexOf(task.status);
      var next = Data.STATUS_LIST[(idx + 1) % Data.STATUS_LIST.length];
      App.updateTask(kikaku, task.id, 'status', next);
      App.renderAll();
    });
    return span;
  }

  // ===== ドラッグ&ドロップ =====
  function setupDragAndDrop(tr, index, kikaku, container) {
    tr.draggable = true;
    tr.addEventListener('dragstart', function(e) {
      dragSrcIndex = index;
      tr.classList.add('table-row-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    });
    tr.addEventListener('dragend', function() {
      tr.classList.remove('table-row-dragging');
      dragSrcIndex = null;
      // ドラッグオーバーのハイライトを全消去
      container.querySelectorAll('.table-row-dragover').forEach(function(el) {
        el.classList.remove('table-row-dragover');
      });
    });
    tr.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      tr.classList.add('table-row-dragover');
    });
    tr.addEventListener('dragleave', function() {
      tr.classList.remove('table-row-dragover');
    });
    tr.addEventListener('drop', function(e) {
      e.preventDefault();
      tr.classList.remove('table-row-dragover');
      var fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (isNaN(fromIndex) || fromIndex === index) return;

      // tasks配列の並べ替え
      var tasks = kikaku.tasks;
      if (!tasks || fromIndex < 0 || fromIndex >= tasks.length || index < 0 || index >= tasks.length) return;
      var moved = tasks.splice(fromIndex, 1)[0];
      tasks.splice(index, 0, moved);
      var st = App.getState();
      Data.save(st);
      App.renderAll();
    });
  }

  // ===== 記事詳細パネル（FR-09） =====
  function renderDetailPanel(task, kikaku) {
    var panel = document.createElement('tr');
    panel.className = 'table-detail-row';
    var td = document.createElement('td');
    td.colSpan = 11;
    td.className = 'table-detail-cell';

    // contentフィールドはタスクレベルまたは企画レベルで管理
    // FR-09: タスク単位のコンテンツ情報
    var content = task.content || {};

    var fields = [
      { key: 'articleTitle', label: '記事名', type: 'text' },
      { key: 'articleSummary', label: '概要', type: 'textarea' },
      { key: 'charCount', label: '文字量（目安）', type: 'number' },
      { key: 'pageSpace', label: '掲載スペース', type: 'text' },
      { key: 'sourceType', label: 'ソース元', type: 'text' },
      { key: 'clientRequest', label: 'クライアント要望', type: 'textarea' },
      { key: 'resourceLinks', label: '資料リンク', type: 'text' },
      { key: 'memo', label: '備忘録', type: 'textarea' },
      { key: 'pendingItems', label: '確認中事項', type: 'textarea' }
    ];

    var html = '<div class="table-detail-panel">';
    html += '<div class="table-detail-header">';
    html += '<span class="table-detail-title">' + esc(task.name) + ' \u2014 詳細情報</span>';
    html += '<button class="table-detail-close" data-action="close-detail">\u2715</button>';
    html += '</div>';
    html += '<div class="table-detail-grid">';

    fields.forEach(function(f) {
      var val = content[f.key];
      if (f.key === 'resourceLinks' && Array.isArray(val)) {
        val = val.join(', ');
      }
      val = val || '';
      html += '<div class="table-detail-field">';
      html += '<label class="table-detail-label">' + esc(f.label) + '</label>';
      if (f.type === 'textarea') {
        html += '<textarea class="table-detail-input" data-content-key="' + f.key + '" rows="2">' + esc(String(val)) + '</textarea>';
      } else if (f.type === 'number') {
        html += '<input type="number" class="table-detail-input" data-content-key="' + f.key + '" value="' + esc(String(val)) + '" min="0">';
      } else {
        html += '<input type="text" class="table-detail-input" data-content-key="' + f.key + '" value="' + esc(String(val)) + '">';
      }
      html += '</div>';
    });

    // 担当者変更履歴（FR-02 assigneeHistory）
    if (task.assigneeHistory && task.assigneeHistory.length > 0) {
      html += '<div class="table-detail-field table-detail-field-full">';
      html += '<label class="table-detail-label">担当者変更履歴</label>';
      html += '<div class="table-detail-history">';
      task.assigneeHistory.forEach(function(h) {
        var ts = h.timestamp ? h.timestamp.slice(0, 16).replace('T', ' ') : '';
        html += '<div class="table-detail-history-item">';
        html += '<span>' + esc(h.from || '(未設定)') + ' \u2192 ' + esc(h.to || '(未設定)') + '</span>';
        html += '<span class="table-detail-history-ts">' + esc(ts) + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    // ファイル添付（簡易版）
    html += '<div class="table-detail-field table-detail-field-full">';
    html += '<label class="table-detail-label">添付ファイル</label>';
    html += '<div class="table-detail-files">';
    if (task.files && task.files.length > 0) {
      task.files.forEach(function(f, fi) {
        html += '<span class="table-detail-file">' + esc(f.name || f) + ' <button class="table-detail-file-del" data-file-idx="' + fi + '">\u2715</button></span>';
      });
    } else {
      html += '<span style="color:var(--text-dim);font-size:.75rem">なし</span>';
    }
    html += '</div></div>';

    html += '</div>'; // grid
    html += '<div class="table-detail-actions">';
    html += '<button class="btn-primary table-detail-save" data-action="save-detail">保存</button>';
    html += '</div>';
    html += '</div>'; // panel

    td.innerHTML = html;
    panel.appendChild(td);

    // イベント設定
    setTimeout(function() {
      // 閉じるボタン
      var closeBtn = td.querySelector('[data-action="close-detail"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          expandedTaskId = null;
          App.renderAll();
        });
      }

      // 保存ボタン
      var saveBtn = td.querySelector('[data-action="save-detail"]');
      if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          saveDetailFields(td, task, kikaku);
        });
      }

      // ファイル削除ボタン
      td.querySelectorAll('[data-file-idx]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var idx = parseInt(btn.dataset.fileIdx, 10);
          if (task.files && idx >= 0 && idx < task.files.length) {
            task.files.splice(idx, 1);
            var st = App.getState();
            Data.save(st);
            App.renderAll();
          }
        });
      });
    }, 0);

    return panel;
  }

  function saveDetailFields(td, task, kikaku) {
    if (!task.content) task.content = {};
    td.querySelectorAll('[data-content-key]').forEach(function(el) {
      var key = el.dataset.contentKey;
      var val = el.value;
      if (key === 'charCount') {
        val = parseInt(val, 10) || 0;
      } else if (key === 'resourceLinks') {
        val = val.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      }
      task.content[key] = val;
    });
    var st = App.getState();
    Data.save(st);
    App.showToast('詳細情報を保存しました', 'success');
  }

  // ===== テーブル本体描画 =====
  function renderTable(container, kikaku) {
    container.innerHTML = '';

    if (!kikaku) {
      container.innerHTML = '<div class="placeholder">企画を選択してください</div>';
      return;
    }

    // フィルタバー
    container.appendChild(renderFilterBar(container, kikaku));

    if (!kikaku.tasks || !kikaku.tasks.length) {
      var emptyDiv = document.createElement('div');
      emptyDiv.className = 'placeholder';
      emptyDiv.innerHTML = '工程がありません<br><button class="toolbar-btn" style="margin-top:1rem" data-action="add-first">+ 最初の工程を追加</button>';
      container.appendChild(emptyDiv);
      var addFirstBtn = emptyDiv.querySelector('[data-action="add-first"]');
      if (addFirstBtn) {
        addFirstBtn.addEventListener('click', function() {
          App.addTask(kikaku, {});
          App.renderAll();
        });
      }
      return;
    }

    var tasks = getFilteredTasks(kikaku);

    // テーブル構築
    var table = document.createElement('table');
    table.className = 'table-view';

    // thead
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    var headers = [
      { text: '#', width: '36px', cls: '' },
      { text: '工程名', width: '', cls: '' },
      { text: '担当者', width: '100px', cls: '' },
      { text: '\uD83D\uDCC5 予定開始', width: '100px', cls: 'th-plan' },
      { text: '\uD83D\uDCC5 予定終了', width: '100px', cls: 'th-plan' },
      { text: '\u2705 実績開始', width: '100px', cls: 'th-actual' },
      { text: '\u2705 実績終了', width: '100px', cls: 'th-actual' },
      { text: '工数(h)', width: '64px', cls: '' },
      { text: 'ステータス', width: '80px', cls: '' },
      { text: '備考', width: '', cls: '' },
      { text: '', width: '60px', cls: '' }
    ];
    headers.forEach(function(h) {
      var th = document.createElement('th');
      th.textContent = h.text;
      if (h.width) th.style.width = h.width;
      if (h.cls) th.className = h.cls;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // tbody
    var tbody = document.createElement('tbody');

    tasks.forEach(function(task) {
      // 元の配列でのindexを取得（D&D用）
      var origIndex = kikaku.tasks.indexOf(task);
      var displayIndex = origIndex + 1;

      var tr = document.createElement('tr');
      tr.dataset.tid = task.id;
      if (expandedTaskId === task.id) tr.classList.add('table-row-expanded');

      // 本日期限ハイライト
      var today = todayISO();
      if (task.planEnd === today && task.status !== 'completed') {
        tr.classList.add('table-row-today');
      }

      // 遅延判定
      var taskDelayed = isDelayed(task);

      // ドラッグ&ドロップ
      setupDragAndDrop(tr, origIndex, kikaku, container);

      // #
      var tdNum = document.createElement('td');
      tdNum.className = 'table-cell-num';
      tdNum.textContent = displayIndex;
      tdNum.title = 'ドラッグして並び替え';
      tdNum.style.cursor = 'grab';
      tr.appendChild(tdNum);

      // 工程名（クリックで詳細パネル展開）
      var tdName = document.createElement('td');
      tdName.className = 'editable table-cell-name';
      tdName.textContent = task.name;
      tdName.title = 'クリックで編集 / ダブルクリックで詳細パネル';
      // シングルクリック: インライン編集
      setupInlineEdit(tdName, task, 'name', 'text', kikaku);
      tr.appendChild(tdName);

      // 担当者
      var tdAssignee = document.createElement('td');
      tdAssignee.className = 'editable table-cell-assignee';
      tdAssignee.textContent = task.assignee || '\u2014';
      setupInlineEdit(tdAssignee, task, 'assignee', 'text', kikaku);
      tr.appendChild(tdAssignee);

      // 予定開始
      var tdPS = document.createElement('td');
      tdPS.className = 'editable table-cell-date table-cell-plan';
      tdPS.textContent = task.planStart || '';
      setupInlineEdit(tdPS, task, 'planStart', 'date', kikaku);
      tr.appendChild(tdPS);

      // 予定終了
      var tdPE = document.createElement('td');
      tdPE.className = 'editable table-cell-date table-cell-plan';
      tdPE.textContent = task.planEnd || '';
      setupInlineEdit(tdPE, task, 'planEnd', 'date', kikaku);
      tr.appendChild(tdPE);

      // 実績開始
      var tdAS = document.createElement('td');
      tdAS.className = 'editable table-cell-date ' + (task.actualStart ? 'table-cell-actual' : 'table-cell-actual-empty');
      tdAS.textContent = task.actualStart || '\u2014';
      setupInlineEdit(tdAS, task, 'actualStart', 'date', kikaku);
      tr.appendChild(tdAS);

      // 実績終了
      var tdAE = document.createElement('td');
      var aeClass = 'editable table-cell-date ';
      if (taskDelayed) {
        aeClass += 'table-cell-actual-late';
      } else if (task.actualEnd) {
        aeClass += 'table-cell-actual';
      } else {
        aeClass += 'table-cell-actual-empty';
      }
      tdAE.className = aeClass;
      tdAE.textContent = task.actualEnd || '\u2014';
      setupInlineEdit(tdAE, task, 'actualEnd', 'date', kikaku);
      tr.appendChild(tdAE);

      // 工数
      var tdHours = document.createElement('td');
      tdHours.className = 'editable table-cell-hours';
      tdHours.textContent = task.estimatedHours || 0;
      setupInlineEdit(tdHours, task, 'estimatedHours', 'number', kikaku);
      tr.appendChild(tdHours);

      // ステータス
      var tdStatus = document.createElement('td');
      tdStatus.appendChild(createStatusBadge(task, kikaku));
      tr.appendChild(tdStatus);

      // 備考
      var tdNote = document.createElement('td');
      tdNote.className = 'editable table-cell-note';
      tdNote.textContent = task.note || '\u2014';
      setupInlineEdit(tdNote, task, 'note', 'text', kikaku);
      tr.appendChild(tdNote);

      // 操作
      var tdActions = document.createElement('td');
      tdActions.className = 'table-cell-actions';
      var actionsHtml = '<div class="row-actions">';
      actionsHtml += '<button class="table-action-btn table-action-detail" data-action="toggle-detail" title="詳細パネル">\u25BC</button>';
      actionsHtml += '<button class="table-action-btn table-action-del" data-action="delete" title="削除">\u2715</button>';
      actionsHtml += '</div>';
      tdActions.innerHTML = actionsHtml;
      tr.appendChild(tdActions);

      // 操作ボタンイベント
      (function(currentTask, currentTr) {
        setTimeout(function() {
          var detailBtn = currentTr.querySelector('[data-action="toggle-detail"]');
          if (detailBtn) {
            detailBtn.addEventListener('click', function(e) {
              e.stopPropagation();
              if (expandedTaskId === currentTask.id) {
                expandedTaskId = null;
              } else {
                expandedTaskId = currentTask.id;
              }
              App.renderAll();
            });
          }
          var delBtn = currentTr.querySelector('[data-action="delete"]');
          if (delBtn) {
            delBtn.addEventListener('click', function(e) {
              e.stopPropagation();
              if (confirm('この工程を削除しますか？')) {
                App.deleteTask(kikaku, currentTask.id);
                if (expandedTaskId === currentTask.id) expandedTaskId = null;
                App.renderAll();
              }
            });
          }
        }, 0);
      })(task, tr);

      tbody.appendChild(tr);

      // 詳細パネル（展開中）
      if (expandedTaskId === task.id) {
        tbody.appendChild(renderDetailPanel(task, kikaku));
      }
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // フィルタ結果件数
    if (filterStatus || filterAssignee || filterText) {
      var info = document.createElement('div');
      info.className = 'table-filter-info';
      info.textContent = tasks.length + ' / ' + kikaku.tasks.length + ' 件表示中';
      container.appendChild(info);
    }

    // 行追加ボタン
    var addBtn = document.createElement('button');
    addBtn.className = 'add-row-btn';
    addBtn.textContent = '+ 新しい工程を追加';
    addBtn.addEventListener('click', function() {
      App.addTask(kikaku, {});
      App.renderAll();
    });
    container.appendChild(addBtn);
  }

  // ===== CSS注入 =====
  function injectCSS() {
    if (document.getElementById('table-view-css')) return;
    var style = document.createElement('style');
    style.id = 'table-view-css';
    style.textContent = [
      '/* === table.js 専用CSS === */',
      '.table-filter-bar { display:flex; gap:.5rem; align-items:center; padding:.5rem 0; flex-wrap:wrap; }',
      '.table-filter-select { padding:.35rem .5rem; border:1px solid var(--border,#444); border-radius:4px; background:var(--bg-card,#1e1e1e); color:var(--text,#eee); font-size:.8rem; min-width:100px; }',
      '.table-filter-search { padding:.35rem .5rem; border:1px solid var(--border,#444); border-radius:4px; background:var(--bg-card,#1e1e1e); color:var(--text,#eee); font-size:.8rem; flex:1; min-width:160px; }',
      '.table-filter-clear { padding:.35rem .7rem; border:1px solid var(--border,#444); border-radius:4px; background:transparent; color:var(--text-dim,#888); font-size:.75rem; cursor:pointer; }',
      '.table-filter-clear:hover { color:var(--text,#eee); background:var(--bg-hover,#333); }',
      '.table-filter-info { font-size:.75rem; color:var(--text-dim,#888); padding:.25rem 0; }',
      '',
      '.table-inline-input { width:100%; padding:.2rem .3rem; border:1px solid var(--accent,#4a9eff); border-radius:3px; background:var(--bg-card,#1e1e1e); color:var(--text,#eee); font-size:.8rem; outline:none; box-sizing:border-box; }',
      '.table-inline-select { width:100%; padding:.2rem .3rem; border:1px solid var(--accent,#4a9eff); border-radius:3px; background:var(--bg-card,#1e1e1e); color:var(--text,#eee); font-size:.8rem; outline:none; }',
      '',
      '.table-cell-num { color:var(--text-dim,#888); font-size:.7rem; text-align:center; user-select:none; }',
      '.table-cell-name { font-weight:500; }',
      '.table-cell-date { font-size:.8rem; white-space:nowrap; }',
      '.table-cell-hours { text-align:right; font-size:.8rem; }',
      '',
      '/* 予定日/実績日の視覚区別 */',
      '.th-plan { background:rgba(59,130,246,0.12) !important; }',
      '.th-actual { background:rgba(34,197,94,0.12) !important; }',
      '.table-cell-plan { background:rgba(59,130,246,0.08); }',
      '.table-cell-actual { background:rgba(34,197,94,0.08); }',
      '.table-cell-actual-empty { background:rgba(148,163,184,0.08); }',
      '.table-cell-actual-late { background:rgba(239,68,68,0.12); }',
      '',
      '/* 本日期限タスクハイライト */',
      '.table-row-today { border-left:3px solid #f59e0b !important; }',
      '.table-row-today td:first-child { color:#f59e0b; font-weight:700; }',
      '.table-cell-note { font-size:.8rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.table-cell-actions { text-align:center; }',
      '',
      '.table-action-btn { background:none; border:none; cursor:pointer; padding:.15rem .3rem; font-size:.75rem; color:var(--text-dim,#888); border-radius:3px; }',
      '.table-action-btn:hover { background:var(--bg-hover,#333); color:var(--text,#eee); }',
      '.table-action-del:hover { color:var(--danger,#e55); }',
      '.table-action-detail { transition:transform .2s; }',
      '',
      '.table-row-expanded { background:var(--bg-hover,#2a2a2a) !important; }',
      '.table-row-expanded .table-action-detail { transform:rotate(180deg); }',
      '.table-row-dragging { opacity:.5; }',
      '.table-row-dragover { border-top:2px solid var(--accent,#4a9eff); }',
      '',
      '/* バッジ色 */',
      '.badge-gray { background:var(--bg-hover,#444); color:var(--text-dim,#aaa); }',
      '.badge-blue { background:rgba(74,158,255,.15); color:var(--accent-light,#6ab4ff); }',
      '.badge-green { background:rgba(80,200,120,.15); color:var(--success,#50c878); }',
      '.badge-yellow { background:rgba(255,193,7,.15); color:#ffc107; }',
      '',
      '/* 詳細パネル */',
      '.table-detail-row td { padding:0 !important; }',
      '.table-detail-cell { border-top:none !important; }',
      '.table-detail-panel { padding:1rem; background:var(--bg-card,#1a1a1a); border:1px solid var(--border,#333); border-radius:0 0 6px 6px; margin:0 .5rem .5rem; }',
      '.table-detail-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }',
      '.table-detail-title { font-weight:600; font-size:.9rem; }',
      '.table-detail-close { background:none; border:none; color:var(--text-dim,#888); cursor:pointer; font-size:1rem; padding:.2rem .4rem; }',
      '.table-detail-close:hover { color:var(--text,#eee); }',
      '.table-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }',
      '.table-detail-field { display:flex; flex-direction:column; gap:.2rem; }',
      '.table-detail-field-full { grid-column:1 / -1; }',
      '.table-detail-label { font-size:.7rem; font-weight:600; color:var(--text-dim,#888); text-transform:uppercase; letter-spacing:.03em; }',
      '.table-detail-input { padding:.35rem .5rem; border:1px solid var(--border,#444); border-radius:4px; background:var(--bg,#121212); color:var(--text,#eee); font-size:.8rem; font-family:inherit; resize:vertical; }',
      '.table-detail-input:focus { border-color:var(--accent,#4a9eff); outline:none; }',
      '.table-detail-actions { margin-top:.75rem; text-align:right; }',
      '.table-detail-save { padding:.4rem 1rem; }',
      '',
      '.table-detail-history { font-size:.75rem; }',
      '.table-detail-history-item { display:flex; justify-content:space-between; padding:.15rem 0; border-bottom:1px solid var(--border,#333); }',
      '.table-detail-history-ts { color:var(--text-dim,#888); }',
      '',
      '.table-detail-files { display:flex; flex-wrap:wrap; gap:.3rem; }',
      '.table-detail-file { display:inline-flex; align-items:center; gap:.3rem; padding:.15rem .4rem; background:var(--bg-hover,#333); border-radius:3px; font-size:.75rem; }',
      '.table-detail-file-del { background:none; border:none; color:var(--text-dim,#888); cursor:pointer; font-size:.65rem; padding:0 .15rem; }',
      '.table-detail-file-del:hover { color:var(--danger,#e55); }',
      '',
      '/* レスポンシブ */',
      '@media (max-width: 768px) {',
      '  .table-filter-bar { flex-direction:column; }',
      '  .table-filter-select, .table-filter-search { width:100%; }',
      '  .table-detail-grid { grid-template-columns:1fr; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ===== ビュー登録 =====
  App.registerView('table', {
    init: function() {
      injectCSS();
    },
    render: function(container) {
      var kikaku = getKikaku();
      renderTable(container, kikaku);
    }
  });

})();
