export default {
  routes: [
    {
      method: 'GET',
      path: '/videos',
      handler: 'video.find',
    },
    {
      method: 'GET',
      path: '/videos/:id',
      handler: 'video.findOne',
    },
    {
      method: 'POST',
      path: '/videos',
      handler: 'video.create',
    },
    {
      method: 'PUT',
      path: '/videos/:id',
      handler: 'video.update',
    },
    {
      method: 'DELETE',
      path: '/videos/:id',
      handler: 'video.delete',
    },
  ],
};
