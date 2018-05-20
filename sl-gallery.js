/**
@license
Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { FlattenedNodesObserver } from '@polymer/polymer/lib/utils/flattened-nodes-observer.js';

// [TODO]: Remove app-route routing, use simple hash-based system
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';

import './sl-gallery-image.js';
import './sl-gallery-slideshow.js';

/**
 * Silverlinkz Photo Gallery
 * A Polymer hash-route based photo gallery.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class SLGallery extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          overflow: hidden;

          --sl-gallery-columns: 4;
          --sl-gallery-gutter: 8px;
          --sl-gallery-item-height: 75%;
        }

        :host([hidden]) {
          display: none;
        }

        .image-grid {
          display: -ms-flexbox;
          display: -webkit-flex;
          display: flex;

          -ms-flex-direction: row;
          -webkit-flex-direction: row;
          flex-direction: row;

          -ms-flex-wrap: wrap;
          -webkit-flex-wrap: wrap;
          flex-wrap: wrap;

          padding-top: var(--sl-gallery-gutter, 0px);
          padding-left: var(--sl-gallery-gutter, 0px);
          box-sizing: border-box;

          /* @override, hide gutter around grid */
          padding: 0;
          margin: 0 calc(-1 * var(--sl-gallery-gutter, 0px))
                  calc(-1 * var(--sl-gallery-gutter, 0px)) 0;
        }
      </style>

      <app-location
          route="{{_route}}"
          use-hash-as-path>
      </app-location>

      <app-route
          route="{{_route}}"
          pattern="/[[prefix]]/:index"
          data="{{_routeData}}"
          active="{{_routeActive}}">
      </app-route>

      <div class="image-grid" on-click="_handleGridClicked">
        <slot></slot>
      </div>
    `;
  }

  static get is() { return 'sl-gallery'; }

  static get properties() {
    return {
      active: {
        type: Boolean,
        value: true,
        observer: '_activeChanged',
      },
      prefix: {
        type: String,
        value: 'i',
      },
      _images: {
        type: Array,
        observer: '_imagesChanged',
      },
      _route: Object,
      _routeData: Object,
      _routeActive: Boolean,
    };
  }

  static get observers() {
    return [
      '_routeActiveChanged(_routeActive)',
      '_routeIndexChanged(_routeData.index)',
    ];
  }

  constructor() {
    super();

    // Create slideshow element, keep handle as this.slideshow
    this.slideshow = document.createElement('sl-gallery-slideshow');

    // Create reference to local scope in slideshow
    this.slideshow.gallery = this;

    // Hide slideshow before appending to prevent potential flash of content
    this.slideshow.hidden = true;

    // Append slideshow to root custom-element
    document.body.appendChild(this.slideshow);
  }

  connectedCallback() {
    super.connectedCallback();

    // Create observer to watch for new nodes added from light dom
    this._observer = new FlattenedNodesObserver(this, (info) => {
      this._images = [...info.target.children];
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove observer when disconnected
    this._observer.disconnect();
  }

  _handleGridClicked(event) {
    if (event.target.index !== undefined) {
      window.location.hash = `/${this.prefix}/${event.target.index}`;
    }
  }

  _imagesChanged(images) {
    // Give each image an index based on position in array
    images.forEach((image, i) => {
      image.index = i;
    });

    // Manually call changed methods when images change to update routes
    // [TODO]: Refactor so this is no longer necessary
    this._activeChanged();
  }

  _activeChanged(active, old) {
    // Manually call changed methods when active changes to update routes
    // [TODO]: Refactor so this is no longer necessary
    if (active !== undefined && old === undefined) return;
    this._routeActiveChanged(this._routeActive);
    this._routeIndexChanged(this._routeData.index);
  }

  _routeActiveChanged(routeActive) {
    // [TODO]: Should reflect state to slideshow and handle view from slideshow.active
    if (this.active && routeActive && this._images && this._images[this._routeData.index]) {
      this.slideshow.opened = true;
    } else {
      this.slideshow.opened = false;
    }
  }

  _routeIndexChanged(routeIndex) {
    if (!this.active || !this._routeActive || !this._images) {
      this.slideshow.activeImage = undefined;
    } else {
      this.slideshow.activeImage = this._images[routeIndex];
    }
  }
}

window.customElements.define(SLGallery.is, SLGallery);
