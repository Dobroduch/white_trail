# ROOM 4 — native 480x270 (scene width 320 world). Positions are the ROOM4 painter's x1.5.
# Keeps: door "4" at x 12-48, wardrobe, washstand + lamp, window (snow prop draws inside it),
# chair, iron bed, and the SCRUBBED FLOORBOARDS clue at native 258-303 x 226-249.

func walls():
	r(0, 0, W, 24, C("#16100c"))
	for x in range(0, W, 66):
		r(x, 0, 8, 24, C("#1f1610")); vl(x + 7, 0, 23, C("#0d0806"))
	hl(0, W - 1, 24, C("#2a1c13"))
	for y in range(25, 183):
		for x in range(W):
			var c = C("#2f2b25")
			if x % 12 == 0:
				c = C("#35302a")
			if (x % 12) in [5, 6] and (y / 3) % 5 == 0:
				c = C("#3d372f")
			if hs(x, y, 2) < 0.03:
				c = C("#26231e")
			var soot = 1.0 - float(y - 25) / 50.0
			if soot > 0 and hs(x, y, 4) < soot * 0.6:
				c = c.lerp(C("#15120e"), 0.5)
			p(x, y, c)
	# pale rectangle where a picture once hung, and its nail
	r(135, 75, 27, 21, C("#3a352d")); hl(135, 161, 75, C("#2a2620")); vl(135, 75, 95, C("#2a2620"))
	p(148, 70, C("#5a5048")); p(148, 71, C("#3a3028"))
	r(0, 183, W, 5, C("#4e3826")); hl(0, W - 1, 183, C("#634832")); hl(0, W - 1, 187, C("#1a120d"))
	grain(0, 188, W, 37, C("#2a1d15"), C("#1f150e"), C("#33241a"), 5)
	for x in range(9, W, 45):
		r(x, 194, 36, 25, C("#22170f")); hl(x, x + 35, 194, C("#33241a")); vl(x, 194, 218, C("#33241a")); hl(x, x + 35, 218, C("#140d08"))

func floorboards():
	planks(225, 7, 7, C("#4e3826"), C("#493422"), C("#2a1c14"), C("#634832"), C("#7a5a3e"), 45)
	# the scrubbed patch: paler boards, raised grain, dark residue left only in the seams
	for y in range(227, 249):
		for x in range(258, 303):
			var edge = min(min(x - 258, 302 - x), 248 - y)
			var t = hs(x, y, 31)
			if edge < 3 and t > 0.5:
				continue
			p(x, y, C("#806650") if t > 0.82 else C("#6f5841"))
	for yy in [233, 240, 247]:
		for x in range(258, 303):
			p(x, yy, C("#3a1712") if hs(x, yy, 32) > 0.45 else C("#2a1c14"))
	vl(279, 227, 232, C("#3a1712")); vl(268, 234, 239, C("#3a1712")); vl(291, 241, 246, C("#3a1712"))
	for i in range(20):
		p(259 + int(hs(i, 1, 33) * 43), 227 + int(hs(i, 2, 33) * 21), C("#8a7058"))

func door():
	r(12, 144, 36, 81, C("#1a120d"))
	grain(15, 147, 30, 78, C("#3a2618"), C("#2a1c14"), C("#4a3220"), 11)
	r(19, 153, 21, 27, C("#32200f")); hl(19, 39, 153, C("#4a3220")); vl(19, 153, 179, C("#4a3220"))
	r(19, 186, 21, 33, C("#32200f")); hl(19, 39, 186, C("#4a3220")); vl(19, 186, 218, C("#4a3220"))
	r(40, 188, 2, 3, C("#c08a2c")); p(40, 188, C("#fcd34d"))
	# brass "4"
	r(25, 130, 9, 11, C("#2a1c14"))
	for q in [[27, 132], [27, 133], [27, 134], [28, 135], [29, 135], [30, 135], [31, 135], [30, 132], [30, 133], [30, 134], [30, 136], [30, 137], [30, 138]]:
		p(q[0], q[1], C("#c9a84a"))

func wardrobe():
	r(66, 123, 54, 102, C("#2a1c14"))
	grain(69, 129, 22, 90, C("#3b2a1e"), C("#2a1c14"), C("#4e3826"), 61)
	grain(95, 129, 22, 90, C("#3b2a1e"), C("#2a1c14"), C("#4e3826"), 62)
	hl(69, 90, 129, C("#4e3826")); hl(95, 116, 129, C("#4e3826"))
	r(63, 119, 60, 5, C("#4e3826")); hl(63, 122, 119, C("#634832"))
	r(89, 170, 2, 3, C("#a07a3a")); r(95, 170, 2, 3, C("#a07a3a"))
	r(68, 219, 4, 6, C("#1a120d")); r(114, 219, 4, 6, C("#1a120d"))

func washstand():
	r(138, 192, 45, 4, C("#634832")); hl(138, 182, 192, C("#7a5a3e"))
	grain(141, 196, 39, 29, C("#3b2a1e"), C("#2a1c14"), C("#4e3826"), 71)
	r(144, 201, 33, 9, C("#2a1c14")); r(158, 204, 4, 2, C("#a07a3a"))
	r(145, 186, 21, 6, C("#d6d0c4")); hl(146, 164, 186, C("#ece8e0")); hl(146, 164, 191, C("#a8a294"))
	r(150, 174, 9, 12, C("#c9c2b4")); vl(150, 174, 185, C("#ddd8cc")); p(159, 177, C("#c9c2b4")); p(160, 178, C("#c9c2b4")); p(160, 179, C("#c9c2b4"))
	r(171, 183, 8, 9, C("#a07a3a")); hl(171, 178, 183, C("#c9973f"))
	r(172, 171, 6, 12, C("#cfc6a8")); r(173, 172, 4, 10, C("#e8dfc0"))

func window():
	r(207, 93, 54, 69, C("#1a120d"))
	r(211, 97, 46, 61, C("#0e1628"))
	for y in range(97, 158):
		for x in range(211, 257):
			if y > 148 and hs(x, y, 41) < float(y - 148) / 10.0:
				p(x, y, C("#a3b4be"))
			elif hs(x, y, 40) > 0.985:
				p(x, y, C("#52677d"))
	vl(234, 97, 157, C("#1a120d")); vl(233, 97, 157, C("#2a1c14")); hl(211, 256, 126, C("#1a120d"))
	for q in [[211, 97], [235, 97], [211, 127], [235, 127]]:
		p(q[0], q[1], C("#8e9bb0")); p(q[0] + 1, q[1], C("#5d6a80")); p(q[0], q[1] + 1, C("#5d6a80")); p(q[0] + 2, q[1], C("#52677d"))
	r(204, 162, 60, 5, C("#4e3826")); hl(204, 263, 162, C("#7a5a3e"))

func chair():
	r(186, 195, 3, 30, C("#2a1c14")); vl(187, 195, 224, C("#3b2a1e"))
	r(186, 204, 15, 3, C("#3b2a1e")); hl(186, 200, 204, C("#4e3826"))
	r(198, 207, 3, 18, C("#2a1c14"))
	for y in [198, 201]:
		hl(186, 189, y, C("#3b2a1e"))

func bed():
	r(309, 177, 5, 48, C("#3a3f4a")); vl(309, 177, 224, C("#565c68"))
	r(417, 156, 5, 69, C("#3a3f4a")); vl(417, 156, 224, C("#565c68"))
	r(414, 153, 11, 4, C("#565c68"))
	for y in range(162, 192, 7):
		hl(417, 422, y, C("#565c68"))
	r(312, 198, 105, 15, C("#24272e")); hl(312, 416, 212, C("#1a1d24"))
	r(312, 189, 105, 10, C("#cfc9bc")); hl(312, 416, 189, C("#e6e1d6"))
	r(390, 181, 24, 9, C("#e0dbd0")); hl(391, 412, 181, C("#f0ece4")); hl(391, 412, 189, C("#b8b2a4"))
	r(312, 192, 72, 9, C("#3d3247")); hl(312, 383, 192, C("#51435d"))
	for x in range(315, 383, 10):
		p(x, 191, C("#bdb6a8")); p(x + 1, 191, C("#bdb6a8"))
	for x in range(318, 382, 12):
		vl(x, 193, 200, C("#463a52"))
	r(312, 213, 4, 12, C("#3a3f4a")); r(412, 213, 4, 12, C("#3a3f4a"))

func paint(part):
	newimg(480, 270)
	if part == "main":
		walls(); floorboards(); door(); wardrobe(); washstand(); window(); chair(); bed()
	elif part == "light_evening":
		pool(174, 176, 110, C("#d68a3f"), 0.3)
		pool(234, 128, 36, C("#52677d"), 0.18)
	elif part == "light_night":
		pool(174, 178, 50, C("#a65c2c"), 0.22)
		pool(234, 128, 36, C("#52677d"), 0.16)
	elif part == "glow_evening":
		r(173, 173, 4, 8, Color(0.99, 0.83, 0.42, 0.9)); r(174, 175, 2, 4, C("#fff1c8"))
	elif part == "glow_night":
		r(174, 178, 2, 3, Color(0.85, 0.47, 0.02, 0.7))
	return img
