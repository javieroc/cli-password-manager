'use strict'
module.exports = (sequelize, DataTypes) => {
  const Secret = sequelize.define('Secret', {
    username: DataTypes.STRING,
    name: DataTypes.STRING,
    value: DataTypes.STRING
  }, {
    tableName: 'secrets',
    underscored: true
  })
  Secret.associate = function (models) {
    Secret.belongsTo(models.User, {
      targetKey: 'username',
      foreignKey: 'username',
      as: 'user'
    })
  }
  return Secret
}
