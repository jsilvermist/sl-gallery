import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import fullscreen from '@jsilvermist/fullscreen-api';
import { TouchMixin } from './mixins/touch.js';
import { ZoomMixin } from './mixins/zoom.js';
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
          position: absolute;
          top: 0;
          width: 100vw;
          height: 100vh;
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

    // Bind handlers to `this` to allow easy listener removal
    this.calculateImageOffsets = this.calculateImageOffsets.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    // Set host attributes
    this._ensureAttribute('tabindex', 0);

    // Handle key presses
    this.addEventListener('keydown', this._handleKeydown);

    // Recalculate offsets for iron-images on resize
    window.addEventListener('resize', this.calculateImageOffsets);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up event listeners on disconnect
    this.removeEventListener('keydown', this._handleKeydown);
    window.removeEventListener('resize', this.calculateImageOffsets);
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

      // Get offsets for transitioning images
      this.calculateImageOffsets();
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
    if (this.activeImage.hasPreviousImage && !this._transitioning) {
      this._transitioning = true;
      const transitionTime = 200;
      const image = this.$.image;
      const previousImage = this.$.previousImage;

      // Enable transitions
      image.style.transition = `transform ${transitionTime}ms`;
      previousImage.style.transition = `transform ${transitionTime}ms`;

      image.style.transform = 'translateX(100vw)';

      const offset = Math.abs(parseInt(this.$.previousImage.style.left));
      previousImage.style.transform = `translateX(${offset}px)`;

      // Reset after transition
      setTimeout(() => {
        // Disable transitions
        image.style.transition = '';
        previousImage.style.transition = '';
        window.location.hash =
          `/${this.gallery.prefix}/${this.activeImage.previousImage.index}`;
        image.style.transform = 'translateX(0)';
        previousImage.style.transform = 'translateX(0px)';
        this._transitioning = false;
      }, transitionTime);
    }
  }

  _navigateToNextImage() {
    if (this.activeImage.hasNextImage && !this._transitioning) {
      this._transitioning = true;
      const transitionTime = 200;
      const image = this.$.image;
      const nextImage = this.$.nextImage;

      // Enable transitions
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
        this._transitioning = false;
      }, transitionTime);
    }
  }

  calculateImageOffsets() {
    console.log('calculateImageOffsets');
    if (!this.active || !this.activeImage) return;
    // [TODO]: Streamline offset code, remove redundant code

    // Get window viewport size
    const vw = Math.max(document.documentElement.clientWidth,
      window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight,
      window.innerHeight || 0);

    // Offset previous image just off the edge of the screen
    if (this.activeImage.previousImage) {
      const baseW = this.activeImage.previousImage.width;
      const baseH = this.activeImage.previousImage.height;
      if (!baseW || !baseH) {
        // [TODO]: Don't do this...
        setTimeout(() => this.calculateImageOffsets(), 100);
        return;
      }
      // [TODO]: Fix timing issue, async SlGalleryImage._getDimensions not ready by first run.
      const imageW = getContainImageSize(baseW, baseH, vw, vh).imageWidth;
      const offset = imageW + ((vw - imageW) / 2);
      console.log(baseW, baseH, imageW, offset);
      this.$.previousImage.style.left = `${-offset}px`;
    } else {
      this.$.previousImage.style.left = '-100vw';
    }

    // Offset next image just off the edge of the screen
    if (this.activeImage.nextImage) {
      const baseW = this.activeImage.nextImage.width;
      const baseH = this.activeImage.nextImage.height;
      if (!baseW || !baseH) {
        // [TODO]: Don't do this...
        setTimeout(() => this.calculateImageOffsets(), 100);
        return;
      }
      // [TODO]: Fix timing issue, async SlGalleryImage._getDimensions not ready by first run.
      const imageW = getContainImageSize(baseW, baseH, vw, vh).imageWidth;
      const offset = imageW + ((vw - imageW) / 2);
      this.$.nextImage.style.right = `${-offset}px`;
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
