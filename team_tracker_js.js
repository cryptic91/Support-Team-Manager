// Team Tracker - Main Application Logic

// Global state
let currentUser = null;
let teamMembers = [
    { id: 1, name: 'Rakib Khan', shift: '6:00 AM - 3:00 PM', status: 'offline', shiftStart: 6, shiftEnd: 15 },
    { id: 2, name: 'Sakib Ahmed', shift: '9:00 AM - 6:00 PM', status: 'working', shiftStart: 9, shiftEnd: 18 },
    { id: 3, name: 'Emon Hassan', shift: '8:00 AM - 5:00 PM', status: 'pending', shiftStart: 8, shiftEnd: 17 },
    { id: 4, name: 'Karim Ali', shift: '2:00 PM - 11:00 PM', status: 'offline', shiftStart: 14, shiftEnd: 23 },
    { id: 5, name: 'Fahim Rahman', shift: '10:00 PM - 7:00 AM', status: 'leave', shiftStart: 22, shiftEnd: 7 },
    { id: 6, name: 'Tamim Iqbal', shift: '6:00 AM - 3:00 PM', status: 'offline', shiftStart: 6, shiftEnd: 15 },
    { id: 7, name: 'Labib Hasan', shift: '3:00 PM - 12:00 AM', status: 'break', shiftStart: 15, shiftEnd: 24 },
    { id: 8, name: 'Mehedi Khan', shift: '12:00 AM - 9:00 AM', status: 'offline', shiftStart: 0, shiftEnd: 9 },
    { id: 9, name: 'Rafi Ahmed', shift: '7:00 AM - 4:00 PM', status: 'offline', shiftStart: 7, shiftEnd: 16 },
    { id: 10, name: 'Shanto Islam', shift: '1:00 PM - 10:00 PM', status: 'offline', shiftStart: 13, shiftEnd: 22 },
];

// Discord Webhook URL - REPLACE WITH YOUR WEBHOOK
const DISCORD_WEBHOOK = 'YOUR_DISCORD_WEBHOOK_URL';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    populateUserSelect();
    updateClock();
    setInterval(updateClock, 1000);
});

// Populate user select dropdown
function populateUserSelect() {
    const select = document.getElementById('userSelect');
    teamMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        select.appendChild(option);
    });
}

// Login function
function login() {
    const select = document.getElementById('userSelect');
    const userId = parseInt(select.value);
    
    if (!userId) {
        alert('Please select your name');
        return;
    }
    
    currentUser = teamMembers.find(m => m.id === userId);
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainDashboard').classList.remove('hidden');
    document.getElementById('welcomeText').textContent = `Welcome back, ${currentUser.name}`;
    
    // Initialize dashboard
    updateDashboard();
    updateTimeline();
    renderCalendar();
    updateStats();
}

// Logout function
function logout() {
    currentUser = null;
    document.getElementById('mainDashboard').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('userSelect').value = '';
}

// Update live clock
function updateClock() {
    const now = new Date();
    const timeEl = document.getElementById('liveTime');
    const dateEl = document.getElementById('liveDate');
    
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // Update time indicator on timeline
    updateTimeIndicator();
}

// Update time indicator on timeline
function updateTimeIndicator() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const percentage = (totalMinutes / 1440) * 100; // 1440 minutes in a day
    
    const indicator = document.getElementById('timeIndicator');
    if (indicator) {
        indicator.style.left = `${percentage}%`;
    }
}

// Update dashboard
function updateDashboard() {
    renderTeamStatus();
    updateStats();
}

// Render team status list
function renderTeamStatus() {
    const container = document.getElementById('teamStatus');
    if (!container) return;
    
    container.innerHTML = teamMembers.map(member => `
        <div class="team-member-card">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full ${getStatusColor(member.status)} ${member.status === 'working' ? 'animate-pulse' : ''}"></div>
                <div>
                    <div class="text-white font-semibold">${member.name}</div>
                    <div class="text-gray-400 text-sm">${member.shift}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm font-medium ${getStatusTextColor(member.status)}">
                    ${getStatusIcon(member.status)} ${getStatusText(member.status)}
                </div>
            </div>
        </div>
    `).join('');
}

// Update statistics
function updateStats() {
    const working = teamMembers.filter(m => m.status === 'working').length;
    const pending = teamMembers.filter(m => m.status === 'pending').length;
    const onBreak = teamMembers.filter(m => m.status === 'break').length;
    const onLeave = teamMembers.filter(m => m.status === 'leave').length;
    
    document.getElementById('workingCount').textContent = working;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('breakCount').textContent = onBreak;
    document.getElementById('leaveCount').textContent = onLeave;
}

// Update 24-hour timeline
function updateTimeline() {
    const container = document.getElementById('timeline');
    if (!container) return;
    
    container.innerHTML = teamMembers.map(member => {
        const startPercent = (member.shiftStart / 24) * 100;
        const endPercent = (member.shiftEnd / 24) * 100;
        const width = member.shiftEnd > member.shiftStart 
            ? endPercent - startPercent 
            : (100 - startPercent) + endPercent;
        
        return `
            <div class="timeline-row">
                <div class="absolute left-0 top-0 bottom-0 flex items-center pl-2 text-xs text-gray-400 font-medium z-10">
                    ${member.name.split(' ')[0]}
                </div>
                <div class="timeline-segment status-${member.status}" 
                     style="left: ${startPercent}%; width: ${width}%">
                    ${getStatusIcon(member.status)}
                </div>
            </div>
        `;
    }).join('');
}

// Render calendar
function renderCalendar() {
    const container = document.getElementById('calendar');
    if (!container) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    let html = `
        <div class="mb-4">
            <h3 class="text-lg font-semibold">${monthName}</h3>
        </div>
        <div class="calendar-header">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="calendar-grid">
    `;
    
    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === now.getDate();
        const classes = isToday ? 'calendar-day today' : 'calendar-day';
        html += `<div class="${classes}">${day}</div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Helper functions
function getStatusColor(status) {
    const colors = {
        'working': 'bg-green-500',
        'pending': 'bg-yellow-500',
        'break': 'bg-orange-500',
        'offline': 'bg-gray-400',
        'leave': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-400';
}

function getStatusTextColor(status) {
    const colors = {
        'working': 'text-green-400',
        'pending': 'text-yellow-400',
        'break': 'text-orange-400',
        'offline': 'text-gray-400',
        'leave': 'text-red-400'
    };
    return colors[status] || 'text-gray-400';
}

function getStatusIcon(status) {
    const icons = {
        'working': '🟢',
        'pending': '🟡',
        'break': '☕',
        'offline': '⚪',
        'leave': '❌'
    };
    return icons[status] || '⚪';
}

function getStatusText(status) {
    const texts = {
        'working': 'Working',
        'pending': 'Not Checked In',
        'break': 'On Break',
        'offline': 'Offline',
        'leave': 'On Leave'
    };
    return texts[status] || 'Unknown';
}

// Action functions
function checkIn() {
    if (!currentUser) return;
    
    currentUser.status = 'working';
    updateDashboard();
    updateTimeline();
    updateStats();
    
    sendDiscordNotification(`🟢 ${currentUser.name} is now online - Shift: ${currentUser.shift}`);
    alert('✅ You are now checked in!');
}

function takeBreak() {
    if (!currentUser) return;
    
    if (currentUser.status === 'break') {
        currentUser.status = 'working';
        sendDiscordNotification(`🟢 ${currentUser.name} is back from break`);
        alert('✅ Welcome back from break!');
    } else {
        currentUser.status = 'break';
        sendDiscordNotification(`☕ ${currentUser.name} is taking a break`);
        alert('☕ Enjoy your break!');
    }
    
    updateDashboard();
    updateTimeline();
    updateStats();
}

function markLeave() {
    if (!currentUser) return;
    
    const leaveTypes = ['Eid Vacation', 'Sick Leave', 'Casual Leave', 'Govt Holiday Alt', 'Half Day - First Half', 'Half Day - Second Half'];
    const type = prompt(`Select leave type:\n${leaveTypes.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nEnter number (1-6):`);
    
    if (type && type >= 1 && type <= 6) {
        const leaveType = leaveTypes[type - 1];
        const date = prompt('Enter date (YYYY-MM-DD):');
        
        if (date) {
            sendDiscordNotification(`📅 ${currentUser.name} marked ${leaveType} for ${date}`);
            alert(`✅ Leave marked: ${leaveType} on ${date}`);
        }
    }
}

// Discord notification
async function sendDiscordNotification(message) {
    if (!DISCORD_WEBHOOK || DISCORD_WEBHOOK === 'YOUR_DISCORD_WEBHOOK_URL') {
        console.log('Discord notification:', message);
        return;
    }
    
    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch (error) {
        console.error('Discord notification failed:', error);
    }
}