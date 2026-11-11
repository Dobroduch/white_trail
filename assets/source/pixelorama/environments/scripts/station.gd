# BLACKWOOD STATION — native 840x270 playfield layers (scene 560 world). Sky, mountains, pines, haze and
# the train sprite keep the painted art. Geometry follows the painted station (world x1.5):
# station house 330-470 (roof to 482), BLACKWOOD sign 371-429, waiting-room window 344-363, door 379-397,
# telegraph window 419-439 + TEL sign, chalk timetable 446-469, lamp post 259, freight 286-316,
# telegraph pole 506. Parts: trackbed (behind the train), main (platform + station), glow, front.

func trackbed():
	for x in range(W):
		var top = 196 + int(sin(x * 0.02) * 2 + hs(x / 9, 0, 1) * 2)
		for y in range(top, 221):
			var t = hs(x, y, 2)
			var c = C("#52677d") if y < top + 3 else (C("#2b3649") if t > 0.4 else C("#232d3f"))
			if y == top:
				c = C("#a3b4be")
			if y > 208 and t > 0.8:
				c = C("#3a3f4a")
			p(x, y, c)
	# sleepers and two rails
	for x in range(-4, W, 12):
		r(x, 214, 8, 5, C("#21180f")); hl(x, x + 7, 214, C("#3a2a1c"))
	for ry in [211, 217]:
		hl(0, W - 1, ry, C("#565c68")); hl(0, W - 1, ry + 1, C("#24272e"))
		for x in range(0, W, 7):
			if hs(x, ry, 3) > 0.6:
				p(x, ry, C("#8e9bb0"))

func deck():
	# platform boards (front of the train), front beam, and the snowbank below
	for y in range(220, 238):
		for x in range(W):
			var row = (y - 220) / 6
			var c = C("#4e3826") if row % 2 == 0 else C("#493422")
			var t = hs(x, y, 4)
			if t > 0.93:
				c = C("#2a1c14")
			elif t < 0.05:
				c = C("#634832")
			if (y - 220) % 6 == 0:
				c = C("#2a1c14")
			p(x, y, c)
	for row in range(3):
		var x = -int(hs(row, 0, 5) * 40)
		while x < W:
			x += 40 + int(hs(row, x, 5) * 30)
			vl(x, 221 + row * 6, 225 + row * 6, C("#2a1c14"))
	hl(0, W - 1, 220, C("#7a5a3e"))
	# trodden snow on the boards: patchy, compacted at the edges, a path of prints
	for x in range(W):
		if hs(x / 5, 1, 6) > 0.55:
			p(x, 220, C("#c8d1de")); p(x, 221, C("#a3b4be"))
		if hs(x, 2, 6) > 0.9:
			p(x, 222, C("#8e9bb0"))
	r(0, 238, W, 5, C("#3b2a1e")); hl(0, W - 1, 238, C("#634832")); hl(0, W - 1, 242, C("#1a120d"))
	for x in range(6, W, 45):
		r(x, 243, 5, 12, C("#21180f")); vl(x, 243, 254, C("#2e2216"))
	snowfield(Callable(self, "bank"), 0, W, H, 31)

func bank(x):
	return 247 + int(sin(x * 0.03) * 3 + hs(x / 11, 0, 7) * 3)

func roof_line(x):
	# gable from eave (y 153 at x 483/723) to ridge (y 117 at x 600)
	return int(153 - (1.0 - abs(x - 603) / 120.0) * 36)

func house():
	var x0 = 495
	var x1 = 705
	# log walls
	for y in range(160, 220):
		var course = (y - 160) / 5
		for x in range(x0, x1):
			var c = C("#3b2a1e") if course % 2 == 0 else C("#33241a")
			var t = hs(x, y, 8)
			if (y - 160) % 5 == 4:
				c = C("#1f150e")
			elif (y - 160) % 5 == 0 and t > 0.3:
				c = C("#4e3826")
			elif t > 0.95:
				c = C("#2a1c14")
			p(x, y, c)
		# log ends at the corners
		if (y - 160) % 5 == 2:
			r(x0 - 3, y - 1, 3, 3, C("#5a4632")); p(x0 - 2, y, C("#2a1c14"))
			r(x1, y - 1, 3, 3, C("#5a4632")); p(x1 + 1, y, C("#2a1c14"))
	# stone footing
	for x in range(x0 - 3, x1 + 3):
		for y in range(216, 221):
			p(x, y, C("#3d3834") if hs(x, y, 9) > 0.3 else C("#4b4540"))
	# roof: dark shakes, heavy snow, eave icicles
	for x in range(477, 729):
		var top = roof_line(x)
		for y in range(top, 160):
			var c = C("#1a130d") if ((y - top) / 3 + x / 7) % 2 == 0 else C("#21180f")
			if y >= 155:
				c = C("#2a1f15")
			p(x, y, c)
		var sd = 5 + int(hs(x / 6, 0, 10) * 4)
		for k in range(sd):
			p(x, top - k, C("#e4e9f0") if k == sd - 1 else (C("#c8d1de") if k > sd / 2 else C("#a3b4be")))
		hl(x, x, 160, C("#52677d"))
		if x % 9 == 0:
			var len = 3 + int(hs(x, 1, 11) * 8)
			vl(x, 161, 160 + len, C("#a3b4be")); p(x, 161, C("#e4e9f0"))
	# chimney with snow cap
	r(645, 82, 12, 52, C("#3d3834"))
	for y in range(82, 134, 4):
		hl(645, 656, y, C("#2c2825"))
	r(643, 79, 16, 4, C("#2c2825")); hl(643, 658, 78, C("#d3dce0")); hl(644, 657, 77, C("#a3b4be"))
	# porch posts and eave board
	for px0 in [480, 720]:
		r(px0, 160, 4, 60, C("#21180f")); vl(px0, 160, 219, C("#3b2a1e"))
	r(477, 157, 252, 4, C("#2a1f15")); hl(477, 728, 157, C("#4e3826"))
	# sign board
	r(555, 140, 90, 14, C("#1a130d")); r(557, 142, 86, 10, C("#2a1f15")); hl(557, 642, 142, C("#3b2a1e"))
	sign_text(563, 144, "BLACKWOOD", C("#c8bfa8"))
	hl(555, 644, 139, C("#c8d1de"))
	# waiting-room window (dark, cold reflections)
	window(516, 165, 29, 31, false)
	# door with brass lamp bracket
	r(568, 171, 27, 48, C("#1a120d")); grain(571, 174, 21, 45, C("#3a2618"), C("#2a1c14"), C("#4a3220"), 12)
	hl(570, 593, 168, C("#a3b4be")); r(567, 168, 29, 3, C("#2a1f15"))
	r(589, 196, 2, 3, C("#c08a2c"))
	r(598, 174, 6, 2, C("#3a3f4a")); r(599, 176, 5, 7, C("#3a3028"))
	# telegraph-office window (lit) and TEL board
	window(628, 165, 31, 31, true)
	r(627, 201, 33, 12, C("#1a130d")); r(629, 203, 29, 8, C("#2a1f15"))
	sign_text(637, 205, "TEL", C("#c8bfa8"))
	# chalk timetable
	r(669, 163, 35, 32, C("#2a1f15")); r(671, 165, 31, 28, C("#1c2a24"))
	for i in range(6):
		hl(674, 674 + 8 + int(hs(i, 0, 13) * 14), 169 + i * 4, C("#9aa8a0"))
		if i % 2 == 0:
			hl(694, 698, 169 + i * 4, C("#c8d1d0"))
	hl(669, 703, 162, C("#a3b4be"))

func window(x, y, w, h, lit):
	r(x - 2, y - 2, w + 4, h + 4, C("#1a120d"))
	for j in range(h):
		for i in range(w):
			var c
			if lit:
				c = C("#d68a3f") if j > h / 2 else C("#e6b66c")
				if hs(i, j, 14) > 0.92:
					c = C("#a65c2c")
			else:
				c = C("#0e1628")
				if hs(i, j, 15) > 0.9:
					c = C("#2a3a5c")
				if j > h - 6 and hs(i, j, 16) < 0.5:
					c = C("#8c9ab4")
			p(x + i, y + j, c)
	vl(x + w / 2, y, y + h - 1, C("#1a120d")); hl(x, x + w - 1, y + h / 2, C("#1a120d"))
	r(x - 3, y + h + 2, w + 6, 3, C("#4e3826")); hl(x - 3, x + w + 2, y + h + 1, C("#c8d1de"))

const FONT = {"B": ["110", "101", "110", "101", "110"], "L": ["100", "100", "100", "100", "111"], "A": ["010", "101", "111", "101", "101"], "C": ["111", "100", "100", "100", "111"], "K": ["101", "110", "100", "110", "101"], "W": ["101", "101", "101", "111", "101"], "O": ["111", "101", "101", "101", "111"], "D": ["110", "101", "101", "101", "110"], "T": ["111", "010", "010", "010", "010"], "E": ["111", "100", "110", "100", "111"]}

func sign_text(x, y, t, c):
	for ch in t:
		var g = FONT[ch]
		for j in range(5):
			for i in range(3):
				if g[j][i] == "1":
					p(x + i, y + j, c)
		x += 4

func lamp():
	var x = 388
	r(x, 160, 3, 60, C("#24272e")); vl(x, 160, 219, C("#3a3f4a"))
	r(x - 3, 216, 9, 4, C("#24272e"))
	r(x - 6, 150, 15, 3, C("#24272e")); hl(x - 6, x + 8, 149, C("#c8d1de"))
	r(x - 5, 153, 13, 11, C("#2a2620")); r(x - 4, 154, 11, 9, C("#e6b66c")); r(x - 2, 155, 7, 6, C("#fff1c8"))
	vl(x + 1, 153, 163, C("#2a2620"))
	r(x - 3, 164, 9, 2, C("#24272e"))

func freight():
	# two crates and a lamp-oil drum
	for q in [[429, 203, 22, 17], [433, 190, 15, 13]]:
		r(q[0], q[1], q[2], q[3], C("#5a4632"))
		grain(q[0] + 1, q[1] + 1, q[2] - 2, q[3] - 2, C("#5a4632"), C("#3a2a1c"), C("#6b5440"), q[0])
		hl(q[0], q[0] + q[2] - 1, q[1], C("#7a6146")); vl(q[0] + q[2] - 1, q[1], q[1] + q[3] - 1, C("#3a2a1c"))
		ln(q[0] + 1, q[1] + 1, q[0] + q[2] - 2, q[1] + q[3] - 2, C("#3a2a1c"))
		hl(q[0], q[0] + q[2] - 1, q[1] - 1, C("#c8d1de"))
	r(453, 205, 12, 15, C("#3a4a3a")); hl(453, 464, 205, C("#5a6a5a")); hl(453, 464, 211, C("#2a3a2a")); hl(453, 464, 204, C("#c8d1de"))
	r(467, 212, 8, 8, C("#6b6250")); hl(467, 474, 211, C("#a3b4be"))

func pole():
	var x = 759
	r(x, 96, 4, 124, C("#21180f")); vl(x, 96, 219, C("#2e2216"))
	r(x - 14, 105, 32, 3, C("#21180f")); hl(x - 14, x + 17, 104, C("#a3b4be"))
	for k in [-12, -4, 8, 15]:
		r(x + k, 101, 2, 4, C("#8e9bb0"))
	ln(x + 15, 101, W, 112, C("#141820"))

func glow():
	r(384, 154, 11, 9, Color(0.99, 0.83, 0.42, 0.9)); r(386, 155, 7, 6, C("#fff1c8"))
	for j in range(31):
		for i in range(31):
			if i != 15 and j != 15:
				var c = C("#e6b66c") if j < 15 else C("#d68a3f")
				p(628 + i, 165 + j, Color(c.r, c.g, c.b, 0.85))
	r(600, 177, 3, 4, Color(0.99, 0.83, 0.42, 0.85))

func front():
	for x in range(W):
		var h = int(6 + sin(x * 0.021 + 1.0) * 5 + sin(x * 0.07) * 2 + hs(x / 7, 0, 17) * 3)
		for k in range(h):
			var y = H - 1 - k
			var c = C("#2b3649") if k < h - 2 else C("#52677d")
			if k == h - 1:
				c = C("#8e9bb0")
			p(x, y, c)

func paint(part):
	newimg(840, 270)
	if part == "trackbed":
		trackbed()
	elif part == "main":
		deck(); house(); lamp(); freight(); pole()
	elif part == "glow":
		glow()
	elif part == "front":
		front()
	return img
