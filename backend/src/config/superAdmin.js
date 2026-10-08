import './env.js';

// Super Admin is not stored in MongoDB. These hardcoded credentials can be
// overridden through SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD in .env.
const superAdmin = {
  id: 'super-admin',
  name: 'Super Admin',
  email: (process.env.SUPER_ADMIN_EMAIL || 'superadmin@gmail.com').toLowerCase(),
  password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin@gmail.com',
  role: 'superadmin',
};

export default superAdmin;
