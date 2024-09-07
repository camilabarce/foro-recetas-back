const express = require('express');
const router = express.Router();
const { executeQuery } = require('./../database/executeQuery');

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Obtiene todas las categorías
 *     tags: [Categorías]
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID de la categoría
 *                   nombre:
 *                     type: string
 *                     description: Nombre de la categoría
 */

router.get('/', async (req, res) => {
    try {
        const results = await executeQuery('SELECT * FROM categorias');
        res.json(results);
    } catch (error) {
        console.error('Error al obtener las categorias:', error);
        res.status(500).json({ error: 'Error al obtener las categorias' });
    }
});

module.exports = router;