# ✈️ EdgeFly 2.0

> **Smart, fast, and seamless flight search and management platform — powered by modern web technologies.**

---

## 🚀 Introduction

**EdgeFly** is a modern, intuitive web application designed to simplify the flight search experience.  
It provides real-time flight data, fast performance, and a clean UI built for global travelers and developers alike.

Built with scalability and modularity in mind, EdgeFly bridges the gap between **modern frontend experience** and **robust backend intelligence**.

> 🧩 _Version:_ `2.0`  
> 🧑‍💻 _Author:_ **Mohd Mudassir Hussain**<!-- CHANGE THIS: Your Name or Team -->  
> 🌐 _Website:_ https://edgefly.vercel.app/<!-- CHANGE THIS: Deployed URL if available -->

---

## 🌍 Overview

EdgeFly allows users to:

- 🔍 Search and compare flights from multiple airlines.
- 🧾 View detailed flight info, pricing, and timing.
- 💡 Experience smooth, responsive UI with real-time updates.
- 🧱 Use developer-friendly modular components.

> Designed for both **end-users** and **developers**, EdgeFly is built to be _extendable, efficient, and elegant._

---

## ⚙️ Architecture & Components

EdgeFly consists of two main components:

| Component  | Description                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| **Client** | Built with modern JavaScript frameworks for fast and dynamic UI rendering.                            |
| **Server** | Node.js + Express server for handling requests, API integration (e.g., Amadeus), and data management. |

### 🧱 Tech Stack

- **Frontend:** React.js, Tailwind CSS, Vite / Serve
- **Backend:** Node.js, Express.js
- **API:** Amadeus Flight API
- **Deployment:** Vercel (Client), Node Server (Backend)
- **Database:** PostgreSQL<!-- CHANGE THIS: MongoDB / PostgreSQL / etc. -->

---

## 🧩 Features

- 🔍 Real-time flight search
- ⚡ Optimized backend with Amadeus integration
- 💾 Clean architecture (Client–Server separation)
- 🧠 Developer-friendly code structure
- 📱 Responsive UI for desktop & mobile
- 🔄 Live filtering and sorting of flight results
- 🚀 Quick setup — ready to deploy

---

## 🗂️ Folder Structure

```bash
EdgeFly/
├── client/                # Frontend application
│   ├── src/               # React/Vite source files
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Backend Node.js/Express server
│   ├── src/               # Server-side logic, routes, controllers
│   ├── package.json
│   └── .env.example       # Example environment variables
│
├── README.md              # Project documentation
└── ...
```

---

## 🧰 Installation & Setup

### 📦 Prerequisites

Ensure you have the following installed:

- Node.js (>= 18)
- npm or yarn
- Internet access (for Amadeus API)

---

### 🖥️ Start Backend (in root directory)

```bash
cd server
npm run dev
```

### 💻 Start Frontend (in root directory)

```bash
npx serve client -l 3000
```

Once both are running:

- Server runs on: `http://localhost:5000` _(or configured port)_
- Client runs on: `http://localhost:3000`

---

## 🧑‍💻 Usage

1. Start both backend and frontend servers.
2. Open your browser at `http://localhost:3000`.
3. Use the search bar to find flights by entering:

   - Departure city
   - Destination city
   - Travel dates
   - Passenger count

4. Filter, sort, and select your preferred flight.

> 🔧 _Developers can extend the backend APIs or customize the client as needed._

---

## ⚡ Development Notes

- The project uses **modular architecture** for maintainability.
- API credentials for Amadeus should be added in `.env` (see `.env.example`).
- To rebuild after code changes:

  ```bash
  cd client
  npm run build
  ```

- Backend uses hot-reload for faster iteration.

---

## 🧱 Build & Deployment

### 🏗️ Build Client

```bash
cd client
npm run build
```

### 🚀 Deploy to Vercel (Frontend)

1. Push your repo to GitHub.
2. Connect it to Vercel.
3. Set build command to: `npm run build`
4. Output directory: `dist`

### ⚙️ Deploy Server (Backend)

Deploy backend to your preferred host:

- Render / Railway / DigitalOcean / AWS
- Ensure `.env` variables and Amadeus keys are set.

---

## 🌟 Highlights

✅ Modular, clean architecture

✅ Easy setup (run in minutes)

✅ Optimized for speed and scalability

✅ Developer-friendly, open source

✅ Real-time flight data integration

---

## 🤝 Contributing

We welcome contributions!
To contribute:

```bash
# 1. Fork this repo
# 2. Create your feature branch
git checkout -b feature/YourFeature
# 3. Commit your changes
git commit -m "Add new feature"
# 4. Push to the branch
git push origin feature/YourFeature
# 5. Open a Pull Request
```

> Please follow code style guidelines and comment important logic.

---

## 🧠 Frequently Asked Questions (FAQ)

### ❓ How do I search a flight?

Searching a flight on EdgeFly is simple.
Use the search bar on the homepage to enter your departure and destination cities, travel dates, and number of passengers.
Click **"Search"**, and our system (powered by Amadeus) will show the best available options.

---

### ❓ How does the flight search engine work?

Our flight search engine quickly scans available flights across multiple airlines and travel providers.
Enter your trip details, and EdgeFly displays all available options — filter or sort by price, duration, or departure times.

---

### ❓ Does the flight search engine show all airlines?

Yes, EdgeFly integrates with multiple airline APIs.
However, some low-cost or regional carriers may not appear.
Use filters to find flights from specific airlines.

<!-- ---

### ❓ How accurate are the flight prices?

Prices are accurate at search time but may change dynamically.
If any price changes before booking, users are notified immediately. -->

---

## 🧑‍💻 Developer Questions

#### ⚙️ Can I integrate my own API?

Yes. The backend is modular — you can add your own API under `/server/src/routes/` and adjust the configuration.

#### 💾 How do I change the environment configuration?

Edit or create a `.env` file in `/server`:

```bash
API_KEY=your_amadeus_api_key
PORT=5000
```

#### 🧱 Can I connect a database?

Absolutely. EdgeFly can be extended with MongoDB, PostgreSQL, or any REST/GraphQL database adapter.

#### 🔧 How can I deploy both frontend and backend together?

You can:

- Deploy backend (Node.js) on **Render**, **Railway**, or **AWS**
- Deploy frontend (static build) on **Vercel**
  Then connect your client `.env` or proxy to the backend API URL.

---

## 🧾 License

This project is licensed under the **MIT License**.
See the [LICENSE](./LICENSE) file for details.

---

## 📬 Contact / Support

- 🧑‍💻 Author: Mohd Mudassir Hussain<!-- CHANGE THIS: Your Name / Team Name -->
- 🌐 Website: https://www.mudassir725.xyz/<!-- CHANGE THIS: Your deployed site link -->
- 🐙 GitHub: https://github.com/mudassir-725 <!-- CHANGE THIS: Your GitHub profile or repo link -->
<!-- - 📧 Email:  -->

---

> 💡 _EdgeFly 2.0 — Built to make the world of travel smarter, faster, and lighter._
