import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// esbuild empacota este arquivo em CJS para produção (onde __dirname existe,
// mas import.meta fica vazio); em dev roda como ESM puro via tsx (onde
// __dirname não existe). Precisa funcionar nos dois formatos.
const currentDir =
  typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));

const supergraphSdl = readFileSync(join(currentDir, 'schema.graphql')).toString();

const gateway = new ApolloGateway({
  supergraphSdl,
});

export const server = new ApolloServer({
  gateway,
});