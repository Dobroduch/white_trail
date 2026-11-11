# Item artwork scripts

`items.gd` paints every inventory illustration (48×48) and the two sawmill pick-up sprites.
Each `paint(name)` reuses the palette of the object's in-world counterpart, so the three views
(world → carried by Silas → inventory) read as one object.

Run in Pixelorama through the MCP `eval_gdscript` tool with the target `.pxo` open
(`assets/source/pixelorama/items/<item>.pxo`); returning the Image resizes the canvas to fit:

```gdscript
func run(api, image, project, params):
	var s = GDScript.new()
	s.source_code = FileAccess.get_file_as_string(params.path)
	s.reload()
	return s.new().paint(params.item)
```

params: `{ path: ".../items/scripts/items.gd", item: "lantern" }`. Then save the project and
export a 1× PNG to `assets/export/items/inventory/<item>_inventory.png` (or `items/world/`).

| paint name    | source project                | export                                        |
|---------------|-------------------------------|-----------------------------------------------|
| lantern       | lantern_inventory.pxo         | export/items/inventory/lantern_inventory.png  |
| revolver      | revolver_inventory.pxo        | export/items/inventory/revolver_inventory.png |
| room4_key     | room4_key_inventory.pxo       | export/items/inventory/room4_key_inventory.png |
| watch         | pocket_watch_inventory.pxo    | export/items/inventory/pocket_watch_inventory.png |
| ledger        | ledger_inventory.pxo          | export/items/inventory/ledger_inventory.png   |
| telegram      | telegram_inventory.pxo        | export/items/inventory/telegram_inventory.png |
| watch_world   | pocket_watch_world.pxo        | export/items/world/pocket_watch_world.png     |
| ledger_world  | ledger_world.pxo              | export/items/world/ledger_world.png           |

The game links each item to its picture through `icon` in `src/data/notebookData.js` (ITEMS);
`tools/validate.mjs` checks every icon exists and is 48×48.
