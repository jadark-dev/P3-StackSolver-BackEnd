//El archivo server.js sirve como punto de entrada para la aplicación y se encarga de arrancar Express.
//También se encarga de configurar el endpoint de GraphQL


import express from 'express';
import dotenv from 'dotenv';
import {conectarDB} from './db.js';
import { graphqlHTTP } from 'express-graphql';
import { schema } from './schema.js';
import { resolvers } from './resolvers.js';

//cargamos las variables del archivo .env que son las credenciales de MongoDB
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

//Conectamos a MongoDB antes de arrancar el servidor
conectarDB().then(() => {
    //Configuración del endpoint de GraphQL
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        rootValue: resolvers,
        graphiql: true //Esto es lo que se encarga de activar la interfaz gráfica en el navegador
    }));

    //Arrancamos el servidor para escuchar peticiones
    app.listen(PORT, () => {
        console.log(`Servidor GraphQL escuchando en http://localhost:${PORT}/graphql`);
    });
}).catch(err => {
    console.error("No se puede iniciar el servidor porque falló la conexión a la BD");
});
