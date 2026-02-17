# Momentum

**AI-powered project management with persistent memory and autonomous agents.**

![Momentum Dashboard](image.png)

Momentum is an intelligent project management platform that combines traditional task management with AI capabilities. It features a visual memory graph, autonomous agent execution, and seamless integration with AI services like Backboard and OpenClaw.

## Features

### Task Management
- **Kanban Board** - Drag-and-drop tasks across Todo, In Progress, and Done columns
- **Priority Levels** - P0-P3 priority system for task organization
- **Task Ownership** - Assign tasks to humans or AI agents
- **Acceptance Criteria** - Track requirements for task completion

### AI Memory System
- **Visual Memory Graph** - Interactive canvas for organizing project knowledge
- **Memory Types** - Facts, Decisions, Preferences, Risks, Notes, Links, and Files
- **Memory Attachments** - Link relevant context to tasks for AI agents
- **Semantic Search** - Query memories using natural language

### Autonomous Agents
- **Agent Execution** - Run AI agents on tasks with attached context
- **Approval Queue** - Review and approve agent-proposed changes
- **Run Feed** - Real-time visibility into agent activities
- **OpenClaw Integration** - Local AI gateway for agent execution

### AI Integrations
- **Backboard** - Assistants API, Memory API, Threads API, Messages API
- **Google Gemini** - AI planning and task generation
- **OpenClaw** - Local agent execution with thinking capabilities

### Additional Features
- **Report Generation** - AI-generated project reports saved as PDFs
- **Email Integration** - Send reports with memory attachments
- **Team Management** - Invite team members to collaborate
- **Automations** - Schedule and event-triggered workflows

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Database**: SQLite (via better-sqlite3)
- **AI**: Google Gemini, Backboard API, OpenClaw
- **Validation**: Zod schemas
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Youseph-Elkhouly/Momentum.git
cd Momentum
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:
```env
# AI Provider (at least one required for production)
GOOGLE_GEMINI_API_KEY=your_key_here
BACKBOARD_API_KEY=your_key_here

# OpenClaw (optional - for local agent execution)
OPENCLAW_URL=http://localhost:5100

# Application Mode
NEXT_PUBLIC_APP_MODE=demo  # or "production"
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Momentum/
├── frontend/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   └── dashboard/         # Dashboard pages
│   ├── components/            # React components
│   │   ├── agentic/          # Agent-related components
│   │   ├── dashboard/        # Dashboard components
│   │   └── memory/           # Memory graph components
│   └── lib/                   # Utilities and services
│       ├── storage/          # Data persistence
│       └── types.ts          # TypeScript types
└── backend/                   # Backend types and store
```

## API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| Google Gemini | AI planning & generation | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| Backboard | AI memory & assistants | [Backboard](https://app.backboard.io) |
| OpenClaw | Local agent execution | `pip install openclaw && openclaw serve` |

## Demo Mode

By default, Momentum runs in demo mode with mock data. To enable production features:

1. Set `NEXT_PUBLIC_APP_MODE=production` in `.env.local`
2. Configure at least one AI provider API key
3. Restart the development server

## License

MIT

