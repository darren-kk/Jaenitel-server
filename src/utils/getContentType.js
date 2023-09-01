function getContentType(fileName) {
  const contentTypeMapping = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    bmp: "image/bmp",
    tiff: "image/tiff",
    webp: "image/webp",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    wmv: "video/x-ms-wmv",
  };

  const extension = fileName.split(".").pop().toLowerCase();
  const contentType = contentTypeMapping[extension];

  return { contentType, extension: `.${extension}` };
}

module.exports = getContentType;
