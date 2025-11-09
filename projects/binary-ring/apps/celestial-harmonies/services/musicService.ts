
import { GeometricModel, Geometry, MusicSequence, MusicalNote } from '../types';

const BASE_FREQ = 261.63; // C4

const generateDiatonicScale = (baseFreq: number): number[] => {
    const ratios = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8]; // Major scale ratios
    return ratios.map(r => baseFreq * r);
};

const musicFromNewJerusalem = (geometry: Geometry, tempo: number): MusicSequence => {
    const notes: MusicalNote[] = [];
    const beatDuration = 60 / tempo;
    let currentTime = 0;

    const dodecagonVertices = geometry.filter(el => el.id?.startsWith('v'));
    if (dodecagonVertices.length === 0) return { notes: [], totalDuration: 0 };
    
    const scale = [
      BASE_FREQ, // C
      BASE_FREQ * 5/4, // E
      BASE_FREQ * 3/2, // G
      BASE_FREQ * 2, // C5
    ];
    
    dodecagonVertices.forEach((vertex, i) => {
        const noteDuration = beatDuration / 2;
        notes.push({
            freq: scale[i % scale.length],
            startTime: currentTime,
            duration: noteDuration,
            id: vertex.id
        });
        currentTime += beatDuration / 2;
    });

    return { notes, totalDuration: currentTime };
};

const musicFromPlatoLambda = (geometry: Geometry, tempo: number): MusicSequence => {
    const notes: MusicalNote[] = [];
    const beatDuration = 60 / tempo;
    let currentTime = 0;

    const p2Elements = geometry.filter(el => el.id?.startsWith('p2_')).sort((a,b) => a.data.value - b.data.value);
    const p3Elements = geometry.filter(el => el.id?.startsWith('p3_')).sort((a,b) => a.data.value - b.data.value);
    
    const scale = generateDiatonicScale(BASE_FREQ / 2);

    p2Elements.forEach((el) => {
        notes.push({
            freq: scale[Math.log2(el.data.value)],
            startTime: currentTime,
            duration: beatDuration,
            id: el.id
        });
        currentTime += beatDuration;
    });

    currentTime += beatDuration; // Pause between series

    p3Elements.forEach((el, i) => {
        notes.push({
            freq: scale[i + 1] * 1.5, // Different scale for variety
            startTime: currentTime,
            duration: beatDuration,
            id: el.id
        });
        currentTime += beatDuration;
    });

    return { notes, totalDuration: currentTime };
};

const musicFromHeptagram = (geometry: Geometry, tempo: number): MusicSequence => {
    const notes: MusicalNote[] = [];
    const beatDuration = 60 / tempo;
    let currentTime = 0;
    
    const vertices = geometry.filter(el => el.id?.startsWith('v')).sort((a,b) => a.data.index - b.data.index);
    if (vertices.length === 0) return { notes: [], totalDuration: 0 };

    const scale = generateDiatonicScale(BASE_FREQ);

    const sequence = [0, 3, 6, 2, 5, 1, 4]; // Order of connections
    
    sequence.forEach((noteIndex, i) => {
        notes.push({
            freq: scale[noteIndex],
            startTime: currentTime,
            duration: beatDuration,
            id: `v${i}`
        });
        currentTime += beatDuration;
    });
    
    // Repeat and resolve
    sequence.slice(0, 3).forEach((noteIndex, i) => {
        notes.push({
            freq: scale[noteIndex],
            startTime: currentTime,
            duration: beatDuration / 2,
            id: `v${sequence.length + i}`
        });
        currentTime += beatDuration / 2;
    });
     notes.push({
            freq: scale[0] * 2,
            startTime: currentTime,
            duration: beatDuration * 2,
            id: `v_end`
    });
    currentTime += beatDuration * 2;


    return { notes, totalDuration: currentTime };
};

const musicFromDurerPentagon = (geometry: Geometry, tempo: number): MusicSequence => {
    const notes: MusicalNote[] = [];
    const beatDuration = 60 / tempo;
    let currentTime = 0;

    const pentagon = geometry.find(el => el.id === 'pentagon');
    if (!pentagon || !pentagon.data?.points) return { notes: [], totalDuration: 0 };

    const points = pentagon.data.points;

    const phi = (1 + Math.sqrt(5)) / 2;
    const majorThird = 5/4;

    const scale = [BASE_FREQ, BASE_FREQ * majorThird, BASE_FREQ * phi, BASE_FREQ * 2];
    
    points.forEach((point: {x:number, y:number}, i: number) => {
       notes.push({
            freq: scale[i % 4],
            startTime: currentTime,
            duration: beatDuration,
            id: `pentagon_v${i}`
        });
        currentTime += beatDuration;
    });

    notes.push({
        freq: BASE_FREQ * 2,
        startTime: currentTime,
        duration: beatDuration * 2,
        id: 'pentagon_resolve'
    });
    currentTime += beatDuration * 2;


    return { notes, totalDuration: currentTime };
};

const transpose = (freq: number, semitones: number): number => {
    return freq * Math.pow(2, semitones / 12);
};

const extendComposition = (baseSequence: MusicSequence, targetBars: 32 | 64, tempo: number): MusicSequence => {
    if (baseSequence.notes.length === 0 || baseSequence.totalDuration === 0) return baseSequence;

    const allNotes: MusicalNote[] = [];
    let currentTime = 0;
    
    const theme = baseSequence.notes;
    const themeDuration = baseSequence.totalDuration;
    
    const barDuration = (60 / tempo) * 4; // Assuming 4/4 time
    const targetDuration = targetBars * barDuration;

    // A structure of transformations to apply to the base theme
    const musicalBlocks: { transpose: number, waveform: MusicalNote['waveform'] }[] = [
        { transpose: 0, waveform: 'sine' },      // Section A: Original theme
        { transpose: 0, waveform: 'triangle' },  // Section A': Timbre variation
        { transpose: 7, waveform: 'square' },    // Section B: Transposed up a perfect fifth
        { transpose: 0, waveform: 'sine' },      // Section A: Return to original
        { transpose: -5, waveform: 'sawtooth'},  // Section C: Transposed down a perfect fourth
        { transpose: 0, waveform: 'triangle' },  // Section A': Timbre variation
        { transpose: 5, waveform: 'square'},     // Section D: Transposed up a major third
        { transpose: -12, waveform: 'sine'},     // Section A'': Down an octave
    ];

    let blockIndex = 0;
    while (currentTime < targetDuration) {
        const block = musicalBlocks[blockIndex % musicalBlocks.length];
        
        const newNotes = theme.map(note => ({
            ...note,
            freq: transpose(note.freq, block.transpose),
            startTime: note.startTime + currentTime,
            waveform: block.waveform,
        }));

        allNotes.push(...newNotes);
        currentTime += themeDuration;
        blockIndex++;
    }

    return { notes: allNotes, totalDuration: currentTime };
};


export const generateMusic = (
    model: GeometricModel, 
    geometry: Geometry, 
    tempo: number,
    compositionLength: 'short' | 'medium' | 'long' = 'short'
): MusicSequence => {
    let baseSequence: MusicSequence;
    switch (model.key) {
        case 'newJerusalem':
            baseSequence = musicFromNewJerusalem(geometry, tempo);
            break;
        case 'platoLambda':
            baseSequence = musicFromPlatoLambda(geometry, tempo);
            break;
        case 'heptagram':
            baseSequence = musicFromHeptagram(geometry, tempo);
            break;
        case 'durerPentagon':
            baseSequence = musicFromDurerPentagon(geometry, tempo);
            break;
        default:
            baseSequence = { notes: [], totalDuration: 0 };
    }

    if (compositionLength === 'short' || !baseSequence) {
        return baseSequence || { notes: [], totalDuration: 0 };
    }
    
    const targetBars = compositionLength === 'medium' ? 32 : 64;
    return extendComposition(baseSequence, targetBars, tempo);
};
