import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import fullscreen from '@jsilvermist/fullscreen-api';

import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './sl-gallery-icons.js';

class SLGallerySlideshowOverlay extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }

        :host([hidden]) {
          display: none;
        }

        /* Animations */

        app-toolbar,
        #listenerBlocks > div,
        paper-icon-button#closeSlideshow {
          will-change: transform, opacity;
          transition: top 0.35s ease, bottom 0.35s ease, right 0.35s ease,
                      opacity 0.35s ease, visibility 0.35s ease;
        }

        /* @media (hover: hover) in CSS4 */
        :host([hover-enabled]) paper-icon-button:hover {
          background: rgba(99, 99, 99, 0.3);
          border: 1px solid rgba(88, 88, 88, 0.66);
        }

        :host([hover-enabled]) paper-icon-button:active {
          background: rgba(0, 0, 0, 0.3);
          border: 0;
        }

        /* Toolbars */

        app-toolbar {
          z-index: 2;
          position: fixed;
          left: 0;
          right: 0;
          background-color: rgba(0, 0, 0, 0.65);
          color: white;
        }

        app-toolbar.header {
          top: -64px;
          height: 64px;
          visibility: hidden;
        }

        app-toolbar.footer {
          height: auto;
          min-height: 64px;
          bottom: -64px;
          opacity: 0;
          visibility: hidden;
          text-align: center;
          color: #ddd;
          --app-toolbar-font-size: 14px;
        }

        :host([toolbar-visible]) app-toolbar.header {
          top: 0;
          visibility: visible;
        }

        :host([toolbar-visible]) app-toolbar.footer[has-caption] {
          bottom: 0;
          opacity: 1;
          visibility: visible;
        }

        /* Listener Overlays */

        #listenerBlocks > div {
          z-index: 1;
          position: fixed;
          top: 0;
          bottom: 0;
        }

        #listenerBlocks > div#toggleToolbar {
          left: 30%;
          right: 30%;
          width: 40%;
        }

        #listenerBlocks > div#previousImageBlock {
          left: 0;
          width: 30%;
        }

        #listenerBlocks > div#nextImageBlock {
          right: 0;
          width: 30%;
        }

        /* Buttons */

        paper-icon-button#closeSlideshow,
        #listenerBlocks paper-icon-button {
          color: #fff;
          z-index: 2;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.3);
          width: 48px;
          height: 48px;
        }

        paper-icon-button#closeSlideshow {
          position: absolute;
          top: 8px;
          right: 8px;
          visibility: visible;
        }

        :host([toolbar-visible]) paper-icon-button#closeSlideshow {
          right: -48px;
          visibility: hidden;
        }

        #listenerBlocks paper-icon-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
        }

        #listenerBlocks #previousImageBlock paper-icon-button {
          left: 8px;
        }

        #listenerBlocks #nextImageBlock paper-icon-button {
          right: 8px;
        }

        @media (max-width: 600px) {
          paper-icon-button#closeSlideshow {
            top: 5px;
            right: 5px;
          }

          #listenerBlocks paper-icon-button {
            width: 40px;
            height: 40px;
          }

          #listenerBlocks #previousImageBlock paper-icon-button {
            left: 5px;
          }

          #listenerBlocks #nextImageBlock paper-icon-button {
            right: 5px;
          }
        }
      </style>

      <!-- Default View -->
      <app-toolbar class="header">
        <div main-title>[[activeImage.title]]</div>
        <paper-icon-button
            id="fullscreenToggle"
            icon="sl-gallery:fullscreen"
            on-click="_toggleFullscreen">
        </paper-icon-button>
        <paper-icon-button
            id="toolbarCloseSlideshow"
            icon="sl-gallery:close"
            on-click="_resetSlideshow">
        </paper-icon-button>
      </app-toolbar>
      <app-toolbar class="footer" has-caption$="[[activeImage._hasCaption]]">
        <div main-title>[[activeImage.caption]]</div>
      </app-toolbar>

      <!-- Expanded View -->
      <paper-icon-button
          id="closeSlideshow"
          icon="sl-gallery:close"
          on-click="_resetSlideshow">
      </paper-icon-button>

      <!-- Listener Overlays -->
      <div id="listenerBlocks">
        <div id="toggleToolbar" on-click="_toggleToolbar"></div>
        <div id="previousImageBlock" on-click="_navigateToPreviousImage">
          <paper-icon-button icon="sl-gallery:chevron-left"></paper-icon-button>
        </div>
        <div id="nextImageBlock" on-click="_navigateToNextImage">
          <paper-icon-button icon="sl-gallery:chevron-right"></paper-icon-button>
        </div>
      </div>
    `;
  }

  static get is() { return 'sl-gallery-slideshow-overlay'; }

  static get properties() {
    return {
      activeImage: {
        type: Object,
        observer: '_activeImageChanged',
      },
      /* Enable hover effects if not using touch */
      hoverEnabled: {
        type: Boolean,
        value:
          !('ontouchstart' in window && window.navigator.maxTouchPoints > 0),
        reflectToAttribute: true,
        readOnly: true,
      },
      toolbarVisible: {
        type: Boolean,
        value: true,
        reflectToAttribute: true,
      },
    };
  }

  constructor() {
    super();

    // Bind handlers to `this` to allow easy listener removal
    this._fullscreenChanged = this._fullscreenChanged.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    if (fullscreen.enabled) {
      // Listen for entering/exiting fullscreen
      fullscreen.addListener('change', this._fullscreenChanged);
    } else {
      // Remove fullscreen button if not supported
      this.$.fullscreenToggle.parentNode.removeChild(this.$.fullscreenToggle);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up event listeners on disconnect
    if (fullscreen.enabled) {
      fullscreen.removeListener('change', this._fullscreenChanged);
    }
  }

  _activeImageChanged(activeImage) {
    if (activeImage) {
      // Hide previous button if first image
      if (activeImage.hasPreviousImage) {
        this.$.previousImageBlock.hidden = false;
      } else {
        this.$.previousImageBlock.hidden = true;
      }

      // Hide next button if last image
      if (activeImage.hasNextImage) {
        this.$.nextImageBlock.hidden = false;
      } else {
        this.$.nextImageBlock.hidden = true;
      }
    }
  }

  _fullscreenChanged() {
    // Compare current fullscreen element against slideshow
    if (fullscreen.element === this.parentNode.host) {
      this.$.fullscreenToggle.icon = 'sl-gallery:fullscreen-exit';
    } else {
      this.$.fullscreenToggle.icon = 'sl-gallery:fullscreen';
    }
  }

  _toggleToolbar() {
    this.toolbarVisible = !this.toolbarVisible;
  }

  _navigateToPreviousImage() {
    this.dispatchEvent(new CustomEvent('navigate-to-previous-image'));
  }

  _navigateToNextImage() {
    this.dispatchEvent(new CustomEvent('navigate-to-next-image'));
  }

  _resetSlideshow(event) {
    this.dispatchEvent(new CustomEvent('reset-slideshow'));

    // Prevent hover state from persisting after click
    const el = event.currentTarget;
    const parrent = el.parentNode;
    const sibling = el.nextSibling;
    parrent.removeChild(el);
    window.requestAnimationFrame(() => parrent.insertBefore(el, sibling));
  }

  _toggleFullscreen() {
    this.dispatchEvent(new CustomEvent('toggle-fullscreen'));
  }
}

window.customElements.define(SLGallerySlideshowOverlay.is, SLGallerySlideshowOverlay);
