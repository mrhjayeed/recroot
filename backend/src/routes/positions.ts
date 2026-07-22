import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken, requireAuth, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper to evaluate access rules for a candidate
async function checkCandidateAccess(candidateId: string, accessRulesJson: string): Promise<{ isEligible: boolean; failedRules: string[] }> {
  const rules = JSON.parse(accessRulesJson || '[]');
  if (rules.length === 0) return { isEligible: true, failedRules: [] };

  const candidateValues = await prisma.candidateAttributeValue.findMany({
    where: { candidateId },
    include: { attribute: true },
  });

  const valueMap = new Map<string, string>();
  for (const v of candidateValues) {
    valueMap.set(v.attributeId, v.value);
  }

  const failedRules: string[] = [];

  for (const rule of rules) {
    const { attributeId, operator, value: targetValue } = rule;
    const val = valueMap.get(attributeId);
    const attr = candidateValues.find((c) => c.attributeId === attributeId)?.attribute;
    const attrName = attr?.name || 'Attribute';

    if (val === undefined || val === '') {
      failedRules.push(`${attrName} is required but missing`);
      continue;
    }

    if (operator === '=') {
      if (val.toLowerCase() !== String(targetValue).toLowerCase()) {
        failedRules.push(`${attrName} must be equal to '${targetValue}' (current: '${val}')`);
      }
    } else if (operator === '!=') {
      if (val.toLowerCase() === String(targetValue).toLowerCase()) {
        failedRules.push(`${attrName} must not be '${targetValue}'`);
      }
    } else if (['>', '<', '>=', '<='].includes(operator)) {
      const numVal = parseFloat(val);
      const numTarget = parseFloat(targetValue);
      if (isNaN(numVal) || isNaN(numTarget)) {
        failedRules.push(`${attrName} numeric evaluation failed`);
      } else {
        if (operator === '>' && !(numVal > numTarget)) failedRules.push(`${attrName} must be > ${numTarget}`);
        if (operator === '<' && !(numVal < numTarget)) failedRules.push(`${attrName} must be < ${numTarget}`);
        if (operator === '>=' && !(numVal >= numTarget)) failedRules.push(`${attrName} must be >= ${numTarget}`);
        if (operator === '<=' && !(numVal <= numTarget)) failedRules.push(`${attrName} must be <= ${numTarget}`);
      }
    }
  }

  return {
    isEligible: failedRules.length === 0,
    failedRules,
  };
}

// Get positions list
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const positions = await prisma.position.findMany({
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        cvs: {
          select: { id: true, status: true, candidateId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const isCandidate = req.user?.role === 'CANDIDATE';
    const candidateId = req.user?.id;

    const result = await Promise.all(
      positions.map(async (pos) => {
        let isEligible = true;
        let failedRules: string[] = [];

        if (isCandidate && candidateId) {
          const evalResult = await checkCandidateAccess(candidateId, pos.accessRulesJson);
          isEligible = evalResult.isEligible;
          failedRules = evalResult.failedRules;
        }

        const candidateCv = candidateId ? pos.cvs.find((c) => c.candidateId === candidateId) : null;
        const submittedCvCount = pos.cvs.filter((c) => c.status === 'PUBLISHED').length;

        return {
          id: pos.id,
          title: pos.title,
          shortDescription: pos.shortDescription,
          isPublic: pos.isPublic,
          version: pos.version,
          createdAt: pos.createdAt,
          updatedAt: pos.updatedAt,
          createdBy: pos.createdBy,
          accessRules: JSON.parse(pos.accessRulesJson || '[]'),
          attributeIds: JSON.parse(pos.attributeIdsJson || '[]'),
          projectTags: JSON.parse(pos.projectTagsJson || '[]'),
          maxProjects: pos.maxProjects,
          submittedCvCount,
          isEligible,
          failedRules,
          hasSubmittedCv: !!candidateCv,
          candidateCvId: candidateCv?.id || null,
          candidateCvStatus: candidateCv?.status || null,
        };
      })
    );

    // If user is candidate, filter out non-public or ineligible positions if restricted
    const filtered = result.filter((p) => {
      if (req.user?.role === 'RECRUITER' || req.user?.role === 'ADMIN') return true;
      if (!p.isPublic && !p.isEligible) return false;
      return true;
    });

    res.json({ positions: filtered });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get single position detail
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const pos = await prisma.position.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        cvs: {
          include: {
            candidate: {
              select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true },
            },
            likes: true,
          },
        },
      },
    });

    if (!pos) {
      return res.status(404).json({ error: 'Position not found' });
    }

    // Fetch attributes details
    const attrIds = JSON.parse(pos.attributeIdsJson || '[]');
    const attributes = await prisma.attribute.findMany({
      where: { id: { in: attrIds } },
      include: { category: true },
    });

    let isEligible = true;
    let failedRules: string[] = [];
    if (req.user?.role === 'CANDIDATE' && req.user.id) {
      const evalResult = await checkCandidateAccess(req.user.id, pos.accessRulesJson);
      isEligible = evalResult.isEligible;
      failedRules = evalResult.failedRules;
    }

    // Process CV list for recruiters / admin
    const cvsList = pos.cvs.map((cv) => ({
      id: cv.id,
      candidate: cv.candidate,
      status: cv.status,
      likesCount: cv.likes.length,
      isLikedByMe: req.user ? cv.likes.some((l) => l.recruiterId === req.user!.id) : false,
      createdAt: cv.createdAt,
      updatedAt: cv.updatedAt,
    }));

    res.json({
      position: {
        id: pos.id,
        title: pos.title,
        shortDescription: pos.shortDescription,
        isPublic: pos.isPublic,
        version: pos.version,
        createdAt: pos.createdAt,
        updatedAt: pos.updatedAt,
        createdBy: pos.createdBy,
        accessRules: JSON.parse(pos.accessRulesJson || '[]'),
        attributeIds: attrIds,
        attributes,
        projectTags: JSON.parse(pos.projectTagsJson || '[]'),
        maxProjects: pos.maxProjects,
        isEligible,
        failedRules,
        cvs: cvsList,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Create position (Recruiter / Admin)
router.post('/', requireRoles('RECRUITER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, shortDescription, isPublic, accessRules, attributeIds, projectTags, maxProjects } = req.body;

    if (!title || !shortDescription) {
      return res.status(400).json({ error: 'Title and short description are required' });
    }

    const pos = await prisma.position.create({
      data: {
        title,
        shortDescription,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
        accessRulesJson: JSON.stringify(accessRules || []),
        attributeIdsJson: JSON.stringify(attributeIds || []),
        projectTagsJson: JSON.stringify(projectTags || []),
        maxProjects: Number(maxProjects) || 3,
        createdById: req.user!.id,
        version: 1,
      },
    });

    res.json({ position: pos });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Duplicate position
router.post('/:id/duplicate', requireRoles('RECRUITER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Position not found' });
    }

    const duplicated = await prisma.position.create({
      data: {
        title: `${existing.title} (Copy)`,
        shortDescription: existing.shortDescription,
        isPublic: existing.isPublic,
        accessRulesJson: existing.accessRulesJson,
        attributeIdsJson: existing.attributeIdsJson,
        projectTagsJson: existing.projectTagsJson,
        maxProjects: existing.maxProjects,
        createdById: req.user!.id,
        version: 1,
      },
    });

    res.json({ position: duplicated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Update position with Optimistic Locking Check
router.put('/:id', requireRoles('RECRUITER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, shortDescription, isPublic, accessRules, attributeIds, projectTags, maxProjects, version } = req.body;

    if (version === undefined) {
      return res.status(400).json({ error: 'Version number is required for optimistic locking' });
    }

    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Position not found' });
    }

    if (existing.version !== Number(version)) {
      return res.status(409).json({
        error: 'Conflict: Position was updated by another user. Please refresh and try again.',
        currentVersion: existing.version,
      });
    }

    const updated = await prisma.position.update({
      where: { id },
      data: {
        title: title || existing.title,
        shortDescription: shortDescription || existing.shortDescription,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : existing.isPublic,
        accessRulesJson: accessRules ? JSON.stringify(accessRules) : existing.accessRulesJson,
        attributeIdsJson: attributeIds ? JSON.stringify(attributeIds) : existing.attributeIdsJson,
        projectTagsJson: projectTags ? JSON.stringify(projectTags) : existing.projectTagsJson,
        maxProjects: maxProjects !== undefined ? Number(maxProjects) : existing.maxProjects,
        version: existing.version + 1,
      },
    });

    res.json({ position: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Delete position
router.delete('/:id', requireRoles('RECRUITER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.position.delete({ where: { id } });
    res.json({ success: true, message: 'Position deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET Discussions
router.get('/:id/discussions', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const posts = await prisma.discussionPost.findMany({
      where: { positionId: id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true, photoUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ posts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST Discussion post
router.post('/:id/discussions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content cannot be empty' });
    }

    const post = await prisma.discussionPost.create({
      data: {
        positionId: id,
        authorId: req.user!.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true, photoUrl: true },
        },
      },
    });

    res.json({ post });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
