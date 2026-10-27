const InsumoEquipo = require('../models/insumoEquipo');
const Servicio = require('../models/servicio');

const obtenerInsumosPorServicio = async (req, res) => {
    const { id } = req.params;

    try {
        const insumos = await InsumoEquipo.findAll({
            where: { id_servicio: id },
            order: [['id_insumo', 'ASC']]
        });

        res.json({
            ok: true,
            total: insumos.length,
            insumos
        });
    } catch (error) {
        console.error('Error al obtener insumos:', error);
        res.status(500).json({ msg: 'Error al consultar los insumos del servicio' });
    }
};

const agregarInsumo = async (req, res) => {
    const { id } = req.params;
    const { id_usuario } = req.usuarioAutenticado;
    const { nombre } = req.body;

    try {
        const servicio = await Servicio.findByPk(id);

        if (!servicio) {
            return res.status(404).json({ msg: 'El servicio no existe en el sistema' });
        }

        if (servicio.id_proveedor !== id_usuario) {
            return res.status(403).json({ msg: 'No estás autorizado para modificar los insumos de este servicio' });
        }

        const nuevoInsumo = await InsumoEquipo.create({
            id_servicio: id,
            nombre: nombre.trim()
        });

        res.status(201).json({
            ok: true,
            msg: 'Insumo/equipo agregado correctamente',
            insumo: nuevoInsumo
        });
    } catch (error) {
        console.error('Error al agregar insumo:', error);
        res.status(500).json({ msg: 'Error interno al agregar el insumo' });
    }
};

const eliminarInsumo = async (req, res) => {
    const { id, id_insumo } = req.params;
    const { id_usuario } = req.usuarioAutenticado;

    try {
        const servicio = await Servicio.findByPk(id);

        if (!servicio) {
            return res.status(404).json({ msg: 'Servicio no encontrado' });
        }

        if (servicio.id_proveedor !== id_usuario) {
            return res.status(403).json({ msg: 'No tienes autorización para eliminar insumos de este servicio' });
        }

        const insumo = await InsumoEquipo.findOne({
            where: { id_insumo, id_servicio: id }
        });

        if (!insumo) {
            return res.status(404).json({ msg: 'El insumo no existe o no corresponde a este servicio' });
        }

        await insumo.destroy();

        res.json({
            ok: true,
            msg: 'Insumo eliminado satisfactoriamente'
        });
    } catch (error) {
        console.error('Error al eliminar insumo:', error);
        res.status(500).json({ msg: 'Error interno al eliminar el insumo' });
    }
};

module.exports = {
    obtenerInsumosPorServicio,
    agregarInsumo,
    eliminarInsumo
};