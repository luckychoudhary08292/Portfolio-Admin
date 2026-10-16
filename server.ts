import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { connectToDatabase, getDbStatus } from './src/server/db.ts';
import {
  Certificate,
  Project,
  SkillCategory,
  Profile,
  Experience,
  Inquiry,
  Subscriber,
  SkillLibrary,
  CertificateCategory,
} from './src/server/models.ts';
import { POPULAR_TECH_SKILLS } from './src/server/seedSkills.ts';


import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Admin Credentials from Environmental Variables (Never in Database)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'luckypc08292@gmail.com').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'its@Lucky.1').trim();
const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-admin-super-secure-jwt-secret-2026';

export interface JwtUserPayload {
  role: 'admin' | 'guest';
  email: string;
  name: string;
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS headers for easy local/preview interaction
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Authentication Middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
      return;
    }
    (req as any).user = decoded as JwtUserPayload;
    next();
  });
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    const user = (req as any).user as JwtUserPayload;
    if (!user || user.role !== 'admin') {
      res.status(403).json({
        error: 'Guest Demo Access: Modifying data is disabled in read-only mode. Only the admin can perform this operation.',
      });
      return;
    }
    next();
  });
}

// Initialize MongoDB connection asynchronously
connectToDatabase().catch((err) => {
  console.warn('[MongoDB] Initial connection attempt failed, will retry on demand:', err.message);
});

/* =========================================================
   AUTHENTICATION ROUTES (/api/auth)
   ========================================================= */
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password, isGuest } = req.body || {};

    // 1. Guest Account login (Normal user / Demo visitor)
    if (isGuest) {
      const guestPayload: JwtUserPayload = {
        role: 'guest',
        email: 'guest@portfolio.dev',
        name: 'Guest Viewer (Read-Only)',
      };
      const token = jwt.sign(guestPayload, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        success: true,
        token,
        user: guestPayload,
      });
      return;
    }

    // 2. Admin Credentials Authentication
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const targetEmail = ADMIN_EMAIL.toLowerCase();

    if (trimmedEmail === targetEmail && password.trim() === ADMIN_PASSWORD) {
      const adminPayload: JwtUserPayload = {
        role: 'admin',
        email: ADMIN_EMAIL,
        name: 'Lucky Choudhary (Admin)',
      };
      const token = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        success: true,
        token,
        user: adminPayload,
      });
      return;
    }

    res.status(401).json({ error: 'Invalid email or password' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: (req as any).user,
  });
});


/* =========================================================
   DATABASE STATUS & HEALTH CHECK
   ========================================================= */
app.get('/api/status', async (_req: Request, res: Response) => {
  try {
    const status = await getDbStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.post('/api/reconnect', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { uri } = req.body || {};
    const result = await connectToDatabase(uri);
    const status = await getDbStatus();
    res.json({ ...result, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stats', async (_req: Request, res: Response) => {
  try {
    const [
      certificateCount,
      projectCount,
      skillCategoryCount,
      skillLibraryCount,
      experienceCount,
      inquiryCount,
      newInquiryCount,
      subscriberCount,
    ] = await Promise.all([
      Certificate.countDocuments().catch(() => 0),
      Project.countDocuments().catch(() => 0),
      SkillCategory.countDocuments().catch(() => 0),
      SkillLibrary.countDocuments().catch(() => 0),
      Experience.countDocuments().catch(() => 0),
      Inquiry.countDocuments().catch(() => 0),
      Inquiry.countDocuments({ status: 'new' }).catch(() => 0),
      Subscriber.countDocuments().catch(() => 0),
    ]);

    const status = await getDbStatus();

    res.json({
      success: true,
      dbStatus: status,
      counts: {
        certificates: certificateCount,
        projects: projectCount,
        skillCategories: skillCategoryCount,
        skillLibrary: skillLibraryCount,
        experiences: experienceCount,
        inquiries: inquiryCount,
        newInquiries: newInquiryCount,
        subscribers: subscriberCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


/* =========================================================
   1. CERTIFICATES CRUD (/api/certificates)
   ========================================================= */
app.get('/api/certificates', async (_req: Request, res: Response) => {
  try {
    const certificates = await Certificate.find().sort({ order: 1, createdAt: -1 });
    res.json(certificates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const DEFAULT_CERTIFICATE_CATEGORIES = ['Academic', 'Competitions', 'Events', 'Tools', 'Other'];

function sanitizeCertCategory(raw?: string): string {
  if (!raw) return 'Other';
  const trimmed = raw.trim();
  return trimmed || 'Other';
}

app.get('/api/certificates/categories', async (_req: Request, res: Response) => {
  try {
    const [explicitCategories, counts] = await Promise.all([
      CertificateCategory.find().sort({ order: 1, name: 1 }),
      Certificate.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$category', 'Other'] },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const countMap = new Map<string, number>();
    counts.forEach((c) => {
      if (c._id) {
        countMap.set(c._id.toLowerCase(), c.count);
      }
    });

    // Map of case-insensitive names to clean display name
    const categoryNameMap = new Map<string, string>();
    explicitCategories.forEach((c) => categoryNameMap.set(c.name.toLowerCase(), c.name));
    DEFAULT_CERTIFICATE_CATEGORIES.forEach((c) => {
      if (!categoryNameMap.has(c.toLowerCase())) categoryNameMap.set(c.toLowerCase(), c);
    });
    counts.forEach((c) => {
      if (c._id && !categoryNameMap.has(c._id.toLowerCase())) {
        categoryNameMap.set(c._id.toLowerCase(), c._id);
      }
    });

    const result = Array.from(categoryNameMap.values()).map((name) => ({
      name,
      count: countMap.get(name.toLowerCase()) || 0,
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Certificate Category
app.post('/api/certificates/categories', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name } = req.body || {};
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    const trimmed = name.trim();
    const existing = await CertificateCategory.findOne({
      name: new RegExp(`^${trimmed.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i'),
    });
    if (existing) {
      res.status(400).json({ error: 'Category already exists' });
      return;
    }
    const newCat = new CertificateCategory({ name: trimmed });
    await newCat.save();
    res.status(201).json({ success: true, category: newCat });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Certificate Category
app.delete('/api/certificates/categories/:name', requireAdmin, async (req: Request, res: Response) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    await CertificateCategory.deleteOne({ name: new RegExp(`^${escaped}$`, 'i') });
    // Re-assign certificates with this category to 'Other' if not already 'Other'
    if (name.toLowerCase() !== 'other') {
      await Certificate.updateMany(
        { category: new RegExp(`^${escaped}$`, 'i') },
        { $set: { category: 'Other' } }
      );
    }
    res.json({ success: true, message: `Category "${name}" removed.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/certificates', requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.issuer || !payload.issueDate || !payload.image) {
      res.status(400).json({ error: 'Title, Issuer, Issue Date, and Image are required' });
      return;
    }
    payload.category = sanitizeCertCategory(payload.category);
    const cert = new Certificate(payload);
    await cert.save();
    res.status(201).json(cert);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/certificates/:id', async (req: Request, res: Response) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }
    res.json(cert);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/certificates/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (req.body && req.body.category !== undefined) {
      req.body.category = sanitizeCertCategory(req.body.category);
    }
    const updated = await Certificate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/certificates/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await Certificate.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }
    res.json({ success: true, message: 'Certificate deleted successfully', deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   2. PROJECTS CRUD (/api/projects)
   ========================================================= */
app.get('/api/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.description || !payload.image) {
      res.status(400).json({ error: 'Title, Description, and Image are required' });
      return;
    }
    const project = new Project(payload);
    await project.save();
    res.status(201).json(project);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true, message: 'Project deleted successfully', deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   3. SKILLS CRUD (/api/skills)
   ========================================================= */
app.get('/api/skills', async (_req: Request, res: Response) => {
  try {
    const categories = await SkillCategory.find().sort({ order: 1, createdAt: 1 });
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skills', requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.category) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    const cat = new SkillCategory(payload);
    await cat.save();
    res.status(201).json(cat);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/skills/:id', async (req: Request, res: Response) => {
  try {
    const cat = await SkillCategory.findById(req.params.id);
    if (!cat) {
      res.status(404).json({ error: 'Skill Category not found' });
      return;
    }
    res.json(cat);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/skills/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await SkillCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json({ error: 'Skill Category not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/skills/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await SkillCategory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Skill Category not found' });
      return;
    }
    res.json({ success: true, message: 'Skill Category deleted successfully', deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   3.1. SKILL LIBRARY (Individual technical skills catalog with badges/logos)
   Collection: skills (/api/skill-library)
   ========================================================= */
app.get('/api/skill-library', async (req: Request, res: Response) => {
  try {
    const { category, search, popular } = req.query;
    const filter: any = {};

    if (category && typeof category === 'string' && category !== 'all') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (popular === 'true') {
      filter.popular = true;
    }

    if (search && typeof search === 'string') {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: new RegExp(escaped, 'i') },
        { slug: new RegExp(escaped, 'i') },
        { badge: new RegExp(escaped, 'i') },
        { category: new RegExp(escaped, 'i') },
      ];
    }

    let skills = await SkillLibrary.find(filter).sort({ popular: -1, name: 1 });

    // Auto-seed default technical skills if catalog is completely empty
    if (skills.length === 0 && (!search && (!category || category === 'all'))) {
      const totalCount = await SkillLibrary.countDocuments();
      if (totalCount === 0) {
        await SkillLibrary.insertMany(POPULAR_TECH_SKILLS);
        skills = await SkillLibrary.find().sort({ popular: -1, name: 1 });
      }
    }

    res.json(skills);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skill-library', requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.name) {
      res.status(400).json({ error: 'Skill name is required' });
      return;
    }

    const slug = (payload.slug || payload.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const badge = payload.badge || slug.replace(/-/g, '');
    const iconUrl =
      payload.iconUrl ||
      `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${badge}/${badge}-original.svg`;

    const item = new SkillLibrary({
      ...payload,
      slug,
      badge,
      iconUrl,
    });
    await item.save();
    res.status(201).json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/skill-library/seed', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { force } = req.body || {};
    if (force) {
      await SkillLibrary.deleteMany({});
    }
    const current = await SkillLibrary.countDocuments();
    if (current === 0 || force) {
      await SkillLibrary.insertMany(POPULAR_TECH_SKILLS);
      res.json({ success: true, count: POPULAR_TECH_SKILLS.length, message: 'Seeded technical skills library' });
    } else {
      res.json({ success: true, count: current, message: 'Skills library already populated' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/skill-library/:id', async (req: Request, res: Response) => {
  try {
    const item = await SkillLibrary.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Skill not found in library' });
      return;
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/skill-library/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await SkillLibrary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json({ error: 'Skill not found in library' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/skill-library/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await SkillLibrary.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Skill not found in library' });
      return;
    }
    res.json({ success: true, message: 'Skill deleted from library', deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   4. PROFILE & BIO (/api/profile)
   ========================================================= */
app.get('/api/profile', async (_req: Request, res: Response) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({
        name: 'Lucky Choudhary',
        title: 'Software Engineering Student',
        heroQuote: 'Architecting Scalable Distributed Systems & High-Performance Full-Stack Applications',
        experienceYears: '2022 - 2026',
        projectsCompleted: '20+',
        problemsSolved: '450+',
        gpa: '8.8 / 10',
        degree: 'B.Tech in Computer Science & Engineering',
        university: 'University Institute of Technology',
        whyHireMeBio:
          'Passionate software engineer skilled in React 19, TypeScript, Node.js, distributed systems, and cloud infrastructure. Proven track record building collaborative tools, microservices, and high-load web applications.',
        email: 'luckychoudhary08292@gmail.com',
        github: 'https://github.com/luckychoudhary',
        linkedin: 'https://linkedin.com/in/luckychoudhary',
        leetcode: 'https://leetcode.com/luckychoudhary',
      });
    }
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await Profile.findOneAndUpdate({}, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/* =========================================================
   5. EXPERIENCES CRUD (/api/experiences)
   ========================================================= */
app.get('/api/experiences', async (_req: Request, res: Response) => {
  try {
    const experiences = await Experience.find().sort({ order: 1, createdAt: -1 }).lean();
    // Normalize experiences so title, subtitle, date, place are always present
    const normalized = experiences.map((exp: any) => ({
      ...exp,
      title: exp.title || exp.role || '',
      subtitle: exp.subtitle || exp.company || '',
      date: exp.date || exp.period || '',
      place: exp.place || exp.location || '',
    }));
    res.json(normalized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/experiences', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const title = (body.title || body.role || '').trim();
    const subtitle = (body.subtitle || body.company || '').trim();
    const date = (body.date || body.period || '').trim();
    const place = (body.place || body.location || '').trim();

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const payload = {
      ...body,
      title,
      subtitle,
      date,
      place,
      // sync with legacy fields
      role: title,
      company: subtitle || title,
      period: date,
      location: place,
      description: body.description || '',
      order: body.order ?? 0,
    };

    const exp = new Experience(payload);
    await exp.save();
    res.status(201).json(exp);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/experiences/:id', async (req: Request, res: Response) => {
  try {
    const exp = await Experience.findById(req.params.id).lean();
    if (!exp) {
      res.status(404).json({ error: 'Experience not found' });
      return;
    }
    const item: any = exp;
    res.json({
      ...item,
      title: item.title || item.role || '',
      subtitle: item.subtitle || item.company || '',
      date: item.date || item.period || '',
      place: item.place || item.location || '',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/experiences/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const updateData: any = { ...body };

    if (body.title !== undefined) {
      updateData.title = body.title;
      updateData.role = body.title;
    }
    if (body.subtitle !== undefined) {
      updateData.subtitle = body.subtitle;
      updateData.company = body.subtitle;
    }
    if (body.date !== undefined) {
      updateData.date = body.date;
      updateData.period = body.date;
    }
    if (body.place !== undefined) {
      updateData.place = body.place;
      updateData.location = body.place;
    }

    const updated = await Experience.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json({ error: 'Experience not found' });
      return;
    }
    const item: any = updated.toObject();
    res.json({
      ...item,
      title: item.title || item.role || '',
      subtitle: item.subtitle || item.company || '',
      date: item.date || item.period || '',
      place: item.place || item.location || '',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/experiences/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await Experience.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Experience not found' });
      return;
    }
    res.json({ success: true, message: 'Experience deleted successfully', deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   6. INQUIRIES (/api/inquiries)
   ========================================================= */

app.get('/api/inquiries', async (_req: Request, res: Response) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inquiries', async (req: Request, res: Response) => {
  try {
    const item = new Inquiry(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/inquiries/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/inquiries/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await Inquiry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }
    res.json({ success: true, message: 'Inquiry deleted successfully', deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   8. SUBSCRIBERS CRUD (/api/subscribers)
   ========================================================= */
app.get('/api/subscribers', async (_req: Request, res: Response) => {
  try {
    const list = await Subscriber.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscribers', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const existing = await Subscriber.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(200).json({ message: 'Already subscribed', subscriber: existing });
      return;
    }
    const subscriber = new Subscriber({ email: email.toLowerCase().trim(), status: 'active' });
    await subscriber.save();
    res.status(201).json(subscriber);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/subscribers/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await Subscriber.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Subscriber not found' });
      return;
    }
    res.json({ success: true, message: 'Subscriber deleted successfully', deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   9. EXPORT / IMPORT & SEEDING UTILITIES
   ========================================================= */
app.get('/api/export-all', async (_req: Request, res: Response) => {
  try {
    const [certificates, projects, skills, skillLibrary, profile, experiences, inquiries, subscribers] =
      await Promise.all([
        Certificate.find().lean(),
        Project.find().lean(),
        SkillCategory.find().lean(),
        SkillLibrary.find().lean(),
        Profile.findOne().lean(),
        Experience.find().lean(),
        Inquiry.find().lean(),
        Subscriber.find().lean(),
      ]);

    res.json({
      exportedAt: new Date().toISOString(),
      database: 'portfolio',
      data: {
        certificates,
        projects,
        skillcategories: skills,
        skills: skillLibrary,
        profile,
        experiences,
        inquiries,
        subscribers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Seed exact sample payloads from the brief if collections are empty or upon request
app.post('/api/seed-samples', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { force } = req.body || {};
    const results: Record<string, string> = {};

    // Certificate sample
    const certCount = await Certificate.countDocuments();
    if (certCount === 0 || force) {
      await Certificate.create({
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services (AWS)',
        issueDate: 'May 2024',
        credentialId: 'AWS-CCP-938210',
        verifyUrl: 'https://aws.amazon.com/verification',
        badge: 'aws',
        category: 'Tools',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        skills: ['AWS S3', 'EC2', 'IAM Security', 'VPC Networking'],
        order: 1,
      });
      await Certificate.create({
        title: 'Meta Front-End Developer Professional',
        issuer: 'Meta',
        issueDate: 'August 2024',
        credentialId: 'META-FED-884120',
        verifyUrl: 'https://www.coursera.org/verify/professional-cert/meta',
        badge: 'meta',
        category: 'Academic',
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
        skills: ['React 19', 'JavaScript ES6+', 'UI/UX Design', 'Version Control'],
        order: 2,
      });
      results.certificates = 'Seeded sample certificates';
    } else {
      results.certificates = `Preserved existing (${certCount} items)`;
    }

    // Project sample
    const projectCount = await Project.countDocuments();
    if (projectCount === 0 || force) {
      await Project.create({
        title: 'DevCollab - Real-Time Collaborative IDE',
        subtitle: 'DevCollab IDE',
        category: 'Full-Stack',
        tag: 'Full-Stack',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        description: 'Browser-based distributed code editor with real-time operational transformation, multi-cursor presence, and Docker code execution sandbox.',
        githubUrl: 'https://github.com/luckychoudhary/devcollab-ide',
        liveUrl: 'https://devcollab.dev',
        metrics: '< 35ms WebSocket Latency • 10k Users',
        techStack: ['React 19', 'TypeScript', 'Node.js', 'WebSockets', 'Docker'],
        deliverables: ['Real-Time OT Engine', 'Docker Container Execution'],
        order: 1,
        featured: true,
      });
      await Project.create({
        title: 'CloudMesh - Microservices Observability Dashboard',
        subtitle: 'CloudMesh Telemetry',
        category: 'Backend & Systems',
        tag: 'Backend & Systems',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        description: 'High-throughput telemetry ingestion pipeline processing 250k metrics/sec with OpenTelemetry and automated anomaly detection.',
        githubUrl: 'https://github.com/luckychoudhary/cloudmesh-telemetry',
        liveUrl: 'https://cloudmesh.io',
        metrics: '250k events/sec • 99.99% Uptime',
        techStack: ['Go', 'Kafka', 'Prometheus', 'Grafana', 'Kubernetes'],
        deliverables: ['Time-series Engine', 'Distributed Tracing'],
        order: 2,
        featured: true,
      });
      results.projects = 'Seeded sample projects';
    } else {
      results.projects = `Preserved existing (${projectCount} items)`;
    }

    // Skills sample
    const skillsCount = await SkillCategory.countDocuments();
    if (skillsCount === 0 || force) {
      await SkillCategory.create({
        category: 'Databases & Cloud Tools',
        description: 'High-performance databases, containerization, cloud hosting, and version control.',
        image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
        items: [
          { name: 'MongoDB', level: 'Advanced', badge: 'mongodb' },
          { name: 'PostgreSQL', level: 'Proficient', badge: 'postgres' },
          { name: 'Redis', level: 'Caching & Queues', badge: 'redis' },
          { name: 'Docker', level: 'Containers', badge: 'docker' },
        ],
        order: 1,
      });
      await SkillCategory.create({
        category: 'Programming & Frameworks',
        description: 'Core languages and modern web application frameworks for robust full-stack software.',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
        items: [
          { name: 'TypeScript', level: 'Advanced', badge: 'ts' },
          { name: 'React 19', level: 'Advanced', badge: 'react' },
          { name: 'Node.js', level: 'Advanced', badge: 'node' },
          { name: 'C++', level: 'DSA & Competitions', badge: 'cpp' },
        ],
        order: 2,
      });
      results.skills = 'Seeded sample skill categories';
    } else {
      results.skills = `Preserved existing (${skillsCount} items)`;
    }

    // Experience sample
    const expCount = await Experience.countDocuments();
    if (expCount === 0 || force) {
      await Experience.create({
        title: 'Software Engineer Intern (Backend)',
        subtitle: 'HyperScale Labs',
        date: 'June 2024 - Sep 2024',
        place: 'Bengaluru / Remote',
        role: 'Software Engineer Intern (Backend)',
        company: 'HyperScale Labs',
        period: 'June 2024 - Sep 2024',
        location: 'Bengaluru / Remote',
        order: 1,
      });
      results.experiences = 'Seeded sample experience';
    }

    // Inquiries sample
    const inqCount = await Inquiry.countDocuments();
    if (inqCount === 0 || force) {
      await Inquiry.create({
        name: 'Sarah Jenkins',
        email: 'sjenkins@techrecruiting.io',
        company: 'Vanguard Systems',
        opportunityType: 'Full-Time Software Engineer',
        message: 'Loved your DevCollab project and distributed systems write-ups! We would love to chat about our distributed systems team.',
        status: 'new',
      });
      results.inquiries = 'Seeded sample inquiry';
    }

    // Skills Library seeding
    const skillLibCount = await SkillLibrary.countDocuments();
    if (skillLibCount === 0 || force) {
      if (force) {
        await SkillLibrary.deleteMany({});
      }
      await SkillLibrary.insertMany(POPULAR_TECH_SKILLS);
      results.skillLibrary = `Seeded ${POPULAR_TECH_SKILLS.length} technical skills in library`;
    } else {
      results.skillLibrary = `Preserved existing (${skillLibCount} skills)`;
    }

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   VITE DEV SERVER OR STATIC SERVING
   ========================================================= */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Portfolio Admin Panel running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err);
});
