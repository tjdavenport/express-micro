const bcrypt = require('bcryptjs');
const Sequelize = require('sequelize');

const {
  DB_NAME,
  DB_USERNAME,
  DB_PORT,
  DB_PASSWORD = '',
  DB_HOST
} = process.env;

const sql = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  dialect: 'postgres',
  port: DB_PORT,
});

const models = {
  User: sql.import('User', (sql, DataTypes) => {
    const User = sql.define('users', {
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        get: () => '****',
      },
    }, {
      indexes: [
        {
          name: 'unique_email',
          fields: ['email'],
        }
      ],
      timestamps: false
    });

    User.prototype.safePassword = function(rawPassword) {
      return bcrypt.hash(rawPassword, 5)
        .then(hashed => this.setDataValue('password', hashed));
    };

    User.prototype.checkPassword = function(rawPassword) {
      return bcrypt.compare(rawPassword, this.getDataValue('password'));
    };

    return User;
  }),
};

module.exports = {sql, models};
