//El archivo schema.js se encarga de definirle a la API los datos que existen y que se puede hacer
import { buildSchema } from "graphql"; //

export const schema = buildSchema(`
    
    # TIPOS DE DATOS

    type Usuario {    
        id: ID!
        nombre: String!
        email: String!
        password: String!
    }

    type Intercambio {
        id: ID!
        tipo: String!
        titulo: String!
        email: String!
        fecha: String!
        descripcion: String!
        usuarioId: String!    
    }
    
    # Operaciones que nos permiten consultar datos
    type Query {
        getUsuarios: [Usuario]
        getIntercambios: [Intercambio]
        obtenerSeleccion(usuarioId: ID!): [ID!]!
    }

    # Operaciones para modificar los datos (CRUDs)
    type Mutation {
        crearUsuario(nombre: String!, email: String!, password: String!): Usuario
        actualizarUsuario(id: ID!, nombre: String!, email: String!, password: String!): Usuario
        borrarUsuario(id: ID!): String
        actualizarIntercambio(id: ID!, tipo: String!, titulo: String!, email: String!, fecha: String!, descripcion: String!, usuarioId: String!): Intercambio
        crearIntercambio(tipo: String!, titulo: String!, email: String!, fecha: String!, descripcion: String!, usuarioId: String!): Intercambio
        borrarIntercambio(id: ID!): String
        guardarSeleccion(usuarioId: ID!, intercambioId: ID!): Boolean!
        quitarDeSeleccion(usuarioId: ID!, intercambioId: ID!): Boolean!
    }
`);