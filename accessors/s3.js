import AWS from 'aws-sdk';
import { v4 as uuidv4 } from "uuid";

var s3Bucket = new AWS.S3( { params: {Bucket: 'sui-meme-image'}, region: "us-west-2" } );

export function uploadImage(base64Image) {
    var buf = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""),'base64');
    const type = base64Image.split(';')[0].split('/')[1];
    var data = {
      Key: uuidv4(), 
      Body: buf,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: type
    };
    return s3Bucket.upload(data).promise();
}

