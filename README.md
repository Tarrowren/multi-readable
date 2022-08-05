# multi-readable

Serial connecting readable streams, strictly following the back pressure and highWaterMark.

## Install

```sh
npm i multi-readable
```

## Example

```js
import { createReadStream } from "fs";
import { MultiBufferReadable } from "multi-readable";

const stream = new MultiBufferReadable(
  [createReadStream("package.json"), createReadStream("package.json")],
  { highWaterMark: 16 }
);

for await (const chunk of stream) {
  // do sth
}
```

## API

### Class MultiBufferReadable

```ts
new MultiBufferReadable(streams: Readable[], opts?: MultiBufferReadableOptions): MultiBufferReadable
```

- `streams`: Readable[]
- `opts` (Optional) : MultiBufferReadableOptions

### Interface MultiBufferReadableOptions

equivalent to `fs.ReadableOptions`, but with `objectMode` removed

## License

MIT
