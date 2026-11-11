# CROW'S HOLLOW main street — native 960x270 playfield layers (scene 640 world); the front drift
# layer is 1059 wide (parallax 1.2). Sky, mountains, far trees/rooftops and fog keep the painted art.
# Geometry follows the painted street (world x1.5): watcher cabin 18-120 (watcher window 60-74 x
# 114-128 is lit by the watcher prop, so it stays dark glass here), Rusk's store 138-254, street lamp
# 264, Black Ram Hotel 276-452 (door 354-374, spawn 364), livery barn 468-532, MILL sign 588-610.
# Parts: main, glow_evening, glow_night, light_evening, front.

const FONT = {"A": ["010", "101", "111", "101", "101"], "B": ["110", "101", "110", "101", "110"], "C": ["111", "100", "100", "100", "111"], "D": ["110", "101", "101", "101", "110"], "E": ["111", "100", "110", "100", "111"], "G": ["111", "100", "101", "101", "111"], "H": ["101", "101", "111", "101", "101"], "I": ["111", "010", "010", "010", "111"], "K": ["101", "110", "100", "110", "101"], "L": ["100", "100", "100", "100", "111"], "M": ["101", "111", "111", "101", "101"], "N": ["110", "101", "101", "101", "101"], "O": ["111", "101", "101", "101", "111"], "R": ["110", "101", "110", "101", "101"], "S": ["111", "100", "111", "001", "111"], "T": ["111", "010", "010", "010", "010"], "U": ["101", "101", "101", "101", "111"], "'": ["010", "010", "000", "000", "000"], " ": ["000", "000", "000", "000", "000"]}

# windows: [x, y, w, h, lit_evening, lit_night]  (native px)
const WINDOWS = [
	[88, 171, 26, 24, false, false], [135, 171, 26, 23, false, false],
	[441, 111, 18, 24, true, false], [489, 111, 18, 24, false, false], [537, 111, 18, 24, true, false], [585, 111, 18, 24, true, true], [633, 111, 18, 24, true, false],
	[444, 177, 39, 30, true, false], [611, 177, 34, 30, true, false],
	[762, 183, 21, 21, false, false],
]

func gy(x):
	var wx = x / 1.5
	var y = 150.0
	if wx > 556 and wx <= 600:
		y = 150.0 + (wx - 556) / 44.0 * 4.0
	elif wx > 600:
		y = 154.0 + (wx - 600) / 40.0 * 3.0
	return int(round(y * 1.5))

func text5(x, y, t, c):
	for ch in t:
		var g = FONT.get(ch, FONT[" "])
		for j in range(5):
			for i in range(3):
				if g[j][i] == "1":
					p(x + i, y + j, c)
		x += 2 if ch == "'" else 4

func logs(x0, y0, x1, y1, seed):
	for y in range(y0, y1):
		var k = (y - y0) % 6
		for x in range(x0, x1):
			var t = hs(x, y, seed)
			var c = C("#3b2a1e") if ((y - y0) / 6) % 2 == 0 else C("#35261b")
			if k == 5:
				c = C("#1a120d")
			elif k == 0 and t > 0.3:
				c = C("#4e3826")
			elif t > 0.95:
				c = C("#2a1c14")
			elif k == 4 and t > 0.6:
				c = C("#2a1c14")
			p(x, y, c)
		if (y - y0) % 6 == 2:
			r(x0 - 3, y - 1, 3, 4, C("#5a4632")); p(x0 - 2, y, C("#33241a"))
			r(x1, y - 1, 3, 4, C("#5a4632")); p(x1 + 1, y, C("#33241a"))

func boards(x0, y0, x1, y1, base, seed):
	for x in range(x0, x1):
		var k = (x - x0) % 7
		for y in range(y0, y1):
			var t = hs(x, y, seed)
			var c = base
			if k == 6:
				c = C("#1a120d")
			elif k == 0:
				c = base.lerp(C("#634832"), 0.4)
			elif t > 0.94:
				c = base.lerp(C("#1a120d"), 0.5)
			p(x, y, c)

func snowtop(x0, x1, y, depth, seed, icicles):
	for x in range(x0, x1):
		var d = depth + int(hs(x / 5, 0, seed) * 3) - 1
		for k in range(d):
			p(x, y - k, C("#e4e9f0") if k == d - 1 else (C("#c8d1de") if k > d / 2 else C("#a3b4be")))
		p(x, y + 1, C("#52677d"))
		if icicles and x % 8 == 0 and hs(x, 1, seed) > 0.25:
			var len = 2 + int(hs(x, 2, seed) * 8)
			vl(x, y + 1, y + len, C("#a3b4be")); p(x, y + 1, C("#e4e9f0"))

func gable(x0, x1, eave, peak, seed):
	var mx = (x0 + x1) / 2.0
	for x in range(x0, x1):
		var top = int(eave - (1.0 - abs(x - mx) / ((x1 - x0) / 2.0)) * (eave - peak))
		for y in range(top, eave + 4):
			p(x, y, C("#1a130d") if ((y - top) / 3 + x / 6) % 2 == 0 else C("#21180f"))
		var d = 4 + int(hs(x / 6, 0, seed) * 4)
		for k in range(d):
			p(x, top - k, C("#e4e9f0") if k == d - 1 else C("#a3b4be"))
	hl(x0, x1 - 1, eave + 4, C("#2a1f15"))
	snowtop(x0, x1, eave + 4, 2, seed + 1, true)

func frame(w):
	var x = w[0]
	var y = w[1]
	r(x - 2, y - 2, w[2] + 4, w[3] + 4, C("#1a120d"))
	for j in range(w[3]):
		for i in range(w[2]):
			var c = C("#0e1628")
			var t = hs(x + i, y + j, 30)
			if t > 0.9:
				c = C("#2a3a5c")
			if j > w[3] - 5 and t < 0.45:
				c = C("#8c9ab4")
			p(x + i, y + j, c)
	vl(x + w[2] / 2, y, y + w[3] - 1, C("#1a120d")); hl(x, x + w[2] - 1, y + w[3] / 2, C("#1a120d"))
	r(x - 3, y + w[3] + 2, w[2] + 6, 3, C("#4e3826")); hl(x - 3, x + w[2] + 2, y + w[3] + 1, C("#c8d1de"))

func lit(w, night):
	var x = w[0]
	var y = w[1]
	for j in range(w[3]):
		for i in range(w[2]):
			if i == w[2] / 2 or j == w[3] / 2:
				continue
			var c = (C("#e6b66c") if j < w[3] / 2 else C("#d68a3f"))
			if night:
				c = C("#a65c2c")
			# a curtain edge and a warmer core instead of noise
			if i == 0 or i == w[2] - 1:
				c = C("#a65c2c")
			elif j == w[3] - 1:
				c = c.lerp(C("#a65c2c"), 0.5)
			p(x + i, y + j, Color(c.r, c.g, c.b, 0.9 if not night else 0.75))

func cabin():
	gable(21, 189, 159, 123, 40)
	logs(27, 162, 180, 225, 41)
	r(141, 96, 10, 48, C("#3d3834")); r(139, 93, 14, 4, C("#2c2825")); hl(139, 152, 92, C("#d3dce0"))
	r(45, 177, 19, 48, C("#1a120d")); grain(47, 179, 15, 46, C("#3a2618"), C("#2a1c14"), C("#4a3220"), 42)
	r(59, 202, 2, 2, C("#c08a2c")); snowtop(43, 66, 175, 2, 43, false)
	# boarded side window
	for k in range(3):
		ln(135, 172 + k * 8, 161, 176 + k * 8, C("#5a4632"))

func store():
	boards(207, 117, 381, 225, C("#3b2a1e"), 50)
	snowtop(207, 381, 117, 4, 51, true)
	r(222, 129, 144, 18, C("#1a130d")); r(224, 131, 140, 14, C("#2a1f15")); hl(224, 363, 131, C("#3b2a1e"))
	text5(232, 136, "RUSK GEN'L MDSE", C("#c8bfa8"))
	# porch awning
	r(204, 162, 180, 5, C("#2a1f15")); hl(204, 383, 167, C("#1a130d"))
	snowtop(204, 384, 162, 4, 52, true)
	for px0 in [207, 378]:
		r(px0, 167, 3, 58, C("#21180f")); vl(px0, 167, 224, C("#3b2a1e"))
	# shop window (cracked) and door
	r(224, 174, 75, 40, C("#1a120d")); r(227, 177, 69, 34, C("#0e1628"))
	for j in range(34):
		for i in range(69):
			if hs(i, j, 53) > 0.9:
				p(227 + i, 177 + j, C("#2a3a5c"))
	vl(261, 177, 210, C("#1a120d")); ln(240, 180, 252, 200, C("#8c9ab4")); ln(252, 200, 248, 210, C("#8c9ab4"))
	r(231, 201, 12, 10, C("#2a1c14")); r(279, 199, 10, 12, C("#3a2a1c"))
	hl(222, 300, 214, C("#4e3826")); hl(222, 300, 213, C("#c8d1de"))
	r(321, 175, 26, 50, C("#1a120d")); grain(323, 177, 22, 48, C("#3a2618"), C("#2a1c14"), C("#4a3220"), 54)
	r(326, 181, 16, 14, C("#0e1628")); r(341, 203, 2, 2, C("#c08a2c"))
	# barrels and a hitching rail
	for bx in [192, 207]:
		r(bx, 207, 12, 18, C("#4a3626")); hl(bx, bx + 11, 210, C("#24272e")); hl(bx, bx + 11, 220, C("#24272e")); hl(bx, bx + 11, 206, C("#c8d1de"))
	r(354, 204, 3, 21, C("#21180f")); r(372, 204, 3, 21, C("#21180f")); r(353, 204, 23, 3, C("#2a1f15")); hl(353, 375, 203, C("#c8d1de"))

func lamp():
	var x = 395
	r(x, 166, 3, 59, C("#24272e")); vl(x, 166, 224, C("#3a3f4a"))
	r(x - 3, 221, 9, 4, C("#24272e"))
	r(x - 6, 153, 15, 3, C("#24272e")); hl(x - 6, x + 8, 152, C("#d3dce0"))
	r(x - 5, 156, 13, 11, C("#2a2620")); r(x - 4, 157, 11, 9, C("#3a3028")); vl(x + 1, 156, 166, C("#2a2620"))

func hotel():
	var x0 = 414
	var x1 = 678
	# roof and chimneys
	for x in range(x0 - 6, x1 + 6):
		var top = 78 + int(abs(x - (x0 + x1) / 2.0) / 132.0 * 18)
		for y in range(top, 99):
			p(x, y, C("#1a130d") if ((y - top) / 3 + x / 6) % 2 == 0 else C("#21180f"))
		var d = 5 + int(hs(x / 6, 0, 60) * 4)
		for k in range(d):
			p(x, top - k, C("#e4e9f0") if k == d - 1 else C("#a3b4be"))
	snowtop(x0 - 6, x1 + 6, 99, 2, 61, true)
	for cx in [462, 609]:
		r(cx, 55, 15, 40, C("#3d3834")); r(cx - 2, 52, 19, 4, C("#2c2825")); hl(cx - 2, cx + 16, 51, C("#d3dce0"))
	# upper storey (logs), balcony roof, lower storey
	logs(x0, 100, x1, 160, 62)
	r(486, 141, 117, 17, C("#1a130d")); r(488, 143, 113, 13, C("#2a1f15")); hl(488, 600, 143, C("#3b2a1e"))
	r(494, 147, 10, 5, C("#c8bfa8")); r(496, 148, 6, 3, C("#2a1f15")); p(493, 149, C("#c8bfa8"))
	text5(510, 147, "BLACK RAM HOTEL", C("#c8bfa8"))
	r(x0 - 6, 160, x1 - x0 + 12, 6, C("#2a1f15")); hl(x0 - 6, x1 + 5, 166, C("#1a130d"))
	snowtop(x0 - 6, x1 + 6, 160, 4, 63, true)
	logs(x0, 167, x1, 225, 64)
	for px0 in [x0 - 3, 525, 600, x1]:
		r(px0, 166, 4, 59, C("#21180f")); vl(px0, 166, 224, C("#3b2a1e"))
	# door with glass and the hotel lantern bracket
	r(529, 177, 34, 48, C("#1a120d")); grain(532, 180, 28, 45, C("#3a2618"), C("#2a1c14"), C("#4a3220"), 65)
	r(537, 183, 18, 18, C("#0e1628")); vl(546, 183, 200, C("#1a120d"))
	r(556, 203, 2, 2, C("#c08a2c")); r(527, 174, 38, 3, C("#2a1f15")); hl(527, 564, 173, C("#c8d1de"))
	r(512, 171, 6, 2, C("#3a3f4a")); r(513, 173, 6, 8, C("#3a3028"))

func barn():
	r(690, 147, 12, 78, C("#05070c"))
	boards(702, 168, 798, 225, C("#2e2216"), 70)
	for x in range(696, 804):
		var top = 147 + int(abs(x - 750) / 54.0 * 12) - 12
		for y in range(max(top, 147), 168):
			p(x, y, C("#1a130d"))
	snowtop(696, 804, 147, 4, 71, true)
	r(714, 181, 30, 44, C("#21180f")); ln(714, 181, 743, 224, C("#3b2a1e")); ln(743, 181, 714, 224, C("#3b2a1e"))
	hl(714, 743, 181, C("#3b2a1e")); vl(714, 181, 224, C("#3b2a1e")); vl(743, 181, 224, C("#3b2a1e"))

func fence_and_sign():
	var x = 804
	while x < 960:
		var y = gy(x)
		r(x, y - 19, 3, 19, C("#1e1712")); hl(x, x + 2, y - 20, C("#c8d1de"))
		if x + 21 < 960:
			var y2 = gy(x + 21)
			ln(x + 3, y - 14, x + 20, y2 - 14, C("#2a2018")); ln(x + 3, y - 15, x + 20, y2 - 15, C("#8e9bb0"))
			ln(x + 3, y - 7, x + 20, y2 - 7, C("#2a2018"))
		x += 21
	var sx = 882
	var sy = gy(sx)
	r(sx + 12, 186, 3, sy - 186, C("#2a1f17"))
	r(sx, 186, 33, 11, C("#3a2a1c")); grain(sx + 1, 187, 31, 9, C("#3a2a1c"), C("#2a1f17"), C("#4e3826"), 72)
	for i in range(5):
		vl(sx + 33 + i, 187 + i, 196 - i, C("#3a2a1c"))
	hl(sx, sx + 33, 185, C("#d3dce0"))
	text5(sx + 9, 189, "MILL", C("#c8bfa8"))

func street():
	snowfield(Callable(self, "gy"), 0, W, H, 80)
	# boardwalk in front of store and hotel
	for seg in [[201, 390], [405, 690]]:
		r(seg[0], 225, seg[1] - seg[0], 5, C("#4e3826")); hl(seg[0], seg[1] - 1, 225, C("#7a5a3e")); hl(seg[0], seg[1] - 1, 229, C("#2a1c14"))
		for x in range(seg[0], seg[1], 11):
			vl(x, 226, 228, C("#2a1c14"))
		for x in range(seg[0], seg[1]):
			if hs(x / 4, 2, 81) > 0.55:
				p(x, 224, C("#c8d1de"))
		for x in range(seg[0] + 4, seg[1], 40):
			r(x, 230, 3, 6, C("#21180f"))
	# wagon ruts and prints down the street
	for x in range(W):
		var y = gy(x)
		if (x * 7) % 11 > 2:
			p(x, y + 14, C("#6a7890")); p(x, y + 15, C("#52677d"))
		if (x * 5) % 13 > 3:
			p(x, y + 24, C("#6a7890")); p(x, y + 25, C("#52677d"))
	bootprints(Callable(self, "gy"), 10, 950, 14, 82, C("#52677d"))

func light_evening():
	pool(397, 166, 70, C("#e6b66c"), 0.22)
	pool(518, 180, 80, C("#d68a3f"), 0.24)
	pool(463, 200, 46, C("#d68a3f"), 0.18)
	pool(628, 200, 46, C("#d68a3f"), 0.18)
	pool(546, 196, 30, C("#e6b66c"), 0.14)

func glow(night):
	for w in WINDOWS:
		if (night and w[5]) or (not night and w[4]):
			lit(w, night)
	if not night:
		r(391, 157, 11, 9, Color(0.99, 0.83, 0.42, 0.9)); r(393, 158, 7, 6, C("#fff1c8"))
		r(514, 174, 4, 6, Color(0.99, 0.83, 0.42, 0.9))
		for j in range(18):
			for i in range(18):
				if i != 9:
					p(537 + i, 183 + j, Color(0.9, 0.62, 0.3, 0.85))

func front():
	for x in range(W):
		var h = int(8 + sin(x * 0.019 + 2.0) * 6 + sin(x * 0.061) * 2 + hs(x / 7, 0, 90) * 3)
		for k in range(h):
			var c = C("#232d3f") if k < h - 2 else C("#52677d")
			if k == h - 1:
				c = C("#8e9bb0")
			p(x, H - 1 - k, c)

func paint(part):
	if part == "front":
		newimg(1059, 270)
		front()
		return img
	newimg(960, 270)
	if part == "main":
		street(); cabin(); store(); lamp(); hotel(); barn(); fence_and_sign()
		for w in WINDOWS:
			frame(w)
	elif part == "glow_evening":
		glow(false)
	elif part == "glow_night":
		glow(true)
	elif part == "light_evening":
		light_evening()
	return img
