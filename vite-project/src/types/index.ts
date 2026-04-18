export type IssueType = 'epic' | 'story' | 'task' | 'bug'
export type IssueStatus = 'backlog' | 'todo' | 'inprogress' | 'inreview' | 'testing' | 'done' | 'blocked'
export type IssuePriority = 'critical' | 'high' | 'medium' | 'low'
export type SprintStatus = 'planning' | 'active' | 'completed'
export type SdlcPhase = 'requirements' | 'design' | 'development' | 'testing' | 'deployment' | 'maintenance'

export interface Project {
  id: string
  name: string
  description: string
  sdlc_phase: SdlcPhase
  color: string
  created_at: string
}

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string
  start_date: string
  end_date: string
  status: SprintStatus
}

export interface Issue {
  id: string
  project_id: string
  sprint_id: string | null
  type: IssueType
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  assignee_id: string | null
  story_points: number
  labels: string
  parent_id: string | null
  created_at: string
  order_index: number
}

export interface Comment {
  id: string
  issue_id: string
  author_id: string
  content: string
  created_at: string
}

export interface Document {
  id: string
  project_id: string
  title: string
  content: string
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  role: string
}

export interface AIConversation {
  id: string
  project_id: string | null
  messages: string
  created_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}
