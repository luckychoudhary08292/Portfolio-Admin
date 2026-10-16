export type CertificateCategory = 'Academic' | 'Competitions' | 'Events' | 'Tools' | 'Other' | string;

export interface CertificateItem {
  _id?: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId?: string;
  verifyUrl?: string;
  badge?: string;
  category?: CertificateCategory | string;
  image: string;
  skills: string[];
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectItem {
  _id?: string;
  title: string;
  subtitle?: string;
  category: string;
  tag: string;
  image: string;
  description: string;
  githubUrl?: string;
  liveUrl?: string;
  metrics?: string;
  techStack: string[];
  deliverables: string[];
  order: number;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillItem {
  name: string;
  level?: string;
  badge?: string;
  iconUrl?: string;
  color?: string;
  category?: string;
}

export interface SkillLibraryItem {
  _id?: string;
  name: string;
  slug: string;
  category: string; // 'Languages', 'Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'AI & ML', 'Tools & Testing'
  badge: string; // e.g. 'java', 'cplusplus', 'nodejs', 'python', 'docker'
  iconUrl?: string; // High-res SVG or icon URL
  color?: string; // Hex color for badge styling
  level?: string; // Default level e.g. 'Advanced', 'Proficient'
  popular?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillCategoryItem {
  _id?: string;
  category: string;
  description?: string;
  image?: string;
  items: SkillItem[];
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileData {
  _id?: string;
  name: string;
  title: string;
  heroQuote?: string;
  experienceYears?: string;
  projectsCompleted?: string;
  problemsSolved?: string;
  gpa?: string;
  degree?: string;
  university?: string;
  whyHireMeBio?: string;
  email?: string;
  phone?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  leetcode?: string;
  resumeUrl?: string;
  heroImage?: string;
  whyHireMeImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExperienceItem {
  _id?: string;
  title: string;
  subtitle: string;
  date: string;
  place: string;
  // Legacy / optional aliases for backward compatibility with existing records
  role?: string;
  company?: string;
  period?: string;
  location?: string;
  description?: string;
  type?: 'education' | 'work' | 'leadership' | string;
  activeColor?: 'orange' | 'dark' | string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InquiryItem {
  _id?: string;
  name?: string;
  email?: string;
  company?: string;
  opportunityType?: string;
  message?: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriberItem {
  _id?: string;
  email: string;
  status: 'active' | 'unsubscribed';
  createdAt?: string;
  updatedAt?: string;
}

export interface DbStatusInfo {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  uriConfigured: string;
  databaseName: string;
  host?: string;
  pingMs?: number;
  lastConnectedAt?: string;
  lastError?: string;
}

export interface StatsOverview {
  success: boolean;
  dbStatus: DbStatusInfo;
  counts: {
    certificates: number;
    projects: number;
    skillCategories: number;
    skillLibrary?: number;
    experiences: number;
    inquiries: number;
    newInquiries: number;
    subscribers?: number;
  };
}

export interface AuthUser {
  role: 'admin' | 'guest';
  email: string;
  name: string;
}
