var express = require('express');
var router = express.Router();
const multer = require('multer')
const setCookie = require('../middleware/setCookie')
const upload = multer({ dest: 'uploads/' })
const fs = require('fs')
const { executeQuery } = require('./../database/executeQuery');

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

router.get('/', async function (req, res, next) {
  const query = 'SELECT * FROM usuarios';

  try {
      const results = await executeQuery(query);
      res.json(results);
  } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

router.get('/:id', async function (req, res, next) {
  const idusuario = req.params.id;
  const query = 'SELECT * FROM usuarios WHERE idusuario = ?';

  try {
      const results = await executeQuery(query, [idusuario]);

      if (results.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json(results[0]);
  } catch (error) {
      console.error('Error al obtener el usuario:', error);
      res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

router.post('/', async function (req, res, next) {
  if (!req.body.username || !req.body.password || !req.body.email) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const checkEmailQuery = 'SELECT email FROM usuarios WHERE email = ?';
  const insertUserQuery = 'INSERT INTO usuarios(nombre, email, contraseña, biografia, imagen) VALUES (?, ?, ?, "", "")';

  try {
      const existingEmails = await executeQuery(checkEmailQuery, [req.body.email]);

      if (existingEmails.length > 0) {
          return res.status(400).json({ error: 'Ya existe un usuario con este email' });
      }

      const newUserData = [req.body.username, req.body.email, req.body.password];
      await executeQuery(insertUserQuery, newUserData);

      next();
  } catch (error) {
      console.error('Error al crear el usuario:', error);
      res.status(500).json({ error: 'Error al crear el usuario' });
  }
}, setCookie);

router.post('/signin', async function (req, res, next) {
  if (!req.body.password || !req.body.email) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const loginQuery = 'SELECT email, contraseña AS password FROM usuarios WHERE email = ? AND contraseña = ?';

  try {
      const results = await executeQuery(loginQuery, [req.body.email, req.body.password]);

      if (results.length === 0) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      next();
  } catch (error) {
      console.error('Error al iniciar sesión:', error);
      res.status(500).json({ error: 'Error al intentar iniciar sesión' });
  }
}, setCookie);

module.exports = router;