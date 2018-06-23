import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import fullscreen from '@jsilvermist/fullscreen-api';

import '@polymer/iron-image/iron-image.js';
import '@polymer/paper-spinner/paper-spinner-lite.js';
import './sl-gallery-icons.js';
import './sl-gallery-slideshow-overlay.js';

class SLGallerySlideshow extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: flex;
          background: var(--sl-gallery-slideshow-background, rgba(0, 0, 0, 0.9));
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 100vw;
          z-index: 1;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          outline: none;
        }

        :host([hidden]) {
          display: none !important;
        }

        paper-spinner-lite {
          position: absolute;
          width: 42px;
          height: 42px;
          top: 50%;
          left: 50%;
          transform: translateX(-50%) translateY(-50%);
          z-index: 1;
          --paper-spinner-color: var(--sl-gallery-accent-color, #00AEC5);
          --paper-spinner-stroke-width: 4px;
        }

        .image-container iron-image {
          width: 100vw;
          height: 100vh;
          will-change: transform;
        }

        #previousImage {
          position: absolute;
          top: 0;
          left: -100vw;
        }

        #nextImage {
          position: absolute;
          top: 0;
          right: -100vw;
        }
      </style>

      <sl-gallery-slideshow-overlay
          id="overlay"
          active-image="[[activeImage]]"
          on-navigate-to-previous-image="_navigateToPreviousImage"
          on-navigate-to-next-image="_navigateToNextImage"
          on-reset-slideshow="_resetSlideshow"
          on-toggle-fullscreen="_toggleFullscreen">
      </sl-gallery-slideshow-overlay>

      <paper-spinner-lite
          active="[[_spinnerActive]]"
          hidden="[[!_spinnerActive]]">
      </paper-spinner-lite>

      <div class="image-container">
        <iron-image
            id="previousImage"
            src="[[_previousImage.src]]"
            alt=""
            preload
            fade
            sizing="contain"
            placeholder="[[_previousImage.small]]"
            on-loaded-changed="_handleAdjoiningImageLoaded"
            on-error-changed="_imageErrorChanged">
        </iron-image>
        <iron-image
            id="image"
            src="[[_viewImage.src]]"
            alt=""
            preload
            fade
            sizing="contain"
            placeholder="[[_viewImage.small]]"
            on-loaded-changed="_handleImageLoaded"
            on-error-changed="_imageErrorChanged">
        </iron-image>
        <iron-image
            id="nextImage"
            src="[[_nextImage.src]]"
            alt=""
            preload
            fade
            sizing="contain"
            placeholder="[[_nextImage.small]]"
            on-loaded-changed="_handleAdjoiningImageLoaded"
            on-error-changed="_imageErrorChanged">
        </iron-image>
      </div>
    `;
  }

  static get is() { return 'sl-gallery-slideshow'; }

  static get properties() {
    return {
      active: {
        type: Boolean,
        value: true,
        observer: '_activeChanged',
      },
      activeImage: {
        type: Object,
        observer: '_activeImageChanged',
      },
      _opened: {
        type: Boolean,
        value: false,
        observer: '_openedChanged',
      },
      _spinnerActive: Boolean,
      _viewImage: Object,
      _previousImage: Object,
      _nextImage: Object,
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

    this._zoom = {
      active: false,
      scale: 1,
      coordinates: {
        center: {
          x: null,
          y: null,
        },
        previous: {
          x: null,
          y: null,
        },
      },
    };

    // Bind handlers to `this` to allow easy listener removal
    this._handleKeydown = this._handleKeydown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    // Set host attributes
    this._ensureAttribute('tabindex', 0);

    // Handle key presses
    this.addEventListener('keydown', this._handleKeydown);

    // Handle touch
    this.addEventListener('touchstart', this.handleTouchStart);
    this.addEventListener('touchmove', this.handleTouchMove);
    this.addEventListener('touchend', this.handleTouchEnd);
    window.addEventListener('resize', this.touchOffsetHiddenImages.bind(this));

    // Handle zoom
    this.addEventListener('wheel', this.handleWheel);
    this.addEventListener('touchstart', this.handleZoomClickStart);
    this.addEventListener('mousedown', this.handleZoomClickStart);
    this.addEventListener('touchmove', this.handleZoomMove);
    this.addEventListener('mousemove', this.handleZoomMove);
    this.addEventListener('touchend', this.handleZoomEnd);
    this.addEventListener('mouseup', this.handleZoomEnd);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up event listeners on disconnect
    this.removeEventListener('keydown', this._handleKeydown);
  }

  _handleKeydown(event) {
    if (event.keyCode === 27) { // ESC

      if (!this._exitFullscreen()) {
        this._resetSlideshow();
      }

    } else if (event.keyCode === 37) { // LEFT

      event.preventDefault();
      this._navigateToPreviousImage();

    } else if (event.keyCode === 38) { // UP

      event.preventDefault();

    } else if (event.keyCode === 39) { // RIGHT

      event.preventDefault();
      this._navigateToNextImage();

    } else if (event.keyCode === 40) { // DOWN

      event.preventDefault();

    }
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

  handleWheel(event) {
    if (event.deltaY < 0) {
      // Handle scroll up
      if (this._zoom.scale < 3) {
        this._zoom.scale += 0.2;
        // Save for zoom move
        const { center } = this._zoom.coordinates;
        center.x = event.clientX;
        center.y = event.clientY;
        this.$.image.style.transformOrigin = `${event.clientX}px ${event.clientY}px`;
        this.$.image.style.transform = `scale(${this._zoom.scale})`;
      }
    } else {
      // Handle scroll down
      if (this._zoom.scale > 1) {
        this._zoom.scale -= 0.2;
        this.$.image.style.transform = `scale(${this._zoom.scale})`;
      }
    }

    if (this._zoom.scale === 1) {
      this._zoom.active = false;
      this.style.cursor = 'unset';
    } else {
      this._zoom.active = true;
      this.style.cursor = 'grab';
    }
  }

  handleZoomClickStart(event) {
    if (this._zoom.active) {
      // [TODO]: Prevent navigation and toolbar toggling
      const { previous } = this._zoom.coordinates;
      if (event.touches && event.touches[0]) {
        previous.x = event.touches[0].clientX;
        previous.y = event.touches[0].clientY;
      } else {
        previous.x = event.clientX;
        previous.y = event.clientY;
      }
    }
  }

  handleZoomMove(event) {
    if (this._zoom.active) {
      event.preventDefault();
      const { center, previous } = this._zoom.coordinates;
      let x, y;
      if (event.touches && event.touches[0]) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      } else {
        if (event.buttons !== 1) return;
        x = event.clientX;
        y = event.clientY;
      }

      const xDiff = previous.x - x;
      const yDiff = previous.y - y;

      previous.x = x;
      previous.y = y;

      center.x += xDiff;
      center.y += yDiff;

      this.$.image.style.transformOrigin = `${center.x}px ${center.y}px`;
    }
  }

  handleZoomEnd(event) {
    // [TODO]: Re-enable navigation and toolbar toggling
  }

  _activeImageChanged(activeImage) {
    // Update view images and elements
    this._updateView(this.active, activeImage);
  }

  _activeChanged(active) {
    // Update view images and elements
    this._updateView(active, this.activeImage);
  }

  _openedChanged(opened) {
    if (opened) {
      document.body.style.overflow = 'hidden';
      this.hidden = false;
      this.focus();
    } else {
      document.body.style.overflow = '';
      this.hidden = true;
      this.blur();
    }
  }

  _updateView(active, activeImage) {
    if (active && activeImage) {
      // Open slideshow
      this._opened = true;

      // Display spinner if image hasn't been loaded
      this._spinnerActive = !this.activeImage.loaded;

      // Update images in iron-image view elements
      this._viewImage = this.activeImage;
    } else {
      // Close if not active, or if activeImage is undefined
      this._opened = false;
    }
  }

  _resetSlideshow() {
    this.gallery._resetRoute();

    this._exitFullscreen();

    this._viewImage = undefined;
    this._previousImage = undefined;
    this._nextImage = undefined;

    this._spinnerActive = false;

    this.$.overlay.toolbarVisible = true;
  }

  _preloadImage(image) {
    if (!image.loaded) {
      const imgNode = new Image();
      imgNode.src = image.src;
      imgNode.onload = function() {
        image.reference = this;
        image.loaded = true;
      }
    }
  }

  _handleImageLoaded(event) {
    if (event.detail.value) { // loaded
      // Image loaded, disable spinner
      this._spinnerActive = false;

      // activeImage could be undefined if the image takes too long to load
      if (this.activeImage) {
        // Load adjoining images
        this._previousImage = this.activeImage.previousImage;
        this._nextImage = this.activeImage.nextImage;

        // If this is the image's first time loading,
        // save a reference of the image to keep it cached
        if (!this.activeImage.loaded) {
          this.activeImage.reference =
            this.$.image.shadowRoot.querySelector('img');
          this.activeImage.loaded = true;
        }
      }
    }
  }

  _handleAdjoiningImageLoaded(event) {
    if (event.detail.value) { // loaded
      // Get the image element id to differentiate previous/next
      const id = event.target.id;

      // activeImage could be undefined if the image takes too long to load
      if (this.activeImage) {
        if (!this.activeImage[id].loaded) {
          this.activeImage[id].reference = this.$[id].shadowRoot.querySelector('img');
          this.activeImage[id].loaded = true;
        }
      }
    }
  }

  _imageErrorChanged(event) {
    if (event.detail.value) { // error exists
      // Dispatch event upon error while loading an image
      this.gallery.dispatchEvent(new CustomEvent('error', {
        detail: {
          error: 'Error loading image...',
          src: event.target.src,
        },
      }));
    }
  }

  _navigateToPreviousImage() {
    if (this.activeImage.hasPreviousImage) {
      const image = this.$.image;
      const previousImage = this.$.previousImage;
      const transitionTime = 200;

      image.style.transition = `transform ${transitionTime}ms`;
      previousImage.style.transition = `transform ${transitionTime}ms`;
      image.style.transform = 'translateX(100vw)';

      const offset = Math.abs(parseInt(this.$.previousImage.style.left));
      previousImage.style.transform = `translateX(${offset}px)`;

      // Reset after transition
      setTimeout(() => {
        image.style.transition = 'unset';
        previousImage.style.transition = 'unset';
        window.location.hash =
          `/${this.gallery.prefix}/${this.activeImage.previousImage.index}`;
        image.style.transform = 'translateX(0)';
        previousImage.style.transform = 'translateX(0px)';
      }, transitionTime);
    }
  }

  _navigateToNextImage() {
    if (this.activeImage.hasNextImage) {
      const image = this.$.image;
      const nextImage = this.$.nextImage;
      const transitionTime = 200;

      image.style.transition = `transform ${transitionTime}ms`;
      nextImage.style.transition = `transform ${transitionTime}ms`;
      image.style.transform = 'translateX(-100vw)';

      const offset = Math.abs(parseInt(this.$.nextImage.style.right));
      nextImage.style.transform = `translateX(${-offset}px)`;

      // Reset after transition
      setTimeout(() => {
        image.style.transition = 'unset';
        nextImage.style.transition = 'unset';
        window.location.hash =
          `/${this.gallery.prefix}/${this.activeImage.nextImage.index}`;
        image.style.transform = 'translateX(0)';
        nextImage.style.transform = 'translateX(0px)';
      }, transitionTime);
    }
  }

  _toggleFullscreen() {
    if (fullscreen.enabled) {
      if (!fullscreen.element && !this.hidden) {
        fullscreen.request(this);
      } else {
        this._exitFullscreen();
      }
    }
  }

  _exitFullscreen() {
    if (fullscreen.enabled && fullscreen.element) {
      fullscreen.exit();
      return true;
    }
    return false;
  }
}

window.customElements.define(SLGallerySlideshow.is, SLGallerySlideshow);
