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

      // [TODO]: Fix for use with the new zoom coordinate system
      // this._updateZoomPosition(xDiff, yDiff);

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

  _updateZoomPosition(xDiff = 0, yDiff = 0) {
    const { position } = this._zoom.coordinates;
    const { current } = this._dimensions;

    const newOffsetX = position.x + xDiff;
    const newOffsetY = position.y + yDiff;

    // Bound edges of image to center of screen
    const boundingWidth = (current.width / 2) * this._zoom.scale;
    const boundingHeight = (current.height / 2) * this._zoom.scale;

    // Handle bounding for X axis
    if (newOffsetX > boundingWidth) {
      position.x = boundingWidth;
    } else if (newOffsetX < -boundingWidth) {
      position.x = -boundingWidth;
    } else {
      position.x = newOffsetX;
    }

    // Handle bounding for Y axis
    if (newOffsetY > boundingHeight) {
      position.y = boundingHeight;
    } else if (newOffsetY < -boundingHeight) {
      position.y = -boundingHeight;
    } else {
      position.y = newOffsetY;
    }

    // Update transform after bounding coordinates
    this._updateZoomTransform();
  }

  _updateZoomTransform() {
    const { scale } = this._zoom;
    const { position } = this._zoom.coordinates;
    const { screen } = this._dimensions;

    // Adjust coordinates based on a center origin
  	const x = position.x + screen.width * (scale - 1) / 2;
    const y = position.y + screen.height * (scale - 1) / 2;

    this.$.image.style.transform =
      `translate(${x}px, ${y}px) scale(${scale})`;
  }

  _recenterZoom(clientX, clientY) {
    const { scale, oldScale } = this._zoom;
    const { position } = this._zoom.coordinates;
    const { screen } = this._dimensions;
    const zoomTarget = { x: null, y: null };

    // Calculate target on image to zoom at based on scale
    zoomTarget.x = (clientX - position.x) / oldScale;
    zoomTarget.y = (clientY - position.y) / oldScale;

    // Calculate X and Y positions based on new scale
    position.x = -zoomTarget.x * scale + clientX;
    position.y = -zoomTarget.y * scale + clientY;

    // Ensure the image stays in its container area when zooming out
    // [TODO]: Contain image to (currentSize + screen/2)
    // [TODO]: Stop treating offsets as part of image
    if (position.x > 0) {
      position.x = 0;
    }
    if (position.x + screen.width * scale < screen.width) {
      position.x = -screen.width * (scale - 1);
    }
    if (position.y > 0) {
      position.y = 0;
    }
    if (position.y + screen.height * scale < screen.height) {
      position.y = -screen.height * (scale - 1);
    }

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
      if (!(x && y)) {
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
