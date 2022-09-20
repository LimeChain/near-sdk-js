import * as near from "../api";
import { assert, Bytes, getValueWithOptions, u8ArrayToBytes } from "../utils";
import { GetOptions } from "../types/collections";
const ERR_INDEX_OUT_OF_BOUNDS = "Index out of bounds";
const ERR_INCONSISTENT_STATE =
  "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";

function indexToKey(prefix: Bytes, index: number): Bytes {
  const data = new Uint32Array([index]);
  const array = new Uint8Array(data.buffer);
  const key = u8ArrayToBytes(array);

  return prefix + key;
}

/// An iterable implementation of vector that stores its content on the trie.
/// Uses the following map: index -> element
export class Vector<DataType> {
  length = 0;

  constructor(readonly prefix: Bytes) {}

  isEmpty(): boolean {
    return this.length === 0;
  }

  get(index: number, options?: GetOptions<DataType>): DataType | null {
    if (index >= this.length) {
      return null;
    }
    const storageKey = indexToKey(this.prefix, index);
    const value = JSON.parse(near.storageRead(storageKey));

    return getValueWithOptions(value, options);
  }

  /// Removes an element from the vector and returns it in serialized form.
  /// The removed element is replaced by the last element of the vector.
  /// Does not preserve ordering, but is `O(1)`.
  swapRemove(index: number, options?: GetOptions<DataType>): DataType | null {
    assert(index < this.length, ERR_INDEX_OUT_OF_BOUNDS);

    if (index + 1 === this.length) {
      return this.pop(options);
    }

    const key = indexToKey(this.prefix, index);
    const last = this.pop();

    assert(
      near.storageWrite(key, JSON.stringify(last)),
      ERR_INCONSISTENT_STATE
    );

    const value = JSON.parse(near.storageGetEvicted());

    return getValueWithOptions(value, options);
  }

  push(element: DataType) {
    const key = indexToKey(this.prefix, this.length);
    this.length += 1;
    near.storageWrite(key, JSON.stringify(element));
  }

  pop(options?: GetOptions<DataType>): DataType | null {
    if (this.isEmpty()) {
      return options?.defaultValue ?? null;
    }

    const lastIndex = this.length - 1;
    const lastKey = indexToKey(this.prefix, lastIndex);
    this.length -= 1;

    assert(near.storageRemove(lastKey), ERR_INCONSISTENT_STATE);

    const value = JSON.parse(near.storageGetEvicted());

    return getValueWithOptions(value, options);
  }

  replace(
    index: number,
    element: DataType,
    options?: GetOptions<DataType>
  ): DataType {
    assert(index < this.length, ERR_INDEX_OUT_OF_BOUNDS);
    const key = indexToKey(this.prefix, index);

    assert(
      near.storageWrite(key, JSON.stringify(element)),
      ERR_INCONSISTENT_STATE
    );

    const value = JSON.parse(near.storageGetEvicted());

    return getValueWithOptions(value, options);
  }

  extend(elements: DataType[]): void {
    for (const element of elements) {
      this.push(element);
    }
  }

  [Symbol.iterator](): VectorIterator<DataType> {
    return new VectorIterator(this);
  }

  private createIteratorWithOptions(options?: GetOptions<DataType>): {
    [Symbol.iterator](): VectorIterator<DataType>;
  } {
    return {
      [Symbol.iterator]: () => new VectorIterator(this, options),
    };
  }

  toArray(options?: GetOptions<DataType>): DataType[] {
    const array = [];

    const iterator = options ? this.createIteratorWithOptions(options) : this;

    for (const v of iterator) {
      array.push(v);
    }

    return array;
  }

  clear(): void {
    for (let index = 0; index < this.length; index++) {
      const key = indexToKey(this.prefix, index);
      near.storageRemove(key);
    }

    this.length = 0;
  }

  serialize(): string {
    return JSON.stringify(this);
  }

  // converting plain object to class object
  static reconstruct<DataType>(data: Vector<DataType>): Vector<DataType> {
    const vector = new Vector<DataType>(data.prefix);
    vector.length = data.length;

    return vector;
  }
}

export class VectorIterator<DataType> {
  private current: number;

  constructor(
    private vector: Vector<DataType>,
    private readonly options?: GetOptions<DataType>
  ) {
    this.current = 0;
  }

  next(): {
    value: DataType | null;
    done: boolean;
  } {
    if (this.current >= this.vector.length) {
      return { value: null, done: true };
    }

    const value = this.vector.get(this.current, this.options);
    this.current += 1;

    return { value, done: false };
  }
}
