// ============================================================
// Supabase Client — JBA Schedule App v2
// ============================================================
// 使い方:
//   1. Supabase ダッシュボードで Project を作成
//   2. Settings > API から URL と anon key を取得
//   3. 下記の SUPABASE_URL / SUPABASE_ANON_KEY を書き換え
//   4. db/supabase_schema.sql を SQL Editor で実行
// ============================================================

var SUPABASE_URL  = 'https://krtecijyiklragfzfdvy.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydGVjaWp5aWtscmFnZnpmZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTQ5MjksImV4cCI6MjA5MTk5MDkyOX0.7brSmqaoT47uca5oKDgc1Fmq3pd4C2NAFwVgn_zpoKU';

// Supabase JS v2 CDN から読み込み済み前提
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

var sb = null;  // ← supabase から sb に変更（window.supabase との衝突回避）

function initSupabase() {
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Client initialized');
    return true;
  }
  console.warn('[Supabase] Library not loaded — falling back to localStorage');
  return false;
}

// ============================================================
// CRUD ヘルパー
// ============================================================

// --- Members ---
async function dbGetMembers() {
  var { data, error } = await sb.from('members').select('*').order('created_at');
  if (error) { console.error('[DB] members fetch error:', error); return []; }
  return data.map(function(m) {
    return { id: m.id, name: m.name, role: m.role, color: m.color };
  });
}

async function dbUpsertMember(member) {
  var { error } = await sb.from('members').upsert({
    id: member.id, name: member.name, role: member.role, color: member.color
  });
  if (error) console.error('[DB] member upsert error:', error);
}

async function dbDeleteMember(id) {
  var { error } = await sb.from('members').delete().eq('id', id);
  if (error) console.error('[DB] member delete error:', error);
}

// --- Projects (with nested gous → kikakus → tasks) ---
async function dbGetProjects() {
  // プロジェクト取得
  var { data: projects, error: pe } = await sb
    .from('projects').select('*').order('sort_order');
  if (pe) { console.error('[DB] projects fetch error:', pe); return []; }

  // 号取得
  var { data: gous, error: ge } = await sb
    .from('gous').select('*').order('sort_order');
  if (ge) { console.error('[DB] gous fetch error:', ge); return []; }

  // 企画取得
  var { data: kikakus, error: ke } = await sb
    .from('kikakus').select('*').order('sort_order');
  if (ke) { console.error('[DB] kikakus fetch error:', ke); return []; }

  // タスク取得
  var { data: tasks, error: te } = await sb
    .from('tasks').select('*').order('sort_order');
  if (te) { console.error('[DB] tasks fetch error:', te); return []; }

  // 担当者変更履歴
  var { data: histories, error: he } = await sb
    .from('task_assignee_history').select('*').order('changed_at');
  if (he) histories = [];

  // プロジェクトメンバー
  var { data: pmems, error: pme } = await sb
    .from('project_members').select('*');
  if (pme) pmems = [];

  // ネスト構造に組み立て
  var taskMap = {};
  (tasks || []).forEach(function(t) {
    if (!taskMap[t.kikaku_id]) taskMap[t.kikaku_id] = [];
    var histArr = (histories || []).filter(function(h) { return h.task_id === t.id; });
    taskMap[t.kikaku_id].push({
      id: t.id, name: t.name, assignee: t.assignee, status: t.status,
      planStart: t.plan_start, planEnd: t.plan_end,
      actualStart: t.actual_start, actualEnd: t.actual_end,
      estimatedHours: t.estimated_hours ? parseFloat(t.estimated_hours) : null,
      note: t.note,
      assigneeHistory: histArr.map(function(h) {
        return { from: h.from_name, to: h.to_name, timestamp: h.changed_at };
      })
    });
  });

  var kikakuMap = {};
  (kikakus || []).forEach(function(k) {
    if (!kikakuMap[k.gou_id]) kikakuMap[k.gou_id] = [];
    kikakuMap[k.gou_id].push({
      id: k.id, name: k.name,
      meta: {
        designer: k.meta_designer, kikaku: k.meta_kikaku, interview: k.meta_interview,
        writer: k.meta_writer, editor: k.meta_editor, pageNum: k.page_num
      },
      tasks: taskMap[k.id] || []
    });
  });

  var gouMap = {};
  (gous || []).forEach(function(g) {
    if (!gouMap[g.project_id]) gouMap[g.project_id] = [];
    gouMap[g.project_id].push({
      id: g.id, name: g.name,
      kikakus: kikakuMap[g.id] || []
    });
  });

  var pmemMap = {};
  (pmems || []).forEach(function(pm) {
    if (!pmemMap[pm.project_id]) pmemMap[pm.project_id] = [];
    pmemMap[pm.project_id].push(pm.member_id);
  });

  return projects.map(function(p) {
    return {
      id: p.id, name: p.name, client: p.client, mediaType: p.media_type,
      members: pmemMap[p.id] || [], createdAt: p.created_at,
      gous: gouMap[p.id] || []
    };
  });
}

// --- Full State Save (localStorage互換の一括保存) ---
async function dbSaveFullState(S) {
  // トランザクション的に全データを同期
  // 既存データを削除して再挿入（シンプルな方式）
  // 本番運用ではdiff同期に切り替え推奨

  // 1. 既存プロジェクト群を削除（CASCADE で子も消える）
  await sb.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. メンバー
  await sb.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (S.members && S.members.length > 0) {
    await sb.from('members').insert(S.members.map(function(m) {
      return { id: m.id, name: m.name, role: m.role, color: m.color };
    }));
  }

  // 3. プロジェクト → 号 → 企画 → タスク
  for (var pi = 0; pi < (S.projects || []).length; pi++) {
    var p = S.projects[pi];
    await sb.from('projects').insert({
      id: p.id, name: p.name, client: p.client || null,
      media_type: p.mediaType || 'shanaiho', sort_order: pi
    });

    // project_members
    if (p.members && p.members.length > 0) {
      await sb.from('project_members').insert(p.members.map(function(mid) {
        return { project_id: p.id, member_id: mid };
      }));
    }

    for (var gi = 0; gi < (p.gous || []).length; gi++) {
      var g = p.gous[gi];
      await sb.from('gous').insert({
        id: g.id, project_id: p.id, name: g.name, sort_order: gi
      });

      for (var ki = 0; ki < (g.kikakus || []).length; ki++) {
        var k = g.kikakus[ki];
        var meta = k.meta || {};
        await sb.from('kikakus').insert({
          id: k.id, gou_id: g.id, name: k.name, page_num: meta.pageNum || null,
          meta_designer: meta.designer || null, meta_kikaku: meta.kikaku || null,
          meta_interview: meta.interview || null, meta_writer: meta.writer || null,
          meta_editor: meta.editor || null, sort_order: ki
        });

        for (var ti = 0; ti < (k.tasks || []).length; ti++) {
          var t = k.tasks[ti];
          await sb.from('tasks').insert({
            id: t.id, kikaku_id: k.id, name: t.name, assignee: t.assignee || null,
            status: t.status || 'not_started',
            plan_start: t.planStart || null, plan_end: t.planEnd || null,
            actual_start: t.actualStart || null, actual_end: t.actualEnd || null,
            estimated_hours: t.estimatedHours || null, note: t.note || null,
            sort_order: ti
          });

          // 担当者変更履歴
          if (t.assigneeHistory && t.assigneeHistory.length > 0) {
            await sb.from('task_assignee_history').insert(
              t.assigneeHistory.map(function(ah) {
                return { task_id: t.id, from_name: ah.from, to_name: ah.to, changed_at: ah.timestamp };
              })
            );
          }
        }
      }
    }
  }

  // 4. タイムスケジュール
  await sb.from('time_schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (S.timeSchedule) {
    var tsRows = [];
    Object.keys(S.timeSchedule).forEach(function(key) {
      var parts = key.split(':');
      var memberId = parts[0];
      var date = parts[1];
      (S.timeSchedule[key] || []).forEach(function(slot) {
        tsRows.push({
          member_id: memberId, date: date, hour: slot.hour, task_id: slot.taskId || null
        });
      });
    });
    if (tsRows.length > 0) {
      // バッチ挿入（100件ずつ）
      for (var i = 0; i < tsRows.length; i += 100) {
        await sb.from('time_schedules').insert(tsRows.slice(i, i + 100));
      }
    }
  }

  // 5. カスタムFMT
  await sb.from('custom_fmts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  var cfmts = JSON.parse(localStorage.getItem('custom-fmts') || '[]');
  if (cfmts.length > 0) {
    await sb.from('custom_fmts').insert(cfmts.map(function(cf) {
      return { id: cf.id, name: cf.name, steps: JSON.stringify(cf.steps) };
    }));
  }

  console.log('[DB] Full state saved to Supabase');
}

// --- TimeSchedule ---
async function dbGetTimeSchedule() {
  var { data, error } = await sb.from('time_schedules').select('*');
  if (error) { console.error('[DB] time_schedules fetch error:', error); return {}; }
  var result = {};
  (data || []).forEach(function(row) {
    var key = row.member_id + ':' + row.date;
    if (!result[key]) result[key] = [];
    result[key].push({ hour: row.hour, taskId: row.task_id });
  });
  return result;
}

// --- Custom FMTs ---
async function dbGetCustomFmts() {
  var { data, error } = await sb.from('custom_fmts').select('*').order('created_at');
  if (error) { console.error('[DB] custom_fmts fetch error:', error); return []; }
  return (data || []).map(function(cf) {
    return { id: cf.id, name: cf.name, steps: typeof cf.steps === 'string' ? JSON.parse(cf.steps) : cf.steps };
  });
}
