const { DataTypes } = require('sequelize');
const { bdMySQL } = require('../database/db_conection');
const Proveedor = require('./proveedor');

const PeriodoNoDisponible = bdMySQL.define('PeriodoNoDisponible', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Proveedor,
            key: 'id_proveedor'
        }
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'PERIODO_NO_DISPONIBLE',
    timestamps: false
});

Proveedor.hasMany(PeriodoNoDisponible, { foreignKey: 'id_proveedor', as: 'periodosNoDisponibles', onDelete: 'CASCADE' });
PeriodoNoDisponible.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });

module.exports = PeriodoNoDisponible;