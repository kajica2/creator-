
import { GeometricModel, Geometry, GeometryElement } from '../types';

const getPointOnCircle = (radius: number, angle: number, cx = 0, cy = 0) => {
    return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
    };
};

const generateNewJerusalem = (size: number): Geometry => {
    const r = size;
    const elements: GeometryElement[] = [];

    // Outer circle
    elements.push({ type: 'circle', props: { cx: 0, cy: 0, r, className: 'drawing' } });
    
    // Inner circles from ratios
    const ratios = [0.88, 0.70, 0.5];
    ratios.forEach((ratio, i) => {
        elements.push({ type: 'circle', props: { cx: 0, cy: 0, r: r * ratio, className: 'drawing', animationDelay: `${100 * (i + 1)}ms` } });
    });

    // Dodecagon
    const dodecagonRadius = r * ratios[1];
    const points = [];
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        points.push(getPointOnCircle(dodecagonRadius, angle));
    }

    for (let i = 0; i < 12; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 12];
        elements.push({
            type: 'line',
            props: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, className: 'drawing', animationDelay: `${500 + i * 50}ms`, strokeWidth: 1.5, stroke: 'rgb(250 204 21)' },
            id: `v${i}`,
            data: { index: i, radius: dodecagonRadius }
        });
    }

    return elements;
};

const generatePlatoLambda = (size: number): Geometry => {
    const elements: GeometryElement[] = [];
    const apex = { x: 0, y: -size * 0.8 };
    const leftBase = { x: -size, y: size * 0.8 };
    const rightBase = { x: size, y: size * 0.8 };

    const powersOf2 = [1, 2, 4, 8];
    const powersOf3 = [1, 3, 9, 27];
    
    // Left leg (powers of 2)
    for (let i = 0; i < powersOf2.length; i++) {
        const t = i / (powersOf2.length - 1);
        const x = apex.x + t * (leftBase.x - apex.x);
        const y = apex.y + t * (leftBase.y - apex.y);
        elements.push({ type: 'circle', props: { cx: x, cy: y, r: 20, className: 'drawing', stroke: 'rgb(250 204 21)', fill: 'rgb(30 41 59)', animationDelay: `${i * 100}ms` }, id: `p2_${i}`, data: { value: powersOf2[i] }});
        elements.push({ type: 'text', props: { x, y, content: powersOf2[i].toString(), textAnchor: 'middle', dy: '0.3em', fill: 'white', fontSize: '1.2rem' } });
    }

    // Right leg (powers of 3)
     for (let i = 0; i < powersOf3.length; i++) {
        if (i === 0) continue; // Skip the '1'
        const t = i / (powersOf3.length - 1);
        const x = apex.x + t * (rightBase.x - apex.x);
        const y = apex.y + t * (rightBase.y - apex.y);
        elements.push({ type: 'circle', props: { cx: x, cy: y, r: 20, className: 'drawing', stroke: 'rgb(250 204 21)', fill: 'rgb(30 41 59)', animationDelay: `${(powersOf2.length + i -1) * 100}ms` }, id: `p3_${i}`, data: { value: powersOf3[i] } });
        elements.push({ type: 'text', props: { x, y, content: powersOf3[i].toString(), textAnchor: 'middle', dy: '0.3em', fill: 'white', fontSize: '1.2rem' } });
    }
    
    return elements;
};


const generateHeptagram = (size: number): Geometry => {
    const r = size;
    const elements: GeometryElement[] = [];
    const points = [];
    for (let i = 0; i < 7; i++) {
        const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
        points.push(getPointOnCircle(r, angle));
    }
    
    elements.push({ type: 'circle', props: { cx: 0, cy: 0, r, className: 'drawing', animationDelay: '500ms' } });

    // Draw the heptagram by connecting every third point
    for (let i = 0; i < 7; i++) {
        const p1 = points[i];
        const p2 = points[(i + 3) % 7];
        elements.push({
            type: 'line',
            props: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, className: 'drawing', stroke: 'rgb(250 204 21)', strokeWidth: 1.5, animationDelay: `${i * 100}ms` },
            id: `v${i}`,
            data: { index: i }
        });
    }

    return elements;
};

const generateDurerPentagon = (size: number): Geometry => {
    const r = size;
    const elements: GeometryElement[] = [];
    const phi = (1 + Math.sqrt(5)) / 2;

    // Based on Durer's construction method
    const a = { x: 0, y: -r };
    const b = { x: 0, y: r };
    
    // Construction circles
    elements.push({type: 'circle', props: {cx: a.x, cy: a.y, r, className:'drawing', strokeDasharray: '5 5' }});
    elements.push({type: 'circle', props: {cx: b.x, cy: b.y, r, className:'drawing', strokeDasharray: '5 5', animationDelay: '100ms' }});
    
    // Intersection points for vesica piscis
    const p1 = { x: -r * Math.sqrt(3)/2, y: 0 };
    const p2 = { x: r * Math.sqrt(3)/2, y: 0 };
    
    const m = { x: (p1.x + b.x) / 2, y: (p1.y + b.y) / 2 };
    const radiusM = Math.sqrt((b.x - m.x)**2 + (b.y - m.y)**2);
    
    elements.push({type: 'line', props: { x1: a.x, y1: a.y, x2: b.x, y2: b.y, className:'drawing', animationDelay: '200ms', strokeDasharray: '2 2' }})

    const topPoint = getPointOnCircle(r, -Math.PI/2);
    const pentagonPoints = [];
    for(let i=0; i < 5; i++) {
        pentagonPoints.push(getPointOnCircle(r, -Math.PI/2 + (i * 2 * Math.PI) / 5));
    }
    
    // Polygon
    elements.push({
        type: 'polygon',
        props: {
            points: pentagonPoints.map(p => `${p.x},${p.y}`).join(' '),
            className: 'drawing',
            stroke: 'rgb(250 204 21)',
            strokeWidth: 2,
            animationDelay: '500ms'
        },
        id: 'pentagon',
        data: { points: pentagonPoints }
    });
    
    return elements;
};

export const generateGeometry = (model: GeometricModel, size: number): Geometry => {
    switch (model.key) {
        case 'newJerusalem':
            return generateNewJerusalem(size);
        case 'platoLambda':
            return generatePlatoLambda(size);
        case 'heptagram':
            return generateHeptagram(size);
        case 'durerPentagon':
            return generateDurerPentagon(size);
        default:
            return [];
    }
};
