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
      max: 5,
      min: 1,
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
    if (event.deltaY < 0 && this.activeImage.loaded) {
      // Handle scroll up
      this._zoomIn(0.25, event.clientX, event.clientY);
    } else {
      // Handle scroll down
      this._zoomOut(0.25);
    }
  }

  _handleZoomClickStart(event) {
    if (this.zoomActive) {
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

      const newX = center.x + (xDiff * 2 / this._zoom.scale);
      const newY = center.y + (yDiff * 2 / this._zoom.scale);

      this._updateZoomOrigin(newX, newY);
    }
  }

  _handleZoomClickEnd() {
    if (this.zoomActive) {
      this.zoomClicked = false;
    }
  }

  _recenterZoom(x, y) {
    const { center } = this._zoom.coordinates;
    let newX, newY;
    if (this._zoom.scale > 1) {
      newX = center.x + ((x - center.x) / this._zoom.scale);
      newY = center.y + ((y - center.y) / this._zoom.scale);
    } else {
      newX = x;
      newY = y;
    }

    this._updateZoomOrigin(newX, newY);
  }

  _updateZoomOrigin(x, y) {
    const { center } = this._zoom.coordinates;
    const dimensions = this._dimensions.current;

    // Handle max zoom for X axis
    if (x > dimensions.width + dimensions.offsetWidth) {
      center.x = dimensions.width + dimensions.offsetWidth;
    } else if (x < dimensions.offsetWidth) {
      center.x = dimensions.offsetWidth;
    } else {
      center.x = x;
    }

    // Handle max zoom for Y axis
    if (y > dimensions.height + dimensions.offsetHeight) {
      center.y = dimensions.height + dimensions.offsetHeight;
    } else if (y < dimensions.offsetHeight) {
      center.y = dimensions.offsetHeight;
    } else {
      center.y = y;
    }

    this.$.image.style.transformOrigin = `${center.x}px ${center.y}px`;
  }

  _centerZoomOrigin() {
    const { center } = this._zoom.coordinates;

    if (!center.x || !center.y) {
      const dimensions = this._dimensions.current;
      center.x = (dimensions.width / 2) + dimensions.offsetWidth;
      center.y = (dimensions.height / 2) + dimensions.offsetHeight;
    }

    this.$.image.style.transformOrigin = `${center.x}px ${center.y}px`;
  }

  _zoomIn(increase, x, y) {
    if (this._zoom.scale < this._zoom.max) {
      if (this._zoom.scale + increase < this._zoom.max) {
        this._zoom.scale = this._zoom.scale + increase;
      } else {
        this._zoom.scale = this._zoom.max;
      }

      // Update zoom related properties
      this.zoomActive = true;
      if (x && y) {
        this._recenterZoom(x, y);
      } else {
        this._centerZoomOrigin();
      }
      this.$.image.style.transform = `scale(${this._zoom.scale})`;
    }
  }

  _zoomOut(decrease) {
    if (this._zoom.scale > this._zoom.min) {
      if (this._zoom.scale - decrease > this._zoom.min) {
        this._zoom.scale = this._zoom.scale - decrease;
      } else {
        this._zoom.scale = this._zoom.min;
      }

      // Update zoom or reset
      if (this._zoom.scale !== this._zoom.min) {
        this.$.image.style.transform = `scale(${this._zoom.scale})`;
      } else {
        this._resetZoom();
      }
    }
  }

  _handleZoomIn() {
    this._zoomIn(0.50);
  }

  _handleZoomOut() {
    this._zoomOut(0.50);
  }

  _resetZoom() {
    this.zoomActive = false;
    this.zoomClicked = false;
    this._zoom.scale = this._zoom.min;
    this._zoom.coordinates.center.x = null;
    this._zoom.coordinates.center.y = null;
    this.$.image.style.transform = '';
    this.$.image.style.transformOrigin = '';
  }

}
