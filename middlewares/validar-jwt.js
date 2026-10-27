const jwt = require('jsonwebtoken');

const validarJWT = (req, res, next) => {
    const token = req.cookies?.token || req.header('x-token');

if (!token) {
        return res.status(401).json({ 
            ok: false,
            msg: 'No hay token en la petición. Inicie sesión.' 
        });
    }

    try {
        const { id_usuario, rol } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
        req.usuarioAutenticado = { id_usuario, rol };
        next();
    } catch (error) {
        return res.status(401).json({ 
            ok: false,
            msg: 'Token no válido o expirado' 
        });
    }
};

const esProveedor = (req, res, next) => {
    if (!req.usuarioAutenticado) {
        return res.status(500).json({ msg: 'Se quiere verificar el rol sin validar el token primero' });
    }
    if (req.usuarioAutenticado.rol !== 'P') {
        return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Proveedor.' });
    }
    next();
};


const esCliente = (req, res, next) => {
    if (!req.usuarioAutenticado) {
        return res.status(500).json({ msg: 'Se quiere verificar el rol sin validar el token primero' });
    }
    if (req.usuarioAutenticado.rol !== 'C') {
        return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Cliente.' });
    }
    next();
};

module.exports = {
    validarJWT,
    esProveedor,
    esCliente
};