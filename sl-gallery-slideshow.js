import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import fullscreen from '@jsilvermist/fullscreen-api';

import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/iron-image/iron-image.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-spinner/paper-spinner-lite.js';
import './sl-gallery-icons.js';

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

      .image-container {
        display: block;
      }

      .image-container iron-image {
        width: 100vw;
        height: 100vh;
      }

      /* Overlay Animations */

      #overlay app-toolbar,
      #overlay #clickBlocks > div,
      paper-icon-button#closeSlideshow {
        will-change: transform, opacity;
        transition: top 0.35s ease, bottom 0.35s ease, right 0.35s ease,
                    opacity 0.35s ease, visibility 0.35s ease;
      }

      /* Overlay Toolbar */

      #overlay app-toolbar {
        z-index: 2;
        position: fixed;
        left: 0;
        right: 0;
        background-color: rgba(0, 0, 0, 0.65);
        color: white;
      }

      #overlay app-toolbar.header {
        top: -64px;
        height: 64px;
        visibility: hidden;
      }

      #overlay app-toolbar.footer {
        height: auto;
        min-height: 64px;
        bottom: -64px;
        opacity: 0;
        visibility: hidden;
        text-align: center;
        --app-toolbar-font-size: 14px;
        color: #ddd;
      }

      #overlay[toolbar-visible] app-toolbar.header {
        top: 0;
        visibility: visible;
      }

      #overlay[toolbar-visible] app-toolbar.footer[has-caption] {
        bottom: 0;
        opacity: 1;
        visibility: visible;
      }

      /* Overlay Buttons */

      /* @media (hover: hover) in CSS4 */
      #overlay[hover-enabled] paper-icon-button:hover {
        background: rgba(99, 99, 99, 0.3);
        border: 1px solid rgba(88, 88, 88, 0.66);
      }

      #overlay[hover-enabled] paper-icon-button:active {
        background: rgba(0, 0, 0, 0.3);
        border: 0;
      }

      #overlay > paper-icon-button,
      #overlay :not(app-toolbar) paper-icon-button {
        color: #fff;
        z-index: 2;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.3);
        width: 48px;
        height: 48px;
      }

      #overlay paper-icon-button#closeSlideshow {
        position: absolute;
        top: 8px;
        right: 8px;
        visibility: visible;
      }

      #overlay[toolbar-visible] paper-icon-button#closeSlideshow {
        /* top: -48px; */
        right: -48px;
        visibility: hidden;
      }

      #clickBlocks #previousImageBlock paper-icon-button {
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
      }

      #clickBlocks #nextImageBlock paper-icon-button {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
      }

      /* Overlay Click Blocks */

      #overlay #clickBlocks > div {
        z-index: 1;
        position: fixed;
        top: 0;
        bottom: 0;
      }

      /* Shrink clickable regions if touch conflicts occur */
      /* #overlay[toolbar-visible] #clickBlocks > div {
        top: 64px;
        bottom: 64px;
      } */

      #clickBlocks > div#toggleToolbar {
        left: 30%;
        right: 30%;
        width: 40%;
      }

      #clickBlocks > div#previousImageBlock {
        left: 0;
        width: 30%;
      }

      #clickBlocks > div#nextImageBlock {
        right: 0;
        width: 30%;
      }

      @media (max-width: 600px) {
        #clickBlocks paper-icon-button {
          width: 40px;
          height: 40px;
        }

        paper-icon-button#closeSlideshow {
          top: 5px;
          right: 5px;
        }

        #clickBlocks #previousImageBlock paper-icon-button {
          left: 5px;
        }

        #clickBlocks #nextImageBlock paper-icon-button {
          right: 5px;
        }
      }
    </style>

    <div id="overlay" toolbar-visible\$="[[_toolbarVisible]]" hover-enabled\$="[[!_isTouch]]">
      <app-toolbar class="header">
        <div main-title="">[[activeImage.title]]</div>
        <paper-icon-button
            id="toggleFullscreen"
            icon="sl-gallery:fullscreen"
            on-click="_toggleFullscreen">
        </paper-icon-button>
        <paper-icon-button
            id="toolbarCloseSlideshow"
            icon="sl-gallery:close"
            on-click="_closeSlideshow">
        </paper-icon-button>
      </app-toolbar>

      <app-toolbar class="footer" has-caption\$="[[activeImage._hasCaption]]">
        <div main-title="">[[activeImage.caption]]</div>
      </app-toolbar>

      <paper-icon-button
          id="closeSlideshow"
          icon="sl-gallery:close"
          on-click="_closeSlideshow">
      </paper-icon-button>

      <div id="clickBlocks">
        <div id="toggleToolbar" on-click="_toggleToolbar"></div>
        <div id="previousImageBlock" on-click="_previousImage">
          <paper-icon-button icon="sl-gallery:chevron-left"></paper-icon-button>
        </div>
        <div id="nextImageBlock" on-click="_nextImage">
          <paper-icon-button icon="sl-gallery:chevron-right"></paper-icon-button>
        </div>
      </div>
    </div>

    <paper-spinner-lite
        active="[[_spinnerActive]]"
        hidden="[[!_spinnerActive]]">
    </paper-spinner-lite>

    <div class="image-container">
      <iron-image
          id="image"
          src="[[_imageSrc]]"
          alt=""
          preload=""
          fade=""
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
      activeImage: {
        type: Object,
        value: function() {
          return {};
        }
      },
      opened: {
        type: Boolean,
        value: false,
        observer: '_openedChanged',
      },
      _imageError: String,
      _imageLoaded: Boolean,
      _imageSrc: String,
      _imageSmall: String,
      _isTouch: Boolean,
      _spinnerActive: Boolean,
      _toolbarVisible: Boolean,
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
    this._fullscreenChanged = this._fullscreenChanged.bind(this);
  }

  ready() {
    super.ready();

    // Set host attributes
    this._ensureAttribute('tabindex', 0);

    // Sets #overlay[hover-enabled]
    this._isTouch = ("ontouchstart" in window) &&
                   (window.navigator.maxTouchPoints > 0 ||
                    window.navigator.msMaxTouchPoints > 0);

    // Remove fullscreen button if not supported
    if (!fullscreen.enabled) {
      this.$.toggleFullscreen.parentNode.removeChild(this.$.toggleFullscreen);
    }
  }

  connectedCallback() {
    super.connectedCallback();

    // Handle key presses
    this.addEventListener('keydown', this._handleKeydown);

    // Listen for entering/exiting fullscreen
    fullscreen.addListener('change', this._fullscreenChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up event listeners on disconnect
    this.removeEventListener('keydown', this._handleKeydown);
    fullscreen.removeListener('change', this._fullscreenChanged);
  }

  _handleKeydown(event) {
    if (event.keyCode === 27) { // ESC

      if (!this._exitFullscreen()) {
        this._closeSlideshow();
      }

    } else if (event.keyCode === 37) { // LEFT

      event.preventDefault();
      this._previousImage();

    } else if (event.keyCode === 38) { // UP

      event.preventDefault();

    } else if (event.keyCode === 39) { // RIGHT

      event.preventDefault();
      this._nextImage();

    } else if (event.keyCode === 40) { // DOWN

      event.preventDefault();

    }
  }

  get hasPreviousImage() {
    return +this.activeImage.index > 0;
  }

  get hasNextImage() {
    return +this.activeImage.index < (this.gallery._images.length-1);
  }

  _activeImageIndexChanged(index) {
    // Exit if gallery not active, no images in gallery, or index is undefined
    if (!this.gallery.active || !this.gallery._routeActive ||
        !this.gallery._images || index === undefined) {
      return;
    }

    // If no valid image index set, reset image and close slideshow
    if (index === '' || isNaN(index) || index < 0 || index >= this.gallery._images.length) {
      this._closeSlideshow();
      return;
    }

    // Ensure slideshow is open in case of outdated bookmark or link to non-valid index.
    // [TODO]: Is this still needed?
    this.opened = true;

    // Load the image in iron-image
    this._imageSmall = this.activeImage.small;
    this._imageSrc = this.activeImage.src;

    // Display spinner if image hasn't been loaded
    this._spinnerActive = !this.activeImage.loaded;

    // Hide previous button if first image
    if (this.hasPreviousImage) {
      this.$.previousImageBlock.hidden = false;
    } else {
      this.$.previousImageBlock.hidden = true;
    }

    // Hide next button if last image
    if (this.hasNextImage) {
      this.$.nextImageBlock.hidden = false;
    } else {
      this.$.nextImageBlock.hidden = true;
    }
  }

  _preloadImage(image) {
    if (!image.loaded) {
      const imgNode = new Image();
      imgNode.src = image.src;
      imgNode.onload = function(event) {
        image.reference = this;
        image.loaded = true;
      }
    }
  }

  _imageLoadedChanged(loaded) {
    if (loaded) {
      const images = this.gallery._images;

      this._spinnerActive = false;

      if (!this.activeImage.loaded) {
        this.activeImage.reference = this.$.image.shadowRoot.querySelector('img');
        this.activeImage.loaded = true;
      }

      // Preload previous image if not loaded
      if (this.hasPreviousImage) {
        this._preloadImage(images[+this.activeImage.index-1]);
      }

      // Preload next image if not loaded
      if (this.hasNextImage) {
        this._preloadImage(images[+this.activeImage.index+1]);
      }
    }
  }

  _imageErrorChanged(error) {
    if (error) {
      // [TODO]: Implement listener, toast, or other messaging system
      window.dispatchEvent(new CustomEvent('notify', {detail: 'Error loading image...'}));
    }
  }

  _previousImage() {
    if (this.hasPreviousImage) {
      window.location.hash = `/${this.gallery.prefix}/${+this.activeImage.index-1}`;
    }
  }

  _nextImage() {
    if (this.hasNextImage) {
      window.location.hash = `/${this.gallery.prefix}/${+this.activeImage.index+1}`;
    }
  }

  _toggleToolbar() {
    this._toolbarVisible = !this._toolbarVisible;
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

  _fullscreenChanged() {
    if (fullscreen.element === this) {
      this.$.toggleFullscreen.icon = 'sl-gallery:fullscreen-exit';
    } else {
      this.$.toggleFullscreen.icon = 'sl-gallery:fullscreen';
    }
  }

  _closeSlideshow(event) {
    window.history.pushState({}, document.title,
        window.location.pathname + window.location.search);
    window.dispatchEvent(new CustomEvent('location-changed'));

    // [TODO]: This can be removed after upstream change to reset route data
    this.gallery._routeData = {};

    this._exitFullscreen();

    this._imageSmall = '';
    this._imageSrc = '';

    this._spinnerActive = false;

    // Prevent hover state from persisting after click
    if (event) {
      const el = event.currentTarget;
      const parrent = el.parentNode;
      const sibling = el.nextSibling;
      parrent.removeChild(el);
      setTimeout(() => parrent.insertBefore(el, sibling), 0);
    }
  }

  _openedChanged(opened) {
    if (opened) {
      document.body.style.overflow = 'hidden';
      this._toolbarVisible = true;
      this.hidden = false;
      this.focus();
    } else {
      document.body.style.overflow = '';
      this.hidden = true;
    }
  }
}

window.customElements.define(SLGallerySlideshow.is, SLGallerySlideshow);
