import { Readable, ReadableOptions } from "stream";

abstract class BaseMultiReadable extends Readable {
  protected __streams: Readable[];
  private __read: ((size: number) => void) | null | undefined;

  constructor(streams: Readable[], opts?: ReadableOptions) {
    super(opts);

    const readableObjectMode = !!opts?.objectMode;
    const isReadable = Readable.isReadable
      ? Readable.isReadable
      : (stream: unknown) => stream instanceof Readable;

    if (
      Array.isArray(streams) &&
      streams.every((stream) => {
        if (!isReadable(stream)) {
          return false;
        }

        if (stream.readableObjectMode !== readableObjectMode) {
          return false;
        }

        return true;
      })
    ) {
      this.__streams = streams;
      this.__start().catch((reason) => {
        this.destroy(reason);
      });
    } else {
      throw new Error("arguments type error");
    }
  }

  _read(size: number): void {
    this.__read?.(size);
  }

  _destroy(
    error: Error | null,
    callback: (error?: Error | null) => void
  ): void {
    for (const stream of this.__streams) {
      if (!stream.destroyed) {
        stream.destroy();
      }
    }

    this.__read?.(-1);
    callback(error);
  }

  protected abstract __start(): Promise<void>;

  protected async __get_size(): Promise<number> {
    try {
      return await new Promise<number>((resolve) => {
        this.__read = resolve;
      });
    } finally {
      this.__read = null;
    }
  }
}

export class MultiBufferReadable extends BaseMultiReadable {
  constructor(streams: Readable[], opts?: MultiBufferReadableOptions) {
    super(streams, { ...opts, objectMode: false });
  }

  protected async __start(): Promise<void> {
    let size = 0;
    let size_promise = this.__get_size();
    let cache: Buffer | null | undefined;

    const clear = () => {
      size = 0;
      size_promise = this.__get_size();
      cache = null;
    };

    for (const stream of this.__streams) {
      for await (const chunk of stream) {
        if (!Buffer.isBuffer(chunk)) {
          throw new Error("chunk is not a buffer");
        }

        if (size === 0) {
          size = await size_promise;
        }

        cache = cache ? Buffer.concat([cache, chunk]) : chunk;
        let cache_len = cache.length;

        if (cache_len > size) {
          do {
            this.push(cache.slice(0, size));

            cache = cache.slice(size);
            cache_len = cache.length;

            size = await this.__get_size();

            if (cache_len < size) {
              break;
            } else if (cache_len === size) {
              this.push(cache);
              clear();
              break;
            }
          } while (true);
        } else if (cache_len === size) {
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
}

export interface MultiBufferReadableOptions
  extends Omit<ReadableOptions, "objectMode"> {}

export class MultiObjectReadable extends BaseMultiReadable {
  constructor(streams: Readable[], opts?: MultiObjectReadableOptions) {
    super(streams, { ...opts, objectMode: true });
  }

  protected async __start(): Promise<void> {
    let size = 0;
    let size_promise = this.__get_size();

    for (const stream of this.__streams) {
      for await (const object of stream) {
        if (size === 0) {
          size = await size_promise;
        }

        const r = this.push(object);

        if (!r) {
          size = 0;
          size_promise = this.__get_size();
        }
      }
    }

    this.push(null);
  }
}

export interface MultiObjectReadableOptions
  extends Omit<ReadableOptions, "objectMode"> {}
