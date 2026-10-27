const { DataTypes } = require('sequelize');
const { bdMySQL } = require('../database/db_conection');
const Usuario = require('./usuario');
const Comuna = require('./comuna');
const Barrio = require('./barrio');

const Cliente = bdMySQL.define('Cliente', {
    id_cliente: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,
        references: {
            model: Usuario,
            key: 'id_usuario'
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
    },
    direccion: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    informacion_complementaria: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'CLIENTE',
    timestamps: false
});

Usuario.hasOne(Cliente, { foreignKey: 'id_cliente', onDelete: 'CASCADE' });
Cliente.belongsTo(Usuario, { foreignKey: 'id_cliente' });

Comuna.hasMany(Cliente, { foreignKey: 'id_comuna' });
Cliente.belongsTo(Comuna, { foreignKey: 'id_comuna' });

Barrio.hasMany(Cliente, { foreignKey: 'id_barrio' });
Cliente.belongsTo(Barrio, { foreignKey: 'id_barrio' });

module.exports = Cliente;