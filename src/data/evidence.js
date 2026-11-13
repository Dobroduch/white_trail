// Evidence and testimony records. Stable IDs; text separates what Silas OBSERVES from how he
// INTERPRETS it. "detail" is only revealed by a second, closer examination.
// Categories: PHYSICAL, DOCUMENT, PERSONAL, ENVIRONMENT, TESTIMONY.
export const EVIDENCE = {
  // ---------------- Arrival / village ----------------
  ROAD_NOTICE: {
    title: 'Notice for Sheriff Hale', category: 'DOCUMENT', location: 'ROAD', importance: 'CORROBORATING',
    observed: 'A printed notice on the board at the edge of town: Sheriff N. Hale has not returned to his office these three nights. Any person with knowledge to apply to Constable E. Finch.',
    detail: 'I read it twice. There is no mention anywhere of Miss Mercer.',
    interpretation: 'The town will say the sheriff is missing out loud, on paper. It will not say the same of the girl.',
    related: { people: ['HALE', 'FINCH', 'CLARA'], places: ['ROAD'], evidence: [] },
    tags: ['HALE_MISSING'],
  },
  HOTEL_REGISTER: {
    title: 'Black Ram guest register', category: 'DOCUMENT', location: 'PARLOR', importance: 'KEY',
    observed: 'My name is the first entry in better than a week. Room 4 has no guest written against it for the past fortnight.',
    detail: null,
    interpretation: 'Either Room 4 stood empty, or someone stayed in it without signing the book.',
    related: { people: ['GABLE'], places: ['PARLOR', 'ROOM4'], evidence: ['HOTEL_ROOM4_BOARDS'] },
    tags: ['ROOM4'],
  },
  HOTEL_ROOM4_BOARDS: {
    title: 'Scrubbed floorboards, Room 4', category: 'PHYSICAL', location: 'ROOM4', importance: 'KEY',
    observed: 'A patch of boards near the foot of the bed is paler than the rest of the floor. The grain stands up the way it does after hard scrubbing. Recent.',
    detail: 'Lye, by the smell. And in the seams between the boards, where no brush reaches, something dark has dried. Blood. Not a little of it.',
    interpretation: 'Someone bled in this room, and someone cleaned it up. Who, and when, I cannot say.',
    related: { people: ['GABLE'], places: ['ROOM4'], evidence: ['HOTEL_REGISTER'] },
    tags: ['ROOM4', 'BLOOD'],
  },
  CREEK_TRACKS: {
    title: 'Fresh tracks on the creek path', category: 'ENVIRONMENT', location: 'CREEK', importance: 'CORROBORATING',
    observed: 'One set of prints, made tonight — the edges are still sharp. A long stride, following the path down toward the mill.',
    detail: 'Deepest at the toe. Whoever made them was moving quickly. They go down toward the mill, and none come back up this path.',
    interpretation: 'Someone went down to the mill tonight before I did. Toward the scream, or away from something.',
    related: { people: [], places: ['CREEK', 'SAWMILL'], evidence: [] },
    tags: ['TRACKS'],
  },
  // ---------------- The sawmill ----------------
  SAWMILL_BODY: {
    title: "Sheriff Hale's body", category: 'PHYSICAL', location: 'SAWMILL', importance: 'KEY',
    observed: 'A man hangs by the ankles from the wheel frame, a sheriff\'s star on his coat. His face is grey-white. The snow beneath him is nearly clean — a few dark spots, no more.',
    detail: 'His coat is torn at the side, and the cloth around the tear is stiff with blood, frozen through. That blood froze a long while before tonight. His hands are frozen hard as wood; that much cold takes days to get into a man, not an hour on a rope.',
    interpretation: 'The town will say he was drained. To my eye there is simply too little blood beneath him for where he hangs.',
    related: { people: ['HALE'], places: ['SAWMILL'], evidence: ['SAWMILL_ROPE', 'SAWMILL_DRAG'] },
    tags: ['BODY', 'LITTLE_BLOOD'],
  },
  SAWMILL_WATCH: {
    title: 'Broken pocket watch', category: 'PERSONAL', location: 'SAWMILL', importance: 'KEY', collect: 'WATCH',
    observed: 'A pocket watch in the snow, six feet from the body toward the creek. The crystal is smashed and the hands are bent against the dial.',
    detail: 'Engraved inside the lid: N. HALE. The case is cracked, but the works are not destroyed. A careful hand might learn something from them. I take it.',
    interpretation: 'It lay between the body and the water. The time on its face cannot be trusted as it is.',
    related: { people: ['HALE'], places: ['SAWMILL'], evidence: ['SAWMILL_DRAG'] },
    tags: ['HALE_IDENTIFIED', 'CREEK_SIDE'],
  },
  SAWMILL_BOOTPRINTS: {
    title: 'Boot impressions under the roof', category: 'PHYSICAL', location: 'SAWMILL', importance: 'KEY',
    observed: 'Under the shed roof, where the snow has not reached, prints in the sawdust: a narrow heel and a long, straight sole.',
    detail: 'A riding boot, cavalry pattern — tall heel, narrow toe. Not a miner\'s boot, nor a lumberman\'s.',
    interpretation: 'Someone in riding boots stood here, sheltered, facing the wheel. Riding boots are common enough in horse country; it narrows things only a little.',
    related: { people: [], places: ['SAWMILL'], evidence: [] },
    tags: ['BOOTS'],
  },
  SAWMILL_LEDGER: {
    title: 'Half-burned ledger', category: 'DOCUMENT', location: 'SAWMILL', importance: 'KEY', collect: 'LEDGER',
    observed: 'A ledger thrown on a dead fire and left before it caught. Columns of figures, rows of tally strokes, and on one charred header: "—LE ORDER".',
    detail: 'I lift it from the ash. Further in, a cleaner page: "THE PALE ORDER — ACCTS." Dates from the \'seventies, sums against initials, and strokes grouped in fives. None of it means anything to me yet.',
    interpretation: 'Someone wanted these books burned and did not stay to see it done — or wanted them found half-burned. Old accounts, brought to a new death.',
    related: { people: [], places: ['SAWMILL'], evidence: ['SAWMILL_MARKS'] },
    tags: ['PALE_ORDER', 'TALLY'],
  },
  SAWMILL_ROPE: {
    title: 'Rope over the wheel frame', category: 'PHYSICAL', location: 'SAWMILL', importance: 'KEY',
    observed: 'The rope runs from his ankles up over the wheel-frame beam and down to a cleat on the post, where it is tied off.',
    detail: 'The beam is scored bright where the rope ran over it under load. New hemp, still stiff — not the rotten line lying about the mill.',
    interpretation: 'He was hauled up from the ground by hand, and the line made fast. That took strength, and time.',
    related: { people: ['HALE'], places: ['SAWMILL'], evidence: ['SAWMILL_BODY'] },
    tags: ['HOISTED'],
  },
  SAWMILL_MARKS: {
    title: 'Marks cut into the post', category: 'PHYSICAL', location: 'SAWMILL', importance: 'CORROBORATING',
    observed: 'Fresh cuts in the post below the cleat: short strokes in groups, one group struck through. The wood is pale inside them.',
    detail: 'Cut with a knife, and not long ago. Placed at eye height, facing the path — made to be seen by whoever found him.',
    interpretation: 'People here will call it witch-writing. It looks more like counting to me. I can\'t read it.',
    related: { people: [], places: ['SAWMILL'], evidence: ['SAWMILL_LEDGER'] },
    tags: ['TALLY', 'RITUAL_APPEARANCE'],
  },
  SAWMILL_DRAG: {
    title: 'Furrow from the creek', category: 'ENVIRONMENT', location: 'SAWMILL', importance: 'KEY',
    observed: 'A shallow furrow in the snow, half filled by the wind, runs from the creek bank up toward the wheel.',
    detail: 'Heel-drag marks either side of it. Something heavy was pulled along the ground, not carried, and it did not walk. And the furrow does not start at the open water: it comes out from behind the wheel, where the old race runs in under the frame.',
    onExamine: [{ set: { knowsWheelPit: true } }], // the closer look teaches Silas there is a way in under the wheel (the hidden wheel pit)
    interpretation: 'Whatever came up toward the wheel came along the ground, from somewhere under the frame.',
    related: { people: [], places: ['SAWMILL', 'CREEK'], evidence: ['SAWMILL_BODY', 'SAWMILL_WATCH'] },
    tags: ['DRAGGED'],
  },
  // ---------------- The wheel pit (optional hidden area) ----------------
  PIT_HOLLOW: {
    title: 'A frozen hollow in the wheel pit', category: 'ENVIRONMENT', location: 'WHEEL_PIT', importance: 'OPTIONAL',
    observed: 'On the ice of the old race, under the wheel: a long hollow pressed into the packed snow, the length of a man. Frost has grown feathers inside it.',
    detail: 'Frost like that takes days to grow in still air, not hours. Caught in the rim, strands of new hemp, stiff, the same as the rope on the frame. Whatever lay here lay still and cold for a long while before it was dragged out.',
    interpretation: 'Something the size of a man was kept down here, out of sight and frozen, and taken up the bank to the wheel tonight.',
    related: { people: ['HALE'], places: ['WHEEL_PIT', 'SAWMILL'], evidence: ['SAWMILL_DRAG', 'SAWMILL_ROPE', 'SAWMILL_BODY'] },
    tags: ['KEPT_COLD'],
  },
  // ---------------- Testimony ----------------
  T_CONDUCTOR_PASS: {
    title: 'The conductor, on the pass', category: 'TESTIMONY', speaker: 'Conductor', location: 'STATION',
    observed: '"Snow\'s coming over the pass faster than they can clear it. If it closes, three days. Could be a week."',
    interpretation: 'I am here until the mountain says otherwise.',
    related: { people: [], places: ['STATION'], evidence: [] },
  },
  T_FINCH_HALE: {
    title: 'Finch, on the sheriff', category: 'TESTIMONY', speaker: 'Constable Finch', location: 'VILLAGE',
    observed: '"Three nights now. He went out after dark and didn\'t come back to the office." Asked where: "He didn\'t say. He didn\'t always say."',
    interpretation: 'Either Hale kept his own counsel, or Finch would rather not know where he went.',
    related: { people: ['HALE', 'FINCH'], places: ['VILLAGE'], evidence: [] },
  },
  T_FINCH_CLARA: {
    title: 'Finch, on Clara Mercer', category: 'TESTIMONY', speaker: 'Constable Finch', location: 'VILLAGE',
    observed: '"Her family\'s seeing to that. Mr. Mercer doesn\'t care to have it talked about in the street."',
    interpretation: 'A daughter is missing, and her father\'s first concern is quiet. That may be pride. It may be something else.',
    related: { people: ['CLARA', 'FINCH'], places: ['VILLAGE'], evidence: [] },
  },
  T_FINCH_TELEGRAM: {
    title: 'Finch, shown the telegram', category: 'TESTIMONY', speaker: 'Constable Finch', location: 'VILLAGE',
    observed: 'He read it for a long while, then: "That\'s my name on it." And: "Then you\'d best be careful who you show it to."',
    interpretation: 'He did not say he sent it. Could be nerves. Could be something else.',
    related: { people: ['FINCH'], places: ['VILLAGE'], evidence: [] },
  },
  T_FINCH_RIDGE: {
    title: 'Finch, on what people say', category: 'TESTIMONY', speaker: 'Constable Finch', location: 'VILLAGE',
    observed: '"Some say there\'s something up on the ridge. Lights. Old stories. Don\'t listen to half of it."',
    interpretation: 'He laughed when he said it. The laugh didn\'t take.',
    related: { people: ['FINCH'], places: ['RIDGE'], evidence: [] },
  },
  T_FINCH_PAPERS: {
    title: 'Finch, on Hale\'s late hours', category: 'TESTIMONY', speaker: 'Constable Finch', location: 'PARLOR',
    observed: '"Hale had been at the office late, before. Going through old papers — county records, mine claims. I didn\'t ask what for."',
    interpretation: 'Old records. Worth learning which ones, and why a sheriff wanted them.',
    related: { people: ['HALE', 'FINCH'], places: ['PARLOR'], evidence: [] },
  },
  T_FINCH_LATE: {
    title: 'Finch, guarded', category: 'TESTIMONY', speaker: 'Constable Finch', location: 'PARLOR',
    observed: '"Hale kept late hours at the office, before he went. That\'s all."',
    interpretation: 'There was more he could have said. He chose not to.',
    related: { people: ['HALE', 'FINCH'], places: ['PARLOR'], evidence: [] },
  },
  T_GABLE_HALE: {
    title: 'Mrs. Gable, on the sheriff', category: 'TESTIMONY', speaker: 'Mrs. Gable', location: 'PARLOR',
    observed: '"He took his supper here, some nights. What he did after supper was his business."',
    interpretation: 'She knew his habits well enough to say exactly that much.',
    related: { people: ['HALE', 'GABLE'], places: ['PARLOR'], evidence: [] },
  },
  T_GABLE_CLARA: {
    title: 'Mrs. Gable, on Clara Mercer', category: 'TESTIMONY', speaker: 'Mrs. Gable', location: 'PARLOR',
    observed: '"Miss Mercer is a Mercer, Mister Vance. I don\'t discuss the Mercers in my parlor."',
    interpretation: 'Not fear, quite. Caution — the kind people learn.',
    related: { people: ['CLARA', 'GABLE'], places: ['PARLOR'], evidence: [] },
  },
  T_GABLE_ROOM4: {
    title: 'Mrs. Gable, on Room 4', category: 'TESTIMONY', speaker: 'Mrs. Gable', location: 'PARLOR',
    observed: '"A guest took ill. I clean my rooms, Mister Vance."',
    interpretation: 'Illness can bleed — consumption does. It does not usually call for lye.',
    related: { people: ['GABLE'], places: ['ROOM4'], evidence: ['HOTEL_ROOM4_BOARDS', 'HOTEL_REGISTER'] },
  },
  T_GABLE_REGISTER: {
    title: 'Mrs. Gable, pressed on the register', category: 'TESTIMONY', speaker: 'Mrs. Gable', location: 'PARLOR',
    observed: '"Not every guest wants his name in a book, Mister Vance. Some of them pay for that."',
    interpretation: 'By her account there was a guest, kept off the books. Whether that is the truth or a better story, I can\'t yet tell.',
    related: { people: ['GABLE'], places: ['ROOM4'], evidence: ['HOTEL_REGISTER'] },
  },
  T_GABLE_VOICE: {
    title: 'Mrs. Gable, on the voice', category: 'TESTIMONY', speaker: 'Mrs. Gable', location: 'PARLOR',
    observed: '"It went on too long for a man that\'s hurt. A hurt man stops, Mister Vance. That one kept on."',
    interpretation: 'She has heard men hurt before. Whatever screamed tonight, she does not think it was dying.',
    related: { people: ['GABLE'], places: ['SAWMILL'], evidence: [] },
  },
  T_GABLE_PIT: {
    title: 'Mrs. Gable, on the wheel pit', category: 'TESTIMONY', speaker: 'Mrs. Gable', location: 'PARLOR',
    observed: '"The race runs in under the wheel. Boys used to dare each other down into the wheel pit. Cold as an icehouse, August or not."',
    interpretation: 'A cold, hidden place under the wheel, a few yards from where the sound came from.',
    related: { people: ['GABLE'], places: ['SAWMILL', 'WHEEL_PIT'], evidence: [] },
  },
  T_GABLE_NIGHT: {
    title: 'Mrs. Gable, at 02:15', category: 'TESTIMONY', speaker: 'Mrs. Gable', location: 'PARLOR',
    observed: '"The mill. Down by the creek. Sound carries along the water — it always sounds closer than it is."',
    interpretation: 'She knew where it came from without having to think about it.',
    related: { people: ['GABLE'], places: ['SAWMILL'], evidence: [] },
  },
};

export const PLACE_NAMES = {
  STATION: 'Blackwood Station', ROAD: 'The road', VILLAGE: "Crow's Hollow", PARLOR: 'Black Ram Hotel',
  ROOM4: 'Room 4', CREEK: 'The creek path', SAWMILL: 'The old sawmill', WHEEL_PIT: 'The wheel pit', RIDGE: 'The ridge',
};
export const PEOPLE_NAMES = {
  HALE: 'Sheriff Nathaniel Hale', FINCH: 'Constable Edgar Finch', GABLE: 'Mrs. Gable', CLARA: 'Clara Mercer',
};
