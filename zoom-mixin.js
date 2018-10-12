/**
 * Slideshow view-image zooming
 * @polymer
 * @mixinFunction
 */
export const ZoomMixin = (superclass) => class extends superclass {

  static get properties() {
    return {
      zoomActive: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
      },
      zoomClicked: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
      },
      _zoom: Object,
    };
  }

  constructor() {
    super();

    this._zoom = {
      scale: 1,
      oldScale: 1,
      factor: 0.25,
      max: 9,
      coordinates: {
        previous: {
          x: null,
          y: null,
        },
        position: {
          x: 0,
          y: 0,
        },
      },
    };
  }

  connectedCallback() {
    super.connectedCallback();

    // Handle zoom
    this.addEventListener('wheel', this._handleWheelZoom);
    this.addEventListener('touchstart', this._handleZoomClickStart);
    this.addEventListener('mousedown', this._handleZoomClickStart);
    this.addEventListener('touchmove', this._handleZoomClickMove);
    this.addEventListener('mousemove', this._handleZoomClickMove);
    this.addEventListener('touchend', this._handleZoomClickEnd);
    this.addEventListener('mouseup', this._handleZoomClickEnd);
  }

  _handleWheelZoom(event) {
    event.preventDefault();

    const delta = Math.max(Math.min(event.deltaY, 1), -1);

    // [TODO]: Consider moving factor usage to adjustZoom
    const zoomFactor = -delta * this._zoom.factor * this._zoom.scale;

    if (this.activeImage && this.activeImage.loaded) {
      this._adjustZoom(zoomFactor, event.clientX, event.clientY);
    }
  }

  _handleZoomClickStart(event) {
    if (this.zoomActive) {
      // [TODO]: Debug grabbing cursor not being applied while mouse down
      this.zoomClicked = true;
      const { previous } = this._zoom.coordinates;
      if (event.touches && event.touches[0]) {
        previous.x = event.touches[0].clientX;
        previous.y = event.touches[0].clientY;
      } else {
        event.preventDefault();
        previous.x = event.clientX;
        previous.y = event.clientY;
      }
    }
  }

  _handleZoomClickMove(event) {
    if (this.zoomActive) {
      event.preventDefault();
      const { previous, position } = this._zoom.coordinates;
      let x, y;
      if (event.touches && event.touches[0]) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      } else {
        if (event.buttons !== 1) return;
        x = event.clientX;
        y = event.clientY;
      }

      const xDiff = x - previous.x;
      const yDiff = y - previous.y;

      previous.x = x;
      previous.y = y;

      position.x += xDiff;
      position.y += yDiff;

      this._updateZoomTransform();
    }
  }

  _handleZoomClickEnd() {
    if (this.zoomActive) {
      this.zoomClicked = false;
    }
  }

  _updateZoomTransform() {
    const { scale } = this._zoom;
    const { position } = this._zoom.coordinates;
    const { screen, current } = this._dimensions;

    // Calculate offset scale to prevent zoom on offset
    const extraWidth = current.offsetWidth * (scale - 1);
    const extraHeight = current.offsetHeight * (scale - 1);

    // Ensure the image stays in its container area when zooming out
    if (position.x > -extraWidth) {
      position.x = -extraWidth;
    } else if (position.x + screen.width * scale - extraWidth < screen.width) {
      position.x = -screen.width * (scale - 1) + extraWidth;
    }
    if (position.y > -extraHeight) {
      position.y = -extraHeight;
    } else if (position.y + screen.height * scale - extraHeight < screen.height) {
      position.y = -screen.height * (scale - 1) + extraHeight;
    }

    // Adjust coordinates based on a center origin
  	const x = position.x + screen.width * (scale - 1) / 2;
    const y = position.y + screen.height * (scale - 1) / 2;

    this.$.image.style.transform =
      `translate(${x}px, ${y}px) scale(${scale})`;
  }

  _recenterZoom(clientX, clientY) {
    const { scale, oldScale } = this._zoom;
    const { position } = this._zoom.coordinates;
    const { current } = this._dimensions;
    const zoomTarget = { x: null, y: null };

    // Calculate target on image to zoom at based on scale
    zoomTarget.x = (clientX - position.x) / oldScale;
    zoomTarget.y = (clientY - position.y) / oldScale;

    // Prevent zoomTarget from targetting offsets
    if (zoomTarget.x < current.offsetWidth) {
      zoomTarget.x = current.offsetWidth;
    } else if (zoomTarget.x > current.width + current.offsetWidth) {
      zoomTarget.x = current.width + current.offsetWidth;
    }
    if (zoomTarget.y < current.offsetHeight) {
      zoomTarget.y = current.offsetHeight;
    } else if (zoomTarget.y > current.width + current.offsetHeight) {
      zoomTarget.y = current.width + current.offsetHeight;
    }

    // Calculate X and Y positions based on new scale
    position.x = -zoomTarget.x * scale + clientX;
    position.y = -zoomTarget.y * scale + clientY;

    this._updateZoomTransform();
  }

  _adjustZoom(change, x, y) {
    // Increase zoom scale up to the max value
    this._zoom.oldScale = this._zoom.scale;
    this._zoom.scale =
      Math.max(Math.min(this._zoom.scale + change, this._zoom.max), 1);

    // Zoom is active when zoomed in
    this.zoomActive = true;

    // Enable transitions, clear timeout to prevent jitter
    clearTimeout(this._zoom.transitionTimeout);
    this.$.image.style.transition = `transform ${this.transitionTime}ms`;

    // Update transform and position as necessary
    if (this._zoom.scale !== 1) {
      if (x === undefined || y === undefined) {
        x = this._dimensions.screen.width / 2;
        y = this._dimensions.screen.height / 2;
      }
      this._recenterZoom(x, y);
    } else {
      this._resetZoom();
    }

    // Disable transitions when transition completes
    this._zoom.transitionTimeout = setTimeout(() => {
      this.$.image.style.transition = '';
    }, this.transitionTime);
  }

  _resetZoom() {
    this.zoomActive = false;
    this.zoomClicked = false;
    this._zoom.scale = 1;
    this._zoom.oldScale = 1;
    this._zoom.coordinates.position.x = 0;
    this._zoom.coordinates.position.y = 0;
    this.$.image.style.transform = '';
  }

  _handleZoomIn() {
    this._adjustZoom(this._zoom.factor * this._zoom.scale);
  }

  _handleZoomOut() {
    this._adjustZoom(-this._zoom.factor * this._zoom.scale);
  }

}
