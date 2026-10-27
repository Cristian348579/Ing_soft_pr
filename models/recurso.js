const { DataTypes } = require('sequelize');
const { bdMySQL } = require('../database/db_conection');
const Servicio = require('./servicio');

const Recurso = bdMySQL.define('Recurso', {
    id_recurso: {
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
    tipo: {
        type: DataTypes.CHAR(1),
        allowNull: false,
        validate: {
            isIn: [['F', 'V']] // 'F' para Fotografía, 'V' para Video
        }
    },
    url_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    es_miniatura: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
    },
    file_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    tableName: 'RECURSO',
    timestamps: false
});

Servicio.hasMany(Recurso, { foreignKey: 'id_servicio', as: 'recursos', onDelete: 'CASCADE' });
Recurso.belongsTo(Servicio, { foreignKey: 'id_servicio', as: 'servicio' });

module.exports = Recurso;