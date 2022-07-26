import { BufferReadable } from "buffer-readable";
import { expect } from "chai";
import { Readable } from "stream";
import { buffer, text } from "stream/consumers";
import { MultiBufferReadable } from ".";

describe("MultiBufferReadable", () => {
  describe("arguments", () => {
    it("empty array", async () => {
      const stream = new MultiBufferReadable([]);

      const result = await buffer(stream);

      expect(result).length(0);
    });

    it("array length 1", async () => {
      const stream = new MultiBufferReadable([
        Readable.from(Buffer.allocUnsafe(0)),
      ]);

      const result = await buffer(stream);

      expect(result).length(0);
    });

    it("array length 2", async () => {
      const stream = new MultiBufferReadable([
        Readable.from(Buffer.allocUnsafe(0)),
        Readable.from(Buffer.allocUnsafe(0)),
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
