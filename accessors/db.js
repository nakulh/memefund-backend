import AWS from 'aws-sdk';
import { v4 as uuidv4 } from "uuid";

const dynamoDb = new AWS.DynamoDB.DocumentClient({region: "us-west-2"});

export function getComments(poolId) {
    const listParams = {
        TableName: 'TokenComments',
        IndexName: 'poolId-index',
        ConsistentRead: true,
        KeyConditionExpression: 'poolId = :x',
        ExpressionAttributeValues: {
            ':x': poolId
        },
        ConsistentRead: false,
        ProjectionExpression: "#poolComment, walletId, #timeOfComment",
        ExpressionAttributeNames: {"#poolComment": "comment", "#timeOfComment": "time"}
    }
    console.log("listSubs params = ", listParams);

    return dynamoDb.query(listParams).promise();
}

export function storeComment(poolId, comment, walletId) {
    const putCommentParams = {
        TableName: 'TokenComments',
        Item: {
            poolId: poolId,
            comment: comment,
            id: uuidv4(),
            walletId: walletId,
            time: Date.now()
        }
    }
    return dynamoDb.put(putCommentParams).promise();
}