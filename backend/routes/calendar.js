const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireStaffOrAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all calendar events
router.get('/', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate, type, userId } = req.query;

  const where = {
    AND: [
      startDate ? { date: { gte: new Date(startDate) } } : {},
      endDate ? { date: { lte: new Date(endDate) } } : {},
      type ? { type } : {},
      userId ? { userId } : {}
    ]
  };

  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { date: 'asc' }
  });

  res.json({ events });
}));

// Get event by ID
router.get('/:id', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await prisma.calendarEvent.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  });

  if (!event) {
    return res.status(404).json({
      error: 'Event not found',
      message: 'Calendar event with this ID does not exist'
    });
  }

  res.json({ event });
}));

// Create calendar event
router.post('/', requireStaffOrAdmin, validate(schemas.calendarEvent), asyncHandler(async (req, res) => {
  const { title, date, type, description } = req.body;
  const userId = req.user.id;

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      date: new Date(date),
      type: type || 'GENERAL',
      description,
      userId
    },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.emit('event-created', event);

  res.status(201).json({
    message: 'Calendar event created successfully',
    event
  });
}));

// Update calendar event
router.put('/:id', requireStaffOrAdmin, validate(schemas.calendarEvent), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, date, type, description } = req.body;

  // Check if user owns the event or is admin
  const existingEvent = await prisma.calendarEvent.findUnique({
    where: { id }
  });

  if (!existingEvent) {
    return res.status(404).json({
      error: 'Event not found',
      message: 'Calendar event with this ID does not exist'
    });
  }

  if (existingEvent.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'You can only edit your own events'
    });
  }

  const event = await prisma.calendarEvent.update({
    where: { id },
    data: {
      title,
      date: new Date(date),
      type,
      description
    },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.emit('event-updated', event);

  res.json({
    message: 'Calendar event updated successfully',
    event
  });
}));

// Delete calendar event
router.delete('/:id', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await prisma.calendarEvent.findUnique({
    where: { id }
  });

  if (!event) {
    return res.status(404).json({
      error: 'Event not found',
      message: 'Calendar event with this ID does not exist'
    });
  }

  if (event.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'You can only delete your own events'
    });
  }

  await prisma.calendarEvent.delete({
    where: { id }
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.emit('event-deleted', { id });

  res.json({
    message: 'Calendar event deleted successfully'
  });
}));

// Get upcoming events
router.get('/upcoming/list', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { limit = 5, days = 7 } = req.query;
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + parseInt(days));

  const events = await prisma.calendarEvent.findMany({
    where: {
      date: {
        gte: new Date(),
        lte: endDate
      }
    },
    take: parseInt(limit),
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { date: 'asc' }
  });

  res.json({ events });
}));

// Get events by month
router.get('/month/:year/:month', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);

  const events = await prisma.calendarEvent.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { date: 'asc' }
  });

  res.json({ events });
}));

// Get event types
router.get('/meta/types', requireStaffOrAdmin, (req, res) => {
  const types = [
    { value: 'MEETING', label: 'Meeting' },
    { value: 'HARVEST', label: 'Harvest' },
    { value: 'PLANTING', label: 'Planting' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'GENERAL', label: 'General' }
  ];

  res.json({ types });
});

module.exports = router;
