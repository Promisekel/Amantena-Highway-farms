const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    AND: [
      search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      role ? { role } : {}
    ]
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { sales: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    users,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / take),
      total,
      hasNext: skip + take < total,
      hasPrev: parseInt(page) > 1
    }
  });
}));

// Get user by ID
router.get('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          sales: true,
          invitesSent: true,
          events: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User with this ID does not exist'
    });
  }

  res.json({ user });
}));

// Update user (Admin only)
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, isActive } = req.body;

  // Don't allow admin to deactivate themselves
  if (req.user.id === id && isActive === false) {
    return res.status(400).json({
      error: 'Invalid operation',
      message: 'You cannot deactivate your own account'
    });
  }

  // Don't allow admin to change their own role to STAFF
  if (req.user.id === id && role === 'STAFF') {
    return res.status(400).json({
      error: 'Invalid operation',
      message: 'You cannot change your own role to STAFF'
    });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email: email.toLowerCase() }),
      ...(role && { role }),
      ...(typeof isActive === 'boolean' && { isActive })
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  res.json({
    message: 'User updated successfully',
    user
  });
}));

// Delete user (Admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Don't allow admin to delete themselves
  if (req.user.id === id) {
    return res.status(400).json({
      error: 'Invalid operation',
      message: 'You cannot delete your own account'
    });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: { sales: true }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User with this ID does not exist'
    });
  }

  // If user has sales, deactivate instead of delete
  if (user._count.sales > 0) {
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      message: 'User deactivated (has sales records)',
      action: 'deactivated'
    });
  }

  await prisma.user.delete({
    where: { id }
  });

  res.json({
    message: 'User deleted successfully',
    action: 'deleted'
  });
}));

// Get user stats (Admin only)
router.get('/stats/overview', requireAdmin, asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, adminUsers, staffUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'STAFF' } })
  ]);

  res.json({
    stats: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      admins: adminUsers,
      staff: staffUsers
    }
  });
}));

module.exports = router;
