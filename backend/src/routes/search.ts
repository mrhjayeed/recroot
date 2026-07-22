import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const query = String(req.query.q || '').trim();

    if (!query) {
      return res.json({ results: { positions: [], cvs: [], attributes: [], profiles: [] } });
    }

    const isRecruiterOrAdmin = req.user?.role === 'RECRUITER' || req.user?.role === 'ADMIN';

    // 1. Search Positions
    const positions = await prisma.position.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { shortDescription: { contains: query } },
          { projectTagsJson: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        isPublic: true,
        projectTagsJson: true,
        updatedAt: true,
      },
      take: 10,
    });

    // 2. Search Attributes
    const attributes = await prisma.attribute.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { category: { name: { contains: query } } },
        ],
      },
      include: { category: true },
      take: 10,
    });

    // 3. Search CVs (Recruiters see all published, Candidates see own)
    const cvWhere: any = {
      OR: [
        { candidate: { firstName: { contains: query } } },
        { candidate: { lastName: { contains: query } } },
        { position: { title: { contains: query } } },
      ],
    };

    if (!isRecruiterOrAdmin) {
      cvWhere.candidateId = req.user?.id || 'none';
    } else {
      cvWhere.status = 'PUBLISHED';
    }

    const cvs = await prisma.cV.findMany({
      where: cvWhere,
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        position: {
          select: { id: true, title: true },
        },
        likes: true,
      },
      take: 10,
    });

    // 4. Search Profiles (Recruiters & Admins)
    let profiles: any[] = [];
    if (isRecruiterOrAdmin) {
      profiles = await prisma.user.findMany({
        where: {
          role: 'CANDIDATE',
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { location: { contains: query } },
            { email: { contains: query } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          location: true,
          photoUrl: true,
        },
        take: 10,
      });
    }

    res.json({
      results: {
        positions: positions.map((p) => ({
          ...p,
          projectTags: JSON.parse(p.projectTagsJson || '[]'),
        })),
        attributes,
        cvs: cvs.map((c) => ({
          id: c.id,
          candidateName: `${c.candidate.firstName} ${c.candidate.lastName}`,
          positionTitle: c.position.title,
          status: c.status,
          likesCount: c.likes.length,
        })),
        profiles,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
