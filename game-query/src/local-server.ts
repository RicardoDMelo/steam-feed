import { startStandaloneServer } from '@apollo/server/standalone';
import { server } from './graph.js';

const port = Number(process.env.PORT ?? 3000);

const { url } = await startStandaloneServer(server, { listen: { port } });
console.log(`Supergraph rodando em ${url}`);
