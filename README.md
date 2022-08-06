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

```js
import { Readable } from "stream";
import { MultiObjectReadable } from "multi-readable";

const data = [];
for (let i = 0; i < 1024; i++) {
  data.push({ i });
}

const stream = new MultiObjectReadable(
  [Readable.from(data), Readable.from(data)],
  {
    highWaterMark: 16,
  }
);

for await (const object of stream) {
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

### Class MultiObjectReadable

```ts
new MultiObjectReadable(streams: Readable[], opts?: MultiObjectReadableOptions): MultiObjectReadable
```

- `streams`: Readable[]
- `opts` (Optional) : MultiObjectReadableOptions

### Interface MultiObjectReadableOptions

equivalent to `MultiBufferReadableOptions`

## License

MIT
