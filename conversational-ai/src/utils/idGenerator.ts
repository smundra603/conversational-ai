import { v4 as uuidv4 } from 'uuid';

function* idGenerator(): IterableIterator<number, number, number> {
  let id = 0;

  while (true) {
    yield id++;
  }
}

export const incrementalIdGenerator = idGenerator();

export const uuid = (): string => {
  return uuidv4();
};
