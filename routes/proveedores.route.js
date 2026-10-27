const { Router } = require('express');
const { check } = require('express-validator');

const { 
    obtenerPerfilProveedor, 
    actualizarPerfilProveedor, 
    registrarZonaAtencion,
    eliminarZonaAtencion,
    listarProveedores,
    obtenerDetalleProveedor
} = require('../controllers/proveedores.controller');

const { validarJWT, esProveedor } = require('../middlewares/validar-jwt');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/perfil', [
    validarJWT,
    esProveedor
], obtenerPerfilProveedor);

router.put('/perfil', [
    validarJWT,
    esProveedor,
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('apellido', 'El apellido es obligatorio').not().isEmpty(),
    check('descripcion_perfil', 'La descripción del perfil es obligatoria').not().isEmpty(),
    validarCampos
], actualizarPerfilProveedor);

router.post('/zonas', [
    validarJWT,
    esProveedor,
    check('id_barrio', 'El ID del barrio es obligatorio y debe ser un número entero').isInt(),
    validarCampos
], registrarZonaAtencion);

router.delete('/zonas/:id_zona', [
    validarJWT,
    esProveedor,
    check('id_zona', 'El ID de la zona debe ser un número entero').isInt(),
    validarCampos
], eliminarZonaAtencion);

router.get('/', listarProveedores);
router.get('/:id', obtenerDetalleProveedor);

module.exports = router;