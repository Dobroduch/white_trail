# Character sprite sheets for THE WHITE TRAIL (native density: 1 px = 1 native px).
# Run inside Pixelorama through the MCP eval_gdscript loader (see README.md next to this file):
# sheet(name) -> Image, a horizontal strip of equal frames matching NATIVE_SHEETS in
# src/engine/assets.js. Every figure is drawn facing right, standing upright: the head sits over the
# feet, the back line is straight, and the shoulders are square. Light comes from the front and above.
#
# Each grid row is one pixel row; '.' is transparent and every other character is a palette key.
extends RefCounted

var img

func C(h):
	return Color.html(h)

# A row is either a full-width string, or segments "col:pixels|col:pixels" placed at those columns.
func expand(row):
	if row.find(":") < 0:
		return row
	var out = ""
	for seg in row.split("|"):
		var parts = seg.split(":")
		var col = int(parts[0])
		while out.length() < col:
			out += "."
		out = out.substr(0, col) + parts[1]
	return out

func blit(ox, oy, rows, pal):
	for y in range(rows.size()):
		var row = expand(rows[y])
		for x in range(row.length()):
			var ch = row[x]
			if ch == "." or ch == " ":
				continue
			if not pal.has(ch):
				push_error("palette key '%s' missing (row %d)" % [ch, y])
				continue
			var px = ox + x
			var py = oy + y
			if px >= 0 and py >= 0 and px < img.get_width() and py < img.get_height():
				img.set_pixel(px, py, C(pal[ch]))

# Breathing frame: everything above `split` rises by one pixel (chest lifts, shoulders square up).
func breathe(ox, fw, fh, split):
	for y in range(0, split):
		for x in range(ox, ox + fw):
			img.set_pixel(x, y, img.get_pixel(x, y + 1) if y + 1 < split else img.get_pixel(x, y))

func strip(fw, fh, n):
	img = Image.create(fw * n, fh, false, Image.FORMAT_RGBA8)

func sheet(name):
	match name:
		"silas_vance": return silas()
		"conductor": return conductor()
		"finch": return finch()
		"gable": return gable()
		"patron": return patrons()
		"hale_body": return hale()
	push_error("unknown sheet " + name)
	return null

# ---------------------------------------------------------------------------------------------
# SILAS VANCE — 28x42, anchor 12. Six frames: idle x2, walk x4.
# Late forties, ex-scout. Wide slouch hat with a pinched crown, a caped blue-grey duster worn open
# over a dark vest, red bandana, grey-shot beard, revolver grip at the right hip, worn boots.
# Broad, square shoulders and a planted stance: the most solid silhouette in the cast.
const SILAS_PAL = {
	"k": "#0d1018",
	"h": "#2e2722", "H": "#4a3f35", "J": "#5c4f41", "j": "#15110e",
	"s": "#c99a7a", "S": "#9a6f56", "e": "#1a1410", "E": "#e8d9c8",
	"b": "#4b3a2e", "B": "#2a1d15", "x": "#7a6d60",
	"r": "#9a4a3c", "R": "#6e3029",
	"c": "#3b4456", "C": "#5d6a80", "d": "#272d3b", "D": "#1c212c", "L": "#7d8aa0",
	"v": "#2f3440", "w": "#8f8576", "y": "#c9973f",
	"l": "#4a3428", "g": "#6b4630", "G": "#4a2f1e", "m": "#8f7f6a",
	"n": "#46372b", "N": "#2b221c",
	"t": "#22252e", "T": "#3a4050",
	"o": "#3a2a1e", "O": "#5a4330", "q": "#1e1610",
}

const SILAS_TOP = [
	"..........kkkkk.............",
	".........khHHhhk............",
	"........khHHHhhhk...........",
	"........khHhhhhhk...........",
	"....kkkkkjjjjjjjkkkkk.......",
	"...kJJJJHHHhhhhhhJJJJk......",
	"...kkjjjjjjjjjjjjjjjkk......",
	"....kkkkkbbSSSSSSSkkkk......",
	"........kbbSsssSSsk.........",
	"........kbbSssssesk.........",
	"........kbSSsssssssk........",
	"........kBbbsssbbbk.........",
	"........kBBbxbbbeBk.........",
	".........kBbbxbbbk..........",
	"........kCdRrrrrrk..........",
	"......kkCcdRrrRrCCkk........",
	".....kDCcccdRrRdcCLLk.......",
	".....kDdcccccCvwvdcCLk......",
	".....kDdccccCvwwvdcCLk......",
	".....kDDddddCvvwvdDdCk......",
	".....kDdccccCvyvvdcCCk......",
	"......kDcccCvvvvvdcCCk......",
	"......kDcccdllyllldcCk......",
	"......kDcccdvvvmgGdcCk......",
	"......kDcccdvvvggGdcCk......",
	"......kDdccdcvvvGddcCk......",
	".....knNccccdccvddnnNk......",
	".....knNccccdccvdknnNk......",
	".....kDdccccdcctdkkkk.......",
	".....kDdDDDcdctdcCk.........",
	".....kDddccccdctdcCk........",
	"....kDdddcccccdtdccCk.......",
	"....kDdddccccccdtdcCCk......",
	"....kkkkkkkkkkkkkkkkkk......",
]

const SILAS_LEGS_IDLE = [
	".......kttk..kTTTk..........",
	".......kttk..kTTTk..........",
	".......kttk..kTTTk..........",
	".......kttk..kTTTk..........",
	".......kook..kOOOk..........",
	".......kook..kOOOOk.........",
	"......kqoOOkkqoOOOOk........",
	"......kkkkkkkkkkkkkk........",
]

const SILAS_LEGS_W0 = [
	"......kttk...kTTTk..........",
	".....kttk.....kTTTk.........",
	".....kttk.....kTTTk.........",
	"....kttk.......kTTk.........",
	"....kook.......kOOk.........",
	"...kook........kOOOOk.......",
	"..kqok.........kqoOOOk......",
	"..kkk..........kkkkkkk......",
]

const SILAS_LEGS_W1 = [
	"........kttTTTk.............",
	"........kttTTTk.............",
	".......kttkTTTk.............",
	"......kttk.kTTk.............",
	".....kook..kOOk.............",
	".....kok...kOOOOk...........",
	"...........kqoOOOk..........",
	"...........kkkkkkk..........",
]

const SILAS_LEGS_W2 = [
	"......kTTk...ktttk..........",
	".....kTTk.....ktttk.........",
	".....kTTk.....ktttk.........",
	"....kTTk.......kttk.........",
	"....kOOk.......kook.........",
	"...kOOk........kooook.......",
	"..kqOk.........kqoooOk......",
	"..kkk..........kkkkkkk......",
]

const SILAS_LEGS_W3 = [
	"........kTTtttk.............",
	"........kTTtttk.............",
	".......kTTktttk.............",
	"......kTTk.kttk.............",
	".....kOOk..kook.............",
	".....kOk...koooOk...........",
	"...........kqoooOk..........",
	"...........kkkkkkk..........",
]

func silas():
	var fw = 28
	var fh = 42
	strip(fw, fh, 6)
	var legs = [SILAS_LEGS_IDLE, SILAS_LEGS_IDLE, SILAS_LEGS_W0, SILAS_LEGS_W1, SILAS_LEGS_W2, SILAS_LEGS_W3]
	# walk frames 1 and 3 (passing) ride one pixel lower: the body drops as the legs cross
	var bob = [0, 0, 0, 1, 0, 1]
	for i in range(6):
		var ox = i * fw
		blit(ox, 34, legs[i], SILAS_PAL)
		blit(ox, bob[i], SILAS_TOP, SILAS_PAL)
	breathe(fw, fw, fh, 22)
	return img

# Idle NPC: two frames, the second a breath (shoulders and head rise a pixel).
func idle2(fw, fh, rows, pal, split):
	strip(fw, fh, 2)
	blit(0, 0, rows, pal)
	blit(fw, 0, rows, pal)
	breathe(fw, fw, fh, split)
	return img

# ---------------------------------------------------------------------------------------------
# CONDUCTOR — 26x42, anchor 11. A stout railwayman of sixty: parade-ground straight back, chest and
# belly forward, tall flat-topped cap with a brass plate, double-breasted navy frock coat with two
# rows of brass buttons, white walrus moustache and mutton chops. Holds his lantern out in front.
const CONDUCTOR_PAL = {
	"k": "#0d1018",
	"a": "#24304a", "A": "#3c4d70", "z": "#18202f", "Z": "#121722",
	"y": "#c9973f", "Y": "#8a6a2a",
	"s": "#c99a7a", "S": "#9a6f56", "e": "#1a1410",
	"w": "#9a948f", "W": "#c9cfd6",
	"n": "#1a1410",
	"t": "#262a35", "o": "#241912", "O": "#3a2a1e", "q": "#120d09",
}
const CONDUCTOR_ROWS = [
	"7:kkkkkkkk",
	"6:kzaaaaaaAk",
	"6:kzaaayyaAk",
	"6:kzaaaaaaAk",
	"6:kZzzzzzzZk",
	"6:kkkkkkkkkkkk",
	"6:kwwSSSSSSk",
	"6:kwwSssssesk",
	"6:kwWSssssssk",
	"6:kwwwsWWWWwk",
	"6:kwwwsSsssk",
	"7:kwwsssk",
	"6:kZzWWWWWk",
	"4:kkzaaaWyWaAkk",
	"3:kZzaaaayaayAAk",
	"3:kZzaaaaaaaaAAk",
	"3:kZzaaaayaayAAk",
	"3:kZzaaaaaaaazAAk",
	"3:kZzaaaayaayazAAk",
	"3:kZzzaaaaaaaAzAAk",
	"3:kZzzaaayaayaAzAAk",
	"3:kZzzaaaaaaaaAkzAAk",
	"3:kZzzZZZZZZZZZkkzAk",
	"3:kZzzaaaaaaaaAk|18:kAk",
	"3:knzaaaaaaaaAk|17:kssk",
	"3:knzaaaaaaaaAk|17:kSsk",
	"3:kZzaaaaaaaaAk|18:kk",
	"3:kZzaaaaaaaaAk",
	"3:kZzaazaaaaaAk",
	"3:kZzaazaaaaaAk",
	"3:kZzaazaaaaAAk",
	"3:kkkkkkkkkkkkk",
	"5:kttk|11:kttk",
	"5:kttk|11:kttk",
	"5:kttk|11:kttk",
	"5:kttk|11:kttk",
	"5:kttk|11:kttk",
	"5:kttk|11:kttk",
	"5:kook|11:kook",
	"5:kook|11:koOOk",
	"4:kqoOOk|10:kqoOOOk",
	"4:kkkkkkkkkkkkk",
]
func conductor():
	return idle2(26, 42, CONDUCTOR_ROWS, CONDUCTOR_PAL, 23)

# ---------------------------------------------------------------------------------------------
# CONSTABLE EDGAR FINCH — 26x42, anchor 10.5. Young, lanky and sleep-deprived: narrow shoulders held
# a little high, long thin legs, a bowler instead of a range hat, scarf wound to the chin, stubble and
# shadowed eyes. Long brown overcoat cinched with a belt, tin star on the chest. His lantern arm is
# held tight to his side.
const FINCH_PAL = {
	"k": "#0d1018",
	"h": "#241912", "H": "#3a2f26",
	"b": "#3a2618", "s": "#cfa486", "S": "#9a6f56", "p": "#a9806a", "x": "#8f6e5a", "e": "#1a1410",
	"f": "#4a5048", "F": "#343a34",
	"u": "#5a4632", "U": "#7a6146", "i": "#3d2f22", "I": "#2a1e16",
	"W": "#c9cfd6", "w": "#878380",
	"n": "#3a2f26", "N": "#241912",
	"t": "#2b2e3a", "T": "#3a3f4c", "o": "#241912", "O": "#3a2618", "q": "#120d09",
}
const FINCH_ROWS = [
	"8:kkkkk",
	"7:khhHHhk",
	"6:khhhHHHhk",
	"6:khhhhhhhk",
	"5:kkhhhhhhhkk",
	"5:kHHHHHHHHHkk",
	"6:kbbSSSSSSk",
	"6:kbSssssesk",
	"6:kbSsssspssk",
	"6:kSxsssxxsk",
	"7:kxxxSxk",
	"7:kfFffk",
	"5:kiufFffuk",
	"4:kIiuufFfuUk",
	"4:kIiuuufuuUUk",
	"4:kIiuuuWuuiUUk",
	"4:kIiuuWwWuiUUk",
	"4:kIiuuuwuuiUUk",
	"4:kIiuuuuuuikUUk",
	"4:kIiuuuuuuikuUk",
	"4:kIiuuuuuuikUUk",
	"4:kIiiiiiiiikuUk",
	"4:kIiuuwuuuikUUk",
	"4:kIiuuuuuuik|15:kuUk",
	"4:kniuuuuuuik|15:knnk",
	"4:kniuuuuuuik|15:knNk",
	"4:kIiuuuuuuik|16:kk",
	"4:kIiuuuuuuik",
	"3:kIiiuuuuuuuk",
	"3:kIiiuuuuuuuk",
	"3:kkkkkkkkkkkk",
	"5:kttk|9:ktTk",
	"5:kttk|9:ktTk",
	"5:kttk|9:ktTk",
	"5:kttk|9:ktTk",
	"5:kttk|9:ktTk",
	"5:kttk|9:ktTk",
	"5:kttk|9:ktTk",
	"5:kttk|9:ktTk",
	"5:kook|9:koOk",
	"4:kqook|9:kqoOOk",
	"4:kkkkkkkkkkk",
]
func finch():
	return idle2(26, 42, FINCH_ROWS, FINCH_PAL, 22)

# ---------------------------------------------------------------------------------------------
# MRS. GABLE — 26x42, anchor 11. Controlled and composed: a dead-straight back, chin level, hair
# drawn into a bun, a high-collared plum dress with a cameo brooch, a bustle that throws the skirt
# back, a long work apron, hands folded at the waist, and the hotel's brass keys on a chatelaine.
const GABLE_PAL = {
	"k": "#0d1018",
	"h": "#3b2f2a", "H": "#5a4a40", "g": "#7a6a60",
	"s": "#d0a68a", "S": "#9a6f56", "e": "#1a1410",
	"a": "#43304a", "A": "#5e4668", "z": "#2a1e2a", "Z": "#1c141e",
	"W": "#c7beae", "w": "#9d9484",
	"y": "#c9973f", "Y": "#8a6a2a",
}
const GABLE_ROWS = [
	"8:kkkkkk",
	"7:khHHHhhk",
	"5:kkkhhhhHHhk",
	"4:khHhhhhSSSSk",
	"4:khghhhSssssk",
	"5:khhhSsssesk",
	"6:khhSssssssk",
	"6:khhSssSssk",
	"7:khSsssk",
	"7:kzAAyAk",
	"6:kzaaaaAk",
	"5:kzaaaaaAAk",
	"4:kZzaaaaaaAAk",
	"4:kZzaaWWWaAAk",
	"4:kZzaaWWWwaAk",
	"4:kZzaaWWWwaAk",
	"4:kZzaaWWWwzAk",
	"4:kZzzaWWWwzAAk",
	"4:kZzzaWWWAAAAk",
	"4:kZzzaWWssSAk",
	"4:kZzyaWWWwwzAk",
	"3:kZzzyaWWWwwzAk",
	"2:kZzzzYaWWWwwzAk",
	"1:kZzzzYyYaWWWwwzAk",
	"1:kZzzzyzyWWWWwwAk",
	"2:kZzzYaYaWWWWwwAk",
	"2:kZzzzaaaWWWWwwAk",
	"2:kZzzzaaaWWWWwwaAk",
	"2:kZzzzaaaWWWWwwaAk",
	"2:kZzzzaaaWWWWwwaAk",
	"2:kZzzzaaaaWWWWwwaAk",
	"2:kZzzzaaaaWWWWwwaAk",
	"2:kZzzzaaaaWWWWwwaAk",
	"1:kZzzzzaaaaWWWWwwaAk",
	"1:kZzzzzaaaaWWWWwwaAk",
	"1:kZzzzzaaaaWWWWwwaAAk",
	"1:kZzzzzaaaaaWWWwwaaAk",
	"1:kZzzzzaaaaaWWWwwaaAk",
	"1:kZzzzzaaaaaawwwaaaAk",
	"1:kZzzzzzaaaaaaaaaaaAk",
	"1:kZZZZZZZZZZZZZZZZZZk",
	"1:kkkkkkkkkkkkkkkkkkkk",
]
func gable():
	return idle2(26, 42, GABLE_ROWS, GABLE_PAL, 20)
# ---------------------------------------------------------------------------------------------
# PARLOR PATRONS — 18x21 each, anchor 8.5, seated behind the corner table (the table covers rows
# 14+). Three different men, each in two poses: talking among themselves, and turned to stare at the
# stranger. Sheet order: patron, patron_look, patron_b, patron_b_look, patron_c, patron_c_look.
#  A: a heavy-set miner — flat wool cap, full black beard, sheepskin collar, sits back square.
#  B: an older clerk — bald crown with a grey fringe, spectacles, moustache, waistcoat and
#     shirtsleeves with a red garter; sits bolt upright.
#  C: a young teamster — red knit cap, plaid mackinaw, stubble; elbows on the table.
const PATRON_PAL = {
	"k": "#0d1018",
	"c": "#3a3b4a", "C": "#555a70",
	"b": "#2b2420", "B": "#1a1410",
	"s": "#c9a084", "S": "#93705b", "e": "#1a1410",
	"o": "#4a3c31", "O": "#5f5853", "W": "#b8ad92", "w": "#8a8070",
	"t": "#29231f", "T": "#3a332c",
	"g": "#8a8070", "G": "#c9cfd6",
	"v": "#3a3028", "V": "#55463a", "h": "#c9c2b0", "H": "#9a9284", "r": "#6e3029",
	"m": "#7a2e26", "M": "#a04a3a", "p": "#7a2a24", "P": "#2a1614", "x": "#8f6e5a",
}
const PATRON_A = [
	"5:kkkkkk",
	"4:kcCCCcck",
	"3:kccccccccCCk",
	"4:kbbSsssssk",
	"4:kbbSsssesk",
	"4:kbbSssssssk",
	"4:kBbbbBbbbk",
	"4:kBbbbbbbk",
	"2:kwWWBbbbWWk",
	"1:kowWWWBbWWWOk",
	"1:kooowWWWWOOOk",
	"1:koooooooOOOOk",
	"1:koooooooOOOOOkk",
	"1:kooooooooookssk",
	"1:kooooooooooOkk",
	"1:kTtttttttttttk",
	"1:kttttttttttttk",
	"2:kkkkkkkk|10:ktttk",
	"10:ktttk",
	"10:koook",
	"10:kkkkkk",
]
const PATRON_A_LOOK_HEAD = [
	"4:kbbSsssssk",
	"4:kbSesSsesk",
	"4:kbbSssSssk",
	"4:kBbbBBBbbk",
]
const PATRON_B = [
	"6:kkkk",
	"5:kSsssk",
	"4:kgSssssk",
	"4:kgSsssssk",
	"4:kgSssGGsk",
	"4:kgSssssssk",
	"5:kSsgggsk",
	"6:kSsssk",
	"5:khSSHk",
	"3:khhvhhhvhhk",
	"3:khhvvhhvvHHk",
	"3:krhvvvvvvHHk",
	"3:khhvvVvvvHHHkk",
	"3:khhvvvvvvvksSk",
	"3:kHhvvvvvvvvkk",
	"3:kTttttttttk",
	"3:kttttttttttk",
	"4:kkkkkk|10:kttk",
	"10:kttk",
	"10:kook",
	"10:kkkkk",
]
const PATRON_B_LOOK_HEAD = [
	"4:kgSsssssk",
	"4:kgGGsGGsk",
	"4:kgSssSssk",
	"5:kSgggggk",
]
const PATRON_C = [
	"6:kkkk",
	"5:kmMMmk",
	"4:kmmMMmmk",
	"4:kMMMMMMk",
	"4:kbSsssssk",
	"4:kbSsssesk",
	"4:kbSssssssk",
	"5:kxSsxxsk",
	"6:kxxxxk",
	"3:kkpPpPpPpkk",
	"2:kPpPpPpPpPpk",
	"2:kpPpPpPpPpPpk",
	"2:kPpPpPpPpPpPpk",
	"2:kpPpPpPpPpPpPkk",
	"2:kPpPpPpPpPpkssk",
	"2:kTtttttttttk",
	"2:kttttttttttk",
	"3:kkkkkkk|10:ktttk",
	"10:ktttk",
	"10:koook",
	"10:kkkkkk",
]
const PATRON_C_LOOK_HEAD = [
	"4:kbSsssssk",
	"4:kbesSsesk",
	"4:kbSssSssk",
	"5:kxxSSxxk",
]

func with_head(rows, head, at):
	var out = rows.duplicate()
	for i in range(head.size()):
		out[at + i] = head[i]
	return out

func patrons():
	var fw = 18
	strip(fw, 21, 6)
	var frames = [
		PATRON_A, with_head(PATRON_A, PATRON_A_LOOK_HEAD, 3),
		PATRON_B, with_head(PATRON_B, PATRON_B_LOOK_HEAD, 3),
		PATRON_C, with_head(PATRON_C, PATRON_C_LOOK_HEAD, 4),
	]
	for i in range(frames.size()):
		blit(i * fw, 0, frames[i], PATRON_PAL)
	return img

# ---------------------------------------------------------------------------------------------
# SHERIFF NATHANIEL HALE — 18x40, anchor 9. Hung by the ankles from the wheel frame (see evidence
# SAWMILL_BODY / SAWMILL_ROPE): rope bound round the boots at the top, the long coat fallen open
# over the chest, the star still pinned on, arms hanging past a grey-white face, hair hanging down.
const HALE_PAL = {
	"k": "#0b0d14",
	"R": "#8b7a55", "r": "#5f5338",
	"q": "#16120f", "o": "#2e2118", "O": "#46372b",
	"t": "#2b2e3a", "T": "#3a3f4c",
	"l": "#29231f", "y": "#8b7a55",
	"c": "#4b4239", "C": "#62584d", "d": "#3a332c",
	"v": "#3b2f2a",
	"W": "#cfd6df", "w": "#878380", "s": "#b9b5b1",
	"f": "#cfd6df", "F": "#a0a8b4", "g": "#5a6270",
	"h": "#29231f", "H": "#3a332c",
}
const HALE_ROWS = [
	"7:kRRk",
	"5:kqqRRqqk",
	"5:kooRrook",
	"5:koORRoOk",
	"5:kooOkoOk",
	"5:kooOkoOk",
	"5:kttTktTk",
	"5:kttTktTk",
	"5:kttTktTk",
	"5:kttTktTk",
	"5:kttTktTk",
	"5:kttTktTk",
	"4:kttttTtTk",
	"4:kttttttTTk",
	"4:kttttttTTk",
	"4:klllllyllk",
	"3:kcCcvvvvcCck",
	"3:kcCcvvvvcCck",
	"3:kcCcvvvvcCck",
	"3:kcCcvvvvscck",
	"3:kcCcvvvsWsck",
	"3:kcCcvvvvscck",
	"2:kccCcvvvvcCcck",
	"2:kccCcvvvvcCcck",
	"2:kdcCcvvvvcCcdk",
	"2:kdcCcvvvvcCcdk",
	"2:kdcCkvvvvkCcdk",
	"2:kdcCkfFFfkCcdk",
	"2:kdcCkfggfkCcdk",
	"2:kdcCkfffFkCcdk",
	"2:kdcCkFfFfkCcdk",
	"2:kdcCkgffgkCcdk",
	"2:kdcCkfffFkCcdk",
	"3:kdckhhhhkcdk",
	"3:kfFkhhhhkFfk",
	"3:kffkhHhhkffk",
	"3:kfFk|7:khhk|11:kFfk",
	"4:kk|7:kHhk|12:kk",
	"8:kk",
]
func hale():
	strip(18, 40, 1)
	blit(0, 0, HALE_ROWS, HALE_PAL)
	return img
