const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); 
const Usuario = require('../models/usuario');
const RecuperacionCredencial = require('../models/recuperacion');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    },
    tls: {
        // Garantiza que la negociación TLS no falle por certificados intermedios
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    }
});

const solicitarRecuperacion = async (req, res) => {
    const { correo_electronico } = req.body;

    try {
        const usuario = await Usuario.findOne({ where: { correo_electronico } });
        if (!usuario) {
            return res.status(200).json({ 
                msg: 'Si el correo está registrado, recibirás un enlace con instrucciones.' 
            });
        }

        await RecuperacionCredencial.update(
            { usado: 1 }, 
            { where: { id_usuario: usuario.id_usuario, usado: 0 } }
        );

        const token = crypto.randomBytes(32).toString('hex');
        
        const fecha_creacion = new Date();
        const fecha_expiracion = new Date(fecha_creacion.getTime() + (60 * 60 * 1000));

        await RecuperacionCredencial.create({
            id_usuario: usuario.id_usuario,
            token,
            fecha_creacion,
            fecha_expiracion,
            usado: 0
        });

        const enlaceRecuperacion = `https://ing-soft-pr.onrender.com/restablecer-password?token=${token}`;
        console.log(enlaceRecuperacion);
        const mailOptions = {
            from: `"Soporte Bienestar en Casa" <${process.env.EMAIL_USER}>`, 
            to: correo_electronico, 
            subject: 'Recuperación de Contraseña',
            html: `
                <h3>Hola, ${usuario.nombre}</h3>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
                <a href="${enlaceRecuperacion}" target="_blank">${enlaceRecuperacion}</a>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            `
        };

        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar el correo:', error);
                
            } else {
                console.log('Correo de recuperación enviado:', info.response);
                        res.status(200).json({ 
                            msg: 'Si el correo está registrado, recibirás un enlace con instrucciones.' 
                        });
            }
        });



    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al procesar la solicitud' });
    }
};

const restablecerContrasena = async (req, res) => {
    const { token, nueva_contrasena } = req.body;

    try {
        const registroRecuperacion = await RecuperacionCredencial.findOne({ 
            where: { token },
            include: [Usuario]
        });

        if (!registroRecuperacion) {
            return res.status(400).json({ msg: 'Enlace de recuperación inválido.' });
        }

        if (registroRecuperacion.usado === 1) {
            return res.status(400).json({ msg: 'Este enlace ya fue utilizado.' });
        }

        const ahora = new Date();
        if (ahora > registroRecuperacion.fecha_expiracion) {
            return res.status(400).json({ msg: 'El enlace de recuperación ha expirado.' });
        }

        const salt = bcrypt.genSaltSync(10);
        const contrasena_hash = bcrypt.hashSync(nueva_contrasena, salt);

        await registroRecuperacion.Usuario.update({ contrasena_hash });
        await registroRecuperacion.update({ usado: 1 });

        res.status(200).json({ msg: 'Contraseña restablecida correctamente. Ya puede iniciar sesión.' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al restablecer la contraseña' });
    }
};

const verificarToken = async (req, res) => {
    const { token } = req.params;

    try {
        const registro = await RecuperacionCredencial.findOne({ 
            where: { token } 
        });

        
        if (!registro) {
            return res.status(400).json({ 
                ok: false, 
                msg: 'El enlace de recuperación es inválido o no existe.' 
            });
        }

        
        if (registro.usado === 1) {
            return res.status(400).json({ 
                ok: false, 
                msg: 'Este enlace ya fue utilizado. Solicita uno nuevo si necesitas cambiar tu clave.' 
            });
        }

        const ahora = new Date();
        if (ahora > registro.fecha_expiracion) {
            return res.status(400).json({ 
                ok: false, 
                msg: 'El enlace de recuperación ha expirado. Por seguridad, solicita uno nuevo.' 
            });
        }

        res.status(200).json({
            ok: true,
            msg: 'Enlace verificado correctamente'
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({ 
            ok: false, 
            msg: 'Error interno del servidor al validar el enlace' 
        });
    }
};

module.exports = {
    solicitarRecuperacion,
    restablecerContrasena,
    verificarToken
};