const Disponibilidad = require('../models/disponibilidad');
const PeriodoNoDisponible = require('../models/periodoNoDisponible');

const ORDEN_SEMANA = { LU: 1, MA: 2, MI: 3, JU: 4, VI: 5, SA: 6, DO: 7 };

const convertirAMinutos = (horaStr) => {
    if (!horaStr) return 0;
    const [h, m] = horaStr.split(':').map(Number);
    return h * 60 + m;
};

// HU-011: Obtener disponibilidad propia
const obtenerMiDisponibilidad = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;

    try {
        const franjas = await Disponibilidad.findAll({
            where: { id_proveedor: id_usuario },
            order: [['hora_inicio', 'ASC']]
        });

        // Ordenar en memoria según secuencia natural Lunes a Domingo
        franjas.sort((a, b) => (ORDEN_SEMANA[a.dia] || 0) - (ORDEN_SEMANA[b.dia] || 0));

        const periodos = await PeriodoNoDisponible.findAll({
            where: { id_proveedor: id_usuario },
            order: [['fecha_inicio', 'ASC']]
        });

        res.json({
            ok: true,
            disponibilidad: franjas,
            periodos_no_disponibles: periodos
        });
    } catch (error) {
        console.error('Error al consultar disponibilidad:', error);
        res.status(500).json({ msg: 'Error al consultar la agenda de disponibilidad' });
    }
};

// HU-011: Consulta pública para el Cliente
const obtenerDisponibilidadProveedor = async (req, res) => {
    const { id_proveedor } = req.params;

    try {
        const franjas = await Disponibilidad.findAll({
            where: { id_proveedor },
            order: [['hora_inicio', 'ASC']]
        });

        franjas.sort((a, b) => (ORDEN_SEMANA[a.dia] || 0) - (ORDEN_SEMANA[b.dia] || 0));

        const periodos = await PeriodoNoDisponible.findAll({
            where: { id_proveedor },
            order: [['fecha_inicio', 'ASC']]
        });

        res.json({
            ok: true,
            disponibilidad: franjas,
            periodos_no_disponibles: periodos
        });
    } catch (error) {
        console.error('Error al consultar disponibilidad del proveedor:', error);
        res.status(500).json({ msg: 'Error al consultar la disponibilidad' });
    }
};

// HU-011: Registrar franja semanal (soporta jornada partida)
const agregarFranjaDisponibilidad = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { dia, hora_inicio, hora_fin } = req.body;

    const minInicio = convertirAMinutos(hora_inicio);
    const minFin = convertirAMinutos(hora_fin);

    if (minInicio >= minFin) {
        return res.status(400).json({
            msg: 'La hora inicial debe ser anterior a la hora final'
        });
    }

    try {
        const existentes = await Disponibilidad.findAll({
            where: { id_proveedor: id_usuario, dia }
        });

        const hayCruce = existentes.some((f) => {
            const fIni = convertirAMinutos(f.hora_inicio);
            const fFin = convertirAMinutos(f.hora_fin);
            return (minInicio < fFin && minFin > fIni);
        });

        if (hayCruce) {
            return res.status(400).json({
                msg: 'El rango horario se cruza con otra franja existente en este día'
            });
        }

        const nuevaFranja = await Disponibilidad.create({
            id_proveedor: id_usuario,
            dia,
            hora_inicio,
            hora_fin
        });

        res.status(201).json({
            ok: true,
            msg: 'Franja horaria registrada correctamente',
            franja: nuevaFranja
        });
    } catch (error) {
        console.error('Error al agregar franja:', error);
        res.status(500).json({ msg: 'Error interno al registrar el horario' });
    }
};

// HU-011: Eliminar franja semanal
const eliminarFranjaDisponibilidad = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { id } = req.params;

    try {
        const franja = await Disponibilidad.findByPk(id);

        if (!franja) {
            return res.status(404).json({ msg: 'Franja horaria no encontrada' });
        }

        if (franja.id_proveedor !== id_usuario) {
            return res.status(403).json({ msg: 'No estás autorizado para eliminar esta franja' });
        }

        await franja.destroy();

        res.json({
            ok: true,
            msg: 'Franja horaria eliminada con éxito'
        });
    } catch (error) {
        console.error('Error al eliminar franja:', error);
        res.status(500).json({ msg: 'Error al eliminar la franja de disponibilidad' });
    }
};

// HU-011: Registrar periodo no disponible (usa PK `id` sin motivo)
const agregarPeriodoNoDisponible = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { fecha_inicio, fecha_fin } = req.body;

    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
        return res.status(400).json({
            msg: 'La fecha de inicio no puede ser posterior a la fecha final'
        });
    }

    try {
        const nuevoPeriodo = await PeriodoNoDisponible.create({
            id_proveedor: id_usuario,
            fecha_inicio,
            fecha_fin
        });

        res.status(201).json({
            ok: true,
            msg: 'Periodo de no disponibilidad bloqueado con éxito',
            periodo: nuevoPeriodo
        });
    } catch (error) {
        console.error('Error al agregar periodo no disponible:', error);
        res.status(500).json({ msg: 'Error al registrar el bloqueo de agenda' });
    }
};

// HU-011: Eliminar periodo no disponible (usa PK `id`)
const eliminarPeriodoNoDisponible = async (req, res) => {
    const { id_usuario } = req.usuarioAutenticado;
    const { id } = req.params;

    try {
        const periodo = await PeriodoNoDisponible.findByPk(id);

        if (!periodo) {
            return res.status(404).json({ msg: 'Periodo no encontrado' });
        }

        if (periodo.id_proveedor !== id_usuario) {
            return res.status(403).json({ msg: 'No tienes autorización para eliminar este bloqueo' });
        }

        await periodo.destroy();

        res.json({
            ok: true,
            msg: 'Periodo de no disponibilidad eliminado con éxito'
        });
    } catch (error) {
        console.error('Error al eliminar periodo:', error);
        res.status(500).json({ msg: 'Error al eliminar el periodo bloqueado' });
    }
};

module.exports = {
    obtenerMiDisponibilidad,
    obtenerDisponibilidadProveedor,
    agregarFranjaDisponibilidad,
    eliminarFranjaDisponibilidad,
    agregarPeriodoNoDisponible,
    eliminarPeriodoNoDisponible
};