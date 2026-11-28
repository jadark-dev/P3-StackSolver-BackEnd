//El archivo resolvers.js dirige la lógica de la aplicación y cada función del schema.js tiene un equivalente aquí
//Este se conecta directamente a las colecciones de MongoDB

import { getDB } from './db.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Clave secreta para firmar los tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura';

export const resolvers = {
    
    // ==========================================
    // MUTATIONS (Escritura y Autenticación)
    // ==========================================

    login: async ({ email, password }) => {
        const db = getDB();
        const emailLimpio = email.trim().toLowerCase();

        const usuario = await db.collection("usuarios").findOne({ email: emailLimpio });

        if (!usuario) {
            throw new Error("Credenciales incorrectas. El usuario no existe.");
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            throw new Error("Credenciales incorrectas. La contraseña no es válida.");
        }

        const token = jwt.sign(
            { id: usuario._id.toString(), email: usuario.email },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        return {
            token,
            usuario: {
                id: usuario._id.toString(),
                nombre: usuario.nombre,
                email: usuario.email
            }
        };
    },

    crearUsuario: async ({ nombre, email, password }, context) => {
        if (!context || !context.user) {
            throw new Error("No autorizado. Debes iniciar sesión para realizar esta acción.");
        }

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

        const passwordEncriptada = await bcrypt.hash(password, 10);

        const nuevoUsuario = {
            nombre: nombreLimpio,
            email: emailLimpio,
            password: passwordEncriptada 
        };

        const resultado = await db.collection("usuarios").insertOne(nuevoUsuario);

        return {
            id: resultado.insertedId.toHexString(),
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email
        };
    },

    actualizarUsuario: async ({ id, nombre, email, password }, context) => {
        if (!context || !context.user) {
            throw new Error("No autorizado. Debes iniciar sesión para realizar esta acción.");
        }

        if (!ObjectId.isValid(id)) {
            throw new Error("El identificador del usuario no es válido.");
        }

        const nombreLimpio = nombre.trim();
        const emailLimpio = email.trim().toLowerCase();

        if (!nombreLimpio || !emailLimpio || !password.trim()) {
            throw new Error("Nombre, correo y contraseña son obligatorios.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
            throw new Error("El correo electrónico no tiene un formato válido.");
        }

        const db = getDB();
        const identificador = new ObjectId(id);

        const correoOcupado = await db.collection("usuarios").findOne({
            email: emailLimpio,
            _id: { $ne: identificador }
        });

        if (correoOcupado) {
            throw new Error("Ya existe otro usuario con ese correo electrónico.");
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);

        const datos = {
            nombre: nombreLimpio,
            email: emailLimpio,
            password: passwordEncriptada
        };

        const resultado = await db.collection("usuarios").updateOne(
            { _id: identificador },
            { $set: datos }
        );

        if (resultado.matchedCount === 0) {
            throw new Error("No existe un usuario con ese identificador.");
        }

        return {
            id: identificador.toHexString(),
            nombre: datos.nombre,
            email: datos.email
        };
    },

    borrarUsuario: async ({ id }, context) => {
        if (!context || !context.user) {
            throw new Error("No autorizado. Debes iniciar sesión para realizar esta acción.");
        }

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

        // Borrado en cascada
        await db.collection("intercambios").deleteMany({ usuarioId: id });
        await db.collection("selecciones").deleteMany({ usuarioId: id });

        return "Usuario eliminado correctamente";
    },

    crearIntercambio: async ({ tipo, titulo, email, fecha, descripcion, usuarioId }, context) => {
        if (!context || !context.user) {
            throw new Error("No autorizado. Debes iniciar sesión para realizar esta acción.");
        }

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

    actualizarIntercambio: async ({ id, tipo, titulo, email, fecha, descripcion, usuarioId }, context) => {
        if (!context || !context.user) {
            throw new Error("No autorizado. Debes iniciar sesión para realizar esta acción.");
        }

        if (!ObjectId.isValid(id) || !ObjectId.isValid(usuarioId)) {
            throw new Error("El identificador del intercambio o del autor no es válido.");
        }

        const datos = {
            tipo: tipo.trim(),
            titulo: titulo.trim(),
            email: email.trim().toLowerCase(),
            fecha: fecha.trim(),
            descripcion: descripcion.trim(),
            usuarioId: new ObjectId(usuarioId).toHexString()
        };

        if (Object.values(datos).some((valor) => valor === "")) {
            throw new Error("Todos los campos del intercambio son obligatorios.");
        }

        if (!["oferta", "peticion"].includes(datos.tipo)) {
            throw new Error("El tipo debe ser 'oferta' o 'peticion'.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
            throw new Error("El correo electrónico no tiene un formato válido.");
        }

        const fechaInterpretada = new Date(`${datos.fecha}T00:00:00.000Z`);

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) ||
            Number.isNaN(fechaInterpretada.getTime()) ||
            fechaInterpretada.toISOString().slice(0, 10) !== datos.fecha
        ) {
            throw new Error("Introduce una fecha válida con formato YYYY-MM-DD.");
        }

        const db = getDB();

        const autor = await db.collection("usuarios").findOne({
            _id: new ObjectId(datos.usuarioId)
        });

        if (!autor) {
            throw new Error("No existe un usuario con el identificador del autor.");
        }

        const identificador = new ObjectId(id);

        const resultado = await db.collection("intercambios").updateOne(
            { _id: identificador },
            { $set: datos }
        );

        if (resultado.matchedCount === 0) {
            throw new Error("No existe un intercambio con ese identificador.");
        }

        return {
            ...datos,
            id: identificador.toHexString()
        };
    },

    borrarIntercambio: async ({ id }, context) => {
        if (!context || !context.user) {
            throw new Error("No autorizado. Debes iniciar sesión para realizar esta acción.");
        }

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

        // Borrado en cascada
        await db.collection("selecciones").deleteMany({ intercambioId: id });

        return "Intercambio eliminado correctamente";
    },

    guardarSeleccion: async ({ usuarioId, intercambioId }, context) => {
        if (!context || !context.user) {
            throw new Error("No autorizado. Debes iniciar sesión para realizar esta acción.");
        }

        if (!ObjectId.isValid(usuarioId) || !ObjectId.isValid(intercambioId)) {
            throw new Error("Los identificadores no son válidos.");
        }

        const db = getDB();

        const usuario = await db.collection("usuarios").findOne({
            _id: new ObjectId(usuarioId)
        });

        const intercambio = await db.collection("intercambios").findOne({
            _id: new ObjectId(intercambioId)
        });

        if (!usuario || !intercambio) {
            throw new Error("El usuario o el intercambio no existe.");
        }

        await db.collection("selecciones").updateOne(
            { usuarioId, intercambioId },
            { $set: { usuarioId, intercambioId } },
            { upsert: true }
        );

        return true;
    },

    quitarDeSeleccion: async ({ usuarioId, intercambioId }, context) => {
        if (!context || !context.user) {
            throw new Error("No autorizado. Debes iniciar sesión para realizar esta acción.");
        }

        if (!ObjectId.isValid(usuarioId) || !ObjectId.isValid(intercambioId)) {
            throw new Error("Los identificadores no son válidos.");
        }

        const db = getDB();

        const resultado = await db.collection("selecciones").deleteOne({
            usuarioId,
            intercambioId
        });

        return resultado.deletedCount === 1;
    },

    // ==========================================
    // QUERIES (Lectura)
    // ==========================================

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

    obtenerSeleccion: async ({ usuarioId }) => {
        if (!ObjectId.isValid(usuarioId)) {
            throw new Error("El identificador del usuario no es válido.");
        }

        const db = getDB();
        const selecciones = await db.collection("selecciones").find({
            usuarioId: usuarioId
        }).toArray();

        return selecciones.map((seleccion) => seleccion.intercambioId);
    }
};
