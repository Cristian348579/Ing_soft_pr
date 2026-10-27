const { Op } = require('sequelize');
const Solicitud = require('../models/solicitud');
const Servicio = require('../models/servicio');
const Disponibilidad = require('../models/disponibilidad');
const PeriodoNoDisponible = require('../models/periodoNoDisponible');
const Proveedor = require('../models/proveedor');
const Usuario = require('../models/usuario');

const convertirAMinutos = (horaStr) => {
    if (!horaStr) return 0;
    const [h, m] = horaStr.split(':').map(Number);
    return h * 60 + m;
};

// HU-012: Creación de una solicitud con validación integral de agenda
const crearSolicitud = async (req, res) => {
    const { id_usuario: id_cliente } = req.usuarioAutenticado;
    const {
        id_servicio,
        fecha_hora_solicitada,
        direccion_atencion,
        barrio_sector,
        informacion_complementaria,
        observaciones
    } = req.body;

    try {
        // 1. Verificar existencia y estado del servicio
        const servicio = await Servicio.findByPk(id_servicio);
        if (!servicio) {
            return res.status(404).json({ msg: 'El servicio solicitado no existe' });
        }

        if (servicio.estado !== 'A') {
            return res.status(400).json({ msg: 'El servicio no se encuentra activo para nuevas solicitudes' });
        }

        // 2. Descomposición y validación de fecha futura
        const [fechaParte, horaParte] = fecha_hora_solicitada.split('T');
        if (!fechaParte || !horaParte) {
            return res.status(400).json({ msg: 'Formato de fecha y hora inválido. Use YYYY-MM-DDTHH:mm' });
        }

        const [anio, mes, diaNum] = fechaParte.split('-').map(Number);
        const [hora, minuto] = horaParte.split(':').map(Number);
        const fechaSolicitada = new Date(anio, mes - 1, diaNum, hora, minuto);

        if (fechaSolicitada <= new Date()) {
            return res.status(400).json({ msg: 'La fecha y hora solicitada debe ser estrictamente futura' });
        }

        const id_proveedor = servicio.id_proveedor;

        // 3. Validación contra bloqueos temporales (PERIODO_NO_DISPONIBLE)
        const periodosBloqueados = await PeriodoNoDisponible.findAll({
            where: { id_proveedor }
        });

        const estaBloqueado = periodosBloqueados.some(p => {
            const fIniStr = String(p.fecha_inicio).slice(0, 10);
            const fFinStr = String(p.fecha_fin).slice(0, 10);
            return (fechaParte >= fIniStr && fechaParte <= fFinStr);
        });

        if (estaBloqueado) {
            return res.status(409).json({
                msg: 'El profesional no se encuentra disponible en la fecha seleccionada (periodo no disponible o descanso)'
            });
        }

        // 4. Validación de jornada semanal (DISPONIBILIDAD - RF-21, RN-10)
        const diasSemanaMap = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
        const diaCod = diasSemanaMap[fechaSolicitada.getDay()];

        const franjasDisponibles = await Disponibilidad.findAll({
            where: { id_proveedor, dia: diaCod }
        });

        if (franjasDisponibles.length === 0) {
            return res.status(409).json({
                msg: `El proveedor no labora los días ${diaCod} según su disponibilidad habitual`
            });
        }

        const duracionMin = servicio.duracion_minutos;
        const minutosInicio = hora * 60 + minuto;
        const minutosFin = minutosInicio + duracionMin;

        const cabeEnJornada = franjasDisponibles.some(f => {
            const fInicio = convertirAMinutos(f.hora_inicio);
            const fFin = convertirAMinutos(f.hora_fin);
            return (minutosInicio >= fInicio && minutosFin <= fFin);
        });

        if (!cabeEnJornada) {
            return res.status(409).json({
                msg: `El horario solicitado (${horaParte} - duración ${duracionMin} min) excede las franjas de atención registradas por el profesional para este día`
            });
        }

        // 5. Validación de solapamiento contra reservas confirmadas (RN-11)
        const reservasAceptadas = await Solicitud.findAll({
            where: {
                id_proveedor,
                estado: 'A'
            }
        });

        const nuevaInicioMs = fechaSolicitada.getTime();
        const nuevaFinMs = nuevaInicioMs + (duracionMin * 60 * 1000);

        const colisiona = reservasAceptadas.some(r => {
            const rBase = r.fecha_hora_sugerida ? new Date(r.fecha_hora_sugerida) : new Date(r.fecha_hora_solicitada);
            const rInicioMs = rBase.getTime();
            const rFinMs = rInicioMs + (r.duracion_minutos_c * 60 * 1000);
            return (nuevaInicioMs < rFinMs && nuevaFinMs > rInicioMs);
        });

        if (colisiona) {
            return res.status(409).json({
                msg: 'El horario solicitado entra en conflicto con otra reserva previamente confirmada del profesional'
            });
        }

        // 6. Creación inmutable de la solicitud (RF-23, RN-13, RF-32)
        const ahora = new Date();
        const nuevaSolicitud = await Solicitud.create({
            id_cliente,
            id_proveedor,
            id_servicio: servicio.id_servicio,
            nombre_servicio_c: servicio.nombre,
            precio_c: servicio.precio,
            duracion_minutos_c: servicio.duracion_minutos,
            fecha_hora_solicitada: fechaSolicitada,
            fecha_hora_sugerida: null,
            direccion_atencion: direccion_atencion.trim(),
            barrio_sector: barrio_sector.trim(),
            informacion_complementaria: informacion_complementaria?.trim() || null,
            observaciones: observaciones?.trim() || null,
            estado: 'P',
            motivo_rechazo_cancelacion: null,
            fecha_creacion: ahora,
            fecha_ultima_actualizacion: ahora
        });

        res.status(201).json({
            ok: true,
            msg: 'Solicitud creada con éxito bajo estado Pendiente',
            solicitud: nuevaSolicitud
        });

    } catch (error) {
        console.error('Error al registrar solicitud:', error);
        res.status(500).json({ msg: 'Error interno al procesar la solicitud' });
    }
};

module.exports = {
    crearSolicitud
};