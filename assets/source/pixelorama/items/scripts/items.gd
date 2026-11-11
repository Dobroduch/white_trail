# Inventory item illustrations for THE WHITE TRAIL (48x48, transparent, native density).
# Run inside Pixelorama via the MCP eval_gdscript loader (see README.md next to this file):
# paint(name) -> Image. Light comes from the upper left. Every object reuses the colours of its
# in-world counterpart (characters/lantern.png, the revolver grip on silas_vance.png, the brass key
# tags in the parlor pigeonholes, the sawmill watch / ledger props, the telegram DocumentView).
extends RefCounted

var W = 48
var H = 48
var img

const OUT = "#0d1018"

func C(h):
	return Color.html(h)

func hs(x, y, s):
	var n = int(x) * 374761393 + int(y) * 668265263 + s * 1013904223
	n = (n ^ (n >> 13)) * 1274126177
	return float((n ^ (n >> 16)) & 1023) / 1023.0

func newimg(w = 48, h = 48):
	W = w
	H = h
	img = Image.create(W, H, false, Image.FORMAT_RGBA8)
	return img

func p(x, y, c):
	if x >= 0 and y >= 0 and x < W and y < H:
		img.set_pixel(int(x), int(y), c if c is Color else C(c))

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

func disc(cx, cy, rad, c):
	for y in range(int(cy - rad - 1), int(cy + rad + 2)):
		for x in range(int(cx - rad - 1), int(cx + rad + 2)):
			if pow(x - cx, 2) + pow(y - cy, 2) <= rad * rad:
				p(x, y, c)

# 1px silhouette outline around everything opaque (4-neighbour), like the character sprites
func outline(col = OUT):
	var src = img.duplicate()
	var oc = C(col)
	for y in range(H):
		for x in range(W):
			if src.get_pixel(x, y).a > 0.05:
				continue
			for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
				var xx = x + d.x
				var yy = y + d.y
				if xx >= 0 and yy >= 0 and xx < W and yy < H and src.get_pixel(xx, yy).a > 0.05:
					img.set_pixel(x, y, oc)
					break

# ------------------------------------------------------------------ LANTERN
# characters/lantern.png scaled up in spirit: bail ring, vented cap, wide top plate, narrow collar,
# amber glass between two frame posts, collar, wide fount. Frame #4a4038 / lit #6e6052 / shade #3a3028.
func lantern():
	newimg()
	var B = C("#4a4038"); var L = C("#6e6052"); var D = C("#3a3028"); var DD = C("#2a221c")
	var brass = C("#c9973f"); var brassL = C("#e8c06a"); var brassD = C("#8a6428")
	var cx = 24
	# bail: a wire hoop over the cap, with the carrying ring at its top
	for a in range(0, 181, 4):
		var t = deg_to_rad(a)
		var x = cx - cos(t) * 9.0
		var y = 13 - sin(t) * 9.0
		p(round(x), round(y), L if a < 90 else B)
	r(cx - 2, 1, 5, 1, L); p(cx - 2, 2, L); p(cx + 2, 2, B); r(cx - 1, 3, 3, 1, D)
	p(cx - 9, 13, B); p(cx + 9, 13, D); p(cx - 9, 14, D); p(cx + 9, 14, D)
	# cap: a low dome with vent slots
	for y in range(6, 12):
		var half = 3 + (y - 6)
		for x in range(cx - half, cx + half + 1):
			var c = B
			if x < cx - half + 2 or (y == 6):
				c = L
			elif x > cx + half - 2:
				c = D
			p(x, y, c)
	for i in range(-2, 3):
		p(cx + i * 2, 9, DD)
		p(cx + i * 2, 10, DD)
	hl(cx - 1, cx + 1, 5, L)
	# top plate (the wide rim of the world sprite's row 3)
	hl(cx - 10, cx + 10, 12, L)
	hl(cx - 11, cx + 11, 13, B); p(cx - 11, 13, L)
	hl(cx - 11, cx + 11, 14, D)
	p(cx - 8, 13, brass); p(cx + 8, 13, brassD)
	# narrow collar
	r(cx - 6, 15, 13, 2, D); hl(cx - 6, cx - 3, 15, B)
	# glass chamber
	var gx0 = cx - 7
	var gx1 = cx + 7
	for y in range(17, 34):
		for x in range(gx0 + 1, gx1):
			var dx = abs(x - (cx - 0.5)) / 6.5
			var dy = abs(y - 26.0) / 9.0
			var d = sqrt(dx * dx * 0.9 + dy * dy)
			var c = C("#d68a3f")
			if d < 0.32:
				c = C("#fff1c8")
			elif d < 0.55:
				c = C("#f0c46a")
			elif d < 0.8:
				c = C("#e0a650") if hs(x, y, 3) > 0.5 else C("#d68a3f")
			elif d > 1.0:
				c = C("#b4652a")
			p(x, y, c)
	# flame: a narrow teardrop over the wick
	for y in range(22, 31):
		var w = [0, 0, 1, 1, 1, 2, 2, 1, 1][y - 22]
		for x in range(cx - w, cx + w + 1):
			p(x, y, C("#fff8e0") if abs(x - cx) < 1 or y < 25 else C("#fff1c8"))
	p(cx, 21, C("#fff1c8"))
	# reflections on the glass (light from the upper left)
	vl(gx0 + 2, 18, 24, C("#fff1c8")); vl(gx0 + 3, 19, 21, C("#f8dc98"))
	p(gx1 - 2, 31, C("#f0c46a"))
	# frame posts (lit on the left, warm-tinted where the glass light catches them)
	vl(gx0, 17, 33, L); vl(gx0 - 1, 17, 33, B)
	vl(gx1, 17, 33, D); vl(gx1 + 1, 17, 33, B)
	for y in range(18, 33, 3):
		p(gx0, y, C("#8a6a44"))
		p(gx1, y, C("#6a4a30"))
	# guard wires across the glass
	for gy in [20, 30]:
		for x in range(gx0 + 1, gx1):
			p(x, gy, D if (x + gy) % 3 != 0 else B)
	# wick burner (brass) at the foot of the glass
	r(cx - 3, 31, 7, 2, brass); hl(cx - 3, cx - 1, 31, brassL); p(cx + 3, 32, brassD)
	p(cx + 4, 30, brassD); p(cx + 5, 30, brass) # wick key
	# lower collar (row 9: B C B)
	r(cx - 7, 34, 15, 2, B); hl(cx - 7, cx - 2, 34, L); hl(cx + 4, cx + 7, 35, D)
	# fount (wide base) with a seam, brass rivets and wear
	for y in range(36, 44):
		var half = 10 if y < 43 else 9
		for x in range(cx - half, cx + half + 1):
			var c = B
			if y == 36 or x < cx - half + 2:
				c = L
			elif x > cx + half - 3 or y > 41:
				c = D
			if c == B and hs(x, y, 11) > 0.93:
				c = L # scratches
			p(x, y, c)
	hl(cx - 9, cx + 9, 39, D); hl(cx - 9, cx - 6, 39, B)
	for rx in [cx - 7, cx - 2, cx + 3, cx + 8]:
		p(rx, 37, brassL if rx < cx else brass)
	p(cx + 6, 41, brass); p(cx + 7, 41, brassD) # filler cap
	outline()
	return img

# ------------------------------------------------------------------ REVOLVER
# Single-action, blued steel, walnut grip with a steel butt cap (the grip under Silas's coat:
# #8f7f6a / #6b4630 / #4a2f1e on silas_vance.png).
func revolver():
	newimg()
	var s0 = C("#1c212c"); var s1 = C("#2a3442"); var s2 = C("#3c4a5c"); var s3 = C("#52627a"); var s4 = C("#8f9aab")
	var w1 = C("#4a2f1e"); var w2 = C("#6b4630"); var w3 = C("#8a5c3c")
	var cap = C("#8f7f6a")
	# barrel, muzzle at the right, front sight blade
	r(24, 16, 22, 4, s2); hl(24, 45, 16, s3); hl(25, 44, 17, s4); hl(24, 45, 19, s1)
	vl(45, 16, 19, s1); p(45, 17, s0); p(45, 18, s0)
	p(43, 15, s3); p(44, 15, s2)
	# ejector rod housing under the barrel, with its knob
	r(25, 20, 12, 2, s1); hl(25, 36, 20, s2); r(36, 20, 2, 2, s2); p(36, 20, s3)
	# frame (recoil shield, top strap with the rear-sight groove)
	r(13, 14, 12, 13, s2)
	hl(13, 24, 13, s3); p(16, 13, s0)
	vl(13, 14, 26, s3)
	# hammer, cocked: a spur rising back from the frame, checkered thumb piece
	r(12, 11, 3, 3, s2); vl(12, 11, 13, s3); p(14, 12, s1)
	r(9, 9, 4, 3, s2); hl(9, 12, 9, s3); p(9, 10, s3)
	p(10, 10, s0); p(12, 10, s0); p(11, 11, s1); p(9, 11, s1)
	# cylinder: six flutes catching the light along their upper halves
	for y in range(14, 25):
		for x in range(15, 25):
			var k = (x - 15) % 3
			var c = s1
			if k == 0:
				c = s0
			elif k == 1:
				c = s4 if y < 17 else (s3 if y < 20 else s2)
			p(x, y, c)
	hl(15, 24, 14, s4); hl(15, 24, 24, s0)
	p(16, 15, C("#c8d1de")); p(19, 15, C("#c8d1de"))
	# lower frame and trigger guard with the trigger inside
	r(14, 25, 12, 2, s2); hl(14, 25, 26, s1)
	for a in range(0, 181, 10):
		var t = deg_to_rad(a)
		p(round(22 + cos(t) * 4.0), round(27 + sin(t) * 4.0), s3 if a < 70 else s2)
	ln(21, 27, 20, 29, s0); p(19, 29, s1)
	# screws
	p(14, 21, s4); p(22, 25, s4)
	# walnut grip: the curved "plow handle", back strap and front strap in steel
	for y in range(27, 43):
		var t = float(y - 27) / 15.0
		var xl = int(round(13.0 - 7.0 * t + 1.2 * t * t))
		var xr = int(round(19.0 - 5.0 * t + 2.2 * t * t))
		for x in range(xl, xr + 1):
			var c = w2
			if x == xl:
				c = s1
			elif x == xr:
				c = s1
			elif x == xl + 1:
				c = w3
			elif x == xr - 1:
				c = w1
			elif sin((x * 0.8 - y * 0.5) * 1.6 + hs(0, y / 3, 4) * 2.5) > 0.85:
				c = w1
			p(x, y, c)
	# steel butt cap
	hl(7, 16, 43, cap); hl(8, 15, 44, C("#5a5044")); p(7, 43, C("#b0a28a")); p(8, 43, C("#b0a28a"))
	p(11, 34, C("#c9973f")); p(12, 34, C("#8a6428")) # escutcheon
	# blueing worn bright on the edges
	for pt in [Vector2i(28, 16), Vector2i(33, 16), Vector2i(39, 16), Vector2i(13, 15), Vector2i(18, 26)]:
		p(pt.x, pt.y, C("#6e7a8c"))
	outline()
	return img

# ------------------------------------------------------------------ ROOM 4 KEY
# Iron bit key with the hotel's brass tag stamped 4 — the tag style of the parlor pigeonholes
# (#c08a2c, highlight #fcd34d).
func room4_key():
	newimg()
	var i0 = C("#1f232c"); var i1 = C("#2f3440"); var i2 = C("#4b5363"); var i3 = C("#6b7385"); var i4 = C("#9aa3ad")
	var b0 = C("#6a4614"); var b1 = C("#8a5f1c"); var b2 = C("#c08a2c"); var b3 = C("#e0aa44"); var b4 = C("#fcd34d")
	# bow: an iron ring
	for y in range(4, 20):
		for x in range(4, 20):
			var d = sqrt(pow(x - 11.5, 2) + pow(y - 11.5, 2))
			if d <= 7.2 and d >= 3.8:
				var c = i2
				if x + y < 20:
					c = i3 if d > 5.0 else i4
				elif x + y > 26:
					c = i1
				p(x, y, c)
	p(7, 8, i4); p(8, 7, i4)
	# collar and shank to the bit
	r(18, 10, 3, 4, i2); hl(18, 20, 10, i3); hl(18, 20, 13, i1)
	r(21, 11, 20, 2, i2); hl(21, 40, 11, i3); p(25, 11, i4); p(33, 11, i4)
	hl(21, 40, 12, i1)
	r(40, 10, 2, 4, i2); p(40, 10, i3)
	# the bit, with two wards cut
	r(33, 13, 8, 8, i2)
	hl(33, 40, 13, i3); vl(33, 13, 20, i3); hl(33, 40, 20, i1); vl(40, 14, 20, i1)
	r(35, 15, 2, 6, Color(0, 0, 0, 0)); r(38, 17, 2, 4, Color(0, 0, 0, 0))
	# rust and pitting
	for pt in [Vector2i(27, 12), Vector2i(36, 19), Vector2i(15, 16), Vector2i(9, 17), Vector2i(30, 11)]:
		p(pt.x, pt.y, C("#6b4630"))
	# brass split ring through the bow, then the tag hanging below
	for a in range(0, 360, 30):
		var t = deg_to_rad(a)
		p(round(9 + cos(t) * 2.0), round(20 + sin(t) * 2.0), b2 if a > 180 else b1)
	# tag: a rounded oblong, hole at the top, stamped 4
	for y in range(23, 44):
		for x in range(3, 18):
			var inside = true
			if (y == 23 or y == 43) and (x < 6 or x > 14):
				inside = false
			if (y == 24 or y == 42) and (x < 4 or x > 16):
				inside = false
			if not inside:
				continue
			var c = b2
			if x < 6 or y < 26:
				c = b3
			if x > 15 or y > 40:
				c = b1
			if c == b2 and hs(x, y, 21) > 0.9:
				c = b3
			p(x, y, c)
	hl(6, 13, 23, b4); vl(3, 26, 38, b4)
	disc(10.5, 26.5, 1.2, Color(0, 0, 0, 0))
	p(10, 25, b0); p(11, 25, b0)
	# stamped numeral 4 (struck in, so a dark cut with a lit lower edge)
	var four = ["....11.", "...111.", "..1.11.", ".1..11.", "1111111", "....11.", "....11.", "....11."]
	for j in range(four.size()):
		for i in range(7):
			if four[j][i] == "1":
				p(7 + i, 29 + j, b0)
				if j == four.size() - 1 or four[j + 1][i] != "1":
					p(7 + i, 30 + j, b4)
	# keeper wire from ring to tag hole
	vl(10, 22, 24, b1); p(9, 22, b2)
	outline()
	return img

# ------------------------------------------------------------------ HALE'S WATCH
# Nickel-silver open-face case (#9aa3ad, lit #e2e8f0) with its chain (#7a7f88), as found in the
# sawmill snow: crystal smashed, hands bent.
func watch():
	newimg()
	var c0 = C("#3b4456"); var c1 = C("#6b7385"); var c2 = C("#9aa3ad"); var c3 = C("#c8d1de"); var c4 = C("#e2e8f0")
	var cx = 21.5
	var cy = 27.5
	# chain trailing off to the right
	# a curb chain from the bow, looping off to the right and down, links alternating flat / on edge
	var pts = [Vector2(25, 8), Vector2(32, 8), Vector2(38, 11), Vector2(42, 17), Vector2(43, 24), Vector2(42, 31)]
	var step = 0
	for k in range(pts.size() - 1):
		var a0 = pts[k]
		var a1 = pts[k + 1]
		var n = int(a0.distance_to(a1) * 2.0)
		for i in range(n):
			var q = a0.lerp(a1, float(i) / n)
			var ph = int(step / 2) % 4
			var col = [c4, c2, C("#7a7f88"), C("#4b5363")][ph]
			p(round(q.x), round(q.y), col)
			if ph < 2:
				p(round(q.x) + 1, round(q.y), C("#7a7f88"))
			step += 1
	# T-bar at the chain end
	hl(39, 45, 33, c2); p(42, 32, C("#7a7f88")); p(39, 33, c4); p(45, 33, c1)
	# bow (ring) and crown
	for a in range(0, 360, 15):
		var t = deg_to_rad(a)
		p(round(cx + cos(t) * 4.0), round(8 + sin(t) * 3.0), c4 if a > 160 and a < 290 else c2)
	r(cx - 2, 10, 4, 3, c2); hl(cx - 2, cx + 1, 10, c4); vl(cx + 1, 11, 12, c1)
	for i in range(4):
		p(cx - 2 + i, 11, c1 if i % 2 else c3) # knurled crown
	r(cx - 1, 13, 3, 1, c1)
	# case
	for y in range(12, 44):
		for x in range(5, 39):
			var d = sqrt(pow(x - cx, 2) + pow(y - cy, 2))
			if d > 15.0:
				continue
			var c
			if d > 13.0:
				var lit = (x - cx) + (y - cy) < -4
				var dark = (x - cx) + (y - cy) > 8
				c = c4 if lit and d < 14.2 else (c3 if lit else (c0 if dark else c2))
				if d > 14.4:
					c = c1 if not lit else c2
			elif d > 12.0:
				c = c1
			else:
				c = C("#e4dcc4") # dial
				if (x - cx) + (y - cy) > 10:
					c = C("#c9bfa4")
			p(x, y, c)
	# hour marks
	for h in range(12):
		var t = deg_to_rad(h * 30)
		var rr = 10.5 if h % 3 else 10.0
		p(round(cx + sin(t) * rr), round(cy - cos(t) * rr), C("#2a2118"))
		if h % 3 == 0:
			p(round(cx + sin(t) * 9.2), round(cy - cos(t) * 9.2), C("#2a2118"))
	# small seconds sub-dial
	for a in range(0, 360, 30):
		var t = deg_to_rad(a)
		p(round(cx + cos(t) * 2.0), round(cy + 5.5 + sin(t) * 2.0), C("#b3a78c"))
	# bent hands: the minute hand kinks partway, the hour hand is knocked askew
	ln(cx, cy, cx + 3, cy - 5, C("#1a1410")); ln(cx + 3, cy - 5, cx + 7, cy - 6, C("#1a1410"))
	ln(cx, cy, cx - 5, cy + 2, C("#1a1410"))
	p(cx, cy, C("#c9973f")); p(cx - 1, cy, C("#8a6428"))
	# smashed crystal: an impact star with radiating cracks, a missing shard
	var ix = cx - 4
	var iy = cy - 4
	for a in [10, 75, 140, 200, 255, 320]:
		var t = deg_to_rad(a)
		var crack = 5.0 + hs(a, 0, 9) * 6.0
		for k in range(1, int(crack)):
			var x = round(ix + cos(t) * k)
			var y = round(iy + sin(t) * k)
			if sqrt(pow(x - cx, 2) + pow(y - cy, 2)) < 12.0:
				p(x, y, C("#f8fafc") if k % 3 else C("#9aa3ad"))
	disc(ix, iy, 1.3, C("#f8fafc"))
	for pt in [Vector2i(28, 30), Vector2i(29, 31), Vector2i(28, 31), Vector2i(27, 32)]:
		p(pt.x, pt.y, C("#a89c80")) # dull, glass gone
	# glints and a few flecks of snow on the rim
	p(10, 21, C("#ffffff")); p(11, 20, C("#ffffff"))
	for pt in [Vector2i(9, 37), Vector2i(12, 40), Vector2i(31, 40)]:
		p(pt.x, pt.y, C("#e4e9f0"))
	outline()
	return img

# ------------------------------------------------------------------ LEDGER
# The ash-pit ledger: pale page stock (#b8ad92, ruled #6b6250) whose right side is burned to
# char (#5a4632 -> #2a2420), as the sawmill prop shows it.
func ledger():
	newimg()
	var pg = C("#b8ad92"); var pgL = C("#cfc4a8"); var pgD = C("#9a8f74")
	var ink = C("#4a4034"); var rule = C("#8a7f66"); var red = C("#7f1d1d")
	var lea0 = C("#2a1a12"); var lea1 = C("#4a2f1e"); var lea2 = C("#6b4630")
	# burn boundary: x where the page turns to char, per row (jagged, eats in from the right)
	var burn = []
	for y in range(48):
		burn.append(31 - int(sin(y * 0.55) * 3.0 + hs(0, y, 5) * 4.0 + (y - 10) * 0.12))
	# leather cover under the pages (spine at the left)
	for y in range(9, 41):
		for x in range(3, 45):
			if x > burn[y] + 6:
				continue
			var c = lea1
			if y == 9 or x < 5:
				c = lea2
			elif y > 38:
				c = lea0
			p(x, y, c)
	# page block edge (seen at the bottom)
	for x in range(5, 44):
		if x <= burn[38] + 4:
			p(x, 38, pgD)
			p(x, 39, C("#857a60") if x % 2 else pgD)
	# the open pages
	for y in range(11, 38):
		for x in range(5, 44):
			var bx = burn[y]
			if x > bx + 4:
				continue
			var c = pg
			if x == 24 or x == 25:
				c = pgD # gutter
			elif y == 11 or x == 5:
				c = pgL
			if x > bx:
				var k = x - bx
				c = [C("#8a6a40"), C("#5a4632"), C("#3a2c22"), C("#2a2420")][min(3, k - 1)]
			elif x > bx - 3:
				c = pg.lerp(C("#8a6a40"), 0.35 * (3 - (bx - x)))
			p(x, y, c)
	# ruled columns, entries and tally strokes in fives
	for y in range(14, 37, 3):
		for x in range(7, 23):
			if x < burn[y] - 2:
				p(x, y, rule if x % 5 != 0 else pgD)
		for x in range(27, 42):
			if x < burn[y] - 1:
				p(x, y, rule if (x + y) % 4 else pgD)
	vl(10, 13, 36, red); vl(30, 13, min(36, 40), red)
	for y in range(13, 36, 3):
		for k in range(int(hs(y, 1, 7) * 4) + 3):
			p(12 + k * 2, y, ink)
		# tallies on the right page: four strokes and a cross-stroke
		var x0 = 32
		if x0 + 6 < burn[y]:
			for k in range(4):
				p(x0 + k, y, ink)
			p(x0 + 4, y, rule)
	# header line on the left page
	hl(7, 22, 12, ink); p(8, 12, pg); p(15, 12, pg)
	# char crust and ash flecks at the burned edge
	for y in range(10, 40):
		var bx = burn[y]
		p(bx + 4, y, C("#1c1814"))
		if hs(bx, y, 13) > 0.7:
			p(bx + 5, y, C("#1c1814"))
		if hs(bx, y, 17) > 0.8:
			p(bx + 2, y, C("#7a7a78")) # grey ash
	outline()
	return img

# ------------------------------------------------------------------ TELEGRAM
# The Western-Union-style form read in the DocumentView: paper #e4dcc4, edge #cfc4a6, folded in
# three, a heading rule and pasted tape strips of type.
func telegram():
	newimg()
	var pp = C("#e4dcc4"); var pL = C("#efe8d4"); var pD = C("#cfc4a6"); var crease = C("#b9ad8c")
	var ink = C("#3b2f22"); var tape = C("#f3eddc")
	var x0 = 5
	var y0 = 5
	var w = 38
	var h = 38
	for y in range(y0, y0 + h):
		for x in range(x0, x0 + w):
			var c = pp
			if x == x0 or y == y0:
				c = pL
			elif x >= x0 + w - 2 or y >= y0 + h - 2:
				c = pD
			p(x, y, c)
	# dog-eared top right corner
	for i in range(5):
		for j in range(5 - i):
			p(x0 + w - 1 - j, y0 + i, Color(0, 0, 0, 0))
	for i in range(5):
		p(x0 + w - 6 + i, y0 + i, pD)
		for j in range(i):
			p(x0 + w - 6 + j, y0 + i, C("#d8ceb4"))
	# fold creases in thirds: a shadow under each crease, a lit lip above
	for fy in [y0 + 13, y0 + 26]:
		hl(x0 + 1, x0 + w - 2, fy, crease)
		hl(x0 + 1, x0 + w - 2, fy - 1, pL)
		for x in range(x0 + 1, x0 + w - 2):
			if hs(x, fy, 3) > 0.6:
				p(x, fy + 1, C("#d6ccb0"))
	# heading: TELEGRAM in tiny caps (3x4 letters), then a rule
	var glyphs = {
		"T": ["111", ".1.", ".1.", ".1."], "E": ["111", "11.", "1..", "111"], "L": ["1..", "1..", "1..", "111"],
		"G": ["111", "1..", "1.1", "111"], "R": ["11.", "1.1", "11.", "1.1"], "A": [".1.", "1.1", "111", "1.1"], "M": ["1...1", "11.11", "1.1.1", "1...1"]
	}
	var word = "TELEGRAM"
	var gx = x0 + 2
	for ch in word:
		var gl = glyphs[ch]
		for j in range(4):
			for i in range(gl[j].length()):
				if gl[j][i] == "1":
					p(gx + i, y0 + 3 + j, ink)
		gx += gl[0].length() + 1
	hl(x0 + 3, x0 + w - 8, y0 + 8, ink)
	# pasted tape strips of type
	var rows = [y0 + 11, y0 + 16, y0 + 20, y0 + 24, y0 + 29]
	var lens = [14, 28, 24, 27, 16]
	for k in range(rows.size()):
		var ty = rows[k]
		hl(x0 + 3, x0 + 3 + lens[k], ty - 1, tape)
		hl(x0 + 3, x0 + 3 + lens[k], ty + 1, tape)
		for x in range(x0 + 4, x0 + 3 + lens[k]):
			if hs(x, ty, k) > 0.3 and (x - x0) % 6 != 0:
				p(x, ty, ink if hs(x, ty, 9) > 0.25 else C("#6a5a48"))
	# signature line and a faint postmark ring
	hl(x0 + 18, x0 + 31, y0 + 34, C("#6a5a48"))
	for a in range(0, 360, 20):
		var t = deg_to_rad(a)
		p(round(x0 + 9 + cos(t) * 4.0), round(y0 + 33 + sin(t) * 3.0), C("#9a6a5a"))
	outline()
	return img

# ------------------------------------------------------------------ world sprites (native density)
# Small pick-up sprites drawn in the sawmill, from the same designs (watch case + chain, burned ledger).
func watch_world():
	newimg(9, 5)
	var c1 = C("#6b7385"); var c2 = C("#9aa3ad"); var c4 = C("#e2e8f0")
	r(1, 1, 4, 3, c2); hl(2, 3, 0, c2); hl(2, 3, 4, c1); p(1, 1, c4); p(2, 1, c4); p(4, 3, c1)
	p(3, 2, C("#e4dcc4")); p(2, 2, C("#f8fafc"))
	p(5, 2, C("#7a7f88")); p(6, 3, c2); p(7, 3, C("#7a7f88")); p(8, 4, c2)
	return img

func ledger_world():
	newimg(14, 5)
	r(0, 0, 9, 4, C("#b8ad92")); hl(0, 8, 0, C("#cfc4a8")); vl(4, 0, 3, C("#9a8f74"))
	for x in [1, 3, 6]:
		p(x, 2, C("#6b6250"))
	p(9, 0, C("#8a6a40")); p(9, 1, C("#5a4632")); p(9, 2, C("#5a4632")); p(8, 3, C("#8a6a40"))
	r(10, 0, 4, 4, C("#2a2420")); p(13, 0, Color(0, 0, 0, 0)); p(12, 3, C("#3a2c22"))
	hl(0, 12, 4, C("#1c1814"))
	return img

func paint(part):
	match part:
		"lantern": return lantern()
		"revolver": return revolver()
		"room4_key": return room4_key()
		"watch": return watch()
		"ledger": return ledger()
		"telegram": return telegram()
		"watch_world": return watch_world()
		"ledger_world": return ledger_world()
	return newimg()
