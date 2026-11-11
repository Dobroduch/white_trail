# THE CREEK PATH — playfield layer, native 1140x270 (scene 760 world). Parallax sky, ridges,
# distant mill and pines stay procedural. Keeps (world x1.5): fresh tracks from 45 to 954,
# footbridge at 942, deadfall at 1035, iced creek along the bottom (y 252-270).

const PTS = [[0, 150], [200, 153], [420, 156], [600, 157], [760, 157]]

func gy(x):
	var wx = x / 1.5
	for i in range(PTS.size() - 1):
		var a = PTS[i]
		var b = PTS[i + 1]
		if wx >= a[0] and wx <= b[0]:
			return int(round((a[1] + (wx - a[0]) / float(b[0] - a[0]) * (b[1] - a[1])) * 1.5))
	return int(round(157 * 1.5))

func creekwater():
	for x in range(W):
		var shelf = 255 + int(2 + sin(x * 0.03) * 2 + hs(x / 7, 0, 3) * 2)
		for y in range(252, H):
			var c = C("#08101c")
			var t = hs(x, y, 4)
			if y < shelf:
				# ice shelf at the bank: pale, cracked, translucent toward the water
				c = C("#8e9bb0") if y < shelf - 2 else C("#52677d")
				if t > 0.85:
					c = C("#c8d1de")
				if (x + y) % 23 == 0:
					c = C("#304661")
			else:
				if t > 0.96:
					c = C("#2f3b4e")
				var flow = sin(x * 0.11 + y * 0.9)
				if flow > 0.97 and y > shelf + 2:
					c = C("#3a4659")
			p(x, y, c)
		p(x, 251, C("#2a3446") if (x * 7) % 5 else C("#3a4659"))
	# ice floes and quick black water glints
	for k in range(36):
		var x = int(hs(k, 1, 5) * W)
		var y = 260 + int(hs(k, 2, 5) * 9)
		var w = 6 + int(hs(k, 3, 5) * 26)
		hl(x, x + w, y, C("#3a4659")); hl(x + 1, x + w - 2, y - 1, C("#5d6a80"))
		if hs(k, 4, 5) > 0.6:
			hl(x + 2, x + 4, y + 1, C("#a3b4be"))

func rocks():
	for q in [[190, 249, 14], [470, 251, 10], [705, 252, 18], [880, 252, 12], [1110, 252, 16]]:
		var cx = q[0]
		var cy = q[1]
		var rr = q[2]
		for y in range(cy - int(rr * 0.6), cy + 1):
			for x in range(cx - rr, cx + rr):
				var d = pow((x - cx) / float(rr), 2) + pow((y - cy) / (rr * 0.6), 2)
				if d < 1.0:
					p(x, y, C("#2b3649") if x < cx else C("#334155"))
		for x in range(cx - rr + 2, cx + rr - 2):
			var top = cy - int(rr * 0.6 * sqrt(max(0.0, 1.0 - pow((x - cx) / float(rr), 2))))
			p(x, top, C("#d3dce0")); p(x, top + 1, C("#a3b4be"))

func bridge():
	var bx = 942
	for i in range(14):
		var y = 235 + i
		var w = 51 - int(i * 1.5)
		hl(bx + i * 3, bx + i * 3 + w, y, C("#3b2a1e") if i % 2 else C("#4e3826"))
		if i % 2 == 0:
			p(bx + i * 3 + int(hs(i, 0, 6) * w), y, C("#2a1c14"))
	hl(bx, bx + 51, 235, C("#c8d1de")); hl(bx + 2, bx + 49, 234, C("#a3b4be"))
	for px0 in [bx + 3, bx + 48]:
		r(px0, 210, 3, 27, C("#2a1c14")); vl(px0, 210, 236, C("#3b2a1e")); p(px0, 209, C("#c8d1de")); p(px0 + 1, 209, C("#c8d1de"))
	ln(bx + 3, 211, bx + 33, 237, C("#4e3826")); ln(bx + 48, 211, bx + 78, 237, C("#4e3826"))
	ln(bx + 4, 210, bx + 49, 210, C("#8b7a55")); ln(bx + 4, 211, bx + 49, 211, C("#5a4a32"))

func deadfall():
	var dx = 1035
	for o in range(5):
		ln(dx - 9, 180 + o, dx + 90, 235 + o, C("#1c140e") if o % 2 == 0 else C("#2a1f17"))
	for o in range(3):
		ln(dx - 9, 178 - o, dx + 87, 232 - o, C("#a3b4be") if o < 2 else C("#d3dce0"))
	for o in range(5):
		ln(dx + 15, 234 + o, dx + 105, 180 + o, C("#1c140e") if o % 2 == 0 else C("#2a1f17"))
	ln(dx + 16, 232, dx + 104, 178, C("#c8d1de"))
	for k in range(22):
		var x = dx + int(hs(k, 1, 7) * 96)
		var y = 186 + int(hs(k, 2, 7) * 45)
		var s = 1 if hs(k, 3, 7) > 0.5 else -1
		ln(x, y, x + s * 9, y - 7, C("#1c140e")); p(x + s * 9, y - 8, C("#a3b4be"))
	r(dx + 45, 168, 7, 69, C("#140e0a")); vl(dx + 45, 168, 236, C("#24180f")); hl(dx + 44, dx + 52, 167, C("#a3b4be"))

func shrubs():
	for k in range(14):
		var x = 30 + int(hs(k, 1, 8) * 1080)
		var base = gy(x) + 1
		for j in range(5):
			ln(x, base, x - 6 + j * 3, base - 8 - int(hs(k, j, 8) * 8), C("#141820"))
		p(x - 3, base - 12, C("#a3b4be")); p(x + 3, base - 10, C("#a3b4be"))

func paint(part):
	newimg(1140, 270)
	if part == "main":
		snowfield(Callable(self, "gy"), 0, W, 252, 11)
		rocks()
		creekwater()
		bootprints(Callable(self, "gy"), 45, 954, 13, 12, C("#3a4659"))
		shrubs()
		bridge()
		deadfall()
	return img
