import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

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

export function getDB() {
    if (!db) throw new Error("Base de Datos no inicializada");
    return db;
}