import { User, UserRole, ProjectRequest, TrackerRequest } from '../types/elm';

const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'zewd',
    email: 'zewd@roboserv.io',
    name: 'Zewd (Owner)',
    password: 'zew_D003',
    role: 'ADMIN_OWNER',
    engineering_role: 'ADMIN',
    status: 'ACTIVE',
    assigned_project_ids: [1],
    created_at: new Date().toISOString()
  },
  {
    id: 999,
    username: 'demo',
    email: 'demo@roboserv.io',
    name: 'Demo User (Sandbox)',
    password: 'demo',
    role: 'DEMO',
    engineering_role: 'SYSTEMS_ENGINEER',
    status: 'ACTIVE',
    assigned_project_ids: [100],
    created_at: new Date().toISOString()
  }
];

const INITIAL_PROJECT_REQUESTS: ProjectRequest[] = [];
const INITIAL_TRACKER_REQUESTS: TrackerRequest[] = [];

const getStored = <T,>(key: string, fallback: T): T => {
  try {
    const s = localStorage.getItem(`roboserv_auth_${key}`);
    if (s) return JSON.parse(s);
  } catch (e) {
    console.error('Storage error for auth key:', key, e);
  }
  return fallback;
};

const setStored = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(`roboserv_auth_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Save error for auth key:', key, e);
  }
};

const getStoredSession = <T,>(key: string, fallback: T): T => {
  try {
    const s = sessionStorage.getItem(`roboserv_auth_${key}`) || localStorage.getItem(`roboserv_auth_${key}`);
    if (s) return JSON.parse(s);
  } catch (e) {
    console.error('Session storage error for auth key:', key, e);
  }
  return fallback;
};

const setStoredSession = <T,>(key: string, value: T) => {
  try {
    sessionStorage.setItem(`roboserv_auth_${key}`, JSON.stringify(value));
    localStorage.setItem(`roboserv_auth_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Save session error for auth key:', key, e);
  }
};

export class AuthService {
  private users: User[];
  private projectRequests: ProjectRequest[];
  private trackerRequests: TrackerRequest[];
  private currentUser: User | null = null;

  constructor() {
    this.users = getStored<User[]>('users', INITIAL_USERS);
    // Guarantee Zewd password is zew_D003 across stored caches
    this.users = this.users.map(u => {
      if (u.username.toLowerCase() === 'zewd') {
        return { ...u, password: 'zew_D003' };
      }
      return u;
    });
    // Ensure demo user is present
    if (!this.users.some(u => u.username.toLowerCase() === 'demo')) {
      this.users.push(INITIAL_USERS[1]);
    }
    setStored('users', this.users);

    this.projectRequests = getStored<ProjectRequest[]>('project_requests', INITIAL_PROJECT_REQUESTS);
    this.trackerRequests = getStored<TrackerRequest[]>('tracker_requests', INITIAL_TRACKER_REQUESTS);
    
    // Restore authenticated session across multi-tab workflows
    this.currentUser = getStoredSession<User | null>('current_user', null);
  }

  public getUsers(): User[] {
    return this.users;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getProjectRequests(): ProjectRequest[] {
    return this.projectRequests;
  }

  public getTrackerRequests(): TrackerRequest[] {
    return this.trackerRequests;
  }

  public login(username: string, pass: string): { success: boolean; user?: User; message?: string } {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      return { success: false, message: 'Please enter a username or email.' };
    }

    if (!pass || !pass.trim()) {
      return { success: false, message: 'Password is required to log in.' };
    }

    // Special handling for zewd account
    if (clean === 'zewd') {
      const cleanPass = pass.trim();
      if (cleanPass !== 'zew_D003') {
        return { success: false, message: 'Incorrect password for Zewd account. Access denied.' };
      }
      const zewd = this.users.find(u => u.username.toLowerCase() === 'zewd') || INITIAL_USERS[0];
      zewd.password = 'zew_D003';
      this.currentUser = zewd;
      setStoredSession('current_user', zewd);
      return { success: true, user: zewd };
    }

    // Special handling for demo account
    if (clean === 'demo') {
      const demo = this.users.find(u => u.username.toLowerCase() === 'demo') || INITIAL_USERS[1];
      this.currentUser = demo;
      setStoredSession('current_user', demo);
      return { success: true, user: demo };
    }

    // Match by username, email, full name, or first name
    const target = this.users.find(u => 
      u.username.toLowerCase() === clean ||
      u.email.toLowerCase() === clean ||
      u.name.toLowerCase() === clean ||
      u.name.toLowerCase().startsWith(clean) ||
      u.name.toLowerCase().includes(clean)
    );

    if (!target) {
      return { success: false, message: 'Invalid username, name, or credentials.' };
    }

    if (target.status === 'SUSPENDED') {
      return { success: false, message: 'This user account is suspended by Admin Owner.' };
    }

    // Strict Password Validation
    const cleanPass = pass.trim();
    const expectedPass = target.password || '123';

    if (cleanPass !== expectedPass) {
      return { success: false, message: 'Incorrect password. Access denied.' };
    }

    this.currentUser = target;
    setStoredSession('current_user', target);
    return { success: true, user: target };
  }

  public loginAsDemo(): User {
    const demo = this.users.find(u => u.username.toLowerCase() === 'demo') || INITIAL_USERS[1];
    this.currentUser = demo;
    setStoredSession('current_user', demo);
    return demo;
  }

  public logout(): void {
    this.currentUser = null;
    try {
      sessionStorage.removeItem('roboserv_auth_current_user');
      localStorage.removeItem('roboserv_auth_current_user');
    } catch (e) {
      console.error('Logout cleanup error:', e);
    }
  }

  public createUser(data: { username: string; email: string; name: string; password?: string; role: UserRole; engineering_role?: any }): User {
    const newUser: User = {
      id: Date.now(),
      username: data.username.trim().toLowerCase(),
      email: data.email.trim(),
      name: data.name.trim(),
      password: data.password?.trim() || 'user123',
      role: data.role,
      engineering_role: data.engineering_role || 'SYSTEMS_ENGINEER',
      status: 'ACTIVE',
      assigned_project_ids: [1],
      created_at: new Date().toISOString()
    };

    this.users = [newUser, ...this.users];
    setStored('users', this.users);
    return newUser;
  }

  public toggleUserStatus(userId: number): User | null {
    this.users = this.users.map(u => {
      if (u.id === userId && u.role !== 'ADMIN_OWNER') {
        return { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' };
      }
      return u;
    });
    setStored('users', this.users);
    return this.users.find(u => u.id === userId) || null;
  }

  public assignUserToProject(userId: number, projectId: number): void {
    this.users = this.users.map(u => {
      if (u.id === userId) {
        const set = new Set(u.assigned_project_ids);
        set.add(projectId);
        return { ...u, assigned_project_ids: Array.from(set) };
      }
      return u;
    });
    setStored('users', this.users);
  }

  public submitProjectRequest(data: { requested_name: string; key: string; description?: string; reason?: string }): ProjectRequest {
    const req: ProjectRequest = {
      id: Date.now(),
      user_id: this.currentUser?.id || 2,
      user_name: this.currentUser?.name || 'Zewd',
      requested_name: data.requested_name.trim(),
      key: data.key.toUpperCase().trim(),
      description: data.description || '',
      reason: data.reason || '',
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    this.projectRequests = [req, ...this.projectRequests];
    setStored('project_requests', this.projectRequests);
    return req;
  }

  public submitTrackerRequest(data: {
    project_id: number;
    project_name: string;
    requested_name: string;
    requested_key: string;
    type: string;
    enable_test_steps: boolean;
    enable_folders: boolean;
    reason?: string;
  }): TrackerRequest {
    const req: TrackerRequest = {
      id: Date.now(),
      user_id: this.currentUser?.id || 2,
      user_name: this.currentUser?.name || 'Zewd',
      project_id: data.project_id,
      project_name: data.project_name,
      requested_name: data.requested_name.trim(),
      requested_key: data.requested_key.trim(),
      type: data.type,
      enable_test_steps: data.enable_test_steps,
      enable_folders: data.enable_folders,
      reason: data.reason || '',
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    this.trackerRequests = [req, ...this.trackerRequests];
    setStored('tracker_requests', this.trackerRequests);
    return req;
  }

  public resolveProjectRequest(id: number, approved: boolean): ProjectRequest | null {
    this.projectRequests = this.projectRequests.map(r => r.id === id ? { ...r, status: approved ? 'APPROVED' : 'REJECTED' } : r);
    setStored('project_requests', this.projectRequests);
    return this.projectRequests.find(r => r.id === id) || null;
  }

  public resolveTrackerRequest(id: number, approved: boolean): TrackerRequest | null {
    this.trackerRequests = this.trackerRequests.map(r => r.id === id ? { ...r, status: approved ? 'APPROVED' : 'REJECTED' } : r);
    setStored('tracker_requests', this.trackerRequests);
    return this.trackerRequests.find(r => r.id === id) || null;
  }
}

export const authService = new AuthService();
