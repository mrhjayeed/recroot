import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get profile details
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check permissions: profile owner or Admin, or Recruiter viewing read-only attributes
    const isOwner = req.user?.id === id;
    const isAdmin = req.user?.role === 'ADMIN';
    const isRecruiter = req.user?.role === 'RECRUITER';

    if (!isOwner && !isAdmin && !isRecruiter) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        location: true,
        photoUrl: true,
        role: true,
        version: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get candidate custom attribute values
    const attributeValues = await prisma.candidateAttributeValue.findMany({
      where: { candidateId: id },
      include: {
        attribute: {
          include: { category: true },
        },
      },
    });

    // Get candidate projects
    const projects = await prisma.candidateProject.findMany({
      where: { candidateId: id },
      orderBy: { startDate: 'desc' },
    });

    // Parse project tags
    const projectsWithParsedTags = projects.map((p) => ({
      ...p,
      tags: JSON.parse(p.tagsJson || '[]'),
    }));

    // Get candidate CVs
    const cvs = await prisma.cV.findMany({
      where: { candidateId: id },
      include: {
        position: {
          select: { id: true, title: true, isPublic: true },
        },
        likes: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formattedCvs = cvs.map((c) => ({
      id: c.id,
      positionId: c.positionId,
      positionTitle: c.position.title,
      status: c.status,
      version: c.version,
      likesCount: c.likes.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json({
      profile: {
        me: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          location: user.location,
          photoUrl: user.photoUrl,
          role: user.role,
          version: user.version,
        },
        attributes: attributeValues.map((av) => ({
          id: av.id,
          attributeId: av.attributeId,
          attributeName: av.attribute.name,
          attributeType: av.attribute.type,
          options: JSON.parse(av.attribute.optionsJson || '[]'),
          categoryName: av.attribute.category.name,
          value: av.value,
          version: av.version,
        })),
        projects: projectsWithParsedTags,
        cvs: formattedCvs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Update "Me" mandatory fields (optimistic locking)
router.put('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, location, photoUrl, targetUserId, version } = req.body;
    const userId = (req.user?.role === 'ADMIN' && targetUserId) ? targetUserId : req.user!.id;

    if (version === undefined) {
      return res.status(400).json({ error: 'Version number is required for optimistic locking' });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (existing.version !== Number(version)) {
      return res.status(409).json({
        error: 'Conflict: Profile was updated on another device or session.',
        currentVersion: existing.version,
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName !== undefined ? firstName : existing.firstName,
        lastName: lastName !== undefined ? lastName : existing.lastName,
        location: location !== undefined ? location : existing.location,
        photoUrl: photoUrl !== undefined ? photoUrl : existing.photoUrl,
        version: existing.version + 1,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        location: true,
        photoUrl: true,
        version: true,
      },
    });

    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Save custom attribute value in profile (with Optimistic Locking auto-save)
router.post('/attributes', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { attributeId, value, version, targetUserId } = req.body;
    const candidateId = (req.user?.role === 'ADMIN' && targetUserId) ? targetUserId : req.user!.id;

    if (!attributeId) {
      return res.status(400).json({ error: 'Attribute ID is required' });
    }

    const existing = await prisma.candidateAttributeValue.findUnique({
      where: {
        candidateId_attributeId: {
          candidateId,
          attributeId,
        },
      },
    });

    if (existing) {
      if (version !== undefined && existing.version !== Number(version)) {
        return res.status(409).json({
          error: 'Conflict: Attribute value changed by another session.',
          currentVersion: existing.version,
          currentValue: existing.value,
        });
      }

      const updated = await prisma.candidateAttributeValue.update({
        where: { id: existing.id },
        data: {
          value: value !== undefined ? String(value) : existing.value,
          version: existing.version + 1,
        },
      });

      return res.json({ attributeValue: updated });
    } else {
      const created = await prisma.candidateAttributeValue.create({
        data: {
          candidateId,
          attributeId,
          value: String(value || ''),
          version: 1,
        },
      });

      return res.json({ attributeValue: created });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Remove attribute from profile
router.delete('/attributes/:attributeId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { attributeId } = req.params;
    const { targetUserId } = req.query;
    const candidateId = (req.user?.role === 'ADMIN' && targetUserId) ? String(targetUserId) : req.user!.id;

    await prisma.candidateAttributeValue.deleteMany({
      where: { candidateId, attributeId },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Create Candidate Project
router.post('/projects', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, startDate, endDate, description, tags, targetUserId } = req.body;
    const candidateId = (req.user?.role === 'ADMIN' && targetUserId) ? targetUserId : req.user!.id;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await prisma.candidateProject.create({
      data: {
        candidateId,
        name,
        startDate: startDate || '',
        endDate: endDate || '',
        description: description || '',
        tagsJson: JSON.stringify(tags || []),
      },
    });

    res.json({
      project: {
        ...project,
        tags: JSON.parse(project.tagsJson || '[]'),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Update Candidate Project
router.put('/projects/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, description, tags } = req.body;

    const existing = await prisma.candidateProject.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role !== 'ADMIN' && existing.candidateId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.candidateProject.update({
      where: { id },
      data: {
        name: name || existing.name,
        startDate: startDate !== undefined ? startDate : existing.startDate,
        endDate: endDate !== undefined ? endDate : existing.endDate,
        description: description !== undefined ? description : existing.description,
        tagsJson: tags ? JSON.stringify(tags) : existing.tagsJson,
      },
    });

    res.json({
      project: {
        ...updated,
        tags: JSON.parse(updated.tagsJson || '[]'),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Delete Candidate Project
router.delete('/projects/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.candidateProject.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role !== 'ADMIN' && existing.candidateId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.candidateProject.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get autocompletion tags for candidate projects
router.get('/tags/autocomplete', async (req, res) => {
  try {
    const projects = await prisma.candidateProject.findMany({ select: { tagsJson: true } });
    const tagSet = new Set<string>();
    for (const p of projects) {
      try {
        const arr = JSON.parse(p.tagsJson || '[]');
        arr.forEach((t: string) => tagSet.add(t));
      } catch (e) {}
    }
    res.json({ tags: Array.from(tagSet) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
