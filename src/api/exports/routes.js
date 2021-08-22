const routes = (handler) => [
  {
    method: 'POST',
    path: '/exports/playlists/{playlistId}',
    handler: handler.postExportSongsHandler,
    options: {
      auth: 'music_jwt',
    },
  },
];

module.exports = routes;
