import express from 'express';
import type { Context } from 'aws-lambda';
import { handler as fetchHandler } from './fetch.js';
import { handler as clearHandler } from './clear.js';

const app = express();
app.use(express.json());

const fakeContext = {
	logGroupName: '/local/steam-fetch',
} as Context;

app.post('/steam-fetch', async (req, res) => {
	try {
		const result = await fetchHandler({}, fakeContext);
		res.type('application/json').send(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal error' });
	}
});

app.delete('/steam-fetch', async (req, res) => {
	try {
		const result = await clearHandler({}, fakeContext);
		res.type('application/json').send(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal error' });
	}
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Local API rodando em http://localhost:${port}`);
	console.log(`Teste com: curl -X POST "http://localhost:${port}/steam-fetch"`);
	console.log(`Limpar tabela: curl -X DELETE "http://localhost:${port}/steam-fetch"`);
});
