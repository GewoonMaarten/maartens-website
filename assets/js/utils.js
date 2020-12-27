/**
 * Generates a random number between `min` and `max`
 * @param {number} min
 * @param {number} max
 * @returns random integer
 */
export function getRandomNumber (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};