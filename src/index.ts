import { Readable, ReadableOptions } from "stream";

export class MultiBufferReadable extends Readable {
  #streams: Readable[];
  #read: ((size: number) => void) | null | undefined;

  constructor(streams: Readable[], opts?: MultiBufferReadableOptions) {
    super(opts);

    if (
      Array.isArray(streams) &&
      streams.every((stream) => stream instanceof Readable)
    ) {
      this.#streams = streams;
      this.#start();
    } else {
      throw new Error("arguments type error");
    }
  }

  _read(size: number): void {
    if (!this.#read) {
      throw new Error("read not ready");
    }

    this.#read(size);
  }

  _destroy(
    error: Error | null,
    callback: (error?: Error | null) => void
  ): void {
    callback(error);
  }

  async #start() {
    let size = 0;
    let sizePromise = this.#getSize();
    let cache: Buffer | null | undefined;

    const clear = () => {
      size = 0;
      sizePromise = this.#getSize();
      cache = null;
    };

    for (const stream of this.#streams) {
      for await (const chunk of stream) {
        if (!(chunk instanceof Buffer)) {
          throw new Error("chunk is not a buffer");
        }

        if (size === 0) {
          size = await sizePromise;
        }

        cache = cache ? Buffer.concat([cache, chunk]) : chunk;
        let cacheLen = cache.length;

        if (cacheLen > size) {
          do {
            this.push(cache.slice(0, size));

            cache = cache.slice(size);
            cacheLen = cache.length;

            size = await this.#getSize();

            if (cacheLen < size) {
              break;
            } else if (cacheLen === size) {
              this.push(cache);
              clear();
              break;
            }
          } while (true);
        } else if (cacheLen === size) {
          this.push(cache);
          clear();
        }
      }
    }

    if (cache) {
      this.push(cache);
      cache = null;
    }
    this.push(null);
  }

  async #getSize() {
    try {
      const size = await new Promise<number>((resolve) => {
        this.#read = resolve;
      });

      if (size <= 0) {
        throw new Error("read size value error");
      }

      return size;
    } finally {
      this.#read = null;
    }
  }
}

export interface MultiBufferReadableOptions
  extends Omit<ReadableOptions, "objectMode"> {}
