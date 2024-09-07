const express = require('express');
const router = express.Router();
const multer = require('multer')
const path = require('path');
const fs = require('fs')
const { executeQuery } = require('./../database/executeQuery');

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

router.post('/nuevaReceta', upload.single('imagen'), async (req, res, next) => {
    const { titulo, subtitulo, pasos, ingredientes, idcategoria } = req.body;
    const imagen = req.file;

    if (!titulo || !subtitulo || !imagen || !pasos || !ingredientes || !idcategoria) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const imagenPath = `/images/recetas/${imagen.originalname}`;
    const query = `
        INSERT INTO recetas (titulo, subtitulo, imagen, pasos, ingredientes, idcategoria, idusuario) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [titulo, subtitulo, imagenPath, pasos, ingredientes, idcategoria, 2];

    try {
        const results = await executeQuery(query, values);

        const tempPath = path.join(__dirname, '../uploads', imagen.filename);
        const targetPath = path.join(__dirname, '../public/images/recetas', imagen.originalname);

        fs.rename(tempPath, targetPath, (error) => {
            if (error) {
                console.error('Error al mover la imagen:', error);
                return res.status(500).json({ error: 'Error al mover la imagen' });
            }
            res.json({ message: 'Receta agregada exitosamente', id: results.insertId });
        });
    } catch (error) {
        console.error('Error al insertar la receta:', error);
        res.status(500).json({ error: 'Error al insertar la receta' });
    }
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

router.get('/', async (req, res, next) => {
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

    try {
        const results = await executeQuery(query);
        res.json(results);
    } catch (error) {
        console.error('Error al obtener las recetas:', error);
        res.status(500).json({ error: 'Error al obtener las recetas' });
    }
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

router.get('/:id', async (req, res, next) => {
    const idreceta = req.params.id;
    const query = 'SELECT * FROM recetas WHERE idreceta = ?';

    try {
        const results = await executeQuery(query, [idreceta]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        res.json(results[0]);
    } catch (error) {
        console.error('Error al obtener la receta:', error);
        res.status(500).json({ error: 'Error al obtener la receta' });
    }
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

router.put('/:id', async (req, res, next) => {
    const { idreceta, titulo, subtitulo, imagen, pasos, ingredientes, idusuario } = req.body;

    if (!idreceta || !titulo || !subtitulo || !imagen || !pasos || !ingredientes || !idusuario) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const query = `
        UPDATE recetas 
        SET titulo = ?, subtitulo = ?, imagen = ?, pasos = ?, ingredientes = ?, idusuario = ? 
        WHERE idreceta = ?
    `;
    const values = [titulo, subtitulo, imagen, pasos, ingredientes, idusuario, idreceta];

    try {
        const results = await executeQuery(query, values);
        res.json({ message: 'Receta actualizada exitosamente', affectedRows: results.affectedRows });
    } catch (error) {
        console.error('Error al actualizar la receta:', error);
        res.status(500).json({ error: 'Error al actualizar la receta' });
    }
});

router.delete('/:id', async (req, res, next) => {
    const query = 'DELETE FROM recetas WHERE idreceta = ?';

    try {
        const results = await executeQuery(query, [req.params.id]);
        res.json({ message: 'Receta eliminada exitosamente', affectedRows: results.affectedRows });
    } catch (error) {
        console.error('Error al eliminar la receta:', error);
        res.status(500).json({ error: 'Error al eliminar la receta' });
    }
});

module.exports = router;