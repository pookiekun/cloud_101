# CLOUD 101

**Learn. Connect. Bingo!**

A gamified networking platform for tech events and conferences.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **QR Scanning**: @zxing/browser
- **Animations**: Framer Motion
- **PWA**: vite-plugin-pwa

## 📱 Features

- **Bingo Grid**: 5x5 networking challenge grid
- **QR Code Scanning**: Quick connection via QR codes
- **Manual Code Entry**: Fallback connection method
- **My Network**: View and manage connections
- **Hunt Game Mode**: Multiplayer social deduction game
- **PWA Support**: Installable, works offline

## 🗄️ Database Setup

See [PRD](./cloud-101%20prd.md) for complete Supabase schema.

Key tables:
- `profiles` - User profiles and connection codes
- `connections` - User connections
- `bingo_grid` - Grid state per user
- `hunt_*` - Hunt game mode tables

## 📚 Documentation

- [PRD](./cloud-101%20prd.md) - Complete product requirements
- [Design Doc](./design%20doc.md) - UI/UX specifications
- [Tech Stack](./tech%20stack.md) - Technical implementation details
- [TODO](./TODO.md) - Development roadmap

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment!

## 📄 License

MIT

---

Built with ❤️ for the tech community
