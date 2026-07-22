import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.attributeCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get attributes with prefix search, category filter, recent
router.get('/', async (req, res) => {
  try {
    const { prefix, categoryId, search, recent } = req.query;

    const where: any = {};

    if (categoryId) {
      where.categoryId = String(categoryId);
    }

    if (prefix) {
      where.name = {
        startsWith: String(prefix),
      };
    } else if (search) {
      where.name = {
        contains: String(search),
      };
    }

    const attributes = await prisma.attribute.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: recent === 'true' ? { createdAt: 'desc' } : { name: 'asc' },
      take: recent === 'true' ? 10 : undefined,
    });

    res.json({ attributes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Create attribute (Recruiter / Admin)
router.post('/', requireRoles('RECRUITER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, categoryId, type, options } = req.body;

    if (!name || !categoryId || !type) {
      return res.status(400).json({ error: 'Name, categoryId, and type are required' });
    }

    const validTypes = ['STRING', 'TEXT', 'IMAGE', 'NUMERIC', 'DATE', 'PERIOD', 'BOOLEAN', 'DROPDOWN'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid attribute type' });
    }

    const existing = await prisma.attribute.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: 'An attribute with this name already exists' });
    }

    const optionsJson = Array.isArray(options) ? JSON.stringify(options) : '[]';

    const attribute = await prisma.attribute.create({
      data: {
        name,
        categoryId,
        type,
        optionsJson,
      },
      include: { category: true },
    });

    res.json({ attribute });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Update attribute (Recruiter / Admin)
router.put('/:id', requireRoles('RECRUITER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, categoryId, type, options } = req.body;

    const existing = await prisma.attribute.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    if (name && name !== existing.name) {
      const nameConflict = await prisma.attribute.findUnique({ where: { name } });
      if (nameConflict) {
        return res.status(400).json({ error: 'An attribute with this name already exists' });
      }
    }

    const optionsJson = Array.isArray(options) ? JSON.stringify(options) : existing.optionsJson;

    const attribute = await prisma.attribute.update({
      where: { id },
      data: {
        name: name || existing.name,
        categoryId: categoryId || existing.categoryId,
        type: type || existing.type,
        optionsJson,
      },
      include: { category: true },
    });

    res.json({ attribute });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Delete attribute (Recruiter / Admin)
router.delete('/:id', requireRoles('RECRUITER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.attribute.delete({ where: { id } });
    res.json({ success: true, message: 'Attribute deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
