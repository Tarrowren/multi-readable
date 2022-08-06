import { BufferReadable } from "buffer-readable";
import { expect } from "chai";
import { Readable } from "stream";
import { MultiBufferReadable, MultiObjectReadable } from ".";

describe("MultiBufferReadable", () => {
  describe("arguments", () => {
    it("empty array", async () => {
      const stream = new MultiBufferReadable([]);

      const result = await buffer(stream);

      expect(result).length(0);
    });

    it("array length 1", async () => {
      const stream = new MultiBufferReadable([
        new BufferReadable(Buffer.allocUnsafe(0)),
      ]);

      const result = await buffer(stream);

      expect(result).length(0);
    });

    it("array length 2", async () => {
      const stream = new MultiBufferReadable([
        new BufferReadable(Buffer.allocUnsafe(0)),
        new BufferReadable(Buffer.allocUnsafe(0)),
      ]);

      const result = await buffer(stream);

      expect(result).length(0);
    });

    it("error type", () => {
      const streams = [1, 2] as unknown as Readable[];

      expect(() => {
        new MultiBufferReadable(streams);
      }).throw("arguments type error");
    });
  });

  it("validation result", async () => {
    const stream = new MultiBufferReadable([
      new BufferReadable("hello \n"),
      new BufferReadable("world!"),
    ]);

    const result = await text(stream);

    expect(result).string("hello \nworld!");
  });

  it("highWaterMark", async () => {
    const highWaterMark = 3;

    const stream = new MultiBufferReadable(
      [new BufferReadable("hello "), new BufferReadable("world!")],
      { highWaterMark }
    );

    for await (const chunk of stream) {
      expect(chunk).length.lte(highWaterMark);
    }
  });
});

describe("MultiObjectReadable", () => {
  describe("arguments", () => {
    it("empty array", async () => {
      const stream = new MultiObjectReadable([]);

      const result = await collect(stream);

      expect(result).length(0);
    });

    it("array length 1", async () => {
      const stream = new MultiObjectReadable([Readable.from([])]);

      const result = await collect(stream);

      expect(result).length(0);
    });

    it("array length 2", async () => {
      const stream = new MultiObjectReadable([
        Readable.from([]),
        Readable.from([]),
      ]);

      const result = await collect(stream);

      expect(result).length(0);
    });

    it("error type", () => {
      const streams = [1, 2] as unknown as Readable[];

      expect(() => {
        new MultiBufferReadable(streams);
      }).throw("arguments type error");
    });
  });

  it("validation result", async () => {
    const stream = new MultiObjectReadable([
      Readable.from([1, 2, 3]),
      Readable.from([4, 5, 6, 7, 8]),
    ]);

    const result = await collect(stream);

    expect(result).deep.eq([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

async function collect(stream: Readable) {
  const data = [];

  for await (const chunk of stream) {
    data.push(chunk);
  }

  return data;
}

async function buffer(stream: Readable) {
  return Buffer.concat(await collect(stream));
}

async function text(stream: Readable) {
  return (await buffer(stream)).toString("utf8");
}
