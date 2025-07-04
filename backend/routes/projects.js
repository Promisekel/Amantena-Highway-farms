const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireStaffOrAdmin, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects
router.get('/', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, userId } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    AND: [
      status ? { status } : {},
      userId ? { userId } : {}
    ]
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: { name: true }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.project.count({ where })
  ]);

  res.json({
    projects,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / take),
      total,
      hasNext: skip + take < total,
      hasPrev: parseInt(page) > 1
    }
  });
}));

// Get project by ID
router.get('/:id', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, email: true }
      },
      tasks: {
        include: {
          assignee: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with this ID does not exist'
    });
  }

  res.json({ project });
}));

// Create project
router.post('/', requireStaffOrAdmin, validate(schemas.project), asyncHandler(async (req, res) => {
  const { title, description, status, startDate, endDate } = req.body;
  const userId = req.user.id;

  const project = await prisma.project.create({
    data: {
      title,
      description,
      status: status || 'PLANNING',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      userId
    },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  res.status(201).json({
    message: 'Project created successfully',
    project
  });
}));

// Update project
router.put('/:id', requireStaffOrAdmin, validate(schemas.project), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, startDate, endDate } = req.body;

  // Check if user owns the project or is admin
  const existingProject = await prisma.project.findUnique({
    where: { id }
  });

  if (!existingProject) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with this ID does not exist'
    });
  }

  if (existingProject.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'You can only edit your own projects'
    });
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      title,
      description,
      status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  res.json({
    message: 'Project updated successfully',
    project
  });
}));

// Delete project
router.delete('/:id', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: {
        select: { tasks: true }
      }
    }
  });

  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with this ID does not exist'
    });
  }

  if (project.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'You can only delete your own projects'
    });
  }

  await prisma.project.delete({
    where: { id }
  });

  res.json({
    message: 'Project deleted successfully',
    deletedTasks: project._count.tasks
  });
}));

// Get project tasks
router.get('/:id/tasks', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo } = req.query;

  const where = {
    projectId: id,
    AND: [
      status ? { status } : {},
      assignedTo ? { assignedTo } : {}
    ]
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: {
        select: { name: true }
      }
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  res.json({ tasks });
}));

// Create task for project
router.post('/:id/tasks', requireStaffOrAdmin, validate(schemas.task), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, assignedTo, dueDate } = req.body;

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id }
  });

  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with this ID does not exist'
    });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      projectId: id,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : null
    },
    include: {
      assignee: {
        select: { name: true }
      },
      project: {
        select: { title: true }
      }
    }
  });

  res.status(201).json({
    message: 'Task created successfully',
    task
  });
}));

// Update task
router.put('/tasks/:taskId', requireStaffOrAdmin, validate(schemas.task), asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, assignedTo, dueDate } = req.body;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : null
    },
    include: {
      assignee: {
        select: { name: true }
      },
      project: {
        select: { title: true }
      }
    }
  });

  res.json({
    message: 'Task updated successfully',
    task
  });
}));

// Delete task
router.delete('/tasks/:taskId', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  await prisma.task.delete({
    where: { id: taskId }
  });

  res.json({
    message: 'Task deleted successfully'
  });
}));

// Get project stats
router.get('/stats/overview', requireStaffOrAdmin, asyncHandler(async (req, res) => {
  const [totalProjects, activeProjects, completedProjects, totalTasks] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count()
  ]);

  res.json({
    stats: {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks
    }
  });
}));

module.exports = router;
