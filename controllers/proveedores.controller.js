const Usuario = require('../models/usuario');
const Proveedor = require('../models/proveedor');
const ZonaAtencion = require('../models/zonaAtencion');
const Comuna = require('../models/comuna');
const Barrio = require('../models/barrio');
const Servicio = require('../models/servicio');
const Recurso = require('../models/recurso');

const obtenerPerfilProveedor = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;

    try {
        const usuarioProveedor = await Usuario.findOne({
            where: { id_usuario },
            attributes: ['id_usuario', 'correo_electronico', 'nombre', 'apellido', 'rol'],
            include: [{
                model: Proveedor,
                attributes: ['descripcion_perfil'],
                include: [{
                    model: ZonaAtencion,
                    attributes: ['id_zona', 'id_barrio'],
                    include: [{
                        model: Barrio,
                        attributes: ['id_barrio', 'nombre', 'id_comuna'],
                        include: [{
                            model: Comuna,
                            attributes: ['id_comuna', 'nombre']
                        }]
                    }]
                }]
            }]
        });

        if (!usuarioProveedor) {
            return res.status(404).json({ msg: 'Proveedor no encontrado' });
        }

        res.json({
            ok: true,
            perfil: {
                nombre: usuarioProveedor.nombre,
                apellido: usuarioProveedor.apellido,
                correo_electronico: usuarioProveedor.correo_electronico,
                descripcion_perfil: usuarioProveedor.Proveedor?.descripcion_perfil || '',
                zonas: usuarioProveedor.Proveedor?.ZonaAtencions || []
            }
        });
    } catch (error) {
        console.error('Error al consultar perfil del proveedor:', error);
        res.status(500).json({ msg: 'Error al consultar el perfil del proveedor' });
    }
};

const actualizarPerfilProveedor = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { nombre, apellido, descripcion_perfil } = req.body;

    try {
        const usuario = await Usuario.findByPk(id_usuario);
        const proveedor = await Proveedor.findByPk(id_usuario);

        if (!usuario || !proveedor) {
            return res.status(404).json({ msg: 'Proveedor no encontrado' });
        }

        await usuario.update({ nombre, apellido });
        await proveedor.update({ descripcion_perfil });

        res.json({
            ok: true,
            msg: 'Perfil profesional actualizado',
            perfil_actualizado: { nombre, apellido, descripcion_perfil }
        });
    } catch (error) {
        console.error('Error al actualizar perfil del proveedor:', error);
        res.status(500).json({ msg: 'Error al actualizar perfil' });
    }
};

const registrarZonaAtencion = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { id_barrio } = req.body;

    try {
        const barrioValido = await Barrio.findByPk(id_barrio);
        if (!barrioValido) {
            return res.status(400).json({ msg: 'El barrio seleccionado no existe en el sistema' });
        }

        const existe = await ZonaAtencion.findOne({
            where: {
                id_proveedor: id_usuario,
                id_barrio
            }
        });

        if (existe) {
            return res.status(400).json({ msg: 'Ya tienes este barrio registrado en tus zonas de atención' });
        }

        const nuevaZona = await ZonaAtencion.create({
            id_proveedor: id_usuario,
            id_barrio
        });

        res.status(201).json({
            ok: true,
            msg: 'Zona agregada correctamente',
            zona: nuevaZona
        });
    } catch (error) {
        console.error('Error al registrar zona de atención:', error);
        res.status(500).json({ msg: 'Error al registrar la zona de atención' });
    }
};

const eliminarZonaAtencion = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { id_zona } = req.params;

    try {
        const zona = await ZonaAtencion.findOne({
            where: { id_zona, id_proveedor: id_usuario }
        });

        if (!zona) {
            return res.status(404).json({ msg: 'Zona no encontrada o no pertenece al proveedor' });
        }

        await zona.destroy();
        res.json({ ok: true, msg: 'Zona eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar zona de atención:', error);
        res.status(500).json({ msg: 'Error al eliminar zona de atención' });
    }
};

const listarProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll({
            include: [
                {
                    model: Usuario,
                    attributes: ['id_usuario', 'nombre', 'apellido']
                },
                {
                    model: ZonaAtencion,
                    attributes: ['id_zona', 'id_barrio'],
                    include: [{
                        model: Barrio,
                        attributes: ['id_barrio', 'nombre'],
                        include: [{ model: Comuna, attributes: ['id_comuna', 'nombre'] }]
                    }]
                }
            ]
        });

        const resultado = proveedores.map(p => ({
            id_proveedor: p.id_proveedor,
            nombre: `${p.Usuario.nombre} ${p.Usuario.apellido}`,
            descripcion_perfil: p.descripcion_perfil,
            zonas: (p.ZonaAtencions || []).map(z => ({
                id_zona: z.id_zona,
                id_barrio: z.id_barrio,
                barrio: z.Barrio?.nombre,
                id_comuna: z.Barrio?.Comuna?.id_comuna,
                comuna: z.Barrio?.Comuna?.nombre
            }))
        }));

        res.json({
            ok: true,
            total: resultado.length,
            proveedores: resultado
        });
    } catch (error) {
        console.error('Error al listar proveedores:', error);
        res.status(500).json({ msg: 'Error al consultar proveedores' });
    }
};

const obtenerDetalleProveedor = async (req, res) => {
    const { id } = req.params;

    try {
        const usuarioProveedor = await Usuario.findOne({
            where: { id_usuario: id, rol: 'P' },
            attributes: ['id_usuario', 'nombre', 'apellido', 'correo_electronico'],
            include: [
                {
                    model: Proveedor,
                    attributes: ['descripcion_perfil'],
                    include: [
                        {
                            model: ZonaAtencion,
                            attributes: ['id_zona', 'id_barrio'],
                            include: [{
                                model: Barrio,
                                attributes: ['id_barrio', 'nombre'],
                                include: [{ model: Comuna, attributes: ['id_comuna', 'nombre'] }]
                            }]
                        }
                    ]
                }
            ]
        });

        if (!usuarioProveedor) {
            return res.status(404).json({ msg: 'Proveedor no encontrado' });
        }

        const servicios = await Servicio.findAll({
            where: { 
                id_proveedor: id,
                estado: 'A' 
            },
            include: [
                {
                    model: Recurso,
                    as: 'recursos',
                    attributes: ['id_recurso', 'tipo', 'url_archivo', 'es_miniatura']
                }
            ],
            order: [['id_servicio', 'DESC']]
        });

        res.json({
            ok: true,
            proveedor: {
                id_proveedor: usuarioProveedor.id_usuario,
                nombre: `${usuarioProveedor.nombre} ${usuarioProveedor.apellido}`,
                correo_electronico: usuarioProveedor.correo_electronico,
                descripcion_perfil: usuarioProveedor.Proveedor?.descripcion_perfil || '',
                zonas: (usuarioProveedor.Proveedor?.ZonaAtencions || []).map(z => ({
                    id_zona: z.id_zona,
                    id_barrio: z.id_barrio,
                    barrio: z.Barrio?.nombre,
                    id_comuna: z.Barrio?.Comuna?.id_comuna,
                    comuna: z.Barrio?.Comuna?.nombre
                }))
            },
            servicios
        });

    } catch (error) {
        console.error('Error al obtener perfil del proveedor:', error);
        res.status(500).json({ msg: 'Error interno del servidor al consultar el proveedor' });
    }
};

module.exports = {
    obtenerPerfilProveedor,
    actualizarPerfilProveedor,
    registrarZonaAtencion,
    eliminarZonaAtencion,
    listarProveedores,
    obtenerDetalleProveedor
};