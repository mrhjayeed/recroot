import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken, requireAuth, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get list of CVs
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { positionId, candidateId } = req.query;

    const where: any = {};
    if (positionId) where.positionId = String(positionId);
    if (candidateId) where.candidateId = String(candidateId);

    // If user is candidate, only show their own CVs
    if (req.user?.role === 'CANDIDATE') {
      where.candidateId = req.user.id;
    }

    // Recruiters only see PUBLISHED CVs unless it's their admin view
    if (req.user?.role === 'RECRUITER') {
      where.status = 'PUBLISHED';
    }

    const cvs = await prisma.cV.findMany({
      where,
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, location: true },
        },
        position: {
          select: { id: true, title: true, isPublic: true },
        },
        likes: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result = cvs.map((c) => ({
      id: c.id,
      candidate: c.candidate,
      position: c.position,
      status: c.status,
      version: c.version,
      likesCount: c.likes.length,
      isLikedByMe: req.user ? c.likes.some((l) => l.recruiterId === req.user!.id) : false,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json({ cvs: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Create/Generate CV for candidate for a position
router.post('/generate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { positionId } = req.body;
    const candidateId = req.user!.id;

    if (!positionId) {
      return res.status(400).json({ error: 'Position ID is required' });
    }

    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    // Check if candidate already has a CV for this position
    const existingCv = await prisma.cV.findUnique({
      where: {
        candidateId_positionId: {
          candidateId,
          positionId,
        },
      },
    });

    if (existingCv) {
      return res.json({ cv: existingCv });
    }

    // Create CV entry (DRAFT status initially)
    const newCv = await prisma.cV.create({
      data: {
        candidateId,
        positionId,
        status: 'DRAFT',
        version: 1,
      },
    });

    // Ensure all position attributes exist in candidate profile (empty by default if missing)
    const attrIds: string[] = JSON.parse(position.attributeIdsJson || '[]');
    for (const attrId of attrIds) {
      const existingVal = await prisma.candidateAttributeValue.findUnique({
        where: {
          candidateId_attributeId: {
            candidateId,
            attributeId: attrId,
          },
        },
      });

      if (!existingVal) {
        await prisma.candidateAttributeValue.create({
          data: {
            candidateId,
            attributeId: attrId,
            value: '',
            version: 1,
          },
        });
      }
    }

    res.json({ cv: newCv });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET single rendered CV detail
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const cv = await prisma.cV.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            location: true,
            photoUrl: true,
            version: true,
          },
        },
        position: true,
        likes: true,
      },
    });

    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const isOwner = req.user?.id === cv.candidateId;
    const isAdmin = req.user?.role === 'ADMIN';
    const isRecruiter = req.user?.role === 'RECRUITER';

    // Recruiters cannot see DRAFT CVs
    if (!isOwner && !isAdmin && cv.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'This CV is in DRAFT mode and not published yet.' });
    }

    // Fetch position attribute definitions
    const positionAttrIds: string[] = JSON.parse(cv.position.attributeIdsJson || '[]');
    const attributes = await prisma.attribute.findMany({
      where: { id: { in: positionAttrIds } },
      include: { category: true },
    });

    // Fetch candidate attribute values
    const candidateValues = await prisma.candidateAttributeValue.findMany({
      where: { candidateId: cv.candidateId },
    });

    const valMap = new Map<string, { id: string; value: string; version: number }>();
    for (const cvVal of candidateValues) {
      valMap.set(cvVal.attributeId, { id: cvVal.id, value: cvVal.value, version: cvVal.version });
    }

    // Build rendered attributes array
    const renderedAttributes = attributes.map((attr) => {
      const match = valMap.get(attr.id);
      const valStr = match?.value || '';
      const isEmpty = !valStr || valStr.trim() === '';

      return {
        id: match?.id || null,
        attributeId: attr.id,
        name: attr.name,
        type: attr.type,
        options: JSON.parse(attr.optionsJson || '[]'),
        categoryName: attr.category.name,
        value: valStr,
        version: match?.version || 1,
        isEmpty, // flagged for red highlighting in UI!
      };
    });

    // Filter projects matching position tags
    const positionTags: string[] = JSON.parse(cv.position.projectTagsJson || '[]');
    const candidateProjects = await prisma.candidateProject.findMany({
      where: { candidateId: cv.candidateId },
      orderBy: { startDate: 'desc' },
    });

    const filteredProjects = candidateProjects
      .map((p) => ({
        ...p,
        tags: JSON.parse(p.tagsJson || '[]') as string[],
      }))
      .filter((p) => {
        if (positionTags.length === 0) return true;
        return p.tags.some((tag) => positionTags.includes(tag));
      })
      .slice(0, cv.position.maxProjects);

    // Calculate if all mandatory/template fields are filled for publishing
    const hasEmptyField = renderedAttributes.some((a) => a.isEmpty);

    res.json({
      cv: {
        id: cv.id,
        status: cv.status,
        version: cv.version,
        candidate: cv.candidate,
        position: {
          id: cv.position.id,
          title: cv.position.title,
          shortDescription: cv.position.shortDescription,
        },
        attributes: renderedAttributes,
        projects: filteredProjects,
        hasEmptyField,
        likesCount: cv.likes.length,
        isLikedByMe: req.user ? cv.likes.some((l) => l.recruiterId === req.user!.id) : false,
        canEdit: isOwner || isAdmin,
        isReadOnly: !isOwner && !isAdmin,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// In-place edit of attribute value directly on CV (updates Candidate Profile master value with optimistic locking!)
router.put('/:id/attribute', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { attributeId, value, version } = req.body;

    const cv = await prisma.cV.findUnique({ where: { id } });
    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const isOwner = req.user?.id === cv.candidateId;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Recruiters cannot edit CV attributes directly' });
    }

    const existing = await prisma.candidateAttributeValue.findUnique({
      where: {
        candidateId_attributeId: {
          candidateId: cv.candidateId,
          attributeId,
        },
      },
    });

    if (existing) {
      if (version !== undefined && existing.version !== Number(version)) {
        return res.status(409).json({
          error: 'Conflict: Attribute was modified on your profile or another window.',
          currentVersion: existing.version,
          currentValue: existing.value,
        });
      }

      const updated = await prisma.candidateAttributeValue.update({
        where: { id: existing.id },
        data: {
          value: String(value || ''),
          version: existing.version + 1,
        },
      });

      res.json({ attributeValue: updated });
    } else {
      const created = await prisma.candidateAttributeValue.create({
        data: {
          candidateId: cv.candidateId,
          attributeId,
          value: String(value || ''),
          version: 1,
        },
      });

      res.json({ attributeValue: created });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Update CV Publish status
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'PUBLISHED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const cv = await prisma.cV.findUnique({ where: { id } });
    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const isOwner = req.user?.id === cv.candidateId;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.cV.update({
      where: { id },
      data: { status },
    });

    res.json({ cv: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Delete CV
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const cv = await prisma.cV.findUnique({ where: { id } });
    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const isOwner = req.user?.id === cv.candidateId;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.cV.delete({ where: { id } });
    res.json({ success: true, message: 'CV deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Toggle Recruiter Like
router.post('/:id/like', requireRoles('RECRUITER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user!.id;

    const existingLike = await prisma.cVLike.findUnique({
      where: {
        cvId_recruiterId: {
          cvId: id,
          recruiterId,
        },
      },
    });

    if (existingLike) {
      await prisma.cVLike.delete({ where: { id: existingLike.id } });
      const likesCount = await prisma.cVLike.count({ where: { cvId: id } });
      return res.json({ isLiked: false, likesCount });
    } else {
      await prisma.cVLike.create({
        data: {
          cvId: id,
          recruiterId,
        },
      });
      const likesCount = await prisma.cVLike.count({ where: { cvId: id } });
      return res.json({ isLiked: true, likesCount });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
