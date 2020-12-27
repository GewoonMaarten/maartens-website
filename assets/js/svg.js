/**
 * Appends an gradient to the svg element.
 * @param {HTMLElement} svg svg element to add the gradient to
 * @param {string} id name of the gradient
 * @param {Array} stops array of stops containg objects of following form:
 * ```js
 * { offset: "<offset>", "stop-color": "<color>" }
 * ```
 */
export function createGradient(svg, id, stops) {
  const xmlns = svg.namespaceURI;
  const grad = document.createElementNS(xmlns, "linearGradient");
  grad.setAttribute("id", id);

  stops.forEach((attrs) => {
    const stop = document.createElementNS(xmlns, "stop");
    Object.entries(attrs).forEach(([key, value]) => {
      stop.setAttribute(key, value);
    });
    grad.appendChild(stop);
  });

  const defs =
    svg.querySelector("defs") ||
    svg.insertBefore(document.createElementNS(xmlns, "defs"), svg.firstChild);

  return defs.appendChild(grad);
}

/**
 * Appends a path to the svg
 * @param {HTMLElement} svg svg element to add the path to
 * @param {string} coords the `d` attribute of the path
 * @param {Array} pos array containing the x and y of the path
 * @param {number} rotate degrees of rotation
 * @param {number} scale scaling factor
 * @param {string} gradient_id id of the gradient
 */
export function createPath(svg, coords, pos, rotate, scale, gradient_id) {
  const xmlns = svg.namespaceURI;
  const path = document.createElementNS(xmlns, "path");

  let matrix = svg.createSVGMatrix();
  matrix = matrix.translate(pos[0], pos[1]);
  matrix = matrix.rotate(rotate, 0, 0);
  matrix = matrix.scale(scale, scale);

  const tfm = path.transform.baseVal.createSVGTransformFromMatrix(matrix);
  path.transform.baseVal.appendItem(tfm);

  path.setAttribute("d", coords);
  path.setAttribute("fill", `url(#${gradient_id})`);

  svg.appendChild(path);
}

/**
 * Appends a circle to the svg
 * @param {HTMLElement} svg svg element to add the circle to
 * @param {number} radius the radius of the circle in pixels
 * @param {Array} pos array containing the x and y of the circle
 * @param {string} fill color hex code
 */
export function createCircle(svg, radius, pos, fill) {
  const xmlns = svg.namespaceURI;
  const circle = document.createElementNS(xmlns, "circle");

  let matrix = svg.createSVGMatrix();
  matrix = matrix.translate(pos[0], pos[1]);

  const tfm = circle.transform.baseVal.createSVGTransformFromMatrix(matrix);
  circle.transform.baseVal.appendItem(tfm);

  radius /= 2
  circle.setAttribute("r", radius);
  circle.setAttribute("cx", radius);
  circle.setAttribute("cy", radius);
  circle.setAttribute("fill", fill);

  svg.append(circle);
}