/**
 * Utility functions for simulating failover behavior in generative AI providers.
 */

/**
 * Sleep for specified milliseconds
 * @param ms
 * @returns Promise that resolves after specified milliseconds
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a random integer between min and max (inclusive)
 * @param min
 * @param max
 * @returns Random number
 */
export const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Return true randomly with the given probability to simulate chance
 * @param probability
 * @returns boolean
 */
export const chance = (probability: number) => Math.random() < probability;

/**
 * Generate a random text response
 * @returns string
 */
export const randomTextResponse = () => {
  const length = randomInt(20, 100);
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
