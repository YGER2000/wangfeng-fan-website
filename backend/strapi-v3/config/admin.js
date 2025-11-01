export default {
  auth: {
    secret: process.env.ADMIN_JWT_SECRET || 'to-change-in-production',
  },
  apiToken: {
    salt: process.env.API_TOKEN_SALT || 'to-change-in-production',
  },
  transfer: {
    token: {
      salt: process.env.TRANSFER_TOKEN_SALT || 'to-change-in-production',
    },
  },
  flags: {
    nps: false,
    promoteEE: false,
  },
};
