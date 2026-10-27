const Usuario = require('../models/usuario');
const Cliente = require('../models/cliente');
const Comuna = require('../models/comuna');
const Barrio = require('../models/barrio');

const obtenerPerfilCliente = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;

    try {
        const usuarioCliente = await Usuario.findOne({
            where: { id_usuario },
            attributes: ['id_usuario', 'correo_electronico', 'nombre', 'apellido', 'rol'],
            include: [{
                model: Cliente,
                attributes: ['id_barrio', 'direccion', 'informacion_complementaria'],
                include: [{
                    model: Barrio,
                    attributes: ['id_barrio', 'nombre', 'id_comuna'],
                    include: [{
                        model: Comuna,
                        attributes: ['id_comuna', 'nombre']
                    }]
                }]
            }]
        });

        if (!usuarioCliente || !usuarioCliente.Cliente) {
            return res.status(404).json({ msg: 'Perfil de cliente no encontrado' });
        }

        const barrio = usuarioCliente.Cliente.Barrio;

        res.json({
            ok: true,
            perfil: {
                id_usuario: usuarioCliente.id_usuario,
                correo_electronico: usuarioCliente.correo_electronico,
                nombre: usuarioCliente.nombre,
                apellido: usuarioCliente.apellido,
                id_barrio: usuarioCliente.Cliente.id_barrio,
                barrio: barrio?.nombre || '',
                id_comuna: barrio?.id_comuna || '',
                comuna: barrio?.Comuna?.nombre || '',
                direccion: usuarioCliente.Cliente.direccion,
                informacion_complementaria: usuarioCliente.Cliente.informacion_complementaria || ''
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil del cliente:', error);
        res.status(500).json({ msg: 'Error al consultar el perfil del cliente' });
    }
};

const actualizarPerfilCliente = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { nombre, apellido, id_barrio, direccion, informacion_complementaria } = req.body;

    try {
        const usuario = await Usuario.findByPk(id_usuario);
        const cliente = await Cliente.findOne({ where: { id_cliente: id_usuario } });

        if (!usuario || !cliente) {
            return res.status(404).json({ msg: 'Perfil de cliente no encontrado' });
        }

        const barrioValido = await Barrio.findByPk(id_barrio);
        if (!barrioValido) {
            return res.status(400).json({ msg: 'El barrio seleccionado no es válido' });
        }

        await usuario.update({ nombre, apellido });
        await cliente.update({ 
            id_barrio, 
            direccion, 
            informacion_complementaria: informacion_complementaria ?? null
        });

        res.json({
            ok: true,
            msg: 'Perfil actualizado satisfactoriamente',
            perfil_actualizado: {
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                id_barrio: cliente.id_barrio,
                direccion: cliente.direccion,
                informacion_complementaria: cliente.informacion_complementaria
            }
        });

    } catch (error) {
        console.error('Error al actualizar perfil del cliente:', error);
        res.status(500).json({ msg: 'Error al actualizar el perfil' });
    }
};

module.exports = {
    obtenerPerfilCliente,
    actualizarPerfilCliente
};