# Substrate

> A crack growth simulation inspired by bacterial growth patterns and substrate decomposition.

## Algorithm

Substrate simulates the growth of cracks across a surface, where new cracks spawn at intersections and grow until they hit boundaries or other cracks. The result resembles organic decomposition patterns, bacterial colonies, or dried earth.

## Parameters

- **initial_cracks**: Starting crack count (3-10)
- **growth_rate**: Crack extension speed
- **spawn_chance**: Probability of new crack at intersection
- **turn_factor**: Angular deviation during growth
- **substrate_density**: Background material density

## Implementation

```javascript
class Crack {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.active = true;
    }

    step() {
        if (!this.active) return;

        // Move forward
        this.x += Math.cos(this.angle) * growth_rate;
        this.y += Math.sin(this.angle) * growth_rate;

        // Check for collisions
        if (this.hitBoundary() || this.hitCrack()) {
            this.active = false;
            this.spawnNewCracks();
        }

        // Random angular deviation
        this.angle += (Math.random() - 0.5) * turn_factor;
    }
}
```

## Visual Characteristics

- Branching crack networks
- Organic decomposition patterns
- High contrast line work
- Natural boundary formation
- Emergent cellular structures

## Inspiration

Based on Jared Tarbell's original substrate algorithm, exploring the beauty of natural crack formation and growth patterns found in dried earth, bacterial colonies, and material stress patterns.