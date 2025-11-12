import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation


GRID_ROWS = 32
GRID_COLS = 64
FRAME_COUNT = 100
ASCII_PALETTE = np.array(list(" .:-=+*#%@"))
FIG_SIZE = (6, 6)

rng = np.random.default_rng()

fig, ax = plt.subplots(figsize=FIG_SIZE)
fig.patch.set_facecolor("black")
ax.set_axis_off()
ax.set_xlim(0, GRID_COLS)
ax.set_ylim(GRID_ROWS, 0)

ascii_text = ax.text(
    0,
    0,
    "",
    fontfamily="monospace",
    fontsize=10,
    color="#00ffcc",
    ha="left",
    va="top",
)


def build_wave_frame(frame_index: int) -> np.ndarray:
    x = np.linspace(0, 10, GRID_COLS)
    shimmer_mask = rng.choice([0, 1], size=GRID_COLS, p=[0.2, 0.8])
    waveform = np.sin(x + frame_index / 6) * shimmer_mask
    normalized = np.clip((waveform + 1) / 2, 0, 1)
    intensity_grid = np.repeat(normalized[np.newaxis, :], GRID_ROWS, axis=0)
    return intensity_grid


def apply_glitch(intensity_grid: np.ndarray, frame_index: int) -> np.ndarray:
    glitched = intensity_grid.copy()

    slice_count = rng.integers(1, 4)
    for _ in range(slice_count):
        row = rng.integers(0, GRID_ROWS)
        shift = rng.integers(-5, 6)
        glitched[row] = np.roll(glitched[row], shift)

    band_count = rng.integers(1, 3)
    for _ in range(band_count):
        start = rng.integers(0, GRID_ROWS)
        height = rng.integers(1, max(2, GRID_ROWS // 4))
        end = min(GRID_ROWS, start + height)
        blend = rng.uniform(0.3, 0.7)
        noise = rng.uniform(0, 1, size=(end - start, GRID_COLS))
        glitched[start:end] = np.clip(
            glitched[start:end] * blend + noise * (1 - blend),
            0,
            1,
        )

    if frame_index % 7 == 0:
        glitch_col = rng.integers(0, GRID_COLS)
        glitched[:, glitch_col] = rng.uniform(0, 1, size=GRID_ROWS)

    return glitched


def map_to_ascii(intensity_grid: np.ndarray) -> np.ndarray:
    clipped = np.clip(intensity_grid, 0, 1)
    indices = (clipped * (len(ASCII_PALETTE) - 1)).astype(int)
    return ASCII_PALETTE[indices]


def build_ascii_text(frame_index: int) -> str:
    base_grid = build_wave_frame(frame_index)
    glitched_grid = apply_glitch(base_grid, frame_index)
    ascii_grid = map_to_ascii(glitched_grid)
    joined_rows = ["".join(row) for row in ascii_grid]
    return "\n".join(joined_rows)


def init():
    ascii_text.set_text("")
    return ascii_text,


def update(frame_index: int):
    ascii_frame = build_ascii_text(frame_index)
    if frame_index % 2 == 0:
        ascii_text.set_color("#00ffcc")
    else:
        ascii_text.set_color("#ff66cc")
    ascii_text.set_text(ascii_frame)
    return ascii_text,


ani = FuncAnimation(
    fig,
    update,
    frames=FRAME_COUNT,
    init_func=init,
    blit=True,
)

ani.save("binary_shimmer.gif", writer="pillow")

