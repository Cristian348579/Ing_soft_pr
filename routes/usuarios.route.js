const { Router } = require('express');
const { check } = require('express-validator');
const { registrarUsuario, login } = require('../controllers/usuarios.controller');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.post('/registro', [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('apellido', 'El apellido es obligatorio').not().isEmpty(),
    check('correo_electronico', 'El correo no es válido').isEmail(),
    check('contrasena', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('rol', 'El rol no es válido').isIn(['C', 'P', 'cliente', 'proveedor']),
    check('id_comuna')
        .if((value, { req }) => req.body.rol === 'C' || req.body.rol === 'cliente')
        .isInt().withMessage('El ID de la comuna es obligatorio para el cliente y debe ser numérico'),
    check('id_barrio')
        .if((value, { req }) => req.body.rol === 'C' || req.body.rol === 'cliente')
        .isInt().withMessage('El ID del barrio es obligatorio para el cliente y debe ser numérico'),
    check('direccion')
        .if((value, { req }) => req.body.rol === 'C' || req.body.rol === 'cliente')
        .not().isEmpty().withMessage('La dirección es obligatoria para el cliente'),
    check('descripcion_perfil')
        .if((value, { req }) => req.body.rol === 'P' || req.body.rol === 'proveedor')
        .not().isEmpty().withMessage('La descripción profesional es obligatoria para el proveedor'),
    validarCampos
], registrarUsuario);

router.post('/login', [
    check('correo_electronico', 'El correo es obligatorio').isEmail(),
    check('contrasena', 'La contraseña es obligatoria').not().isEmpty(),
    validarCampos
], login);

module.exports = router;