import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { server } from './graph.js';

export const handler = startServerAndCreateLambdaHandler(
  server as any,
  handlers.createAPIGatewayProxyEventV2RequestHandler()
);
