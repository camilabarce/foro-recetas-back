const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
	openapi: '3.0.0',
	info: {
		title: 'API de Foro de Recetas',
		version: '1.0.0',
		description: 'Documentación de la API para el backend del foro de recetas',
	},
	servers: [
		{
			url: 'https://foro-recetas.up.railway.app/',
			description: 'Servidor de desarrollo en Railway',
		},
		{
			url: 'http://localhost:3000/',
			description: 'Servidor de desarrollo local',
		}
	],
	tags: [
		{
			name: 'Usuarios',
			description: 'Operaciones con usuarios',
		},
		{
			name: 'Recetas',
			description: 'Operaciones con recetas',
		},
		{
			name: 'Categorías',
			description: 'Operaciones con categorías',
		},
	],
};

const options = {
	swaggerDefinition,
	apis: ['./routes/*.js'], // Ruta donde están las rutas/APIs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
