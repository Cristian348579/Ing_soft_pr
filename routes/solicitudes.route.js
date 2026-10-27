const { Router } = require('express');
const { check } = require('express-validator');
const { crearSolicitud } = require('../controllers/solicitudes.controller');
const { validarJWT, esCliente } = require('../middlewares/validar-jwt');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.post('/', [
    validarJWT,
    esCliente,
    check('id_servicio', 'El ID del servicio es obligatorio y debe ser un número entero').isInt(),
    check('id_barrio', 'El ID del barrio es obligatorio y debe ser un número entero').isInt(),
    check('fecha_hora_solicitada', 'La fecha y hora solicitada es obligatoria (YYYY-MM-DDTHH:mm)')
        .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/),
    check('direccion_atencion', 'La dirección del domicilio es obligatoria').trim().not().isEmpty(),
    validarCampos
], crearSolicitud);

module.exports = router;