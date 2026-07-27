import { PublishCommand, SNSClient, paginateListTopics } from "@aws-sdk/client-sns";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

const client = new SNSClient({});
const topicArn = process.env.FAILED_QUERY_TOPIC_ARN;

export const sendFailedQueryEvent = async (event: Partial<APIGatewayProxyEventV2>) => {
  const response = await client.send(
    new PublishCommand({
      Message: JSON.stringify(event),
      TopicArn: topicArn,
    }),
  );
  return response;
};

