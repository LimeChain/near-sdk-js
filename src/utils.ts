export type Bytes = Uint8Array | string;

export function bytesToU8Array(bytes: Bytes): Uint8Array {
  if (typeof bytes === 'string') {
    return latin1ToU8Array(bytes);
  }
  return bytes;
}

export function u8ArrayToLatin1(array: Uint8Array): string {
  let ret = "";
  for (let e of array) {
    ret += String.fromCharCode(e);
  }
  return ret;
}

export function latin1ToU8Array(latin1: string): Uint8Array {
  let ret = new Uint8Array(latin1.length);
  for (let i = 0; i < latin1.length; i++) {
    let code = latin1.charCodeAt(i);
    if (code > 255) {
      throw new Error(
        `string at index ${i}: ${latin1[i]} is not a valid latin1 char`
      );
    }
    ret[i] = code;
  }
  return ret;
}

export function u8ArrayConcat(array1: Uint8Array, array2: Uint8Array): Uint8Array {
  let mergedArray = new Uint8Array(array1.length + array2.length);
  mergedArray.set(array1);
  mergedArray.set(array2, array1.length);
  return mergedArray
}

export function assert(b: boolean, str: string) {
  if (b) {
      return
  } else {
      throw Error("assertion failed: " + str)
  }
}

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };