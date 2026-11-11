# PARALLAX — native-density far layers for every exterior scene (sky, ranges, pine belts, distant
# roofs, haze, foreground silhouettes). Concatenated after lib.gd like the scene scripts; paint(part)
# takes "<scene>/<layer>" and returns the Image. Each layer is as wide as the engine's parallax
# canvas for that factor (painters.js lw(), x1.5) and 270 native px tall. Station and town layers
# trace the outline of the earlier painted layers (assets/backgrounds/*) so compositions hold.
# Light comes from the upper left (hidden moon): left-facing slopes lit, right-facing in shadow.

const VW = 480
const OLD = "D:/Webstránky/THE WHITE TRAIL/assets/backgrounds/"
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

func lwn(sw, f):
	return int(ceil((ceil(VW + (sw - VW) * f) + 2) * 1.5))

func bayer(x, y):
	return (B4[(int(y) % 4) * 4 + (int(x) % 4)] + 0.5) / 16.0

func pal(hexes):
	var a = []
	for h in hexes:
		a.append(C(h))
	return a

# dithered pick along a colour ramp
func ramp(cols, t, x, y):
	t = clamp(t, 0.0, 1.0) * (cols.size() - 1)
	var i = int(floor(t))
	if i >= cols.size() - 1:
		return cols[cols.size() - 1]
	return cols[i + 1] if (t - i) > bayer(x, y) else cols[i]

func vn(t, seed):
	var i = floor(t)
	var f = t - i
	var s = f * f * (3.0 - 2.0 * f)
	return lerp(hs(int(i), 0, seed), hs(int(i) + 1, 0, seed), s)

# ---------------- sky ----------------
func sky(w, hexes, seed, clouds, stars):
	newimg(w, 270)
	var cols = pal(hexes)
	for y in range(H):
		for x in range(W):
			p(x, y, ramp(cols, float(y) / 230.0, x, y))
	for k in range(stars):
		var sx = int(hs(k, 1, seed + 50) * W)
		var sy = int(hs(k, 2, seed + 50) * 110)
		p(sx, sy, cols[cols.size() - 1].lerp(C("#9fb0c8"), 0.35 if hs(k, 3, seed) > 0.8 else 0.15))
	# cloud strata: long ragged bands a step lighter than the sky around them, lit lower lip
	for k in range(clouds):
		var cy = 18 + int(hs(k, 1, seed) * 150)
		var cx = int(hs(k, 2, seed) * (W + 160)) - 120
		var ln_ = 140 + int(hs(k, 3, seed) * 300)
		var th = 3.0 + hs(k, 4, seed) * 8.0
		var t0 = float(cy) / 230.0
		for i in range(ln_):
			var u = float(i) / ln_
			var prof = th * sin(PI * u) * (0.55 + 0.45 * vn(i / 23.0, seed + k)) + (vn(i / 6.0, seed + k + 9) - 0.5) * 2.0
			if prof < 0.6:
				continue
			var y0 = int(cy - prof * 0.65)
			var y1 = int(cy + prof * 0.35)
			for y in range(y0, y1 + 1):
				var edge = min(y - y0, y1 - y)
				var lift = 0.13 if edge > 1 else 0.07
				if edge == 0 and bayer(cx + i, y) > 0.5:
					continue
				p(cx + i, y, ramp(cols, t0 + lift, cx + i, y))
			if prof > 2.5 and bayer(cx + i, y1 + 1) < 0.6:
				p(cx + i, y1 + 1, ramp(cols, t0 + 0.2, cx + i, y1 + 1))
	return img

# ---------------- mountain ranges ----------------
func contour_noise(n, base, amp, seed):
	var h = []
	for x in range(n):
		var v = vn(x / 69.0, seed) * 0.6 + vn(x / 25.0, seed + 7) * 0.28 + vn(x / 9.0, seed + 3) * 0.09 + vn(x / 3.0, seed + 5) * 0.03
		h.append(int(round(base - v * amp)))
	return h

# trace the top edge of an older (world-density) layer, upscale x1.5, add native crags
func contour_old(path, n, seed, crag):
	var im = Image.load_from_file(OLD + path)
	var tops = []
	for x in range(im.get_width()):
		var t = im.get_height()
		for y in range(im.get_height()):
			if im.get_pixel(x, y).a > 0.05:
				t = y
				break
		tops.append(t)
	var h = []
	for x in range(n):
		var wx = min(x / 1.5, im.get_width() - 1.001)
		var a = tops[int(wx)]
		var b = tops[min(int(wx) + 1, tops.size() - 1)]
		var v = lerp(float(a), float(b), wx - int(wx)) * 1.5
		v += (vn(x / 4.0, seed) - 0.5) * crag + (vn(x / 1.7, seed + 1) - 0.5) * crag * 0.4
		h.append(int(round(v)))
	# light smoothing so the old 1-unit stair-steps do not show
	var s = []
	for x in range(n):
		s.append(int(round((h[max(0, x - 1)] + h[x] * 2 + h[min(n - 1, x + 1)]) / 4.0)))
	return s

# sp: body, dark, lite, snow, snowd, rim, snowline, gully, fadeY, haze
func paint_range(hts, sp, seed):
	var body = C(sp.body); var dark = C(sp.dark); var lite = C(sp.lite)
	var snow = C(sp.snow); var snowd = C(sp.snowd)
	var haze = C(sp.haze) if sp.has("haze") else null
	for x in range(W):
		var top = hts[x]
		var sl = hts[max(0, x - 2)] - hts[min(W - 1, x + 2)]
		var lit = sl > 0
		var shade = sl < -1
		var snowY = sp.snowline + int((vn(x / 9.0, seed + 41) - 0.5) * sp.gully)
		var cap = 1 + int(max(0, sp.snowline - top) * 0.18) + int(hs(int(x / 3), 0, seed + 3) * 2)
		var dir = 1.0 if lit else -1.0
		for y in range(top, H):
			var d = y - top
			var c
			var snowy = y < snowY or d < cap
			# snow tongues running down the fall line on lit faces, rock ribs through the fields
			var fall = vn((x + y * 0.7 * dir) / 3.2, seed + 5)
			if not snowy and lit and d < 26 and fall > 0.72 - d * 0.004:
				snowy = true
			if snowy and d >= cap and vn((x - y * 0.6 * dir) / 2.4, seed + 61) < 0.2:
				snowy = false
			if snowy:
				if shade:
					c = snowd
				elif lit:
					c = snow
				else:
					c = snow if bayer(x, y) < 0.5 else snowd
				if d == 0 and sp.has("rim"):
					c = C(sp.rim)
			else:
				c = body
				if shade:
					c = dark if bayer(x, y) < 0.75 else body
				elif lit and hs(x, y, seed + 7) < 0.35:
					c = lite
				if d < 34 and vn((x + y * 0.7 * dir) / 1.8, seed + 71) < 0.08:
					c = dark
			if haze != null and y > sp.fadeY:
				var t = (y - sp.fadeY) / 26.0
				if bayer(x, y) < t:
					c = haze
			p(x, y, c)

# a fringe of tiny far pines along a ragged line (the timber at the foot of a range)
func fringe(y0, amp, col, lite, seed):
	var x = 0
	while x < W:
		var h = 3 + int(hs(x, 1, seed) * 5)
		var b = y0 + int((vn(x / 30.0, seed) - 0.5) * amp)
		for k in range(h):
			var half = int(k * 0.5)
			hl(x - half, x + half, b - h + k, col)
		p(x, b - h, lite)
		r(x - 3, b, 7, H - b, col)
		x += 2 + int(hs(x, 2, seed) * 3)

# ---------------- pines ----------------
func pine2(cx, base, h, body, lite, snow, seed):
	var tiers = max(3, int(h / 8))
	var trunk = max(2, int(h * 0.08))
	var crown = h - trunk
	var w = h * 0.44
	for k in range(int(crown)):
		var t = float(k) / crown
		var tp = fmod(t * tiers, 1.0)
		var half = (w * 0.5) * (0.22 + 0.78 * t) * (0.5 + 0.5 * tp) + 0.6
		half += (hs(k, cx, seed) - 0.5) * 1.4
		var y = base - h + k
		var hh = int(half)
		for i in range(-hh, hh + 1):
			var c = body
			if i < -hh * 0.15 and hs(i, k, seed + 1) < 0.5:
				c = lite
			if tp < 0.24 and i < hh * 0.55 and hs(i, k, seed + 2) < 0.75:
				c = snow
			p(cx + i, y, c)
		# drooping bough tips at the bottom of each tier
		if tp > 0.8:
			p(cx - hh - 1, y + 1, body); p(cx + hh + 1, y + 1, body)
	p(cx, base - h - 1, body)
	vl(cx, base - trunk, base, C("#0b0705"))

func pinebelt(base, amp, minH, maxH, spacing, body, lite, snow, ground, seed):
	var x = -int(spacing * 0.5)
	var k = 0
	while x < W + spacing:
		var b = base + int((vn(x / 40.0, seed) - 0.5) * amp)
		var h = minH + int(hs(k, 1, seed) * (maxH - minH))
		if hs(k, 3, seed) > 0.8:
			h = int(h * 0.6)
		pine2(x, b, h, body, lite, snow, seed + k)
		x += int(spacing * (0.55 + hs(k, 2, seed) * 0.9))
		k += 1
	if ground != null:
		for xx in range(W):
			var b = base + int((vn(xx / 40.0, seed) - 0.5) * amp)
			vl(xx, b, H - 1, ground)
			if hs(xx, 0, seed + 9) > 0.35:
				p(xx, b, snow)

# trace old pine-belt silhouettes: reuse the old layer's tree positions by its column tops
func pinebelt_old(path, body, lite, snow, ground, seed):
	var im = Image.load_from_file(OLD + path)
	var bot = 0
	for y in range(im.get_height() - 1, -1, -1):
		if im.get_pixel(20, y).a > 0.05:
			bot = y
			break
	var base = int(bot * 1.5) - 6
	var x = 0
	var k = 0
	while x < W:
		var wx = min(int(x / 1.5), im.get_width() - 1)
		var t = im.get_height()
		for y in range(im.get_height()):
			if im.get_pixel(wx, y).a > 0.05:
				t = y
				break
		var h = int((bot - t) * 1.5) + int(hs(k, 4, seed) * 6)
		if h > 8:
			pine2(x, base + int(hs(k, 5, seed) * 4), h, body, lite, snow, seed + k)
		x += 5 + int(hs(k, 2, seed) * 6)
		k += 1
	for xx in range(W):
		vl(xx, base, H - 1, ground)
		if hs(xx, 0, seed + 9) > 0.4:
			p(xx, base, snow)

# ---------------- distant buildings ----------------
var windows = []

func house(x, base, w, h, roof, col, edge, snow, seed):
	r(x, base - h, w, h + 40, col)
	var cx = x + w / 2.0
	for k in range(roof + 1):
		var half = (w / 2.0 + 1) * float(k) / roof
		hl(int(cx - half), int(cx + half), base - h - roof + k, col)
		p(int(cx - half), base - h - roof + k, snow)
		if hs(k, x, seed) > 0.5:
			p(int(cx - half) + 1, base - h - roof + k, snow)
	hl(int(cx) - 1, int(cx) + 1, base - h - roof - 1, snow)
	hl(x - 1, x + w, base - h, edge)
	if hs(x, 1, seed) > 0.35:
		var chx = int(x + w * (0.65 + hs(x, 2, seed) * 0.15))
		r(chx, base - h - roof - 2, 3, roof, col)
		hl(chx, chx + 2, base - h - roof - 3, snow)
	var nw = int(w / 6)
	for i in range(nw):
		var wx = x + 2 + i * 6 + int(w - nw * 6) / 2
		var wy = base - h + 3 + int(h * 0.35)
		r(wx, wy, 2, 3, edge.darkened(0.3))
		windows.append([wx, wy, hs(wx, wy, seed)])

func church(x, base, col, edge, snow):
	r(x, base - 36, 36, 76, col)
	for k in range(13):
		hl(x + 18 - k * 1.5 - 1, x + 18 + k * 1.5 + 1, base - 48 + k, col)
		p(int(x + 18 - k * 1.5 - 1), base - 48 + k, snow)
	r(x + 13, base - 66, 10, 20, col)
	for k in range(12):
		hl(x + 18 - int(k / 2.2), x + 18 + int(k / 2.2), base - 78 + k, col)
		p(x + 18 - int(k / 2.2), base - 78 + k, snow)
	vl(x + 18, base - 86, base - 79, edge); hl(x + 16, x + 20, base - 84, edge)
	r(x + 16, base - 60, 4, 6, edge.darkened(0.3))
	windows.append([x + 16, base - 22, 0.9]); windows.append([x + 6, base - 24, 0.2]); windows.append([x + 27, base - 24, 0.2])

func paint_windows(thr, amber, ker):
	for wv in windows:
		if wv[2] > thr:
			r(wv[0], wv[1], 2, 3, amber)
			p(wv[0], wv[1], ker)

# ---------------- haze / fog bands (opaque dither, thinning upward) ----------------
func hazeband(y0, y1, col, lite, density, seed):
	for y in range(y0, y1):
		var t = float(y - y0) / max(1, y1 - y0)
		for x in range(W):
			var wob = (vn(x / 37.0 + y * 0.03, seed) - 0.5) * 0.4
			if bayer(x, y) < (t + wob) * density:
				p(x, y, lite if hs(x, y, seed) > 0.85 else col)

# ---------------- foreground silhouettes ----------------
func trunks(seed):
	var x = 180
	var k = 0
	while x < W:
		var tw = 15
		r(x, 0, tw, H, C("#05070c"))
		vl(x, 0, H, C("#0d111b")); vl(x + 1, 0, H, C("#0a0d15"))
		for y in range(0, H, 2):
			if hs(x, y, seed) > 0.6:
				p(x, y, C("#1e2534"))
			if hs(x + 3, y, seed) > 0.8:
				vl(x + 3 + int(hs(y, 1, seed) * 10), y, y + 3, C("#0b0e16"))
		var y = 12
		while y < H - 45:
			var side = -1 if hs(k, y, seed) > 0.5 else 1
			var len = 9 + int(hs(y, k, seed) * 15)
			var bx = x - len if side < 0 else x + tw
			r(bx, y, len, 3, C("#05070c"))
			r(bx + (0 if side < 0 else len - 6), y - 1, 6, 1, C("#3b4558"))
			p(bx + (1 if side < 0 else len - 2), y - 2, C("#5d6a80"))
			y += 27 + int(hs(y, 3, seed) * 27)
		x += 345 + int(hs(k, 4, seed) * 210)
		k += 1

func reeds(seed, maxh, col, frost):
	var x = 0
	var k = 0
	while x < W:
		var h = 9 + int(hs(k, 1, seed) * maxh)
		var lean = int((hs(k, 2, seed) - 0.4) * 5)
		ln(x, H, x + lean, H - h, col)
		if hs(k, 3, seed) > 0.6:
			ln(x + 1, H, x + lean + 1, H - h + 3, col)
		if hs(k, 4, seed) > 0.55:
			p(x + lean, H - h - 1, frost)
		x += 2 + int(hs(k, 5, seed) * 11)
		k += 1

func icicles(seed):
	r(0, 0, W, 9, C("#090c13"))
	hl(0, W - 1, 9, C("#1a2232"))
	var x = 2
	while x < W:
		var h = 3 + int(hs(x, 1, seed) * 14)
		vl(x, 10, 10 + h, C("#3a4659")); vl(x + 1, 10, 10 + int(h * 0.6), C("#5d6a80"))
		p(x, 10 + h, C("#a3b4be"))
		x += 4 + int(hs(x, 2, seed) * 9)
	reeds(seed + 3, 15, C("#090c13"), C("#3a4659"))

# ---------------- scenes ----------------
func paint(part):
	windows = []
	var sw = 0
	match part:
		# BLACKWOOD STATION (560)
		"station/sky":
			return sky(lwn(560, 0), ["#060a15", "#0a1022", "#0f1730", "#161f3d", "#1f2a4a", "#2b3657", "#3a4565"], 3, 11, 26)
		"station/mountains_far":
			newimg(lwn(560, 0.08), 270)
			paint_range(contour_old("station/mountains_far.png", W, 5, 5.0), {"body": "#18203a", "dark": "#141b32", "lite": "#1d2744", "snow": "#7d8fb0", "snowd": "#5a6a8e", "rim": "#93a3c0", "snowline": 132, "gully": 26, "fadeY": 196, "haze": "#1f2a4a"}, 5)
			return img
		"station/mountains_near":
			newimg(lwn(560, 0.2), 270)
			paint_range(contour_old("station/mountains_near.png", W, 6, 4.0), {"body": "#0f1528", "dark": "#0b1020", "lite": "#141c33", "snow": "#4d5d7f", "snowd": "#35425f", "snowline": 162, "gully": 20, "fadeY": 300}, 6)
			fringe(214, 8, C("#0b1020"), C("#232e47"), 7)
			return img
		"station/pines":
			newimg(lwn(560, 0.4), 270)
			pinebelt_old("station/pines.png", C("#080c17"), C("#1a2338"), C("#232e47"), C("#080c17"), 8)
			return img
		"station/haze":
			newimg(560 * 3 / 2, 270)
			hazeband(168, 224, C("#2c3758"), C("#39466a"), 0.4, 9)
			return img
		# CROW'S HOLLOW (640)
		"town/sky_evening":
			return sky(lwn(640, 0), ["#070b17", "#0c1226", "#131a35", "#1c2445", "#293255", "#363f63"], 11, 12, 18)
		"town/sky_night":
			return sky(lwn(640, 0), ["#04060d", "#070a16", "#0b1021", "#11172e", "#181f3a", "#202847"], 11, 9, 40)
		"town/mountains":
			newimg(lwn(640, 0.08), 270)
			paint_range(contour_old("town/mountains.png", W, 12, 5.0), {"body": "#151c33", "dark": "#11172b", "lite": "#1a2340", "snow": "#7586ab", "snowd": "#4f5f85", "rim": "#8a9bbd", "snowline": 132, "gully": 28, "fadeY": 196, "haze": "#1c2445"}, 12)
			return img
		"town/far_trees":
			newimg(lwn(640, 0.3), 270)
			pinebelt_old("town/far_trees.png", C("#0a0f1b"), C("#192139"), C("#232d49"), C("#0a0f1b"), 13)
			return img
		"town/far_rooftops", "town/far_lights_evening":
			newimg(lwn(640, 0.5), 270)
			var col = C("#090d19"); var edge = C("#2a3352"); var sn = C("#3a4467")
			var xs = [[0, 22, 40, 9], [36, 24, 30, 8], [72, 26, 42, 10], [104, 14, 48, 6], [136, 22, 36, 9], [170, 24, 34, 8], [196, 30, 36, 10], [240, 24, 44, 10], [274, 20, 60, 7], [306, 22, 34, 9], [344, 24, 38, 9], [372, 22, 44, 8], [496, 30, 30, 10], [530, 14, 44, 6], [566, 28, 36, 10], [606, 26, 40, 10], [638, 22, 54, 8], [692, 20, 38, 8], [722, 22, 50, 8], [764, 26, 60, 9]]
			for q in xs:
				house(q[0], 227, q[2], q[1], q[3], col, edge, sn, 14)
			church(412, 227, col, edge, sn)
			if part == "town/far_rooftops":
				return img
			newimg(lwn(640, 0.5), 270)
			paint_windows(0.72, C("#b56e22"), C("#e0a04a"))
			return img
		"town/fog":
			newimg(706 * 3 / 2, 270)
			hazeband(162, 224, C("#2a3556"), C("#374366"), 0.38, 15)
			return img
		# THE ROAD (800)
		"road/sky":
			return sky(lwn(800, 0), ["#0a0f1b", "#0b0f1b", "#121628", "#1a1d33", "#191f2e"], 12, 10, 22)
		"road/mountains_far":
			newimg(lwn(800, 0.08), 270)
			paint_range(contour_noise(W, 168, 66, 51), {"body": "#171d2b", "dark": "#121724", "lite": "#1d2434", "snow": "#4e5a70", "snowd": "#3a4559", "rim": "#62708a", "snowline": 122, "gully": 30, "fadeY": 200, "haze": "#191f2e"}, 51)
			return img
		"road/mountains_near":
			newimg(lwn(800, 0.18), 270)
			paint_range(contour_noise(W, 195, 42, 52), {"body": "#111622", "dark": "#0d111b", "lite": "#151b29", "snow": "#333e52", "snowd": "#262f3f", "snowline": 160, "gully": 22, "fadeY": 400}, 52)
			fringe(214, 10, C("#0d111b"), C("#202838"), 53)
			return img
		"road/lights", "road/lights_glow":
			newimg(lwn(800, 0.32), 270)
			for i in range(7):
				var hx = W - 180 + i * 21 + int(hs(i, 1, 3) * 9)
				var hh = 9 + int(hs(i, 2, 3) * 9)
				house(hx, 210, 15, hh, 6, C("#0e121c"), C("#1a2130"), C("#2c3546"), 30 + i)
			if part == "road/lights":
				return img
			newimg(lwn(800, 0.32), 270)
			paint_windows(0.4, C("#d97706"), C("#f5c46b"))
			return img
		"road/pines_far":
			newimg(lwn(800, 0.42), 270)
			pinebelt(219, 6, 15, 36, 9, C("#0c1019"), C("#151b27"), C("#28303f"), C("#0c1019"), 61)
			return img
		"road/pines_near":
			newimg(lwn(800, 0.7), 270)
			pinebelt(228, 4, 45, 93, 24, C("#090c14"), C("#121725"), C("#2f394b"), null, 62)
			return img
		"road/front":
			newimg(lwn(800, 1.3), 270)
			trunks(8)
			return img
		# THE CREEK PATH (760)
		"creek/sky":
			return sky(lwn(760, 0), ["#05070d", "#0a0f1b", "#121628", "#121725"], 15, 9, 20)
		"creek/mountains_far":
			newimg(lwn(760, 0.08), 270)
			paint_range(contour_noise(W, 156, 63, 91), {"body": "#141a27", "dark": "#10151f", "lite": "#1a2131", "snow": "#46526a", "snowd": "#343e52", "rim": "#5a6680", "snowline": 116, "gully": 30, "fadeY": 196, "haze": "#121725"}, 91)
			return img
		"creek/mountains_near":
			newimg(lwn(760, 0.2), 270)
			paint_range(contour_noise(W, 189, 45, 92), {"body": "#0f141f", "dark": "#0b0f18", "lite": "#131926", "snow": "#2f394c", "snowd": "#232b3a", "snowline": 156, "gully": 22, "fadeY": 400}, 92)
			return img
		"creek/mill":
			newimg(lwn(760, 0.45), 270)
			var col = C("#0a0e17")
			var mx = W - 165
			r(mx, 174, 60, 50, col)
			for i in range(15):
				hl(mx - 4 + i, mx + 63 - i, 174 - 15 + i, col)
				p(mx - 4 + i, 174 - 15 + i, C("#2f394b"))
			hl(mx - 4, mx + 63, 159, C("#2f394b"))
			for i in range(4):
				r(mx + 8 + i * 13, 186, 5, 7, C("#0d121c"))
			var cx = mx + 81; var cy = 186; var rr = 21
			for a in range(160):
				var t = a / 160.0 * TAU
				for d in [0, 1, 2]:
					p(cx + int(round(cos(t) * (rr - d))), cy + int(round(sin(t) * (rr - d))), col)
				if a % 10 == 0:
					p(cx + int(round(cos(t) * (rr + 1))), cy + int(round(sin(t) * (rr + 1))), col)
			for a in range(10):
				var t = a / 10.0 * TAU
				ln(cx, cy, cx + cos(t) * rr, cy + sin(t) * rr, col)
			for a in range(70):
				var t = PI + a / 70.0 * PI
				if hs(a, 1, 90) > 0.5:
					p(cx + int(round(cos(t) * rr)), cy + int(round(sin(t) * rr)) - 1, C("#2f394b"))
			r(mx + 60, 162, 45, 4, col)
			pinebelt(219, 5, 15, 33, 9, C("#0c1019"), C("#141a26"), C("#232b3a"), C("#0c1019"), 93)
			return img
		"creek/pines":
			newimg(lwn(760, 0.72), 270)
			pinebelt(231, 4, 51, 99, 22, C("#070a11"), C("#0f1420"), C("#283244"), null, 94)
			return img
		"creek/front":
			newimg(lwn(760, 1.25), 270)
			reeds(98, 18, C("#0a0d14"), C("#283244"))
			return img
		# THE OLD SAWMILL (560)
		"sawmill/sky":
			return sky(lwn(560, 0), ["#05070d", "#0a0f1b", "#121628", "#111624"], 16, 9, 20)
		"sawmill/mountains_far":
			newimg(lwn(560, 0.06), 270)
			paint_range(contour_noise(W, 144, 45, 100), {"body": "#161c29", "dark": "#121723", "lite": "#1b2232", "snow": "#4a566c", "snowd": "#384256", "rim": "#5e6b84", "snowline": 112, "gully": 24, "fadeY": 190, "haze": "#111624"}, 100)
			return img
		"sawmill/ridge":
			newimg(lwn(560, 0.22), 270)
			paint_range(contour_noise(W, 165, 60, 101), {"body": "#0e131e", "dark": "#0a0e17", "lite": "#121826", "snow": "#3a4559", "snowd": "#2a3344", "rim": "#4c5870", "snowline": 120, "gully": 26, "fadeY": 400}, 101)
			return img
		"sawmill/pines":
			newimg(lwn(560, 0.45), 270)
			pinebelt(219, 5, 15, 39, 10, C("#0a0e16"), C("#121824"), C("#252e3e"), C("#0a0e16"), 102)
			return img
		"sawmill/front":
			newimg(lwn(560, 1.2), 270)
			reeds(105, 15, C("#090c13"), C("#3a4659"))
			return img
	return null
