const { DataTypes } = require('sequelize');
const { bdMySQL } = require('../database/db_conection');
const Servicio = require('./servicio');

const InsumoEquipo = bdMySQL.define('InsumoEquipo', {
    id_insumo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_servicio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Servicio,
            key: 'id_servicio'
        }
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    }
}, {
    tableName: 'INSUMO_EQUIPO',
    timestamps: false
});

Servicio.hasMany(InsumoEquipo, { foreignKey: 'id_servicio', as: 'insumos', onDelete: 'CASCADE' });
InsumoEquipo.belongsTo(Servicio, { foreignKey: 'id_servicio', as: 'servicio' });

module.exports = InsumoEquipo;