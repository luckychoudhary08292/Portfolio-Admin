import mongoose, { Schema, Document } from 'mongoose';

// 1. Certificate Schema
export interface ICertificate extends Document {
  title: string;
  issuer: string;
  issueDate: string;
  credentialId?: string;
  verifyUrl?: string;
  badge?: string;
  category?: string;
  image: string;
  skills: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: { type: String, required: true },
    credentialId: { type: String, default: '' },
    verifyUrl: { type: String, default: '' },
    badge: { type: String, default: 'aws' },
    category: {
      type: String,
      default: 'Other',
      trim: true,
    },
    image: { type: String, default: '' },
    skills: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'certificates' }
);

// Certificate Categories Collection (Dynamic Category Management)
export interface ICertificateCategory extends Document {
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateCategorySchema = new Schema<ICertificateCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'certificatecategories' }
);


// 2. Project Schema
export interface IProject extends Document {
  title: string;
  subtitle?: string;
  category: string;
  tag: string;
  image?: string;
  description: string;
  githubUrl?: string;
  liveUrl?: string;
  metrics?: string;
  techStack: string[];
  deliverables: string[];
  order: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    category: { type: String, default: 'Full-Stack' },
    tag: { type: String, default: 'Full-Stack' },
    image: { type: String, default: '' },
    description: { type: String, required: true },
    githubUrl: { type: String, default: '' },
    liveUrl: { type: String, default: '' },
    metrics: { type: String, default: '' },
    techStack: { type: [String], default: [] },
    deliverables: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'projects' }
);

// 3. SkillCategory Schema
export interface ISkillItem {
  name: string;
  level?: string;
  badge?: string;
}

export interface ISkillCategory extends Document {
  category: string;
  description?: string;
  image?: string;
  items: ISkillItem[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SkillCategorySchema = new Schema<ISkillCategory>(
  {
    category: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    items: [
      {
        name: { type: String, required: true },
        level: { type: String, default: 'Proficient' },
        badge: { type: String, default: '' },
      },
    ],
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'skillcategories' }
);

// 4. Profile Schema
export interface IProfile extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    name: { type: String, default: 'Lucky Choudhary' },
    title: { type: String, default: 'Software Engineering Student' },
    heroQuote: { type: String, default: '' },
    experienceYears: { type: String, default: '2022 - 2026' },
    projectsCompleted: { type: String, default: '20+' },
    problemsSolved: { type: String, default: '450+' },
    gpa: { type: String, default: '8.8 / 10' },
    degree: { type: String, default: 'B.Tech in Computer Science & Engineering' },
    university: { type: String, default: 'University Institute of Technology' },
    whyHireMeBio: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    whyHireMeImage: { type: String, default: '' },
  },
  { timestamps: true, collection: 'profiles' }
);

// 5. Experience Schema
export interface IExperience extends Document {
  title: string;
  subtitle: string;
  date: string;
  place: string;
  // Legacy fields
  company?: string;
  location?: string;
  period?: string;
  role?: string;
  description?: string;
  type?: 'education' | 'work' | 'leadership' | string;
  activeColor?: 'orange' | 'dark' | string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExperienceSchema = new Schema<IExperience>(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    date: { type: String, default: '' },
    place: { type: String, default: '' },
    // Legacy fields maintained for backward compatibility
    company: { type: String, default: '' },
    location: { type: String, default: '' },
    period: { type: String, default: '' },
    role: { type: String, default: '' },
    description: { type: String, default: '' },
    type: { type: String, default: 'work' },
    activeColor: { type: String, default: 'orange' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'experiences' }
);

// 6. Inquiry Schema
export interface IInquiry extends Document {
  name?: string;
  email?: string;
  company?: string;
  opportunityType?: string;
  message?: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    company: { type: String, default: '' },
    opportunityType: { type: String, default: '' },
    message: { type: String, default: '' },
    status: { type: String, default: 'new' },
  },
  { timestamps: true, collection: 'inquiries' }
);

// 7. Subscriber Schema
export interface ISubscriber extends Document {
  email: string;
  status: 'active' | 'unsubscribed';
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
  },
  { timestamps: true, collection: 'subscribers' }
);

// 8. Skill Library (Individual Technical Skills with Badges, Logos, Categories)
export interface ISkillLibraryItem extends Document {
  name: string;
  slug: string;
  category: string; // e.g. 'Languages', 'Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'Tools'
  badge: string; // Devicon badge identifier, e.g. 'java', 'cplusplus', 'nodejs', 'python'
  iconUrl?: string; // High-res SVG or image URL
  color?: string; // Brand HEX color, e.g. '#e76f00'
  level?: string; // Default level e.g. 'Advanced', 'Proficient', 'Core'
  popular: boolean; // Flag to highlight in quick picker
  createdAt: Date;
  updatedAt: Date;
}

const SkillLibrarySchema = new Schema<ISkillLibraryItem>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true, index: true },
    category: { type: String, default: 'General', trim: true },
    badge: { type: String, default: '', trim: true },
    iconUrl: { type: String, default: '', trim: true },
    color: { type: String, default: '#64748b' },
    level: { type: String, default: 'Proficient' },
    popular: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'skills' }
);

// Model exports with protection against re-compilation
export const Certificate = mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);
export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
export const SkillCategory = mongoose.models.SkillCategory || mongoose.model<ISkillCategory>('SkillCategory', SkillCategorySchema);
export const Profile = mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
export const Experience = mongoose.models.Experience || mongoose.model<IExperience>('Experience', ExperienceSchema);
export const Inquiry = mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema);
export const Subscriber = mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);
export const SkillLibrary = mongoose.models.SkillLibrary || mongoose.model<ISkillLibraryItem>('SkillLibrary', SkillLibrarySchema);
export const CertificateCategory = mongoose.models.CertificateCategory || mongoose.model<ICertificateCategory>('CertificateCategory', CertificateCategorySchema);

