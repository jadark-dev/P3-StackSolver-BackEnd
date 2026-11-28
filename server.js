//El archivo server.js sirve como punto de entrada para la aplicación y se encarga de arrancar Express.
//También se encarga de configurar el endpoint de GraphQL

import express from 'express';
import dotenv from 'dotenv';
import { conectarDB } from './db.js';
import { graphqlHTTP } from 'express-graphql';
import { schema } from './schema.js';
import { resolvers } from './resolvers.js';
import jwt from 'jsonwebtoken'; // <-- 1. Importamos la librería JWT

//cargamos las variables del archivo .env que son las credenciales de MongoDB
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
// Clave secreta para los tokens (debe coincidir con la de resolvers.js)
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura';

//Conectamos a MongoDB antes de arrancar el servidor
conectarDB().then(() => {
    
    // 2. Configuramos el endpoint pasando una función (Middleware) para extraer el usuario
    app.use('/graphql', graphqlHTTP((req) => {
        
        // Extraemos el token de la cabecera "Authorization: Bearer <token>"
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        
        let user = null;
        if (token) {
            try {
                // Verificamos la firma del token y lo decodificamos
                user = jwt.verify(token, JWT_SECRET);
            } catch (error) {
                console.log("Token inválido o expirado");
            }
        }

        // Retornamos la configuración de GraphQL incluyendo el contexto
        return {
            schema: schema,
            rootValue: resolvers,
            graphiql: true, // Interfaz gráfica
            context: { user } // <-- 3. Pasamos el usuario a los resolvers
        };
    }));

    //Arrancamos el servidor para escuchar peticiones
    app.listen(PORT, () => {
        console.log(`Servidor GraphQL escuchando en http://localhost:${PORT}/graphql`);
    });
}).catch(err => {
    console.error("No se puede iniciar el servidor porque falló la conexión a la BD");
});
