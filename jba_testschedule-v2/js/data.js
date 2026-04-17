/**
 * data.js — データ構造定義・localStorage I/O・マイグレーション
 * cmd_023 Phase3a-s5 コアフレームワーク
 *
 * データ階層: Project（案件/クライアント）→ Kikaku（企画/号/特集）→ Task（工程）
 *
 * API契約（他モジュールが使用する）:
 *   window.Data.load()              — localStorageからstateを読み込み、返す
 *   window.Data.save(state)         — stateをlocalStorageに保存
 *   window.Data.migrate(oldState)   — v2→v3マイグレーション
 *   window.Data.createProject(opts) — Projectオブジェクト生成
 *   window.Data.createKikaku(opts)  — Kikaku（企画）オブジェクト生成
 *   window.Data.createTask(opts)    — Taskオブジェクト生成
 *   window.Data.createMember(opts)  — Memberオブジェクト生成
 *   window.Data.exportJSON()        — stateをJSON文字列で出力
 *   window.Data.importJSON(json)    — JSON文字列からstateを復元
 */
(function() {
  'use strict';

  // ===== 定数 =====
  var STORAGE_KEY_V2 = 'creative-task-mgr-v2';
  var STORAGE_KEY = 'creative-task-mgr-v3';
  var DATA_VERSION = 3;

  var STATUS_LIST = ['not_started', 'in_progress', 'completed', 'on_hold'];
  var STATUS_LABELS = {
    not_started: '未着手',
    in_progress: '進行中',
    completed: '完了',
    on_hold: '保留'
  };

  var ROLE_LIST = ['director', 'writer', 'editor', 'designer', 'other'];
  var ROLE_LABELS = {
    director: 'ディレクター',
    writer: 'ライター',
    editor: '編集',
    designer: 'デザイナー',
    other: 'その他'
  };

  var RANK_LIST = ['A', 'B', 'C', 'D'];

  // ===== プリセットFMT =====
  var PRESET_FMTS = [
    {id: 'fmt_video', name: '映像制作', builtin: true, actions: [
      {name: '企画', order: 1, defaultHours: 8},
      {name: '絵コンテ', order: 2, defaultHours: 16},
      {name: '撮影', order: 3, defaultHours: 24},
      {name: '編集', order: 4, defaultHours: 40},
      {name: 'MA', order: 5, defaultHours: 8},
      {name: '納品', order: 6, defaultHours: 4}
    ]},
    {id: 'fmt_web', name: 'Web制作', builtin: true, actions: [
      {name: '要件定義', order: 1, defaultHours: 16},
      {name: 'ワイヤーフレーム', order: 2, defaultHours: 16},
      {name: 'デザイン', order: 3, defaultHours: 40},
      {name: 'コーディング', order: 4, defaultHours: 56},
      {name: 'テスト', order: 5, defaultHours: 16},
      {name: '公開', order: 6, defaultHours: 8}
    ]},
    {id: 'fmt_graphic', name: 'グラフィックデザイン', builtin: true, actions: [
      {name: 'ヒアリング', order: 1, defaultHours: 4},
      {name: 'コンセプト', order: 2, defaultHours: 8},
      {name: 'ラフ', order: 3, defaultHours: 16},
      {name: '制作', order: 4, defaultHours: 32},
      {name: '校正', order: 5, defaultHours: 8},
      {name: '入稿', order: 6, defaultHours: 4}
    ]},
    {id: 'fmt_sns', name: 'SNS運用', builtin: true, actions: [
      {name: '企画', order: 1, defaultHours: 4},
      {name: '撮影・素材作成', order: 2, defaultHours: 8},
      {name: '編集', order: 3, defaultHours: 8},
      {name: '投稿', order: 4, defaultHours: 2},
      {name: '分析', order: 5, defaultHours: 4},
      {name: 'レポート', order: 6, defaultHours: 4}
    ]},
    {id: 'fmt_print', name: '社内報・紙面制作', builtin: true, actions: [
      {name: '企画案提出', order: 1, defaultHours: 8},
      {name: '情報収集', order: 2, defaultHours: 16},
      {name: '台割確定', order: 3, defaultHours: 4},
      {name: '構成案提出', order: 4, defaultHours: 8},
      {name: '取材・素材収集', order: 5, defaultHours: 24},
      {name: '執筆・制作', order: 6, defaultHours: 40},
      {name: '初校提出', order: 7, defaultHours: 8},
      {name: '初校確認（クライアント）', order: 8, defaultHours: 16},
      {name: 'デスクチェック', order: 9, defaultHours: 4},
      {name: '再校提出', order: 10, defaultHours: 8},
      {name: '校閲実施', order: 11, defaultHours: 8},
      {name: '色校提出', order: 12, defaultHours: 4},
      {name: '校了', order: 13, defaultHours: 2},
      {name: '印刷入稿', order: 14, defaultHours: 4}
    ]}
  ];

  var DEFAULT_FOLDER_CONFIG = {
    prefix: '', suffix: '', numberPattern: 'nn', separator: '_', useActionOrder: true
  };

  // ===== ユーティリティ =====
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function now() {
    return new Date().toISOString();
  }

  function todayISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  // ===== 日付ヘルパー（サンプルデータ用） =====
  function dateOffset(baseDateStr, days) {
    var d = new Date(baseDateStr);
    d.setDate(d.getDate() + days);
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var dd = d.getDate();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (dd < 10 ? '0' + dd : dd);
  }

  // ===== デフォルトstate =====
  function createDefaultState() {
    // --- サンプルメンバー ---
    var sampleMembers = [
      createMember({ name: '田中 太郎', role: 'director', location: 'tokyo', maxHoursPerDay: 8 }),
      createMember({ name: '鈴木 花子', role: 'writer', location: 'tokyo', maxHoursPerDay: 8 }),
      createMember({ name: '佐藤 健', role: 'designer', location: 'osaka', maxHoursPerDay: 8 }),
      createMember({ name: '山田 美咲', role: 'editor', location: 'tokyo', maxHoursPerDay: 8 })
    ];

    // --- サンプル日付（今日を基準に過去〜未来のリアルなスケジュール） ---
    var base = todayISO();
    // 制作は2週間前に開始済み、来月末納品のイメージ
    var startBase = dateOffset(base, -14);

    // 担当者マッピング
    var DIR = '田中 太郎';
    var WRI = '鈴木 花子';
    var DES = '佐藤 健';
    var EDI = '山田 美咲';

    // --- 14工程テンプレート（社内報標準制作フロー） ---
    // 各工程: [名前, 工数h, 担当者, 日数, isGate]
    var fullProcess = [
      ['企画立案',                8,  DIR, 2, false],
      ['取材先選定',              4,  DIR, 1, false],
      ['取材依頼',                2,  DIR, 1, false],
      ['取材実施',               16,  WRI, 3, false],
      ['原稿執筆',               24,  WRI, 5, false],
      ['原稿確認（クライアント）', 8,  DIR, 3, true],
      ['デザインラフ',            8,  DES, 2, false],
      ['デザイン制作',           16,  DES, 4, false],
      ['初校確認',                4,  EDI, 2, true],
      ['修正対応',                8,  DES, 2, false],
      ['校了確認',                2,  EDI, 1, true],
      ['入稿データ作成',          4,  DES, 1, false],
      ['色校確認',                2,  EDI, 1, true],
      ['納品',                    2,  DIR, 1, false]
    ];

    // 表紙・目次用（9工程: 取材系を除く）
    var coverProcess = [
      ['企画立案',       6, DIR, 2, false],
      ['デザインラフ',   8, DES, 2, false],
      ['デザイン制作',  16, DES, 4, false],
      ['初校確認',       4, EDI, 2, true],
      ['修正対応',       6, DES, 2, false],
      ['校了確認',       2, EDI, 1, true],
      ['入稿データ作成', 4, DES, 1, false],
      ['色校確認',       2, EDI, 1, true],
      ['納品',           2, DIR, 1, false]
    ];

    // ページ企画ごとにタスク生成
    function buildPageTasks(pageName, processDef, dayStart, progressDays) {
      var tasks = [];
      var currentDay = dayStart;
      processDef.forEach(function(step, idx) {
        var name = pageName + '：' + step[0];
        var hours = step[1];
        var assignee = step[2];
        var duration = step[3];
        var isGate = step[4];

        var ps = dateOffset(startBase, currentDay);
        var pe = dateOffset(startBase, currentDay + duration - 1);

        // 進捗シミュレーション: progressDays日分は完了/進行中
        var status = 'not_started';
        var actualStart = '';
        var actualEnd = '';

        if (currentDay + duration <= progressDays) {
          // 完了済み
          status = 'completed';
          actualStart = dateOffset(startBase, currentDay);
          actualEnd = dateOffset(startBase, currentDay + duration - 1 + (idx % 3 === 0 ? 1 : 0)); // 一部1日遅延
        } else if (currentDay < progressDays) {
          // 進行中
          status = 'in_progress';
          actualStart = dateOffset(startBase, currentDay);
        }

        tasks.push(createTask({
          name: name,
          planStart: ps,
          planEnd: pe,
          actualStart: actualStart,
          actualEnd: actualEnd,
          status: status,
          estimatedHours: hours,
          assignee: assignee,
          isGate: isGate,
          note: ''
        }));

        currentDay += duration;
      });
      return tasks;
    }

    // 4ページ企画のタスクを生成（開始日をずらして並行制作感を演出）
    var coverTasks = buildPageTasks('表紙・目次', coverProcess, 0, 14);
    var presidentTasks = buildPageTasks('社長メッセージ', fullProcess, 0, 12);
    var featureTasks = buildPageTasks('特集：新入社員紹介', fullProcess, 2, 10);
    var deptTasks = buildPageTasks('部署紹介：営業部', fullProcess, 5, 8);

    var allTasks = coverTasks.concat(presidentTasks, featureTasks, deptTasks);

    // --- サンプル企画 ---
    var sampleKikaku = createKikaku({
      name: 'vol.42 夏号',
      issueNumber: 'vol.42 / 2026年7月号',
      rank: 'A',
      tasks: allTasks
    });

    // --- サンプルプロジェクト ---
    var sampleProject = createProject({
      name: '〇〇株式会社 社内報',
      rank: 'A',
      client: '〇〇株式会社',
      mediaName: '社内報「つながり」',
      kikakus: [sampleKikaku]
    });

    var st = {
      version: DATA_VERSION,
      projects: [sampleProject],
      activeProjectId: sampleProject.id,
      activeKikakuId: sampleKikaku.id,
      currentScreen: 'dashboard',
      activeView: 'table',
      fmts: JSON.parse(JSON.stringify(PRESET_FMTS)),
      folderConfig: JSON.parse(JSON.stringify(DEFAULT_FOLDER_CONFIG)),
      members: sampleMembers,
      rankTemplates: [],
      undoStack: [],
      redoStack: [],
      alerts: []
    };

    return st;
  }

  // ===== ファクトリ関数 =====

  /**
   * Project（案件/クライアント単位）
   * 社内報ならクライアント×媒体単位。企画（号/特集）をkikakusに格納。
   */
  function createProject(opts) {
    opts = opts || {};
    return {
      id: opts.id || uid(),
      name: opts.name || '新規プロジェクト',
      createdAt: opts.createdAt || now(),
      kikakus: opts.kikakus || [],
      // プロジェクト属性
      rank: opts.rank || '',
      client: opts.client || '',
      mediaName: opts.mediaName || '',
      spec: opts.spec || '',
      jbaTeam: opts.jbaTeam || {
        director: '', writer: '', editor: '', designer: ''
      },
      clientContact: opts.clientContact || '',
      fmtId: opts.fmtId || null,
      folderGenerated: opts.folderGenerated || false
    };
  }

  /**
   * Kikaku（企画/号/特集単位）
   * 社内報なら「vol.42 夏号」「特集: 新入社員紹介」等。
   * 各企画がタスク（工程）を持つ。
   */
  function createKikaku(opts) {
    opts = opts || {};
    return {
      id: opts.id || uid(),
      name: opts.name || '新規企画',
      createdAt: opts.createdAt || now(),
      tasks: opts.tasks || [],
      // 企画属性
      issueNumber: opts.issueNumber || '',
      description: opts.description || '',
      rank: opts.rank || '',
      checkpoints: opts.checkpoints || [],
      daiwari: opts.daiwari || [],
      fmtId: opts.fmtId || null,
      // 記事/コンテンツ管理（企画単位）
      content: opts.content || {
        articleTitle: '',
        articleSummary: '',
        charCount: 0,
        pageSpace: '',
        sourceType: '',
        clientRequest: '',
        resourceLinks: [],
        memo: '',
        pendingItems: ''
      }
    };
  }

  /**
   * Task（工程単位）
   * 企画内の個々の工程。企画案提出→取材→執筆→校正→...
   */
  function createTask(opts) {
    opts = opts || {};
    return {
      id: opts.id || uid(),
      name: opts.name || '新規タスク',
      planStart: opts.planStart || todayISO(),
      planEnd: opts.planEnd || todayISO(),
      actualStart: opts.actualStart || '',
      actualEnd: opts.actualEnd || '',
      status: opts.status || 'not_started',
      note: opts.note || '',
      estimatedHours: opts.estimatedHours || 0,
      files: opts.files || [],
      // 担当者
      assignee: opts.assignee || '',
      assigneeHistory: opts.assigneeHistory || [],
      // 工程属性
      processType: opts.processType || '',
      checklistItems: opts.checklistItems || [],
      isGate: opts.isGate || false,
      autoCompleted: opts.autoCompleted || false,
      folderPath: opts.folderPath || ''
    };
  }

  function createMember(opts) {
    opts = opts || {};
    return {
      id: opts.id || uid(),
      name: opts.name || '',
      role: opts.role || 'other',
      location: opts.location || 'osaka',
      maxHoursPerDay: opts.maxHoursPerDay || 8
    };
  }

  // ===== マイグレーション v2→v3 =====
  function migrate(oldState) {
    if (!oldState) return createDefaultState();

    var s = JSON.parse(JSON.stringify(oldState));

    // version判定
    if (s.version === DATA_VERSION && s.activeKikakuId !== undefined) return s;

    // v2→v3: フィールド補完 + Project→Kikaku→Task階層化
    s.version = DATA_VERSION;
    s.activeView = s.activeView || 'table';
    s.activeKikakuId = s.activeKikakuId || null;
    s.members = s.members || [];
    s.rankTemplates = s.rankTemplates || [];
    s.undoStack = s.undoStack || [];
    s.redoStack = s.redoStack || [];
    s.alerts = s.alerts || [];

    // FMTの補完
    if (!s.fmts || !s.fmts.length) {
      s.fmts = JSON.parse(JSON.stringify(PRESET_FMTS));
    }
    if (!s.folderConfig) {
      s.folderConfig = JSON.parse(JSON.stringify(DEFAULT_FOLDER_CONFIG));
    }
    if (s.currentScreen === undefined) {
      s.currentScreen = 'dashboard';
    }

    // プロジェクトのマイグレーション（旧: tasks直下 → 新: kikakus[].tasks）
    if (s.projects) {
      s.projects.forEach(function(p) {
        p.client = p.client || '';
        p.mediaName = p.mediaName || '';
        p.spec = p.spec || '';
        p.jbaTeam = p.jbaTeam || {director: '', writer: '', editor: '', designer: ''};
        p.clientContact = p.clientContact || '';
        if (p.fmtId === undefined) p.fmtId = null;
        if (p.folderGenerated === undefined) p.folderGenerated = false;

        // 旧構造: project.tasks → 新構造: project.kikakus[0].tasks
        if (p.tasks && p.tasks.length && !p.kikakus) {
          var migratedKikaku = createKikaku({
            name: p.name,
            issueNumber: p.issueNumber || '',
            rank: p.rank || ''
          });

          // 旧タスクをマイグレーション
          p.tasks.forEach(function(t) {
            t.assignee = t.assignee || '';
            t.assigneeHistory = t.assigneeHistory || [];
            t.processType = t.processType || '';
            t.checklistItems = t.checklistItems || [];
            t.isGate = t.isGate || false;
            if (t.estimatedHours === undefined) t.estimatedHours = 0;
            if (!t.files) t.files = [];
            if (t.autoCompleted === undefined) t.autoCompleted = false;
            if (t.folderPath === undefined) t.folderPath = '';
            if (t.status === 'onHold') t.status = 'on_hold';
            // contentフィールドは企画レベルに移動（タスクからは削除）
            delete t.content;
          });

          migratedKikaku.tasks = p.tasks;
          // 旧プロジェクトの企画関連フィールドを企画に移動
          migratedKikaku.checkpoints = p.checkpoints || [];
          migratedKikaku.daiwari = p.daiwari || [];
          migratedKikaku.fmtId = p.fmtId || null;
          p.kikakus = [migratedKikaku];
          delete p.tasks;
          delete p.issueNumber;
          delete p.checkpoints;
          delete p.daiwari;
        }

        if (!p.kikakus) p.kikakus = [];

        // 企画のマイグレーション
        p.kikakus.forEach(function(k) {
          k.issueNumber = k.issueNumber || '';
          k.description = k.description || '';
          k.rank = k.rank || p.rank || '';
          k.checkpoints = k.checkpoints || [];
          k.daiwari = k.daiwari || [];
          k.fmtId = k.fmtId || null;
          k.content = k.content || {
            articleTitle: '', articleSummary: '', charCount: 0,
            pageSpace: '', sourceType: '', clientRequest: '',
            resourceLinks: [], memo: '', pendingItems: ''
          };

          if (k.tasks) {
            k.tasks.forEach(function(t) {
              t.assignee = t.assignee || '';
              t.assigneeHistory = t.assigneeHistory || [];
              t.processType = t.processType || '';
              t.checklistItems = t.checklistItems || [];
              t.isGate = t.isGate || false;
              if (t.estimatedHours === undefined) t.estimatedHours = 0;
              if (!t.files) t.files = [];
              if (t.autoCompleted === undefined) t.autoCompleted = false;
              if (t.folderPath === undefined) t.folderPath = '';
              if (t.status === 'onHold') t.status = 'on_hold';
            });
          }
        });

        // プロジェクトレベルのrankは残す（デフォルトランク）
        p.rank = p.rank || '';
      });
    }

    return s;
  }

  // ===== localStorage I/O =====

  function load() {
    try {
      // まずv3キーを確認
      var d = localStorage.getItem(STORAGE_KEY);
      if (d) {
        var parsed = JSON.parse(d);
        return migrate(parsed);
      }
      // v2キーからマイグレーション
      var d2 = localStorage.getItem(STORAGE_KEY_V2);
      if (d2) {
        var parsed2 = JSON.parse(d2);
        var migrated = migrate(parsed2);
        // v3キーに保存し、v2はそのまま残す（バックアップ）
        save(migrated);
        return migrated;
      }
    } catch (e) {
      console.error('Data.load error:', e);
    }
    return null;
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Data.save error:', e);
    }
  }

  // ===== エクスポート/インポート =====

  function exportJSON(state) {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(json) {
    try {
      var parsed = JSON.parse(json);
      return migrate(parsed);
    } catch (e) {
      console.error('Data.importJSON error:', e);
      return null;
    }
  }

  // ===== ヘルパー: 全タスク取得（企画横断） =====
  function getAllTasks(project) {
    var tasks = [];
    if (project && project.kikakus) {
      project.kikakus.forEach(function(k) {
        if (k.tasks) {
          k.tasks.forEach(function(t) {
            tasks.push({ task: t, kikaku: k });
          });
        }
      });
    }
    return tasks;
  }

  // ===== 公開API =====
  window.Data = {
    // 定数
    STORAGE_KEY: STORAGE_KEY,
    STATUS_LIST: STATUS_LIST,
    STATUS_LABELS: STATUS_LABELS,
    ROLE_LIST: ROLE_LIST,
    ROLE_LABELS: ROLE_LABELS,
    RANK_LIST: RANK_LIST,
    PRESET_FMTS: PRESET_FMTS,
    DEFAULT_FOLDER_CONFIG: DEFAULT_FOLDER_CONFIG,

    // I/O
    load: load,
    save: save,
    migrate: migrate,

    // ファクトリ
    createProject: createProject,
    createKikaku: createKikaku,
    createTask: createTask,
    createMember: createMember,
    createDefaultState: createDefaultState,

    // エクスポート/インポート
    exportJSON: exportJSON,
    importJSON: importJSON,

    // ヘルパー
    getAllTasks: getAllTasks,

    // ユーティリティ
    uid: uid,
    now: now,
    todayISO: todayISO
  };

})();
