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
            id="image"
            src="[[_imageSrc]]"
            alt=""
            preload
            fade
            sizing="contain"
            placeholder="[[_imageSmall]]"
            loaded="{{_imageLoaded}}"
            error="{{_imageError}}">
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
      activeImage: Object,
      _imageError: String,
      _imageLoaded: Boolean,
      _imageSrc: String,
      _imageSmall: String,
      _opened: {
        type: Boolean,
        value: false,
        observer: '_openedChanged',
      },
      _spinnerActive: Boolean,
    };
  }

  static get observers() {
    return [
      '_activeImageIndexChanged(activeImage.index)',
      '_imageLoadedChanged(_imageLoaded)',
      '_imageErrorChanged(_imageError)',
    ];
  }

  constructor() {
    super();

    // Bind handlers to `this` to allow easy listener removal
    this._handleKeydown = this._handleKeydown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    // Set host attributes
    this._ensureAttribute('tabindex', 0);

    // Handle key presses
    this.addEventListener('keydown', this._handleKeydown);
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

  _activeImageIndexChanged(index) {
    // Exit if not active, or if index is undefined
    if (!this.active || index === undefined) {
      this._opened = false;
      return;
    }

    // Open slideshow
    this._opened = true;

    // Update slideshow image, overlay, and buttons
    this._updateView();
  }

  _updateView() {
    // Load the image in iron-image
    this._imageSmall = this.activeImage.small;
    this._imageSrc = this.activeImage.src;

    // Display spinner if image hasn't been loaded
    this._spinnerActive = !this.activeImage.loaded;
  }

  _resetSlideshow() {
    this.gallery._resetRoute();

    this._exitFullscreen();

    this._imageSmall = '';
    this._imageSrc = '';

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

  _preloadAdjoiningImages() {
    // Preload previous image if not loaded
    if (this.activeImage.hasPreviousImage) {
      this._preloadImage(this.activeImage.previousImage);
    }

    // Preload next image if not loaded
    if (this.activeImage.hasNextImage) {
      this._preloadImage(this.activeImage.nextImage);
    }
  }

  _imageLoadedChanged(loaded) {
    if (loaded) {
      this._spinnerActive = false;

      // activeImage could be undefined if the image takes too long to load
      if (this.activeImage) {
        if (!this.activeImage.loaded) {
          this.activeImage.reference = this.$.image.shadowRoot.querySelector('img');
          this.activeImage.loaded = true;
        }
        this._preloadAdjoiningImages();
      }
    }
  }

  _imageErrorChanged(error) {
    if (error) {
      // Dispatch event upon error while loading an image
      this.gallery.dispatchEvent(new CustomEvent('error', {
        detail: { error: 'Error loading image...' },
      }));
    }
  }

  _navigateToPreviousImage() {
    if (this.activeImage.hasPreviousImage) {
      window.location.hash =
        `/${this.gallery.prefix}/${this.activeImage.previousImage.index}`;
    }
  }

  _navigateToNextImage() {
    if (this.activeImage.hasNextImage) {
      window.location.hash =
        `/${this.gallery.prefix}/${this.activeImage.nextImage.index}`;
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

  _activeChanged(active) {
    if (active && this.activeImage && this.activeImage.index !== undefined) {
      this._opened = true;
      this._updateView();
    } else {
      this._opened = false;
    }
  }
}

window.customElements.define(SLGallerySlideshow.is, SLGallerySlideshow);
