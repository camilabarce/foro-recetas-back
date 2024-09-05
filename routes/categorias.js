const express = require('express');
const router = express.Router();
const connection = require("./../db-connection")

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

router.get('/', function (req, res, next) {
    connection.query('SELECT * FROM categorias', function (error, results, fields) {
        if (error) {
            console.error('Error al obtener las categorias:', error);
            return res.status(500).json({ error: 'Error al obtener las categorias' });
        }
        res.json(results);
    });
});

module.exports = router;