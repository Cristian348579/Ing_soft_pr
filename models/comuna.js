const { DataTypes } = require('sequelize');
const { bdMySQL } = require('../database/db_conection');

const Comuna = bdMySQL.define('Comuna', {
    id_comuna: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'COMUNA',
    timestamps: false
});

module.exports = Comuna;