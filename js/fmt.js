/**
 * fmt.js — FMTテンプレート管理 + スケジュール自動展開 + 台割ビュー + フォルダDB
 * cmd_023 Phase3 修復実装（bushi10: イシコリドメ）
 *
 * 登録ビュー:
 *   App.registerView('fmt', { init, render })           — 台割ビュー（企画画面タブ）
 *   App.registerView('fmt_settings', { init, render })  — FMT設定画面（3タブ構成）
 *   App.registerView('folder_db', { init, render })     — フォルダDB画面
 *
 * 使用API:
 *   App: getState / setState / getActiveProject / getActiveKikaku
 *        showModal / closeModal / escH / showToast / addTask / navigate
 *        parseD / fmtD / fmtISO / addDays / renderActiveView / renderAll
 *   Data: PRESET_FMTS / DEFAULT_FOLDER_CONFIG / RANK_LIST / createTask / uid / save
 */
(function() {
  'use strict';

  // ========================================================
  // 1. ランク別スケジュールテンプレート定義
  // ========================================================

  var PROCESS_TYPES = [
    { id: 'nyuko',   name: '入稿物（資料ベース）' },
    { id: 'shuzai',  name: '取材物（取材ベース）' },
    { id: 'kiko',    name: '寄稿（原稿支給）' }
  ];

  // ランク×プロセスタイプ別のデフォルト日数定義（12パターン）
  var DEFAULT_RANK_TEMPLATES = [
    // ランクA（大型案件）
    { rank: 'A', processType: 'nyuko', steps: [
      { name: '企画案提出', defaultDays: 5, isGate: false },
      { name: '情報収集', defaultDays: 5, isGate: false },
      { name: '構成案提出', defaultDays: 5, isGate: true },
      { name: '執筆・制作', defaultDays: 10, isGate: false },
      { name: '初校提出', defaultDays: 3, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 5, isGate: false },
      { name: 'デスクチェック', defaultDays: 3, isGate: true },
      { name: '再校提出', defaultDays: 3, isGate: false },
      { name: '校閲実施', defaultDays: 3, isGate: true },
      { name: '色校提出', defaultDays: 2, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 2, isGate: false }
    ]},
    { rank: 'A', processType: 'shuzai', steps: [
      { name: '企画案提出', defaultDays: 5, isGate: false },
      { name: '取材設計', defaultDays: 5, isGate: false },
      { name: '取材実施', defaultDays: 5, isGate: false },
      { name: '構成案提出', defaultDays: 5, isGate: true },
      { name: '執筆・制作', defaultDays: 10, isGate: false },
      { name: '初校提出', defaultDays: 3, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 5, isGate: false },
      { name: 'デスクチェック', defaultDays: 3, isGate: true },
      { name: '再校提出', defaultDays: 3, isGate: false },
      { name: '校閲実施', defaultDays: 3, isGate: true },
      { name: '色校提出', defaultDays: 2, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 2, isGate: false }
    ]},
    { rank: 'A', processType: 'kiko', steps: [
      { name: '寄稿依頼', defaultDays: 3, isGate: false },
      { name: '原稿受領', defaultDays: 10, isGate: false },
      { name: '編集・リライト', defaultDays: 5, isGate: false },
      { name: '確認戻し', defaultDays: 5, isGate: true },
      { name: '初校提出', defaultDays: 3, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 5, isGate: false },
      { name: 'デスクチェック', defaultDays: 3, isGate: true },
      { name: '再校提出', defaultDays: 3, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 2, isGate: false }
    ]},

    // ランクB（中型案件）
    { rank: 'B', processType: 'nyuko', steps: [
      { name: '企画案提出', defaultDays: 3, isGate: false },
      { name: '情報収集', defaultDays: 3, isGate: false },
      { name: '構成案提出', defaultDays: 3, isGate: true },
      { name: '執筆・制作', defaultDays: 7, isGate: false },
      { name: '初校提出', defaultDays: 2, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 3, isGate: false },
      { name: 'デスクチェック', defaultDays: 2, isGate: true },
      { name: '再校提出', defaultDays: 2, isGate: false },
      { name: '校閲実施', defaultDays: 2, isGate: true },
      { name: '色校提出', defaultDays: 1, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 1, isGate: false }
    ]},
    { rank: 'B', processType: 'shuzai', steps: [
      { name: '企画案提出', defaultDays: 3, isGate: false },
      { name: '取材設計', defaultDays: 3, isGate: false },
      { name: '取材実施', defaultDays: 3, isGate: false },
      { name: '構成案提出', defaultDays: 3, isGate: true },
      { name: '執筆・制作', defaultDays: 7, isGate: false },
      { name: '初校提出', defaultDays: 2, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 3, isGate: false },
      { name: 'デスクチェック', defaultDays: 2, isGate: true },
      { name: '再校提出', defaultDays: 2, isGate: false },
      { name: '校閲実施', defaultDays: 2, isGate: true },
      { name: '色校提出', defaultDays: 1, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 1, isGate: false }
    ]},
    { rank: 'B', processType: 'kiko', steps: [
      { name: '寄稿依頼', defaultDays: 2, isGate: false },
      { name: '原稿受領', defaultDays: 7, isGate: false },
      { name: '編集・リライト', defaultDays: 3, isGate: false },
      { name: '確認戻し', defaultDays: 3, isGate: true },
      { name: '初校提出', defaultDays: 2, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 3, isGate: false },
      { name: 'デスクチェック', defaultDays: 2, isGate: true },
      { name: '再校提出', defaultDays: 2, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 1, isGate: false }
    ]},

    // ランクC（小型案件）
    { rank: 'C', processType: 'nyuko', steps: [
      { name: '企画案提出', defaultDays: 2, isGate: false },
      { name: '情報収集', defaultDays: 2, isGate: false },
      { name: '構成案提出', defaultDays: 2, isGate: true },
      { name: '執筆・制作', defaultDays: 5, isGate: false },
      { name: '初校提出', defaultDays: 2, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 3, isGate: false },
      { name: '再校提出', defaultDays: 2, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 1, isGate: false }
    ]},
    { rank: 'C', processType: 'shuzai', steps: [
      { name: '企画案提出', defaultDays: 2, isGate: false },
      { name: '取材設計', defaultDays: 2, isGate: false },
      { name: '取材実施', defaultDays: 3, isGate: false },
      { name: '執筆・制作', defaultDays: 5, isGate: false },
      { name: '初校提出', defaultDays: 2, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 3, isGate: false },
      { name: '再校提出', defaultDays: 2, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 1, isGate: false }
    ]},
    { rank: 'C', processType: 'kiko', steps: [
      { name: '寄稿依頼', defaultDays: 2, isGate: false },
      { name: '原稿受領', defaultDays: 5, isGate: false },
      { name: '編集・リライト', defaultDays: 3, isGate: false },
      { name: '確認戻し', defaultDays: 3, isGate: true },
      { name: '初校提出', defaultDays: 2, isGate: true },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 1, isGate: false }
    ]},

    // ランクD（ミニマム案件）
    { rank: 'D', processType: 'nyuko', steps: [
      { name: '情報収集', defaultDays: 2, isGate: false },
      { name: '執筆・制作', defaultDays: 3, isGate: false },
      { name: '初校提出', defaultDays: 1, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 2, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 1, isGate: false }
    ]},
    { rank: 'D', processType: 'shuzai', steps: [
      { name: '取材実施', defaultDays: 2, isGate: false },
      { name: '執筆・制作', defaultDays: 3, isGate: false },
      { name: '初校提出', defaultDays: 1, isGate: true },
      { name: '初校確認（クライアント）', defaultDays: 2, isGate: false },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 1, isGate: false }
    ]},
    { rank: 'D', processType: 'kiko', steps: [
      { name: '原稿受領', defaultDays: 3, isGate: false },
      { name: '編集・リライト', defaultDays: 2, isGate: false },
      { name: '初校提出', defaultDays: 1, isGate: true },
      { name: '校了', defaultDays: 1, isGate: true },
      { name: '印刷入稿', defaultDays: 1, isGate: false }
    ]}
  ];

  // ========================================================
  // 2. ユーティリティ関数
  // ========================================================

  /** 土日をスキップして営業日を加算する */
  function addBusinessDays(startDate, days) {
    var d = new Date(startDate);
    var added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      var dow = d.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return d;
  }

  /** stateにrankTemplatesがなければデフォルトを設定 */
  function ensureRankTemplates() {
    var st = App.getState();
    if (!st.rankTemplates || !st.rankTemplates.length) {
      st.rankTemplates = JSON.parse(JSON.stringify(DEFAULT_RANK_TEMPLATES));
      Data.save(st);
    }
  }

  /** ランク+プロセスタイプからテンプレートを検索 */
  function findRankTemplate(rank, processType) {
    var st = App.getState();
    var templates = st.rankTemplates || DEFAULT_RANK_TEMPLATES;
    return templates.find(function(t) {
      return t.rank === rank && t.processType === processType;
    }) || null;
  }

  /** プロセスタイプのラベルを取得 */
  function processTypeLabel(id) {
    var pt = PROCESS_TYPES.find(function(p) { return p.id === id; });
    return pt ? pt.name : id;
  }

  // ========================================================
  // 3. スケジュール自動展開エンジン
  // ========================================================

  /**
   * ランク+プロセスタイプ+開始日から各工程の日程を自動算出
   * @param {string} rank - A/B/C/D
   * @param {string} processType - nyuko/shuzai/kiko
   * @param {Date} startDate - 開始日
   * @returns {Array} 展開された工程配列 [{name, planStart, planEnd, isGate, estimatedHours}]
   */
  function expandSchedule(rank, processType, startDate) {
    var tmpl = findRankTemplate(rank, processType);
    if (!tmpl) return [];

    var results = [];
    var cursor = new Date(startDate);
    // 開始日が土日なら次の営業日にずらす
    while (cursor.getDay() === 0 || cursor.getDay() === 6) {
      cursor.setDate(cursor.getDate() + 1);
    }

    tmpl.steps.forEach(function(step) {
      var stepStart = new Date(cursor);
      var stepEnd = addBusinessDays(stepStart, step.defaultDays - 1);
      results.push({
        name: step.name,
        planStart: App.fmtISO(stepStart),
        planEnd: App.fmtISO(stepEnd),
        isGate: step.isGate,
        estimatedHours: step.defaultDays * 8,
        processType: processType
      });
      // 次工程の開始日 = 今工程の終了日の翌営業日
      cursor = addBusinessDays(stepEnd, 1);
    });

    return results;
  }

  // ========================================================
  // 4. 台割ビュー（企画画面の「台割」タブ）
  // ========================================================

  App.registerView('fmt', {
    init: function() {},
    render: function(container) {
      var kikaku = App.getActiveKikaku();
      if (!kikaku) {
        container.innerHTML = '<div class="placeholder" style="padding:2rem;color:var(--text-muted)">企画を選択してください</div>';
        return;
      }

      if (!kikaku.daiwari) kikaku.daiwari = [];
      var pages = kikaku.daiwari;

      var html = '<div style="padding:1rem">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">';
      html += '<h3 style="margin:0;color:var(--text-main)">台割 — ' + App.escH(kikaku.name) + '</h3>';
      html += '<div>';
      html += '<button class="toolbar-btn" onclick="FMT._addDaiwariPage()" style="margin-right:.5rem">＋ ページ追加</button>';
      html += '<button class="toolbar-btn" onclick="FMT._generateTasksFromDaiwari()">台割→タスク生成</button>';
      html += '</div></div>';

      if (!pages.length) {
        html += '<div style="padding:2rem;text-align:center;color:var(--text-muted)">台割データがありません。「＋ ページ追加」で作成してください。</div>';
      } else {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem">';
        pages.forEach(function(p, idx) {
          var statusColor = p.status === '完了' ? 'var(--success)' :
                            p.status === '進行中' ? 'var(--accent-light)' :
                            'var(--text-dim)';
          html += '<div class="project-card" style="cursor:default;position:relative">';
          html += '<div style="display:flex;justify-content:space-between;align-items:center">';
          html += '<span style="font-weight:bold;color:var(--accent-light)">' + App.escH(p.pageNumber || 'p?') + '</span>';
          html += '<span style="font-size:.7rem;color:' + statusColor + '">' + App.escH(p.status || '未着手') + '</span>';
          html += '</div>';
          html += '<div style="margin:.5rem 0;font-size:.9rem;color:var(--text-main)">' + App.escH(p.articleTitle || '（無題）') + '</div>';
          html += '<div style="font-size:.75rem;color:var(--text-muted)">';
          html += '制作方法: ' + App.escH(p.productionMethod || '未定') + '<br>';
          html += '開き: ' + (p.direction === 'right' ? '右開き' : '左開き');
          html += '</div>';
          if (p.assignees) {
            var assigneeText = [];
            if (p.assignees.director) assigneeText.push('Dir:' + p.assignees.director);
            if (p.assignees.writer) assigneeText.push('Wr:' + p.assignees.writer);
            if (p.assignees.editor) assigneeText.push('Ed:' + p.assignees.editor);
            if (p.assignees.designer) assigneeText.push('Ds:' + p.assignees.designer);
            if (assigneeText.length) {
              html += '<div style="font-size:.7rem;color:var(--text-dim);margin-top:.3rem">' + App.escH(assigneeText.join(' / ')) + '</div>';
            }
          }
          html += '<div style="display:flex;gap:.3rem;margin-top:.5rem;justify-content:flex-end">';
          html += '<button class="toolbar-btn" style="font-size:.7rem;padding:.15rem .4rem" onclick="FMT._editDaiwariPage(' + idx + ')">編集</button>';
          html += '<button class="toolbar-btn" style="font-size:.7rem;padding:.15rem .4rem;color:var(--danger)" onclick="FMT._deleteDaiwariPage(' + idx + ')">削除</button>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
    }
  });

  // --- 台割CRUD ---

  function _addDaiwariPage() {
    var kikaku = App.getActiveKikaku();
    if (!kikaku) { App.showToast('企画を選択してください', 'error'); return; }
    _showDaiwariModal(-1, {
      pageNumber: '', articleTitle: '', productionMethod: '',
      assignees: { director: '', writer: '', editor: '', designer: '' },
      direction: 'left', status: '未着手'
    });
  }

  function _editDaiwariPage(idx) {
    var kikaku = App.getActiveKikaku();
    if (!kikaku || !kikaku.daiwari || !kikaku.daiwari[idx]) return;
    _showDaiwariModal(idx, JSON.parse(JSON.stringify(kikaku.daiwari[idx])));
  }

  function _deleteDaiwariPage(idx) {
    var kikaku = App.getActiveKikaku();
    if (!kikaku || !kikaku.daiwari) return;
    if (!confirm('ページ「' + (kikaku.daiwari[idx].pageNumber || idx + 1) + '」を削除しますか？')) return;
    kikaku.daiwari.splice(idx, 1);
    Data.save(App.getState());
    App.renderActiveView();
    App.showToast('ページを削除しました', 'info');
  }

  function _showDaiwariModal(idx, page) {
    var isNew = idx < 0;
    var title = isNew ? '台割ページ追加' : '台割ページ編集';
    var methods = ['JBA提案', '取材から', '資料から', '寄稿原稿から'];
    var statuses = ['未着手', '進行中', '完了'];
    var assignees = page.assignees || {};

    var html = '<div class="modal-header"><h2>' + title + '</h2><button onclick="App.closeModal()">\u2715</button></div>';
    html += '<div class="modal-body">';
    html += '<div class="np-field"><label>ページ番号</label><input type="text" id="dwPage" value="' + App.escH(page.pageNumber || '') + '" placeholder="例: p2-3"></div>';
    html += '<div class="np-field"><label>記事タイトル</label><input type="text" id="dwTitle" value="' + App.escH(page.articleTitle || '') + '" placeholder="例: 社長メッセージ"></div>';
    html += '<div class="np-field"><label>制作方法</label><select id="dwMethod">';
    html += '<option value="">選択してください</option>';
    methods.forEach(function(m) {
      html += '<option value="' + m + '"' + (page.productionMethod === m ? ' selected' : '') + '>' + m + '</option>';
    });
    html += '</select></div>';
    html += '<div class="np-field"><label>開き方向</label><select id="dwDir">';
    html += '<option value="left"' + (page.direction === 'left' ? ' selected' : '') + '>左開き</option>';
    html += '<option value="right"' + (page.direction === 'right' ? ' selected' : '') + '>右開き</option>';
    html += '</select></div>';
    html += '<div class="np-field"><label>ステータス</label><select id="dwStatus">';
    statuses.forEach(function(s) {
      html += '<option value="' + s + '"' + (page.status === s ? ' selected' : '') + '>' + s + '</option>';
    });
    html += '</select></div>';
    html += '<div style="margin-top:.5rem;font-size:.85rem;color:var(--text-muted)">担当者</div>';
    html += '<div class="np-field"><label>ディレクター</label><input type="text" id="dwAssDir" value="' + App.escH(assignees.director || '') + '"></div>';
    html += '<div class="np-field"><label>ライター</label><input type="text" id="dwAssWr" value="' + App.escH(assignees.writer || '') + '"></div>';
    html += '<div class="np-field"><label>編集</label><input type="text" id="dwAssEd" value="' + App.escH(assignees.editor || '') + '"></div>';
    html += '<div class="np-field"><label>デザイナー</label><input type="text" id="dwAssDs" value="' + App.escH(assignees.designer || '') + '"></div>';
    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button class="btn-secondary" onclick="App.closeModal()">キャンセル</button>';
    html += '<button class="btn-primary" onclick="FMT._saveDaiwariPage(' + idx + ')">' + (isNew ? '追加' : '保存') + '</button>';
    html += '</div>';
    App.showModal(html);
  }

  function _saveDaiwariPage(idx) {
    var kikaku = App.getActiveKikaku();
    if (!kikaku) return;
    if (!kikaku.daiwari) kikaku.daiwari = [];

    var entry = {
      pageNumber: (document.getElementById('dwPage').value || '').trim(),
      articleTitle: (document.getElementById('dwTitle').value || '').trim(),
      productionMethod: document.getElementById('dwMethod').value,
      direction: document.getElementById('dwDir').value,
      status: document.getElementById('dwStatus').value,
      assignees: {
        director: (document.getElementById('dwAssDir').value || '').trim(),
        writer: (document.getElementById('dwAssWr').value || '').trim(),
        editor: (document.getElementById('dwAssEd').value || '').trim(),
        designer: (document.getElementById('dwAssDs').value || '').trim()
      }
    };

    if (!entry.pageNumber) {
      App.showToast('ページ番号を入力してください', 'error');
      return;
    }

    if (idx < 0) {
      kikaku.daiwari.push(entry);
    } else {
      kikaku.daiwari[idx] = entry;
    }

    Data.save(App.getState());
    App.closeModal();
    App.renderActiveView();
    App.showToast(idx < 0 ? 'ページを追加しました' : 'ページを更新しました', 'success');
  }

  /** 台割からタスクを自動生成 */
  function _generateTasksFromDaiwari() {
    var kikaku = App.getActiveKikaku();
    if (!kikaku || !kikaku.daiwari || !kikaku.daiwari.length) {
      App.showToast('台割データがありません', 'error');
      return;
    }

    var rank = kikaku.rank || '';
    if (!rank) {
      App.showToast('企画にランクが設定されていません。タスク名のみで生成します', 'info');
    }

    var count = 0;
    kikaku.daiwari.forEach(function(page) {
      var processType = 'nyuko';
      if (page.productionMethod === '取材から') processType = 'shuzai';
      else if (page.productionMethod === '寄稿原稿から') processType = 'kiko';

      if (rank) {
        var tmpl = findRankTemplate(rank, processType);
        if (tmpl) {
          tmpl.steps.forEach(function(step) {
            var t = Data.createTask({
              name: page.pageNumber + ' ' + step.name,
              processType: processType,
              isGate: step.isGate,
              estimatedHours: step.defaultDays * 8
            });
            kikaku.tasks.push(t);
            count++;
          });
          return;
        }
      }
      // ランクテンプレートがない場合は1タスクだけ生成
      var t = Data.createTask({
        name: (page.pageNumber || '') + ' ' + (page.articleTitle || '記事'),
        processType: processType
      });
      kikaku.tasks.push(t);
      count++;
    });

    Data.save(App.getState());
    App.renderActiveView();
    App.showToast(count + '件のタスクを生成しました', 'success');
  }

  // ========================================================
  // 5. FMT設定ビュー（3タブ構成）
  // ========================================================

  var fmtSettingsTab = 'fmtTemplates';

  App.registerView('fmt_settings', {
    init: function() { ensureRankTemplates(); },
    render: function(container) {
      var html = '<div class="settings-view" style="padding:1.5rem">';

      // タブヘッダー
      html += '<div style="display:flex;gap:.5rem;margin-bottom:1.5rem;border-bottom:1px solid var(--border)">';
      var tabs = [
        { id: 'fmtTemplates', label: 'FMTテンプレート' },
        { id: 'rankDefs', label: 'ランク別定義' },
        { id: 'schedExpand', label: 'スケジュール展開' }
      ];
      tabs.forEach(function(tab) {
        var active = fmtSettingsTab === tab.id;
        html += '<button class="tab-btn' + (active ? ' active' : '') + '" ' +
          'onclick="FMT._switchSettingsTab(\'' + tab.id + '\')" ' +
          'style="border-bottom:' + (active ? '2px solid var(--accent)' : 'none') + ';border-radius:0">' +
          tab.label + '</button>';
      });
      html += '</div>';

      // タブコンテンツ
      if (fmtSettingsTab === 'fmtTemplates') {
        html += renderFmtTemplatesTab();
      } else if (fmtSettingsTab === 'rankDefs') {
        html += renderRankDefsTab();
      } else if (fmtSettingsTab === 'schedExpand') {
        html += renderSchedExpandTab();
      }

      html += '</div>';
      container.innerHTML = html;
    }
  });

  function _switchSettingsTab(tabId) {
    fmtSettingsTab = tabId;
    App.navigate('fmt_settings');
  }

  // --- タブ1: FMTテンプレート管理 ---
  function renderFmtTemplatesTab() {
    var st = App.getState();
    var fmts = st.fmts || [];

    var html = '<div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">';
    html += '<h3 style="margin:0;color:var(--text-main)">FMTテンプレート一覧</h3>';
    html += '<div>';
    html += '<button class="toolbar-btn" onclick="FMT._resetFmts()" style="margin-right:.5rem">プリセットに戻す</button>';
    html += '<button class="toolbar-btn" onclick="FMT._addFmt()">＋ 新規テンプレート</button>';
    html += '</div></div>';

    fmts.forEach(function(fmt, fi) {
      html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1rem">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">';
      html += '<span style="font-weight:bold;color:var(--text-main)">' + App.escH(fmt.name) + '</span>';
      html += '<div>';
      if (fmt.builtin) {
        html += '<span style="font-size:.7rem;padding:.1rem .4rem;border-radius:4px;background:var(--accent-dim);color:var(--accent-light);margin-right:.5rem">プリセット</span>';
      }
      html += '<button class="toolbar-btn" style="font-size:.75rem;padding:.15rem .4rem;margin-right:.3rem" onclick="FMT._editFmt(' + fi + ')">編集</button>';
      html += '<button class="toolbar-btn" style="font-size:.75rem;padding:.15rem .4rem;color:var(--danger)" onclick="FMT._deleteFmt(' + fi + ')">削除</button>';
      html += '</div></div>';

      // 工程一覧
      html += '<div style="display:flex;flex-wrap:wrap;gap:.3rem">';
      (fmt.actions || []).forEach(function(a) {
        html += '<span style="font-size:.7rem;padding:.15rem .4rem;background:var(--bg-hover);border-radius:4px;color:var(--text-muted)">' +
          a.order + '. ' + App.escH(a.name) + ' (' + a.defaultHours + 'h)</span>';
      });
      html += '</div></div>';
    });

    html += '</div>';
    return html;
  }

  // --- FMT CRUD ---

  function _addFmt() {
    _showFmtModal(-1, { name: '', builtin: false, actions: [] });
  }

  function _editFmt(idx) {
    var st = App.getState();
    if (!st.fmts || !st.fmts[idx]) return;
    _showFmtModal(idx, JSON.parse(JSON.stringify(st.fmts[idx])));
  }

  function _deleteFmt(idx) {
    var st = App.getState();
    if (!st.fmts || !st.fmts[idx]) return;
    if (!confirm('FMT「' + st.fmts[idx].name + '」を削除しますか？')) return;
    st.fmts.splice(idx, 1);
    Data.save(st);
    App.navigate('fmt_settings');
    App.showToast('FMTを削除しました', 'info');
  }

  function _resetFmts() {
    if (!confirm('全FMTをプリセットに戻しますか？カスタムFMTは失われます。')) return;
    var st = App.getState();
    st.fmts = JSON.parse(JSON.stringify(Data.PRESET_FMTS));
    Data.save(st);
    App.navigate('fmt_settings');
    App.showToast('プリセットに復元しました', 'success');
  }

  function _showFmtModal(idx, fmt) {
    var isNew = idx < 0;
    var title = isNew ? '新規FMTテンプレート' : 'FMT編集: ' + App.escH(fmt.name);

    var html = '<div class="modal-header"><h2>' + title + '</h2><button onclick="App.closeModal()">\u2715</button></div>';
    html += '<div class="modal-body" style="max-height:60vh;overflow-y:auto">';
    html += '<div class="np-field"><label>テンプレート名</label><input type="text" id="fmtName" value="' + App.escH(fmt.name || '') + '"></div>';
    html += '<div style="margin:.5rem 0;font-size:.85rem;color:var(--text-muted)">工程一覧</div>';
    html += '<div id="fmtActions">';
    (fmt.actions || []).forEach(function(a, ai) {
      html += renderFmtActionRow(ai, a);
    });
    html += '</div>';
    html += '<button class="toolbar-btn" onclick="FMT._addFmtAction()" style="margin-top:.5rem">＋ 工程追加</button>';
    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button class="btn-secondary" onclick="App.closeModal()">キャンセル</button>';
    html += '<button class="btn-primary" onclick="FMT._saveFmt(' + idx + ')">' + (isNew ? '作成' : '保存') + '</button>';
    html += '</div>';
    App.showModal(html);
  }

  function renderFmtActionRow(idx, action) {
    return '<div class="fmt-action-row" style="display:flex;gap:.3rem;align-items:center;margin-bottom:.3rem" data-idx="' + idx + '">' +
      '<input type="text" class="fmtActName" value="' + App.escH(action.name || '') + '" placeholder="工程名" style="flex:1">' +
      '<input type="number" class="fmtActHours" value="' + (action.defaultHours || 8) + '" min="1" style="width:60px" title="標準工数(h)">' +
      '<button class="toolbar-btn" style="font-size:.7rem;padding:.1rem .3rem;color:var(--danger)" onclick="this.parentElement.remove()">×</button>' +
      '</div>';
  }

  function _addFmtAction() {
    var container = document.getElementById('fmtActions');
    if (!container) return;
    var idx = container.children.length;
    var div = document.createElement('div');
    div.innerHTML = renderFmtActionRow(idx, { name: '', defaultHours: 8 });
    container.appendChild(div.firstChild);
  }

  function _saveFmt(idx) {
    var name = (document.getElementById('fmtName').value || '').trim();
    if (!name) { App.showToast('テンプレート名を入力してください', 'error'); return; }

    var actions = [];
    var rows = document.querySelectorAll('.fmt-action-row');
    rows.forEach(function(row, ri) {
      var nameInput = row.querySelector('.fmtActName');
      var hoursInput = row.querySelector('.fmtActHours');
      if (nameInput && nameInput.value.trim()) {
        actions.push({
          name: nameInput.value.trim(),
          order: ri + 1,
          defaultHours: parseInt(hoursInput.value) || 8
        });
      }
    });

    var st = App.getState();
    if (idx < 0) {
      st.fmts.push({
        id: 'fmt_custom_' + Data.uid(),
        name: name,
        builtin: false,
        actions: actions
      });
    } else {
      st.fmts[idx].name = name;
      st.fmts[idx].actions = actions;
    }

    Data.save(st);
    App.closeModal();
    App.navigate('fmt_settings');
    App.showToast(idx < 0 ? 'FMTを作成しました' : 'FMTを更新しました', 'success');
  }

  // --- タブ2: ランク別定義 ---
  function renderRankDefsTab() {
    ensureRankTemplates();
    var st = App.getState();
    var templates = st.rankTemplates || [];

    var html = '<div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">';
    html += '<h3 style="margin:0;color:var(--text-main)">ランク×プロセスタイプ 標準日数定義</h3>';
    html += '<button class="toolbar-btn" onclick="FMT._resetRankTemplates()">デフォルトに戻す</button>';
    html += '</div>';
    html += '<p style="font-size:.8rem;color:var(--text-muted);margin-bottom:1rem">各ランク（A-D）×プロセスタイプ（入稿物/取材物/寄稿）ごとの工程と標準日数を定義します。スケジュール自動展開で使用されます。</p>';

    Data.RANK_LIST.forEach(function(rank) {
      html += '<div style="margin-bottom:1.5rem">';
      html += '<h4 style="color:var(--accent-light);margin-bottom:.5rem">ランク ' + rank + '</h4>';
      PROCESS_TYPES.forEach(function(pt) {
        var tmpl = templates.find(function(t) { return t.rank === rank && t.processType === pt.id; });
        if (!tmpl) return;
        html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:.75rem;margin-bottom:.5rem">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">';
        html += '<span style="font-size:.85rem;font-weight:bold;color:var(--text-main)">' + App.escH(pt.name) + '</span>';
        var totalDays = 0;
        tmpl.steps.forEach(function(s) { totalDays += s.defaultDays; });
        html += '<span style="font-size:.75rem;color:var(--text-muted)">合計 ' + totalDays + ' 営業日</span>';
        html += '</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:.25rem">';
        tmpl.steps.forEach(function(s) {
          var gateIcon = s.isGate ? '\u{1F6A7}' : '';
          html += '<span style="font-size:.65rem;padding:.1rem .35rem;background:var(--bg-hover);border-radius:3px;color:var(--text-muted)">' +
            gateIcon + App.escH(s.name) + '(' + s.defaultDays + '日)</span>';
        });
        html += '</div>';
        html += '<div style="margin-top:.3rem">';
        html += '<button class="toolbar-btn" style="font-size:.7rem;padding:.1rem .3rem" onclick="FMT._editRankTemplate(\'' + rank + '\',\'' + pt.id + '\')">編集</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  function _resetRankTemplates() {
    if (!confirm('ランク定義をデフォルトに戻しますか？')) return;
    var st = App.getState();
    st.rankTemplates = JSON.parse(JSON.stringify(DEFAULT_RANK_TEMPLATES));
    Data.save(st);
    App.navigate('fmt_settings');
    App.showToast('ランク定義をリセットしました', 'success');
  }

  function _editRankTemplate(rank, processType) {
    var st = App.getState();
    var tmpl = (st.rankTemplates || []).find(function(t) { return t.rank === rank && t.processType === processType; });
    if (!tmpl) return;

    var html = '<div class="modal-header"><h2>ランク ' + rank + ' — ' + processTypeLabel(processType) + '</h2><button onclick="App.closeModal()">\u2715</button></div>';
    html += '<div class="modal-body" style="max-height:60vh;overflow-y:auto">';
    html += '<div id="rankSteps">';
    tmpl.steps.forEach(function(s, si) {
      html += '<div class="rank-step-row" style="display:flex;gap:.3rem;align-items:center;margin-bottom:.3rem">';
      html += '<input type="text" class="rstepName" value="' + App.escH(s.name) + '" style="flex:1">';
      html += '<input type="number" class="rstepDays" value="' + s.defaultDays + '" min="1" style="width:50px" title="営業日">';
      html += '<label style="font-size:.7rem;color:var(--text-muted);display:flex;align-items:center;gap:.2rem"><input type="checkbox" class="rstepGate"' + (s.isGate ? ' checked' : '') + '>関所</label>';
      html += '<button class="toolbar-btn" style="font-size:.7rem;padding:.1rem .3rem;color:var(--danger)" onclick="this.parentElement.remove()">×</button>';
      html += '</div>';
    });
    html += '</div>';
    html += '<button class="toolbar-btn" style="margin-top:.5rem" onclick="FMT._addRankStep()">＋ 工程追加</button>';
    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button class="btn-secondary" onclick="App.closeModal()">キャンセル</button>';
    html += '<button class="btn-primary" onclick="FMT._saveRankTemplate(\'' + rank + '\',\'' + processType + '\')">保存</button>';
    html += '</div>';
    App.showModal(html);
  }

  function _addRankStep() {
    var container = document.getElementById('rankSteps');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'rank-step-row';
    div.style.cssText = 'display:flex;gap:.3rem;align-items:center;margin-bottom:.3rem';
    div.innerHTML = '<input type="text" class="rstepName" value="" style="flex:1" placeholder="工程名">' +
      '<input type="number" class="rstepDays" value="3" min="1" style="width:50px" title="営業日">' +
      '<label style="font-size:.7rem;color:var(--text-muted);display:flex;align-items:center;gap:.2rem"><input type="checkbox" class="rstepGate">関所</label>' +
      '<button class="toolbar-btn" style="font-size:.7rem;padding:.1rem .3rem;color:var(--danger)" onclick="this.parentElement.remove()">×</button>';
    container.appendChild(div);
  }

  function _saveRankTemplate(rank, processType) {
    var st = App.getState();
    var idx = (st.rankTemplates || []).findIndex(function(t) { return t.rank === rank && t.processType === processType; });
    if (idx < 0) return;

    var steps = [];
    document.querySelectorAll('.rank-step-row').forEach(function(row) {
      var nameEl = row.querySelector('.rstepName');
      var daysEl = row.querySelector('.rstepDays');
      var gateEl = row.querySelector('.rstepGate');
      if (nameEl && nameEl.value.trim()) {
        steps.push({
          name: nameEl.value.trim(),
          defaultDays: parseInt(daysEl.value) || 3,
          isGate: gateEl ? gateEl.checked : false
        });
      }
    });

    st.rankTemplates[idx].steps = steps;
    Data.save(st);
    App.closeModal();
    App.navigate('fmt_settings');
    App.showToast('ランク定義を更新しました', 'success');
  }

  // --- タブ3: スケジュール展開（プレビュー+実行） ---
  function renderSchedExpandTab() {
    var kikaku = App.getActiveKikaku();

    var html = '<div>';
    html += '<h3 style="margin:0 0 .5rem;color:var(--text-main)">スケジュール自動展開</h3>';
    html += '<p style="font-size:.8rem;color:var(--text-muted);margin-bottom:1rem">ランク + プロセスタイプ + 開始日を指定すると、各工程の日程を自動算出します（土日スキップ対応）。</p>';

    html += '<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">';
    html += '<div class="np-field" style="flex:1;min-width:120px"><label>ランク</label><select id="seRank">';
    Data.RANK_LIST.forEach(function(r) {
      html += '<option value="' + r + '">' + r + '</option>';
    });
    html += '</select></div>';
    html += '<div class="np-field" style="flex:1;min-width:160px"><label>プロセスタイプ</label><select id="seProcess">';
    PROCESS_TYPES.forEach(function(pt) {
      html += '<option value="' + pt.id + '">' + App.escH(pt.name) + '</option>';
    });
    html += '</select></div>';
    html += '<div class="np-field" style="flex:1;min-width:140px"><label>開始日</label><input type="date" id="seStart" value="' + Data.todayISO() + '"></div>';
    html += '</div>';

    html += '<div style="display:flex;gap:.5rem;margin-bottom:1rem">';
    html += '<button class="toolbar-btn" onclick="FMT._previewSchedule()">プレビュー</button>';
    if (kikaku) {
      html += '<button class="btn-primary" style="font-size:.8rem" onclick="FMT._applySchedule()">企画にタスク生成</button>';
    }
    html += '</div>';

    html += '<div id="schedPreview"></div>';
    html += '</div>';
    return html;
  }

  function _previewSchedule() {
    var rank = document.getElementById('seRank').value;
    var processType = document.getElementById('seProcess').value;
    var startStr = document.getElementById('seStart').value;
    if (!startStr) { App.showToast('開始日を入力してください', 'error'); return; }

    var startDate = App.parseD(startStr);
    var steps = expandSchedule(rank, processType, startDate);

    var previewEl = document.getElementById('schedPreview');
    if (!previewEl) return;

    if (!steps.length) {
      previewEl.innerHTML = '<div style="color:var(--text-muted)">該当するテンプレートが見つかりません</div>';
      return;
    }

    var html = '<table style="width:100%;border-collapse:collapse;font-size:.8rem">';
    html += '<thead><tr style="background:var(--bg-hover)">';
    html += '<th style="padding:.4rem;text-align:left;border-bottom:1px solid var(--border)">#</th>';
    html += '<th style="padding:.4rem;text-align:left;border-bottom:1px solid var(--border)">工程名</th>';
    html += '<th style="padding:.4rem;text-align:center;border-bottom:1px solid var(--border)">開始日</th>';
    html += '<th style="padding:.4rem;text-align:center;border-bottom:1px solid var(--border)">終了日</th>';
    html += '<th style="padding:.4rem;text-align:center;border-bottom:1px solid var(--border)">工数</th>';
    html += '<th style="padding:.4rem;text-align:center;border-bottom:1px solid var(--border)">関所</th>';
    html += '</tr></thead><tbody>';

    steps.forEach(function(s, i) {
      html += '<tr>';
      html += '<td style="padding:.3rem;border-bottom:1px solid var(--border);color:var(--text-dim)">' + (i + 1) + '</td>';
      html += '<td style="padding:.3rem;border-bottom:1px solid var(--border);color:var(--text-main)">' + App.escH(s.name) + '</td>';
      html += '<td style="padding:.3rem;text-align:center;border-bottom:1px solid var(--border);color:var(--text-muted)">' + App.fmtD(App.parseD(s.planStart)) + '</td>';
      html += '<td style="padding:.3rem;text-align:center;border-bottom:1px solid var(--border);color:var(--text-muted)">' + App.fmtD(App.parseD(s.planEnd)) + '</td>';
      html += '<td style="padding:.3rem;text-align:center;border-bottom:1px solid var(--border);color:var(--text-muted)">' + s.estimatedHours + 'h</td>';
      html += '<td style="padding:.3rem;text-align:center;border-bottom:1px solid var(--border)">' + (s.isGate ? '\u{1F6A7}' : '') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';

    var lastStep = steps[steps.length - 1];
    var totalDays = App.diffDays(App.parseD(steps[0].planStart), App.parseD(lastStep.planEnd));
    html += '<div style="margin-top:.5rem;font-size:.8rem;color:var(--text-muted)">全 ' + steps.length + ' 工程 / 期間: ' + (totalDays + 1) + ' 日間（土日除く）</div>';

    previewEl.innerHTML = html;
  }

  function _applySchedule() {
    var kikaku = App.getActiveKikaku();
    if (!kikaku) { App.showToast('企画を選択してください', 'error'); return; }

    var rank = document.getElementById('seRank').value;
    var processType = document.getElementById('seProcess').value;
    var startStr = document.getElementById('seStart').value;
    if (!startStr) { App.showToast('開始日を入力してください', 'error'); return; }

    var steps = expandSchedule(rank, processType, App.parseD(startStr));
    if (!steps.length) { App.showToast('テンプレートが見つかりません', 'error'); return; }

    if (!confirm(steps.length + '件のタスクを企画「' + kikaku.name + '」に追加しますか？')) return;

    steps.forEach(function(s) {
      var t = Data.createTask({
        name: s.name,
        planStart: s.planStart,
        planEnd: s.planEnd,
        isGate: s.isGate,
        estimatedHours: s.estimatedHours,
        processType: s.processType
      });
      kikaku.tasks.push(t);
    });

    // 企画にランク情報を記録
    if (!kikaku.rank) kikaku.rank = rank;
    Data.save(App.getState());
    App.showToast(steps.length + '件のタスクを生成しました', 'success');
  }

  // ========================================================
  // 6. フォルダDB画面
  // ========================================================

  App.registerView('folder_db', {
    init: function() {},
    render: function(container) {
      var st = App.getState();
      var config = st.folderConfig || JSON.parse(JSON.stringify(Data.DEFAULT_FOLDER_CONFIG));
      var kikaku = App.getActiveKikaku();
      var proj = App.getActiveProject();

      var html = '<div style="padding:1.5rem">';
      html += '<h3 style="margin:0 0 1rem;color:var(--text-main)">フォルダDB設計</h3>';

      // 命名規則設定
      html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1.5rem">';
      html += '<h4 style="margin:0 0 .75rem;color:var(--accent-light)">命名規則設定</h4>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:1rem">';
      html += '<div class="np-field" style="flex:1;min-width:120px"><label>接頭辞</label><input type="text" id="fdPrefix" value="' + App.escH(config.prefix || '') + '" placeholder="例: PRJ_"></div>';
      html += '<div class="np-field" style="flex:1;min-width:120px"><label>接尾辞</label><input type="text" id="fdSuffix" value="' + App.escH(config.suffix || '') + '" placeholder="例: _final"></div>';
      html += '<div class="np-field" style="flex:1;min-width:100px"><label>番号形式</label><select id="fdNumPat">';
      var numPatterns = [
        { val: 'n', label: '1桁 (1,2,3...)' },
        { val: 'nn', label: '2桁 (01,02,03...)' },
        { val: 'nnn', label: '3桁 (001,002,003...)' }
      ];
      numPatterns.forEach(function(np) {
        html += '<option value="' + np.val + '"' + (config.numberPattern === np.val ? ' selected' : '') + '>' + np.label + '</option>';
      });
      html += '</select></div>';
      html += '<div class="np-field" style="flex:1;min-width:80px"><label>区切り文字</label><select id="fdSep">';
      var seps = [
        { val: '_', label: 'アンダースコア (_)' },
        { val: '-', label: 'ハイフン (-)' },
        { val: '.', label: 'ドット (.)' }
      ];
      seps.forEach(function(s) {
        html += '<option value="' + s.val + '"' + (config.separator === s.val ? ' selected' : '') + '>' + s.label + '</option>';
      });
      html += '</select></div>';
      html += '</div>';
      html += '<div style="margin-top:.5rem"><label style="font-size:.8rem;color:var(--text-muted);display:flex;align-items:center;gap:.3rem">';
      html += '<input type="checkbox" id="fdUseOrder"' + (config.useActionOrder !== false ? ' checked' : '') + '> 工程順に番号を付与';
      html += '</label></div>';
      html += '<button class="toolbar-btn" style="margin-top:.75rem" onclick="FMT._saveFolderConfig()">設定を保存</button>';
      html += '</div>';

      // ツリープレビュー
      html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1rem">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">';
      html += '<h4 style="margin:0;color:var(--accent-light)">フォルダツリー プレビュー</h4>';
      html += '<button class="toolbar-btn" onclick="FMT._copyFolderTree()">テキストをコピー</button>';
      html += '</div>';

      var treeText = generateFolderTree(proj, kikaku, config);
      html += '<pre id="folderTreePre" style="background:var(--bg-main);padding:.75rem;border-radius:6px;font-size:.75rem;color:var(--text-main);overflow-x:auto;white-space:pre;line-height:1.6">' + App.escH(treeText) + '</pre>';
      html += '</div>';

      html += '</div>';
      container.innerHTML = html;
    }
  });

  function _saveFolderConfig() {
    var st = App.getState();
    st.folderConfig = {
      prefix: (document.getElementById('fdPrefix').value || '').trim(),
      suffix: (document.getElementById('fdSuffix').value || '').trim(),
      numberPattern: document.getElementById('fdNumPat').value,
      separator: document.getElementById('fdSep').value,
      useActionOrder: document.getElementById('fdUseOrder').checked
    };
    Data.save(st);
    App.navigate('folder_db');
    App.showToast('フォルダ設定を保存しました', 'success');
  }

  function _copyFolderTree() {
    var pre = document.getElementById('folderTreePre');
    if (!pre) return;
    var text = pre.textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        App.showToast('フォルダツリーをクリップボードにコピーしました', 'success');
      });
    } else {
      // フォールバック
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      App.showToast('フォルダツリーをクリップボードにコピーしました', 'success');
    }
  }

  /** フォルダツリーテキストを生成 */
  function generateFolderTree(proj, kikaku, config) {
    var sep = config.separator || '_';
    var prefix = config.prefix || '';
    var suffix = config.suffix || '';
    var numPat = config.numberPattern || 'nn';

    function pad(n) {
      if (numPat === 'nnn') return n < 100 ? (n < 10 ? '00' + n : '0' + n) : '' + n;
      if (numPat === 'nn') return n < 10 ? '0' + n : '' + n;
      return '' + n;
    }

    var lines = [];
    var projName = proj ? proj.name : 'プロジェクト名';
    lines.push(projName + '/');

    if (kikaku) {
      var kikakuName = kikaku.name || '企画名';
      lines.push('\u2514\u2500\u2500 ' + kikakuName + '/');

      // 台割ベースのフォルダ
      if (kikaku.daiwari && kikaku.daiwari.length) {
        kikaku.daiwari.forEach(function(dw, di) {
          var folderName = prefix + pad(di + 1) + sep + (dw.articleTitle || dw.pageNumber || 'page') + suffix;
          var isLast = di === kikaku.daiwari.length - 1;
          var connector = isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ';
          lines.push('    ' + connector + folderName + '/');

          // 工程サブフォルダ
          var st = App.getState();
          var fmt = null;
          if (kikaku.fmtId) {
            fmt = (st.fmts || []).find(function(f) { return f.id === kikaku.fmtId; });
          }
          if (!fmt && st.fmts && st.fmts.length) {
            // デフォルトで社内報制作を選択
            fmt = st.fmts.find(function(f) { return f.id === 'fmt_print'; }) || st.fmts[0];
          }

          if (fmt && fmt.actions && config.useActionOrder !== false) {
            var subPrefix = isLast ? '    ' : '\u2502   ';
            fmt.actions.forEach(function(a, ai) {
              var subFolder = pad(ai + 1) + sep + a.name;
              var subLast = ai === fmt.actions.length - 1;
              var subConn = subLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ';
              lines.push('    ' + subPrefix + subConn + subFolder + '/');
            });
          }
        });
      } else if (kikaku.tasks && kikaku.tasks.length) {
        // タスクベースのフォルダ
        kikaku.tasks.forEach(function(task, ti) {
          var folderName = prefix + pad(ti + 1) + sep + task.name + suffix;
          var isLast = ti === kikaku.tasks.length - 1;
          var connector = isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ';
          lines.push('    ' + connector + folderName + '/');
        });
      } else {
        lines.push('    \u2514\u2500\u2500 (タスクまたは台割を追加するとフォルダが生成されます)');
      }
    } else {
      lines.push('\u2514\u2500\u2500 (企画を選択するとフォルダが生成されます)');
    }

    return lines.join('\n');
  }

  // ========================================================
  // 7. 公開API（window.FMT）
  // ========================================================

  window.FMT = {
    // スケジュール展開
    expandSchedule: expandSchedule,
    addBusinessDays: addBusinessDays,
    findRankTemplate: findRankTemplate,

    // 台割CRUD
    _addDaiwariPage: _addDaiwariPage,
    _editDaiwariPage: _editDaiwariPage,
    _deleteDaiwariPage: _deleteDaiwariPage,
    _saveDaiwariPage: _saveDaiwariPage,
    _generateTasksFromDaiwari: _generateTasksFromDaiwari,

    // FMT設定
    _switchSettingsTab: _switchSettingsTab,
    _addFmt: _addFmt,
    _editFmt: _editFmt,
    _deleteFmt: _deleteFmt,
    _saveFmt: _saveFmt,
    _resetFmts: _resetFmts,
    _addFmtAction: _addFmtAction,

    // ランク定義
    _editRankTemplate: _editRankTemplate,
    _addRankStep: _addRankStep,
    _saveRankTemplate: _saveRankTemplate,
    _resetRankTemplates: _resetRankTemplates,

    // スケジュール展開UI
    _previewSchedule: _previewSchedule,
    _applySchedule: _applySchedule,

    // フォルダDB
    _saveFolderConfig: _saveFolderConfig,
    _copyFolderTree: _copyFolderTree,

    // 定数
    PROCESS_TYPES: PROCESS_TYPES,
    DEFAULT_RANK_TEMPLATES: DEFAULT_RANK_TEMPLATES
  };

})();
