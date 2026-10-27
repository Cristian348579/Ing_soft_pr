const { Router } = require('express');
const multer = require('multer');
const { validarJWT, esProveedor } = require('../middlewares/validar-jwt');
const { listarRecursos, subirRecurso, eliminarRecurso } = require('../controllers/recursos.controller');

// Buffer en memoria para delegar persistencia a ImageKit (máx 25 MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }
});

const router = Router({ mergeParams: true });

// GET /api/servicios/:id/recursos
router.get('/', listarRecursos);

// POST /api/servicios/:id/recursos (Multipart)
router.post('/', [
    validarJWT,
    esProveedor,
    upload.single('recurso')
], subirRecurso);

// DELETE /api/servicios/:id/recursos/:id_recurso
router.delete('/:id_recurso', [
    validarJWT,
    esProveedor
], eliminarRecurso);

module.exports = router;