import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	BatchWriteCommand,
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	QueryCommand,
	ScanCommand,
	type QueryCommandInput,
	type ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import type { GameSummary } from "../domain/summary.js";
import { getCurrentDate } from "../helpers/date.js";

const client = new DynamoDBClient({
	region: process.env.AWS_REGION ?? 'sa-east-1',
});
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
	const gamesBatches = createBatches(games, 25);
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
		Key: { appId, dateAdded: getCurrentDate() }
	});

	const response = await docClient.send(command);

	return response.Item as GameSummary | undefined;
}

export const getSteamSpyLastPage = async (): Promise<number> => {
	const command = new GetCommand({
		TableName: tableName,
		Key: { appId: steamSpyCursorAppId, dateAdded: getCurrentDate() }
	});

	const response = await docClient.send(command);

	return (response.Item?.lastPage as number | undefined) ?? -1;
}

export const setSteamSpyLastPage = async (lastPage: number): Promise<void> => {
	const command = new PutCommand({
		TableName: tableName,
		Item: { appId: steamSpyCursorAppId, dateAdded: getCurrentDate(), lastPage }
	});

	await docClient.send(command);
}

export const clearGames = async (): Promise<number> => {
	let exclusiveStartKey: Record<string, unknown> | undefined;
	let deletedCount = 0;

	do {
		const scanInput: ScanCommandInput = {
			TableName: tableName,
			ProjectionExpression: "appId, dateAdded",
			ExclusiveStartKey: exclusiveStartKey,
		};

		const scanResponse = await docClient.send(new ScanCommand(scanInput));
		const items = scanResponse.Items ?? [];

		const deleteBatches = createBatches(items, 25);
		for (const batch of deleteBatches) {
			const deleteRequests = batch.map((item) => ({
				DeleteRequest: {
					Key: { appId: item.appId, dateAdded: item.dateAdded },
				},
			}));

			await docClient.send(new BatchWriteCommand({
				RequestItems: {
					[tableName]: deleteRequests,
				},
			}));

			deletedCount += batch.length;
		}

		exclusiveStartKey = scanResponse.LastEvaluatedKey;
	} while (exclusiveStartKey);

	return deletedCount;
}