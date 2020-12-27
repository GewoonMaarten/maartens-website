import { getRandomNumber } from "./utils";

/**
 * Generate a randomized grid
 * @param {number} density grid density ad percentage
 * @param {number} max_width max width of the grid
 * @param {number} max_height max height of the grid in pixels
 * @param {number} rand_offset max amount of random offset for each point on the grid
 * @param {HTMLElement} forbidden_element element to keep out of
 * @param {number} padding extra padding in pixels for the keepout area of `forbidden_element`
 * @returns a list of position in the form of [x, y]
 */
export function generateGrid(
  density,
  max_width,
  max_height,
  rand_offset,
  forbidden_element,
  padding = 50
) {
  let grid = [];

  const bouding_box = forbidden_element.getBoundingClientRect();

  const number_of_points_x = Math.floor(max_width * density);
  const number_of_points_y = Math.floor(max_height * density);

  const offset_x = Math.floor(max_width / number_of_points_x / 2);
  const offset_y = Math.floor(max_height / number_of_points_y / 2);

  let pos_x, pos_y, rand_offset_x, rand_offset_y;
  for (let i = 0; i < number_of_points_x; i++) {
    for (let j = 0; j < number_of_points_y; j++) {
      rand_offset_x = getRandomNumber(-rand_offset, rand_offset);
      rand_offset_y = getRandomNumber(-rand_offset, rand_offset);

      pos_x = i * (max_width / number_of_points_x) + offset_x + rand_offset_x;
      pos_y = j * (max_height / number_of_points_y) + offset_y + rand_offset_y;

      if (
        pos_x > bouding_box.x - padding &&
        pos_x < bouding_box.x + bouding_box.width + padding &&
        pos_y > bouding_box.y - padding &&
        pos_y < bouding_box.y + bouding_box.height + padding
      ) {
        continue;
      }

      grid.push([pos_x, pos_y]);
    }
  }

  return grid;
};