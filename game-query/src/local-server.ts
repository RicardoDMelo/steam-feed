import express from 'express';
import type { Context } from 'aws-lambda';
import { handler as queryHandler } from './query.js';
import { handler as getHandler } from './get.js';

const app = express();
app.use(express.json());

const fakeContext = {
	logGroupName: '/local/game-query',
} as Context;

app.get('/game-query', async (req, res) => {
	try {
		const event = req.query.cursor !== undefined ? { cursor: String(req.query.cursor) } : {};
		const result = await queryHandler(event, fakeContext);
		res.type('application/json').send(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal error' });
	}
});

app.get('/game-query/:id', async (req, res) => {
	try {
		const result = await getHandler({ id: Number(req.params.id) }, fakeContext);
		if (!result) {
			res.status(404).json({ error: 'Not found' });
			return;
		}
		res.type('application/json').send(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal error' });
	}
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Local API rodando em http://localhost:${port}`);
	console.log(`Teste com: curl "http://localhost:${port}/game-query"`);
	console.log(`Teste com: curl "http://localhost:${port}/game-query/570"`);
});
