
import { GeometricModel, ModelKey } from './types';

export const GEOMETRIC_MODELS: Record<ModelKey, GeometricModel> = {
  newJerusalem: {
    key: 'newJerusalem',
    name: 'The New Jerusalem Diagram',
    description: 'A foundational figure in sacred geometry, representing the cosmic city described in the Book of Revelation. It is constructed from a square and a circle of equal perimeter, symbolizing the union of heaven and earth.',
    source: 'John Michell, "The Dimensions of Paradise"',
    sonificationRule: 'Music is generated from the ratios of the radii of the concentric circles and the vertices of the inner dodecagon, creating a harmonious and stable chord progression.',
  },
  platoLambda: {
    key: 'platoLambda',
    name: "Plato's Lambda",
    description: 'A diagram from Plato\'s Timaeus representing the creation of the World Soul. It consists of two geometric progressions, 1, 2, 4, 8 (powers of 2) and 1, 3, 9, 27 (powers of 3), which form the basis of Pythagorean musical scales.',
    source: "Plato, 'Timaeus'",
    sonificationRule: 'The numbers of the Lambda sequence are directly translated into a musical scale. The two series are played as ascending arpeggios, representing the unfolding of the cosmos.',
  },
  heptagram: {
    key: 'heptagram',
    name: 'The Heptagram of Revelation',
    description: 'A seven-pointed star, a mystical symbol associated with the seven planets of classical antiquity, the seven days of creation, and the seven spirits of God. Its geometry is complex and considered sacred.',
    source: 'Symbolism in "Book of Revelation"',
    sonificationRule: 'A diatonic scale is mapped to the seven vertices of the star. A melody is created by tracing the lines of the heptagram, producing a sequence that is both cyclical and intricate.',
  },
  durerPentagon: {
    key: 'durerPentagon',
    name: "Dürer's Pentagon Construction",
    description: "Albrecht Dürer's classic method for constructing a regular pentagon using only a compass and straightedge. The pentagon is rich in proportions related to the Golden Ratio (phi, φ), a fundamental constant in nature and art.",
    source: "Albrecht Dürer, 'Four Books on Measurement'",
    sonificationRule: 'The construction lines and vertices of the pentagon are sonified. Ratios of line lengths based on the Golden Ratio are used to create consonant musical intervals, reflecting the inherent harmony of the shape.',
  }
};
