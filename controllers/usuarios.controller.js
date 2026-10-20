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
            const barrioValido = await Barrio.findOne({
                where: { id_barrio, id_comuna }
            });
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

        } else {
            throw new Error('Rol inválido');
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

        res.json({
            ok: true,
            msg: 'Inicio de sesión exitoso',
            usuario: {
                id_usuario: usuario.id_usuario,
                rol: usuario.rol,
                nombre: usuario.nombre,
                apellido: usuario.apellido
            },
            token
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ msg: 'Hable con el administrador' });
    }
};

module.exports = {
    registrarUsuario,
    login
};