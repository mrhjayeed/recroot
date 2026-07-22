import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res: Response) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const cvsCreated24h = await prisma.cV.count({
      where: { createdAt: { gte: twentyFourHoursAgo } },
    });

    const totalPositions = await prisma.position.count();
    const candidateCount = await prisma.user.count({ where: { role: 'CANDIDATE' } });
    const recruiterCount = await prisma.user.count({ where: { role: 'RECRUITER' } });
    const totalSubmittedCvs = await prisma.cV.count({ where: { status: 'PUBLISHED' } });

    // Latest 5 positions
    const latestPositions = await prisma.position.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        cvs: {
          where: { status: 'PUBLISHED' },
          select: { id: true },
        },
      },
    });

    // Top 5 popular positions ranked by submitted CV count
    const allPositions = await prisma.position.findMany({
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        cvs: {
          where: { status: 'PUBLISHED' },
          select: { id: true },
        },
      },
    });

    const sortedByPopularity = [...allPositions]
      .sort((a, b) => b.cvs.length - a.cvs.length)
      .slice(0, 5);

    // Tag cloud from position projectTags and candidate project tags
    const tagCountMap = new Map<string, number>();

    const positionsForTags = await prisma.position.findMany({ select: { projectTagsJson: true } });
    for (const p of positionsForTags) {
      try {
        const tags: string[] = JSON.parse(p.projectTagsJson || '[]');
        tags.forEach((t) => tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1));
      } catch (e) {}
    }

    const projectsForTags = await prisma.candidateProject.findMany({ select: { tagsJson: true } });
    for (const pr of projectsForTags) {
      try {
        const tags: string[] = JSON.parse(pr.tagsJson || '[]');
        tags.forEach((t) => tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1));
      } catch (e) {}
    }

    const tagCloud = Array.from(tagCountMap.entries()).map(([tag, count]) => ({
      tag,
      count,
    }));

    res.json({
      stats: {
        cvsCreated24h,
        totalPositions,
        candidateCount,
        recruiterCount,
        totalSubmittedCvs,
      },
      latestPositions: latestPositions.map((p) => ({
        id: p.id,
        title: p.title,
        shortDescription: p.shortDescription,
        isPublic: p.isPublic,
        submittedCvCount: p.cvs.length,
        createdByName: `${p.createdBy.firstName} ${p.createdBy.lastName}`,
        updatedAt: p.updatedAt,
      })),
      popularPositions: sortedByPopularity.map((p) => ({
        id: p.id,
        title: p.title,
        shortDescription: p.shortDescription,
        isPublic: p.isPublic,
        submittedCvCount: p.cvs.length,
        createdByName: `${p.createdBy.firstName} ${p.createdBy.lastName}`,
        updatedAt: p.updatedAt,
      })),
      tagCloud,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
