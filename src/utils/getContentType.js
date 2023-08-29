function getContentType(fileName) {
  const extension = fileName.split(".").pop().toLowerCase();

  switch (extension) {
    case "png":
      return { contentType: "image/png", extension: ".png" };
    case "jpg":
    case "jpeg":
      return { contentType: "image/jpeg", extension: ".jpg" };
    case "mp4":
      return { contentType: "video/mp4", extension: ".mp4" };

    default:
      return null;
  }
}

module.exports = getContentType;
