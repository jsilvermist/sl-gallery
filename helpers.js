// [TODO]: Unused, created for pinch to zoom
export function getDifferenceOfCoordinates(x1, y1, x2, y2) {
  const x = x1 - x2;
  const y = y1 - y2;
  return Math.sqrt(x*x + y*y);
}

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
  return { width: imageWidth, height: imageHeight };
}

// [TODO]: Unused, use or remove
export function zeroPad(num, size) {
  const str = num.toString();
  const zeros = size - str.length;
  return '0'.repeat(zeros > 0 ? zeros : 0) + str;
}
