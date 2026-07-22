import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-recroot-key-2026';

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = ['CANDIDATE', 'RECRUITER', 'ADMIN'].includes(role) ? role : 'CANDIDATE';

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        role: assignedRole,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        location: true,
        photoUrl: true,
        isBlocked: true,
        version: true,
      },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      location: user.location,
      photoUrl: user.photoUrl,
      isBlocked: user.isBlocked,
      version: user.version,
    };

    res.json({ token, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get current logged-in user
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        location: true,
        photoUrl: true,
        isBlocked: true,
        version: true,
      },
    });
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Admin: Get all users
router.get('/users', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        location: true,
        isBlocked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Admin: Toggle block/unblock user
router.patch('/users/:id/block', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isBlocked: Boolean(isBlocked) },
      select: { id: true, email: true, isBlocked: true },
    });

    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Admin: Change user role / self demote
router.patch('/users/:id/role', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CANDIDATE', 'RECRUITER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Admin: Delete user
router.delete('/users/:id', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
