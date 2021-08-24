const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationsService, cacheService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addPlaylist({ name, userId }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, userId],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    await this._cacheService.delete(`playlists:${userId}`);

    return result.rows[0].id;
  }

  async getPlaylists(userId) {
    try {
      const resultCache = await this._cacheService.get(`playlists:${userId}`);
      return JSON.parse(resultCache);
    } catch (error) {
      const query = {
        text: `SELECT playlists.id, playlists.name, users.username 
        FROM playlists 
        INNER JOIN users ON  playlists.owner = users.id 
        LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id 
        WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
        values: [userId],
      };

      const result = await this._pool.query(query);

      await this._cacheService.set(`playlists:${userId}`, JSON.stringify(result.rows));

      return result.rows;
    }
  }

  async deletePlaylistById(playlistId, userId) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }

    await this._cacheService.delete(`playlists:${userId}`);
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlistsong-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    await this._cacheService.delete(`playlistSongs:${playlistId}`);
    return result.rows[0].id;
  }

  async getSongsFromPlaylist(playlistId) {
    try {
      const result = await this._cacheService.get(`playlistSongs:${playlistId}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: 'SELECT songs.id, songs.title, songs.performer FROM songs INNER JOIN playlistsongs ON songs.id = playlistsongs.song_id WHERE playlistsongs.playlist_id = $1',
        values: [playlistId],
      };

      const result = await this._pool.query(query);

      // save cache
      await this._cacheService.set(`playlistSongs:${playlistId}`, JSON.stringify(result.rows));

      return result.rows;
    }
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }

    await this._cacheService.delete(`playlistSongs:${playlistId}`);
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
