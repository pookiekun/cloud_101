# Hunt Game Mode - Testing Guide

## 🗃️ Step 1: Apply Database Schema

1. Go to your **Supabase Dashboard** → SQL Editor
2. Open `supabase-hunt-complete.sql`
3. Copy all contents and paste into SQL Editor
4. Click **Run** to create all Hunt tables

## 🎮 Step 2: Test Event Creation

### Navigate to Hunt
1. Go to `http://localhost:5173/hunt`
2. Click **"Create Multi-Session Event"** button

### Fill in Event Form
1. **Event Name** (REQUIRED): Enter something like "CLOUD 101 Networking Night"
   - ⚠️ Button is disabled until you enter a name!
2. **Description** (Optional): "Fun AWS Hunt game for everyone"
3. **Architecture**: Choose Microservice or Management
4. **Sessions**: Use slider (try 6 sessions)
5. **Players per Session**: Use slider (try 10 players)
6. **Total Capacity**: Should show 60 players

### Create Event
- Click **"Create Event with 6 Sessions"**
- Should redirect to Event Dashboard

## 📊 Step 3: Test Event Dashboard

You should see:
- Event name and code (4 characters)
- Total players: 0
- Total sessions: 6
- Each session card with:
  - Session name (Session 1, Session 2, etc.)
  - Unique 6-character session code
  - Player count: 0/10
  - Status: lobby

### Test Session Code Copying
- Click copy icon next to any session code
- Should show "Session code copied!" toast

## 👥 Step 4: Test Joining a Session (Multi-Tab)

### Tab 1 (Organizer):
- Stay on Event Dashboard

### Tab 2 (Player 1):
1. Go to `/hunt`
2. Click **"Join Existing Session"**
3. Enter one of the **session codes** from dashboard (not event code!)
4. Click Join
5. Should see success

### Tab 3-5 (More Players):
- Repeat joining with same session code
- Need minimum 4 players per session

### Back to Tab 1:
- Refresh dashboard
- Should see player counts updating

## 🎯 Step 5: Test Starting Sessions

On Event Dashboard:
- Wait until at least one session has 4+ players
- Click **"Start All Ready Sessions"**
- Sessions with 4+ players should change to "active" status

## 🐛 Common Issues

### Button Disabled
- ✅ **Fix**: Enter an event name in the form

### Can't Create Event
- ✅ **Fix**: Apply `supabase-hunt-complete.sql` to Supabase
- ✅ Check Supabase SQL Editor for errors

### Join Fails
- ✅ Use **session code** (6 chars) not event code (4 chars)
- ✅ Make sure you're logged in

### Dashboard Shows 0 Players
- ✅ Refresh the page
- ✅ Check that you joined using correct session code

## ✅ Success Criteria

You've successfully tested when:
1. ✅ Event created with custom name
2. ✅ Dashboard shows all 6 sessions
3. ✅ Players can join specific sessions
4. ✅ Dashboard updates player counts
5. ✅ Can copy session codes
6. ✅ Can start ready sessions

## 🚀 What's Working

- ✅ Multi-session event creation
- ✅ Session code generation
- ✅ Event dashboard
- ✅ Player joining
- ✅ Session monitoring

## 🚧 Not Implemented Yet

- Hunter/response mechanics
- Card playing
- Win condition detection
- Real-time updates (need manual refresh)
