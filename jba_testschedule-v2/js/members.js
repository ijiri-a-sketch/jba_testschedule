/**
 * members.js — 担当者マスター管理ビュー
 * cmd_023 Phase3 再実装（bushi8）
 *
 * 依存: App.getState, App.setState, App.getActiveProject, App.getActiveKikaku,
 *       App.showModal, App.closeModal, App.escH, App.showToast, App.registerView
 *       Data.createMember, Data.ROLE_LIST, Data.ROLE_LABELS, Data.getAllTasks
 *
 * Memberデータ構造: { id, name, role, location, maxHoursPerDay }
 */
(function() {
  'use strict';

  // ===== 定数 =====
  var LOCATION_LABELS = { osaka: '大阪', tokyo: '東京' };
  var LOCATION_LIST = ['osaka', 'tokyo'];

  // 稼働率の閾値（4段階色分け）
  var WORKLOAD_THRESHOLDS = [
    { max: 0.5, cls: 'wl-low',    label: '余裕' },
    { max: 0.8, cls: 'wl-mid',    label: '適正' },
    { max: 1.0, cls: 'wl-high',   label: '高負荷' },
    { max: Infinity, cls: 'wl-over', label: '超過' }
  ];

  // ===== ヘルパー =====

  /** メンバーIDから名前を取得 */
  function getMemberName(id) {
    if (!id) return '未割当';
    var members = App.getState().members || [];
    var m = members.find(function(x) { return x.id === id; });
    return m ? m.name : id;
  }

  /** メンバーIDからオブジェクトを取得 */
  function getMemberById(id) {
    if (!id) return null;
    var members = App.getState().members || [];
    return members.find(function(x) { return x.id === id; }) || null;
  }

  /** 全プロジェクト横断で本日の稼働時間を計算 */
  function calcTodayHours(memberId) {
    var state = App.getState();
    var today = Data.todayISO();
    var totalHours = 0;

    (state.projects || []).forEach(function(proj) {
      (proj.kikakus || []).forEach(function(k) {
        (k.tasks || []).forEach(function(t) {
          if (t.assignee !== memberId) return;
          if (t.status !== 'in_progress') return;
          // タスクの期間内に本日が含まれるか
          if (t.planStart && t.planEnd && today >= t.planStart && today <= t.planEnd) {
            // 期間日数で按分
            var startD = new Date(t.planStart);
            var endD = new Date(t.planEnd);
            var days = Math.max(1, Math.round((endD - startD) / 864e5) + 1);
            totalHours += (t.estimatedHours || 0) / days;
          }
        });
      });
    });

    return Math.round(totalHours * 10) / 10;
  }

  /** 稼働率に対応するクラスとラベルを返す */
  function getWorkloadInfo(ratio) {
    for (var i = 0; i < WORKLOAD_THRESHOLDS.length; i++) {
      if (ratio <= WORKLOAD_THRESHOLDS[i].max) {
        return WORKLOAD_THRESHOLDS[i];
      }
    }
    return WORKLOAD_THRESHOLDS[WORKLOAD_THRESHOLDS.length - 1];
  }

  // ===== 描画 =====

  function render(container) {
    var state = App.getState();
    var members = state.members || [];

    // 拠点別グループ化
    var grouped = {};
    LOCATION_LIST.forEach(function(loc) { grouped[loc] = []; });
    members.forEach(function(m) {
      var loc = m.location || 'osaka';
      if (!grouped[loc]) grouped[loc] = [];
      grouped[loc].push(m);
    });

    // 統計
    var totalCount = members.length;
    var roleCounts = {};
    Data.ROLE_LIST.forEach(function(r) { roleCounts[r] = 0; });
    members.forEach(function(m) {
      var r = m.role || 'other';
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    });

    var html = '';

    // --- 統計サマリー ---
    html += '<div class="members-summary" style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1rem;padding:.75rem;background:var(--surface-alt,#1e1e2e);border-radius:8px">';
    html += '<div class="stat-chip">総人数 <span class="val blue">' + totalCount + '</span></div>';
    Data.ROLE_LIST.forEach(function(r) {
      if (roleCounts[r] > 0) {
        html += '<div class="stat-chip">' + App.escH(Data.ROLE_LABELS[r]) + ' <span class="val">' + roleCounts[r] + '</span></div>';
      }
    });
    html += '<div style="margin-left:auto"><button class="toolbar-btn" onclick="MembersView.showAdd()">+ 担当者追加</button></div>';
    html += '</div>';

    // --- 拠点別テーブル ---
    LOCATION_LIST.forEach(function(loc) {
      var group = grouped[loc] || [];
      html += '<div class="members-location-group" style="margin-bottom:1.5rem">';
      html += '<h3 style="font-size:.85rem;color:var(--text-muted);margin-bottom:.5rem;border-bottom:1px solid var(--border,#333);padding-bottom:.3rem">';
      html += App.escH(LOCATION_LABELS[loc] || loc) + '（' + group.length + '名）</h3>';

      if (group.length === 0) {
        html += '<div style="padding:.5rem;color:var(--text-dim,#666);font-size:.8rem">担当者なし</div>';
      } else {
        html += '<table class="members-table" style="width:100%;border-collapse:collapse;font-size:.8rem">';
        html += '<thead><tr style="border-bottom:1px solid var(--border,#333)">';
        html += '<th style="text-align:left;padding:.4rem .5rem">名前</th>';
        html += '<th style="text-align:left;padding:.4rem .5rem">役割</th>';
        html += '<th style="text-align:center;padding:.4rem .5rem">上限h/日</th>';
        html += '<th style="text-align:center;padding:.4rem .5rem">本日稼働</th>';
        html += '<th style="text-align:center;padding:.4rem .5rem;width:80px">操作</th>';
        html += '</tr></thead><tbody>';

        group.forEach(function(m) {
          var todayH = calcTodayHours(m.id);
          var ratio = m.maxHoursPerDay > 0 ? todayH / m.maxHoursPerDay : 0;
          var wlInfo = getWorkloadInfo(ratio);
          var barPct = Math.min(ratio * 100, 100);

          html += '<tr style="border-bottom:1px solid var(--border-dim,#222)">';
          html += '<td style="padding:.4rem .5rem;font-weight:500">' + App.escH(m.name) + '</td>';
          html += '<td style="padding:.4rem .5rem">' + App.escH(Data.ROLE_LABELS[m.role] || m.role) + '</td>';
          html += '<td style="text-align:center;padding:.4rem .5rem">' + m.maxHoursPerDay + 'h</td>';

          // 稼働バー
          html += '<td style="padding:.4rem .5rem">';
          html += '<div style="display:flex;align-items:center;gap:.4rem">';
          html += '<div class="workload-bar" style="flex:1;height:6px;background:var(--border-dim,#222);border-radius:3px;overflow:hidden">';
          html += '<div class="workload-bar-fill ' + wlInfo.cls + '" style="width:' + barPct + '%;height:100%;border-radius:3px;transition:width .3s"></div>';
          html += '</div>';
          html += '<span style="font-size:.7rem;white-space:nowrap;min-width:50px;text-align:right">' + todayH + '/' + m.maxHoursPerDay + 'h</span>';
          html += '</div>';
          html += '</td>';

          // 操作ボタン
          html += '<td style="text-align:center;padding:.4rem .5rem">';
          html += '<button style="background:none;border:none;cursor:pointer;color:var(--accent-light,#88f);font-size:.75rem;padding:.15rem .3rem" onclick="MembersView.showEdit(\'' + m.id + '\')" title="編集">\u270E</button>';
          html += '<button style="background:none;border:none;cursor:pointer;color:var(--danger,#f66);font-size:.75rem;padding:.15rem .3rem" onclick="MembersView.confirmDelete(\'' + m.id + '\')" title="削除">\u2715</button>';
          html += '</td>';
          html += '</tr>';
        });

        html += '</tbody></table>';
      }
      html += '</div>';
    });

    container.innerHTML = html;
  }

  // ===== モーダル: 追加 =====

  function showAdd() {
    var html = '<div class="modal-header"><h2>担当者追加</h2>';
    html += '<button onclick="App.closeModal()">\u2715</button></div>';
    html += '<div class="modal-body">';
    html += buildFormFields(null);
    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button class="btn-secondary" onclick="App.closeModal()">キャンセル</button>';
    html += '<button class="btn-primary" onclick="MembersView.saveMember(null)">追加</button>';
    html += '</div>';
    App.showModal(html);
  }

  // ===== モーダル: 編集 =====

  function showEdit(id) {
    var m = getMemberById(id);
    if (!m) return;

    var html = '<div class="modal-header"><h2>担当者編集</h2>';
    html += '<button onclick="App.closeModal()">\u2715</button></div>';
    html += '<div class="modal-body">';
    html += buildFormFields(m);
    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button class="btn-secondary" onclick="App.closeModal()">キャンセル</button>';
    html += '<button class="btn-primary" onclick="MembersView.saveMember(\'' + id + '\')">保存</button>';
    html += '</div>';
    App.showModal(html);
  }

  /** フォームフィールド生成（追加/編集共通） */
  function buildFormFields(member) {
    var n = member ? App.escH(member.name) : '';
    var r = member ? member.role : 'other';
    var l = member ? member.location : 'osaka';
    var h = member ? member.maxHoursPerDay : 8;

    var html = '';
    html += '<div class="np-field"><label>名前</label>';
    html += '<input type="text" id="memberName" value="' + n + '" placeholder="例: 田中太郎"></div>';

    html += '<div class="np-field"><label>役割</label>';
    html += '<select id="memberRole">';
    Data.ROLE_LIST.forEach(function(rv) {
      var sel = rv === r ? ' selected' : '';
      html += '<option value="' + rv + '"' + sel + '>' + App.escH(Data.ROLE_LABELS[rv]) + '</option>';
    });
    html += '</select></div>';

    html += '<div class="np-field"><label>拠点</label>';
    html += '<select id="memberLocation">';
    LOCATION_LIST.forEach(function(lv) {
      var sel = lv === l ? ' selected' : '';
      html += '<option value="' + lv + '"' + sel + '>' + App.escH(LOCATION_LABELS[lv]) + '</option>';
    });
    html += '</select></div>';

    html += '<div class="np-field"><label>1日の最大稼働時間（h）</label>';
    html += '<input type="number" id="memberMaxHours" value="' + h + '" min="1" max="24" step="0.5"></div>';

    return html;
  }

  // ===== 保存 =====

  function saveMember(editId) {
    var nameEl = document.getElementById('memberName');
    var roleEl = document.getElementById('memberRole');
    var locEl = document.getElementById('memberLocation');
    var hoursEl = document.getElementById('memberMaxHours');

    if (!nameEl) return;
    var name = nameEl.value.trim();
    if (!name) {
      App.showToast('名前を入力してください', 'error');
      return;
    }

    var state = App.getState();
    var members = (state.members || []).slice();

    if (editId) {
      // 編集
      var idx = -1;
      for (var i = 0; i < members.length; i++) {
        if (members[i].id === editId) { idx = i; break; }
      }
      if (idx >= 0) {
        members[idx] = {
          id: editId,
          name: name,
          role: roleEl ? roleEl.value : 'other',
          location: locEl ? locEl.value : 'osaka',
          maxHoursPerDay: hoursEl ? parseFloat(hoursEl.value) || 8 : 8
        };
        App.setState({ members: members });
        App.closeModal();
        App.showToast('「' + name + '」を更新しました', 'success');
      }
    } else {
      // 追加
      var newMember = Data.createMember({
        name: name,
        role: roleEl ? roleEl.value : 'other',
        location: locEl ? locEl.value : 'osaka',
        maxHoursPerDay: hoursEl ? parseFloat(hoursEl.value) || 8 : 8
      });
      members.push(newMember);
      App.setState({ members: members });
      App.closeModal();
      App.showToast('「' + name + '」を追加しました', 'success');
    }
  }

  // ===== 削除確認モーダル =====

  function confirmDelete(id) {
    var m = getMemberById(id);
    if (!m) return;

    // タスクに割当済みか確認
    var assignedCount = 0;
    var state = App.getState();
    (state.projects || []).forEach(function(proj) {
      (proj.kikakus || []).forEach(function(k) {
        (k.tasks || []).forEach(function(t) {
          if (t.assignee === id) assignedCount++;
        });
      });
    });

    var html = '<div class="modal-header"><h2>担当者削除</h2>';
    html += '<button onclick="App.closeModal()">\u2715</button></div>';
    html += '<div class="modal-body">';
    html += '<p>「' + App.escH(m.name) + '」を削除しますか？</p>';
    if (assignedCount > 0) {
      html += '<p style="color:var(--warning,#fa0);font-size:.8rem;margin-top:.5rem">';
      html += '※ 現在 ' + assignedCount + ' 件のタスクに割り当てられています。削除後もタスク側の担当者名は保持されます。</p>';
    }
    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button class="btn-secondary" onclick="App.closeModal()">キャンセル</button>';
    html += '<button class="btn-primary" style="background:var(--danger,#c33)" onclick="MembersView.deleteMember(\'' + id + '\')">削除</button>';
    html += '</div>';
    App.showModal(html);
  }

  function deleteMember(id) {
    var m = getMemberById(id);
    var state = App.getState();
    var members = (state.members || []).filter(function(x) { return x.id !== id; });
    App.setState({ members: members });
    App.closeModal();
    App.showToast('「' + (m ? m.name : '') + '」を削除しました', 'success');
  }

  // ===== ビュー登録 =====
  App.registerView('members', {
    init: function() {},
    render: render
  });

  // ===== 公開API =====
  window.MembersView = {
    showAdd: showAdd,
    showEdit: showEdit,
    saveMember: saveMember,
    deleteMember: deleteMember,
    confirmDelete: confirmDelete,
    getMemberName: getMemberName,
    getMemberById: getMemberById
  };

})();
