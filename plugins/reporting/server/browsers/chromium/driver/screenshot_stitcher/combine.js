import $streamToObservable from 'stream-to-observable';
import { PNG } from 'pngjs';
import { Observable } from 'rxjs';

// if we're only given one screenshot, and it matches the output dimensions
// we're going to skip the combination and just use it
const canUseFirstScreenshot = (screenshots, outputDimensions) => {
  if (screenshots.length !== 1) {
    return false;
  }

  const firstScreenshot = screenshots[0];
  return firstScreenshot.dimensions.width === outputDimensions.width && firstScreenshot.dimensions.height === outputDimensions.height;
};

export function $combine(screenshots, outputDimensions) {
  if (canUseFirstScreenshot(screenshots, outputDimensions)) {
    return Observable.of(screenshots[0].data);
  }

  const pngs$ = Observable.from(screenshots)
    .mergeMap(
      ({ data }) => {
        const png = new PNG();
        const buffer = Buffer.from(data, 'base64');
        const parseAsObservable = Observable.bindNodeCallback(png.parse.bind(png));
        return parseAsObservable(buffer);
      },
      ({ dimensions }, png) => ({ dimensions, png })
    );

  const output$ = pngs$
    .reduce(
      (output, { dimensions, png }) => {
        png.bitblt(output, 0, 0, dimensions.width, dimensions.height, dimensions.x, dimensions.y);
        return output;
      },
      new PNG({ width: outputDimensions.width, height: outputDimensions.height })
    );

  return output$
    .do(png => png.pack())
    .switchMap($streamToObservable)
    .toArray()
    .map(chunks => Buffer.concat(chunks).toString('base64'));
}
