//El archivo resovlers.js dirige la lógica de la aplicación y cada función del schema.js tiene un equivalente aquí
//Este se conecta directamente a las colecciones de MongoDB

import { getDB } from './db.js';
import { ObjectId } from 'mongodb';

export const resolvers = {
    
    //Queries (Lectura)
    //.find() busca todos los documentos y .toArray() se encarga de convertirlo en un array
    
    getUsuarios: async () => {
        const db = getDB();
        const usuarios = await db.collection("usuarios").find().toArray();

        return usuarios.map(({ _id, ...datos }) => ({
            ...datos,
            id: _id.toHexString()
        }));
    },

    getIntercambios: async () => {
        const db = getDB();
        const intercambios = await db.collection("intercambios").find().toArray();

        return intercambios.map(({ _id, ...datos }) => ({
            ...datos,
            id: _id.toHexString()
        }));
    },

    //Mutations (Escritura)

    //Dentro las funciones de creción, .insertOne devuelve un objeto con el Id generado (insertedId)
    //Y en los returns se devuelven los objetos completos para que GraphQL lo muestre.

    crearUsuario: async ({ nombre, email, password }) => {
        const nombreLimpio = nombre.trim();
        const emailLimpio = email.trim().toLowerCase();

        if (!nombreLimpio || !emailLimpio || !password.trim()) {
            throw new Error("Nombre, correo y contraseña son obligatorios.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
            throw new Error("El correo electrónico no tiene un formato válido.");
        }

        const db = getDB();

        const usuarioExistente = await db.collection("usuarios").findOne({
            email: emailLimpio
        });

        if (usuarioExistente) {
            throw new Error("Ya existe un usuario con ese correo electrónico.");
        }

        const nuevoUsuario = {
            nombre: nombreLimpio,
            email: emailLimpio,
            password: password
        };

        const resultado = await db.collection("usuarios").insertOne(nuevoUsuario);

        return {
            ...nuevoUsuario,
            id: resultado.insertedId.toHexString()
        };
    },

    borrarUsuario: async ({ id }) => {
        if (!ObjectId.isValid(id)) {
            throw new Error("El identificador del usuario no es válido.");
        }

        const db = getDB();
        const resultado = await db.collection("usuarios").deleteOne({
            _id: new ObjectId(id)
        });

        if (resultado.deletedCount === 0) {
            throw new Error("No existe un usuario con ese identificador.");
        }

        return "Usuario eliminado correctamente";
    },

    crearIntercambio: async ({
        tipo, titulo, email, fecha, descripcion, usuarioId
    }) => {
        const nuevoIntercambio = {
            tipo: tipo.trim(),
            titulo: titulo.trim(),
            email: email.trim().toLowerCase(),
            fecha: fecha.trim(),
            descripcion: descripcion.trim(),
            usuarioId: usuarioId.trim()
        };

        if (Object.values(nuevoIntercambio).some((valor) => valor === "")) {
            throw new Error("Todos los campos del intercambio son obligatorios.");
        }

        if (!["oferta", "peticion"].includes(nuevoIntercambio.tipo)) {
            throw new Error("El tipo debe ser 'oferta' o 'peticion'.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoIntercambio.email)) {
            throw new Error("El correo electrónico no tiene un formato válido.");
        }

        const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(nuevoIntercambio.fecha);
        const fechaInterpretada = new Date(`${nuevoIntercambio.fecha}T00:00:00.000Z`);

        if (
            !fechaValida ||
            Number.isNaN(fechaInterpretada.getTime()) ||
            fechaInterpretada.toISOString().slice(0, 10) !== nuevoIntercambio.fecha
        ) {
            throw new Error("Introduce una fecha válida con formato YYYY-MM-DD.");
        }

        if (!ObjectId.isValid(nuevoIntercambio.usuarioId)) {
            throw new Error("El identificador del autor no es válido.");
        }

        const db = getDB();

        const autor = await db.collection("usuarios").findOne({
            _id: new ObjectId(nuevoIntercambio.usuarioId)
        });

        if (!autor) {
            throw new Error("No existe un usuario con el identificador del autor.");
        }

        const resultado = await db.collection("intercambios")
            .insertOne(nuevoIntercambio);

        return {
            ...nuevoIntercambio,
            id: resultado.insertedId.toHexString()
        };
    },

    borrarIntercambio: async ({ id }) => {
        if (!ObjectId.isValid(id)) {
            throw new Error("El identificador del intercambio no es válido.");
        }

        const db = getDB();
        const resultado = await db.collection("intercambios").deleteOne({
            _id: new ObjectId(id)
        }); 

        if (resultado.deletedCount === 0) {
            throw new Error("No existe un intercambio con ese identificador.");
        }

        return "Intercambio eliminado correctamente";
    }
};