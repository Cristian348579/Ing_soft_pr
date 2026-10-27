const { Router } = require('express');
const { check } = require('express-validator');
const { 
    solicitarRecuperacion, 
    restablecerContrasena, 
    verificarToken 
} = require('../controllers/recuperacion.controller');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/verificar/:token', verificarToken);

router.post('/solicitar', [
    check('correo_electronico', 'El correo es obligatorio y debe ser válido').isEmail(),
    validarCampos
], solicitarRecuperacion);

router.post('/restablecer', [
    check('token', 'El token es obligatorio').not().isEmpty(),
    check('nueva_contrasena', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    validarCampos
], restablecerContrasena);

module.exports = router;