const { DataTypes } = require('sequelize');
const { bdMySQL } = require('../database/db_conection');
const Cliente = require('./cliente');
const Proveedor = require('./proveedor');
const Servicio = require('./servicio');

const Solicitud = bdMySQL.define('Solicitud', {
    id_solicitud: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Cliente,
            key: 'id_cliente'
        }
    },
    id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Proveedor,
            key: 'id_proveedor'
        }
    },
    id_servicio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Servicio,
            key: 'id_servicio'
        }
    },
    // RN-13: Campos comerciales congelados
    nombre_servicio_c: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    precio_c: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    duracion_minutos_c: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_hora_solicitada: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_hora_sugerida: {
        type: DataTypes.DATE,
        allowNull: true
    },
    direccion_atencion: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    barrio_sector: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    informacion_complementaria: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estado: {
        type: DataTypes.CHAR(1),
        allowNull: false,
        defaultValue: 'P', // P: Pendiente, A: Aceptada, S: Sugerida, R: Rechazada, C: Cancelada, F: Finalizada
        validate: {
            isIn: [['P', 'A', 'S', 'R', 'C', 'F']]
        }
    },
    motivo_rechazo_cancelacion: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_ultima_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'SOLICITUD',
    timestamps: false
});

Cliente.hasMany(Solicitud, { foreignKey: 'id_cliente', as: 'solicitudes' });
Solicitud.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });

Proveedor.hasMany(Solicitud, { foreignKey: 'id_proveedor', as: 'solicitudesRecibidas' });
Solicitud.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });

Servicio.hasMany(Solicitud, { foreignKey: 'id_servicio', as: 'solicitudes' });
Solicitud.belongsTo(Servicio, { foreignKey: 'id_servicio', as: 'servicio' });

module.exports = Solicitud;