// biome-ignore-file lint/nursery/preferLogicalPropertyNames -- Database schema relies on width/height columns
import { promises as fs } from 'fs';
import path from 'path';
import formidable from 'formidable';
import JSZip from 'jszip';
import { fileTypeFromBuffer } from 'file-type';
import { lookup as lookupMime } from 'mime-types';
import { createHash, randomUUID } from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import sizeOf from 'image-size';
import { verifySupabaseRequest } from './_supabaseAuth.js';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '500mb',
  },
};

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
]);

const SUPPORTED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/ogg',
]);

const SUPPORTED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
]);

const USER_MEDIA_BUCKET = 'user-media';

const TEXTUAL_MIME_PREFIXES = ['text/', 'application/json', 'application/xml'];

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const geminiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

type RagSourceMetadata = {
  summary?: string;
  tags?: string[];
  companyUrl?: string;
  detectedText?: string[];
  detectedLogos?: string[];
  detectedObjects?: string[];
  dominantColors?: string[];
  sourceType?: 'image' | 'video' | 'audio' | 'text' | 'other';
  originalFilename?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  checksum?: string;
  assetId?: string;
  mimeType?: string;
  assetCategory?: 'image' | 'video' | 'audio' | 'document' | 'other';
  storageBucket?: string;
  storagePath?: string;
  publicUrl?: string;
  extra?: Record<string, any>;
};

interface RagSource {
  id: string;
  type: 'batch_import';
  name: string;
  content: string;
  mimeType: string;
  status: 'ready';
  metadata?: RagSourceMetadata;
  dataUrl?: string;
}

interface BatchImportSummary {
  processed: number;
  failed: number;
  ignored: number;
  durationMs: number;
  collectionName?: string;
}

const parseForm = (request: any): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 1024 * 1024 * 1024, // 1GB
  });

  return new Promise((resolve, reject) => {
    form.parse(request, (error, fields, files) => {
      if (error) {
        reject(error);
      } else {
        resolve({ fields, files });
      }
    });
  });
};

const getArchiveFile = (files: formidable.Files): formidable.File | null => {
  const archive = files.archive || files.file || files.data;
  if (!archive) {
    return null;
  }
  if (Array.isArray(archive)) {
    return archive[0] ?? null;
  }
  return archive as formidable.File;
};

const inferMimeType = async (buffer: Buffer, fallbackName: string): Promise<string> => {
  const detected = await fileTypeFromBuffer(buffer);
  if (detected?.mime) {
    return detected.mime;
  }
  const lookup = lookupMime(fallbackName);
  if (lookup) {
    return lookup;
  }
  return 'application/octet-stream';
};

const determineSourceType = (mimeType: string): RagSourceMetadata['sourceType'] => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (TEXTUAL_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))) return 'text';
  return 'other';
};

const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'asset';

const formatFileSize = (bytes?: number | null): string | null => {
  if (!bytes || bytes <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const formatDuration = (durationMs?: number | null): string | null => {
  if (!durationMs || durationMs <= 0) return null;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')} min`;
};

const extractTagsFromFilename = (filename: string): string[] => {
  const base = filename.replace(/\.[^/.]+$/, '');
  return base
    .split(/[\s_\-]+/)
    .map(segment => segment.toLowerCase())
    .filter(segment => segment.length >= 3 && /^[a-z0-9]+$/.test(segment))
    .slice(0, 8);
};

const mapSourceTypeToCategory = (sourceType: RagSourceMetadata['sourceType']): RagSourceMetadata['assetCategory'] => {
  switch (sourceType) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'text':
      return 'document';
    default:
      return 'other';
  }
};

const uploadToSupabaseStorage = async ({
  userId,
  buffer,
  mimeType,
  filename,
  collectionName,
}: {
  userId: string;
  buffer: Buffer;
  mimeType: string;
  filename: string;
  collectionName?: string;
}): Promise<{ bucket: string; path: string; publicUrl?: string }> => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured');
  }

  const extensionFromName = path.extname(filename).replace('.', '').toLowerCase();
  const inferredExtension = (mimeType.split('/')[1] || 'bin').split(';')[0];
  const extension = extensionFromName || inferredExtension || 'bin';
  const baseName = slugify(path.basename(filename, path.extname(filename)));
  const sanitizedFile = `${baseName}-${Date.now()}.${extension}`;
  const collectionSegment = collectionName ? slugify(collectionName) : 'library';
  const pathSegments = [userId, collectionSegment, sanitizedFile].filter(Boolean);
  const storagePath = pathSegments.join('/');

  const { error: uploadError } = await supabaseAdmin.storage
    .from(USER_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabaseAdmin.storage.from(USER_MEDIA_BUCKET).getPublicUrl(storagePath);
  return {
    bucket: USER_MEDIA_BUCKET,
    path: storagePath,
    publicUrl: data?.publicUrl ?? undefined,
  };
};

const buildContextContent = ({
  fileName,
  companyUrl,
  summary,
  tags,
  detectedLogos,
  detectedObjects,
  detectedText,
  dominantColors,
  notes,
  mimeType,
  sizeBytes,
  durationMs,
  sourceType,
}: {
  fileName: string;
  companyUrl?: string;
  summary: string;
  tags: string[];
  detectedLogos: string[];
  detectedObjects: string[];
  detectedText: string[];
  dominantColors: string[];
  notes?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationMs?: number;
  sourceType?: RagSourceMetadata['sourceType'];
}) => {
  const formattedSize = formatFileSize(sizeBytes);
  const formattedDuration = formatDuration(durationMs);

  const lines = [
    `Asset: ${fileName}`,
    sourceType ? `Type: ${sourceType.toUpperCase()}${mimeType ? ` (${mimeType})` : ''}` : mimeType ? `MIME: ${mimeType}` : null,
    formattedSize ? `Size: ${formattedSize}` : null,
    formattedDuration ? `Duration: ${formattedDuration}` : null,
    companyUrl ? `Company URL: ${companyUrl}` : null,
    notes ? `Collection Notes: ${notes}` : null,
    `Summary: ${summary}`,
    tags.length > 0 ? `Tags: ${tags.join(', ')}` : null,
    detectedLogos.length > 0 ? `Detected Logos: ${detectedLogos.join(', ')}` : null,
    detectedObjects.length > 0 ? `Objects: ${detectedObjects.join(', ')}` : null,
    detectedText.length > 0 ? `On-Image Text: ${detectedText.join(' | ')}` : null,
    dominantColors.length > 0 ? `Dominant Colors: ${dominantColors.join(', ')}` : null,
  ].filter(Boolean);

  return lines.join('\n');
};

const analyzeImage = async (
  buffer: Buffer,
  mimeType: string,
  companyUrl?: string,
  notes?: string,
): Promise<Required<RagSourceMetadata>> => {
  const baseMetadata: Required<RagSourceMetadata> = {
    summary: '',
    tags: [],
    companyUrl,
    detectedText: [],
    detectedLogos: [],
    detectedObjects: [],
    dominantColors: [],
    sourceType: 'image',
    originalFilename: undefined,
    sizeBytes: buffer.byteLength,
    ['width']: undefined,
    ['height']: undefined,
    durationMs: undefined,
    checksum: undefined,
    assetId: undefined,
    mimeType,
    assetCategory: 'image',
    storageBucket: undefined,
    storagePath: undefined,
    publicUrl: undefined,
    extra: {},
  };

  if (!geminiClient) {
    return baseMetadata;
  }

  try {
    const prompt = [
      'You are a brand intelligence analyst. Examine the provided image and return a concise JSON object.',
      'Keep summary under 80 words.',
      'Generate 5-12 high-signal tags (kebab-case preferred).',
      'List any recognized logos, brand marks, or text. Use uppercase for brand names.',
      'Detect notable objects or visual elements.',
      'Approximate dominant colors using common color names or hex codes.',
      companyUrl ? `Company URL context: ${companyUrl}` : '',
      notes ? `Collection notes: ${notes}` : '',
      'Respond using the schema.',
    ]
      .filter(Boolean)
      .join('\n');

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: buffer.toString('base64') } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedLogos: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedText: { type: Type.ARRAY, items: { type: Type.STRING } },
            dominantColors: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['summary', 'tags'],
        },
      },
    });

    const text = (response as any)?.response?.text?.();
    if (!text) {
      return baseMetadata;
    }

    const parsed = JSON.parse(text);

    return {
      ...baseMetadata,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag: any) => typeof tag === 'string') : [],
      detectedLogos: Array.isArray(parsed.detectedLogos)
        ? parsed.detectedLogos.filter((entry: any) => typeof entry === 'string')
        : [],
      detectedObjects: Array.isArray(parsed.detectedObjects)
        ? parsed.detectedObjects.filter((entry: any) => typeof entry === 'string')
        : [],
      detectedText: Array.isArray(parsed.detectedText)
        ? parsed.detectedText.filter((entry: any) => typeof entry === 'string')
        : [],
      dominantColors: Array.isArray(parsed.dominantColors)
        ? parsed.dominantColors.filter((entry: any) => typeof entry === 'string')
        : [],
      extra: parsed,
    };
  } catch (error) {
    console.error('Failed to analyze image with Gemini', error);
    return baseMetadata;
  }
};

const analyzeTextDocument = async (
  textContent: string,
  mimeType: string,
  companyUrl?: string,
  notes?: string,
): Promise<Required<RagSourceMetadata>> => {
  const truncated = textContent.slice(0, 6000);

  const fallbackTags = Array.from(
    new Set(
      truncated
        .toLowerCase()
        .match(/\b[a-z0-9]{4,}\b/g)
        ?.slice(0, 12) ?? [],
    ),
  );

  const baseMetadata: Required<RagSourceMetadata> = {
    summary: truncated.slice(0, 280),
    tags: fallbackTags,
    companyUrl,
    detectedText: [],
    detectedLogos: [],
    detectedObjects: [],
    dominantColors: [],
    sourceType: 'text',
    originalFilename: undefined,
    sizeBytes: Buffer.byteLength(textContent, 'utf8'),
    ['width']: undefined,
    ['height']: undefined,
    durationMs: undefined,
    checksum: undefined,
    assetId: undefined,
    mimeType,
    assetCategory: 'document',
    storageBucket: undefined,
    storagePath: undefined,
    publicUrl: undefined,
    extra: {},
  };

  if (!geminiClient) {
    return baseMetadata;
  }

  try {
    const prompt = [
      'You are a knowledge graph builder.',
      'Summarize the provided document in under 120 words.',
      'Return 5-12 context-rich tags (kebab-case preferred).',
      'Highlight any brand names, products, or web URLs that appear.',
      companyUrl ? `Focus on relevance to ${companyUrl}.` : '',
      notes ? `Additional collection notes: ${notes}` : '',
      'Respond strictly as JSON.',
    ]
      .filter(Boolean)
      .join('\n');

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        role: 'user',
        parts: [
          { text: `${prompt}\n\nDocument:\n${truncated}` },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedLogos: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedText: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['summary', 'tags'],
        },
      },
    });

    const text = (response as any)?.response?.text?.();
    if (!text) {
      return baseMetadata;
    }
    const parsed = JSON.parse(text);

    return {
      ...baseMetadata,
      summary: typeof parsed.summary === 'string' ? parsed.summary : baseMetadata.summary,
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag: any) => typeof tag === 'string') : baseMetadata.tags,
      detectedLogos: Array.isArray(parsed.detectedLogos)
        ? parsed.detectedLogos.filter((entry: any) => typeof entry === 'string')
        : [],
      detectedObjects: Array.isArray(parsed.detectedObjects)
        ? parsed.detectedObjects.filter((entry: any) => typeof entry === 'string')
        : [],
      detectedText: Array.isArray(parsed.detectedText)
        ? parsed.detectedText.filter((entry: any) => typeof entry === 'string')
        : [],
      extra: parsed,
    };
  } catch (error) {
    console.error('Failed to analyze text document with Gemini', error);
    return baseMetadata;
  }
};

const analyzeAudioBuffer = async (
  fileName: string,
  buffer: Buffer,
  mimeType: string,
  companyUrl?: string,
  notes?: string,
): Promise<Required<RagSourceMetadata>> => {
  const inferredTags = Array.from(new Set(['audio', 'music', ...extractTagsFromFilename(fileName)]));
  const summary = `Audio track "${fileName}" uploaded${formatFileSize(buffer.byteLength) ? ` (${formatFileSize(buffer.byteLength)})` : ''}. ${
    notes ? notes : 'Ready for playlisting, remixes, or campaign drops.'
  }`;

  return {
    summary,
    tags: inferredTags,
    companyUrl,
    detectedText: [],
    detectedLogos: [],
    detectedObjects: [],
    dominantColors: [],
    sourceType: 'audio',
    originalFilename: fileName,
    sizeBytes: buffer.byteLength,
    ['width']: undefined,
    ['height']: undefined,
    durationMs: undefined,
    checksum: undefined,
    assetId: undefined,
    mimeType,
    assetCategory: 'audio',
    storageBucket: undefined,
    storagePath: undefined,
    publicUrl: undefined,
    extra: { notes },
  };
};

const analyzeVideoBuffer = async (
  fileName: string,
  buffer: Buffer,
  mimeType: string,
  companyUrl?: string,
  notes?: string,
): Promise<Required<RagSourceMetadata>> => {
  const inferredTags = Array.from(new Set(['video', 'clip', ...extractTagsFromFilename(fileName)]));
  const summary = `Video clip "${fileName}" imported${formatFileSize(buffer.byteLength) ? ` (${formatFileSize(buffer.byteLength)})` : ''}. ${
    notes ? notes : 'Ready for edits, reels, and campaign remixing.'
  }`;

  return {
    summary,
    tags: inferredTags,
    companyUrl,
    detectedText: [],
    detectedLogos: [],
    detectedObjects: [],
    dominantColors: [],
    sourceType: 'video',
    originalFilename: fileName,
    sizeBytes: buffer.byteLength,
    ['width']: undefined,
    ['height']: undefined,
    durationMs: undefined,
    checksum: undefined,
    assetId: undefined,
    mimeType,
    assetCategory: 'video',
    storageBucket: undefined,
    storagePath: undefined,
    publicUrl: undefined,
    extra: { notes },
  };
};

const createSupabaseRecord = async (
  userId: string | null,
  source: RagSource,
  metadata: RagSourceMetadata,
  options: {
    companyUrl?: string;
    collectionName?: string;
    notes?: string;
  },
  storage?: {
    bucket?: string;
    path?: string;
    publicUrl?: string;
    mimeType?: string;
    assetCategory?: RagSourceMetadata['assetCategory'];
  },
) => {
  if (!supabaseAdmin || !userId) {
    return;
  }

  try {
    const assetCategory = storage?.assetCategory ?? metadata.assetCategory ?? mapSourceTypeToCategory(metadata.sourceType);
    const mimeType = storage?.mimeType ?? metadata.mimeType ?? source.mimeType;
    const mergedMetadata = {
      ...metadata,
      storageBucket: storage?.bucket ?? metadata.storageBucket,
      storagePath: storage?.path ?? metadata.storagePath,
      publicUrl: storage?.publicUrl ?? metadata.publicUrl,
      assetCategory,
      mimeType,
    };

    await supabaseAdmin.from('media_assets').insert({
      id: source.id,
      user_id: userId,
      company_url: options.companyUrl ?? null,
      original_filename: mergedMetadata.originalFilename ?? source.name,
      mime_type: mimeType,
      asset_category: assetCategory ?? null,
      size_bytes: mergedMetadata.sizeBytes ?? null,
      'width': (mergedMetadata as any)['width'] ?? null,
      'height': (mergedMetadata as any)['height'] ?? null,
      duration_ms: mergedMetadata.durationMs ?? null,
      checksum: mergedMetadata.checksum ?? null,
      tags: mergedMetadata.tags ?? [],
      summary: mergedMetadata.summary ?? null,
      metadata: mergedMetadata,
      collection_name: options.collectionName ?? null,
      notes: options.notes ?? null,
      storage_bucket: storage?.bucket ?? mergedMetadata.storageBucket ?? null,
      storage_path: storage?.path ?? mergedMetadata.storagePath ?? null,
      source_url: storage?.publicUrl ?? mergedMetadata.publicUrl ?? null,
    });
  } catch (error) {
    console.error('Failed to persist media asset to Supabase', error);
  }
};

export default async function handler(request: any, response: any) {
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const authResult = await verifySupabaseRequest(request);
    if (authResult.error && supabaseAdmin) {
      response.status(401).json({ error: authResult.error });
      return;
    }
    const userId = authResult.user?.id ?? null;

    const { fields, files } = await parseForm(request);
    const archiveFile = getArchiveFile(files);

    if (!archiveFile) {
      response.status(400).json({ error: 'Archive (.zip) file is required under the "archive" field.' });
      return;
    }

    if (!archiveFile.originalFilename?.toLowerCase().endsWith('.zip')) {
      response.status(400).json({ error: 'Provided file is not a .zip archive.' });
      return;
    }

    const companyUrl = typeof fields.companyUrl === 'string' ? fields.companyUrl.trim() || undefined : undefined;
    const collectionName =
      typeof fields.collectionName === 'string' ? fields.collectionName.trim() || undefined : undefined;
    const notes = typeof fields.notes === 'string' ? fields.notes.trim() || undefined : undefined;

    const archiveBuffer = await fs.readFile(archiveFile.filepath);
    const zip = await JSZip.loadAsync(archiveBuffer);

    const start = Date.now();
    const sources: RagSource[] = [];
    const errors: Array<{ filename: string; reason: string }> = [];
    let processed = 0;
    let failed = 0;
    let ignored = 0;

    const entryNames = Object.keys(zip.files);

    for (const entryName of entryNames) {
      const entry = zip.files[entryName];
      if (!entry || entry.dir) {
        continue;
      }

      const fileName = path.basename(entry.name);
      try {
        const buffer = await entry.async('nodebuffer');

        const mimeType = await inferMimeType(buffer, fileName);
        const sourceType = determineSourceType(mimeType);

        const isSupportedImage = sourceType === 'image' && SUPPORTED_IMAGE_TYPES.has(mimeType);
        const isSupportedVideo = sourceType === 'video' && SUPPORTED_VIDEO_TYPES.has(mimeType);
        const isSupportedAudio = sourceType === 'audio' && SUPPORTED_AUDIO_TYPES.has(mimeType);
        const isSupportedText = sourceType === 'text';

        if (!isSupportedImage && !isSupportedVideo && !isSupportedAudio && !isSupportedText) {
          ignored++;
          continue;
        }

        const checksum = createHash('sha256').update(buffer).digest('hex');

        const metadata: RagSourceMetadata = {
          companyUrl,
          originalFilename: entry.name,
          sizeBytes: buffer.byteLength,
          checksum,
          sourceType,
          mimeType,
        };

        let analysis: Required<RagSourceMetadata>;

        if (sourceType === 'image') {
          try {
            const dimensions = sizeOf(buffer);
            metadata['width'] = dimensions.width;
            metadata['height'] = dimensions.height;
          } catch (error) {
            console.warn(`Could not extract dimensions for ${fileName}`, error);
          }
          analysis = await analyzeImage(buffer, mimeType, companyUrl, notes);
        } else if (sourceType === 'video') {
          analysis = await analyzeVideoBuffer(entry.name, buffer, mimeType, companyUrl, notes);
        } else if (sourceType === 'audio') {
          analysis = await analyzeAudioBuffer(entry.name, buffer, mimeType, companyUrl, notes);
        } else {
          const textContent = buffer.toString('utf8');
          analysis = await analyzeTextDocument(textContent, mimeType, companyUrl, notes);
        }

        const combinedMetadata: RagSourceMetadata = {
          ...metadata,
          ...analysis,
        };

        combinedMetadata.mimeType = mimeType;
        const assetCategory = mapSourceTypeToCategory(sourceType);
        combinedMetadata.assetCategory = combinedMetadata.assetCategory ?? assetCategory;

        const sourceId = randomUUID();
        combinedMetadata.assetId = sourceId;
        const contextContent = buildContextContent({
          fileName: entry.name,
          companyUrl,
          summary: combinedMetadata.summary ?? '',
          tags: combinedMetadata.tags ?? [],
          detectedLogos: combinedMetadata.detectedLogos ?? [],
          detectedObjects: combinedMetadata.detectedObjects ?? [],
          detectedText: combinedMetadata.detectedText ?? [],
          dominantColors: combinedMetadata.dominantColors ?? [],
          notes,
          mimeType,
          sizeBytes: combinedMetadata.sizeBytes,
          durationMs: combinedMetadata.durationMs,
          sourceType,
        });

        const ragSource: RagSource = {
          id: sourceId,
          type: 'batch_import',
          name: entry.name,
          content: contextContent,
          mimeType: 'text/plain',
          status: 'ready',
          metadata: combinedMetadata,
        };

        if (sourceType === 'image' && buffer.byteLength <= 1024 * 1024) {
          ragSource.dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
        }

        let storageInfo: { bucket: string; path: string; publicUrl?: string } | undefined;
        if (userId && sourceType !== 'text') {
          try {
            storageInfo = await uploadToSupabaseStorage({
              userId,
              buffer,
              mimeType,
              filename: entry.name,
              collectionName,
            });
            combinedMetadata.storageBucket = storageInfo.bucket;
            combinedMetadata.storagePath = storageInfo.path;
            combinedMetadata.publicUrl = storageInfo.publicUrl;
          } catch (uploadError) {
            failed++;
            console.error(`Failed to store ${fileName}`, uploadError);
            errors.push({
              filename: entry.name,
              reason: uploadError instanceof Error ? uploadError.message : 'Storage upload failed',
            });
            continue;
          }
        }

        await createSupabaseRecord(
          userId,
          ragSource,
          combinedMetadata,
          {
            companyUrl,
            collectionName,
            notes,
          },
          storageInfo
            ? {
                ...storageInfo,
                mimeType,
                assetCategory,
              }
            : {
                mimeType,
                assetCategory,
              },
        );

        sources.push(ragSource);
        processed++;
      } catch (error) {
        failed++;
        console.error(`Failed to process ${fileName}`, error);
        errors.push({
          filename: entry.name,
          reason: error instanceof Error ? error.message : 'Unknown processing error',
        });
      }
    }

    const summary: BatchImportSummary = {
      processed,
      failed,
      ignored,
      durationMs: Date.now() - start,
      collectionName,
    };

    response.status(200).json({
      sources,
      summary,
      errors,
    });
  } catch (error) {
    console.error('Batch media import failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    response.status(500).json({ error: message });
  }
}

