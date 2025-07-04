const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Login
router.post('/login', validate(schemas.login), (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: info.message || 'Invalid credentials'
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });
  })(req, res, next);
});

// Register (with invite token)
router.post('/register', validate(schemas.register), asyncHandler(async (req, res) => {
  const { name, email, password, token } = req.body;

  // Verify invite token
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { inviter: true }
  });

  if (!invite) {
    return res.status(400).json({
      error: 'Invalid token',
      message: 'Invitation token is invalid or expired'
    });
  }

  if (invite.status !== 'PENDING') {
    return res.status(400).json({
      error: 'Token already used',
      message: 'This invitation has already been used'
    });
  }

  if (invite.expiresAt < new Date()) {
    return res.status(400).json({
      error: 'Token expired',
      message: 'This invitation has expired'
    });
  }

  if (invite.email.toLowerCase() !== email.toLowerCase()) {
    return res.status(400).json({
      error: 'Email mismatch',
      message: 'Email does not match the invitation'
    });
  }

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

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: invite.role
    }
  });

  // Update invite status
  await prisma.invite.update({
    where: { id: invite.id },
    data: { status: 'ACCEPTED' }
  });

  // Auto-login the user
  req.logIn(user, (err) => {
    if (err) {
      return res.status(500).json({
        error: 'Login failed',
        message: 'User created but auto-login failed'
      });
    }

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
}));

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        error: 'Logout failed',
        message: 'Could not log out user'
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: 'Session cleanup failed',
          message: 'Logged out but session cleanup failed'
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'No active session found'
    });
  }

  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    } : null
  });
});

// Verify invite token
router.get('/verify-invite/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { inviter: true }
  });

  if (!invite) {
    return res.status(404).json({
      error: 'Invalid token',
      message: 'Invitation token not found'
    });
  }

  if (invite.status !== 'PENDING') {
    return res.status(400).json({
      error: 'Token used',
      message: 'This invitation has already been used'
    });
  }

  if (invite.expiresAt < new Date()) {
    return res.status(400).json({
      error: 'Token expired',
      message: 'This invitation has expired'
    });
  }

  res.json({
    valid: true,
    email: invite.email,
    role: invite.role,
    inviterName: invite.inviter.name
  });
}));

module.exports = router;
