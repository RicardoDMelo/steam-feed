import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	GetCommand,
	QueryCommand,
	type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import type { GameSummary } from "../domain/summary.js";
import { getCurrentDate } from "../helpers/date.js";

const client = new DynamoDBClient({
	region: process.env.AWS_REGION ?? 'sa-east-1',
});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = 'games';

export type GetGamesResult = {
	items: Array<GameSummary>;
	lastEvaluatedKey?: Record<string, unknown> | undefined;
}

export const getGames = async (
	exclusiveStartKey?: Record<string, unknown>,
	pageSize?: number,
): Promise<GetGamesResult> => {
	const dateAdded = getCurrentDate();
	const input: QueryCommandInput = {
		TableName: tableName,
		IndexName: "dateAddedKey",
		Limit: pageSize,
		ScanIndexForward: false,
		KeyConditionExpression: "#partitionKey = :pkValue",
		ExpressionAttributeNames: {
			"#partitionKey": "dateAdded"
		},
		ExpressionAttributeValues: {
			":pkValue": dateAdded
		}
	};

	// Add ExclusiveStartKey if we have a LastEvaluatedKey from a previous query
	if (exclusiveStartKey) {
		input.ExclusiveStartKey = exclusiveStartKey;
	}

	// Execute the query
	const command = new QueryCommand(input);
	const response = await docClient.send(command);

	return {
		items: (response.Items ?? []) as Array<GameSummary>,
		lastEvaluatedKey: response.LastEvaluatedKey,
	};
}

export const getGameByAppId = async (appId: number): Promise<GameSummary | undefined> => {
	const command = new GetCommand({
		TableName: tableName,
		Key: { appId, dateAdded: getCurrentDate() }
	});

	const response = await docClient.send(command);

	return response.Item as GameSummary | undefined;
}