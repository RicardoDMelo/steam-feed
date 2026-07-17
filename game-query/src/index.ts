import type { S3Event, Context } from 'aws-lambda';

type AreaEvent = {
    length: number;
    width: number;
}

export const handler = async (event: AreaEvent, context: Context): Promise<string> => {

    const length = event.length;
    const width = event.width;
    let area = calculateArea(length, width);
    console.log(`The area is ${area}`);

    console.log('CloudWatch log group: ', context.logGroupName);

    let data = {
        "area": area,
    };

    return Promise.resolve(JSON.stringify(data));

    function calculateArea(length: number, width: number) {
        return length * width;
    }
};