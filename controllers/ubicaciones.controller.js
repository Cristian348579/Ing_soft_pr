const Comuna = require('../models/comuna');
const Barrio = require('../models/barrio');

const obtenerUbicaciones = async (req, res) => {
    try {
        const comunas = await Comuna.findAll({
            attributes: ['id_comuna', 'nombre'],
            include: [{
                model: Barrio,
                attributes: ['id_barrio', 'nombre']
            }],
            order: [
                ['id_comuna', 'ASC'],
                [Barrio, 'nombre', 'ASC']
            ]
        });

        res.json({
            ok: true,
            msg: 'Ubicaciones obtenidas correctamente',
            comunas
        });
    } catch (error) {
        console.error('Error al obtener las ubicaciones:', error);
        res.status(500).json({ msg: 'Error al obtener las ubicaciones' });
    }
};

module.exports = {
    obtenerUbicaciones
};