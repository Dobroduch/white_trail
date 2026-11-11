# THE OLD SAWMILL — playfield layer, native 840x270 (scene 560 world). Parallax sky/ridge/pines stay
# procedural (the ridge-light event reads their heights). Every clue keeps its exact position
# (world x1.5): saw carriage 196, ash pit 256, boot prints 279-305, carved post marks 350,
# rope + burn 371-391, body area 392, watch 464, drag furrow 404-500.

func gy(x):
	# SAWMILL_GROUND in native px
	var wx = x / 1.5
	var y = 150.0
	if wx > 486 and wx <= 500:
		y = 150.0 + (wx - 486) / 14.0 * 5.0
	elif wx > 500:
		y = 155.0 + (wx - 500) / 60.0 * 3.0
	return int(round(y * 1.5))

func ground():
	snowfield(Callable(self, "gy"), 0, W, H, 7)
	# shallow wind scours
	for k in range(30):
		var x0 = int(hs(k, 1, 5) * W)
		var y0 = gy(x0) + 6 + int(hs(k, 2, 5) * 26)
		hl(x0, x0 + 5 + int(hs(k, 3, 5) * 12), y0, C("#52677d"))
		hl(x0 + 1, x0 + 4 + int(hs(k, 3, 5) * 12), y0 - 1, C("#a3b4be"))

func creek():
	for x in range(729, W):
		for y in range(234, H):
			var t = hs(x, y, 6)
			var c = C("#08101c")
			if t > 0.93:
				c = C("#2f3b4e")
			if (y - 234) < 2:
				c = C("#4a566b") if (x / 3) % 3 != 0 else C("#a3b4be")
			p(x, y, c)
	for k in range(26):
		var x = 735 + int(hs(k, 7, 6) * 100)
		var y = 240 + int(hs(k, 8, 6) * 28)
		hl(x, x + 3 + int(hs(k, 9, 6) * 12), y, C("#304661"))
		p(x + 1, y - 1, C("#52677d"))

func shed():
	# packed earth + sawdust floor under the roof
	for x in range(201, 495):
		for y in range(225, 231):
			var t = hs(x, y, 7)
			p(x, y, C("#3a2c20") if t < 0.55 else (C("#5a4632") if t < 0.8 else C("#4e3c2b")))
		if hs(x, 0, 8) > 0.6:
			p(x, 225, C("#6b5440"))
	hl(201, 494, 231, C("#7d8aa0"))
	# back wall: broken, gapped planks
	for x in range(207, 489, 7):
		if hs(x, 0, 9) > 0.78:
			continue
		var h = 30 + int(hs(x, 1, 9) * 39)
		r(x, 141, 6, h, C("#1a130d")); vl(x, 141, 141 + h, C("#241a12")); vl(x + 5, 141, 141 + h, C("#110c08"))
		if hs(x, 2, 9) > 0.5:
			p(x + 2, 141 + h, C("#241a12")); p(x + 3, 142 + h, C("#241a12"))
	# posts
	for px0 in [201, 300, 399, 489]:
		r(px0, 138, 6, 87, C("#21180f")); vl(px0, 138, 224, C("#2e2216")); vl(px0 + 5, 138, 224, C("#140e09"))
		for y in range(150, 224, 13):
			p(px0 + 2, y, C("#140e09"))
	# roof: slanted, snow-laden, icicles
	for x in range(186, 507):
		var y = int(round(123 + float(x - 186) / 321.0 * 15.0))
		r(x, y, 1, 10, C("#1a130d"))
		p(x, y + 9, C("#0d0906"))
		var sd = 3 + int(hs(x / 5, 0, 10) * 3)
		for k in range(sd):
			p(x, y - k, C("#d3dce0") if k == sd - 1 else C("#a3b4be"))
		p(x, y + 1, C("#52677d"))
		if x % 13 == 0:
			vl(x, y + 10, y + 12 + int(hs(x, 0, 11) * 6), C("#a3b4be"))
			p(x, y + 10, C("#d3dce0"))

func carriage():
	r(219, 210, 150, 4, C("#2e2216")); hl(219, 368, 210, C("#4a3626"))
	r(225, 214, 3, 11, C("#21180f")); r(357, 214, 3, 11, C("#21180f"))
	# clamped log with bark and end grain
	r(228, 198, 105, 12, C("#4a3626"))
	for x in range(228, 333):
		if hs(x, 0, 12) > 0.6:
			p(x, 198, C("#5e4632"))
		if hs(x, 1, 12) > 0.85:
			vl(x, 200, 203, C("#3a2a1c"))
	hl(228, 332, 209, C("#2e2216"))
	r(225, 199, 5, 10, C("#6b5440"))
	for i in range(4):
		hl(226, 228, 201 + i * 2, C("#7a6248"))
	# rusted blade
	var bx = 348
	var by = 204
	for a in range(96):
		var t = a / 96.0 * TAU
		p(bx + round(cos(t) * 13), by + round(sin(t) * 13), C("#5b3423") if a % 3 else C("#7a4a30"))
		p(bx + round(cos(t) * 12), by + round(sin(t) * 12), C("#4a2a1c"))
		if a % 4 == 0:
			p(bx + round(cos(t) * 14), by + round(sin(t) * 14), C("#5b3423"))
	r(bx - 2, by - 2, 4, 4, C("#3a3f4a"))

func pit():
	r(372, 220, 27, 5, C("#1c1814"))
	for i in range(22):
		p(373 + int(hs(i, 1, 13) * 24), 219 + int(hs(i, 2, 13) * 3), C("#3a3632") if hs(i, 3, 13) > 0.5 else C("#5a5650"))
	p(380, 221, C("#7a4a30")); p(388, 222, C("#5b3423"))

func tools():
	ln(309, 150, 315, 192, C("#3a3028")); r(306, 147, 9, 4, C("#3a3f4a"))
	ln(321, 153, 321, 189, C("#3a3028")); r(318, 186, 7, 6, C("#24272e"))
	r(270, 156, 14, 2, C("#24272e"))

func prints():
	for q in [[418, 226], [432, 228], [445, 226], [457, 228]]:
		r(q[0], q[1], 6, 2, C("#20170f")); p(q[0] + 6, q[1], C("#20170f")); p(q[0] - 1, q[1], C("#20170f")); p(q[0], q[1] + 2, C("#20170f"))

func wheel_frame():
	r(525, 90, 7, 135, C("#21180f")); vl(525, 90, 224, C("#2e2216"))
	r(723, 90, 7, 144, C("#21180f")); vl(723, 90, 233, C("#2e2216"))
	r(516, 90, 219, 7, C("#2a1f15")); hl(516, 734, 89, C("#d3dce0")); hl(516, 734, 88, C("#a3b4be"))
	for x in range(516, 735, 4):
		if hs(x, 0, 14) > 0.5:
			p(x, 87, C("#a3b4be"))
	ln(532, 105, 555, 93, C("#21180f")); ln(533, 105, 556, 93, C("#2e2216"))
	# rope burn on the beam, rope down to the cleat
	for i in range(6):
		p(585 + i, 96, C("#b39a72"))
	p(586, 97, C("#b39a72")); p(588, 97, C("#9a8260"))
	ln(586, 97, 534, 177, C("#8b7a55")); ln(587, 97, 535, 177, C("#6e5f42"))
	r(531, 174, 6, 4, C("#3a3f4a"))
	# fresh tally cuts on the post
	var marks = ["1111", "111", "1-1", "11111", "11"]
	var my = 186
	for mk in marks:
		var mx = 526
		for ch in mk:
			if ch == "1":
				vl(mx, my, my + 4, C("#c9b68e"))
				mx += 2
			else:
				hl(mx - 1, mx + 1, my + 2, C("#c9b68e"))
				mx += 2
		if mk.length() >= 5:
			ln(525, my + 4, 532, my, C("#c9b68e"))
		my += 7

func waterwheel():
	var cx = 672
	var cy = 177
	var rr = 42
	for a in range(300):
		var t = a / 300.0 * TAU
		p(cx + round(cos(t) * rr), cy + round(sin(t) * rr), C("#2e2216"))
		p(cx + round(cos(t) * (rr - 1)), cy + round(sin(t) * (rr - 1)), C("#3a2a1c"))
		p(cx + round(cos(t) * (rr - 2)), cy + round(sin(t) * (rr - 2)), C("#2e2216"))
		p(cx + round(cos(t) * (rr - 10)), cy + round(sin(t) * (rr - 10)), C("#2e2216"))
	for a in range(12):
		var t = a / 12.0 * TAU + 0.1
		ln(cx, cy, cx + cos(t) * (rr - 2), cy + sin(t) * (rr - 2), C("#2a1f15"))
		var bx = cx + round(cos(t) * (rr - 4))
		var by = cy + round(sin(t) * (rr - 4))
		r(bx - 3, by - 3, 6, 6, C("#241a12")); p(bx - 3, by - 3, C("#3a2a1c"))
		if sin(t) > 0.2:
			vl(bx, by + 3, by + 6 + (a % 3) * 2, C("#a3b4be"))
			p(bx, by + 3, C("#d3dce0"))
	r(cx - 4, cy - 4, 9, 9, C("#24272e")); r(cx - 2, cy - 2, 4, 4, C("#3a3f4a"))
	for a in range(160):
		var t = PI + a / 160.0 * PI
		if hs(a, 0, 15) > 0.45:
			p(cx + round(cos(t) * rr), cy + round(sin(t) * rr) - 1, C("#d3dce0"))
			p(cx + round(cos(t) * rr), cy + round(sin(t) * rr) - 2, C("#a3b4be"))

func furrow():
	for x in range(606, 750):
		var y = gy(x)
		if (x * 13) % 7 > 1:
			p(x, y + 1, C("#7d8aa0"))
		if (x * 7) % 5 > 1:
			p(x, y + 2, C("#5d6a80")); p(x, y + 3, C("#52677d"))
		if hs(x, 0, 16) > 0.8:
			p(x, y, C("#d3dce0"))
	# beneath the body: undisturbed white, a faint stain
	hl(576, 597, 225, C("#e4e9f0")); hl(578, 595, 226, C("#d3dce0"))
	p(585, 227, C("#6b3a3a")); p(588, 227, C("#5a3030"))

func shadows():
	# cold occlusion under the roof and wheel (translucent navy)
	for y in range(141, 225):
		for x in range(201, 495):
			if hs(x, y, 17) < 0.35 - float(y - 141) / 300.0:
				var o = g(x, y)
				if o.a > 0:
					p(x, y, o.lerp(C("#101c32"), 0.35))
	for x in range(195, 505):
		var y = gy(x)
		for k in range(4):
			if hs(x, k, 18) < 0.6 - k * 0.15:
				p(x, y + k, g(x, y + k).lerp(C("#304661"), 0.5))

func paint(part):
	newimg(840, 270)
	if part == "main":
		ground(); creek(); shed(); carriage(); pit(); tools(); prints(); wheel_frame(); waterwheel(); furrow(); shadows()
	return img
