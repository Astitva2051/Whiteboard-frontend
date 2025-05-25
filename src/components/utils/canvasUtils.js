/**
 * Helper functions for canvas operations
 */

/**
 * Get cursor position relative to canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {MouseEvent|TouchEvent} event - Mouse or touch event
 * @returns {object} - x and y coordinates
 */
export const getCursorPosition = (canvas, event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let x, y;
  if (event.touches && event.touches[0]) {
    // Touch event
    x = (event.touches[0].clientX - rect.left) * scaleX;
    y = (event.touches[0].clientY - rect.top) * scaleY;
  } else {
    // Mouse event
    x = (event.clientX - rect.left) * scaleX;
    y = (event.clientY - rect.top) * scaleY;
  }

  return { x, y };
};

/**
 * Clear canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
export const clearCanvas = (ctx, canvas) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

/**
 * Resize canvas to match parent element
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
export const resizeCanvas = (canvas) => {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
};

/**
 * Draw line on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x1 - Start x-coordinate
 * @param {number} y1 - Start y-coordinate
 * @param {number} x2 - End x-coordinate
 * @param {number} y2 - End y-coordinate
 * @param {string} color - Line color
 * @param {number} width - Line width
 */
export const drawLine = (ctx, x1, y1, x2, y2, color, width) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
};

/**
 * Draw rectangle on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Start x-coordinate
 * @param {number} y - Start y-coordinate
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {string} color - Rectangle border color
 * @param {number} lineWidth - Border width
 * @param {boolean} fill - Whether to fill rectangle
 */
export const drawRect = (
  ctx,
  x,
  y,
  width,
  height,
  color,
  lineWidth,
  fill = false
) => {
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.stroke();
};

/**
 * Draw circle on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center x-coordinate
 * @param {number} y - Center y-coordinate
 * @param {number} radius - Circle radius
 * @param {string} color - Circle border color
 * @param {number} lineWidth - Border width
 * @param {boolean} fill - Whether to fill circle
 */
export const drawCircle = (
  ctx,
  x,
  y,
  radius,
  color,
  lineWidth,
  fill = false
) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.stroke();
};

/**
 * Convert canvas to data URL
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {string} - Data URL
 */
export const canvasToDataURL = (canvas) => {
  return canvas.toDataURL("image/png");
};

/**
 * Load image from data URL to canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} dataURL - Data URL
 * @returns {Promise} - Promise that resolves when image is loaded
 */
export const loadImageToCanvas = (ctx, dataURL) => {
  return new Promise((resolve, reject) => {
    if (!dataURL) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = reject;
    img.src = dataURL;
  });
};
