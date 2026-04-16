# Support Team Tracker

A fully-featured support team management dashboard with a glassmorphism dark UI. Track shifts, statuses, check-ins, and keep your team coordinated in real time.

## Features

| Feature | Details |
|---------|---------|
| **24h Timeline** | Visual shift timeline per team member with current-time indicator |
| **Interactive Calendar** | Monthly view showing who works each day, click for shift details |
| **Live Status** | Working · Break · Leave · Offline with instant updates |
| **Check-In / Check-Out** | Log attendance with optional notes and worked-hours tracking |
| **Discord Notifications** | Rich embeds for every status change via webhook |
| **Firebase Integration** | Real-time sync across all devices (optional) |
| **Data Export / Import** | JSON backup and restore |
| **Glassmorphism UI** | Dark theme with backdrop blur, gradient accents, smooth animations |

---

## Quick Start

1. Open `index.html` in a modern browser — no build step needed.
2. The app loads with 6 sample team members.
3. Use **Check In / Out** (top-right button) to update any member's status.
4. Click **+ (add member icon)** to add new team members with custom shifts and colors.

---

## File Structure

```
├── index.html   — App shell, layout, modals
├── styles.css   — Glassmorphism dark theme, all components
├── app.js       — SPA logic, rendering, integrations
└── README.md    — This file
```

---

## Discord Notifications Setup

1. In Discord, go to your channel → **Edit Channel → Integrations → Webhooks → New Webhook**.
2. Copy the webhook URL.
3. In the app, navigate to **Settings → Discord Notifications**.
4. Paste the URL, toggle the switch ON, choose which events to notify for.
5. Click **Test Notification** to verify it works, then **Save Discord Settings**.

### Notification events
- ✅ Check-In — member starts their shift
- ✅ Check-Out — member ends their shift
- ✅ Break — member goes on break
- ✅ Leave — member is absent

---

## Firebase Integration Setup

Firebase enables real-time sync so all open browser tabs/devices see live updates.

### Steps

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a project.
2. Enable **Realtime Database** (choose a region, start in **test mode** for development).
3. Go to **Project Settings → Your Apps → Add App (Web)**.
4. Copy the config object values.
5. In the app, go to **Settings → Firebase Integration**.
6. Fill in all config fields and toggle **Firebase** ON.
7. Click **Save & Connect**.

### Enable Firebase SDK

Uncomment the two `<script>` lines at the bottom of `index.html`:

```html
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-database-compat.js"></script>
```

### Firebase Security Rules (production)

```json
{
  "rules": {
    "team": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "activities": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

## Team Member Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Full name |
| `role` | string | Job title |
| `initials` | string | 2-letter avatar initials |
| `color` | hex | Avatar / timeline color |
| `status` | enum | `working` · `break` · `leave` · `offline` |
| `checkInTime` | ISO string | Last check-in timestamp |
| `checkOutTime` | ISO string | Last check-out timestamp |
| `shift.start` | number | Shift start hour (0–23) |
| `shift.end` | number | Shift end hour (1–24) |
| `shift.days` | number[] | Work days (0=Sun … 6=Sat) |

---

## Customization

### Add default team members
Edit the `DEFAULT_TEAM` array at the top of `app.js`.

### Change accent color
Edit `--accent` in the `:root` block of `styles.css`.

### Adjust timeline hour width
Find `.tl-hour-label` in `styles.css` — the 24-column grid scales automatically.

---

## Browser Support

Works in all modern browsers that support `backdrop-filter`: Chrome 76+, Edge 79+, Firefox 103+, Safari 14+.

---

## License

MIT — free for personal and commercial use.
