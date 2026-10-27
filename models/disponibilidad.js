const { DataTypes } = require('sequelize');
const { bdMySQL } = require('../database/db_conection');
const Proveedor = require('./proveedor');

const Disponibilidad = bdMySQL.define('Disponibilidad', {
    id_disponibilidad: {
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
    dia: {
        type: DataTypes.CHAR(2), // 'LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'
        allowNull: false,
        validate: {
            isIn: [['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']]
        }
    },
    hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false
    },
    hora_fin: {
        type: DataTypes.TIME,
        allowNull: false
    }
}, {
    tableName: 'DISPONIBILIDAD',
    timestamps: false
});

Proveedor.hasMany(Disponibilidad, { foreignKey: 'id_proveedor', as: 'disponibilidades', onDelete: 'CASCADE' });
Disponibilidad.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });

module.exports = Disponibilidad;