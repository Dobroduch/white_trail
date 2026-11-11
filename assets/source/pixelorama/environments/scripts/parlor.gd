# Black Ram Hotel parlor — native-density (600x270) painting script for Pixelorama.
# Run inside Pixelorama via the MCP eval_gdscript loader (see environments/scripts/README.md).
# Layout matches the PARLOR scene geometry exactly (world coords x1.5): door, fireplace, stairs,
# pigeonholes (key 4 missing), sconces at world (122,96) (222,92) (322,96).
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

func p(x, y, c):
	if x >= 0 and y >= 0 and x < W and y < H:
		img.set_pixel(int(x), int(y), c)

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

func mix(a, b, t):
	return a.lerp(b, t)

func grain(x, y, w, h, base, dark, lite, seed):
	for j in range(int(h)):
		for i in range(int(w)):
			var c = base
			var g = sin((i + hs(int(j / 3), 0, seed) * 40.0) * 0.21 + j * 0.9 + hs(0, int(i / 9), seed) * 6.0)
			if g > 0.95:
				c = dark
			elif g > 0.8 and hs(i + x, j + y, seed + 1) < 0.35:
				c = dark
			elif hs(i + x, j + y, seed) > 0.96:
				c = lite
			p(x + i, y + j, c)

func planks():
	var d = C("#2a1c14"); var l = C("#634832")
	for row in range(7):
		var y0 = 226 + row * 7
		var off = int(hs(row, 3, 7) * 60)
		grain(0, y0, W, 7, C("#4e3826") if row % 2 == 0 else C("#493422"), d, l, 20 + row)
		hl(0, W - 1, y0, d)
		var x = -off
		while x < W:
			x += 50 + int(hs(row, x, 9) * 40)
			vl(x, y0, y0 + 6, d)
			p(x + 1, y0 + 1, l)
	hl(0, W - 1, 225, C("#7a5a3e"))

func wallpaper():
	var base = C("#3a2220"); var mid = C("#43271f"); var mot = C("#52301f"); var gold = C("#6a4228")
	for y in range(19, 177):
		for x in range(W):
			var c = base
			if x % 9 == 0:
				c = mid
			var cx = x % 18
			var cy = (y - 19) % 18
			var dx = abs(cx - 9)
			var dy = abs(cy - 9)
			if dx + dy == 6:
				c = mot
			if dx + dy == 0 or (dx == 0 and dy == 2) or (dy == 0 and dx == 2):
				c = gold
			var soot = 1.0 - float(y - 19) / 60.0
			if soot > 0 and hs(x, y, 4) < soot * 0.75:
				c = mix(c, C("#1c100c"), 0.55)
			p(x, y, c)
	for y in range(40, 110):
		for x in range(410, 440):
			var d = pow((x - 425) / 15.0, 2) + pow((y - 40) / 70.0, 2)
			if d < 1.0 and hs(x, y, 5) < 0.45 * (1.0 - d):
				p(x, y, C("#2e1b18"))

func ceiling():
	r(0, 0, W, 18, C("#140d09"))
	for x in range(0, W, 72):
		r(x, 0, 9, 21, C("#1d140e")); vl(x + 8, 0, 20, C("#0d0806")); vl(x, 0, 20, C("#2a1c13"))
	hl(0, W - 1, 18, C("#2a1c13")); hl(0, W - 1, 19, C("#3d2a1c"))

func wainscot():
	r(0, 177, W, 5, C("#634832")); hl(0, W - 1, 177, C("#7a5a3e")); hl(0, W - 1, 181, C("#2a1c14"))
	grain(0, 182, W, 43, C("#3b2a1e"), C("#2a1c14"), C("#4e3826"), 3)
	for x in range(6, W, 39):
		r(x, 187, 31, 33, C("#2a1c14"))
		grain(x + 2, 189, 27, 29, C("#33241a"), C("#241810"), C("#45311f"), x)
		hl(x + 1, x + 30, 188, C("#4e3826")); vl(x + 1, 188, 219, C("#4e3826"))
		hl(x + 2, x + 30, 219, C("#1a120d")); vl(x + 30, 189, 219, C("#1a120d"))
	hl(0, W - 1, 224, C("#1a120d"))

func door():
	r(6, 138, 39, 87, C("#1a120d"))
	grain(10, 142, 31, 83, C("#3a2618"), C("#2a1c14"), C("#4a3220"), 11)
	r(15, 148, 21, 24, C("#0e1628"))
	for y in range(148, 172):
		for x in range(15, 36):
			var t = hs(x, y, 12)
			if (y - 148) > 17 and t > 0.55:
				p(x, y, C("#8c9ab4"))
			elif t > 0.82:
				p(x, y, C("#2a3a5c"))
			if x == 15 or y == 148:
				p(x, y, C("#3a4a6e"))
	hl(15, 35, 159, C("#1a120d")); vl(25, 148, 171, C("#1a120d"))
	r(14, 178, 23, 20, C("#2a1c14")); r(15, 179, 21, 18, C("#3a2618")); hl(15, 35, 179, C("#4e3826"))
	r(14, 202, 23, 18, C("#2a1c14")); r(15, 203, 21, 16, C("#3a2618")); hl(15, 35, 203, C("#4e3826"))
	r(35, 188, 3, 3, C("#c08a2c")); p(35, 188, C("#fcd34d"))
	hl(4, 47, 137, C("#634832"))

func coats():
	r(51, 150, 21, 3, C("#2a1c14")); hl(51, 71, 150, C("#4e3826"))
	r(53, 153, 8, 24, C("#26242c")); vl(54, 155, 175, C("#34323c")); r(52, 147, 10, 4, C("#1c1916")); r(54, 144, 6, 3, C("#1c1916"))
	r(63, 153, 6, 18, C("#3a2f28")); vl(64, 154, 170, C("#4a3d33")); r(62, 172, 8, 2, C("#3a2f28"))

func bars(x, y):
	for k in range(0, 36, 5):
		vl(x + k, y, y + 6, C("#24272e")); p(x + k, y, C("#3a3f4a"))

func fireplace():
	var x0 = 84
	r(x0, 135, 84, 90, C("#3d3834"))
	var y = 137
	var row = 0
	while y < 225:
		var h = 6 + int(hs(row, 1, 2) * 3)
		var x = x0 + (0 if row % 2 == 0 else -6)
		while x < x0 + 84:
			var w = 10 + int(hs(x, row, 3) * 7)
			var shade = C("#4b4540") if hs(x, y, 4) > 0.4 else C("#565049")
			var sx = max(x, x0)
			r(sx, y, min(w - 1, x0 + 84 - sx), h - 1, shade)
			hl(sx, min(x + w - 2, x0 + 83), y, C("#635c55"))
			x += w
		hl(x0, x0 + 83, y + h - 1, C("#2c2825"))
		y += h
		row += 1
	r(x0 - 6, 132, 96, 8, C("#634832"))
	grain(x0 - 5, 133, 94, 5, C("#634832"), C("#4e3826"), C("#7a5a3e"), 30)
	hl(x0 - 6, x0 + 89, 132, C("#8a6a4a")); hl(x0 - 6, x0 + 89, 139, C("#2a1c14"))
	r(x0 + 18, 171, 48, 4, C("#2a2522")); hl(x0 + 18, x0 + 65, 171, C("#4a4440"))
	r(x0 + 21, 175, 42, 50, C("#0a0706"))
	for yy in range(175, 225):
		for xx in range(x0 + 21, x0 + 63):
			if (yy - 175) < 14 and hs(xx, yy, 6) < 0.5 - (yy - 175) / 30.0:
				p(xx, yy, C("#000000"))
			elif (xx + yy) % 7 == 0 and yy > 190:
				p(xx, yy, C("#1a0f0a"))
	r(x0 + 24, 218, 36, 3, C("#3a3f4a")); bars(x0 + 24, 212)
	r(x0 - 4, 225, 92, 3, C("#2c2825")); hl(x0 - 4, x0 + 87, 225, C("#635c55"))

func mantel_items():
	var x0 = 84
	r(x0 + 36, 118, 14, 14, C("#2a1c14")); r(x0 + 37, 119, 12, 12, C("#3b2a1e"))
	r(x0 + 39, 121, 8, 8, C("#c9c0a8")); hl(x0 + 39, x0 + 46, 121, C("#e0d8c2"))
	vl(x0 + 43, 123, 125, C("#0b0d14")); hl(x0 + 43, x0 + 45, 125, C("#0b0d14"))
	for cx in [x0 + 9, x0 + 72]:
		r(cx - 1, 130, 4, 2, C("#a07a3a")); vl(cx, 123, 129, C("#a07a3a")); vl(cx + 1, 123, 129, C("#c9973f"))
		r(cx, 118, 2, 5, C("#d8ccb0"))
	r(x0 + 58, 124, 6, 8, C("#5a4632")); hl(x0 + 58, x0 + 63, 124, C("#7a6146"))

func photo():
	r(222, 87, 39, 33, C("#1a120d")); r(224, 89, 35, 29, C("#a07a3a")); r(226, 91, 31, 25, C("#8d8574"))
	r(226, 105, 31, 11, C("#6d6658"))
	for i in range(8):
		var x = 228 + i * 4
		r(x, 99, 2, 9, C("#3a3630")); r(x, 97, 2, 2, C("#4a453e"))
	r(248, 93, 8, 8, C("#5d574c")); hl(226, 256, 91, C("#b0a890"))
	r(236, 120, 11, 2, C("#8a6a4a"))
	p(240, 85, C("#7a5a3e")); p(241, 85, C("#7a5a3e")); p(240, 86, C("#7a5a3e"))

func digit(x, y, d, c):
	var F = {"1": ["010", "110", "010", "010", "111"], "2": ["110", "001", "010", "100", "111"], "3": ["110", "001", "010", "001", "110"], "4": ["101", "101", "111", "001", "001"], "5": ["111", "100", "110", "001", "110"], "6": ["011", "100", "110", "101", "010"]}
	var g = F[d]
	for j in range(5):
		for i in range(3):
			if g[j][i] == "1":
				p(x + i, y + j, c)

func pigeonholes():
	grain(369, 99, 93, 60, C("#2a1c14"), C("#1a120d"), C("#3b2a1e"), 40)
	for row in range(4):
		for col in range(6):
			var x = 372 + col * 15
			var y = 102 + row * 13
			r(x, y, 12, 10, C("#120c08")); hl(x, x + 11, y + 10, C("#3b2a1e"))
			if (row * 6 + col) % 4 == 1:
				r(x + 1, y + 4, 8, 5, C("#b5ab92")); hl(x + 1, x + 8, y + 4, C("#d0c6ac")); p(x + 4, y + 6, C("#7f1d1d"))
	hl(369, 461, 160, C("#4e3826"))
	for i in range(6):
		var x = 375 + i * 15
		p(x, 162, C("#a07a3a"))
		if i != 3:
			vl(x, 163, 168, C("#c08a2c")); r(x - 1, 167, 3, 2, C("#c08a2c")); p(x, 163, C("#fcd34d"))
		digit(x - 1, 170, str(i + 1), C("#7a6146"))

func stairs():
	for i in range(10):
		var sx = 501 + i * 9
		var sy = 216 - i * 9
		grain(sx, sy + 1, W - sx, 8, C("#3b2a1e"), C("#2a1c14"), C("#4e3826"), 50 + i)
		hl(sx, W - 1, sy, C("#7a5a3e")); hl(sx, W - 1, sy + 1, C("#634832")); vl(sx, sy, sy + 8, C("#2a1c14"))
	r(558, 33, 40, 48, C("#0d0806"))
	for i in range(11):
		var bx = 498 + i * 9
		var by = 174 - i * 9
		vl(bx, by, by + 51, C("#2a1c14")); vl(bx + 1, by + 1, by + 51, C("#4e3826"))
	for t in range(0, 94):
		var x = 495 + t
		var y = 174 - int(t * 0.968)
		p(x, y, C("#7a5a3e")); p(x, y + 1, C("#4e3826")); p(x, y + 2, C("#2a1c14"))
	r(492, 168, 7, 57, C("#634832")); vl(492, 168, 224, C("#7a5a3e")); vl(498, 168, 224, C("#2a1c14")); r(491, 164, 9, 5, C("#7a5a3e")); r(493, 161, 5, 3, C("#8a6a4a"))

const SCONCES = [[183, 144], [333, 138], [483, 144]]

func sconces():
	for s in SCONCES:
		var x = s[0]
		var y = s[1]
		r(x - 2, y + 4, 5, 2, C("#a07a3a")); vl(x, y + 6, y + 10, C("#a07a3a")); r(x - 3, y + 10, 7, 2, C("#7a5a2a"))
		r(x - 3, y - 5, 7, 9, C("#3a3028")); r(x - 2, y - 4, 5, 7, C("#5a4a38")); hl(x - 3, x + 3, y - 6, C("#a07a3a"))

# Warm, banded, dithered light wash baked for the EVENING phase (sconces + fire lit).
func pool(cx, cy, rad, col, amax):
	for y in range(int(cy - rad), int(cy + rad)):
		for x in range(int(cx - rad), int(cx + rad)):
			var d = sqrt(pow(x - cx, 2) + pow((y - cy) * 1.2, 2)) / rad
			if d >= 1.0:
				continue
			var band = floor((1.0 - d) * 4.0) / 4.0
			var a = amax * band
			if hs(x, y, 77) < fmod((1.0 - d) * 4.0, 1.0) * 0.5:
				a = amax * min(1.0, band + 0.25)
			if a <= 0.0:
				continue
			var old = img.get_pixel(x, y) if x >= 0 and y >= 0 and x < W and y < H else Color(0, 0, 0, 0)
			var na = max(old.a, a)
			p(x, y, Color(col.r, col.g, col.b, na))

func light_evening():
	img = Image.create(W, H, false, Image.FORMAT_RGBA8)
	pool(126, 205, 120, C("#d68a3f"), 0.34)
	for s in SCONCES:
		pool(s[0], s[1] - 2, 46, C("#e6b66c"), 0.24)
	pool(380, 160, 40, C("#e6b66c"), 0.2)
	return img

func glow_evening():
	img = Image.create(W, H, false, Image.FORMAT_RGBA8)
	for s in SCONCES:
		var x = s[0]
		var y = s[1]
		r(x - 2, y - 4, 5, 7, Color(0.99, 0.83, 0.42, 0.9)); r(x - 1, y - 3, 3, 4, C("#fff1c8")); p(x, y - 6, C("#fcd34d"))
	r(376, 154, 6, 7, Color(0.99, 0.83, 0.42, 0.85)); r(377, 155, 4, 4, C("#fff1c8"))
	return img

func paint(part):
	if part == "main":
		img = Image.create(W, H, false, Image.FORMAT_RGBA8)
		ceiling(); wallpaper(); wainscot(); planks(); door(); coats(); fireplace(); mantel_items(); photo(); pigeonholes(); stairs(); sconces()
		return img
	if part == "light_evening":
		return light_evening()
	return glow_evening()
