import express from 'express';
import dotenv from 'dotenv';
import {conectarDB} from './db.js';

//cargamos las variables del archivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

//Conectamos a MongoDB antes de arrancar el servidor
conectarDB().then(() => {
    //Ruta básica de prueba
    app.get('/', (req, res) => {
        res.send(`Servidor Backend de StackSolvers funcionando con MongoDB`);
    });

    //Arrancamos el servidor
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}/graphql`);
    });
}).catch(err => {
    console.error("No se puede iniciar el servidor porque falló la conexión a la BD");
});
