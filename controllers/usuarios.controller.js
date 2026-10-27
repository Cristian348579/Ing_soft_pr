const bcrypt = require('bcryptjs');
const { bdMySQL } = require('../database/db_conection');
const Usuario = require('../models/usuario');
const Cliente = require('../models/cliente');
const Proveedor = require('../models/proveedor');
const Barrio = require('../models/barrio');
const { generarJWT } = require('../helpers/generar-jwt');

const registrarUsuario = async (req, res) => {
    const { 
        correo_electronico, 
        contrasena, 
        rol, 
        nombre, 
        apellido, 
        direccion, 
        descripcion_perfil,
        id_comuna,
        id_barrio,
        informacion_complementaria
    } = req.body;
    
    const rolFormateado = (rol === 'cliente') ? 'C' : (rol === 'proveedor') ? 'P' : rol;
    const t = await bdMySQL.transaction();

    try {
        const existeEmail = await Usuario.findOne({ where: { correo_electronico } });
        if (existeEmail) {
            await t.rollback();
            return res.status(400).json({ msg: 'El correo electrónico ya está registrado' });
        }

        if (rolFormateado === 'C') {
            const barrioValido = await Barrio.findOne({ where: { id_barrio, id_comuna } });
            if (!barrioValido) {
                await t.rollback();
                return res.status(400).json({ msg: 'El barrio seleccionado no pertenece a la comuna indicada' });
            }
        }

        const salt = bcrypt.genSaltSync(10);
        const contrasena_hash = bcrypt.hashSync(contrasena, salt);

        const usuario = await Usuario.create({
            correo_electronico, 
            contrasena_hash, 
            rol: rolFormateado, 
            nombre, 
            apellido
        }, { transaction: t });

        if (rolFormateado === 'C') {
            await Cliente.create({ 
                id_cliente: usuario.id_usuario, 
                id_comuna,
                id_barrio,
                direccion,
                informacion_complementaria: informacion_complementaria || null
            }, { transaction: t });
        } else if (rolFormateado === 'P') {
            await Proveedor.create({ 
                id_proveedor: usuario.id_usuario, 
                descripcion_perfil 
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ 
            ok: true,
            msg: 'Usuario registrado satisfactoriamente', 
            usuario: {
                id_usuario: usuario.id_usuario,
                correo_electronico: usuario.correo_electronico,
                rol: usuario.rol,
                nombre: usuario.nombre,
                apellido: usuario.apellido
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ msg: 'Error al registrar el usuario' });
    }
};

const login = async (req, res) => {
    const { correo_electronico, contrasena } = req.body;

    try {
        const usuario = await Usuario.findOne({ where: { correo_electronico } });
        if (!usuario) {
            return res.status(400).json({ msg: 'Credenciales no válidas' });
        }

        const validPassword = bcrypt.compareSync(contrasena, usuario.contrasena_hash);
        if (!validPassword) {
            return res.status(400).json({ msg: 'Credenciales no válidas' });
        }

        const token = await generarJWT(usuario.id_usuario, usuario.rol);

        // Envío del JWT encapsulado en Cookie HttpOnly
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 4 * 60 * 60 * 1000 // 4 horas
        });

        res.json({
            ok: true,
            msg: 'Inicio de sesión exitoso',
            usuario: {
                id_usuario: usuario.id_usuario,
                rol: usuario.rol,
                nombre: usuario.nombre,
                apellido: usuario.apellido
            },
            token // Se mantiene en el JSON para compatibilidad con Postman
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ msg: 'Hable con el administrador' });
    }
};

// HU-002: Cierre de sesión seguro invalidando la cookie
const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({
        ok: true,
        msg: 'Sesión cerrada exitosamente'
    });
};

// HU-002: Endpoint para verificar sesión activa al cargar React
const verificarSesion = async (req, res) => {
    try {
        const { id_usuario } = req.usuarioAutenticado;
        const usuario = await Usuario.findByPk(id_usuario, {
            attributes: ['id_usuario', 'nombre', 'apellido', 'correo_electronico', 'rol']
        });

        if (!usuario) {
            return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
        }

        res.json({
            ok: true,
            usuario
        });
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        res.status(500).json({ ok: false, msg: 'Error al verificar sesión' });
    }
};

module.exports = {
    registrarUsuario,
    login,
    logout,
    verificarSesion
};