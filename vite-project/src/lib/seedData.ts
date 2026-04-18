import { run, query } from './db'
import { generateId } from './utils'

export function seedDatabase(): void {
  const existing = query('SELECT id FROM projects LIMIT 1')
  if (existing.length > 0) return

  const projectId = generateId()
  const now = new Date().toISOString()

  // Project
  run(`INSERT INTO projects VALUES (?,?,?,?,?,?)`, [
    projectId, 'FlowAI Platform', 'AI-powered project management tool built with React and Claude.',
    'development', '#E87040', now,
  ])

  // Team members
  const members = [
    [generateId(), 'Alex Chen', 'alex@example.com', 'AC', 'Tech Lead'],
    [generateId(), 'Sara Kim', 'sara@example.com', 'SK', 'Frontend Dev'],
    [generateId(), 'Jordan Lee', 'jordan@example.com', 'JL', 'Backend Dev'],
    [generateId(), 'Morgan Smith', 'morgan@example.com', 'MS', 'QA Engineer'],
  ]
  members.forEach(m => run(`INSERT INTO team_members VALUES (?,?,?,?,?)`, m))

  // Sprints
  const sprint1Id = generateId()
  const sprint2Id = generateId()
  run(`INSERT INTO sprints VALUES (?,?,?,?,?,?,?)`, [
    sprint1Id, projectId, 'Sprint 1 — Foundation',
    'Set up core infrastructure and authentication',
    '2026-04-01', '2026-04-14', 'completed',
  ])
  run(`INSERT INTO sprints VALUES (?,?,?,?,?,?,?)`, [
    sprint2Id, projectId, 'Sprint 2 — Kanban Board',
    'Implement drag-and-drop Kanban board with issue management',
    '2026-04-15', '2026-04-28', 'active',
  ])

  // Issues
  const issueData = [
    // Epic
    [generateId(), projectId, null, 'epic', 'AI-Powered Issue Management', 'Build complete issue lifecycle management with AI assistance.', 'inprogress', 'high', members[0][0], 21, 'ai,core', null, 0],
    // Stories
    [generateId(), projectId, sprint2Id, 'story', 'Implement Kanban drag-and-drop', 'Users should be able to drag issues across status columns on the Kanban board.', 'inprogress', 'high', members[1][0], 8, 'ux,board', null, 1],
    [generateId(), projectId, sprint2Id, 'story', 'AI issue description generator', 'Add AI button to issue form that generates description and acceptance criteria.', 'todo', 'medium', members[0][0], 5, 'ai', null, 2],
    [generateId(), projectId, sprint2Id, 'story', 'Sprint velocity charts', 'Display velocity chart showing story points completed per sprint.', 'inreview', 'medium', members[2][0], 3, 'charts', null, 3],
    // Tasks
    [generateId(), projectId, sprint2Id, 'task', 'Set up DnD kit integration', 'Install and configure @dnd-kit/core with collision detection.', 'done', 'high', members[1][0], 2, 'board', null, 4],
    [generateId(), projectId, sprint2Id, 'task', 'Design Kanban column component', 'Create droppable KanbanColumn component with issue count badge.', 'done', 'medium', members[1][0], 3, 'board,ux', null, 5],
    [generateId(), projectId, sprint2Id, 'task', 'Integrate Anthropic SDK', 'Set up streaming client with API key storage in settings.', 'done', 'high', members[0][0], 2, 'ai', null, 6],
    [generateId(), projectId, sprint1Id, 'task', 'Database schema design', 'Design SQLite schema for all entities with migrations.', 'done', 'critical', members[2][0], 5, 'backend', null, 7],
    // Bugs
    [generateId(), projectId, sprint2Id, 'bug', 'Card drag breaks on mobile touch', 'Touch events not properly captured on mobile devices during drag.', 'inprogress', 'high', members[3][0], 3, 'bug,mobile', null, 8],
    [generateId(), projectId, sprint2Id, 'bug', 'Sprint dates not persisting', 'Sprint start/end dates revert to defaults after page refresh.', 'todo', 'critical', members[2][0], 2, 'bug,data', null, 9],
    [generateId(), projectId, null, 'task', 'Write unit tests for DB layer', 'Add comprehensive tests for all query helper functions.', 'backlog', 'low', null, 3, 'testing', null, 10],
    [generateId(), projectId, null, 'task', 'Implement command palette', 'Add Cmd+K global search for projects, issues, and documents.', 'backlog', 'medium', null, 5, 'ux', null, 11],
    [generateId(), projectId, null, 'story', 'Roadmap timeline view', 'Visual timeline of epics and sprints across quarters.', 'backlog', 'medium', null, 8, 'roadmap', null, 12],
  ]

  issueData.forEach(issue => {
    run(`INSERT INTO issues VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      issue[0], issue[1], issue[2], issue[3], issue[4], issue[5],
      issue[6], issue[7], issue[8], issue[9], issue[10], issue[11],
      now, issue[12],
    ])
  })

  // Document
  run(`INSERT INTO documents VALUES (?,?,?,?,?,?,?)`, [
    generateId(), projectId, 'Project Architecture',
    JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This document describes the FlowAI platform architecture.' }] }] }),
    null, now, now,
  ])

  // Settings placeholder
  run(`INSERT OR IGNORE INTO settings VALUES (?,?)`, ['api_key', ''])
}
