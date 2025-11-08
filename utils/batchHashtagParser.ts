export interface ParsedHashtagSet {
  personaName: string;
  description?: string;
  sets: Array<{
    type: 'primary' | 'secondary' | 'niche' | 'custom';
    label: string;
    hashtags: string[];
  }>;
}

const SET_LABEL_MAP: Record<string, { type: ParsedHashtagSet['sets'][number]['type']; label: string }> = {
  'primary set': { type: 'primary', label: 'Primary Set' },
  primary: { type: 'primary', label: 'Primary Set' },
  'secondary set': { type: 'secondary', label: 'Secondary Set' },
  secondary: { type: 'secondary', label: 'Secondary Set' },
  'niche set': { type: 'niche', label: 'Niche Set' },
  niche: { type: 'niche', label: 'Niche Set' },
};

const normalizeHeader = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/:/g, '')
    .trim();
};

const dedupeHashtags = (hashtags: string[]): string[] => {
  const seen = new Set<string>();
  return hashtags.reduce<string[]>((acc, tag) => {
    const normalized = tag.trim();
    if (!normalized) {
      return acc;
    }
    const formatted = normalized.startsWith('#') ? normalized : `#${normalized.replace(/^#+/, '')}`;
    const key = formatted.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      acc.push(formatted);
    }
    return acc;
  }, []);
};

interface ParseState {
  personaName: string | null;
  descriptionLines: string[];
  currentSet: {
    type: ParsedHashtagSet['sets'][number]['type'];
    label: string;
    hashtags: string[];
  } | null;
  sets: ParsedHashtagSet['sets'];
}

const initializeState = (): ParseState => ({
  personaName: null,
  descriptionLines: [],
  currentSet: null,
  sets: [],
});

const finalizeCurrentSet = (state: ParseState) => {
  if (!state.currentSet) {
    return;
  }
  const deduped = dedupeHashtags(state.currentSet.hashtags);
  if (deduped.length === 0) {
    state.currentSet = null;
    return;
  }
  state.sets.push({
    type: state.currentSet.type,
    label: state.currentSet.label,
    hashtags: deduped,
  });
  state.currentSet = null;
};

const finalizePersona = (state: ParseState, results: ParsedHashtagSet[]) => {
  finalizeCurrentSet(state);
  if (!state.personaName) {
    return;
  }
  if (state.sets.length === 0) {
    throw new Error(`No hashtag sets found for persona "${state.personaName}".`);
  }
  results.push({
    personaName: state.personaName,
    description: state.descriptionLines.join(' ').trim() || undefined,
    sets: state.sets,
  });
  state.personaName = null;
  state.descriptionLines = [];
  state.currentSet = null;
  state.sets = [];
};

export const parseBatchHashtagInput = (input: string): ParsedHashtagSet[] => {
  if (!input.trim()) {
    throw new Error('Input is empty. Please paste the persona and hashtag sets.');
  }

  const lines = input.split(/\r?\n/);
  const state = initializeState();
  const results: ParsedHashtagSet[] = [];

  const startNewPersona = (line: string) => {
    finalizePersona(state, results);
    state.personaName = line.trim();
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    const normalized = normalizeHeader(line);
    const matchedHeader = SET_LABEL_MAP[normalized];

    if (matchedHeader) {
      if (!state.personaName) {
        throw new Error(`Encountered "${matchedHeader.label}" before specifying a persona name.`);
      }
      finalizeCurrentSet(state);
      state.currentSet = {
        type: matchedHeader.type,
        label: matchedHeader.label,
        hashtags: [],
      };
      return;
    }

    if (!state.personaName) {
      startNewPersona(line);
      return;
    }

    if (state.currentSet) {
      state.currentSet.hashtags.push(line);
      return;
    }

    const possibleNewPersona = normalizeHeader(line);
    if (SET_LABEL_MAP[possibleNewPersona]) {
      // Handles the scenario where headers appear without colon but without blank lines.
      return;
    }

    if (state.sets.length > 0) {
      startNewPersona(line);
      return;
    }

    state.descriptionLines.push(line);
  });

  finalizePersona(state, results);

  if (results.length === 0) {
    throw new Error('Unable to parse input. Ensure it includes a persona name and at least one hashtag set.');
  }

  return results;
};


