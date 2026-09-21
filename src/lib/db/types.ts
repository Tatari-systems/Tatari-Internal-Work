export type FieldErrorMap = Record<string, string[]>;

export type WorkPerson = {
  id: string;
  email: string;
  displayName: string | null;
};

export type ProjectRecord = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  archivedAt: string | null;
  createdAt: string;
};

export type TaskRecord = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  position: string;
  isTestData: boolean;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string; slug: string };
  assignee: WorkPerson | null;
  createdBy: WorkPerson;
};

export type WorkspaceRecord = {
  id: string;
  slug: string;
  name: string;
  taskSeq: number;
};

export type AuditInsert = {
  entityType: "project" | "task";
  entityId: string;
  action: "created" | "status_changed" | "updated" | "archived";
  actorId?: string;
  beforeStatus: string | null;
  afterStatus: string | null;
  metadata?: Record<string, string | undefined>;
};

export type CreateTaskRecord = {
  workspaceId: string;
  projectId: string;
  number: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  createdById: string;
  dueAt: string | null;
  completedAt: string | null;
  position: string;
};

export type UpdateTaskRecord = {
  title?: string;
  description?: string | null;
  priority?: string;
  assigneeId?: string | null;
  dueAt?: string | null;
  status?: string;
  position?: string;
  completedAt?: string | null;
};

export type ProfileRecord = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
};

export type ProfileDatabase = {
  findByEmail(email: string): Promise<ProfileRecord | null>;
  countActive(): Promise<number>;
  create(data: {
    email: string;
    displayName: string;
    role: string;
  }): Promise<ProfileRecord>;
  setRole(id: string, role: string): Promise<ProfileRecord>;
};

export type WorkDatabase = {
  getWorkspaceBySlug(slug: string): Promise<WorkspaceRecord | null>;
  incrementTaskSeq(workspaceId: string): Promise<number>;
  listProjects(
    workspaceId: string,
    includeArchived: boolean,
  ): Promise<ProjectRecord[]>;
  getProjectBySlug(
    workspaceId: string,
    slug: string,
  ): Promise<ProjectRecord | null>;
  getProjectById(id: string): Promise<ProjectRecord | null>;
  createProject(data: {
    workspaceId: string;
    name: string;
    slug: string;
    description?: string;
    createdById: string;
  }): Promise<ProjectRecord>;
  archiveProject(id: string, archivedAt: string): Promise<ProjectRecord>;
  listAssignees(): Promise<WorkPerson[]>;
  getActivePerson(id: string): Promise<WorkPerson | null>;
  listProjectTasks(projectId: string): Promise<TaskRecord[]>;
  listMyWork(actorId: string): Promise<TaskRecord[]>;
  listInbox(): Promise<TaskRecord[]>;
  getTaskByNumber(
    workspaceId: string,
    number: number,
  ): Promise<TaskRecord | null>;
  getTaskById(id: string): Promise<TaskRecord | null>;
  maxPosition(projectId: string, status: string): Promise<number>;
  createTask(data: CreateTaskRecord): Promise<TaskRecord>;
  updateTask(id: string, data: UpdateTaskRecord): Promise<TaskRecord>;
  insertAudit(data: AuditInsert): Promise<void>;
};
