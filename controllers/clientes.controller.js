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
                attributes: ['id_comuna', 'id_barrio', 'direccion', 'informacion_complementaria'],
                include: [
                    { model: Comuna, attributes: ['id_comuna', 'nombre'] },
                    { model: Barrio, attributes: ['id_barrio', 'nombre'] }
                ]
            }]
        });

        if (!usuarioCliente || !usuarioCliente.Cliente) {
            return res.status(404).json({ msg: 'Perfil de cliente no encontrado' });
        }

        res.json({
            ok: true,
            perfil: {
                id_usuario: usuarioCliente.id_usuario,
                correo_electronico: usuarioCliente.correo_electronico,
                nombre: usuarioCliente.nombre,
                apellido: usuarioCliente.apellido,
                id_comuna: usuarioCliente.Cliente.id_comuna,
                comuna: usuarioCliente.Cliente.Comuna?.nombre || '',
                id_barrio: usuarioCliente.Cliente.id_barrio,
                barrio: usuarioCliente.Cliente.Barrio?.nombre || '',
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
    const { nombre, apellido, id_comuna, id_barrio, direccion, informacion_complementaria } = req.body;

    try {
        const usuario = await Usuario.findByPk(id_usuario);
        const cliente = await Cliente.findOne({ where: { id_cliente: id_usuario } });

        if (!usuario || !cliente) {
            return res.status(404).json({ msg: 'Perfil de cliente no encontrado' });
        }

        const barrioValido = await Barrio.findOne({
            where: { id_barrio, id_comuna }
        });
        if (!barrioValido) {
            return res.status(400).json({ msg: 'El barrio seleccionado no pertenece a la comuna indicada' });
        }

        await usuario.update({ nombre, apellido });
        await cliente.update({ 
            id_comuna, 
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
                id_comuna: cliente.id_comuna,
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