const verifyEnvironment = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing. Server refusing to start.');
  }
};

module.exports = { verifyEnvironment };
