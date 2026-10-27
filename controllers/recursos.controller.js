const Recurso = require('../models/recurso');
const Servicio = require('../models/servicio');
const imagekit = require('../helpers/imagekit');

const listarRecursos = async (req, res) => {
    const { id } = req.params;

    try {
        const recursos = await Recurso.findAll({
            where: { id_servicio: id },
            order: [['es_miniatura', 'DESC'], ['id_recurso', 'ASC']]
        });

        res.json({
            ok: true,
            total: recursos.length,
            recursos
        });
    } catch (error) {
        console.error('Error al consultar recursos:', error);
        res.status(500).json({ msg: 'Error al consultar recursos multimedia' });
    }
};

const subirRecurso = async (req, res) => {
    const { id: id_servicio } = req.params;
    const { id_usuario } = req.usuarioAutenticado;

    if (!req.file) {
        return res.status(400).json({ msg: 'No se ha adjuntado ningún archivo multimedia' });
    }

    try {
        const servicio = await Servicio.findByPk(id_servicio);

        if (!servicio) {
            return res.status(404).json({ msg: 'El servicio solicitado no existe' });
        }

        if (servicio.id_proveedor !== id_usuario) {
            return res.status(403).json({ msg: 'No tienes permiso para asociar multimedia a este servicio' });
        }

        const esVideo = req.file.mimetype.startsWith('video');
        const tipo = esVideo ? 'V' : 'F';
        const quiereMiniatura = req.body.es_miniatura === 'true' || req.body.es_miniatura === true;
        const es_miniatura = (!esVideo && quiereMiniatura) ? 1 : 0;

        // Subida al almacenamiento en la nube
        const uploadResponse = await imagekit.upload({
            file: req.file.buffer,
            fileName: `servicio_${id_servicio}_${Date.now()}`,
            folder: `/servicios/${id_servicio}`
        });

        // Si se define como nueva miniatura, desmarcar miniaturas anteriores del mismo servicio
        if (es_miniatura === 1) {
            await Recurso.update(
                { es_miniatura: 0 },
                { where: { id_servicio } }
            );
        }

        const nuevoRecurso = await Recurso.create({
            id_servicio,
            tipo,
            url_archivo: uploadResponse.url,
            es_miniatura,
            file_id: uploadResponse.fileId
        });

        res.status(201).json({
            ok: true,
            msg: `${tipo === 'F' ? 'Fotografía' : 'Video'} asociado correctamente`,
            recurso: nuevoRecurso
        });
    } catch (error) {
        console.error('Error al subir recurso:', error);
        res.status(500).json({ msg: 'Error interno al procesar y subir el archivo' });
    }
};

const eliminarRecurso = async (req, res) => {
    const { id: id_servicio, id_recurso } = req.params;
    const { id_usuario } = req.usuarioAutenticado;

    try {
        const servicio = await Servicio.findByPk(id_servicio);

        if (!servicio) {
            return res.status(404).json({ msg: 'Servicio no encontrado' });
        }

        if (servicio.id_proveedor !== id_usuario) {
            return res.status(403).json({ msg: 'No tienes autorización para eliminar multimedia de este servicio' });
        }

        const recurso = await Recurso.findOne({
            where: { id_recurso, id_servicio }
        });

        if (!recurso) {
            return res.status(404).json({ msg: 'Recurso multimedia no encontrado en el servicio' });
        }

        if (recurso.file_id) {
            try {
                await imagekit.deleteFile(recurso.file_id);
            } catch (ikError) {
                console.warn('No se pudo borrar el archivo en ImageKit:', ikError.message);
            }
        }

        await recurso.destroy();

        res.json({
            ok: true,
            msg: 'Recurso multimedia eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar recurso:', error);
        res.status(500).json({ msg: 'Error interno al eliminar el recurso' });
    }
};

module.exports = {
    listarRecursos,
    subirRecurso,
    eliminarRecurso
};