/**
 * csv.js — CSV入出力 + JSONバックアップ/復元
 * cmd_023 Phase3-s11 / 神使7（クエビコ）
 *
 * 依存API: App.getState(), App.setState(partial), App.escH(str),
 *          App.showModal(html), App.closeModal(), App.showToast(msg),
 *          App.getActiveProject(), App.getActiveKikaku()
 *          Data.createTask(opts), Data.exportJSON(), Data.importJSON(json),
 *          Data.STATUS_LABELS, Data.ROLE_LABELS
 *
 * 公開API: window.CsvHelper = { showImport, showExport, showBackup }
 */
(function() {
  'use strict';

  // ===== CSV内部状態 =====
  var csvData = null;
  var csvHeaders = [];

  // ===== ステータスマッピング =====
  var STATUS_MAP = {
    '未着手': 'not_started',
    '進行中': 'in_progress',
    '完了': 'completed',
    '保留': 'on_hold',
    'not_started': 'not_started',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'on_hold': 'on_hold'
  };

  // ===== CSV解析ユーティリティ =====

  /**
   * ファイル読み込み（エンコーディング自動検出）
   * UTF-8で読み、文字化け検知時にShift_JISでリトライ
   */
  function readFile(file, cb) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      // 文字化け検出: 置換文字(U+FFFD)またはNUL文字
      if (text.indexOf('\ufffd') > -1 || text.indexOf('\u0000') > -1) {
        var r2 = new FileReader();
        r2.onload = function(e2) { cb(e2.target.result); };
        try {
          r2.readAsText(file, 'shift_jis');
        } catch (ex) {
          cb(text);
        }
      } else {
        cb(text);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  /**
   * CSV文字列をパース
   */
  function parseCSV(text) {
    var lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(function(l) {
      return l.trim();
    });
    if (!lines.length) return { headers: [], rows: [] };
    var headers = splitCSVLine(lines[0]);
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      rows.push(splitCSVLine(lines[i]));
    }
    return { headers: headers, rows: rows };
  }

  /**
   * CSV行をフィールド配列に分割（ダブルクォート対応）
   */
  function splitCSVLine(line) {
    var result = [], current = '', inQuote = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (inQuote) {
        if (c === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuote = false;
          }
        } else {
          current += c;
        }
      } else {
        if (c === '"') {
          inQuote = true;
        } else if (c === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += c;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * CSV値をエスケープ
   */
  function csvEscape(val) {
    var s = String(val == null ? '' : val);
    if (s.indexOf(',') > -1 || s.indexOf('"') > -1 || s.indexOf('\n') > -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  /**
   * 日付正規化（YYYY/MM/DD → YYYY-MM-DD）
   */
  function normalizeDate(s) {
    if (!s) return '';
    s = s.trim().replace(/\//g, '-');
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) {
      return m[1] + '-' + (m[2].length < 2 ? '0' + m[2] : m[2]) + '-' + (m[3].length < 2 ? '0' + m[3] : m[3]);
    }
    return s;
  }

  // ===== マッピングフィールド定義 =====
  // v3拡張: assignee, rank, content系を追加
  var IMPORT_FIELDS = [
    { key: 'name',           label: 'タスク名',     required: true },
    { key: 'planStart',      label: '予定開始日' },
    { key: 'planEnd',        label: '予定終了日' },
    { key: 'actualStart',    label: '実績開始日' },
    { key: 'actualEnd',      label: '実績終了日' },
    { key: 'status',         label: 'ステータス' },
    { key: 'estimatedHours', label: '予定工数(h)' },
    { key: 'assignee',       label: '担当者' },
    { key: 'processType',    label: 'プロセス種別' },
    { key: 'note',           label: '備考' },
    { key: 'content.articleTitle',   label: '記事名' },
    { key: 'content.charCount',      label: '文字量' },
    { key: 'content.sourceType',     label: 'ソース元' },
    { key: 'content.clientRequest',  label: 'クライアント要望' }
  ];

  // カラム名自動マッチングルール
  var AUTO_MATCH = {
    name:           ['タスク', '名', 'name', 'task'],
    planStart:      ['予定開始', 'plan_start', 'start'],
    planEnd:        ['予定終了', 'plan_end', 'end'],
    actualStart:    ['実績開始', 'actual_start'],
    actualEnd:      ['実績終了', 'actual_end'],
    status:         ['ステータス', 'status'],
    estimatedHours: ['工数', '時間', 'hours'],
    assignee:       ['担当', 'assignee', 'ボール'],
    processType:    ['プロセス', '種別', 'process'],
    note:           ['備考', 'note', 'memo'],
    'content.articleTitle':  ['記事名', '記事タイトル', 'article'],
    'content.charCount':     ['文字量', '文字数', 'char_count'],
    'content.sourceType':    ['ソース', 'source'],
    'content.clientRequest': ['要望', 'request']
  };

  function autoMatchField(headerLabel, fieldKey) {
    var patterns = AUTO_MATCH[fieldKey];
    if (!patterns) return false;
    var hl = headerLabel.toLowerCase();
    for (var i = 0; i < patterns.length; i++) {
      if (hl.indexOf(patterns[i].toLowerCase()) > -1) return true;
    }
    return false;
  }

  // ===== CSVインポート =====

  function showImport() {
    csvData = null;
    csvHeaders = [];

    var escH = App.escH;
    var html = '<div class="modal-content" style="max-width:560px">';
    html += '<div class="modal-header"><h2>CSVインポート</h2>';
    html += '<button class="modal-close" onclick="App.closeModal()">✕</button></div>';
    html += '<div class="modal-body">';

    // ドロップゾーン
    html += '<div class="csv-drop-zone" id="csvDropZone">';
    html += 'ここにCSVファイルをドラッグ＆ドロップ<br>またはクリックして選択';
    html += '<input type="file" id="csvFileInput" accept=".csv,.txt" style="display:none">';
    html += '</div>';

    // マッピングエリア（初期非表示）
    html += '<div id="csvMappingArea" style="display:none"></div>';

    html += '</div>';
    html += '<div id="csvImportFooter" class="modal-footer" style="display:none">';
    html += '<button class="btn btn-save" onclick="CsvHelper._executeImport()">インポート実行</button>';
    html += '<button class="btn btn-cancel" onclick="App.closeModal()">キャンセル</button>';
    html += '</div></div>';

    App.showModal(html);

    // イベント設定（showModal後にDOM存在）
    setTimeout(function() {
      var dropZone = document.getElementById('csvDropZone');
      var fileInput = document.getElementById('csvFileInput');
      if (!dropZone || !fileInput) return;

      dropZone.addEventListener('click', function() { fileInput.click(); });
      dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', function() {
        dropZone.classList.remove('drag-over');
      });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleCSVFile(e.dataTransfer.files[0]);
      });
      fileInput.addEventListener('change', function() {
        if (fileInput.files.length) handleCSVFile(fileInput.files[0]);
      });
    }, 50);
  }

  function handleCSVFile(file) {
    readFile(file, function(text) {
      var parsed = parseCSV(text);
      if (!parsed.headers.length) {
        App.showToast('CSVの解析に失敗しました');
        return;
      }
      csvHeaders = parsed.headers;
      csvData = parsed.rows;

      var dropZone = document.getElementById('csvDropZone');
      if (dropZone) {
        dropZone.innerHTML = '✓ ' + App.escH(file.name) + ' (' + csvData.length + '行)';
        dropZone.classList.add('csv-file-loaded');
      }
      showMappingUI();
    });
  }

  function showMappingUI() {
    var area = document.getElementById('csvMappingArea');
    var footer = document.getElementById('csvImportFooter');
    if (!area) return;

    var escH = App.escH;
    var html = '<p style="margin:.8rem 0 .4rem;font-size:.85rem;color:var(--text-muted)">CSV列をフィールドに割り当ててください:</p>';

    IMPORT_FIELDS.forEach(function(f) {
      html += '<div class="csv-mapping-row">';
      html += '<label class="csv-mapping-label">' + escH(f.label) + (f.required ? ' *' : '') + '</label>';
      html += '<select class="csv-mapping-select" id="csvmap_' + f.key.replace('.', '_') + '">';
      html += '<option value="">（なし）</option>';
      csvHeaders.forEach(function(h, i) {
        var sel = autoMatchField(h, f.key) ? ' selected' : '';
        html += '<option value="' + i + '"' + sel + '>' + escH(h) + '</option>';
      });
      html += '</select></div>';
    });

    area.innerHTML = html;
    area.style.display = '';
    if (footer) footer.style.display = '';
  }

  function executeImport() {
    if (!csvData || !csvData.length) {
      App.showToast('インポートするデータがありません');
      return;
    }

    // マッピング取得
    var mapping = {};
    IMPORT_FIELDS.forEach(function(f) {
      var el = document.getElementById('csvmap_' + f.key.replace('.', '_'));
      mapping[f.key] = el && el.value !== '' ? parseInt(el.value) : -1;
    });

    if (mapping.name === -1) {
      App.showToast('タスク名の列を指定してください');
      return;
    }

    var state = App.getState();
    var proj = App.getActiveProject();
    if (!proj) {
      // プロジェクトがない場合は新規作成
      proj = Data.createProject({ name: 'インポートプロジェクト' });
      var projects = (state.projects || []).slice();
      projects.push(proj);
      App.setState({ projects: projects, activeProjectId: proj.id });
      state = App.getState();
      proj = App.getActiveProject();
    }

    var count = 0;
    var projects = (state.projects || []).slice();
    var targetProj = null;
    for (var pi = 0; pi < projects.length; pi++) {
      if (projects[pi].id === proj.id) { targetProj = projects[pi]; break; }
    }
    if (!targetProj) return;

    // v3: Kikaku階層対応 — アクティブ企画にタスクを追加
    var targetKikaku = App.getActiveKikaku ? App.getActiveKikaku() : null;
    if (!targetKikaku) {
      // 企画がない場合: プロジェクト内の最初のkikakuを使用、なければ新規作成
      var kikakus = targetProj.kikakus || [];
      if (kikakus.length > 0) {
        targetKikaku = kikakus[0];
      } else if (Data.createKikaku) {
        targetKikaku = Data.createKikaku({ name: 'インポートデータ' });
        if (!targetProj.kikakus) targetProj.kikakus = [];
        targetProj.kikakus.push(targetKikaku);
      }
    }

    // タスクの追加先を決定
    var targetTasks;
    if (targetKikaku) {
      if (!targetKikaku.tasks) targetKikaku.tasks = [];
      targetTasks = targetKikaku.tasks;
    } else {
      // フォールバック: プロジェクト直下（旧2階層互換）
      if (!targetProj.tasks) targetProj.tasks = [];
      targetTasks = targetProj.tasks;
    }

    csvData.forEach(function(row) {
      var taskName = row[mapping.name];
      if (!taskName || !taskName.trim()) return;

      var opts = { name: taskName.trim() };

      if (mapping.planStart >= 0) opts.planStart = normalizeDate(row[mapping.planStart]);
      if (mapping.planEnd >= 0) opts.planEnd = normalizeDate(row[mapping.planEnd]);
      if (mapping.actualStart >= 0) opts.actualStart = normalizeDate(row[mapping.actualStart]);
      if (mapping.actualEnd >= 0) opts.actualEnd = normalizeDate(row[mapping.actualEnd]);
      if (mapping.estimatedHours >= 0) opts.estimatedHours = parseFloat(row[mapping.estimatedHours]) || 0;
      if (mapping.assignee >= 0) opts.assignee = (row[mapping.assignee] || '').trim();
      if (mapping.processType >= 0) opts.processType = (row[mapping.processType] || '').trim();
      if (mapping.note >= 0) opts.note = (row[mapping.note] || '').trim();

      if (mapping.status >= 0) {
        var sv = (row[mapping.status] || '').trim();
        opts.status = STATUS_MAP[sv] || 'not_started';
      }

      // content系フィールド
      var content = {};
      if (mapping['content.articleTitle'] >= 0) content.articleTitle = (row[mapping['content.articleTitle']] || '').trim();
      if (mapping['content.charCount'] >= 0) content.charCount = parseInt(row[mapping['content.charCount']]) || 0;
      if (mapping['content.sourceType'] >= 0) content.sourceType = (row[mapping['content.sourceType']] || '').trim();
      if (mapping['content.clientRequest'] >= 0) content.clientRequest = (row[mapping['content.clientRequest']] || '').trim();
      if (Object.keys(content).length > 0) opts.content = content;

      var task = Data.createTask(opts);
      targetTasks.push(task);
      count++;
    });

    App.setState({ projects: projects });
    App.closeModal();
    var importTarget = targetKikaku ? targetKikaku.name : targetProj.name;
    App.showToast(count + '件のタスクを「' + importTarget + '」にインポートしました');

    // 内部状態クリア
    csvData = null;
    csvHeaders = [];
  }

  // ===== CSVエクスポート =====

  function showExport() {
    var state = App.getState();
    var proj = App.getActiveProject();
    if (!proj) {
      App.showToast('エクスポートするプロジェクトがありません');
      return;
    }

    // v3: Kikaku階層対応 — アクティブ企画のタスクを優先、なければ全企画横断
    var tasks = [];
    var exportLabel = proj.name;
    var kikaku = App.getActiveKikaku ? App.getActiveKikaku() : null;
    if (kikaku && kikaku.tasks && kikaku.tasks.length) {
      tasks = kikaku.tasks;
      exportLabel = proj.name + '_' + kikaku.name;
    } else if (Data.getAllTasks) {
      // Data.getAllTasks(proj) で全企画のタスクを横断取得
      var allItems = Data.getAllTasks(proj);
      tasks = allItems.map(function(item) { return item.task || item; });
    } else if (proj.tasks) {
      // フォールバック: 旧2階層互換
      tasks = proj.tasks;
    }

    if (!tasks.length) {
      App.showToast('エクスポートするタスクがありません');
      return;
    }

    // エクスポート列定義
    var headers = [
      'タスク名', '予定開始日', '予定終了日', '実績開始日', '実績終了日',
      'ステータス', '予定工数(h)', '担当者', 'プロセス種別',
      '記事名', '文字量', 'ソース元', 'クライアント要望', '備考'
    ];

    var lines = [headers.join(',')];

    tasks.forEach(function(t) {
      var statusLabel = (Data.STATUS_LABELS && Data.STATUS_LABELS[t.status]) || t.status || '';
      var content = t.content || {};
      var row = [
        csvEscape(t.name),
        csvEscape(t.planStart),
        csvEscape(t.planEnd),
        csvEscape(t.actualStart),
        csvEscape(t.actualEnd),
        csvEscape(statusLabel),
        csvEscape(t.estimatedHours || 0),
        csvEscape(t.assignee),
        csvEscape(t.processType),
        csvEscape(content.articleTitle),
        csvEscape(content.charCount || ''),
        csvEscape(content.sourceType),
        csvEscape(content.clientRequest),
        csvEscape(t.note)
      ];
      lines.push(row.join(','));
    });

    // BOM付きUTF-8で出力
    var bom = '\ufeff';
    var blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (exportLabel || 'tasks') + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);

    App.showToast('CSVエクスポート完了: ' + tasks.length + '件');
  }

  // ===== JSONバックアップ/復元 (NFR-07) =====

  function showBackup() {
    var escH = App.escH;
    var html = '<div class="modal-content" style="max-width:480px">';
    html += '<div class="modal-header"><h2>データバックアップ / 復元</h2>';
    html += '<button class="modal-close" onclick="App.closeModal()">✕</button></div>';
    html += '<div class="modal-body">';

    // エクスポート
    html += '<div class="backup-section">';
    html += '<h3 class="backup-section-title">JSONエクスポート</h3>';
    html += '<p style="font-size:.8rem;color:var(--text-muted)">全プロジェクト・担当者・設定を含むバックアップファイルを保存します</p>';
    html += '<button class="btn btn-primary" onclick="CsvHelper._exportJSON()" style="margin-top:.4rem">バックアップを保存</button>';
    html += '</div>';

    // インポート
    html += '<div class="backup-section" style="margin-top:1.2rem;padding-top:1rem;border-top:1px solid var(--border-color)">';
    html += '<h3 class="backup-section-title">JSONインポート（復元）</h3>';
    html += '<p style="font-size:.8rem;color:var(--text-muted)">バックアップファイルから復元します。現在のデータは上書きされます。</p>';
    html += '<div class="csv-drop-zone" id="jsonDropZone" style="margin-top:.4rem">';
    html += 'ここにJSONファイルをドロップ<br>またはクリックして選択';
    html += '<input type="file" id="jsonFileInput" accept=".json" style="display:none">';
    html += '</div></div>';

    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button class="btn btn-cancel" onclick="App.closeModal()">閉じる</button>';
    html += '</div></div>';

    App.showModal(html);

    setTimeout(function() {
      var dropZone = document.getElementById('jsonDropZone');
      var fileInput = document.getElementById('jsonFileInput');
      if (!dropZone || !fileInput) return;

      dropZone.addEventListener('click', function() { fileInput.click(); });
      dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', function() {
        dropZone.classList.remove('drag-over');
      });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleJSONFile(e.dataTransfer.files[0]);
      });
      fileInput.addEventListener('change', function() {
        if (fileInput.files.length) handleJSONFile(fileInput.files[0]);
      });
    }, 50);
  }

  function exportJSON() {
    var state = App.getState();
    var json = Data.exportJSON(state);
    var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);

    var now = new Date();
    var ts = now.getFullYear() +
      ('0' + (now.getMonth() + 1)).slice(-2) +
      ('0' + now.getDate()).slice(-2) + '_' +
      ('0' + now.getHours()).slice(-2) +
      ('0' + now.getMinutes()).slice(-2);
    a.download = 'backup_' + ts + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    App.showToast('バックアップを保存しました');
  }

  function handleJSONFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      var restored = Data.importJSON(text);
      if (!restored) {
        App.showToast('JSONの解析に失敗しました');
        return;
      }

      // 復元確認
      var projCount = (restored.projects || []).length;
      var memberCount = (restored.members || []).length;

      var confirmHtml = '<div class="modal-content" style="max-width:380px">';
      confirmHtml += '<div class="modal-header"><h2>復元確認</h2>';
      confirmHtml += '<button class="modal-close" onclick="App.closeModal()">✕</button></div>';
      confirmHtml += '<div class="modal-body">';
      confirmHtml += '<p>以下のデータを復元します:</p>';
      confirmHtml += '<ul style="margin:.5rem 0;padding-left:1.2rem;font-size:.85rem">';
      confirmHtml += '<li>プロジェクト: ' + projCount + '件</li>';
      confirmHtml += '<li>担当者: ' + memberCount + '名</li>';
      confirmHtml += '</ul>';
      confirmHtml += '<p style="color:var(--accent-red);font-size:.8rem">※ 現在のデータは全て上書きされます</p>';
      confirmHtml += '</div>';
      confirmHtml += '<div class="modal-footer">';
      confirmHtml += '<button class="btn btn-danger" id="jsonRestoreBtn">復元する</button>';
      confirmHtml += '<button class="btn btn-cancel" onclick="App.closeModal()">キャンセル</button>';
      confirmHtml += '</div></div>';

      App.showModal(confirmHtml);

      setTimeout(function() {
        var btn = document.getElementById('jsonRestoreBtn');
        if (btn) {
          btn.addEventListener('click', function() {
            App.setState(restored);
            App.closeModal();
            App.showToast('データを復元しました（' + projCount + 'プロジェクト, ' + memberCount + '名）');
          });
        }
      }, 50);
    };
    reader.readAsText(file, 'utf-8');
  }

  // ===== 公開API =====
  window.CsvHelper = {
    showImport: showImport,
    showExport: showExport,
    showBackup: showBackup,
    // 内部用（onclick呼び出し）
    _executeImport: executeImport,
    _exportJSON: exportJSON
  };

})();
