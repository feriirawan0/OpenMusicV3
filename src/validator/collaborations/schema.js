const Joi = require('joi');

const CollaborationPlayloadSchema = Joi.object({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

module.exports = {
  CollaborationPlayloadSchema,
};
