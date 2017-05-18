'use strict';

var AWS = require('aws-sdk');

module.exports.copy = function (event, context, callback) {

    checkEventSource(event, (err, record) => {
        if (err) {
            console.error(err);
            return callback(err);
        }

        const config = { apiVersion: '2006-03-01', signatureVersion: 'v4' };
        const s3 = new AWS.S3(config);

        const srcBucket = record.s3.bucket.name;
        const srcKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
        const ver = record.s3.s3SchemaVersion;
        const eTag = record.s3.object.eTag;
        const sequencer = record.s3.object.sequencer;
        const eventTime = record.eventTime;

        const targetBucket = process.env.TargetBucket;
        const targetKey = srcKey;

        console.log(`eventTime: ${eventTime}`);
        console.log(`eTag: ${eTag}`);
        console.log(`sequencer: ${sequencer}`);
        console.log(`Copying ${srcKey} from ${srcBucket} to ${targetBucket}`);

        const params = {
            Bucket: targetBucket,
            Key: targetKey,
            CopySource: encodeURIComponent(srcBucket + '/' + srcKey),
            MetadataDirective: 'COPY'
        };

        s3.copyObject(params, (err, data) => {
            if (err) {
                console.log(`Error copying ${srcKey} from ${srcBucket} to ${targetBucket}`);
                console.log(err, err.stack);
                const err = new Error(`Error copying ${srcKey} from ${srcBucket} to ${targetBucket}`);
                return callback(err);
            }

            console.log(`### Copy Completed. `);
            console.log(`Target ETag: ${data.CopyObjectResult.ETag}`);
            console.log(`LastModified: ${data.CopyObjectResult.LastModified} `);
            return callback();
        });
    });
};

function checkEventSource(event, callback) {
    if (!event.hasOwnProperty('Records')) { // Lambda Test
        console.log('value1 =', event.key1);
        console.log('value2 =', event.key2);
        console.log('value3 =', event.key3);

        const err = new Error('There is no event.Records. Terminates.')
        return callback(err);
    }

    const record = event.Records[0];

    if (!record.hasOwnProperty('eventSource')) { // Error
        const err = new Error('Event source property does not exist. This Lambda function Terminates.');
        return callback(err);
    }

    if (record.eventSource !== 'aws:s3') { // Event source not S3 exception
        const err = new Error('Event source is not AWS S3. This Lambda function Terminates.');
        return callback(err);
    }

    return callback(null, record);
}
