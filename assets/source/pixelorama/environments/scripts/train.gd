# THE TRAIN — Blackwood Station's 4-4-0 with tender and one coach, native 330x78 (world 220x52,
# drawn at world y 100; rail at local native y 69). Concatenated after lib.gd. paint("body") is the
# sprite, paint("glow") the emissive layer (headlamp, cab, firebox, coach windows with passengers).
# Wheels and rods are NOT painted: the train prop draws them at native density so they can turn
# (drivers at native x 33/54/75 y 58, trucks at 21, 127, 144, 177, 192, 288, 304 y 63).
# Light: the station lamps are to the right and the sky to the upper left, so tops catch a cold
# rim and the lower flanks fall into shadow.

const IRON0 = "#0f1115"
const IRON1 = "#16181d"
const IRON2 = "#22252d"
const IRON3 = "#2e323c"
const IRON4 = "#3f4450"
const IRON5 = "#5a606d"
const BR1 = "#5e461c"
const BR2 = "#8a6a2a"
const BR3 = "#b08a3a"
const BR4 = "#dcbb66"
const WD0 = "#24140f"
const WD1 = "#33201a"
const WD2 = "#3e261d"
const WD3 = "#4f3224"
const SN1 = "#7d8aa0"
const SN2 = "#a3b4be"
const SN3 = "#d3dce0"

# horizontal cylinder: rows shaded top-lit, dark underside
func cyl(x, y, w, h, cols):
	for j in range(h):
		var t = float(j) / max(1, h - 1)
		var c
		if t < 0.12:
			c = cols[3]
		elif t < 0.3:
			c = cols[2]
		elif t < 0.75:
			c = cols[1]
		else:
			c = cols[0]
		hl(x, x + w - 1, y + j, C(c))

func rivets(x0, x1, y, step, c):
	var x = x0
	while x <= x1:
		p(x, y, C(c))
		x += step

func snowtop(x0, x1, y, seed):
	for x in range(x0, x1 + 1):
		var d = 1 + int(hs(int(x / 3), 0, seed) * 2.2)
		for k in range(d):
			p(x, y - k, C(SN2) if k < d - 1 else C(SN3))
		if hs(x, 5, seed) > 0.85:
			p(x, y + 1, C(SN1))

func loco():
	# cowcatcher: slatted wedge
	for i in range(14):
		vl(i, 69 - int(i * 0.95), 69, C(IRON2))
	for i in range(0, 14, 3):
		ln(i, 69, 12, 56, C(IRON4))
	hl(0, 13, 69, C(IRON1)); ln(0, 69, 13, 55, C(IRON3))
	# pilot beam (red) + coupler
	r(6, 52, 16, 4, C("#5a2219")); hl(6, 21, 52, C("#7a3326")); r(2, 53, 5, 2, C(IRON3))
	# running board + frame
	r(9, 49, 108, 4, C(IRON1)); hl(9, 116, 49, C(IRON4)); hl(9, 116, 52, C(IRON0))
	# cylinder + steam chest (in front of the drivers)
	r(18, 44, 20, 9, C(IRON2)); hl(18, 37, 44, C(IRON4)); r(18, 41, 20, 3, C(IRON3)); hl(18, 37, 41, C(IRON5))
	vl(18, 41, 52, C(IRON1)); vl(37, 41, 52, C(IRON1))
	# boiler with brass bands, handrail and rivets
	cyl(21, 27, 57, 23, [IRON1, IRON2, IRON3, IRON5])
	for bx in [30, 45, 60, 72]:
		vl(bx, 27, 49, C(BR2)); p(bx, 28, C(BR4)); p(bx, 29, C(BR3))
	hl(22, 77, 33, C(IRON4))
	for hx in range(24, 77, 9):
		p(hx, 34, C(IRON1))
	rivets(23, 76, 47, 3, IRON3)
	# smokebox: darker, with door ring and hinge
	cyl(12, 26, 12, 25, [IRON0, IRON1, IRON2, IRON4])
	vl(12, 27, 49, C(IRON0)); vl(16, 30, 46, C(IRON3)); p(17, 38, C(BR3)); p(17, 39, C(BR2))
	# number plate
	r(13, 35, 3, 4, C(BR2)); p(14, 36, C(BR4))
	# diamond stack with a snow rim
	r(16, 12, 8, 14, C(IRON1)); vl(17, 12, 25, C(IRON3))
	# diamond: flares out to the spark arrestor, then tapers back into the stack
	for i in range(10):
		var half = 2 + i if i < 6 else 7 - (i - 6) * 2
		hl(20 - half, 20 + half, 3 + i, C(IRON1)); p(20 - half, 3 + i, C(IRON3))
		if i < 6:
			p(20 + half, 3 + i, C(IRON0))
	hl(17, 23, 3, C(IRON4)); snowtop(17, 23, 2, 4); hl(13, 27, 8, C(IRON3))
	# headlamp: box on a bracket, brass trim, lens (lens glows on the glow layer)
	r(5, 14, 13, 11, C(IRON2)); hl(5, 17, 14, C(IRON4)); r(5, 16, 3, 7, C(BR3)); r(8, 24, 8, 2, C(IRON1))
	r(4, 12, 15, 2, C(IRON1)); snowtop(5, 17, 11, 6)
	# steam dome, sand dome (brass), bell, whistle
	r(41, 18, 11, 9, C(BR2)); hl(42, 50, 17, C(BR3)); hl(43, 49, 16, C(BR4)); vl(41, 18, 26, C(BR1)); r(48, 19, 3, 7, C(BR1))
	r(61, 21, 7, 6, C(BR2)); hl(62, 66, 20, C(BR4)); vl(61, 21, 26, C(BR1))
	snowtop(42, 50, 15, 7); snowtop(62, 66, 19, 8)
	r(56, 22, 3, 4, C(BR3)); p(57, 21, C(BR4))
	vl(70, 14, 26, C(BR2)); p(70, 13, C(BR4)); r(69, 18, 3, 2, C(BR3))
	# cab: wood-panelled, overhanging roof with snow, framed window, grab irons
	r(75, 12, 37, 40, C(WD1))
	for y in range(13, 51, 3):
		hl(76, 111, y, C(WD0))
	vl(75, 12, 51, C(WD3)); vl(111, 12, 51, C(WD0)); vl(93, 24, 51, C(WD0))
	r(82, 20, 18, 14, C(IRON1)); r(84, 22, 6, 10, C("#2a1a10")); r(92, 22, 6, 10, C("#2a1a10"))
	hl(82, 99, 20, C(WD3)); hl(82, 99, 34, C(SN1))
	r(72, 7, 43, 5, C(IRON1)); hl(72, 114, 11, C(IRON3)); snowtop(73, 113, 6, 9)
	vl(114, 20, 46, C(BR2)); vl(73, 20, 46, C(BR2))
	# fireman's step and the firebox door slot (glows)
	r(84, 50, 10, 2, C(IRON3))
	# tender: coal heaped under snow, flared top, rivet seams
	r(113, 25, 42, 26, C(IRON2))
	cyl(113, 25, 42, 26, [IRON1, IRON2, IRON2, IRON3])
	hl(112, 155, 25, C(IRON4)); hl(112, 155, 26, C(IRON5))
	for y in [32, 40, 47]:
		rivets(115, 153, y, 4, IRON3)
	for x in range(114, 155):
		var hgt = int(4 + sin((x - 114) / 41.0 * PI) * 3 + hs(x, 1, 11) * 2)
		for k in range(hgt):
			p(x, 24 - k, C("#0b0c10") if k < hgt - 2 else C(SN2))
		p(x, 24 - hgt, C(SN3) if hs(x, 2, 11) > 0.4 else C(SN2))
	r(112, 51, 44, 3, C(IRON1)); hl(112, 155, 51, C(IRON3))
	# drawbar to the coach
	r(155, 47, 4, 2, C(IRON3))

func coach():
	var x0 = 156
	var x1 = 327
	# body: clapboard siding, belt rail, letter board
	for y in range(16, 55):
		for x in range(x0, x1 + 1):
			var c = C(WD1)
			if y % 3 == 0:
				c = C(WD0)
			elif y % 3 == 1 and hs(x, y, 21) > 0.7:
				c = C(WD2)
			p(x, y, c)
	vl(x0, 16, 54, C(WD3)); vl(x0 + 1, 16, 54, C(WD2)); vl(x1, 16, 54, C(WD0))
	hl(x0, x1, 39, C(BR2)); hl(x0, x1, 40, C(BR1))
	r(x0 + 8, 43, 140, 5, C(WD0)); hl(x0 + 8, x0 + 147, 43, C(WD2))
	for k in range(14):
		r(x0 + 14 + k * 10, 45, 5, 1, C(BR1))
	# roof: clerestory with a snow load, vents
	r(x0 - 3, 9, x1 - x0 + 7, 6, C("#1c1412")); hl(x0 - 3, x1 + 3, 14, C("#2c201a")); hl(x0 - 3, x1 + 3, 15, C(IRON0))
	r(x0 + 6, 4, x1 - x0 - 12, 5, C("#1c1412"))
	for k in range(9):
		r(x0 + 12 + k * 17, 6, 8, 2, C("#3a2410"))
	snowtop(x0 - 2, x1 + 2, 8, 22); snowtop(x0 + 6, x1 - 6, 3, 23)
	for vx in [x0 + 24, x0 + 69, x0 + 114]:
		r(vx, -1, 6, 5, C(IRON1)); hl(vx - 1, vx + 6, 0, C(IRON3)); p(vx + 1, -1, C(SN3))
	# eight windows: frame, sash bar, sill; the panes go dark here and light on the glow layer
	for i in range(8):
		var wx = x0 + 11 + i * 16
		r(wx - 1, 17, 12, 17, C(WD3))
		r(wx, 18, 10, 14, C("#1c120c"))
		hl(wx, wx + 9, 24, C(WD3))
		hl(wx - 2, wx + 11, 33, C(SN1)); hl(wx - 2, wx + 11, 34, C(WD0))
	# door with a lit pane, steps, grab irons
	r(x0 + 145, 16, 18, 37, C(WD0)); r(x0 + 148, 19, 12, 13, C("#1c120c")); hl(x0 + 145, x0 + 162, 16, C(WD3))
	vl(x0 + 144, 22, 50, C(BR2)); vl(x0 + 163, 22, 50, C(BR2)); p(x0 + 159, 37, C(BR4))
	r(x0 + 144, 54, 20, 2, C(IRON3)); r(x0 + 147, 57, 14, 2, C(IRON3)); hl(x0 + 147, x0 + 160, 59, C(SN2))
	# underframe: sill, truss rods, queen posts
	r(x0, 55, x1 - x0 + 1, 4, C(IRON1)); hl(x0, x1, 55, C(IRON3))
	ln(x0 + 30, 58, x0 + 60, 62, C(IRON2)); hl(x0 + 60, x0 + 110, 62, C(IRON2)); ln(x0 + 110, 62, x0 + 140, 58, C(IRON2))
	vl(x0 + 60, 58, 62, C(IRON3)); vl(x0 + 110, 58, 62, C(IRON3))
	r(x0 + 72, 58, 26, 5, C(IRON2)); hl(x0 + 72, x0 + 97, 58, C(IRON4))

func glow():
	var amber = C("#e0a04a")
	var deep = C("#b56e22")
	var hot = C("#ffe3a3")
	# headlamp lens + spill
	r(5, 16, 3, 7, hot); p(4, 18, amber); p(4, 19, amber)
	# cab window, firebox slot
	for wx in [84, 92]:
		r(wx, 22, 6, 10, deep); r(wx, 22, 6, 3, amber); p(wx, 22, hot)
	r(84, 47, 10, 2, C("#d97706")); hl(85, 92, 47, amber)
	# coach windows: warm panes, a few passengers in silhouette, door pane
	var x0 = 156
	for i in range(8):
		var wx = x0 + 11 + i * 16
		for y in range(18, 32):
			for x in range(wx, wx + 10):
				if y == 24:
					continue
				p(x, y, amber if y < 27 else deep)
				if (x + y) % 2 == 0 and y < 20:
					p(x, y, hot)
		if i in [1, 4, 6]:
			r(wx + 3, 26, 5, 6, C(WD0)); r(wx + 4, 23, 3, 3, C(WD0)); hl(wx + 3, wx + 7, 22, C(WD0))
	for y in range(19, 32):
		hl(x0 + 148, x0 + 159, y, amber if y < 26 else deep)

func paint(part):
	newimg(330, 78)
	if part == "body":
		loco()
		coach()
	elif part == "glow":
		glow()
	return img
