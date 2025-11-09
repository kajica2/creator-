# Buddhabrot

> A fractal rendering algorithm that traces the paths of escaping points in the Mandelbrot set.

## Algorithm

The Buddhabrot is created by plotting the trajectories of points that escape the Mandelbrot set. Unlike traditional Mandelbrot visualization which colors points based on escape time, the Buddhabrot accumulates the paths taken by escaping points, creating organic, Buddha-like silhouettes.

## Parameters

- **iterations**: Maximum iterations before escape (1000-10000)
- **samples**: Number of random points to test (1M-100M)
- **bounds**: Complex plane viewing window
- **coloring**: Path density to color mapping

## Implementation

```javascript
// Core buddhabrot algorithm
function buddhabrot(width, height, iterations, samples) {
    const density = new Array(width * height).fill(0);

    for (let sample = 0; sample < samples; sample++) {
        const c = randomComplex();
        const path = mandelbrotPath(c, iterations);

        if (path.escaped) {
            for (const point of path.trajectory) {
                const [x, y] = complexToPixel(point, width, height);
                if (inBounds(x, y, width, height)) {
                    density[y * width + x]++;
                }
            }
        }
    }

    return density;
}
```

## Visual Characteristics

- Organic, flowing forms
- High contrast silhouettes
- Intricate internal structure
- Natural symmetry patterns
- Deep zooming capabilities

## Variations

- **Nebulabrot**: Multi-iteration rendering
- **Anti-Buddhabrot**: Non-escaping point paths
- **Color Buddhabrot**: RGB channel separation by iteration count