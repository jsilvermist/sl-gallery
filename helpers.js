export function getContainImageSize(imageWidth, imageHeight, areaWidth, areaHeight) {
  const imageRatio = imageWidth / imageHeight;
  if (imageRatio >= 1) {
    // Landscape
    imageWidth = areaWidth;
    imageHeight = imageWidth / imageRatio;
    if (imageHeight > areaHeight) {
      imageHeight = areaHeight;
      imageWidth = areaHeight * imageRatio;
    }
  } else {
    // Portrait
    imageHeight = areaHeight;
    imageWidth = imageHeight * imageRatio;
    if (imageWidth > areaWidth) {
      imageWidth = areaWidth;
      imageHeight = areaWidth / imageRatio;
    }
  }
  return { imageWidth, imageHeight };
}

export function zeroPad(num, size) {
  const str = num.toString();
  const zeros = size - str.length;
  return '0'.repeat(zeros > 0 ? zeros : 0) + str;
}
