const { Router } = require('express');
const { check } = require('express-validator');

const {
    crearServicio,
    listarServiciosCatalogo,
    obtenerMisServicios,
    actualizarServicio,
    cambiarEstadoServicio
} = require('../controllers/servicios.controller');

const {
    obtenerInsumosPorServicio,
    agregarInsumo,
    eliminarInsumo
} = require('../controllers/insumos.controller');

const { validarJWT, esProveedor } = require('../middlewares/validar-jwt');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();


router.use('/:id/recursos', require('./recursos.route'));


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
    check('id', 'El ID del servicio debe ser entero').isInt(),
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
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
    check('id', 'El ID del servicio debe ser entero').isInt(),
    check('estado', 'El estado debe ser A o I').isIn(['A', 'I']),
    validarCampos
], cambiarEstadoServicio);


router.get('/:id/insumos', obtenerInsumosPorServicio);

router.post('/:id/insumos', [
    validarJWT,
    esProveedor,
    check('id', 'El ID del servicio debe ser entero').isInt(),
    check('nombre', 'El nombre del insumo o equipo es obligatorio').trim().not().isEmpty(),
    validarCampos
], agregarInsumo);

router.delete('/:id/insumos/:id_insumo', [
    validarJWT,
    esProveedor,
    check('id', 'El ID del servicio debe ser entero').isInt(),
    check('id_insumo', 'El ID del insumo debe ser entero').isInt(),
    validarCampos
], eliminarInsumo);

module.exports = router;