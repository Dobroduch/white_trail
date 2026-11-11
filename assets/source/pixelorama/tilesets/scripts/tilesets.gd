# Tileset painter for THE WHITE TRAIL (native density, 16×16 tiles, 8 columns, no margin/spacing).
# sheet("black_ram_exterior") -> Image (128×80): the Black Ram Hotel exterior tileset used by
# assets/levels/black_ram_exterior.tmj. TILE ORDER IS FIXED: Tiled stores tiles by index, so a tile
# may be repainted but never moved; add new tiles at the end.
#
# Only colours from the central palette (src/data/palette.js) are used, so the export passes
# `node tools/palette.mjs --check --strict`. Lighting is left to the engine, except the glow tiles
# (winlit_*, lamp_glow), which hold only the emissive pixels and go on a Tiled `glow` layer.
# Tiles that repeat (walls, roof, snow, boardwalk, posts, rail) are seamless with themselves:
# horizontally, and vertically where they stack (wall, post, lamp pole, chimney).
#
# Run in Pixelorama (MCP eval_gdscript) with assets/source/pixelorama/tilesets/black_ram_exterior.pxo
# open; see README.md next to this file.
extends RefCounted

const T = 16
const COLS = 8
const NAMES = [
	"wall", "wall_shadow", "roof", "roof_snow", "beam", "boardwalk", "boardwalk_edge", "snow_top",
	"snow_fill", "win_tl", "win_tr", "win_bl", "win_br", "winlit_tl", "winlit_tr", "winlit_bl",
	"winlit_br", "door_tl", "door_tr", "door_ml", "door_mr", "door_bl", "door_br", "sign_0",
	"sign_1", "sign_2", "sign_3", "sign_4", "sign_5", "post", "chimney", "chimney_top",
	"lamp_top", "lamp_pole", "lamp_glow", "rail", "drift", "wall_end_l", "wall_end_r", "shadow",
]

# central palette (subset in use), names as in src/data/palette.js
const P = {
	"ink": "#0b0d14", "navy2": "#0f1524", "navy3": "#161e2e", "purple2": "#21183a", "dusk": "#43304a",
	"slate0": "#1c2434", "slate1": "#232d3f", "slate2": "#2b3649", "slate4": "#475569", "bone": "#f1f5f9",
	"snow0": "#5d6a80", "snow1": "#7d8aa0", "snow2": "#a3afc2", "snow3": "#c8d1de", "snow4": "#e4e9f0",
	"wood0": "#1a120d", "wood1": "#2a1c14", "wood2": "#3b2a1e", "wood3": "#4e3826", "wood4": "#634832", "wood5": "#7a5a3e",
	"iron": "#24272e", "iron2": "#3a3f4a", "stone0": "#3d3834", "stone1": "#565049", "stone2": "#635c55", "stone4": "#8d8574",
	"flame0": "#a65c2c", "flame1": "#b56e22", "flame2": "#d68a3f", "flame3": "#e0a04a", "flame4": "#e6b66c", "flame5": "#fcd36b", "flame6": "#fff1c8",
	"brass0": "#5e461c", "brass1": "#8a6a2a", "brass2": "#a07a3a",
}

const FONT = {"A": ["010", "101", "111", "101", "101"], "B": ["110", "101", "110", "101", "110"], "C": ["111", "100", "100", "100", "111"], "E": ["111", "100", "110", "100", "111"], "H": ["101", "101", "111", "101", "101"], "K": ["101", "110", "100", "110", "101"], "L": ["100", "100", "100", "100", "111"], "M": ["101", "111", "111", "101", "101"], "O": ["111", "101", "101", "101", "111"], "R": ["110", "101", "110", "101", "101"], "T": ["111", "010", "010", "010", "010"], " ": ["000", "000", "000", "000", "000"]}

var img
var W = 16
var H = 16
var cache = {}

func C(n):
	if not cache.has(n):
		cache[n] = Color.html(P[n])
	return cache[n]

# deterministic hash in [0, 1)
func hs(x, y, s):
	var n = int(x) * 374761393 + int(y) * 668265263 + s * 1013904223
	n = (n ^ (n >> 13)) * 1274126177
	return float((n ^ (n >> 16)) & 1023) / 1023.0

func newimg(w, h):
	W = w
	H = h
	img = Image.create(w, h, false, Image.FORMAT_RGBA8)

func p(x, y, n):
	if x >= 0 and y >= 0 and x < W and y < H:
		img.set_pixel(int(x), int(y), C(n))

func r(x, y, w, h, n):
	for j in range(int(h)):
		for i in range(int(w)):
			p(x + i, y + j, n)

func hl(x0, x1, y, n):
	for x in range(int(x0), int(x1) + 1):
		p(x, y, n)

func vl(x, y0, y1, n):
	for y in range(int(y0), int(y1) + 1):
		p(x, y, n)

# ---------------------------------------------------------------- walls
# Three hewn log courses per tile (5 + 5 + 6 px, so stacked tiles repeat): a lit top edge, grain
# dashes, a shaded underside and a dark chinking seam. `dark` = the wall under the porch roof.
const COURSES = [[0, 5], [5, 5], [10, 6]]

func logs(dark):
	var hi = "wood2" if dark else "wood3"
	var body = "wood1" if dark else "wood2"
	var lo = "wood0" if dark else "wood1"
	for ci in range(3):
		var y0 = COURSES[ci][0]
		var h = COURSES[ci][1]
		for k in range(h):
			for x in range(T):
				var t = hs(x, y0 + k, 11 + ci)
				var c = body
				if k == h - 1:
					c = "wood0"
				elif k == 0:
					c = hi if t > 0.2 else body
				elif k == h - 2:
					c = lo if t > 0.4 else body
				elif k == 1 + (ci % 2) and (x + ci * 6) % 11 < 4:
					c = lo # grain streak
				elif t > 0.94:
					c = lo
				elif t < 0.04 and not dark:
					c = hi
				p(x, y0 + k, c)
	# knots
	p(11, 2, lo); p(12, 2, lo); p(11, 1, hi)
	p(4, 13, lo); p(5, 13, lo); p(4, 12, hi)

func t_wall():
	logs(false)

func t_wall_shadow():
	logs(true)

# log ends at the corner of the building: round butt ends with growth rings
func log_ends(left):
	logs(false)
	for c in COURSES:
		var y0 = c[0]
		var h = c[1] - 1
		for k in range(h):
			for i in range(4):
				var x = i if left else 15 - i
				var edge = (k == 0 or k == h - 1 or i == 0)
				var n = "wood4"
				if edge:
					n = "wood5" if (k == 0 or (i == 0 and left)) else "wood3"
				elif k == h / 2 and i == 2:
					n = "wood2" # pith
				p(x, y0 + k, n)
		p(4 if left else 11, y0 + h - 1, "wood0")
	vl(4 if left else 11, 0, 15, "wood0")

func t_wall_end_l():
	log_ends(true)

func t_wall_end_r():
	log_ends(false)

func t_shadow():
	for y in range(T):
		for x in range(T):
			p(x, y, "wood1" if hs(x, y, 5) > 0.88 else "wood0")

# ---------------------------------------------------------------- roof
func shingles(y0, y1):
	for y in range(y0, y1 + 1):
		var row = y / 4
		var off = (row % 2) * 3
		for x in range(T):
			var t = hs(x, y, 21)
			var n = "wood1"
			if y % 4 == 3 or (x + off) % 6 == 0:
				n = "wood0"
			elif y % 4 == 0 and t > 0.45:
				n = "wood2"
			elif t > 0.93:
				n = "iron"
			p(x, y, n)

func t_roof():
	shingles(0, 11)
	hl(0, 15, 12, "wood0")
	hl(0, 15, 13, "wood4") # fascia board, lit edge
	hl(0, 15, 14, "wood3")
	hl(0, 15, 15, "wood1")
	for x in [2, 9, 13]:
		p(x, 14, "wood2")

# snow lying on the roof ridge: uneven top, lit rim, shaded lip, shingles below
const SNOWTOP = [5, 4, 4, 3, 3, 4, 4, 5, 5, 4, 3, 3, 3, 4, 5, 5]

func t_roof_snow():
	shingles(10, 15)
	for x in range(T):
		var top = SNOWTOP[x]
		for y in range(top, 10):
			var t = hs(x, y, 31)
			var n = "snow3"
			if y == top:
				n = "snow4"
			elif y == top + 1:
				n = "snow4" if t > 0.5 else "snow3"
			elif y == 8:
				n = "snow2"
			elif y == 9:
				n = "snow1"
			if t < 0.03 and y > top:
				n = "bone"
			p(x, y, n)
		if hs(x, 0, 32) > 0.72:
			p(x, 10, "snow2") # lip drip over the shingles

# ---------------------------------------------------------------- porch beam between the floors
func t_beam():
	for x in range(T):
		var t = hs(x, 0, 41)
		p(x, 0, "snow4" if t > 0.35 else "snow3")
		p(x, 1, "snow3")
		p(x, 2, "snow3" if hs(x, 2, 41) > 0.3 else "snow2")
		p(x, 3, "snow2")
		p(x, 4, "snow1")
	hl(0, 15, 5, "wood5")
	r(0, 6, 16, 4, "wood4")
	for x in range(T):
		if hs(x, 7, 42) > 0.85:
			p(x, 7, "wood3")
	hl(0, 15, 10, "wood3")
	p(3, 7, "iron2"); p(11, 8, "iron2") # nail heads
	hl(0, 15, 11, "wood1")
	r(0, 12, 16, 4, "wood0") # shadow under the porch roof
	for ic in [[3, 3], [7, 1], [12, 2]]: # icicles
		vl(ic[0], 12, 12 + ic[1], "snow2")
		p(ic[0], 12, "snow3")

# ---------------------------------------------------------------- boardwalk
func boardwalk_base():
	for x in range(T):
		p(x, 0, "snow4" if hs(x, 0, 51) > 0.6 else "snow3")
		p(x, 1, "wood5")
		var gap = x % 8 == 7
		for y in range(2, 4):
			p(x, y, "wood1" if gap else ("wood3" if hs(x, y, 52) > 0.7 else "wood4"))
	hl(0, 15, 4, "wood1")
	hl(0, 15, 5, "wood4") # front stringer
	r(0, 6, 16, 2, "wood3")
	hl(0, 15, 8, "wood0")
	r(0, 9, 16, 7, "wood0") # dark crawlspace
	for y in range(9, 16):
		for x in range(T):
			if hs(x, y, 53) > 0.9:
				p(x, y, "ink")

func underdrift(seed):
	for x in range(T):
		var h = 2 + int(round(1.5 + 1.5 * sin(x * TAU / 16.0 + seed)))
		for k in range(h):
			p(x, 15 - k, "snow3" if k == h - 1 else "snow2")

func t_boardwalk():
	boardwalk_base()
	# joist post every 16 px
	vl(3, 9, 15, "wood3"); vl(4, 9, 15, "wood2"); vl(5, 9, 15, "wood1")
	underdrift(0.0)

func t_boardwalk_edge():
	boardwalk_base()
	# the corner post at the end of the walk, with a snow cap
	for y in range(0, 16):
		p(11, y, "wood4"); p(12, y, "wood3"); p(13, y, "wood3"); p(14, y, "wood2"); p(15, y, "wood1")
	hl(11, 15, 0, "snow4")
	underdrift(1.3)

# ---------------------------------------------------------------- snow ground
func t_snow_top():
	for y in range(T):
		for x in range(T):
			var t = hs(x, y, 61)
			var n = "snow2"
			if y == 0:
				n = "snow4" if t > 0.25 else "snow3"
			elif y < 3:
				n = "snow3" if t > 0.12 else "snow4"
			elif y < 7:
				n = "snow3" if (x + y) % 2 == 0 and t > 0.3 else "snow2"
			elif y < 12:
				n = "snow2" if t > 0.08 else "snow1"
			else:
				n = "snow1" if (x + y) % 2 == 0 and t > 0.35 else "snow2"
			if t > 0.985 and y > 0:
				n = "bone"
			p(x, y, n)

func t_snow_fill():
	for y in range(T):
		for x in range(T):
			var t = hs(x, y, 71)
			var n = "snow1"
			if y < 4:
				n = "snow2" if (x + y) % 2 == 0 and t > 0.55 else "snow1"
			elif y > 9:
				n = "snow0" if (x + y) % 2 == 0 and t > 0.3 else "snow1"
			if t > 0.97:
				n = "snow2"
			p(x, y, n)

# ---------------------------------------------------------------- windows (2×2 tiles, 32×32)
# A full window assembly (casing, header, sash, panes, snowy sill), opaque, so it sits on either
# wall. The lit version holds only the pane pixels: the engine draws it after the lighting pass.
func glass_px(x, y):
	var inx = (x >= 3 and x <= 14) or (x >= 17 and x <= 28)
	var iny = (y >= 5 and y <= 13) or (y >= 16 and y <= 24)
	return inx and iny

func window_piece(lit):
	newimg(32, 32)
	for y in range(32):
		for x in range(32):
			if lit:
				if not glass_px(x, y):
					continue
				var ly = y - 5 if y <= 13 else y - 16
				var n = "flame5" if ly < 3 else ("flame4" if ly < 6 else "flame3")
				if ly == 8:
					n = "flame2"
				if x <= 4 or x >= 27:
					n = "flame1" if y % 3 else "flame0" # curtain folds
				p(x, y, n)
				continue
			if glass_px(x, y):
				var lx = x - 3 if x <= 14 else x - 17
				var ly2 = y - 5 if y <= 13 else y - 16
				var n2 = "navy2"
				if lx + ly2 == 7 or lx + ly2 == 8:
					n2 = "slate1" # reflection streak
				if ly2 >= 7:
					n2 = "slate2" if (x + y) % 2 == 0 else "navy3" # frost
				if x <= 4 or x >= 27:
					n2 = "purple2" if y % 3 else "dusk" # curtains, faint indoors
				p(x, y, n2)
			else:
				p(x, y, "wood2")
	if lit:
		return # emissive tiles hold the glass only
	# casing
	vl(0, 0, 25, "wood4"); vl(1, 0, 25, "wood3")
	vl(30, 0, 25, "wood3"); vl(31, 0, 25, "wood1")
	hl(0, 31, 0, "wood5"); hl(0, 31, 1, "wood3"); hl(0, 31, 2, "wood3"); hl(1, 30, 3, "wood1")
	# sash frame and muntins
	vl(2, 4, 25, "wood1"); vl(29, 4, 25, "wood3")
	hl(2, 29, 4, "wood1"); hl(2, 29, 25, "wood3")
	vl(15, 5, 24, "wood3"); vl(16, 5, 24, "wood1")
	hl(3, 28, 14, "wood3"); hl(3, 28, 15, "wood1")
	# sill with snow, apron below
	for x in range(32):
		p(x, 26, "snow4" if hs(x, 26, 81) > 0.3 else "snow3")
	hl(0, 31, 27, "snow3")
	hl(0, 31, 28, "wood5")
	hl(0, 31, 29, "wood3")
	hl(1, 30, 30, "wood2")
	hl(1, 30, 31, "wood0")
	p(0, 30, "wood1"); p(31, 30, "wood1"); p(0, 31, "wood1"); p(31, 31, "wood1")

func window_lit():
	newimg(32, 32)
	window_piece(true)

# ---------------------------------------------------------------- door (2×3 tiles, 32×48)
func door_piece():
	newimg(32, 48)
	# slab: vertical boards with grain
	for y in range(48):
		for x in range(32):
			var t = hs(x, y, 91)
			var n = "wood2"
			if (x - 3) % 6 == 5:
				n = "wood1"
			elif t > 0.92:
				n = "wood1"
			elif t < 0.04:
				n = "wood3"
			p(x, y, n)
	# transom window, warm and dim through the glass
	r(3, 4, 26, 6, "wood1")
	for y in range(5, 9):
		for x in range(4, 28):
			p(x, y, "flame1" if (x + y) % 2 == 0 else "flame0")
	vl(11, 5, 8, "wood1"); vl(20, 5, 8, "wood1")
	hl(3, 28, 9, "wood3")
	# raised panels: shadowed top/left inner edge, lit bottom/right
	for pnl in [[6, 13, 9, 13], [17, 13, 9, 13], [6, 29, 9, 13], [17, 29, 9, 13]]:
		var px0 = pnl[0]
		var py0 = pnl[1]
		hl(px0, px0 + pnl[2] - 1, py0, "wood1"); vl(px0, py0, py0 + pnl[3] - 1, "wood1")
		hl(px0, px0 + pnl[2] - 1, py0 + pnl[3] - 1, "wood3"); vl(px0 + pnl[2] - 1, py0, py0 + pnl[3] - 1, "wood3")
		r(px0 + 2, py0 + 2, pnl[2] - 4, pnl[3] - 4, "wood3")
		hl(px0 + 2, px0 + pnl[2] - 3, py0 + 2, "wood4")
	# knob and escutcheon
	vl(24, 26, 29, "iron2"); p(23, 27, "brass2"); p(23, 28, "brass1"); p(25, 27, "brass0")
	# kick plate, threshold with snow dust
	r(3, 42, 26, 3, "iron2"); hl(3, 28, 42, "stone2")
	hl(0, 31, 45, "wood4"); hl(0, 31, 46, "wood3")
	for x in range(32):
		p(x, 47, "snow3" if hs(x, 47, 92) > 0.4 else "snow2")
	# casing and header
	vl(0, 0, 44, "wood4"); vl(1, 0, 44, "wood3"); vl(2, 0, 44, "wood1")
	vl(29, 0, 44, "wood3"); vl(30, 0, 44, "wood3"); vl(31, 0, 44, "wood1")
	hl(0, 31, 0, "wood5"); hl(0, 31, 1, "wood3"); hl(0, 31, 2, "wood3"); hl(1, 30, 3, "wood1")

# ---------------------------------------------------------------- sign (6×1 tiles, 96×16)
func sign_piece():
	newimg(96, 16)
	for x in range(1, 95):
		p(x, 1, "snow3")
		if hs(x, 0, 101) > 0.45:
			p(x, 0, "snow4")
	for y in range(2, 14):
		for x in range(96):
			var t = hs(x, y, 102)
			var n = "wood1"
			if (y == 6 or y == 10) and (x / 7) % 3 == 0:
				n = "wood0"
			elif t > 0.93:
				n = "wood0"
			elif t < 0.05:
				n = "wood2"
			p(x, y, n)
	hl(0, 95, 2, "wood4"); hl(1, 94, 3, "wood3"); hl(1, 94, 12, "wood3"); hl(0, 95, 13, "wood0")
	vl(0, 2, 13, "wood4"); vl(1, 3, 12, "wood3"); vl(94, 3, 12, "wood3"); vl(95, 2, 13, "wood0")
	var s = "BLACK RAM HOTEL"
	var x0 = (96 - (s.length() * 4 - 1)) / 2
	for pass_i in range(2):
		var x = x0
		for ch in s:
			var gl = FONT.get(ch, FONT[" "])
			for j in range(5):
				for i in range(3):
					if gl[j][i] == "1":
						if pass_i == 0:
							p(x + i + 1, 6 + j + 1, "brass0") # drop shadow
						else:
							p(x + i, 6 + j, "brass2" if j < 3 else "brass1")
			x += 4
	# small brass diamonds at the ends
	for cx in [9, 86]:
		p(cx, 7, "brass2"); p(cx - 1, 8, "brass1"); p(cx + 1, 8, "brass2"); p(cx, 9, "brass1")

# ---------------------------------------------------------------- posts, chimney, lamp, rail, drift
func t_post():
	newimg(16, 16)
	for y in range(T):
		p(5, y, "wood4"); p(6, y, "wood3"); p(7, y, "wood3"); p(8, y, "wood2"); p(9, y, "wood2"); p(10, y, "wood1")
		if y % 7 == 3:
			p(7, y, "wood2")
	p(8, 9, "wood1"); p(6, 13, "wood4")

func bricks(y0, y1):
	for y in range(y0, y1 + 1):
		var row = y / 4
		for x in range(3, 13):
			var t = hs(x / 5 + row * 7, row, 111)
			var n = "stone2" if t < 0.65 else "stone1"
			if y % 4 == 3 or (x + (row % 2) * 2) % 5 == 4:
				n = "stone0"
			elif y % 4 == 0 and n == "stone2":
				n = "stone4" if hs(x, y, 112) > 0.6 else n
			p(x, y, n)
		p(3, y, "stone4" if y % 4 != 3 else "stone0")
		p(12, y, "stone0")

func t_chimney():
	bricks(0, 15)

func t_chimney_top():
	bricks(8, 15)
	hl(2, 13, 6, "stone1"); hl(2, 13, 7, "stone0") # cap slab
	hl(3, 12, 5, "snow3")
	for x in range(3, 13):
		if hs(x, 4, 113) > 0.35:
			p(x, 4, "snow4")
	p(2, 5, "snow3"); p(13, 5, "snow2")

func t_lamp_top():
	hl(6, 9, 0, "snow4"); hl(5, 10, 1, "snow3")
	hl(5, 10, 2, "iron2"); hl(4, 11, 3, "iron")
	vl(5, 4, 11, "iron"); vl(10, 4, 11, "iron"); hl(5, 10, 4, "iron2"); hl(5, 10, 11, "iron2")
	for y in range(5, 11):
		for x in range(6, 10):
			p(x, y, "slate2" if x == 6 else "navy3")
	p(7, 10, "brass1"); p(8, 10, "brass1")
	hl(6, 9, 12, "iron")
	for y in range(13, 16):
		p(7, y, "iron2"); p(8, y, "iron")

func t_lamp_glow():
	for y in range(5, 11):
		for x in range(6, 10):
			var n = "flame5"
			if y == 5:
				n = "flame4"
			elif y == 10:
				n = "flame2"
			elif (x == 7 or x == 8) and y >= 7 and y <= 9:
				n = "flame6"
			p(x, y, n)

func t_lamp_pole():
	for y in range(T):
		p(7, y, "iron2"); p(8, y, "iron")
	p(6, 6, "iron"); p(9, 6, "iron") # collar

func t_rail():
	for y in range(3, 16):
		p(1, y, "wood4"); p(2, y, "wood3"); p(3, y, "wood1")
	hl(1, 3, 2, "snow4")
	for x in range(T):
		p(x, 3, "snow4" if hs(x, 3, 121) > 0.5 else "snow3")
	hl(0, 15, 4, "wood4"); hl(0, 15, 5, "wood2"); hl(0, 15, 6, "wood1")
	hl(0, 15, 10, "wood3"); hl(0, 15, 11, "wood1")
	p(1, 4, "wood5"); p(1, 10, "wood4")

func t_drift():
	for x in range(T):
		var h = 5 + int(round(3.0 * sin(x * TAU / 16.0)))
		var lit = cos(x * TAU / 16.0) > 0.0
		for k in range(h):
			var y = 15 - k
			var n = "snow2"
			if k == h - 1:
				n = "snow4"
			elif k == h - 2:
				n = "snow3"
			elif lit:
				n = "snow3" if hs(x, y, 131) > 0.3 else "snow2"
			p(x, y, n)

# ---------------------------------------------------------------- assembly
func put(out, name, sx = 0, sy = 0):
	var i = NAMES.find(name)
	assert(i >= 0, "unknown tile " + name)
	out.blit_rect(img, Rect2i(sx, sy, T, T), Vector2i((i % COLS) * T, (i / COLS) * T))

func sheet(which = "black_ram_exterior"):
	var rows = int(ceil(NAMES.size() / float(COLS)))
	var out = Image.create(COLS * T, rows * T, false, Image.FORMAT_RGBA8)
	for name in ["wall", "wall_shadow", "roof", "roof_snow", "beam", "boardwalk", "boardwalk_edge", "snow_top",
			"snow_fill", "post", "chimney", "chimney_top", "lamp_top", "lamp_pole", "lamp_glow", "rail", "drift",
			"wall_end_l", "wall_end_r", "shadow"]:
		newimg(T, T)
		call("t_" + name)
		put(out, name)
	window_piece(false)
	put(out, "win_tl", 0, 0); put(out, "win_tr", 16, 0); put(out, "win_bl", 0, 16); put(out, "win_br", 16, 16)
	window_lit()
	put(out, "winlit_tl", 0, 0); put(out, "winlit_tr", 16, 0); put(out, "winlit_bl", 0, 16); put(out, "winlit_br", 16, 16)
	door_piece()
	var dn = ["door_tl", "door_tr", "door_ml", "door_mr", "door_bl", "door_br"]
	for k in range(6):
		put(out, dn[k], (k % 2) * T, (k / 2) * T)
	sign_piece()
	for k in range(6):
		put(out, "sign_" + str(k), k * T, 0)
	return out
