# Momentum + Notion MCP Integration Demo Script

## Overview
This demo showcases bidirectional task synchronization between Momentum and Notion using the Notion API integration.

---

## Pre-Demo Setup (Behind the Scenes)

### 1. Configure Environment
```bash
# In frontend/.env.local
NOTION_TOKEN=ntn_your_token_here
NOTION_DEFAULT_DATABASE_ID=your_database_id_here
```

### 2. Ensure Notion Database Has These Columns
- **Name** (Title) - Task title
- **Status** (Status) - "Not started", "In progress", "Done"
- **Priority** (Select) - "P0", "P1", "P2", "P3"
- **Description** (Text) - Task description
- **Due Date** (Text) - Due date
- **People** (Text) - Assignee

### 3. Start the Frontend
```bash
cd frontend
npm run dev
```

---

## Demo Flow

### Scene 1: Show the Empty Board (0:00 - 0:15)
**Action:** Open Momentum Tasks page at `http://localhost:3000/dashboard/proj-demo/tasks`

**Talking Points:**
- "This is Momentum - an AI-powered project management dashboard"
- "Notice our Kanban board is currently empty"
- "We have integration with Notion to sync tasks bidirectionally"

---

### Scene 2: Show Tasks Already in Notion (0:15 - 0:30)
**Action:** Switch to Notion and show your task database with existing tasks

**Talking Points:**
- "Here's our Notion database with several tasks already created"
- "Each task has a status, priority, description, and assignee"
- "Let's pull these into Momentum"

---

### Scene 3: Pull Tasks from Notion (0:30 - 1:00)
**Action:**
1. Switch back to Momentum
2. Click **"Pull from Notion"** button
3. Watch tasks appear on the Kanban board

**Talking Points:**
- "I'll click 'Pull from Notion' to sync our tasks"
- "Watch as the tasks flow in from Notion..."
- "Notice how the status maps correctly - 'Not started' becomes 'To Do', 'In progress' stays in 'In Progress'"
- "Priorities, descriptions, and assignees all come through"

---

### Scene 4: Create a New Task in Momentum (1:00 - 1:30)
**Action:**
1. Click **"New Task"** button
2. Enter: "Implement user authentication"
3. Set Priority: P1
4. Click Create

**Talking Points:**
- "Now let's create a new task directly in Momentum"
- "This task was created by our team during sprint planning"
- "It automatically syncs to Notion in the background"

---

### Scene 5: Push All Tasks to Notion (1:30 - 2:00)
**Action:**
1. Click **"Push to Notion"** button
2. Switch to Notion and refresh
3. Show the new task appeared

**Talking Points:**
- "Let's push all our tasks to ensure everything is synced"
- "Switching to Notion... and there's our new task!"
- "The bidirectional sync keeps both systems in perfect harmony"

---

### Scene 6: Drag Task to Done (2:00 - 2:30)
**Action:**
1. In Momentum, drag a task from "In Progress" to "Done"
2. Click "Push to Notion"
3. Show status updated in Notion

**Talking Points:**
- "As I complete this task in Momentum..."
- "I can push the update to Notion"
- "The status changes from 'In progress' to 'Done'"

---

### Scene 7: Show the Integration Status (2:30 - 2:45)
**Action:** Navigate to Integrations page at `/dashboard/proj-demo/integrations`

**Talking Points:**
- "In our Integrations panel, you can see Notion is connected"
- "All our external services - GitHub, Slack, Jira, Linear - are integrated"
- "This gives teams flexibility to use their preferred tools"

---

## Key API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/notion/status` | Check Notion connection status |
| `POST /api/notion/pull-tasks` | Pull tasks from Notion database |
| `POST /api/notion/push-tasks` | Push tasks to Notion database |
| `POST /api/projects/:id/tasks` | Create task and sync to Notion |

---

## Demo Commands (Quick Reference)

```bash
# Check Notion connection
curl http://localhost:3000/api/notion/status

# Pull tasks from Notion
curl -X POST http://localhost:3000/api/notion/pull-tasks \
  -H "Content-Type: application/json" \
  -d '{"project_id": "proj-demo"}'

# Push tasks to Notion
curl -X POST http://localhost:3000/api/notion/push-tasks \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj-demo",
    "tasks": [
      {"id": "1", "title": "Test Task", "status": "todo", "priority": "P1"}
    ]
  }'
```

---

## Architecture Highlight

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Momentum UI   │◄───►│  Next.js API    │◄───►│   Notion API    │
│   (React)       │     │  Routes         │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Local Storage  │     │   Mock Store    │
│  (Browser)      │     │   (Server)      │
└─────────────────┘     └─────────────────┘
```

**Key Integration Points:**
- `frontend/lib/notion-api.ts` - Direct Notion API client
- `frontend/app/api/notion/*` - API routes for sync operations
- `frontend/app/dashboard/[projectId]/tasks/page.tsx` - UI with sync buttons

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Notion is not configured" | Check `NOTION_TOKEN` in `.env.local` |
| "No Notion database configured" | Set `NOTION_DEFAULT_DATABASE_ID` |
| Tasks not appearing | Ensure Notion integration has access to the database |
| Status not mapping | Check Notion uses native "Status" property type |
