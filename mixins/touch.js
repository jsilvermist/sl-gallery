/**
 * Touch swiping
 * @polymer
 * @mixinFunction
 */
export const TouchMixin = (superclass) => class extends superclass {

  static get properties() {
    return {
      _touch: Object,
    };
  }

  constructor() {
    super();

    this._touch = {
      coordinates: {
        start: {
          x: null,
          y: null,
        },
        move: {
          x: null,
          y: null,
        },
      },
      startTime: null,
    };
  }

  connectedCallback() {
    super.connectedCallback();

    // Handle touch
    this.addEventListener('touchstart', this.handleTouchStart);
    this.addEventListener('touchmove', this.handleTouchMove);
    this.addEventListener('touchend', this.handleTouchEnd);
    window.addEventListener('resize', this.touchOffsetHiddenImages.bind(this));
  }

  handleTouchStart(event) {
    // Return if zooming
    if (this._zoom.active) return;

    const { start } = this._touch.coordinates;
    start.x = event.touches[0].clientX;
    start.y = event.touches[0].clientY;

    this.touchOffsetHiddenImages();

    this._touch.startTime = performance.now();
  }

  handleTouchMove(event) {
    // Return if zooming
    if (this._zoom.active) return;

    event.preventDefault();

    const { start, move } = this._touch.coordinates;
    if (!start.x || !start.y) return;
    move.x = event.touches[0].clientX;
    move.y = event.touches[0].clientY;

    const xDiff = start.x - move.x;
    const yDiff = start.y - move.y;

    // Scale expiramenting
    const scaleInt = 1 + Math.floor(Math.abs(xDiff) / 1000);
    const scaleDec = this.helperPadString(Math.abs(xDiff).toString().slice(-3), 3);

    // Movement is larger along the X axis than Y axis
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff >= 0) {
        // Left swipe
        if (this.activeImage.nextImage) {
          this.$.nextImage.style.transform = `translateX(${-xDiff}px)`;
          this.$.image.style.transform = `translateX(${-xDiff}px)`;
        } else {
          this.$.image.style.transform = `translateX(0px) scale(${scaleInt}.${scaleDec})`;
          this.$.image.style.transformOrigin = `${start.x}px ${start.y}px`;
        }
        this.$.previousImage.style.transform = `translateX(0px)`;
      } else {
        // Right swipe
        if (this.activeImage.previousImage) {
          this.$.previousImage.style.transform = `translateX(${-xDiff}px)`;
          this.$.image.style.transform = `translateX(${-xDiff}px)`;
        } else {
          this.$.image.style.transform = `translateX(0px) scale(${scaleInt}.${scaleDec})`;
          this.$.image.style.transformOrigin = `${start.x}px ${start.y}px`;
        }
        this.$.nextImage.style.transform = `translateX(0px)`;
      }
    }
  }

  handleTouchEnd() {
    // Return if zooming
    if (this._zoom.active) return;

    const { start, move } = this._touch.coordinates;
    if (!move.x || !move.y) return;

    // Get the duration of the touch and coordinates
    const touchDuration = performance.now() - this._touch.startTime;

    // Get diff from comparing start against final movement
    const xDiff = start.x - move.x;

    // Get window size
    const w = Math.max(document.documentElement.clientWidth,
      window.innerWidth || 0);

    // Differentiate swipes from drags
    const minSwipeDistance = Math.min(Math.max(w / 6, 50), 250);
    const isSwipe = Math.abs(xDiff) > touchDuration * 0.65;

    const imageElements = [
      this.$.image,
      this.$.previousImage,
      this.$.nextImage
    ];

    // If you pass a certain distance or velocity and distance...
    if (this.activeImage.nextImage &&
        (xDiff > w / 4 || (xDiff > minSwipeDistance && isSwipe))) {
      // [TODO]: Transition to next image fast but smoothly
      this._navigateToNextImage();
    } else if (this.activeImage.previousImage &&
        (xDiff < -(w / 4) || (xDiff < -minSwipeDistance && isSwipe))) {
      // [TODO]: Transition to previous image fast but smoothly
      this._navigateToPreviousImage();
    } else {
      // Reset transforms
      imageElements.forEach((image) => {
        const transitionTime = 150;
        image.style.transition = `transform ${transitionTime}ms`;
        image.style.transform = 'translateX(0)';
        setTimeout(() => {
          image.style.transition = 'unset';
        }, transitionTime);
      });
    }

    // Reset coordinates
    move.x = null;
    move.y = null;
  };

  touchOffsetHiddenImages() {
    if (!this.activeImage) return;

    // Get window size
    const w = Math.max(document.documentElement.clientWidth,
      window.innerWidth || 0);
    const h = Math.max(document.documentElement.clientHeight,
      window.innerHeight || 0);

    // Offset previous image just off the edge of the screen
    if (this.activeImage.previousImage) {
      const dataW = this.activeImage.previousImage.width;
      const dataH = this.activeImage.previousImage.height;
      const realW = this.touchGetContainImageSize(dataW, dataH, w, h).imageWidth;
      const offset = realW + ((w - realW) / 2);
      this.$.previousImage.style.left = `${-offset}px`;
    } else {
      this.$.previousImage.style.left = '-100vw';
    }

    // Offset next image just off the edge of the screen
    if (this.activeImage.nextImage) {
      const dataW = this.activeImage.nextImage.width;
      const dataH = this.activeImage.nextImage.height;
      const realW = this.touchGetContainImageSize(dataW, dataH, w, h).imageWidth;
      const offset = realW + ((w - realW) / 2);
      this.$.nextImage.style.right = `${-offset}px`;
    } else {
      this.$.nextImage.style.right = '-100vw';
    }
  }

  touchGetContainImageSize(imageWidth, imageHeight, areaWidth, areaHeight) {
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

  helperPadString(num, size) {
    const str = num.toString();
    const zeros = size - str.length;
    return '0'.repeat(zeros > 0 ? zeros : 0) + str;
  }

}
