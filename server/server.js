const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser'); 
const {bdMySQL} = require('../database/db_conection');


class Server {
    constructor(){
        this.app = express();
        this.port = process.env.PORT;
        this.dbConnection();
        this.midlemiddlewares();
        this.routes();
        /*this.app.use(express.static(path.join(__dirname,'..','public')));*/


        /*this.app.get(
            '/', (req, res) => {
                res.sendFile(path.join(__dirname,'../dist','index.html'))
            } 
        )*/
        
    }
    midlemiddlewares() {
        this.app.use(cors({
            origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
            credentials: true
        }));

        this.app.use(express.json());

        this.app.use(cookieParser());

        this.app.use(express.static(path.resolve(__dirname, '../public')));
    }
    async dbConnection() {
        try {
            await bdMySQL.authenticate();
            console.log('Connection OK a Nube.');
        } catch (error) {
            console.error('No se pudo Conectar a la BD MySQL', error);
        }
    }
    routes() {
        this.app.use('/api/usuarios', require('../routes/usuarios.route'));
        this.app.use('/api/recuperacion', require('../routes/recuperacion.route'));
        this.app.use('/api/clientes', require('../routes/clientes.route'));
        this.app.use('/api/proveedores', require('../routes/proveedores.route'));
        this.app.use('/api/servicios', require('../routes/servicios.route'));
        this.app.use('/api/ubicaciones', require('../routes/ubicaciones.route'));
        this.app.use('/api/servicios/:id/recursos', require('../routes/recursos.route'));
        this.app.use('/api/disponibilidad', require('../routes/disponibilidad.route'));
        this.app.get('/{*path}', (req, res) => {
            res.sendFile(path.resolve(__dirname, '../public/index.html'));
        });
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log('Servidor corriendo en puerto', this.port);
        });
    }
}

module.exports = Server;