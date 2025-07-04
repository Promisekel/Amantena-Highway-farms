const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Access forbidden',
      message: 'Admin privileges required'
    });
  }
  
  next();
};

const requireStaffOrAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  
  if (!['ADMIN', 'STAFF'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access forbidden',
      message: 'Staff or admin privileges required'
    });
  }
  
  next();
};

const attachUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireStaffOrAdmin,
  attachUser
};
