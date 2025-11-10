#!/bin/bash

# Audio Compression Script
# Converts all WAV files in shruti-box-samples to high-quality OGG Vorbis
# Expected compression: ~90% size reduction

SOURCE_DIR="audio/shruti-box-samples"
COMPRESSED_DIR="audio/shruti-box-samples-compressed"
BACKUP_DIR="audio/shruti-box-samples-backup"

echo "🎵 Starting Audio Compression Process..."
echo "📁 Source: $SOURCE_DIR"
echo "📁 Output: $COMPRESSED_DIR"
echo "📁 Backup: $BACKUP_DIR"
echo ""

# Count total files
TOTAL_FILES=$(ls "$SOURCE_DIR"/*.wav 2>/dev/null | wc -l)
echo "📊 Total files to convert: $TOTAL_FILES"
echo ""

# Initialize counter
CURRENT=0
TOTAL_ORIGINAL_SIZE=0
TOTAL_COMPRESSED_SIZE=0

# Process each WAV file
for wav_file in "$SOURCE_DIR"/*.wav; do
    if [ -f "$wav_file" ]; then
        CURRENT=$((CURRENT + 1))
        FILENAME=$(basename "$wav_file" .wav)

        # Calculate progress percentage
        PROGRESS=$((CURRENT * 100 / TOTAL_FILES))

        echo "[$CURRENT/$TOTAL_FILES] ($PROGRESS%) Converting: $FILENAME"

        # Get original file size
        ORIGINAL_SIZE=$(stat -f%z "$wav_file")
        TOTAL_ORIGINAL_SIZE=$((TOTAL_ORIGINAL_SIZE + ORIGINAL_SIZE))

        # Convert to OGG Vorbis with high quality (q:a 6 = ~192kbps VBR)
        ffmpeg -i "$wav_file" \
               -c:a libvorbis \
               -q:a 6 \
               "$COMPRESSED_DIR/${FILENAME}.ogg" \
               -y \
               -loglevel error

        # Check if conversion was successful
        if [ $? -eq 0 ]; then
            COMPRESSED_SIZE=$(stat -f%z "$COMPRESSED_DIR/${FILENAME}.ogg")
            TOTAL_COMPRESSED_SIZE=$((TOTAL_COMPRESSED_SIZE + COMPRESSED_SIZE))

            # Calculate compression ratio for this file
            RATIO=$((100 - (COMPRESSED_SIZE * 100 / ORIGINAL_SIZE)))
            echo "   ✅ Success! $(numfmt --to=iec $ORIGINAL_SIZE) → $(numfmt --to=iec $COMPRESSED_SIZE) ($RATIO% smaller)"
        else
            echo "   ❌ Error converting $FILENAME"
        fi

        echo ""
    fi
done

# Calculate total savings
if [ $TOTAL_FILES -gt 0 ]; then
    TOTAL_RATIO=$((100 - (TOTAL_COMPRESSED_SIZE * 100 / TOTAL_ORIGINAL_SIZE)))

    echo "🎉 Compression Complete!"
    echo "📊 Summary:"
    echo "   • Files processed: $TOTAL_FILES"
    echo "   • Original size: $(numfmt --to=iec $TOTAL_ORIGINAL_SIZE)"
    echo "   • Compressed size: $(numfmt --to=iec $TOTAL_COMPRESSED_SIZE)"
    echo "   • Space saved: $(numfmt --to=iec $((TOTAL_ORIGINAL_SIZE - TOTAL_COMPRESSED_SIZE)))"
    echo "   • Compression ratio: $TOTAL_RATIO%"
    echo ""
    echo "🔄 Next steps:"
    echo "   1. Test audio playback with compressed files"
    echo "   2. Update code to load .ogg instead of .wav files"
    echo "   3. Move originals to backup and replace with compressed versions"
else
    echo "❌ No WAV files found in $SOURCE_DIR"
fi