const {
  UserPayloadSchema,
} = require('./schema');

const InvariantError = require('../../exceptions/InvariantError');

const UsersValidator = {
  validateUserPayload: (payload) => {
    const validationReslut = UserPayloadSchema.validate(payload);

    if (validationReslut.error) {
      throw new InvariantError(validationReslut.error.message);
    }
  },
};

module.exports = UsersValidator;
