const Servicio = require('../models/servicio');
const Proveedor = require('../models/proveedor');
const Usuario = require('../models/usuario');
const ZonaAtencion = require('../models/zonaAtencion');
const Comuna = require('../models/comuna');
const Barrio = require('../models/barrio');
const Recurso = require('../models/recurso');
const InsumoEquipo = require('../models/insumoEquipo');

const crearServicio = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { nombre, descripcion, duracion_minutos, precio, categoria } = req.body;

    try {
        const nuevoServicio = await Servicio.create({
            id_proveedor: id_usuario,
            nombre,
            descripcion,
            duracion_minutos: parseInt(duracion_minutos, 10),
            precio: parseFloat(precio),
            categoria,
            estado: 'A'
        });

        res.status(201).json({
            ok: true,
            msg: 'Servicio creado exitosamente en el catálogo',
            servicio: nuevoServicio
        });
    } catch (error) {
        console.error('Error al registrar servicio:', error);
        res.status(500).json({ msg: 'Error al registrar el servicio' });
    }
};

// HU-009: Catálogo general público de servicios activos
const listarServiciosCatalogo = async (req, res) => {
    try {
        const { categoria } = req.query;
        const whereClause = { estado: 'A' };

        if (categoria && categoria !== 'Todos') {
            whereClause.categoria = categoria;
        }

        const servicios = await Servicio.findAll({
            where: whereClause,
            include: [
                {
                    model: Proveedor,
                    include: [
                        { model: Usuario, attributes: ['nombre', 'apellido'] },
                        {
                            model: ZonaAtencion,
                            attributes: ['id_zona', 'id_barrio'],
                            include: [
                                {
                                    model: Barrio,
                                    attributes: ['id_barrio', 'nombre'],
                                    include: [{ model: Comuna, attributes: ['id_comuna', 'nombre'] }]
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Recurso,
                    as: 'recursos',
                    attributes: ['id_recurso', 'url_archivo', 'tipo', 'es_miniatura']
                },
                {
                    model: InsumoEquipo,
                    as: 'insumos',
                    attributes: ['id_insumo', 'nombre']
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

// HU-007: Listar los servicios propios del proveedor autenticado
const obtenerMisServicios = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;

    try {
        const servicios = await Servicio.findAll({
            where: { id_proveedor: id_usuario },
            include: [
                {
                    model: Recurso,
                    as: 'recursos',
                    attributes: ['id_recurso', 'url_archivo', 'tipo', 'es_miniatura', 'file_id']
                },
                {
                    model: InsumoEquipo,
                    as: 'insumos',
                    attributes: ['id_insumo', 'nombre']
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
        console.error('Error al obtener servicios del proveedor:', error);
        res.status(500).json({ msg: 'Error al consultar tus servicios' });
    }
};

// HU-007: Actualización integral de parámetros del servicio
const actualizarServicio = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { id } = req.params;
    const { nombre, categoria, descripcion, duracion_minutos, precio, estado } = req.body;

    try {
        const servicio = await Servicio.findByPk(id);

        if (!servicio) {
            return res.status(404).json({ msg: 'Servicio no encontrado en el sistema' });
        }

        // RF-06: Verificación de propiedad del recurso
        if (servicio.id_proveedor !== id_usuario) {
            return res.status(403).json({ msg: 'No tienes autorización para modificar este servicio' });
        }

        // RN-13: Inmutabilidad comercial hacia solicitudes pasadas (el update solo afecta nuevas órdenes)
        await servicio.update({
            nombre: nombre !== undefined ? nombre : servicio.nombre,
            categoria: categoria !== undefined ? categoria : servicio.categoria,
            descripcion: descripcion !== undefined ? descripcion : servicio.descripcion,
            duracion_minutos: duracion_minutos !== undefined ? parseInt(duracion_minutos, 10) : servicio.duracion_minutos,
            precio: precio !== undefined ? parseFloat(precio) : servicio.precio,
            estado: estado !== undefined ? estado : servicio.estado
        });

        res.json({
            ok: true,
            msg: 'Servicio actualizado correctamente',
            servicio
        });
    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        res.status(500).json({ msg: 'Error interno al actualizar el servicio' });
    }
};

const cambiarEstadoServicio = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { id } = req.params;
    const { estado } = req.body;

    try {
        const servicio = await Servicio.findByPk(id);

        if (!servicio) {
            return res.status(404).json({ msg: 'Servicio no encontrado en el sistema' });
        }

        if (servicio.id_proveedor !== id_usuario) {
            return res.status(403).json({ msg: 'No tienes autorización para modificar este servicio' });
        }

        await servicio.update({ estado });

        res.json({
            ok: true,
            msg: `Servicio marcado como ${estado === 'A' ? 'Activo' : 'Inactivo'} exitosamente`,
            servicio
        });
    } catch (error) {
        console.error('Error al cambiar estado del servicio:', error);
        res.status(500).json({ msg: 'Error interno al modificar el estado del servicio' });
    }
};

module.exports = {
    crearServicio,
    listarServiciosCatalogo,
    obtenerMisServicios,
    actualizarServicio,
    cambiarEstadoServicio
};