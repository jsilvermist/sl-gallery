import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import fullscreen from '@jsilvermist/fullscreen-api';

import { TouchMixin } from './touch-mixin.js';
import { ZoomMixin } from './zoom-mixin.js';
import { getContainImageSize } from './helpers.js';

import '@polymer/iron-image/iron-image.js';
import '@polymer/paper-spinner/paper-spinner-lite.js';
import './sl-gallery-icons.js';
import './sl-gallery-slideshow-overlay.js';

class SLGallerySlideshow extends TouchMixin(ZoomMixin(PolymerElement)) {
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

        :host([zoom-active]) {
          cursor: move;
          cursor: -webkit-grab;
          cursor: grab;
        }

        :host([zoom-clicked]) {
          cursor: -webkit-grabbing !important;
          cursor: grabbing !important;
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

        .image-container {
          height: 100%;
        }

        .image-container iron-image {
          position: absolute;
          top: 0;
          width: 100vw;
          height: 100%;
          transform-origin: center;
          will-change: transform;
        }

        #image {
          left: 0;
          right: 0;
        }

        #previousImage {
          left: -100vw;
        }

        #nextImage {
          right: -100vw;
        }
      </style>

      <sl-gallery-slideshow-overlay
          id="overlay"
          active-image="[[activeImage]]"
          zoom-active="[[zoomActive]]"
          on-navigate-to-previous-image="_navigateToPreviousImage"
          on-navigate-to-next-image="_navigateToNextImage"
          on-zoom-in="_handleZoomIn"
          on-zoom-out="_handleZoomOut"
          on-reset-zoom="_resetZoom"
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
            src="[[_currentImage.src]]"
            alt=""
            preload
            fade
            sizing="contain"
            placeholder="[[_currentImage.small]]"
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
      transitionTime: {
        type: Number,
        value: 150,
      },
      _opened: {
        type: Boolean,
        value: false,
        observer: '_openedChanged',
      },
      _spinnerActive: Boolean,
      _currentImage: Object,
      _previousImage: Object,
      _nextImage: Object,
      _dimensions: {
        type: Object,
        value: () => new Object(),
      },
    };
  }

  static get observers() {
    return [
      '_dimensionsPreviousChanged(_dimensions.previous)',
      '_dimensionsNextChanged(_dimensions.next)',
    ];
  }

  constructor() {
    super();

    // Bind handlers to `this` to allow easy listener removal
    this._handleResize = this._handleResize.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    // Set host attributes
    this._ensureAttribute('tabindex', 0);

    // Handle key presses
    this.addEventListener('keydown', this._handleKeydown);

    // Recalculate dimensions for iron-images on resize
    window.addEventListener('resize', this._handleResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up event listeners on disconnect
    this.removeEventListener('keydown', this._handleKeydown);
    window.removeEventListener('resize', this._handleResize);
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

  _handleResize() {
    // Update dimensions on resize
    this._updateSlideshowDimensions();
    this._updateImageDimensions();
  }

  _activeImageChanged(activeImage) {
    // Update view images and elements
    this._updateView(this.active, activeImage);
  }

  _activeChanged(active) {
    if (active) {
      // Update in case of resize while inactive
      this._updateSlideshowDimensions();
    }

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

      // Reset and deactivate zoom
      this._resetZoom();

      // Display spinner if image hasn't been loaded
      this._spinnerActive = !this.activeImage.loaded;

      // Update images in iron-image view elements
      this._currentImage = this.activeImage;

      // Reset transforms to snap new image into place
      this.$.image.style.transform = '';
      this.$.previousImage.style.transform = '';
      this.$.nextImage.style.transform = '';

      // Unlock navigation
      this._transitioning = false;

      // Get dimensions for transitioning images
      this._updateImageDimensions();
    } else {
      // Close if not active, or if activeImage is undefined
      this._opened = false;
    }
  }

  _resetSlideshow() {
    this.gallery._resetRoute();

    this._exitFullscreen();

    this._currentImage = undefined;
    this._previousImage = undefined;
    this._nextImage = undefined;

    this._spinnerActive = false;

    this.$.overlay.toolbarVisible = true;
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
      if (this.activeImage && this.activeImage[id]) {
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
    if (this.activeImage.hasPreviousImage && !this._transitioning) {
      this._transitioning = true;
      this._transitionToNewImage({
        dimensions: this._dimensions.previous,
        index: this.activeImage.previousImage.index,
        newImage: this.$.previousImage,
        negative: false,
      });
    }
  }

  _navigateToNextImage() {
    if (this.activeImage.hasNextImage && !this._transitioning) {
      this._transitioning = true;
      this._transitionToNewImage({
        dimensions: this._dimensions.next,
        index: this.activeImage.nextImage.index,
        newImage: this.$.nextImage,
        negative: true,
      });
    }
  }

  _transitionToNewImage({dimensions, index, newImage, negative}) {
    if (dimensions && this._dimensions.current) {
      // Get offsets for image transitions
      const offsets = new Object();
      offsets.new = dimensions.width + dimensions.offsetWidth;
      offsets.current =
        this._dimensions.current.width + this._dimensions.current.offsetWidth;
      if (negative) {
        offsets.new = -offsets.new;
        offsets.current = -offsets.current;
      }

      // Enable transitions
      newImage.style.transition = `transform ${this.transitionTime}ms`;
      this.$.image.style.transition = `transform ${this.transitionTime}ms`;

      // Animate transition
      newImage.style.transform = `translateX(${offsets.new}px)`;
      this.$.image.style.transform = `translateX(${offsets.current}px)`;
    }

    // Reset after transition
    setTimeout(() => {
      // Disable transitions
      newImage.style.transition = '';
      this.$.image.style.transition = '';

      // Update hash and change image to new image
      window.location.hash = `/${this.gallery.prefix}/${index}`;
    }, this.transitionTime);
  }

  _updateSlideshowDimensions() {
    if (this.active) {
      // Get window viewport size
      const vw = Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0);

      // Save screen size to slideshow
      this.set('_dimensions.screen', {
        width: vw,
        height: vh,
      });

      // Ensure slideshow resizes with address bar on mobile
      this.style.height = `${vh}px`;

      // [TODO]: Is this a good idea?
      // [TODO]: Fix for new zoom system, preferably recenter image transform
      // based on old -> new screen size
      if (this.zoomActive) {
        this._updateZoomTransform(vw / 2, vh / 2);
      }
    }
  }

  _updateImageDimensions() {
    if (this.active && this.activeImage) {
      // Get all active view image dimensions
      this._getImageDimensions(this.activeImage)
        .then((dimensions) => this.set('_dimensions.current', dimensions));

      this._getImageDimensions(this.activeImage.previousImage)
        .then((dimensions) => this.set('_dimensions.previous', dimensions));

      this._getImageDimensions(this.activeImage.nextImage)
        .then((dimensions) => this.set('_dimensions.next', dimensions));
    }
  }

  _getImageDimensions(image) {
    return new Promise((resolve, reject) => {
      if (!image) {
        resolve(undefined);
        return;
      }

      this._getBaseImageSize(image)
        .then((base) => {
          // Get window viewport size
          const vw = Math.max(document.documentElement.clientWidth,
            window.innerWidth || 0);
          const vh = Math.max(document.documentElement.clientHeight,
            window.innerHeight || 0);

          // Get size of contain styled image in view
          const size = getContainImageSize(base.width, base.height, vw, vh);

          resolve({
            offsetWidth: (vw - size.width) / 2,
            offsetHeight: (vh - size.height) / 2,
            ...size,
          });
        });
    });
  }

  _getBaseImageSize(image) {
    return new Promise((resolve, reject) => {
      if (!image.width || !image.height) {
        image.addEventListener('dimensions-changed', () => {
          resolve({
            width: image.width,
            height: image.height,
          });
        }, { once: true });
      } else {
        resolve({
          width: image.width,
          height: image.height,
        });
      }
    });
  }

  _dimensionsPreviousChanged(previous) {
    if (previous) {
      // offsetWidth previous image just off the edge of the screen
      const offsetWidth = previous.width + previous.offsetWidth;
      this.$.previousImage.style.left = `${-offsetWidth}px`;
    } else {
      this.$.previousImage.style.left = '-100vw';
    }
  }

  _dimensionsNextChanged(next) {
    if (next) {
      // offsetWidth next image just off the edge of the screen
      const offsetWidth = next.width + next.offsetWidth;
      this.$.nextImage.style.right = `${-offsetWidth}px`;
    } else {
      this.$.nextImage.style.right = '-100vw';
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
