const { DataTypes } = require('sequelize');
const { bdMySQL } = require('../database/db_conection');
const Proveedor = require('./proveedor');
const Comuna = require('./comuna');
const Barrio = require('./barrio');

const ZonaAtencion = bdMySQL.define('ZonaAtencion', {
    id_zona: { 
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
    id_comuna: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: Comuna,
            key: 'id_comuna'
        }
    },
    id_barrio: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: Barrio,
            key: 'id_barrio'
        }
    }
}, {
    tableName: 'ZONA_ATENCION',
    timestamps: false
});

Proveedor.hasMany(ZonaAtencion, { foreignKey: 'id_proveedor', onDelete: 'CASCADE' });
ZonaAtencion.belongsTo(Proveedor, { foreignKey: 'id_proveedor' });


Comuna.hasMany(ZonaAtencion, { foreignKey: 'id_comuna' });
ZonaAtencion.belongsTo(Comuna, { foreignKey: 'id_comuna' });

Barrio.hasMany(ZonaAtencion, { foreignKey: 'id_barrio' });
ZonaAtencion.belongsTo(Barrio, { foreignKey: 'id_barrio' });

module.exports = ZonaAtencion;