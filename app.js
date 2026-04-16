/* ══════════════════════════════════════════════════════════════
   SUPPORT TEAM TRACKER — app.js
   Full SPA: Timeline · Calendar · Status · Discord · Firebase
══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. CONFIGURATION
───────────────────────────────────────────────────────────── */
const CONFIG = {
  discord: {
    enabled: false,
    webhookUrl: '',
    role: '',
    notifyCheckin:  true,
    notifyCheckout: true,
    notifyBreak:    true,
    notifyLeave:    true,
  },
  firebase: {
    enabled: false,
    apiKey:            '',
    authDomain:        '',
    databaseURL:       '',
    projectId:         '',
    storageBucket:     '',
    messagingSenderId: '',
    appId:             '',
  },
};

/* ─────────────────────────────────────────────────────────────
   2. DEFAULT TEAM DATA
───────────────────────────────────────────────────────────── */
const DEFAULT_TEAM = [
  {
    id: 'tm001', name: 'Alex Rivera',   role: 'Support Lead',
    initials: 'AR', color: '#6366f1',
    status: 'working', checkInTime: null, checkOutTime: null,
    shift: { start: 9, end: 17, days: [1,2,3,4,5] },
    totalMinutesToday: 0,
  },
  {
    id: 'tm002', name: 'Jordan Lee',    role: 'Senior Support',
    initials: 'JL', color: '#10b981',
    status: 'offline', checkInTime: null, checkOutTime: null,
    shift: { start: 8, end: 16, days: [1,2,3,4,5] },
    totalMinutesToday: 0,
  },
  {
    id: 'tm003', name: 'Sam Chen',      role: 'Technical Support',
    initials: 'SC', color: '#f59e0b',
    status: 'break', checkInTime: null, checkOutTime: null,
    shift: { start: 12, end: 20, days: [0,1,2,3,4,5,6] },
    totalMinutesToday: 0,
  },
  {
    id: 'tm004', name: 'Morgan Blake',  role: 'Customer Support',
    initials: 'MB', color: '#ef4444',
    status: 'leave', checkInTime: null, checkOutTime: null,
    shift: { start: 14, end: 22, days: [0,1,2,3,4] },
    totalMinutesToday: 0,
  },
  {
    id: 'tm005', name: 'Taylor Swift',  role: 'Night Shift Lead',
    initials: 'TS', color: '#ec4899',
    status: 'working', checkInTime: null, checkOutTime: null,
    shift: { start: 0, end: 8, days: [1,2,3,4,5,6] },
    totalMinutesToday: 0,
  },
  {
    id: 'tm006', name: 'Casey Park',    role: 'Tier 2 Support',
    initials: 'CP', color: '#06b6d4',
    status: 'offline', checkInTime: null, checkOutTime: null,
    shift: { start: 16, end: 24, days: [0,1,2,3,4] },
    totalMinutesToday: 0,
  },
];

/* ─────────────────────────────────────────────────────────────
   3. APPLICATION STATE
───────────────────────────────────────────────────────────── */
const STATE = {
  team:            [],
  activities:      [],
  currentSection:  'dashboard',
  calendarMonth:   new Date(),
  selectedCalDate: new Date(),
  timelineDate:    new Date(),
  teamFilter:      'all',
  firebaseDB:      null,
  checkinAction:   'checkin',
  addMemberDays:   [1,2,3,4,5],
  addMemberColor:  '#6366f1',
};

/* ─────────────────────────────────────────────────────────────
   4. PERSISTENCE (localStorage)
───────────────────────────────────────────────────────────── */
const STORAGE_KEYS = { team: 'stt_team', activities: 'stt_activities', config: 'stt_config' };

function saveState() {
  localStorage.setItem(STORAGE_KEYS.team,       JSON.stringify(STATE.team));
  localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(STATE.activities));
  localStorage.setItem(STORAGE_KEYS.config,     JSON.stringify(CONFIG));
}

function loadState() {
  try {
    const team = localStorage.getItem(STORAGE_KEYS.team);
    STATE.team = team ? JSON.parse(team) : JSON.parse(JSON.stringify(DEFAULT_TEAM));

    const acts = localStorage.getItem(STORAGE_KEYS.activities);
    STATE.activities = acts ? JSON.parse(acts) : [];

    const cfg = localStorage.getItem(STORAGE_KEYS.config);
    if (cfg) {
      const saved = JSON.parse(cfg);
      Object.assign(CONFIG.discord,  saved.discord  || {});
      Object.assign(CONFIG.firebase, saved.firebase || {});
    }
  } catch (e) {
    STATE.team       = JSON.parse(JSON.stringify(DEFAULT_TEAM));
    STATE.activities = [];
  }
}

/* ─────────────────────────────────────────────────────────────
   5. DISCORD NOTIFICATIONS
───────────────────────────────────────────────────────────── */
const Discord = {
  colorMap: {
    checkin:  0x10b981,
    checkout: 0x6366f1,
    break:    0xf59e0b,
    leave:    0xef4444,
    added:    0x06b6d4,
  },

  async send(type, member, note = '') {
    if (!CONFIG.discord.enabled || !CONFIG.discord.webhookUrl) return;
    const shouldSend = {
      checkin:  CONFIG.discord.notifyCheckin,
      checkout: CONFIG.discord.notifyCheckout,
      break:    CONFIG.discord.notifyBreak,
      leave:    CONFIG.discord.notifyLeave,
    };
    if (shouldSend[type] === false) return;

    const labels = { checkin: 'Checked In', checkout: 'Checked Out', break: 'On Break', leave: 'On Leave', added: 'Added to Team' };
    const now    = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const role   = CONFIG.discord.role ? `<@&${CONFIG.discord.role.replace(/[^0-9]/g,'')}> ` : '';

    const payload = {
      content: role || undefined,
      embeds: [{
        title: `${labels[type] || type} — ${member.name}`,
        color: this.colorMap[type] || 0x6366f1,
        fields: [
          { name: 'Role',   value: member.role,  inline: true },
          { name: 'Status', value: labels[type] || type, inline: true },
          { name: 'Time',   value: timeStr,       inline: true },
        ],
        footer: { text: 'Support Team Tracker' },
        timestamp: now.toISOString(),
      }],
    };
    if (note) payload.embeds[0].fields.push({ name: 'Note', value: note });

    try {
      const res = await fetch(CONFIG.discord.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Discord notification sent', 'success');
    } catch (err) {
      console.warn('Discord notification failed:', err.message);
    }
  },

  async test() {
    if (!CONFIG.discord.webhookUrl) {
      showToast('Enter a Discord webhook URL first', 'error'); return;
    }
    const fake = { name: 'Test User', role: 'Support Agent' };
    CONFIG.discord.enabled = true;
    await this.send('checkin', fake, 'This is a test notification from Support Team Tracker');
    CONFIG.discord.enabled = document.getElementById('discordEnabled').checked;
  },
};

/* ─────────────────────────────────────────────────────────────
   6. FIREBASE INTEGRATION
───────────────────────────────────────────────────────────── */
const Firebase = {
  init() {
    if (!CONFIG.firebase.enabled) return;

    // Firebase SDK must be loaded (see index.html script tags)
    if (typeof firebase === 'undefined') {
      showToast('Firebase SDK not loaded. Uncomment the script tags in index.html.', 'error');
      return;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp({
          apiKey:            CONFIG.firebase.apiKey,
          authDomain:        CONFIG.firebase.authDomain,
          databaseURL:       CONFIG.firebase.databaseURL,
          projectId:         CONFIG.firebase.projectId,
          storageBucket:     CONFIG.firebase.storageBucket,
          messagingSenderId: CONFIG.firebase.messagingSenderId,
          appId:             CONFIG.firebase.appId,
        });
      }
      STATE.firebaseDB = firebase.database();
      this.listenToTeam();
      this.listenToActivities();
      UI.setFirebaseStatus('Connected to Firebase', 'success');
      showToast('Firebase connected!', 'success');
    } catch (err) {
      UI.setFirebaseStatus(`Error: ${err.message}`, 'error');
      showToast('Firebase connection failed', 'error');
    }
  },

  listenToTeam() {
    if (!STATE.firebaseDB) return;
    STATE.firebaseDB.ref('team').on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        STATE.team = Object.values(data);
        renderAll();
        saveState();
      }
    });
  },

  listenToActivities() {
    if (!STATE.firebaseDB) return;
    STATE.firebaseDB.ref('activities').limitToLast(50).on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        STATE.activities = Object.values(data).sort((a,b) => b.timestamp - a.timestamp);
        renderActivityFeed();
      }
    });
  },

  updateMember(member) {
    if (!STATE.firebaseDB) return;
    STATE.firebaseDB.ref(`team/${member.id}`).set(member);
  },

  pushActivity(activity) {
    if (!STATE.firebaseDB) return;
    STATE.firebaseDB.ref('activities').push(activity);
  },

  testConnection() {
    if (!CONFIG.firebase.apiKey) {
      UI.setFirebaseStatus('Fill in all Firebase config fields first', 'error');
      return;
    }
    this.init();
  },
};

/* ─────────────────────────────────────────────────────────────
   7. UTILITIES
───────────────────────────────────────────────────────────── */
function getMember(id) { return STATE.team.find(m => m.id === id); }

function formatTime(date) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function now() { return new Date(); }

function dateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isSameDay(a, b) { return dateKey(a) === dateKey(b); }

function generateId() { return 'tm' + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }

/* ─────────────────────────────────────────────────────────────
   8. STATUS MANAGEMENT
───────────────────────────────────────────────────────────── */
function checkIn(memberId, note = '') {
  const member = getMember(memberId);
  if (!member) return;

  member.status = 'working';
  member.checkInTime  = now().toISOString();
  member.checkOutTime = null;

  addActivity('checkin', member, note);
  Discord.send('checkin', member, note);
  if (STATE.firebaseDB) Firebase.updateMember(member);
  saveState();
  renderAll();
  showToast(`${member.name} checked in`, 'success');
}

function checkOut(memberId, note = '') {
  const member = getMember(memberId);
  if (!member) return;

  // Calculate worked minutes
  if (member.checkInTime) {
    const minutes = Math.round((now() - new Date(member.checkInTime)) / 60000);
    member.totalMinutesToday = (member.totalMinutesToday || 0) + minutes;
  }

  member.status      = 'offline';
  member.checkOutTime = now().toISOString();

  addActivity('checkout', member, note);
  Discord.send('checkout', member, note);
  if (STATE.firebaseDB) Firebase.updateMember(member);
  saveState();
  renderAll();
  showToast(`${member.name} checked out`, 'info');
}

function setStatus(memberId, status, note = '') {
  const member = getMember(memberId);
  if (!member) return;

  const prevStatus = member.status;

  // Auto check-in if going from offline to working
  if (status === 'working' && prevStatus === 'offline') {
    member.checkInTime = now().toISOString();
  }

  member.status = status;

  const actionMap = { working: 'checkin', break: 'break', leave: 'leave', offline: 'checkout' };
  addActivity(actionMap[status] || status, member, note);
  Discord.send(actionMap[status] || status, member, note);
  if (STATE.firebaseDB) Firebase.updateMember(member);
  saveState();
  renderAll();
  showToast(`${member.name} → ${status.charAt(0).toUpperCase()+status.slice(1)}`, 'success');
}

/* ─────────────────────────────────────────────────────────────
   9. ACTIVITY LOG
───────────────────────────────────────────────────────────── */
function addActivity(action, member, note = '') {
  const activity = {
    id:        Date.now(),
    memberId:  member.id,
    memberName: member.name,
    action,
    note,
    timestamp: Date.now(),
    timeStr:   formatTime(now()),
  };
  STATE.activities.unshift(activity);
  if (STATE.activities.length > 100) STATE.activities.splice(100);
  if (STATE.firebaseDB) Firebase.pushActivity(activity);
  renderActivityFeed();
}

/* ─────────────────────────────────────────────────────────────
   10. RENDER — DASHBOARD
───────────────────────────────────────────────────────────── */
function renderDashboard() {
  // Stats
  const counts = { working: 0, break: 0, leave: 0, offline: 0 };
  STATE.team.forEach(m => { if (counts[m.status] !== undefined) counts[m.status]++; });

  document.getElementById('statWorking').textContent = counts.working;
  document.getElementById('statBreak').textContent   = counts.break;
  document.getElementById('statLeave').textContent   = counts.leave;
  document.getElementById('statOffline').textContent = counts.offline;
  document.getElementById('onlineCount').textContent = counts.working + counts.break;
  document.getElementById('teamCountBadge').textContent = `${STATE.team.length} member${STATE.team.length !== 1 ? 's' : ''}`;

  // Quick team list
  const list = document.getElementById('quickTeamList');
  list.innerHTML = STATE.team.map(m => {
    const minutes = calcWorkedMinutes(m);
    const checkinStr = m.checkInTime ? formatTime(m.checkInTime) : '—';
    return `
      <div class="quick-member" onclick="openCheckinModal('${m.id}')">
        <div class="member-avatar" style="background:linear-gradient(135deg,${m.color},${m.color}aa)">${m.initials}</div>
        <div class="member-name-info">
          <div class="name">${m.name}</div>
          <div class="role">${m.role}</div>
        </div>
        <div class="member-time-info">
          <div class="checkin-time">${checkinStr}</div>
          <div class="hours-worked">${minutes > 0 ? formatDuration(minutes) : ''}</div>
        </div>
        <div class="status-dot ${m.status}"></div>
      </div>`;
  }).join('');
}

function renderActivityFeed() {
  const list = document.getElementById('activityList');
  if (!STATE.activities.length) {
    list.innerHTML = '<div class="empty-state">No activity yet today</div>';
    return;
  }
  const labels = { checkin: 'checked in', checkout: 'checked out', break: 'went on break', leave: 'is on leave', added: 'was added to the team' };
  list.innerHTML = STATE.activities.slice(0, 30).map(a => `
    <div class="activity-item">
      <div class="activity-dot ${a.action}"></div>
      <div class="activity-text"><strong>${a.memberName}</strong> ${labels[a.action] || a.action}${a.note ? ` — ${a.note}` : ''}</div>
      <span class="activity-time">${a.timeStr}</span>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────
   11. RENDER — 24H TIMELINE
───────────────────────────────────────────────────────────── */
function renderTimeline() {
  const memberLabels = document.getElementById('tlMemberLabels');
  const tracks       = document.getElementById('tlTracks');
  const hourLabels   = document.getElementById('tlHourLabels');
  const dateLabel    = document.getElementById('tlDateLabel');

  // Date label
  const today    = new Date();
  const isToday  = isSameDay(STATE.timelineDate, today);
  const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  dateLabel.textContent = isToday ? 'Today' : fmt.format(STATE.timelineDate);

  // Hour labels
  hourLabels.innerHTML = Array.from({length: 24}, (_, i) =>
    `<div class="tl-hour-label">${String(i).padStart(2,'0')}</div>`
  ).join('');

  // Member rows + track rows
  memberLabels.innerHTML = '';
  // Remove old track rows (keep the time indicator)
  const timeIndicator = document.getElementById('tlCurrentTime');
  tracks.innerHTML = '';
  tracks.appendChild(timeIndicator);

  STATE.team.forEach(m => {
    // Member label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'tl-member-row-label';
    labelDiv.innerHTML = `
      <div class="member-avatar" style="background:linear-gradient(135deg,${m.color},${m.color}bb)">${m.initials}</div>
      <div>
        <div class="tl-name">${m.name}</div>
        <div class="tl-role">${m.role}</div>
      </div>`;
    memberLabels.appendChild(labelDiv);

    // Track row
    const row = document.createElement('div');
    row.className = 'tl-track-row';

    // Hour grid cells (background)
    for (let h = 0; h < 24; h++) {
      const cell = document.createElement('div');
      cell.className = 'tl-hour-cell';
      row.appendChild(cell);
    }

    const dayOfWeek = STATE.timelineDate.getDay();
    const isWorkDay = m.shift.days.includes(dayOfWeek);

    if (isWorkDay) {
      // Scheduled shift block (dashed/ghost)
      const sBlock = document.createElement('div');
      sBlock.className = 'tl-shift-block scheduled';
      const sStart = (m.shift.start / 24) * 100;
      const sDur   = ((m.shift.end - m.shift.start) / 24) * 100;
      sBlock.style.left  = `${sStart}%`;
      sBlock.style.width = `${sDur}%`;
      sBlock.title = `Scheduled: ${String(m.shift.start).padStart(2,'0')}:00 – ${String(m.shift.end % 24 || 24).padStart(2,'0')}:00`;
      row.appendChild(sBlock);

      // Actual worked block (if checked in)
      if (m.checkInTime && isToday) {
        const checkInDate = new Date(m.checkInTime);
        const checkInHour = checkInDate.getHours() + checkInDate.getMinutes() / 60;

        let endHour;
        if (m.checkOutTime) {
          const checkOutDate = new Date(m.checkOutTime);
          endHour = checkOutDate.getHours() + checkOutDate.getMinutes() / 60;
        } else {
          const n = now();
          endHour = n.getHours() + n.getMinutes() / 60;
        }

        const statusColors = { working: m.color, break: '#f59e0b', leave: '#ef4444', offline: '#374151' };
        const aBlock = document.createElement('div');
        aBlock.className = 'tl-shift-block';
        aBlock.style.left    = `${(checkInHour / 24) * 100}%`;
        aBlock.style.width   = `${((endHour - checkInHour) / 24) * 100}%`;
        aBlock.style.background = `linear-gradient(90deg, ${statusColors[m.status] || m.color}cc, ${statusColors[m.status] || m.color}66)`;
        aBlock.style.boxShadow  = `0 2px 8px ${statusColors[m.status] || m.color}44`;
        aBlock.title = `${m.name}: ${formatTime(m.checkInTime)} – ${m.checkOutTime ? formatTime(m.checkOutTime) : 'Now'}`;
        aBlock.textContent = m.status === 'working' ? `● ${m.name}` : `${m.status}`;
        row.appendChild(aBlock);
      }
    }

    tracks.appendChild(row);
  });

  // Current time indicator (only for today)
  if (isToday) {
    const n = now();
    const pct = ((n.getHours() + n.getMinutes() / 60) / 24) * 100;
    timeIndicator.style.left    = `${pct}%`;
    timeIndicator.style.display = 'block';
  } else {
    timeIndicator.style.display = 'none';
  }
}

/* ─────────────────────────────────────────────────────────────
   12. RENDER — CALENDAR
───────────────────────────────────────────────────────────── */
function renderCalendar() {
  const month = STATE.calendarMonth;
  const title = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month);
  document.getElementById('calMonthTitle').textContent = title;

  const firstDay  = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay   = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startPad  = firstDay.getDay(); // 0 = Sunday
  const grid      = document.getElementById('calGrid');
  const today     = new Date();

  grid.innerHTML = '';

  // Pad start
  for (let i = 0; i < startPad; i++) {
    const day = new Date(firstDay);
    day.setDate(day.getDate() - (startPad - i));
    grid.appendChild(buildCalDay(day, true, today));
  }

  // Month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const day = new Date(month.getFullYear(), month.getMonth(), d);
    grid.appendChild(buildCalDay(day, false, today));
  }

  // Pad end
  const total = startPad + lastDay.getDate();
  const endPad = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= endPad; i++) {
    const day = new Date(lastDay);
    day.setDate(day.getDate() + i);
    grid.appendChild(buildCalDay(day, true, today));
  }
}

function buildCalDay(date, otherMonth, today) {
  const cell = document.createElement('div');
  cell.className = 'cal-day';
  if (otherMonth)           cell.classList.add('other-month');
  if (isSameDay(date,today)) cell.classList.add('today');
  if (isSameDay(date, STATE.selectedCalDate)) cell.classList.add('selected');

  const dayOfWeek = date.getDay();
  const membersWorking = STATE.team.filter(m => m.shift.days.includes(dayOfWeek));

  const dotsHtml = membersWorking.slice(0, 6).map(m =>
    `<span class="cal-dot" style="background:${m.color}" title="${m.name}"></span>`
  ).join('');

  cell.innerHTML = `<span class="cal-day-num">${date.getDate()}</span><div class="cal-dots">${dotsHtml}</div>`;
  cell.addEventListener('click', () => selectCalDay(date));
  return cell;
}

function selectCalDay(date) {
  STATE.selectedCalDate = date;
  renderCalendar();
  renderDayDetail(date);
}

function renderDayDetail(date) {
  const fmt  = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('dayDetailTitle').textContent = fmt.format(date);

  const dayOfWeek  = date.getDay();
  const isToday    = isSameDay(date, new Date());
  const members    = STATE.team.filter(m => m.shift.days.includes(dayOfWeek));
  const list       = document.getElementById('dayShiftsList');

  if (!members.length) {
    list.innerHTML = '<div class="empty-state">No shifts scheduled for this day</div>';
    return;
  }

  list.innerHTML = members.map(m => {
    const startHr = String(m.shift.start).padStart(2,'0');
    const endHr   = String(m.shift.end % 24 || 24).padStart(2,'0');
    const statusBadge = isToday
      ? `<span class="status-badge ${m.status}">${m.status}</span>`
      : '';
    return `
      <div class="day-shift-item">
        <div class="day-shift-avatar" style="background:linear-gradient(135deg,${m.color},${m.color}aa)">${m.initials}</div>
        <div class="day-shift-info">
          <div class="name">${m.name}</div>
          <div class="time">${startHr}:00 – ${endHr}:00 · ${m.role}</div>
        </div>
        ${statusBadge}
      </div>`;
  }).join('');
}

/* ─────────────────────────────────────────────────────────────
   13. RENDER — TEAM GRID
───────────────────────────────────────────────────────────── */
function renderTeamGrid() {
  const grid    = document.getElementById('teamGrid');
  const filter  = STATE.teamFilter;
  const visible = filter === 'all' ? STATE.team : STATE.team.filter(m => m.status === filter);

  if (!visible.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">No team members match this filter</div>';
    return;
  }

  grid.innerHTML = visible.map(m => {
    const minutes    = calcWorkedMinutes(m);
    const checkinStr = m.checkInTime  ? formatTime(m.checkInTime)  : '—';
    const shiftStr   = `${String(m.shift.start).padStart(2,'0')}:00 – ${String(m.shift.end % 24||24).padStart(2,'0')}:00`;
    const dayNames   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const daysStr    = m.shift.days.map(d => dayNames[d]).join(' ');

    return `
      <div class="glass-card member-card" id="card-${m.id}">
        <div class="member-card-top">
          <div class="member-avatar" style="background:linear-gradient(135deg,${m.color},${m.color}aa);width:48px;height:48px;font-size:.9rem">${m.initials}</div>
          <div class="member-card-meta">
            <div class="mc-name">${m.name}</div>
            <div class="mc-role">${m.role}</div>
          </div>
          <span class="status-badge ${m.status}">${m.status}</span>
        </div>
        <div class="member-stats">
          <div class="member-stat-item">
            <div class="ms-label">Shift</div>
            <div class="ms-value" style="font-size:.78rem">${shiftStr}</div>
          </div>
          <div class="member-stat-item">
            <div class="ms-label">Days</div>
            <div class="ms-value" style="font-size:.78rem">${daysStr}</div>
          </div>
          <div class="member-stat-item">
            <div class="ms-label">Checked In</div>
            <div class="ms-value">${checkinStr}</div>
          </div>
          <div class="member-stat-item">
            <div class="ms-label">Hours Today</div>
            <div class="ms-value">${minutes > 0 ? formatDuration(minutes) : '—'}</div>
          </div>
        </div>
        <div class="member-card-actions">
          <button class="btn-status btn-working ${m.status==='working'?'active':''}" onclick="setStatus('${m.id}','working')">Working</button>
          <button class="btn-status btn-break   ${m.status==='break'?'active':''}"   onclick="setStatus('${m.id}','break')">Break</button>
          <button class="btn-status btn-leave   ${m.status==='leave'?'active':''}"   onclick="setStatus('${m.id}','leave')">Leave</button>
          <button class="btn-status btn-checkout" onclick="checkOut('${m.id}')">Check Out</button>
        </div>
      </div>`;
  }).join('');
}

/* ─────────────────────────────────────────────────────────────
   14. WORKED MINUTES CALCULATOR
───────────────────────────────────────────────────────────── */
function calcWorkedMinutes(member) {
  let total = member.totalMinutesToday || 0;
  if (member.checkInTime && member.status !== 'offline') {
    const start = new Date(member.checkInTime);
    total += Math.round((now() - start) / 60000);
  }
  return total;
}

/* ─────────────────────────────────────────────────────────────
   15. RENDER — SETTINGS
───────────────────────────────────────────────────────────── */
function loadSettingsUI() {
  // Discord
  document.getElementById('discordEnabled').checked   = CONFIG.discord.enabled;
  document.getElementById('discordWebhook').value     = CONFIG.discord.webhookUrl || '';
  document.getElementById('discordRole').value        = CONFIG.discord.role || '';
  document.getElementById('notifyCheckin').checked    = CONFIG.discord.notifyCheckin;
  document.getElementById('notifyCheckout').checked   = CONFIG.discord.notifyCheckout;
  document.getElementById('notifyBreak').checked      = CONFIG.discord.notifyBreak;
  document.getElementById('notifyLeave').checked      = CONFIG.discord.notifyLeave;

  // Firebase
  document.getElementById('firebaseEnabled').checked  = CONFIG.firebase.enabled;
  document.getElementById('fbApiKey').value           = CONFIG.firebase.apiKey || '';
  document.getElementById('fbAuthDomain').value       = CONFIG.firebase.authDomain || '';
  document.getElementById('fbDatabaseURL').value      = CONFIG.firebase.databaseURL || '';
  document.getElementById('fbProjectId').value        = CONFIG.firebase.projectId || '';
  document.getElementById('fbStorageBucket').value    = CONFIG.firebase.storageBucket || '';
  document.getElementById('fbAppId').value            = CONFIG.firebase.appId || '';
}

function saveDiscordSettings() {
  CONFIG.discord.enabled        = document.getElementById('discordEnabled').checked;
  CONFIG.discord.webhookUrl     = document.getElementById('discordWebhook').value.trim();
  CONFIG.discord.role           = document.getElementById('discordRole').value.trim();
  CONFIG.discord.notifyCheckin  = document.getElementById('notifyCheckin').checked;
  CONFIG.discord.notifyCheckout = document.getElementById('notifyCheckout').checked;
  CONFIG.discord.notifyBreak    = document.getElementById('notifyBreak').checked;
  CONFIG.discord.notifyLeave    = document.getElementById('notifyLeave').checked;
  saveState();
  showToast('Discord settings saved', 'success');
}

function saveFirebaseSettings() {
  CONFIG.firebase.enabled          = document.getElementById('firebaseEnabled').checked;
  CONFIG.firebase.apiKey           = document.getElementById('fbApiKey').value.trim();
  CONFIG.firebase.authDomain       = document.getElementById('fbAuthDomain').value.trim();
  CONFIG.firebase.databaseURL      = document.getElementById('fbDatabaseURL').value.trim();
  CONFIG.firebase.projectId        = document.getElementById('fbProjectId').value.trim();
  CONFIG.firebase.storageBucket    = document.getElementById('fbStorageBucket').value.trim();
  CONFIG.firebase.appId            = document.getElementById('fbAppId').value.trim();
  saveState();
  if (CONFIG.firebase.enabled) Firebase.init();
  else showToast('Firebase settings saved (disabled)', 'info');
}

/* ─────────────────────────────────────────────────────────────
   16. RENDER ALL
───────────────────────────────────────────────────────────── */
function renderAll() {
  renderDashboard();
  renderTimeline();
  renderCalendar();
  renderTeamGrid();
  renderDayDetail(STATE.selectedCalDate);
  populateCheckinSelect();
}

/* ─────────────────────────────────────────────────────────────
   17. CHECK-IN MODAL
───────────────────────────────────────────────────────────── */
function populateCheckinSelect() {
  const sel = document.getElementById('checkinMemberSelect');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Select a member...</option>' +
    STATE.team.map(m => `<option value="${m.id}" ${m.id===cur?'selected':''}>${m.name} — ${m.status}</option>`).join('');
}

function openCheckinModal(memberId = '') {
  document.getElementById('checkinOverlay').classList.remove('hidden');
  populateCheckinSelect();
  if (memberId) {
    document.getElementById('checkinMemberSelect').value = memberId;
    updateMemberPreview(memberId);
  }
}

function closeCheckinModal() {
  document.getElementById('checkinOverlay').classList.add('hidden');
  document.getElementById('checkinNote').value = '';
  document.getElementById('memberPreview').style.display = 'none';
  document.getElementById('checkinMemberSelect').value = '';
}

function updateMemberPreview(memberId) {
  const member = getMember(memberId);
  const preview = document.getElementById('memberPreview');
  if (!member) { preview.style.display = 'none'; return; }
  preview.style.display = 'flex';
  document.getElementById('previewAvatar').style.background = `linear-gradient(135deg,${member.color},${member.color}aa)`;
  document.getElementById('previewAvatar').textContent = member.initials;
  document.getElementById('previewName').textContent   = member.name;
  document.getElementById('previewRole').textContent   = member.role;
  document.getElementById('previewStatus').className   = `status-badge ${member.status}`;
  document.getElementById('previewStatus').textContent = member.status;
}

function confirmCheckin() {
  const memberId = document.getElementById('checkinMemberSelect').value;
  const note     = document.getElementById('checkinNote').value.trim();
  const action   = STATE.checkinAction;

  if (!memberId) { showToast('Please select a team member', 'warning'); return; }

  switch (action) {
    case 'checkin':  checkIn(memberId, note);              break;
    case 'checkout': checkOut(memberId, note);             break;
    case 'break':    setStatus(memberId, 'break', note);   break;
    case 'leave':    setStatus(memberId, 'leave', note);   break;
  }
  closeCheckinModal();
}

/* ─────────────────────────────────────────────────────────────
   18. ADD MEMBER MODAL
───────────────────────────────────────────────────────────── */
function openAddMemberModal() {
  document.getElementById('addMemberOverlay').classList.remove('hidden');
  STATE.addMemberDays  = [1,2,3,4,5];
  STATE.addMemberColor = '#6366f1';
  document.getElementById('newMemberName').value  = '';
  document.getElementById('newMemberRole').value  = '';
  document.getElementById('newShiftStart').value  = '9';
  document.getElementById('newShiftEnd').value    = '17';
}

function closeAddMemberModal() {
  document.getElementById('addMemberOverlay').classList.add('hidden');
}

function confirmAddMember() {
  const name  = document.getElementById('newMemberName').value.trim();
  const role  = document.getElementById('newMemberRole').value.trim();
  const start = parseInt(document.getElementById('newShiftStart').value, 10);
  const end   = parseInt(document.getElementById('newShiftEnd').value, 10);

  if (!name || !role) { showToast('Please fill in name and role', 'warning'); return; }
  if (isNaN(start) || isNaN(end) || start >= end) { showToast('Invalid shift hours', 'warning'); return; }

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  const member = {
    id:               generateId(),
    name,
    role,
    initials,
    color:            STATE.addMemberColor,
    status:           'offline',
    checkInTime:      null,
    checkOutTime:     null,
    totalMinutesToday: 0,
    shift: { start, end, days: [...STATE.addMemberDays] },
  };

  STATE.team.push(member);
  addActivity('added', member);
  Discord.send('added', member);
  if (STATE.firebaseDB) Firebase.updateMember(member);
  saveState();
  renderAll();
  closeAddMemberModal();
  showToast(`${name} added to team!`, 'success');
}

/* ─────────────────────────────────────────────────────────────
   19. UI HELPERS
───────────────────────────────────────────────────────────── */
const UI = {
  setFirebaseStatus(msg, type) {
    const el = document.getElementById('firebaseStatus');
    el.textContent  = msg;
    el.className    = `firebase-status ${type}`;
  },
};

function navigateTo(section) {
  STATE.currentSection = section;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });

  // Show section
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${section}`);
  if (target) target.classList.add('active');

  // Page title
  const titles = { dashboard: 'Dashboard', timeline: '24h Timeline', calendar: 'Calendar', team: 'Team Members', settings: 'Settings' };
  document.getElementById('pageTitle').textContent = titles[section] || section;

  // Render for this section
  if (section === 'timeline')  renderTimeline();
  if (section === 'calendar')  { renderCalendar(); renderDayDetail(STATE.selectedCalDate); }
  if (section === 'team')      renderTeamGrid();
  if (section === 'settings')  loadSettingsUI();
}

/* ─────────────────────────────────────────────────────────────
   20. TOAST NOTIFICATIONS
───────────────────────────────────────────────────────────── */
const ICONS = {
  success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info:    `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${ICONS[type] || ICONS.info}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ─────────────────────────────────────────────────────────────
   21. LIVE CLOCK
───────────────────────────────────────────────────────────── */
function updateClock() {
  const n   = new Date();
  const timeStr = n.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  document.getElementById('liveClock').textContent = timeStr;
  document.getElementById('liveDate').textContent  = dateStr;

  // Update timeline indicator every minute
  const indicator = document.getElementById('tlCurrentTime');
  if (indicator && isSameDay(STATE.timelineDate, n)) {
    const pct = ((n.getHours() + n.getMinutes() / 60) / 24) * 100;
    indicator.style.left = `${pct}%`;
  }
}

/* ─────────────────────────────────────────────────────────────
   22. DATA EXPORT / IMPORT / RESET
───────────────────────────────────────────────────────────── */
function exportData() {
  const data = { team: STATE.team, activities: STATE.activities, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `team-tracker-${dateKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported', 'success');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.team) STATE.team = data.team;
      if (data.activities) STATE.activities = data.activities;
      saveState();
      renderAll();
      showToast('Data imported successfully', 'success');
    } catch {
      showToast('Invalid JSON file', 'error');
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm('Reset all data? This cannot be undone.')) return;
  STATE.team       = JSON.parse(JSON.stringify(DEFAULT_TEAM));
  STATE.activities = [];
  saveState();
  renderAll();
  showToast('Data reset to defaults', 'info');
}

/* ─────────────────────────────────────────────────────────────
   23. EVENT LISTENERS
───────────────────────────────────────────────────────────── */
function bindEvents() {
  // Nav items
  document.querySelectorAll('.nav-item').forEach(btn =>
    btn.addEventListener('click', () => navigateTo(btn.dataset.section))
  );

  // Mobile menu
  document.getElementById('menuToggle').addEventListener('click', () =>
    document.getElementById('sidebar').classList.toggle('open')
  );

  // Check-in modal
  document.getElementById('openCheckinBtn').addEventListener('click', () => openCheckinModal());
  document.getElementById('closeCheckinModal').addEventListener('click', closeCheckinModal);
  document.getElementById('cancelCheckinBtn').addEventListener('click', closeCheckinModal);
  document.getElementById('confirmCheckinBtn').addEventListener('click', confirmCheckin);

  document.getElementById('checkinOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCheckinModal();
  });

  // Action tabs in check-in modal
  document.querySelectorAll('.action-tab').forEach(tab =>
    tab.addEventListener('click', () => {
      document.querySelectorAll('.action-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      STATE.checkinAction = tab.dataset.action;
    })
  );

  // Member select in modal
  document.getElementById('checkinMemberSelect').addEventListener('change', (e) =>
    updateMemberPreview(e.target.value)
  );

  // Add member modal
  document.getElementById('addMemberBtn').addEventListener('click', openAddMemberModal);
  document.getElementById('closeAddMemberModal').addEventListener('click', closeAddMemberModal);
  document.getElementById('cancelAddMemberBtn').addEventListener('click', closeAddMemberModal);
  document.getElementById('confirmAddMemberBtn').addEventListener('click', confirmAddMember);
  document.getElementById('addMemberOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddMemberModal();
  });

  // Day picker in add modal
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = parseInt(btn.dataset.day, 10);
      btn.classList.toggle('active');
      if (btn.classList.contains('active')) {
        if (!STATE.addMemberDays.includes(day)) STATE.addMemberDays.push(day);
      } else {
        STATE.addMemberDays = STATE.addMemberDays.filter(d => d !== day);
      }
    });
  });

  // Color picker in add modal
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.addMemberColor = btn.dataset.color;
    });
  });

  // Team filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab =>
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      STATE.teamFilter = tab.dataset.filter;
      renderTeamGrid();
    })
  );

  // Timeline navigation
  document.getElementById('tl-prev-day').addEventListener('click', () => {
    STATE.timelineDate.setDate(STATE.timelineDate.getDate() - 1);
    renderTimeline();
  });
  document.getElementById('tl-next-day').addEventListener('click', () => {
    STATE.timelineDate.setDate(STATE.timelineDate.getDate() + 1);
    renderTimeline();
  });

  // Calendar navigation
  document.getElementById('calPrevMonth').addEventListener('click', () => {
    STATE.calendarMonth.setMonth(STATE.calendarMonth.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('calNextMonth').addEventListener('click', () => {
    STATE.calendarMonth.setMonth(STATE.calendarMonth.getMonth() + 1);
    renderCalendar();
  });

  // Settings
  document.getElementById('saveDiscordBtn').addEventListener('click', saveDiscordSettings);
  document.getElementById('testDiscordBtn').addEventListener('click', () => Discord.test());
  document.getElementById('saveFirebaseBtn').addEventListener('click', saveFirebaseSettings);
  document.getElementById('testFirebaseBtn').addEventListener('click', () => Firebase.testConnection());

  // Data management
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
  document.getElementById('importDataBtn').addEventListener('click', () =>
    document.getElementById('importFileInput').click()
  );
  document.getElementById('importFileInput').addEventListener('change', (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
  });
  document.getElementById('resetDataBtn').addEventListener('click', resetData);

  // Clear activity
  document.getElementById('clearActivityBtn').addEventListener('click', () => {
    STATE.activities = [];
    saveState();
    renderActivityFeed();
  });
}

/* ─────────────────────────────────────────────────────────────
   24. INITIALIZATION
───────────────────────────────────────────────────────────── */
function init() {
  loadState();
  bindEvents();
  updateClock();
  setInterval(updateClock, 1000);

  // Auto-refresh timeline & worked hours every 60s
  setInterval(() => {
    if (STATE.currentSection === 'dashboard') renderDashboard();
    if (STATE.currentSection === 'timeline')  renderTimeline();
  }, 60000);

  // Initial render
  renderAll();
  renderDayDetail(STATE.selectedCalDate);

  // Init Firebase if enabled
  if (CONFIG.firebase.enabled && CONFIG.firebase.apiKey) Firebase.init();

  console.log('%c Support Team Tracker loaded ', 'background:#6366f1;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold;');
}

// Boot
document.addEventListener('DOMContentLoaded', init);
