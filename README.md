# Support Team Tracker

A fully-featured support team management SPA with a glassmorphism dark UI. Track shifts, statuses, check-ins, and keep your team coordinated in real time — all in a single `index.html`.

## Features

| Feature | Details |
|---------|---------|
| **Live Dashboard** | Stats, quick team list, and filterable activity feed updated every 30 s |
| **24h Timeline** | Visual shift timeline per member with overnight-shift support and current-time indicator |
| **Interactive Calendar** | Monthly view showing who works each day; click any day for shift details |
| **Live Status** | Working · Break · Leave · Offline with instant updates |
| **Check-In / Check-Out** | Log attendance with optional notes and worked-hours tracking |
| **Add / Edit / Remove Members** | Full CRUD for team members with name, role, shift, work days, and color |
| **Midnight Reset** | Offline members' daily counters reset automatically when the date rolls over |
| **Discord Notifications** | Rich embeds for every status change via webhook |
| **Firebase Realtime DB** | Optional real-time sync across all devices |
| **Data Export / Import** | JSON backup and restore |
| **XSS-safe rendering** | All user-supplied strings are HTML-escaped before insertion |

---

## Quick Start

1. Open `index.html` in a modern browser — no build step, no dependencies.
2. The app loads with 6 sample team members stored in `localStorage`.
3. Use **Check In / Out** (top-right button) to update any member's status.
4. Click the **add-member icon** (top-right) to add new team members.

---

## File Structure

```
├── index.html   — App shell, layout, all modals
├── styles.css   — Glassmorphism dark theme, all component styles
├── app.js       — SPA logic, rendering, state, integrations
└── README.md    — This file
```

---

## Adding, Editing, and Removing Team Members

### Add a member
Click the **person+ icon** in the top-right header. Fill in name, role, shift hours, work days, and pick a color.

> **Overnight shifts** are supported — set Shift Start higher than Shift End (e.g. Start 22, End 06).

### Edit a member
Open the **Team** section. Each member card has an **Edit** button that opens a pre-filled modal. Change any field and click **Save Changes**.

### Remove a member
Each member card also has a **Remove** button. A confirmation prompt appears before the member is deleted.

---

## Discord Notifications Setup

1. In Discord, open your channel → **Edit Channel → Integrations → Webhooks → New Webhook**.
2. Copy the webhook URL.
3. In the app, navigate to **Settings → Discord Notifications**.
4. Paste the URL, toggle **Discord** ON, and choose which events to notify for.
5. Click **Test Notification** to verify, then **Save Discord Settings**.

### Notification events
- Check-In — member starts their shift
- Check-Out — member ends their shift
- Break — member goes on break
- Leave — member is absent

---

## Firebase Integration Setup

Firebase enables real-time sync so all open browser tabs and devices see live updates instantly.

1. Go to [Firebase Console](https://console.firebase.google.com/) → create a project.
2. Enable **Realtime Database** (choose a region; use **test mode** for development).
3. Go to **Project Settings → Your Apps → Add App (Web)** and copy the config values.
4. In the app, navigate to **Settings → Firebase Integration**.
5. Fill in all fields (API Key, Auth Domain, Database URL, Project ID, Storage Bucket, Messaging Sender ID, App ID).
6. Toggle **Firebase** ON and click **Save & Connect**.

The Firebase SDK scripts are already included in `index.html`. If Firebase is not needed, simply leave the toggle OFF.

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

## Team Member Data Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated unique identifier |
| `name` | string | Full name |
| `role` | string | Job title |
| `initials` | string | 2-letter avatar initials (derived from name) |
| `color` | hex | Avatar and timeline accent color |
| `status` | enum | `working` · `break` · `leave` · `offline` |
| `checkInTime` | ISO string | Last check-in timestamp |
| `checkOutTime` | ISO string | Last check-out timestamp |
| `totalMinutesToday` | number | Accumulated minutes worked today |
| `shift.start` | 0–23 | Shift start hour |
| `shift.end` | 0–23 | Shift end hour (can be less than start for overnight) |
| `shift.days` | number[] | Work days (0 = Sun … 6 = Sat) |

---

## Customisation

- **Default team**: edit the `DEFAULT_TEAM` array at the top of `app.js`.
- **Accent color**: change `--accent` in the `:root` block of `styles.css`.
- **Activity feed filter**: the dropdown above the feed lets you show only one member's events.

---

## Browser Support

Requires `backdrop-filter` support: Chrome 76+, Edge 79+, Firefox 103+, Safari 14+.

---

## License

MIT — free for personal and commercial use.
