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

class SLGalleryImage extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-block;
          overflow: hidden;
          cursor: pointer;

          /* Placeholder bg color */
          background-color: rgba(0, 0, 0, 0.0);
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;

          /* Required for IE 10 */
          -ms-flex: 1 1 100%;
          -webkit-flex: 1;
          flex: 1;

          /* The width for an item is: (100% - subPixelAdjustment - gutter * columns) / columns */
          -webkit-flex-basis: calc((100% - 0.1px - (var(--sl-gallery-gutter, 0px) * var(--sl-gallery-columns, 1))) / var(--sl-gallery-columns, 1));
          flex-basis: calc((100% - 0.1px - (var(--sl-gallery-gutter, 0px) * var(--sl-gallery-columns, 1))) / var(--sl-gallery-columns, 1));

          max-width: calc((100% - 0.1px - (var(--sl-gallery-gutter, 0px) * var(--sl-gallery-columns, 1))) / var(--sl-gallery-columns, 1));
          margin-bottom: var(--sl-gallery-gutter, 0px);
          margin-right: var(--sl-gallery-gutter, 0px);
          height: var(--sl-gallery-item-height);
          box-sizing: border-box;

          position: relative;
        }

        :host::before {
          display: block;
          content: "";
          padding-top: var(--sl-gallery-item-height, 100%);
        }

        :host([hidden]) {
          display: none;
        }
      </style>
    `;
  }

  static get is() { return 'sl-gallery-image'; }

  static get properties() {
    return {
      src: String,
      small: String,
      title: String,
      caption: String,
      width: Number,
      height: Number,
      hasCaption: {
        type: Boolean,
        computed: '_computeHasCaption(caption)',
        readOnly: true,
      },
      _imageUrl: {
        type: String,
        computed: '_computeImage(src, small)',
        observer: '_imageUrlChanged',
      },
    };
  }

  _computeImage(src, small) {
    if (small) {
      return small;
    } else {
      return src;
    }
  }

  _computeHasCaption(caption) {
    return Boolean(caption);
  }

  _imageUrlChanged(imageUrl) {
    this.style.backgroundImage = `url(${imageUrl})`;
    if (!this.height || !this.width) this._getDimensions(imageUrl);
  }

  _getDimensions(imageUrl) {
    const img = new Image();
    img.onload = () => {
      this.width = img.width;
      this.height = img.height;
      delete img.onload;
    }
    img.src = imageUrl;
  }
}

window.customElements.define(SLGalleryImage.is, SLGalleryImage);
