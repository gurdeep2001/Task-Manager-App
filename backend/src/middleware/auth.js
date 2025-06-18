const jwt = require('jsonwebtoken');
const { User, Project } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    const user = await User.findById(decoded.user.id);

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

const checkProjectAccess = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId;
      const userId = req.user._id;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Project owner has full access
      if (project.owner.toString() === userId.toString()) {
        req.projectRole = 'Owner';
        return next();
      }

      // Check shared access
      const share = project.sharedWith.find(
        share => share.user.toString() === userId.toString()
      );

      if (!share) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const roleHierarchy = {
        'Owner': 3,
        'Editor': 2,
        'Viewer': 1
      };

      if (roleHierarchy[share.role] < roleHierarchy[requiredRole]) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.projectRole = share.role;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
};

module.exports = {
  auth,
  checkProjectAccess
}; 