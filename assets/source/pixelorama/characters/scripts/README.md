# Character sprite scripts

`characters.gd` draws every character sheet pixel by pixel. Each grid row is one pixel row; `.` is
transparent and every other character is a palette key. Rows can also be written as segments,
`"col:pixels|col:pixels"`. Every figure faces right and stands upright: the head sits over the feet,
the back line is straight and the shoulders are square. Each character has its own build:

| sheet       | frames (fw×fh)                    | who / build                                               |
|-------------|-----------------------------------|-----------------------------------------------------------|
| silas_vance | idle ×2, walk ×4 (28×42)          | Silas: broad and planted, caped duster, slouch hat        |
| conductor   | idle ×2 (26×42)                   | stout, parade-ground straight, cap, brass buttons         |
| finch       | idle ×2 (26×42)                   | lanky and narrow, bowler, scarf, tin star, shadowed eyes  |
| gable       | idle ×2 (26×42)                   | dead-straight back, bun, bustle, apron, key chatelaine    |
| patron      | A, A look, B, B look, C, C look (18×21) | miner / clerk / teamster at the parlor table        |
| hale_body   | 1 (18×40)                         | Sheriff Hale, hung by the ankles                          |

Run it in Pixelorama with the MCP `eval_gdscript` tool, with the target `.pxo` open
(`assets/source/pixelorama/characters/<sheet>.pxo`). Returning the Image resizes the canvas to fit:

```gdscript
func run(api, image, project, params):
	var s = GDScript.new()
	s.source_code = FileAccess.get_file_as_string(params.path)
	s.reload()
	return s.new().sheet(params.name)
```

params: `{ path: ".../characters/scripts/characters.gd", name: "silas_vance" }`. Then save the project and
export a 1× PNG to `assets/export/characters/<sheet>.png`. Frame sizes and anchors are listed in
`NATIVE_SHEETS` in `src/engine/assets.js`.
