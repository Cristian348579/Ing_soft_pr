const { DataTypes } = require('sequelize');
const { bdMySQL } = require('../database/db_conection');
const Comuna = require('./comuna');

const Barrio = bdMySQL.define('Barrio', {
    id_barrio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_comuna: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Comuna,
            key: 'id_comuna'
        }
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'BARRIO',
    timestamps: false
});


Comuna.hasMany(Barrio, { foreignKey: 'id_comuna', onDelete: 'CASCADE' });
Barrio.belongsTo(Comuna, { foreignKey: 'id_comuna' });

module.exports = Barrio;