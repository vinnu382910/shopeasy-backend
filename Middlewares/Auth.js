const jwt = require('jsonwebtoken');
const User = require('../Models/User'); // Assuming your user collection model

const ensureAuthenticatedUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check if Authorization header is present and starts with "Bearer"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized, Bearer token required' });
  }

  const token = authHeader.split(' ')[1]; // Extract token

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized, JWT token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = decoded; // Optionally attach decoded payload to request

    // Check if user exists in the User collection
    const existingUser = await User.findOne({ email: decoded.email });

    if (!existingUser) {
      return res.status(403).json({ message: 'Access forbidden: user not found' });
    }

    req.authenticatedUser = existingUser; // Attach full user data if needed
    next(); // Proceed
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ message: 'Unauthorized, token invalid or expired' });
  }
};

module.exports = ensureAuthenticatedUser;
