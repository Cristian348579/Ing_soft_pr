const { Router } = require('express');
const { check } = require('express-validator');

const {
    obtenerMiDisponibilidad,
    obtenerDisponibilidadProveedor,
    agregarFranjaDisponibilidad,
    eliminarFranjaDisponibilidad,
    agregarPeriodoNoDisponible,
    eliminarPeriodoNoDisponible
} = require('../controllers/disponibilidad.controller');

const { validarJWT, esProveedor } = require('../middlewares/validar-jwt');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/proveedor/:id_proveedor', [
    check('id_proveedor', 'El ID del proveedor debe ser entero').isInt(),
    validarCampos
], obtenerDisponibilidadProveedor);

router.get('/mi-agenda', [
    validarJWT,
    esProveedor
], obtenerMiDisponibilidad);

router.post('/franja', [
    validarJWT,
    esProveedor,
    check('dia', 'El día debe ser LU, MA, MI, JU, VI, SA o DO')
        .isIn(['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']),
    check('hora_inicio', 'La hora de inicio es requerida (HH:mm)').matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
    check('hora_fin', 'La hora de fin es requerida (HH:mm)').matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
    validarCampos
], agregarFranjaDisponibilidad);

router.delete('/franja/:id', [
    validarJWT,
    esProveedor,
    check('id', 'El ID de la franja debe ser numérico').isInt(),
    validarCampos
], eliminarFranjaDisponibilidad);

router.post('/bloqueo', [
    validarJWT,
    esProveedor,
    check('fecha_inicio', 'La fecha de inicio es requerida').not().isEmpty(),
    check('fecha_fin', 'La fecha de fin es requerida').not().isEmpty(),
    validarCampos
], agregarPeriodoNoDisponible);

router.delete('/bloqueo/:id', [
    validarJWT,
    esProveedor,
    check('id', 'El ID del periodo debe ser numérico').isInt(),
    validarCampos
], eliminarPeriodoNoDisponible);

module.exports = router;