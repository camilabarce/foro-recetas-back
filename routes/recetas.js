const express = require('express');
const router = express.Router();
const connection = require("./../db-connection")
const multer = require('multer')
const path = require('path');
const fs = require('fs')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * /recetas/nuevaReceta:
 *   post:
 *     summary: Crea una nueva receta
 *     tags: [Recetas]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               subtitulo:
 *                 type: string
 *               pasos:
 *                 type: string
 *               ingredientes:
 *                 type: string
 *               idcategoria:
 *                 type: integer
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Receta agregada exitosamente
 */

router.post('/nuevaReceta', upload.single('imagen'), function (req, res, next) {
    const { titulo, subtitulo, pasos, ingredientes, idcategoria } = req.body;
    const imagen = req.file;

    console.log('Datos recibidos:', req.body);
    console.log('Archivo recibido:', req.file);

    if (!titulo || !subtitulo || !imagen || !pasos || !ingredientes || !idcategoria) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const imagenPath = `/images/recetas/${imagen.originalname}`;

    // Insertar la receta en la base de datos
    const query = `
        INSERT INTO recetas (titulo, subtitulo, imagen, pasos, ingredientes, idcategoria, idusuario) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [titulo, subtitulo, imagenPath, pasos, ingredientes, idcategoria, 2];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al insertar la receta:', error);
            return res.status(500).json({ error: 'Error al insertar la receta' });
        }

        // Mover la imagen del directorio temporal a la carpeta de imágenes pública
        const tempPath = path.join(__dirname, '../uploads', imagen.filename);
        const targetPath = path.join(__dirname, '../public/images/recetas', imagen.originalname);

        fs.rename(tempPath, targetPath, (error) => {
            if (error) {
                console.error('Error al mover la imagen:', error);
                return res.status(500).json({ error: 'Error al mover la imagen' });
            }
            res.json({ message: 'Receta agregada exitosamente', id: results.insertId });
        });
    });
});

/**
 * @swagger
 * /recetas:
 *   get:
 *     summary: Obtiene todas las recetas
 *     tags: [Recetas]
 *     responses:
 *       200:
 *         description: Lista de recetas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID de la receta
 *                   nombre:
 *                     type: string
 *                     description: Nombre de la receta
 */

router.get('/', function (req, res, next) {
    const query = `
        SELECT 
            recetas.idreceta,
            recetas.titulo,
            recetas.subtitulo,
            recetas.imagen,
            recetas.pasos,
            recetas.ingredientes,
            recetas.idusuario,
            categorias.nombre AS nombre_categoria
        FROM 
            recetas
        JOIN 
            usuarios ON recetas.idusuario = usuarios.idusuario
        JOIN 
            categorias ON recetas.idcategoria = categorias.idcategoria;
    `;
    connection.query(query, function (error, results, fields) {
        if (error) {
            console.error('Error al obtener las recetas:', error);
            return res.status(500).json({ error: 'Error al obtener las recetas' });
        }
        res.json(results);
    });
});

/**
 * @swagger
 * /recetas/{id}:
 *   get:
 *     summary: Obtiene una receta por ID
 *     tags: [Recetas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la receta
 *     responses:
 *       200:
 *         description: Detalles de la receta
 */

router.get('/:id', function (req, res, next) {
    const idreceta = req.params.id;

    connection.query('SELECT * FROM recetas WHERE idreceta = ?', [idreceta], function (error, results, fields) {
        if (error) {
            console.error('Error al obtener la receta:', error);
            return res.status(500).json({ error: 'Error al obtener la receta' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        res.json(results[0]);
    });
});

/**
 * @swagger
 * /recetas/{id}:
 *   put:
 *     summary: Actualiza una receta existente
 *     tags: [Recetas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la receta a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idreceta:
 *                 type: integer
 *                 description: ID de la receta
 *               titulo:
 *                 type: string
 *                 description: Título de la receta
 *               subtitulo:
 *                 type: string
 *                 description: Subtítulo de la receta
 *               imagen:
 *                 type: string
 *                 description: URL de la imagen
 *               pasos:
 *                 type: string
 *                 description: Pasos para preparar la receta
 *               ingredientes:
 *                 type: string
 *                 description: Ingredientes de la receta
 *               idusuario:
 *                 type: integer
 *                 description: ID del usuario que creó la receta
 *     responses:
 *       200:
 *         description: Receta actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Receta actualizada exitosamente"
 *                 affectedRows:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Solicitud inválida, falta un campo requerido
 *       500:
 *         description: Error al actualizar la receta
 *
 *   delete:
 *     summary: Elimina una receta existente
 *     tags: [Recetas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la receta a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Receta eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Receta eliminada exitosamente"
 *                 affectedRows:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Error al eliminar la receta
 */

router.put('/:id', function (req, res, next) {
    const { idreceta, titulo, subtitulo, imagen, pasos, ingredientes, idusuario } = req.body;

    if (!idreceta || !titulo || !subtitulo || !imagen || !pasos || !ingredientes || !idusuario) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    let query = 'UPDATE recetas SET titulo = ?, subtitulo = ?, imagen = ?, pasos = ?, ingredientes = ?, idusuario = ? WHERE idreceta = ?';
    let values = [titulo, subtitulo, imagen, pasos, ingredientes, idusuario, idreceta];

    connection.query(query, values, function (error, results, fields) {
        if (error) {
            console.error('Error al actualizar la receta:', error);
            return res.status(500).json({ error: 'Error al actualizar la receta' });
        }
        res.json({ message: 'Receta actualizada exitosamente', affectedRows: results.affectedRows });
    });
});

router.delete('/:id', function (req, res, next) {
    connection.query('DELETE FROM recetas WHERE idreceta = ' + req.params.id, function (error, results, fields) {
        if (error) {
            console.error('Error al eliminar la receta:', error);
            return res.status(500).json({ error: 'Error al eliminar la receta' });
        }
        res.json({ message: 'Receta eliminada exitosamente', affectedRows: results.affectedRows });
    });
});

module.exports = router;