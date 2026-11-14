//El archivo resovlers.js dirige la lógica de la aplicación y cada función del schema.js tiene un equivalente aquí
//Este se conecta directamente a las colecciones de MongoDB

import { getDB } from './db.js';
import { ObjectId } from 'mongodb';

export const resolvers = {
    
    //Queries (Lectura)
    //.find() busca todos los documentos y .toArray() se encarga de convertirlo en un array
    
    getUsuarios: async () => {
        const db = getDB();
        return await db.collection('usuarios').find().toArray();
    },

    getIntercambios: async () => {
        const db = getDB();
        return await db.collection('intercambios').find().toArray();
    },

    //Mutations (Escritura)

    //Dentro las funciones de creción, .insertOne devuelve un objeto con el Id generado (insertedId)
    //Y en los returns se devuelven los objetos completos para que GraphQL lo muestre.

    crearUsuario: async ({nombre, email, password}) => {
        const db = getDB();
        const resultado = await db.collection('usuarios').insertOne({ nombre, email, password });
        return { id: resultado.insertedId, nombre, email, password };
    },

    borrarUsuario: async ({ id }) => {
        const db = getDB();
        await db.collection('usuarios').deleteOne({ _id: new ObjectId(id)});
        return "Usuario eliminado correctamente";
    },

    crearIntercambio: async ({ tipo, titulo, email, fecha, descripcion, usuarioId}) => {
        const db = getDB();
        const resultado = await db.collection('intercambios').insertOne({ tipo, titulo, email, fecha, descripcion, usuarioId });
        return { id: resultado.insertedId, tipo, titulo, email, fecha, descripcion, usuarioId };
    },

    borrarIntercambio: async ({ id }) => {
        const db = getDB();
        await db.collection('intercambios').deleteOne({ _id: new ObjectId(id) });
        return "Intercambio eliminado correctamente";
    }
};