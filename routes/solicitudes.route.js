const { Router } = require('express');
const { check } = require('express-validator');
const { crearSolicitud } = require('../controllers/solicitudes.controller');
const { validarJWT, esCliente } = require('../middlewares/validar-jwt');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

// HU-012: Creación de una solicitud de servicio
router.post('/', [
    validarJWT,
    esCliente,
    check('id_servicio', 'El ID del servicio es obligatorio y debe ser numérico').isInt(),
    check('fecha_hora_solicitada', 'La fecha y hora solicitada es obligatoria en formato YYYY-MM-DDTHH:mm')
        .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/),
    check('direccion_atencion', 'La dirección del lugar de atención es obligatoria').not().isEmpty(),
    check('barrio_sector', 'El barrio o sector de atención es obligatorio').not().isEmpty(),
    validarCampos
], crearSolicitud);

module.exports = router;