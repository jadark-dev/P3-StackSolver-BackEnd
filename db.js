//El archivo db.js es el módulo que se encarga de exportar las funciones conectarDB() y getDB()
//Utilizamos el driver oficial de MongoDB

import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

//cargamos las variables del archivo .env
dotenv.config();

//La URI es la dirección de la base de datos en la nube con MongoDB Atlas
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

//Esta es la variable que utilizamos para guardar la conexión y usarla en los resolvers
let db;

//Esta función establece la conexión inicial con MongoDB
export async function conectarDB() {
    try {
        await client.connect();
        db = client.db('StackSolversDB');
        console.log("Conectado a MongoDB!");
        return db;
    } catch (error) {
        console.log("Error al conectar a MongoDB", error);
        throw error;
    }
}

//Esta función se encarga de devolver la conexión activa a los resovlers para que puedan usarla
export function getDB() {
    if (!db) throw new Error("Base de Datos no inicializada");
    return db;
}