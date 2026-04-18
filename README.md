# 🏡 Home Tasks

> A self-hosted household task manager for shared homes. Mobile-first, real-time, Docker-ready.

Built by [erv-2026](https://github.com/erequena81)

---

## ✨ Features

- 📋 Shared task list visible to all household members
- ✅ Tap to mark tasks as done — everyone sees it in real time
- 🔁 Recurring tasks (daily, every 2 days, weekly, as needed)
- 📌 One-time tasks that disappear the next day
- 🔢 Tasks that require multiple completions per day (e.g. feed the cat 3x)
- 🗂️ Organized by categories (Kitchen, Bathroom, Bedroom...)
- 📊 Stats per user — who's doing more? 😄
- 👤 Two user profiles, fully configurable (name + emoji)
- ⚙️ Manage tasks: add, edit, delete
- 📱 Mobile-first design, works great as a home screen web app

---

## 🚀 Quick Start

### Requirements
- Docker
- Docker Compose

### Run

```bash
git clone https://github.com/erequena81/home-tasks.git
cd home-tasks
docker compose up -d --build
```

Open your browser at **http://localhost:8081**

---

## 📱 Add to Home Screen (iPhone/Android)

1. Open the app in Safari or Chrome
2. Tap the share button
3. Select **"Add to Home Screen"**

The app will work like a native app, full screen.

---

## ⚙️ Configuration

Once inside the app, go to **Config** tab to:
- Set user names and avatars
- Add / edit / delete categories

---

## 🗂️ Project Structure
---

## 💾 Data Persistence

All data is stored in a JSON file inside a Docker volume (`/data/state.json`). No external database needed.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JS, HTML5, CSS3 (no frameworks)
- **Backend**: Node.js (no dependencies)
- **Storage**: JSON file via Docker volume
- **Container**: Docker + Docker Compose

---

## 📄 License

MIT — free to use, modify and share.

---

*Made with ❤️ by erv-2026*
