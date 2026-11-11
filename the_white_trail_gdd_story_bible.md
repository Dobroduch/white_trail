# THE WHITE TRAIL
## Game Design Document, Story Bible & AI Development Specification

**Document status:** Foundational design specification  
**Version:** 1.0  
**Project type:** 2D narrative adventure for web browsers  
**Primary implementation target:** HTML5 Canvas, JavaScript, Web Audio API  
**Design priority:** Mystery, investigation, character drama, exploration, atmosphere  
**Combat philosophy:** Rare, deliberate, dangerous, and consequential

---

# PART I — PROJECT DEFINITION

## 1. High Concept

**THE WHITE TRAIL** is a side-scrolling, pixel-art detective mystery set in an isolated mountain mining settlement during a brutal winter in the late nineteenth-century American West. The player controls Silas Vance, a former Confederate scout and former Pinkerton gunman who arrives to investigate the disappearance of a sheriff and a young woman named Clara Mercer.

The town appears to be haunted by something moving through the blizzard. Strange lights cross the ridge. Footprints stop in impossible places. A body appears to have been drained of blood. Locals whisper about a pale presence in the mountains. Silas gradually discovers that every apparently supernatural event has a human cause: the town's secrets, its geography, deliberate misdirection, and the actions of people who want the truth to stay buried.

The game is primarily a **mystery adventure**, not a shooter or conventional survival-horror game. The main activities are exploring interconnected locations, examining crime scenes, questioning a small cast of characters, comparing evidence, uncovering contradictions, and deciding how far Silas is willing to go. Violence exists, but it is exceptional. Silas carries one revolver, ammunition is scarce, and killing a person permanently changes the story and the investigation.

The player's main form of progression is knowledge. Silas becomes more capable because he understands the town, its people, its history, and the relationships between seemingly unrelated events—not because he accumulates weapons or combat upgrades.

## 2. One-Sentence Design Promise

**Explore a snowbound western town, solve a human mystery hidden behind supernatural-looking events, and live with the consequences of every serious choice—including the decision to shoot.**

## 3. Genre and Player Experience

- **Primary genre:** 2D side-scrolling detective mystery adventure.
- **Secondary genres and influences:** Psychological western, investigative drama, atmospheric horror, light survival, occasional deliberate gun confrontation.
- **Not the intended genre:** Run-and-gun action, enemy-wave survival, monster hunting, loot-driven RPG, platforming challenge game.
- **Perspective:** 2D side view with layered backgrounds and foreground elements.
- **Structure:** Interconnected locations organized around a central village hub, with some routes opening through discoveries and story events.
- **Tone:** Cold, restrained, suspicious, melancholic, tense, human, and occasionally frightening.
- **Player fantasy:** Be an observant, capable but fallible investigator who would rather understand a dangerous situation than shoot his way through it.

### 3.1 Reference Points

Use references for broad design qualities, not to copy their characters, locations, dialogue, visual assets, or exact mechanics:

- **The Sinking City:** investigative structure, oppressive mystery, evidence-led progression, and a protagonist navigating a compromised community.
- **The Last Door:** restrained pixel-art horror, strong atmosphere, and visual storytelling.
- **Darkwood:** environmental dread, careful exploration, and the feeling that the world is hostile even when nothing is attacking.
- **Red Dead Redemption 2 (Colter / Ambarino):** the visual and emotional weight of severe winter, isolated settlements, and lived-in western spaces.
- **The Hateful Eight:** enclosed social tension, distrust, secrets, and the possibility that a conversation may become violent.

These are tonal references. THE WHITE TRAIL must have its own identity, story, characters, interface, and visual design.

## 4. Non-Negotiable Creative Pillars

1. **Mystery comes first.** The player should spend much more time observing, exploring, questioning, and reasoning than fighting.
2. **A small cast matters.** Named characters are not disposable obstacles. Each has a history, motive, relationships, useful knowledge, and a personal response to the player's choices.
3. **Violence is exceptional.** There are no generic enemies, random combat encounters, respawning hostiles, or enemy waves. Every armed confrontation is authored and motivated by the story.
4. **Death persists.** A person who dies stays dead. Their knowledge, relationships, and possible testimony are lost. The investigation must adapt rather than simply reset.
5. **The revolver is a last resort.** Silas has one firearm: his revolver. Ammunition is very scarce. There are no weapon upgrades or weapon collection systems.
6. **The supernatural is an interpretation, not a fact.** No ghosts, monsters, curses, magic, or genuinely supernatural events exist in the story's reality. Apparent impossibilities must have physical, human explanations.
7. **Hallucinations are nearly absent.** There is no sanity meter, paranoia meter, or random hallucination system. At most, one carefully authored hallucination sequence occurs after Silas drinks poisoned coffee. It is a specific plot event, not a repeatable mechanic.
8. **The world remembers.** Important decisions affect trust, access, testimony, evidence routes, later scenes, and endings.
9. **Atmosphere is systemic.** Weather, light, sound, architecture, animation, and pacing create tension. Do not rely on constant jump scares.
10. **Progression is knowledge.** The notebook, new leads, relationships, and access to locations are the main rewards.

## 5. Explicitly Out of Scope

Do not add any of the following unless the design owner explicitly changes this specification:

- Generic enemies placed only to be killed.
- Respawning enemies, combat arenas, enemy waves, or kill-count objectives.
- Monsters, ghosts, demons, supernatural creatures, or a real Wendigo.
- Random or frequent hallucinations.
- A numerical sanity, paranoia, or morality meter.
- Multiple firearms, weapon shops, weapon upgrades, crafting ammunition, or ammunition farming.
- Loot rarity, conventional XP, skill trees focused on combat, or gear-score progression.
- A large open world that dilutes the small-town mystery.
- Precision platforming, long combat jumps, or reflex challenges as a core activity.
- Combat as the default answer to locked doors, witnesses, or puzzles.
- Dialogue choices that are merely cosmetic when they are presented as consequential.

---

# PART II — SETTING AND WORLD BIBLE

## 6. Historical and Geographic Setting

### 6.1 Working Canon

To make the period, technology, and character histories internally consistent, use the following as the default setting:

- **Year:** 1892.
- **Season:** Early winter, during the first major blizzard of the season.
- **Region:** A fictional, remote mountain district in the American Rocky Mountains. Do not identify a real town or county unless a later story decision requires it.
- **Settlement:** Crow's Hollow, a former silver-mining settlement built around a narrow valley, a railway spur, a sawmill, and old mine workings.
- **Nearby terrain:** Blackwood Station, pine forest, Frozen Creek, an abandoned graveyard, a telegraph tower, old silver workings, and a high ridge with an isolated cabin / former observatory.
- **Travel conditions:** The pass becomes impassable during severe storms. Rail and telegraph connections are unreliable. The settlement can be isolated for days.

The 1892 date is a **working design assumption**, chosen because it supports the steam railway, telegraph, revolvers, mining explosives, and Silas's Civil War-era past. It can be changed later, but all technology and character ages must then be reviewed together.

### 6.2 Period Technology Rules

The world may contain:

- Steam locomotives and railway telegraph offices.
- Telegraph wires, hand-cranked or period electrical equipment where appropriate.
- Oil lamps, kerosene lanterns, candles, fireplaces, wood stoves.
- Period-correct revolvers and rifles in the hands of story characters (Silas himself carries only one revolver).
- Horses, wagons, mining carts, sawmill machinery, waterwheels.
- Commercial dynamite, blasting caps, fuse, and mining tools.
- Paper ledgers, pocket watches, handwritten telegram forms, maps, photographs, and printed notices.

Avoid modern technology and terminology. In particular, the graveyard discovery should involve **period-appropriate mining explosives and blasting equipment**, not modern military-grade explosives. Characters may call something a military cache as a misleading explanation, but its actual components must fit the chosen year.

### 6.3 Geography and Spatial Logic

Crow's Hollow is compact enough for the player to learn its geography. The player should gradually understand how the hotel, station, creek, sawmill, graveyard, mine road, telegraph tower, and ridge connect.

The valley itself should help explain some apparent mysteries:

- Wind funnels through gaps and mine shafts, producing strange whistles and distant voices.
- Snow drifts cover tracks unevenly. Ice, shallow water, timber walkways, and rocky ledges can interrupt footprints.
- Elevated positions allow a person to signal with a lantern or reflected light.
- Old mine ventilation shafts and abandoned machinery can transmit sound in unexpected ways.
- A person familiar with the terrain can move between locations without using the obvious path.

These explanations should be grounded in clues and geography. Do not use arbitrary explanations that appear only at the reveal.

## 7. Crow's Hollow

Crow's Hollow was once a prosperous silver settlement. Its decline left abandoned workings, unpaid debts, half-empty buildings, and a community that distrusts outsiders. A few businesses and families remain, tied together by necessity, old obligations, fear, and shared history.

The settlement should not feel like a town populated entirely by villains. It contains ordinary people with mixed loyalties. Some know nothing about the central conspiracy. Some suspect wrongdoing but are afraid to speak. A smaller inner circle actively protects the secret. This distinction is essential: **not every villager is a former Confederate raider or a conspirator.**

### 7.1 Main Locations

| Location | Function in story | Main gameplay |
|---|---|---|
| Blackwood Station | Arrival, isolation, railway and telegraph clues | Exploration, first conversations, environmental tutorial |
| The Black Ram Hotel | Main social hub and temporary shelter | Dialogue, observation, room investigation, character routines |
| Crow's Hollow main street | Compact settlement hub | NPC encounters, shops, public notices, changing social atmosphere |
| General Store | Supplies, ledgers, local gossip | Interrogation, document inspection, limited purchases if any |
| Old Sawmill | First major crime scene | Evidence examination, environmental deduction |
| Frozen Creek | Physical route and evidence trail | Traversal, tracks, geography-based deduction, possible confrontation |
| Abandoned Graveyard | Staged occult evidence and hidden explosives | Investigation, environmental puzzle, story danger |
| Telegraph Tower | Communications and timing clues | Climbing / traversal, wire and signal investigation |
| Collapsed Silver Mine | Physical center of the conspiracy | Exploration, machinery puzzle, final evidence, danger |
| Summit Cabin / Old Observatory | High-ridge climax and Clara thread | Narrative confrontation, final revelations, endings |

### 7.2 The Town's Visual Identity

Crow's Hollow should look economically exhausted rather than fantastical: weather-beaten timber, sagging roofs, old mine supports, boarded windows, rusted machinery, snow-loaded fences, narrow alleys, and smoke that struggles to rise in the wind. It should feel inhabited. Warm windows, muddy footprints, laundry, tools, and signs of daily work help prevent it from becoming a generic abandoned horror town.

---

# PART III — STORY BIBLE

## 8. Core Narrative Premise

Private investigator Silas Vance is summoned to Crow's Hollow by a telegram apparently sent by Constable Edgar Finch. The message asks him to investigate the disappearance of the town sheriff and Clara Mercer, a young woman from one of the settlement's most influential families.

Silas arrives in the evening as a blizzard closes the mountain pass. The local railway cannot offer a reliable return journey. At the Black Ram Hotel he finds hostility, evasive answers, and signs that Room 4 has recently been cleaned after a violent incident.

During the night, a scream leads him to the old sawmill, where he discovers the missing sheriff's body displayed in a manner that suggests a ritual killing. The scene, the marks on the timber, and the locals' stories encourage a supernatural interpretation. The evidence gradually points elsewhere: to an old criminal network, a stolen Union payroll, a collapsed silver-mining syndicate, and a group of people who have used fear and folklore to hide a practical operation.

The central revelation is that the telegram was not sent by Finch. Clara Mercer forged or misused his authority to bring Silas to town because she needed an outsider who could investigate without immediately trusting the local power structure. Her attempt to escape her family's legacy has made her a target.

## 9. Narrative Themes

- **The past is not buried just because people stop speaking about it.**
- **Violence solves immediate problems while creating permanent new ones.**
- **A community can be held together by mutual fear as effectively as by loyalty.**
- **Superstition can be manufactured and exploited by ordinary people.**
- **Evidence is powerful, but evidence without context can be misleading.**
- **A man's past follows him even when he changes professions and names his work differently.**
- **Survival and justice are not always the same thing.**

## 10. Main Character: Silas Vance

**Role:** Player character; independent private investigator.  
**Age:** Approximately late forties in 1892 (exact age may be finalized during production).  
**Background:** Former Confederate scout; later worked as a Pinkerton gunman / investigator; now works independently.  
**Personality:** Reticent, observant, pragmatic, guarded, capable of intimidation, uncomfortable with needless violence.  
**Physical condition:** Old injuries and frostbitten nerves may affect idle animation or certain interactions, but do not make him a frail action-game protagonist.  
**Internal conflict:** Silas has spent much of his adult life using violence in the service of men who called it necessary. He now wants to understand events before resorting to force, but his reputation and instincts make it difficult to remain neutral.

### 10.1 Characterization Rules

- Silas should speak economically. Avoid long speeches that explain what the player already knows.
- He notices concrete details: mud, stitching, wear patterns, soot, tool marks, timing, handwriting, and inconsistencies.
- His dialogue may be dry, restrained, or blunt, but he should not be a constantly sarcastic action hero.
- His past should emerge through dialogue, reactions, and other characters' knowledge—not only through exposition.
- The player may choose whether Silas is patient, suspicious, intimidating, compassionate, or openly threatening, within the boundaries of his established character.
- Do not present killing as his default or preferred solution.

## 11. Major Supporting Cast

The following names and roles form the recommended core cast. They should be treated as the default story bible unless changed by the design owner. Keep the total number of major, plot-relevant characters small. Minor background townspeople may exist, but they should not become disposable combat targets.

### 11.1 Clara Mercer — The Missing Woman

**Public position:** Daughter of a prominent local family; reported missing alongside the sheriff.  
**Story function:** Hidden initiator of Silas's investigation and emotional center of the conspiracy.  
**Core motivation:** Escape her family's criminal history and prevent the mine operation from restarting at the cost of more lives.  
**Secret:** She arranged for Silas to come to Crow's Hollow by sending a telegram under Constable Finch's name or authority.  
**Character direction:** Intelligent, frightened but resourceful, morally compromised by what she knows and by the time she spent protecting her family. She is not a helpless prize to be rescued; she has acted independently and has her own plan.

Clara's exact whereabouts during each act must be tracked in the story state. She may be hiding, moving between safe locations, or being held under pressure. Her survival and final relationship with Silas may depend on player choices. Do not introduce her only at the very end; seed her through handwriting, personal belongings, testimony, and the consequences of her earlier actions.

### 11.2 Constable Edgar Finch — The Nervous Official

**Public position:** Local constable; the apparent sender of the telegram.  
**Story function:** Initial contact, unreliable guide, possible coward, accomplice, or pressured witness depending on how the plot resolves.  
**Personality:** Nervous, sleep-deprived, defensive, easily overwhelmed, but not necessarily malicious.  
**Secret / uncertainty:** Finch did not personally send the telegram. He may have been careless with his official forms, had his authority stolen, or knowingly allowed Clara to use it. The precise degree of his complicity should be established before final dialogue is written.

Do not make Finch's nervousness proof of guilt. His fear may arise from the sheriff's disappearance, local pressure, or his own failure to act.

### 11.3 Sheriff Nathaniel Hale — The Missing Sheriff

**Public position:** Crow's Hollow sheriff, missing for three nights before Silas arrives.  
**Story function:** First major murder victim; his investigation uncovers the mine conspiracy.  
**Characterization through evidence:** Practical, stubborn, familiar with the town's old records. He had discovered explosives, suspicious shipments, and discrepancies in the Pale Order records.  
**Fate:** Murdered by the conspirators and staged at the sawmill. His death should reveal information through physical evidence and the choices he made before it, not through a convenient explanatory note.

The crime scene is described by locals as though the sheriff were “drained of blood.” Treat this as a staged appearance and witness interpretation, not a physically impossible literal removal of every drop of blood. The body was wounded, suspended, and manipulated to create a ritualistic impression. The exact forensic explanation must be supported by visible evidence.

### 11.4 Mrs. Gable — Owner of the Black Ram Hotel

**Public position:** Hotel owner and keeper of Room 4.  
**Story function:** Controls the first hub, observes guests, knows local routines, and can become a useful or obstructive source.  
**Personality:** Controlled, practical, socially perceptive, protective of her business, and reluctant to invite trouble.  
**Secret:** She knows more about the recent cleaning of Room 4 than she initially admits. Whether she helped cover up violence, acted under pressure, or simply protected a guest is a branching revelation.

Mrs. Gable should not be a one-note sinister innkeeper. Give her credible reasons for choosing silence.

### 11.5 Reverend Elias Vale — Keeper of the Local Legend

**Public position:** Preacher who frames the strange events as punishment or a return of an old presence in the mountains.  
**Story function:** Gives the player the supernatural interpretation that the town wants outsiders to accept.  
**Personality:** Charismatic, severe, theatrical when useful, and capable of reading fear.  
**Secret:** He has helped spread or exploit the legend to keep people away from sensitive locations. His exact knowledge of the murders and explosives is a story variable to determine during production.

Use an original local legend, such as **the Pale Figure** or **the White Presence**, rather than presenting a real-world Indigenous spiritual being as a monster. The preacher may use local folklore inaccurately or opportunistically, but the game should not make a real culture's sacred beliefs into its creature design.

### 11.6 Jonah Rusk — General Storekeeper

**Public position:** Runs the general store and handles local supplies and account books.  
**Story function:** Source of receipts, shipping records, food and oil supplies, and information about suspicious purchases.  
**Personality:** Practical, guarded, resentful of debt, and skilled at avoiding direct answers.  
**Secret:** He has hidden or altered records related to mine equipment and blasting supplies. He may be directly involved in the conspiracy or simply protecting himself from the people who control the town.

### 11.7 Gideon Mercer — Clara's Father / Mining Patriarch

**Public position:** Wealthy local family patriarch and influential figure in the remaining mining interests.  
**Story function:** Principal human antagonist or leading conspirator; represents the town's old criminal order.  
**Background:** A former Confederate raider or a member of the raiding group that stole a Union payroll during the Civil War. He helped conceal the proceeds and later used mining ventures to disguise attempts to recover them.  
**Personality:** Controlled, paternal when it serves him, calculating, and convinced that the town's survival justifies its crimes.  
**Conflict with Clara:** He regards Clara's attempt to expose the truth as betrayal and a threat to the family's survival.

Do not make every villager an ex-Confederate raider. The conspiratorial inner circle is small; other people are relatives, employees, coerced witnesses, debtors, or uninformed residents.

### 11.8 Ada Bell — Telegraph Operator (Supporting Witness)

**Public position:** Telegraph operator at or near Blackwood Station.  
**Story function:** Can verify when a message was sent, who physically delivered it, and whether the sender's identity was authenticated.  
**Personality:** Observant, cautious, professional, and uncomfortable with being drawn into local politics.  
**Secret:** She has information that can help establish that Clara sent the telegram under Finch's name. Her willingness to tell Silas depends on how safe she feels.

### 11.9 Train Conductor — Opening Character

A brief but memorable character who explains the railway's limits and the storm. He should not become a combatant or major antagonist. He sets the practical stakes: Silas has chosen to disembark and cannot count on a return train until the pass is safe.

## 12. The Central Conspiracy: The Pale Order

The Pale Order was a secretive mining syndicate or private mining association whose public and private activities overlapped. Its name appears in a half-burned ledger, coded tally marks, shipment records, and old mine documents. Locals treat the name as if it belongs to a cult. In reality, it was a human organization built around money, concealment, and control of the old silver workings.

### 12.1 Recommended Historical Chain

Use this sequence as the default chronology:

1. **Civil War period, circa 1864–1865:** A small group of Confederate raiders intercepts and steals a Union payroll shipment. They hide the gold in an abandoned or partly exhausted silver mine in the mountain district. The group includes men who later become influential in Crow's Hollow.
2. **Approximately 1872:** Survivors and associates form or use the Pale Order as a mining syndicate to gain legal cover, secure access to the old workings, and search for the hidden payroll. A dangerous mine incident, financial collapse, or public scandal forces the operation to close. The organization is considered defunct.
3. **Following years:** The participants remain connected through family, debts, blackmail, and shared responsibility. The town's public story slowly replaces the real one.
4. **1892:** New equipment and a renewed plan make recovery of the hidden gold possible. The inner circle begins preparing the old mine for blasting. The sheriff discovers evidence of the operation. Clara learns enough to oppose her family. The conspirators act to prevent exposure.

This retains the idea that the Pale Order collapsed about twenty years earlier while keeping the stolen payroll tied to the Civil War. The Pale Order did not need to exist during the war; it became the later organization used to conceal and recover the stolen money.

### 12.2 Current Operation

The conspirators are preparing to reopen a collapsed mine chamber with period-appropriate commercial dynamite and blasting equipment. Their goal is to retrieve the stolen payroll gold and move it before outside authorities can intervene. Explosives, altered shipping accounts, severed telegraph lines, and old military equipment are evidence of this plan.

The sheriff found enough to threaten the operation. He was murdered and staged as a ritual victim to redirect attention toward superstition and away from the practical evidence. The conspirators use the town's isolation, fear, and distrust to control witnesses.

## 13. Story Structure and Act Outline

### Prologue — The Telegram

**Purpose:** Establish Silas, the false summons, the weather, and the town's isolation.

- Silas receives a telegram apparently from Constable Edgar Finch requesting discreet assistance with two disappearances: Sheriff Nathaniel Hale and Clara Mercer.
- The telegram is brief and practical. It should not reveal the conspiracy or supernatural rumors.
- Silas travels by steam train into the mountain district.
- The train reaches Blackwood Station at approximately 18:40 during worsening weather.
- The conductor explains that the pass may close and that no reliable return service can be promised for several days.
- Silas disembarks and enters the storm.

**Gameplay introduced:** Movement, camera, snow, environmental observation, basic interaction, first notebook entry.

### Act I — The Evening Arrival

**Locations:** Blackwood Station, Crow's Hollow, The Black Ram Hotel.

- Silas walks from the station to the village through the blizzard.
- The village is quiet but not empty. Residents watch from windows and doorways.
- He meets Constable Finch, who appears nervous and offers an incomplete account of the disappearances.
- At the hotel, Mrs. Gable treats him with guarded hostility.
- Silas is assigned Room 4. The floorboards show evidence of recently scrubbed blood.
- The parlor contains several patrons who stop talking when Silas enters.
- The player can inspect the room, question Mrs. Gable, observe the patrons, and establish the first contradictions.

**Act purpose:** Establish social tension. The player should understand that the town is hiding something before knowing what it is.

### Act II — Blood in the Drift

**Location:** Old Sawmill and Frozen Creek.

- At approximately 02:15, a scream breaks the night.
- Silas follows a trail through the snow toward the sawmill.
- He finds Sheriff Hale's body suspended upside down near the waterwheel.
- The scene appears ritualistic: marks on timber, a strange display, and an apparent absence of blood.
- The player examines the body, rope, mechanism, timber marks, surrounding snow, nearby tools, and traces leading toward the creek.
- Important evidence includes a broken pocket watch, cavalry-style boot impressions, disturbed ice, and a half-burned ledger referencing the Pale Order.
- The player should be able to identify at least one physical inconsistency in the ritual interpretation.

**Act purpose:** Turn a missing-person mystery into a murder investigation and establish the first plausible supernatural misdirection.

### Act III — Deceit and Isolation

**Time:** Day 2 through Night 3.  
**Locations:** General Store, Hotel, Main Street, Abandoned Graveyard, Telegraph Tower, forest paths.

- Villagers provide contradictory accounts. Some lie deliberately; others repeat stories they believe.
- The storekeeper hides or alters shipping and supply records.
- Reverend Vale describes the Pale Figure said to haunt Crow's Ridge.
- Silas may investigate during the day through conversations or at night when certain locations are quieter.
- Night exploration is not a mandatory enemy gauntlet. It is a choice about access, visibility, witnesses, and risk.
- At the graveyard, Silas finds a disturbed grave containing period-appropriate blasting equipment and blood-stained clothing/uniform remnants.
- The discovery appears to support a ritual or military explanation, but later evidence connects it to the mine operation and staged intimidation.
- At the telegraph tower, Silas finds evidence that communication has been interrupted or manipulated.
- Character relationships and access depend on earlier dialogue and violence decisions.

**Act purpose:** Expand the suspect network, make the mystery more complex, and begin connecting the supernatural story to practical human actions.

### Act IV — The Summit and the Mine

**Time:** Night 4 and the final storm.  
**Locations:** High Ridge, Summit Cabin / Old Observatory, collapsed silver mine.

- Silas follows evidence involving a laced whiskey bottle, severed telegraph lines, military spurs, shipment records, and mine equipment.
- He climbs toward the high ridge during a severe storm.
- The apparent presence in the mountains is revealed as a human deception or a misinterpreted physical event.
- Silas discovers the true purpose of the Pale Order and the stolen Union payroll gold.
- The conspirators' connection to former Confederate raiders is revealed. The guilty inner circle has used the town's isolation and an occult-looking legend to protect the mine.
- Silas learns that Clara, not Finch, sent the telegram. She used Finch's name or official authority to bring an outsider into the investigation.
- Clara's actions, location, and fate are determined by evidence and choices accumulated through the game.
- The final confrontation should prioritize a moral and investigative decision, not a boss fight.

**Act purpose:** Resolve the mystery, reveal the human construction behind the supernatural appearance, and force Silas to decide what justice means when the truth implicates a whole community.

## 14. The Poisoned Coffee Sequence — The Only Hallucination Event

Hallucinations must be **very rare**. The game has no sanity system, no paranoia system, and no ongoing hallucination mechanic.

At one specific point in the story, someone attempts to poison Silas by adulterating his coffee. The poisoning produces one short, authored episode of perceptual distortion. It should be unsettling, intimate, and narratively significant—not a recurring gameplay feature.

### 14.1 Rules

- The sequence occurs only after the player drinks the poisoned coffee.
- Do not trigger hallucinations randomly or because of cold, low health, low warmth, darkness, or a hidden meter.
- Do not add hallucination effects to ordinary exploration.
- Do not make the player doubt the reliability of every clue collected elsewhere.
- The sequence should be clearly delimited and should not permanently alter the world state.
- The player may notice sensory distortions: a familiar room seems subtly elongated, a voice appears to come from the wrong direction, a shadow seems to move against the light, or a sound repeats unnaturally.
- Avoid a long monster chase or an extended dream level. The episode should be brief and controlled.
- Do not hide an essential clue exclusively inside the hallucination.
- Later evidence must establish that Silas was poisoned. The identity of the poisoner and motive can be part of the investigation.

### 14.2 Narrative Function

The episode should raise immediate questions: Who had access to the coffee? Was Silas intended to die, or merely be incapacitated? What did the poisoner fear he would discover? The hallucination is a consequence of a real human act, not evidence of a supernatural force.

---

# PART IV — GAMEPLAY SYSTEMS

## 15. Core Gameplay Loop

1. **Travel and observe:** Move through a location, read the environment, notice people and objects.
2. **Inspect:** Examine a clue, surface, document, mechanism, footprint, or character detail.
3. **Record:** Add useful findings to Silas's notebook with source and context.
4. **Question:** Speak to characters and choose topics, evidence, tone, or accusations.
5. **Compare:** Connect evidence, identify contradictions, and formulate deductions.
6. **Act:** Use the new information to open a route, confront someone, gain access, or protect a witness.
7. **Live with the outcome:** Update character relationships, location access, evidence availability, and the story state.

A typical play session should alternate between quiet traversal, focused observation, social encounters, and occasional high-tension set pieces. The player should not be forced into combat to keep the loop moving.

## 16. Side-Scrolling Exploration

### 16.1 World Structure

The world is made of connected 2D spaces: streets, rooms, forest paths, industrial interiors, creek banks, mine passages, and ridge trails. Most areas are side-on. Backgrounds may use multiple parallax layers, but gameplay collision and interaction remain in a readable 2D plane.

The world should feel interconnected even if it is assembled from room-sized scenes. The player should learn landmarks and routes rather than selecting every destination from a menu.

### 16.2 Movement

Movement should be grounded and deliberate:

- Walk and change direction.
- Move carefully or crouch when the scene supports it.
- Climb ladders and short ledges.
- Step over or vault low obstacles.
- Use authored ladders, stairs, narrow passages, and mine structures.
- Interact with doors, gates, mechanisms, and environmental objects.

Jumping may exist for modest traversal gaps, but should not become a precision platforming system. Avoid long chains of jumps, frequent instant-death falls, or combat arenas built around platforming.

### 16.3 Environmental Interaction

Objects should communicate their function visually. Interactable items can receive a subtle highlight or icon when Silas is close, but do not cover the screen with constant markers. Important objects should also be discoverable through composition, lighting, sound, or contextual dialogue.

## 17. Adaptive Camera

The camera remains a side-scrolling camera but changes framing in response to gameplay context.

### 17.1 Exploration Framing

- Wider view of the environment.
- Silas occupies a modest portion of the screen.
- The camera reveals routes, landmarks, and environmental storytelling.
- Camera follow is smooth but not floaty.

### 17.2 Investigation Framing

- Moves slightly closer when Silas examines a significant object.
- Keeps the object and Silas readable together when possible.
- Does not zoom so far that the player loses spatial orientation.
- Returns smoothly to exploration framing after the interaction.

### 17.3 Dialogue / Confrontation Framing

- Moves closer to emphasize faces, posture, and personal space.
- Uses composition and pauses rather than action-game UI to create tension.
- Can hold a near-static frame during a standoff.
- Should never obscure player control without a clear authored reason.

### 17.4 Camera Constraints

- Preserve pixel-perfect integer scaling; use camera-space rendering carefully to avoid subpixel blur.
- Do not use aggressive zoom, rapid shake, or constant camera movement.
- Camera shake is minimal and reserved for specific events.
- Provide a reduced-shake option.

## 18. Investigation System

Investigation is the central interactive system. It must feel tactile and grounded, not like clicking every object until the game reveals the answer.

### 18.1 Evidence Categories

- **Physical traces:** footprints, blood, fibers, rope, tool marks, disturbed snow, broken mechanisms.
- **Documents:** ledgers, letters, telegrams, receipts, maps, official forms, shipping records.
- **Personal objects:** pocket watches, keys, clothing, photographs, jewelry, weapons, tobacco tins.
- **Testimony:** direct statements, rumors, contradictions, remembered events.
- **Environmental facts:** wind direction, sight lines, ice thickness, machinery, access routes, sound paths.

### 18.2 Evidence Record

Each evidence item should contain:

- Stable evidence ID.
- Display name.
- Scene/location ID.
- Description of what Silas directly observes.
- Optional close-up view or inspection text.
- Whether the item is collected, merely observed, or fully examined.
- Related characters, locations, and other evidence IDs.
- Supported deductions.
- Alternative interpretation, if relevant.
- Whether the evidence is essential, optional, or corroborating.

Do not make the notebook state a conclusion that Silas has not earned. Separate **observation** from **interpretation**.

### 18.3 Deduction Board / Notebook

The notebook is the player's working case file. It should let the player:

- Review observations and witness statements.
- Compare two or more pieces of evidence.
- Mark a contradiction.
- Connect a person to a place, object, or timeline event.
- Form a deduction from a small set of valid evidence combinations.
- Review unresolved questions and leads.

Do not require the player to guess arbitrary item combinations. Valid deduction rules must be authored and testable. When a connection is wrong, give a restrained response such as “the evidence does not establish that” rather than exposing the correct answer.

### 18.4 Fair Mystery Rules

- Every essential conclusion must be supported by evidence the player can actually find.
- Important progression clues should have more than one possible route where practical.
- Killing a witness may close their testimony route, but a document, object, secondary witness, or physical trace should often preserve a harder alternative.
- Optional clues deepen character understanding but should not be mandatory for basic completion.
- Red herrings may mislead, but they must later be explainable and should not make the player feel cheated.
- The final reveal must reinterpret earlier scenes rather than introduce an entirely new explanation at the last minute.

## 19. Dialogue and Interrogation

Dialogue should be contextual and evidence-aware. Characters remember what Silas has said and done.

### 19.1 Dialogue Actions

Depending on the scene, the player may:

- Ask about a person, place, event, or object.
- Present a piece of evidence.
- Point out a contradiction.
- Conceal evidence.
- Bluff or imply that Silas knows more than he does.
- Show empathy or offer protection.
- Intimidate or threaten.
- End the conversation or return later.

### 19.2 Character State

Track character states with discrete flags and relationship values only where needed. Avoid one global “paranoia” or “reputation” score.

Example state fields:

- `trust`: a small discrete range or a few named states.
- `fear`: whether the character is afraid of Silas.
- `hostility`: whether they refuse ordinary cooperation.
- `knowledge`: facts this character knows.
- `revealed`: facts they have admitted.
- `alive`: whether they are alive.
- `injured`: whether they have been wounded.
- `location`: current or last known location.
- `routineState`: what they are doing at a given time.

Use only the dimensions that matter to a particular character. Do not force every NPC to have identical stats.

### 19.3 Dialogue Quality Rules

- Keep dialogue concise and character-specific.
- Avoid exposition dumps.
- Make lies distinguishable through context, contradictions, or later evidence—not by a universal “lie” marker.
- Do not make every conversation a multiple-choice interrogation tree.
- Allow some conversations to be observational: the player listens, watches, or notices who avoids whom.
- Ensure that choices presented as significant produce a tracked result.

## 20. Combat and the Revolver

Combat is a rare authored event, not a repeatable activity loop.

### 20.1 Weapon Rules

- Silas owns exactly one firearm: a period-appropriate revolver.
- The revolver has a six-chamber cylinder.
- Recommended starting load: three cartridges, unless a story scene requires a different exact count.
- Additional ammunition is extremely scarce and placed deliberately by the narrative designer.
- There are no shops that sell ammunition, crafting systems, ammo drops, weapon upgrades, or alternate guns.
- Reloading is manual and takes time. A single-action period revolver may require individual rounds to be loaded; use the animation to reinforce its deliberate pace.
- Aiming slows movement and commits the player to a visible, tense posture.

### 20.2 Encounter Philosophy

Every armed confrontation must answer:

1. Who is involved, and what do they want?
2. Why has dialogue, retreat, or stealth not already resolved the scene?
3. What can the player learn or lose by choosing violence?
4. What changes in the story if a participant dies or is injured?
5. Is there a non-lethal or avoidant path, even if it is difficult?

There are no generic “enemy types.” The game may have characters who are armed, threatening, or temporarily hostile, but they remain story characters with names, motives, and consequences.

### 20.3 Basic Combat Interaction

A restrained implementation is recommended:

- The player raises the revolver to aim.
- Aim direction is controlled by mouse position or an equivalent keyboard/controller mapping.
- Silas moves slowly while aiming.
- The weapon has a short, readable ready/aim time.
- The player fires only on explicit input.
- Ammunition count is checked before the shot.
- Recoil, muzzle flash, sound, and camera response are controlled and brief.
- A hit resolves through an authored character response, not a long health-bar exchange.

Do not implement run-and-gun movement, long dodge-roll combos, headshot scoring, kill chains, or bullet-sponge opponents. A gunshot should feel shocking because of its sound, rarity, and consequence.

### 20.4 Drawing the Revolver Without Firing

Drawing the weapon can be a dialogue action. A character may freeze, back away, surrender, become more hostile, or call for help. The player should understand that threatening someone is itself a consequential escalation, even if no shot is fired.

### 20.5 Consequences of Violence

A lethal action should update multiple state categories where appropriate:

- The victim's `alive` state becomes false permanently.
- Their testimony and future scenes become unavailable.
- Their possessions and papers may remain, but do not automatically contain every fact they knew.
- Witnesses may flee, lie, hide evidence, or turn against Silas.
- The hotel or town may become less safe.
- A previously available peaceful route may close.
- An alternative evidence route may open, often at greater cost.
- The ending can change based on who survived and what proof Silas retained.

Do not use a simple morality meter. Track specific actions and their actual consequences.

## 21. Stealth and Avoidance

Stealth exists to support investigation and escape, not to create long enemy-patrol levels.

- A character may be watching a door, guarding a document, or moving between known locations.
- The player can wait, take another route, use cover, or create a modest distraction.
- Turning off the lantern can reduce visibility, but it also makes navigation and clue inspection harder.
- Darkness must not become a mandatory pixel-perfect stealth challenge.
- If a character discovers Silas, the result should be contextual: a warning, question, pursuit, confrontation, or later social consequence.
- Avoid elaborate stealth meters unless a specific scene truly needs one.

## 22. Survival and Weather

Survival is a supporting pressure system, not the primary challenge.

### 22.1 Warmth

- Severe exposure may gradually affect Silas during long outdoor sequences.
- Warmth should not drain rapidly during ordinary exploration.
- Fires, heated interiors, and sheltered spaces restore warmth.
- Clothing and weather conditions may change the rate of exposure.
- Low warmth should first create discomfort and reduced responsiveness; avoid frequent unavoidable damage or death spirals.
- Do not connect cold to hallucinations.

### 22.2 Lantern

The lantern is a key visual and investigative tool.

Uses:
- Illuminates nearby environmental details.
- Helps reveal subtle physical clues.
- Makes night navigation possible.
- Can reveal Silas's position to someone watching from a distance.

Design rules:
- The player can toggle the lantern on or off.
- Oil may be a limited resource, but should be generous enough that it does not dominate play.
- Lantern light must be readable at 320×180.
- Clues should not become impossible to see solely because the player lacks oil; provide fair alternatives, safe refill points, or ambient lighting where needed.
- Do not use the lantern as a weapon against supernatural creatures. No such creatures exist.

### 22.3 Alcohol and Warmth

Whiskey may appear as a story item or dialogue choice, but do not present alcohol as a reliable physiological cure for hypothermia. If it temporarily changes Silas's perception of warmth, make clear through the fiction that the sensation is misleading.

## 23. The Supernatural-Looking Mystery

The player should initially be able to believe that something impossible is happening. The final explanation must be grounded in the people and geography of Crow's Hollow.

### 23.1 Approved Misdirection Techniques

- Human silhouettes concealed by snowfall, distance, and terrain.
- Lantern signals, mirrors, or reflective surfaces used from elevated positions.
- Footprints interrupted by water, ice, timber, rock, or deliberately brushed snow.
- Wind whistles and sound travelling through mine shafts, pipes, old machinery, or telegraph infrastructure.
- Ritual-looking marks that are actually tallies, routes, shipment counts, or coded warnings.
- A body staged to resemble a ritual killing.
- Deliberately planted objects that suggest a supernatural or military explanation.
- Witnesses exaggerating, misremembering, or knowingly lying.

### 23.2 Explanation Fairness

Every major strange event must have a plausible physical explanation established by earlier clues. The player should be able to look back and think, “I misunderstood what I saw,” rather than “the writers invented an explanation at the end.”

### 23.3 No Actual Supernatural Content

The final canon contains no real monster, ghost, curse, occult power, psychic ability, or supernatural event. Characters may believe in these things, use them as a cover, or exploit other people's beliefs. The game should never secretly validate the supernatural interpretation.

---

# PART V — ART, ANIMATION, SOUND, AND PRESENTATION

## 24. Art Direction

### 24.1 Overall Style

- 2D pixel art with a cinematic side-scrolling composition.
- Native design resolution: **320×180** pixels.
- Render to a larger display using crisp integer scaling and nearest-neighbor filtering.
- Use a consistent pixel grid. Avoid mixing high-resolution smooth assets with low-resolution pixel art.
- Characters should be readable at native resolution, with silhouettes and clothing shapes doing much of the work.
- Environments should feel detailed but not noisy. The player must be able to distinguish interactive clues from decoration.

### 24.2 Color Palette

**Night / exterior wilderness**
- Deep navy: `#090D16`
- Icy slate: `#334155`
- Bone white: `#F1F5F9`
- Midnight purple: `#171026`

**Warmth / shelter**
- Flickering amber: `#F59E0B`
- Kerosene orange: `#D97706`
- Muted wood brown: use restrained dark timber tones compatible with the cold palette

**Danger / evidence**
- Deep crimson: `#991B1B`
- Blood should be dark and restrained. Avoid bright arcade-red splashes.

**Color principle:** The strongest contrast is between warm, small pools of human shelter and the cold blue-white exterior. Warmth should feel temporary and fragile, not safe by default.

### 24.3 Character Sprites

- Silas should have a recognizable silhouette: heavy winter coat, hat, scarf or collar, gloves, boots, and a lantern when carried.
- Use restrained idle animations: breathing, coat movement, hand adjustment, small shifts of weight.
- Character faces need enough detail to support close framing, but do not over-animate every conversation.
- Every major character needs a distinctive outline, clothing palette, and posture.
- Animation should communicate emotional state: avoidance, impatience, fear, confidence, fatigue, and concealed aggression.

### 24.4 Environment Art

Required environment sets:

1. Blackwood Station platform, railway tracks, signal and telegraph elements.
2. Snowy village street and alleys.
3. Black Ram Hotel exterior, lobby/parlor, corridor, Room 4, and selected private rooms.
4. General Store interior and back storage area.
5. Pine forest paths and frozen creek.
6. Old Sawmill exterior and interior machinery.
7. Abandoned Graveyard.
8. Telegraph Tower and its approach.
9. Mine road, mine entrance, and collapsed workings.
10. Summit Cabin / Old Observatory.

Use foreground silhouettes and layered distant mountains to build depth. Do not let decorative foreground trees, snow, or fog obscure essential clues.

## 25. Atmospheric Effects

- Snow particle system with horizontal wind vectors and variable size, speed, and opacity.
- Wind intensity changes by location and story beat.
- Subtle fog layers that reduce distant visibility without hiding critical navigation.
- Lantern light mask with a warm central glow and restrained falloff.
- Fireplace and lantern flicker.
- Occasional drifting snow accumulations or gusts at authored moments.
- Optional CRT / scanline / vignette presentation filter, disabled by default or user-toggleable.

Atmospheric effects must be optimized for browser performance and must not compromise text or clue legibility.

## 26. Animation Priorities

Build animation around moments that matter:

- Silas walking, stopping, turning, crouching, climbing, interacting, aiming, firing, reloading, and being injured.
- Lantern raising, lowering, lighting, and extinguishing.
- Important character gestures during dialogue.
- Door opening, locks, machinery, waterwheel, telegraph equipment, and evidence interactions.
- Snow accumulation / wind reaction where feasible.

Combat animation is not the largest animation budget. Character expression, inspection gestures, and environmental interaction are more important.

## 27. Audio Direction

Audio should create a feeling of distance, isolation, and human presence. Avoid continuous music that tells the player how to feel.

### 27.1 Ambient Sound

- Low-frequency wind beds using filtered noise and slow modulation.
- Distant wood creaks, roof strain, loose signs, and shutters.
- Snow footsteps with variation by surface and pace.
- Interior room tone: fire, floorboards, quiet conversation, glass, stove, and distant movement.
- Train steam, metal strain, couplings, rail noise, and whistle.
- Sawmill machinery, waterwheel, frozen creek, and mine ventilation.
- Telegraph clicks, wire hum, and intermittent signal noises.

### 27.2 Music

- Sparse cello drones.
- Slow, restrained acoustic guitar or low strings.
- Occasional metallic bell or resonant struck tones.
- Long gaps without music.
- Music should not signal a combat encounter every time a character appears.

### 27.3 Sound Design Rules

- Gunshots must be rare and have strong, location-aware reverb and decay.
- A gunshot should feel much louder and more consequential than routine interface sounds.
- Important clue sounds may be subtle but must not be the only way to detect essential evidence.
- Provide volume sliders for music, ambience, and effects.

---

# PART VI — USER INTERFACE AND PLAYER SUPPORT

## 28. Interface Principles

The interface should feel like a detective's tools, not a modern shooter HUD.

### 28.1 Main HUD

Keep the exploration HUD minimal. Possible elements:

- Small interaction prompt near a relevant object.
- Subtle time indicator only when time matters.
- Lantern indicator when active or low on oil.
- Warmth indicator only when exposure becomes relevant.
- Revolver ammunition appears when aiming, reloading, or inspecting the weapon—not as a permanent oversized counter.

Do not display a permanent paranoia or sanity bar.

### 28.2 Notebook

The notebook contains:

- Case overview.
- People and known relationships.
- Locations.
- Evidence and testimony.
- Timeline.
- Unresolved questions.
- Player deductions and contradictions.

Use language appropriate to Silas's era and personality. The notebook should feel handwritten, organized, and practical.

### 28.3 Inventory

Keep inventory small and story-focused. Items exist because they are useful for a clue, conversation, or environmental interaction. Avoid a large grid full of generic loot.

Potential item categories:
- Documents and photographs.
- Keys and personal objects.
- Tools and consumables.
- Lantern oil.
- Revolver cartridges.

### 28.4 Dialogue UI

- Present readable dialogue with a restrained typewriter or line-by-line reveal.
- Allow the player to advance or instantly reveal text.
- Make evidence-presenting options contextual.
- Avoid cluttering the screen with too many choices at once.
- Use portraits only if they fit the visual budget and do not undermine the side-scrolling presentation.

## 29. Controls

Suggested keyboard and mouse defaults:

| Action | Default input |
|---|---|
| Move left / right | A / D or Left / Right |
| Interact / examine | E |
| Open notebook | J or Tab |
| Inventory | I |
| Toggle lantern | F |
| Crouch / move carefully | Ctrl or C |
| Climb / confirm | W / Up where contextual |
| Aim revolver | Right mouse button or a dedicated aim key |
| Fire | Left mouse button while aiming |
| Reload | R |
| Cancel / back | Esc |

Controls must be remappable where practical. Provide a keyboard-only control scheme so the game does not require a mouse to be playable. Mouse aiming is the primary desktop option; keyboard aiming should use a small set of discrete directions.

Do not make jumping a mandatory high-frequency action. If included, assign Space and use it only for authored low obstacles or gaps.

## 30. Accessibility and Comfort

- Adjustable text speed and an option to show full dialogue immediately.
- Adjustable music, ambience, and effects volume.
- Remappable controls where practical.
- Keyboard-only play support.
- Option to reduce camera shake and screen flashes.
- Avoid rapid full-screen flashes.
- Important clues must not rely on color alone.
- Clear interaction feedback and generous interaction range.
- Text must remain legible at common browser window sizes.
- Pause support, including pausing during single-player dialogue and notebook screens.

---

# PART VII — TECHNICAL SPECIFICATION FOR AN AI DEVELOPMENT AGENT

## 31. Target Platform and Build Strategy

**Target:** Desktop web browser first; responsive scaling for different window sizes.  
**Core technology:** HTML5 Canvas 2D, vanilla JavaScript, Web Audio API.  
**Preferred deliverable:** A self-contained `index.html` build with all required scripts, styles, and assets embedded or packaged locally. During development, code may be separated into logical files and bundled into one HTML file for delivery.

Do not require a backend, account system, remote API, or network access for the core game. The game must remain playable offline after the assets are loaded. Use localStorage or IndexedDB for local save data; localStorage is sufficient for the first prototype.

## 32. Rendering

- Logical canvas resolution: 320×180.
- Scale to the available display using integer scaling when possible.
- Use `imageSmoothingEnabled = false` for pixel-art rendering.
- Maintain aspect ratio; letterbox or pillarbox rather than distort the scene.
- Separate world rendering, lighting, particles, UI, and post-processing into explicit passes.
- Use deterministic draw order: background, far parallax, midground, interactive world, characters, foreground, lighting/effects, interface.
- Avoid subpixel camera coordinates where they cause shimmering.

## 33. Game Loop

Use a fixed or semi-fixed update step for gameplay and a render loop driven by `requestAnimationFrame`.

Core loop responsibilities:

1. Read and normalize input.
2. Update player movement and interaction state.
3. Update current scene entities and character routines.
4. Update story flags and timed events.
5. Update camera.
6. Update particles and environmental effects.
7. Render world and interface.
8. Save only at intentional checkpoints or when the player requests it; do not write to storage every frame.

Ensure pause and focus-loss behavior is handled. The game should not continue advancing critical story timers while the browser tab is inactive unless explicitly designed to do so.

## 34. Recommended Code Organization

Keep gameplay systems separated even if the final build is one HTML file.

```text
THE_WHITE_TRAIL/
├── index.html                 # final self-contained browser build
├── src/                       # development source; bundle for delivery
│   ├── main.js
│   ├── engine/
│   │   ├── game.js
│   │   ├── loop.js
│   │   ├── renderer.js
│   │   ├── camera.js
│   │   ├── input.js
│   │   ├── collision.js
│   │   └── sceneManager.js
│   ├── entities/
│   │   ├── silas.js
│   │   ├── character.js
│   │   ├── object.js
│   │   └── interactable.js
│   ├── systems/
│   │   ├── dialogueSystem.js
│   │   ├── evidenceSystem.js
│   │   ├── deductionSystem.js
│   │   ├── storyState.js
│   │   ├── combatSystem.js
│   │   ├── inventorySystem.js
│   │   ├── lanternSystem.js
│   │   ├── warmthSystem.js
│   │   └── saveSystem.js
│   ├── world/
│   │   ├── locations.js
│   │   ├── sceneData.js
│   │   ├── tilemap.js
│   │   └── characterRoutines.js
│   ├── ui/
│   │   ├── hud.js
│   │   ├── notebook.js
│   │   ├── inventory.js
│   │   ├── dialogueView.js
│   │   └── menus.js
│   └── audio/
│       ├── audioManager.js
│       └── soundscape.js
├── assets/
│   ├── sprites/
│   ├── tilesets/
│   ├── backgrounds/
│   ├── ui/
│   ├── audio/
│   └── fonts/
└── data/
    ├── characters.json
    ├── dialogue.json
    ├── evidence.json
    ├── deductions.json
    ├── locations.json
    └── storyEvents.json
```

If a one-file prototype is required immediately, retain the same logical separation using classes and clearly labeled sections inside the HTML file. Do not build a single unstructured function containing the entire game.

## 35. Core State Model

Use a central state object with explicit, serializable data. Avoid hidden state scattered across UI callbacks.

Example starting point (expand as needed):

```javascript
const GameState = {
  version: 1,
  currentScene: "BLACKWOOD_STATION",
  previousScene: null,
  worldTime: {
    day: 1,
    hour: 18,
    minute: 40,
    period: "EVENING"
  },
  player: {
    x: 40,
    y: 0,
    health: 100,
    warmth: 100,
    lanternOn: true,
    lanternOil: 100,
    revolver: {
      loaded: 3,
      capacity: 6,
      reserve: 0
    }
  },
  evidence: {
    observed: [],
    collected: [],
    examined: [],
    deductions: []
  },
  characters: {
    silas: { alive: true },
    claraMercer: { alive: true, location: "UNKNOWN" },
    edgarFinch: { alive: true, trust: "WARY" },
    sheriffHale: { alive: false, fateKnown: false },
    mrsGable: { alive: true, cooperation: "GUARDED" },
    reverendVale: { alive: true, cooperation: "UNKNOWN" },
    jonahRusk: { alive: true, cooperation: "GUARDED" },
    gideonMercer: { alive: true, exposed: false },
    adaBell: { alive: true, cooperation: "CAUTIOUS" }
  },
  flags: {
    receivedTelegram: true,
    metFinch: false,
    enteredRoom4: false,
    foundSheriffBody: false,
    foundPaleOrderLedger: false,
    discoveredExplosives: false,
    learnedTelegramWasClara: false,
    drankPoisonedCoffee: false,
    poisonedCoffeeSequencePlayed: false,
    exposedMineOperation: false,
    trappedInVillage: true
  },
  consequences: {
    shotsFired: 0,
    peopleKilled: [],
    peopleWounded: [],
    threatsMade: [],
    witnessesProtected: [],
    evidenceDestroyed: []
  }
};
```

This is an illustrative schema, not a requirement to use every field exactly as written. Make all story-critical state explicit, serializable, and testable. Avoid a global paranoia field. The hallucination sequence is controlled by story flags, not a meter.

## 36. Data-Driven Content

Dialogue, evidence, deductions, character routines, and story events should be authored as data rather than hard-coded deep inside rendering code.

### 36.1 Evidence Example

```javascript
{
  id: "SAWMILL_BROKEN_WATCH",
  name: "Broken Pocket Watch",
  location: "OLD_SAWMILL",
  category: "PERSONAL_OBJECT",
  observation: "The watch casing is cracked. The hands have stopped, but the mechanism is not completely destroyed.",
  collected: true,
  examined: false,
  relatedEvidence: ["SAWMILL_ROPE_MARKS", "CAVALRY_TRACKS"],
  relatedCharacters: ["SHERIFF_HALE", "UNKNOWN_ASSAILANT"],
  importance: "KEY"
}
```

### 36.2 Story Event Example

```javascript
{
  id: "POISONED_COFFEE_EPISODE",
  trigger: {
    all: ["DRANK_POISONED_COFFEE"],
    none: ["POISONED_COFFEE_SEQUENCE_PLAYED"]
  },
  effects: [
    { type: "PLAY_AUTHORED_SEQUENCE", id: "COFFEE_DISTORTION" },
    { type: "SET_FLAG", flag: "POISONED_COFFEE_SEQUENCE_PLAYED", value: true }
  ]
}
```

The event system must prevent the sequence from replaying on reload or scene transition unless the player intentionally reloads a save from before the coffee was consumed.

## 37. Save System

- Save at deliberate checkpoints and allow manual saving if the final design supports it.
- Save all story flags, character states, evidence states, player inventory, current scene, position, and time.
- Version save data and provide a safe fallback if a save is malformed or from an older version.
- Never reset a dead character to alive after loading a later checkpoint.
- Make the consequences of permanent choices clear in the narrative, even if the game does not display a numerical morality score.

## 38. Performance and Browser Reliability

- Target smooth 60 FPS on a modest desktop.
- Cap or pool particles in severe blizzards.
- Avoid expensive full-screen effects every frame where a simpler mask or cached layer will work.
- Reuse sprite and tile assets; avoid unnecessary allocations inside the update loop.
- Handle browser resize and device pixel ratio while preserving the 320×180 logical resolution.
- Provide a clear loading state and an error state if assets fail.
- Start audio only after a user gesture where browser autoplay rules require it.
- Keep the core game usable offline after initial load.

---

# PART VIII — PRODUCTION PLAN AND ACCEPTANCE CRITERIA

## 39. Recommended Development Order

Do not build the entire story before testing the core experience. Build a polished vertical slice first.

### Phase 1 — Movement and Visual Foundation

- Create 320×180 Canvas renderer and integer scaling.
- Implement Silas's movement, collision, idle / walk animations, and camera follow.
- Build one snowy exterior scene and one hotel interior.
- Add basic snow, wind, and lantern lighting.

**Exit criteria:** Movement feels deliberate; camera remains readable; pixel art stays crisp at multiple window sizes.

### Phase 2 — Interaction and Investigation

- Implement interactable objects and contextual prompts.
- Implement evidence records and notebook UI.
- Add one small crime-scene investigation with at least four clues.
- Implement one deduction requiring the player to connect evidence.

**Exit criteria:** The player can discover, inspect, record, review, and connect evidence without relying on combat.

### Phase 3 — Dialogue and Character State

- Implement branching dialogue with conditions and consequences.
- Add two or three characters with distinct routines and knowledge.
- Make a character remember at least one important player choice.
- Add a witness path that can be closed by intimidation or violence and an alternative evidence path.

**Exit criteria:** Character behavior and investigation access visibly change based on player decisions.

### Phase 4 — Revolver and Consequence Prototype

- Implement drawing, aiming, firing, and manual reload.
- Limit ammunition.
- Build one authored confrontation with a nonviolent path, a threat path, and a lethal path.
- Track death permanently and change later scenes accordingly.

**Exit criteria:** The player understands that shooting is a serious choice and can complete the sequence without firing.

### Phase 5 — Story Vertical Slice

Build approximately 10–20 minutes of complete gameplay:

1. Train arrival at Blackwood Station.
2. Walk through the storm to Crow's Hollow.
3. Meet Finch and enter the Black Ram Hotel.
4. Investigate Room 4 and speak with Mrs. Gable.
5. Hear the 02:15 scream and reach the sawmill.
6. Investigate the sheriff's body and discover the first evidence chain.
7. Encounter one consequential character confrontation, with combat avoidable.

**Exit criteria:** This slice communicates the game's identity without requiring the full story.

### Phase 6 — Full Story Content

- Implement remaining locations and character routines.
- Complete the evidence graph and alternate investigation routes.
- Add the graveyard, telegraph tower, mine, and summit sequences.
- Add the single poisoned-coffee hallucination event.
- Implement endings and consequence checks.
- Add full soundscape, music, accessibility options, and save handling.

## 40. Vertical Slice Quality Bar

The vertical slice is successful when:

- A new player understands that the game is a detective mystery.
- The player can move through a side-scrolling world without fighting.
- The atmosphere comes from art, sound, weather, lighting, and characters.
- At least one clue is discovered by careful observation rather than a bright marker.
- The notebook provides a useful record without revealing the answer automatically.
- Dialogue changes based on evidence or player behavior.
- One potentially lethal confrontation has a valid non-lethal alternative.
- The revolver feels powerful and dangerous, not like a routine tool.
- The game gives no impression that random monsters or generic enemies are the main threat.

## 41. Test Checklist for AI Agents

### Story and Logic
- [ ] No hallucination can occur before the poisoned coffee event.
- [ ] The poisoned-coffee sequence can occur only once per playthrough.
- [ ] No supernatural event is objectively real in the story state.
- [ ] Every major supernatural-looking clue has a physical explanation.
- [ ] The telegram's true sender can be deduced from evidence.
- [ ] The player can learn the central conspiracy through more than one evidence route where practical.
- [ ] Killing a character permanently removes their future testimony and updates the story.
- [ ] No generic enemy exists solely to be killed.

### Combat
- [ ] Silas has only one firearm.
- [ ] Ammunition is finite and scarce.
- [ ] No ammunition drops or farming loops exist.
- [ ] Every combat encounter has a narrative motivation.
- [ ] At least one major confrontation can be resolved without shooting.
- [ ] Shooting has consequences beyond consuming a bullet.

### Presentation
- [ ] Native resolution is 320×180.
- [ ] Pixel art scales crisply without smoothing.
- [ ] Camera transitions are smooth and restrained.
- [ ] UI remains legible at common browser sizes.
- [ ] Snow and lighting do not obscure essential clues.
- [ ] Audio begins in compliance with browser autoplay restrictions.

### Reliability
- [ ] Save and load preserve story flags and character states.
- [ ] A dead character does not return after a scene transition or load.
- [ ] Re-entering a scene does not duplicate evidence or replay one-time events.
- [ ] Missing assets produce a useful error rather than crashing silently.
- [ ] The game pauses safely when appropriate.

---

# PART IX — STORY QUESTIONS TO RESOLVE DURING WRITING

The following items are intentionally marked as decisions for the narrative design phase. They should not be invented inconsistently by an implementation agent.

1. **Finch's complicity:** Did Clara steal Finch's forms or seal, did Finch knowingly let her use his name, or did she exploit a telegraph procedure? Choose one explanation and seed it with evidence.
2. **Poisoner:** Who adulterated Silas's coffee, what did they intend (death, incapacitation, or disorientation), and what evidence can identify them?
3. **Clara's exact timeline:** Where was she on each night, when did she discover the truth, and where does she hide after sending the telegram?
4. **Mrs. Gable's Room 4 secret:** What happened in the room, who cleaned it, and why did Mrs. Gable allow it?
5. **Reverend Vale's knowledge:** Is he a committed conspirator, a useful propagandist who knows only part of the truth, or a believer who has been manipulated?
6. **The sheriff's murder method:** What exactly killed Sheriff Hale, how was the body staged, and what physical evidence proves it?
7. **The Pale Order code:** What do its marks and symbols mean in practical terms—shipment counts, mine routes, payroll shares, or something else? Keep the cipher understandable and consistent.
8. **The final evidence standard:** What evidence is necessary to expose the conspiracy publicly, and what evidence is merely enough for Silas to understand the truth privately?
9. **Ending set:** Decide the number of endings and which persistent choices determine them. Prefer a small number of emotionally distinct endings over many superficial variants.

These are not permission for an AI agent to make arbitrary story choices. The agent should use the default facts in this document and flag unresolved decisions before writing scenes that depend on them.

---

# PART X — MASTER INSTRUCTIONS FOR AN AI DEVELOPMENT AGENT

When implementing THE WHITE TRAIL, follow these priorities in order:

1. Preserve the game's identity as a **2D side-scrolling detective mystery adventure**.
2. Build investigation, dialogue, evidence, character state, and world exploration before expanding combat.
3. Treat the cast as named people with independent motives and persistent states—not as enemies or quest dispensers.
4. Keep combat rare and deliberate. Silas carries one revolver; ammunition is very scarce. No other weapons or generic enemy systems.
5. Make lethal violence change character availability, evidence routes, trust, future scenes, and endings.
6. Never add a sanity meter, paranoia meter, or random hallucination system. The poisoned coffee event is the only planned hallucination sequence.
7. Never make the supernatural real. Every apparent supernatural occurrence must eventually be explained by human action, natural conditions, or physical mechanisms.
8. Respect the late-nineteenth-century technology and social context. Use period-appropriate tools, transport, explosives, and language.
9. Use the adaptive side-scrolling camera: wide for exploration, closer for investigation, and intimate for dialogue or confrontation.
10. Keep the interface minimal and the notebook central.
11. Prefer data-driven story content and explicit state flags so narrative consequences can be tested.
12. Build a complete vertical slice before attempting the full game.
13. Do not silently invent lore or resolve open story questions. Mark assumptions and request a design decision when a choice would materially affect canon.
14. Do not optimize for kill count, combat frequency, or survival difficulty. Optimize for clarity of evidence, emotional consequence, atmosphere, and player agency.

## Final Creative North Star

THE WHITE TRAIL is about a man who arrives expecting to investigate a disappearance and discovers a community that has spent decades burying its history. Snow hides tracks, people hide motives, and superstition hides practical crimes. Silas has a revolver, but the most important thing he carries is the ability to notice what other people overlook.

**The player should fear what people are willing to do to protect a secret—not a monster waiting in the dark.**
