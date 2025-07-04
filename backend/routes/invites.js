const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendInviteEmail } = require('../config/email');

const router = express.Router();
const prisma = new PrismaClient();

// Get all invites (Admin only)
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = status ? { status } : {};

  const [invites, total] = await Promise.all([
    prisma.invite.findMany({
      where,
      skip,
      take,
      include: {
        inviter: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.invite.count({ where })
  ]);

  res.json({
    invites,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / take),
      total,
      hasNext: skip + take < total,
      hasPrev: parseInt(page) > 1
    }
  });
}));

// Send invite (Admin only)
router.post('/', requireAdmin, validate(schemas.invite), asyncHandler(async (req, res) => {
  const { email, role = 'STAFF' } = req.body;
  const invitedBy = req.user.id;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    return res.status(409).json({
      error: 'User exists',
      message: 'A user with this email already exists'
    });
  }

  // Check if there's already a pending invite
  const existingInvite = await prisma.invite.findFirst({
    where: {
      email: email.toLowerCase(),
      status: 'PENDING',
      expiresAt: { gt: new Date() }
    }
  });

  if (existingInvite) {
    return res.status(409).json({
      error: 'Invite exists',
      message: 'A pending invitation already exists for this email'
    });
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Create invite (expires in 7 days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const invite = await prisma.invite.create({
    data: {
      email: email.toLowerCase(),
      token,
      role,
      invitedBy,
      expiresAt
    },
    include: {
      inviter: {
        select: { name: true }
      }
    }
  });

  // Send email
  try {
    await sendInviteEmail(email, token, invite.inviter.name);
    
    res.status(201).json({
      message: 'Invitation sent successfully',
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt
      }
    });
  } catch (emailError) {
    // Delete the invite if email fails
    await prisma.invite.delete({ where: { id: invite.id } });
    
    console.error('Failed to send invite email:', emailError);
    
    return res.status(500).json({
      error: 'Email failed',
      message: 'Failed to send invitation email. Please check email configuration.'
    });
  }
}));

// Resend invite (Admin only)
router.post('/:id/resend', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invite = await prisma.invite.findUnique({
    where: { id },
    include: {
      inviter: {
        select: { name: true }
      }
    }
  });

  if (!invite) {
    return res.status(404).json({
      error: 'Invite not found',
      message: 'Invitation with this ID does not exist'
    });
  }

  if (invite.status !== 'PENDING') {
    return res.status(400).json({
      error: 'Invalid status',
      message: 'Can only resend pending invitations'
    });
  }

  // Update expiry date
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const updatedInvite = await prisma.invite.update({
    where: { id },
    data: { expiresAt }
  });

  // Resend email
  try {
    await sendInviteEmail(invite.email, invite.token, invite.inviter.name);
    
    res.json({
      message: 'Invitation resent successfully',
      invite: updatedInvite
    });
  } catch (emailError) {
    console.error('Failed to resend invite email:', emailError);
    
    return res.status(500).json({
      error: 'Email failed',
      message: 'Failed to resend invitation email'
    });
  }
}));

// Cancel invite (Admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invite = await prisma.invite.findUnique({
    where: { id }
  });

  if (!invite) {
    return res.status(404).json({
      error: 'Invite not found',
      message: 'Invitation with this ID does not exist'
    });
  }

  if (invite.status !== 'PENDING') {
    return res.status(400).json({
      error: 'Invalid status',
      message: 'Can only cancel pending invitations'
    });
  }

  await prisma.invite.update({
    where: { id },
    data: { status: 'EXPIRED' }
  });

  res.json({
    message: 'Invitation cancelled successfully'
  });
}));

// Get invite stats (Admin only)
router.get('/stats/overview', requireAdmin, asyncHandler(async (req, res) => {
  const [pending, accepted, expired] = await Promise.all([
    prisma.invite.count({ where: { status: 'PENDING' } }),
    prisma.invite.count({ where: { status: 'ACCEPTED' } }),
    prisma.invite.count({ where: { status: 'EXPIRED' } })
  ]);

  res.json({
    stats: {
      pending,
      accepted,
      expired,
      total: pending + accepted + expired
    }
  });
}));

// Get recent invites (Admin only)
router.get('/recent', requireAdmin, asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const invites = await prisma.invite.findMany({
    take: parseInt(limit),
    include: {
      inviter: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ invites });
}));

module.exports = router;
