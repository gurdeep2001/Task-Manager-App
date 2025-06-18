module.exports = (sequelize, DataTypes) => {
  const ProjectShare = sequelize.define('ProjectShare', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('Owner', 'Editor', 'Viewer'),
      allowNull: false,
      defaultValue: 'Viewer'
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['projectId', 'userId']
      }
    ]
  });

  return ProjectShare;
}; 