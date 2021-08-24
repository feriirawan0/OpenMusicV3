const { Pool } = require('pg');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylists(playlistId) {
    const query = {
      text: `SELECT songs.* FROM songs 
      INNER JOIN playlistsongs ON songs.id = playlistsongs.song_id 
      WHERE playlistsongs.playlist_id = $1`,
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    return result.rows.map((song) => ({
      id: song.id,
      title: song.title,
      performer: song.performer,
      genre: song.genre,
      year: song.year,
      duration: song.duration,
    }));
  }
}

module.exports = PlaylistsService;
