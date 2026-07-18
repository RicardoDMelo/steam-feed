import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	BatchWriteCommand,
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	QueryCommand,
	type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import type { GameSummary } from "../domain/summary.js";
import { getCurrentDate } from "../helpers/date.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = 'games';
// appId sentinel: reserved id (SteamSpy appIds are always positive) used to store the SteamSpy ingestion cursor.
const steamSpyCursorAppId = -1;

const createBatches = (list: Array<any>, size: number) => {
	const result = [];

	for (let i = 0; i < list.length; i += size) {
		const batch = list.slice(i, i + size);
		result.push(batch);
	}

	return result;
}

export const writeGames = async (games: Array<GameSummary>) => {
	const gamesBatches = createBatches(games, 100);
	for (const batch of gamesBatches) {
		const putRequests = batch.map((game) => ({
			PutRequest: {
				Item: game,
			},
		}));

		const command = new BatchWriteCommand({
			RequestItems: {
				[tableName]: putRequests,
			},
		});

		await docClient.send(command);
	}
};

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
		Key: { appId }
	});

	const response = await docClient.send(command);

	return response.Item as GameSummary | undefined;
}

export const getSteamSpyLastPage = async (): Promise<number> => {
	const command = new GetCommand({
		TableName: tableName,
		Key: { appId: steamSpyCursorAppId }
	});

	const response = await docClient.send(command);

	return (response.Item?.lastPage as number | undefined) ?? -1;
}

export const setSteamSpyLastPage = async (lastPage: number): Promise<void> => {
	const command = new PutCommand({
		TableName: tableName,
		Item: { appId: steamSpyCursorAppId, lastPage }
	});

	await docClient.send(command);
}