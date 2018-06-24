import { zeroPad } from './helpers.js';

/**
 * Slideshow touch and swipe handling
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
      moving: false,
      startTime: null,
    };
  }

  connectedCallback() {
    super.connectedCallback();

    // Handle touch
    this.addEventListener('touchstart', this.handleTouchStart);
    this.addEventListener('touchmove', this.handleTouchMove);
    this.addEventListener('touchend', this.handleTouchEnd);
  }

  handleTouchStart(event) {
    // Return if zooming
    if (this.zoomActive) return;

    const { start } = this._touch.coordinates;
    start.x = event.touches[0].clientX;
    start.y = event.touches[0].clientY;

    this._touch.startTime = performance.now();
  }

  handleTouchMove(event) {
    // Return if zooming
    if (this.zoomActive) return;

    event.preventDefault();

    this._touch.moving = true;

    const { start, move } = this._touch.coordinates;
    if (!start.x || !start.y) return;
    move.x = event.touches[0].clientX;
    move.y = event.touches[0].clientY;

    const xDiff = start.x - move.x;
    const yDiff = start.y - move.y;

    // Scale expiramenting
    const scaleInt = 1 + Math.floor(Math.abs(xDiff) / 1000);
    const scaleDec = zeroPad(Math.abs(xDiff).toString().slice(-3), 3);

    // Movement is larger along the X axis than Y axis
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff >= 0) {
        // Left swipe
        if (this.activeImage.nextImage) {
          this.$.nextImage.style.transform = `translateX(${-xDiff}px)`;
          this.$.image.style.transform = `translateX(${-xDiff}px)`;
        } else {
          this.$.image.style.transform = `scale(${scaleInt}.${scaleDec})`;
          this.$.image.style.transformOrigin = `${start.x}px ${start.y}px`;
        }
        this.$.previousImage.style.transform = '';
      } else {
        // Right swipe
        if (this.activeImage.previousImage) {
          this.$.previousImage.style.transform = `translateX(${-xDiff}px)`;
          this.$.image.style.transform = `translateX(${-xDiff}px)`;
        } else {
          this.$.image.style.transform = `scale(${scaleInt}.${scaleDec})`;
          this.$.image.style.transformOrigin = `${start.x}px ${start.y}px`;
        }
        this.$.nextImage.style.transform = '';
      }
    }
  }

  handleTouchEnd() {
    // Return if zooming
    if (this.zoomActive || !this._touch.moving) return;

    const { start, move } = this._touch.coordinates;
    if (!move.x || !move.y) return;

    // Get the duration of the touch and coordinates
    const touchDuration = performance.now() - this._touch.startTime;

    // Get diff from comparing start against final movement
    const xDiff = start.x - move.x;

    // Get viewport width
    const vw = Math.max(document.documentElement.clientWidth,
      window.innerWidth || 0);

    // Differentiate swipes from drags
    const minSwipeDistance = Math.min(Math.max(vw / 6, 50), 250);
    const isSwipe = Math.abs(xDiff) > touchDuration * 0.65;

    // If you pass a certain distance or velocity and distance...
    if (this.activeImage.nextImage &&
        (xDiff > vw / 4 || (xDiff > minSwipeDistance && isSwipe))) {
      // Navigate to next image
      this._navigateToNextImage();
    } else if (this.activeImage.previousImage &&
        (xDiff < -(vw / 4) || (xDiff < -minSwipeDistance && isSwipe))) {
      // Navigate to previous image
      this._navigateToPreviousImage();
    } else {
      // Reset transforms
      const imageElements = [
        this.$.image,
        this.$.previousImage,
        this.$.nextImage
      ];
      imageElements.forEach((image) => {
        image.style.transition = `transform ${this.transitionTime}ms`;
        image.style.transform = '';
        setTimeout(() => {
          image.style.transition = '';
        }, this.transitionTime);
      });
    }

    // Reset properties
    this._touch.moving = false;
    move.x = null;
    move.y = null;
  }

}
