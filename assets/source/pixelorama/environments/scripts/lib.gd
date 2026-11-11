# Shared pixel-painting helpers for THE WHITE TRAIL environment scripts (native density).
# The loader concatenates this file with a scene script (room4.gd, sawmill.gd, ...) and calls
# paint(part) -> Image. All coordinates are NATIVE px (world units x 1.5). No anti-aliasing:
# every helper writes whole pixels; light falloff is banded + ordered dither.
extends RefCounted

var W = 600
var H = 270
var img

func C(h):
	return Color.html(h)

func hs(x, y, s):
	var n = int(x) * 374761393 + int(y) * 668265263 + s * 1013904223
	n = (n ^ (n >> 13)) * 1274126177
	return float((n ^ (n >> 16)) & 1023) / 1023.0

func newimg(w, h):
	W = w
	H = h
	img = Image.create(W, H, false, Image.FORMAT_RGBA8)
	return img

func p(x, y, c):
	if x >= 0 and y >= 0 and x < W and y < H:
		img.set_pixel(int(x), int(y), c)

func g(x, y):
	if x >= 0 and y >= 0 and x < W and y < H:
		return img.get_pixel(int(x), int(y))
	return Color(0, 0, 0, 0)

func r(x, y, w, h, c):
	for j in range(int(h)):
		for i in range(int(w)):
			p(x + i, y + j, c)

func hl(x0, x1, y, c):
	for x in range(int(x0), int(x1) + 1):
		p(x, y, c)

func vl(x, y0, y1, c):
	for y in range(int(y0), int(y1) + 1):
		p(x, y, c)

func ln(x0, y0, x1, y1, c):
	var n = int(max(abs(x1 - x0), abs(y1 - y0)))
	for i in range(n + 1):
		var t = float(i) / max(1, n)
		p(round(lerp(float(x0), float(x1), t)), round(lerp(float(y0), float(y1), t)), c)

func grain(x, y, w, h, base, dark, lite, seed):
	for j in range(int(h)):
		for i in range(int(w)):
			var c = base
			var gg = sin((i + hs(int(j / 3), 0, seed) * 40.0) * 0.21 + j * 0.9 + hs(0, int(i / 9), seed) * 6.0)
			if gg > 0.95:
				c = dark
			elif gg > 0.8 and hs(i + x, j + y, seed + 1) < 0.35:
				c = dark
			elif hs(i + x, j + y, seed) > 0.96:
				c = lite
			p(x + i, y + j, c)

func planks(y0, rows, rh, base, alt, d, l, top, seed):
	for row in range(rows):
		var yy = y0 + 1 + row * rh
		grain(0, yy, W, rh, base if row % 2 == 0 else alt, d, l, seed + row)
		hl(0, W - 1, yy, d)
		var x = -int(hs(row, 3, seed) * 60)
		while x < W:
			x += 50 + int(hs(row, x, seed + 9) * 40)
			vl(x, yy, yy + rh - 1, d)
			p(x + 1, yy + 1, l)
	hl(0, W - 1, y0, top)

# banded, dithered soft pool; mode "add" writes translucent light, "dark" translucent shadow
func pool(cx, cy, rad, col, amax, squash = 1.2):
	for y in range(int(cy - rad), int(cy + rad)):
		for x in range(int(cx - rad), int(cx + rad)):
			var d = sqrt(pow(x - cx, 2) + pow((y - cy) * squash, 2)) / rad
			if d >= 1.0:
				continue
			var band = floor((1.0 - d) * 4.0) / 4.0
			var a = amax * band
			if hs(x, y, 77) < fmod((1.0 - d) * 4.0, 1.0) * 0.5:
				a = amax * min(1.0, band + 0.25)
			if a <= 0.0:
				continue
			var old = g(x, y)
			p(x, y, Color(col.r, col.g, col.b, max(old.a, a)))

# snow cap along a top edge: uneven, with a lit rim and a shadowed underside
func snowcap(x0, x1, y, depth, seed):
	for x in range(int(x0), int(x1) + 1):
		var d = int(depth * (0.6 + hs(x / 4, 0, seed) * 0.6))
		for k in range(d):
			p(x, y - k, C("#a3b4be") if k < d - 1 else C("#d3dce0"))
		p(x, y + 1, C("#52677d"))
		if hs(x, 1, seed) > 0.8:
			p(x, y + 2, C("#a3b4be"))

func pine(cx, base, h, w, body, lite, snow, seed):
	for k in range(int(h)):
		var t = float(k) / h
		var half = int(w * 0.5 * t + 1)
		var notch = int(k % 6 == 5)
		for i in range(-half + notch, half - notch + 1):
			var c = body
			if i > half * 0.3 and hs(i, k, seed) < 0.5:
				c = lite
			if k % 6 == 0 and hs(i, k + 1, seed) < 0.55:
				c = snow
			p(cx + i, base - h + k, c)
	vl(cx, base - 3, base, C("#1a120d"))

# Sculpted snow between a ground line (gyc: Callable x -> y) and ybot. Low-frequency drift
# mounds get a lit windward face and a cold shadowed lee, a crisp crust line, sparkle, and
# darker compacted snow lower down, so the lantern has form to catch instead of a flat fill.
func snowfield(gyc, x0, x1, ybot, seed):
	for x in range(int(x0), int(x1)):
		var top = int(gyc.call(x))
		var m = sin(x * 0.045 + seed) * 0.6 + sin(x * 0.017 + seed * 2.0) * 0.4
		var slope = cos(x * 0.045 + seed) * 0.6 * 0.045 + cos(x * 0.017 + seed * 2.0) * 0.4 * 0.017
		for y in range(top, int(ybot)):
			var d = y - top
			var t = hs(x, y, seed)
			var c
			if d == 0:
				c = C("#e4e9f0") if t > 0.3 else C("#d3dce0")
			elif d < 3:
				c = C("#c8d1de") if t > 0.4 else C("#a3b4be")
			else:
				var depth = float(d) / max(1.0, ybot - top)
				var lit = slope > 0.004
				var shade = slope < -0.004
				if depth < 0.35:
					c = C("#a3b4be") if lit else (C("#7d8aa0") if shade else C("#8e9bb0"))
				elif depth < 0.7:
					c = C("#8e9bb0") if lit else (C("#5d6a80") if shade else C("#7d8aa0"))
				else:
					c = C("#6a7890") if not shade else C("#52677d")
				if t < 0.18:
					c = c.lerp(C("#52677d"), 0.4)
				elif t > 0.9:
					c = c.lerp(C("#c8d1de"), 0.4)
				# drift crests: a thin bright crust where a mound peaks
				if abs(d - int(6 + m * 5)) == 0 and lit:
					c = C("#c8d1de")
			if t < 0.006 and d > 0:
				c = C("#f1f5f9")
			p(x, y, c)

# Boot prints along the ground line: heel + toe dents with a lit rim on the far edge.
func bootprints(gyc, x0, x1, step, seed, dent):
	var x = x0
	var k = 0
	while x < x1:
		var y = int(gyc.call(x)) + 3 + (k % 2) * 3
		r(x, y, 5, 2, dent); p(x + 5, y, dent); p(x - 1, y + 1, dent)
		hl(x, x + 4, y - 1, C("#c8d1de"))
		x += step + int(hs(k, 0, seed) * 3)
		k += 1
