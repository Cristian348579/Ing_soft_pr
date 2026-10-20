const Servicio = require('../models/servicio');
const Proveedor = require('../models/proveedor');
const Usuario = require('../models/usuario');
const ZonaAtencion = require('../models/zonaAtencion');
const Comuna = require('../models/comuna');
const Barrio = require('../models/barrio');
const Recurso = require('../models/recurso');

const crearServicio = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    
    const { 
        nombre, 
        categoria, 
        descripcion, 
        duracion_minutos, 
        precio,
        estado = 'A'
    } = req.body;

    try {
        const nuevoServicio = await Servicio.create({
            id_proveedor: id_usuario,
            nombre,
            categoria,
            descripcion,
            duracion_minutos,
            precio,
            estado
        });

        res.status(201).json({
            msg: 'Servicio registrado correctamente en el catálogo',
            servicio: nuevoServicio
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al registrar el servicio' });
    }
};

const listarServiciosCatalogo = async (req, res) => {
    try {
        const { categoria, buscar } = req.query;

        const whereClause = { estado: 'A' };

        if (categoria && categoria !== 'Todos') {
            whereClause.categoria = categoria;
        }

        const servicios = await Servicio.findAll({
            where: whereClause,
            include: [
                {
                    model: Proveedor,
                    as: 'Proveedor',
                    include: [
                        {
                            model: Usuario,
                            attributes: ['nombre', 'apellido']
                        },
                        {
                            model: ZonaAtencion,
                            include: [
                                { model: Comuna, attributes: ['nombre'] },
                                { model: Barrio, attributes: ['nombre'] }
                            ]
                        }
                    ]
                },
                {
                    model: Recurso,
                    as: 'recursos',
                    attributes: ['url_archivo', 'tipo', 'es_miniatura']
                }
            ],
            order: [['id_servicio', 'DESC']]
        });

        res.json({
            ok: true,
            total: servicios.length,
            servicios
        });
    } catch (error) {
        console.error('Error al listar catálogo:', error);
        res.status(500).json({ msg: 'Error al consultar el catálogo de servicios' });
    }
};

const obtenerMisServicios = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;

    try {
        const servicios = await Servicio.findAll({
            where: { id_proveedor: id_usuario },
            order: [['id_servicio', 'DESC']]
        });

        res.json({
            ok: true,
            servicios
        });
    } catch (error) {
        console.error('Error al obtener servicios del proveedor:', error);
        res.status(500).json({ msg: 'Error al consultar tus servicios' });
    }
};

const actualizarServicio = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { id } = req.params;
    const { nombre, categoria, descripcion, duracion_minutos, precio, estado } = req.body;

    try {
        const servicio = await Servicio.findOne({
            where: {
                id_servicio: id,
                id_proveedor: id_usuario
            }
        });

        if (!servicio) {
            return res.status(404).json({
                msg: 'Servicio no encontrado o no pertenece a tu catálogo'
            });
        }

        await servicio.update({
            nombre,
            categoria,
            descripcion,
            duracion_minutos: parseInt(duracion_minutos, 10),
            precio: parseFloat(precio),
            estado
        });

        res.json({
            ok: true,
            msg: 'Servicio actualizado correctamente',
            servicio
        });
    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        res.status(500).json({ msg: 'Error al actualizar el servicio' });
    }
};

module.exports = {
    crearServicio,
    listarServiciosCatalogo,
    obtenerMisServicios,
    actualizarServicio
};
