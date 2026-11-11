# THE ROAD TO CROW'S HOLLOW — playfield layer, native 1200x270 (scene 800 world). Parallax sky,
# ridges, distant village lights and pines stay procedural. Keeps (world x1.5): fence runs 45-450 and
# 675-975 (broken 315-360), signpost 210, half-buried ore car 528, notice board 1074 (clue).

const PTS = [[0, 150], [120, 148], [260, 152], [400, 149], [540, 151], [680, 148], [800, 150]]
const FONT = {"C": ["111", "100", "100", "100", "111"], "R": ["110", "101", "110", "101", "101"], "O": ["111", "101", "101", "101", "111"], "W": ["101", "101", "101", "111", "101"], "'": ["010", "010", "000", "000", "000"], "S": ["111", "100", "111", "001", "111"], "H": ["101", "101", "111", "101", "101"], "L": ["100", "100", "100", "100", "111"], " ": ["000", "000", "000", "000", "000"]}

func gy(x):
	var wx = x / 1.5
	for i in range(PTS.size() - 1):
		var a = PTS[i]
		var b = PTS[i + 1]
		if wx >= a[0] and wx <= b[0]:
			return int(round((a[1] + (wx - a[0]) / float(b[0] - a[0]) * (b[1] - a[1])) * 1.5))
	return int(round(150 * 1.5))

func sign_text(x, y, t, c):
	for ch in t:
		var g = FONT.get(ch, FONT[" "])
		for j in range(5):
			for i in range(3):
				if g[j][i] == "1":
					p(x + i, y + j, c)
		x += 2 if ch == "'" else 4

func fences():
	for run in [[45, 450], [675, 975]]:
		var x = run[0]
		while x <= run[1]:
			var y = gy(x)
			var broken = x > 315 and x < 360
			r(x, y - 22, 3, 22, C("#1e1712")); vl(x, y - 22, y, C("#2a2018"))
			hl(x, x + 2, y - 23, C("#c8d1de")); p(x + 1, y - 24, C("#a3b4be"))
			if x + 21 <= run[1] and not broken:
				var y2 = gy(x + 21)
				for o in [16, 8]:
					ln(x + 3, y - o, x + 20, y2 - o, C("#2a2018")); ln(x + 3, y - o + 1, x + 20, y2 - o + 1, C("#1e1712"))
					ln(x + 3, y - o - 1, x + 20, y2 - o - 1, C("#8e9bb0"))
			if broken:
				ln(x + 3, y - 16, x + 13, y - 3, C("#2a2018")); ln(x + 3, y - 17, x + 13, y - 4, C("#8e9bb0"))
			x += 21

func ruts():
	for x in range(W):
		var y = gy(x)
		if (x * 7) % 11 > 2:
			p(x, y + 3, C("#6a7890")); p(x, y + 4, C("#52677d"))
		if (x * 5) % 13 > 3:
			p(x, y + 8, C("#6a7890")); p(x, y + 9, C("#52677d"))
		if hs(x, 0, 21) > 0.97:
			p(x, y + 6, C("#304661"))

func signpost():
	var x = 210
	var y = gy(x)
	r(x, y - 39, 3, 39, C("#2a1f17")); vl(x, y - 39, y, C("#3a2a1c"))
	var t = "CROW'S HOLLOW"
	var w = 50
	r(x - 6, y - 45, w, 11, C("#3a2a1c"))
	grain(x - 5, y - 44, w - 2, 9, C("#3a2a1c"), C("#2a1f17"), C("#4e3826"), 22)
	for i in range(6):
		vl(x - 6 + w + i, y - 45 + i, y - 35 - i, C("#3a2a1c"))
	hl(x - 6, x - 6 + w, y - 46, C("#d3dce0")); hl(x - 5, x - 7 + w, y - 47, C("#a3b4be"))
	sign_text(x - 3, y - 42, t, C("#c8bfa8"))

func orecar():
	var x = 528
	var y = gy(x)
	hl(x - 21, x + 45, y - 1, C("#3a3f4a")); hl(x - 21, x + 45, y, C("#24272e"))
	for i in range(-18, 45, 7):
		r(x + i, y, 4, 2, C("#2a1c14"))
	r(x - 3, y - 18, 33, 14, C("#5b3423"))
	for j in range(14):
		for i in range(33):
			if hs(i, j, 23) > 0.7:
				p(x - 3 + i, y - 18 + j, C("#7a4a30"))
			elif hs(i, j, 24) > 0.85:
				p(x - 3 + i, y - 18 + j, C("#3a2418"))
	r(x - 5, y - 20, 37, 3, C("#3a2418"))
	for i in range(5):
		vl(x + 2 + i * 6, y - 17, y - 6, C("#4a2a1b"))
	r(x + 1, y - 6, 6, 6, C("#24272e")); r(x + 19, y - 6, 6, 6, C("#24272e")); p(x + 3, y - 4, C("#3a3f4a")); p(x + 21, y - 4, C("#3a3f4a"))
	for i in range(-9, 45):
		var hh = max(0, int(6 - abs(i - 9) / 4.0))
		for k in range(hh):
			p(x + i, y - k, C("#a3b4be") if k < hh - 1 else C("#d3dce0"))
	for i in range(-4, 32):
		p(x + i, y - 21, C("#e4e9f0")); p(x + i, y - 22 - (1 if i % 5 == 0 else 0), C("#c8d1de"))

func notice():
	var x = 1074
	var y = gy(x)
	r(x, y - 45, 3, 45, C("#2a1f17")); r(x + 33, y - 45, 3, 45, C("#2a1f17"))
	vl(x, y - 45, y, C("#3a2a1c")); vl(x + 33, y - 45, y, C("#3a2a1c"))
	r(x - 3, y - 51, 42, 4, C("#2a1f17")); hl(x - 3, x + 38, y - 52, C("#e4e9f0")); hl(x - 2, x + 37, y - 53, C("#c8d1de"))
	r(x + 3, y - 45, 30, 24, C("#3a2a1c"))
	grain(x + 3, y - 45, 30, 24, C("#3a2a1c"), C("#2a1f17"), C("#4e3826"), 25)
	r(x + 7, y - 42, 14, 17, C("#c9bfa6")); hl(x + 7, x + 20, y - 42, C("#ddd4bc"))
	for i in range(6):
		hl(x + 9, x + 18 - (i % 2) * 3, y - 39 + i * 2, C("#6b6250"))
	p(x + 14, y - 43, C("#8a8a8a"))
	r(x + 23, y - 40, 8, 9, C("#a9a08a")); p(x + 26, y - 41, C("#8a8a8a"))
	hl(x + 24, x + 29, y - 37, C("#6b6250"))
	for i in range(3):
		p(x + 8 + i * 6, y - 22, C("#a3b4be"))

func paint(part):
	newimg(1200, 270)
	if part == "main":
		fences()
		snowfield(Callable(self, "gy"), 0, W, H, 17)
		ruts()
		bootprints(Callable(self, "gy"), 30, 1190, 15, 26, C("#52677d"))
		signpost()
		orecar()
		notice()
	return img
