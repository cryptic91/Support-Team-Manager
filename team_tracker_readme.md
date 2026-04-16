# 🚀 Support Team Tracker

A beautiful, modern team management dashboard with real-time status tracking, 24-hour visual timeline, and Discord notifications.

## ✨ Features

- 📅 **Interactive Calendar** - Month view with leave tracking
- ⏰ **24-Hour Visual Timeline** - See everyone's shifts at a glance
- 🟢 **Live Status Tracking** - Real-time team member status (Working, Break, Leave, Offline)
- 🔔 **Discord Notifications** - Instant updates when team members check in/out or mark leaves
- 📊 **Statistics Dashboard** - Quick overview of team availability
- 🎨 **Modern UI** - Glassmorphism design with smooth animations
- 📱 **Responsive** - Works perfectly on mobile and desktop

## 🛠️ Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Realtime Database**
4. Get your Firebase config from Project Settings
5. Replace the config in `index.html`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Discord Webhook Setup

1. Open your Discord server
2. Go to Server Settings → Integrations → Webhooks
3. Click "New Webhook"
4. Copy the Webhook URL
5. Replace in `app.js`:

```javascript
const DISCORD_WEBHOOK = 'YOUR_DISCORD_WEBHOOK_URL';
```

### 3. Run the App

**Option A: Using Claude Code**
```bash
# Simply open the project folder in Claude Code
# The app will run automatically
```

**Option B: Local Server**
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Then open: http://localhost:8000
```

**Option C: Deploy to Netlify/Vercel**
- Just drag and drop the folder to Netlify or Vercel
- Your app will be live in seconds!

## 📋 Usage

### For Team Members:

1. **Login** - Select your name from dropdown
2. **Check In** - Click "Check In" button when you start work
3. **Take Break** - Click "Take Break" when you need a break
4. **Mark Leave** - Click "Mark Leave" to request time off

### For Admin/Team Lead:

- Edit `teamMembers` array in `app.js` to add/remove members
- Modify shift timings
- View all team status in real-time
- Approve leaves (feature coming soon)

## 🎨 Customization

### Change Colors

Edit `styles.css` to customize:
- Background gradient
- Card colors
- Status colors

### Add More Team Members

Edit the `teamMembers` array in `app.js`:

```javascript
{ 
    id: 11, 
    name: 'New Member', 
    shift: '9:00 AM - 6:00 PM', 
    status: 'offline', 
    shiftStart: 9, 
    shiftEnd: 18 
}
```

### Modify Leave Types

Edit the `markLeave()` function in `app.js` to add/remove leave types.

## 📱 Mobile Support

The app is fully responsive and works great on:
- 📱 Mobile phones
- 📟 Tablets
- 💻 Desktops

## 🔮 Coming Soon

- [ ] Firebase integration (save data permanently)
- [ ] Admin panel for managing shifts
- [ ] Leave approval workflow
- [ ] Reports and analytics
- [ ] Email notifications
- [ ] Mobile app

## 🐛 Troubleshooting

**Discord notifications not working?**
- Make sure you replaced the webhook URL
- Check your Discord server permissions

**Timeline not showing correctly?**
- Check shift times in `teamMembers` array
- Ensure `shiftStart` and `shiftEnd` are correct (24-hour format)

**Calendar not displaying?**
- Check browser console for errors
- Make sure JavaScript is enabled

## 📄 License

Free to use for your team!

## 💬 Support

For questions or issues, contact your admin.

---

Made with ❤️ for Support Teams