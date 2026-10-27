const { Router } = require('express');
const { check } = require('express-validator');
const { obtenerPerfilCliente, actualizarPerfilCliente } = require('../controllers/clientes.controller');
const { validarJWT, esCliente } = require('../middlewares/validar-jwt');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/perfil', [
    validarJWT,
    esCliente
], obtenerPerfilCliente);

router.put('/perfil', [
    validarJWT,
    esCliente,
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('apellido', 'El apellido es obligatorio').not().isEmpty(),
    check('id_barrio', 'El ID del barrio es obligatorio y debe ser un número entero').isInt(),
    check('direccion', 'La dirección es obligatoria').not().isEmpty(),
    validarCampos
], actualizarPerfilCliente);

module.exports = router;