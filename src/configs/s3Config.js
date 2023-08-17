const { S3Client, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");

exports.getS3Client = () => {
  const clientConfig = {
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
  };

  const s3Client = new S3Client(clientConfig);

  return s3Client;
};

exports.getListObjectsCommand = (bucketName, prefix, delimiter) => {
  const listObjectsCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    Delimiter: delimiter || "/",
  });

  return listObjectsCommand;
};

exports.getPutObjectCommand = (bucketName, key, body, contentType = "image/png") => {
  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  return putObjectCommand;
};
