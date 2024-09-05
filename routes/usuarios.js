var express = require('express');
var router = express.Router();
const connection = require("../db-connection")
const multer = require('multer')
const setCookie = require('../middleware/setCookie')
const upload = multer({ dest: 'uploads/' })
const fs = require('fs')

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idusuario:
 *                     type: integer
 *                     description: ID del usuario
 *                   nombre:
 *                     type: string
 *                     description: Nombre del usuario
 *                   email:
 *                     type: string
 *                     description: Email del usuario
 *                   biografia:
 *                     type: string
 *                     description: Biografía del usuario
 *                   imagen:
 *                     type: string
 *                     description: URL de la imagen del usuario
 *       500:
 *         description: Error al obtener los usuarios
 *
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario
 *               email:
 *                 type: string
 *                 description: Email del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario creado exitosamente"
 *       400:
 *         description: Solicitud inválida, falta un campo requerido
 *       500:
 *         description: Error al crear el usuario
 *
 * /usuarios/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a obtener
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idusuario:
 *                   type: integer
 *                   description: ID del usuario
 *                 nombre:
 *                   type: string
 *                   description: Nombre del usuario
 *                 email:
 *                   type: string
 *                   description: Email del usuario
 *                 biografia:
 *                   type: string
 *                   description: Biografía del usuario
 *                 imagen:
 *                   type: string
 *                   description: URL de la imagen del usuario
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al obtener el usuario
 *
 * /usuarios/signin:
 *   post:
 *     summary: Inicia sesión de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inicio de sesión exitoso"
 *       400:
 *         description: Solicitud inválida, falta un campo requerido
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error al iniciar sesión
 */

router.get('/', function (req, res, next) {
    connection.query('SELECT * FROM usuarios', function (error, results, fields) {
        if (error) {
            console.error('Error al obtener los usuarios:', error);
            return res.status(500).json({ error: 'Error al obtener las recetas' });
        }
        res.json(results);
    });
});

router.get('/:id', function (req, res, next) {
    const idusuario = req.params.id;

    connection.query('SELECT * FROM usuarios WHERE idusuario = ?', [idusuario], function (error, results, fields) {
        if (error) {
            console.error('Error al obtener el usuario:', error);
            return res.status(500).json({ error: 'Error al obtener el usuario' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrada' });
        }

        res.json(results[0]);
    });
});


router.post(
  "/",
  async function (req, res, next) {
    console.log(req.body);

    if (!req.body.username || !req.body.password || !req.body.email) {
      res.status(400).end("Falta/n campo/s en el cuerpo de la petición.");
      return;
    }

    const existingEmailsQuery = "SELECT email FROM usuarios";

    const newUserData = [req.body.username, req.body.email, req.body.password];
    // biografia e imagen no aceptan NULL ni tienen valores por defecto definidos en la DB
    // por ello se definen unos valores por 'defecto' aqui, para poder insertar sin pedir
    // biografia e imagen en el formulario de registro
    const insertNewUserQuery =
      "INSERT INTO usuarios(nombre, email,contraseña,biografia,imagen) VALUES (?,?,?,'','')";

    // los try catch son aun bastante inespecificos
    try {
      // para evitar un callback hell usamos promesas copn async y await
      const [existingEmails] = await connection
        .promise()
        .query(existingEmailsQuery);

      // si indexOf devuelve -1, es porque el arreglo no tiene el objeto buscado
      if (existingEmails.map((e) => e.email).indexOf(req.body.email) > -1) {
        res.status(400).json("Ya existe un usuario con este email.");
        return;
      }
    } catch (error) {
      console.log("Se hallo un error chequear el mail de usuario: ", error);
      res.status(500).json("Hubieron problemas al validar su informacion.");
      return;
    }

    try {
      await connection.promise().query(insertNewUserQuery, [...newUserData]);
    } catch (error) {
      console.log("Se hallo un error al insertar un nuevo usuario: ", error);
      res.status(500).json("Hubieron problemas al registrar su cuenta.");
      return;
    }
    // para continuar al middleware de cookies
    next();
  },
  setCookie
);


router.post(
  "/signin",
  async function (req, res, next) {
    if (!req.body.password || !req.body.email) {
      res.status(400).json("Falta/n campo/s en el cuerpo de la petición.");
      return;
    }

    const userLoginDataQuery =
      "SELECT email,contraseña as password FROM usuarios WHERE email = ? AND contraseña = ?";
    try {
      const getUserDataResult = await connection
        .promise()
        .query(userLoginDataQuery, [req.body.email, req.body.password]);

      existingUserData = getUserDataResult[0];

      if (
        !existingUserData.length ||
        req.body.email !== existingUserData[0].email ||
        req.body.password !== existingUserData[0].password
      ) {
        res.status(401).json("Credenciales invalidas");
        return;
      }
    } catch (error) {
      console.log("Se hallo un error al iniciar sesion: ", error);
      res.status(500).json("Hubieron problemas al intentar iniciar sesion");
    }

    next();
  },
  setCookie
);

module.exports = router;
