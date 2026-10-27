const { Router } = require('express');
const { check } = require('express-validator');

const {
    crearServicio,
    listarServiciosCatalogo,
    obtenerMisServicios,
    actualizarServicio,
    cambiarEstadoServicio
} = require('../controllers/servicios.controller');

const { validarJWT, esProveedor } = require('../middlewares/validar-jwt');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/', listarServiciosCatalogo);


router.get('/mis-servicios', [
    validarJWT,
    esProveedor
], obtenerMisServicios);

router.post('/', [
    validarJWT,
    esProveedor,
    check('nombre', 'El nombre del servicio es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    check('duracion_minutos', 'La duración debe ser un entero mayor a 0').isInt({ min: 1 }),
    check('precio', 'El precio debe ser un número mayor o igual a 0').isFloat({ min: 0 }),
    check('categoria', 'Categoría no permitida. Debe ser Estética, Bienestar o Masajes')
        .isIn(['Estética', 'Bienestar', 'Masajes']),
    validarCampos
], crearServicio);

router.put('/:id', [
    validarJWT,
    esProveedor,
    check('id', 'El ID del servicio debe ser un número entero').isInt(),
    check('nombre', 'El nombre del servicio es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    check('duracion_minutos', 'La duración debe ser un entero mayor a 0').isInt({ min: 1 }),
    check('precio', 'El precio debe ser un número mayor o igual a 0').isFloat({ min: 0 }),
    check('categoria', 'Categoría no válida').isIn(['Estética', 'Bienestar', 'Masajes']),
    check('estado', 'El estado debe ser A o I').optional().isIn(['A', 'I']),
    validarCampos
], actualizarServicio);

router.patch('/:id/estado', [
    validarJWT,
    esProveedor,
    check('id', 'El ID del servicio debe ser un número entero').isInt(),
    check('estado', 'El estado debe ser estrictamente A (Activo) o I (Inactivo)').isIn(['A', 'I']),
    validarCampos
], cambiarEstadoServicio);

module.exports = router;