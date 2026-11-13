// Data-driven dialogue. Node fields:
//   who:     'silas' | 'finch' | 'gable' | 'conductor' | 'note' (Silas's unspoken observation)
//   text:    line shown (omit on pure choice hubs to keep the previous line on screen)
//   again:   alternate text when a hub node is revisited
//   do:      effects applied when the node is entered
//   next:    next node id, or 'END'
//   choices: [{ text, next, if?, once? }]
//   branch:  [{ if?, next }] — first matching branch is taken immediately
export const DIALOGUE = {
  CONDUCTOR: {
    start: 'a',
    nodes: {
      a: { who: 'conductor', text: 'Blackwood, mister. End of the line for you — unless you\'ve had a change of heart.', next: 'b' },
      b: { who: 'silas', text: 'When\'s the next train back down?', next: 'c' },
      c: { who: 'conductor', text: 'Can\'t say. Snow\'s coming over the pass faster than they can clear it. If it closes, three days. Could be a week.', do: [{ evidence: 'T_CONDUCTOR_PASS' }], next: 'hub' },
      hub: { choices: [
        { text: 'What do you know of Crow\'s Hollow?', next: 'town', once: true },
        { text: 'Is the telegraph open?', next: 'wire', once: true },
        { text: 'I\'ll take my chances.', next: 'bye' },
      ] },
      town: { who: 'conductor', text: 'Silver town, once. We drop the post and the coal, and we don\'t stay.', next: 'town2' },
      town2: { who: 'conductor', text: 'Folks up there don\'t come down to meet the train much anymore.', next: 'hub' },
      wire: { who: 'conductor', text: 'Office is shut for the storm. The wire runs up the valley — if the wind leaves it standing.', next: 'hub' },
      bye: { who: 'conductor', text: 'Most do, up here. Keep to the road, and keep your lamp lit.', do: [{ set: { talkedConductor: true } }, { script: 'CONDUCTOR_DEPART' }], next: 'END' },
    },
  },

  FINCH_MEET: {
    start: 'a',
    nodes: {
      a: { who: 'finch', text: 'You\'d be Vance.', next: 'a2' },
      a2: { who: 'silas', text: 'Constable Finch.', next: 'b' },
      b: { who: 'finch', text: 'Edgar Finch. Yes. I didn\'t think you\'d get up here before the pass closed.', next: 'hub' },
      hub: { who: 'finch', text: 'You\'d best get in out of this.', again: 'Anything else? It\'s cold, Mister Vance.', choices: [
        { text: 'Tell me about the sheriff.', next: 'hale', once: true },
        { text: 'And Clara Mercer?', next: 'clara', once: true },
        { text: 'Your telegram found me. [Show it]', next: 'tel', once: true },
        { text: 'What are people saying?', next: 'talk', once: true },
        { text: 'That\'ll do for tonight.', next: 'close', if: { seen: 'FINCH_MEET.hale' } },
      ] },
      hale: { who: 'finch', text: 'Nathaniel Hale. Three nights now. He went out after dark and didn\'t come back to the office.', do: [{ evidence: 'T_FINCH_HALE' }], next: 'hale2' },
      hale2: { who: 'silas', text: 'Went out where?', next: 'hale3' },
      hale3: { who: 'finch', text: '...He didn\'t say. He didn\'t always say.', next: 'hub' },
      clara: { who: 'finch', text: 'Miss Mercer.', next: 'clara2' },
      clara2: { who: 'finch', text: 'Her family\'s seeing to that. Mr. Mercer doesn\'t care to have it talked about in the street.', do: [{ evidence: 'T_FINCH_CLARA' }], next: 'hub' },
      tel: { who: 'note', text: 'I hold the telegram out to him. He reads it for a long while.', next: 'tel2' },
      tel2: { who: 'finch', text: '...That\'s my name on it.', next: 'tel3' },
      tel3: { who: 'silas', text: 'It is.', next: 'tel4' },
      tel4: { who: 'finch', text: 'Then you\'d best be careful who you show it to.', do: [{ evidence: 'T_FINCH_TELEGRAM' }, { set: { showedFinchTelegram: true } }], next: 'hub' },
      talk: { who: 'finch', text: 'Depends who you ask. Some say there\'s something up on the ridge. Lights. Old stories.', next: 'talk2' },
      talk2: { who: 'note', text: 'He laughs. It doesn\'t take.', next: 'talk3' },
      talk3: { who: 'finch', text: 'Don\'t listen to half of it.', do: [{ evidence: 'T_FINCH_RIDGE' }], next: 'hub' },
      close: { who: 'note', text: 'He keeps glancing past me, up the street.', choices: [
        { text: 'You look like you haven\'t slept, Constable.', next: 'kind' },
        { text: 'You\'re holding something back, Finch.', next: 'press' },
      ] },
      kind: { who: 'finch', text: '...I haven\'t. Not since.', do: [{ char: { finch: { trust: 'STEADY' } } }], next: 'kind2' },
      kind2: { who: 'finch', text: 'Mrs. Gable will have a room for you. I\'ll walk you in.', next: 'END' },
      press: { who: 'finch', text: 'I\'ve told you what I know, Mister Vance.', next: 'press2' },
      press2: { who: 'finch', text: 'It\'s cold. Go inside.', do: [{ char: { finch: { trust: 'GUARDED' } } }], next: 'END' },
    },
  },

  FINCH_PARLOR: {
    start: 'start',
    nodes: {
      start: { branch: [
        { if: { flag: 'finchParlorDone' }, next: 'repeat' },
        { if: { trust: { finch: 'STEADY' } }, next: 'steady' },
        { next: 'guarded' },
      ] },
      steady: { who: 'finch', text: 'Vance.', next: 'steady1' },
      steady1: { who: 'note', text: 'He keeps his voice under the noise of the fire.', next: 'steady2' },
      steady2: { who: 'finch', text: 'Hale had been at the office late, before. Going through old papers — county records, mine claims. I didn\'t ask what for.', do: [{ evidence: 'T_FINCH_PAPERS' }], next: 'shub' },
      shub: { choices: [
        { text: 'Which claims?', next: 's_which' },
        { text: 'Thank you, Edgar.', next: 's_thanks' },
      ] },
      s_which: { who: 'finch', text: 'Old ones. Before my time here. ...I should get home.', do: [{ set: { finchParlorDone: true } }], next: 'END' },
      s_thanks: { who: 'finch', text: 'Don\'t thank me yet.', do: [{ set: { finchParlorDone: true } }], next: 'END' },
      guarded: { who: 'finch', text: 'I said what I had to say outside.', next: 'ghub' },
      ghub: { choices: [
        { text: 'I was hard on you out there. It\'s been a long road.', next: 'g_apol' },
        { text: 'Then I\'ll find out the rest myself.', next: 'g_cold' },
      ] },
      g_apol: { who: 'note', text: 'He looks at the fire a long moment.', next: 'g_apol2' },
      g_apol2: { who: 'finch', text: 'Hale kept late hours at the office, before he went. That\'s all.', do: [{ evidence: 'T_FINCH_LATE' }, { set: { finchParlorDone: true } }, { char: { finch: { trust: 'WARY' } } }], next: 'END' },
      g_cold: { who: 'finch', text: 'You do that.', do: [{ set: { finchParlorDone: true } }, { char: { finch: { trust: 'COLD' } } }], next: 'END' },
      repeat: { who: 'finch', text: 'Get some sleep, Mister Vance. If anyone in this town can.', next: 'END' },
    },
  },

  GABLE: {
    start: 'start',
    nodes: {
      start: { branch: [{ if: { notFlag: 'hasRoom4Key' }, next: 'intro' }, { next: 'hub' }] },
      intro: { who: 'gable', text: 'We don\'t see travellers this time of year.', next: 'intro2' },
      intro2: { who: 'note', text: 'Her eyes go to my coat, and rest a moment where the revolver sits under it.', next: 'intro3' },
      intro3: { who: 'gable', text: 'You\'ll be wanting a room.', next: 'intro4' },
      intro4: { who: 'silas', text: 'For a few nights. Until the pass opens.', next: 'intro5' },
      intro5: { who: 'gable', text: 'Room 4. Top of the stairs, end of the hall. The door\'s bolted at ten, and I don\'t open it after.', do: [{ item: 'ROOM4_KEY' }, { set: { hasRoom4Key: true } }, { log: 'Took Room 4 at the Black Ram Hotel.' }], next: 'hub' },
      hub: { who: 'gable', text: 'Was there something else?', choices: [
        { text: 'Did you know Sheriff Hale?', next: 'hale', once: true },
        { text: 'What can you tell me about Clara Mercer?', next: 'clara', once: true },
        { text: 'Someone scrubbed the floor in Room 4.', next: 'r4', if: { all: [{ evidence: 'HOTEL_ROOM4_BOARDS' }, { notFlag: 'askedGableAboutRoom4' }] } },
        { text: 'Your register shows no one in Room 4.', next: 'reg', if: { all: [{ flag: 'askedGableAboutRoom4' }, { evidence: 'HOTEL_REGISTER' }, { notFlag: 'confrontedGableRegister' }] } },
        { text: 'Goodnight, Mrs. Gable.', next: 'bye' },
      ] },
      hale: { who: 'gable', text: 'Everyone knew the sheriff. He took his supper here, some nights.', next: 'hale2' },
      hale2: { who: 'gable', text: 'What he did after supper was his business.', do: [{ evidence: 'T_GABLE_HALE' }], next: 'hub' },
      clara: { who: 'note', text: 'Her hand stops on the register.', next: 'clara2' },
      clara2: { who: 'gable', text: 'Miss Mercer is a Mercer, Mister Vance. I don\'t discuss the Mercers in my parlor.', do: [{ evidence: 'T_GABLE_CLARA' }], next: 'hub' },
      r4: { who: 'note', text: 'How to put it to her?', choices: [
        { text: 'Ask her plainly what happened.', next: 'r4_plain' },
        { text: 'Say nothing. Let her fill the silence.', next: 'r4_wait' },
      ] },
      r4_plain: { who: 'silas', text: 'What happened in that room?', next: 'r4_plain2' },
      r4_plain2: { who: 'gable', text: 'A guest took ill. I clean my rooms, Mister Vance.', next: 'r4_plain3' },
      r4_plain3: { who: 'gable', text: 'Is the room not to your liking?', do: [{ evidence: 'T_GABLE_ROOM4' }, { set: { askedGableAboutRoom4: true } }], next: 'hub' },
      r4_wait: { who: 'note', text: 'I let it sit between us. The fire ticks. She is the first to look away.', next: 'r4_wait2' },
      r4_wait2: { who: 'gable', text: 'A guest took ill. That\'s all it was.', next: 'r4_wait3' },
      r4_wait3: { who: 'note', text: 'She wipes a clean stretch of counter. Twice.', do: [{ evidence: 'T_GABLE_ROOM4' }, { set: { askedGableAboutRoom4: true, gableUneasy: true } }], next: 'hub' },
      reg: { who: 'gable', text: 'Not every guest wants his name in a book, Mister Vance.', next: 'reg2' },
      reg2: { who: 'gable', text: 'Some of them pay for that.', do: [{ evidence: 'T_GABLE_REGISTER' }, { set: { confrontedGableRegister: true } }, { char: { gable: { cooperation: 'COOL' } } }], next: 'reg3' },
      reg3: { who: 'note', text: 'Whatever door that opened, she has already closed it.', next: 'hub' },
      bye: { who: 'gable', text: 'Goodnight. Mind the third stair; it talks.', next: 'END' },
    },
  },

  GABLE_NIGHT: {
    start: 'a',
    nodes: {
      a: { who: 'gable', text: 'You heard it, then.', next: 'b' },
      b: { who: 'silas', text: 'Where did it come from?', next: 'c' },
      c: { who: 'gable', text: 'The mill. Down by the creek.', next: 'd' },
      d: { who: 'gable', text: 'Sound carries along the water. It always sounds closer than it is.', do: [{ evidence: 'T_GABLE_NIGHT' }], next: 'hub' },
      hub: { choices: [
        { text: 'Have you heard a sound like that before?', next: 'before', once: true },
        { text: 'Was it a man\'s voice?', next: 'voice', once: true },
        { text: 'What is there at the mill, at this hour?', next: 'mill', once: true },
        { text: 'Someone may need help out there.', next: 'help' },
        { text: 'Go back to bed, Mrs. Gable.', next: 'bed' },
      ] },
      before: { who: 'note', text: 'The candle flame shakes, once.', next: 'before2' },
      before2: { who: 'gable', text: 'The wind makes all kinds of sounds up here.', next: 'hub' },
      voice: { who: 'gable', text: 'It went on too long for a man that\'s hurt.', next: 'voice2' },
      voice2: { who: 'gable', text: 'A hurt man stops, Mister Vance. That one kept on.', do: [{ evidence: 'T_GABLE_VOICE' }], next: 'hub' },
      mill: { who: 'gable', text: 'Nothing. Rot and ice. The wheel hasn\'t turned since the silver went.', next: 'mill2' },
      mill2: { who: 'gable', text: 'The race runs in under the wheel. Boys used to dare each other down into the wheel pit. Cold as an icehouse, August or not.', do: [{ evidence: 'T_GABLE_PIT' }, { set: { knowsWheelPit: true } }], next: 'hub' },
      help: { who: 'gable', text: 'Then go, if you\'re going. I\'ll not wait up, and I\'ll not go with you.', next: 'help2' },
      help2: { who: 'note', text: 'She draws back the bolt on the front door and steps away from it.', do: [{ set: { gableUnbolted: true } }], next: 'END' },
      bed: { who: 'gable', text: 'I intend to.', next: 'bed2' },
      bed2: { who: 'note', text: 'All the same, she draws back the bolt for me before she goes up.', do: [{ set: { gableUnbolted: true } }], next: 'END' },
    },
  },

  GABLE_NIGHT_AGAIN: {
    start: 'a',
    nodes: {
      a: { who: 'gable', text: 'The door\'s open, Mister Vance. Go, if you\'re going.', choices: [
        { text: 'Was it a man\'s voice?', next: 'voice', if: { noEvidence: 'T_GABLE_VOICE' } },
        { text: 'What is there at the mill, at this hour?', next: 'mill', if: { noEvidence: 'T_GABLE_PIT' } },
        { text: 'I\'m going.', next: 'END' },
      ] },
      voice: { who: 'gable', text: 'It went on too long for a man that\'s hurt. A hurt man stops, Mister Vance. That one kept on.', do: [{ evidence: 'T_GABLE_VOICE' }], next: 'a' },
      mill: { who: 'gable', text: 'Rot and ice. The race runs in under the wheel. Boys used to dare each other down into the wheel pit. Cold as an icehouse, August or not.', do: [{ evidence: 'T_GABLE_PIT' }, { set: { knowsWheelPit: true } }], next: 'a' },
    },
  },

  BED: {
    start: 'start',
    nodes: {
      start: { branch: [{ if: { phase: 'NIGHT' }, next: 'night' }, { if: { phase: 'DAY' }, next: 'day' }, { next: 'a' }] },
      day: { who: 'note', text: 'The bed is made, tight as a drum. No sleep now; there is daylight to use, and not much of it.', next: 'END' },
      a: { who: 'note', text: 'The storm leans on the window. Nothing more will happen tonight that I can do anything about.', choices: [
        { text: 'Turn in for the night.', next: 'sleep' },
        { text: 'Not yet.', next: 'END' },
      ] },
      sleep: { do: [{ script: 'NIGHT_0215' }], next: 'END' },
      night: { who: 'note', text: 'No sleeping now. Whatever that was, it came from outside.', next: 'END' },
    },
  },
};

// ---------------- Aftermath of the Hale case ----------------
// Played over black at first light, after Silas leaves the mill (SLICE_END → { aftermath: 'HALE' }). One per conclusion
// (data/caseData.js) plus AFTER_OPEN for leaving it undecided. Each shows what Silas's conclusion sets in motion.
Object.assign(DIALOGUE, {
  // At the footbridge, on the way back up (SLICE_END → { casePrompt: 'HALE' }). The cutscene reads _leaveChoice.
  CASE_PROMPT: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: '_caseDecidable' }, next: 'ready' }, { next: 'unready' }] },
    ready: { who: 'note', text: 'Before I climb back up, I should settle what I believe happened here. Finch will ask.', choices: [
      { text: 'Settle it now. [Review the case]', next: 'review' },
      { text: 'Not yet. I\'ll go through my notebook first.', next: 'notebook' },
      { text: 'Go back up and leave it open.', next: 'open' },
    ] },
    unready: { who: 'note', text: 'Finch will ask what I make of this, and I have not yet worked out what happened here.', choices: [
      { text: 'Go through my notebook first.', next: 'notebook' },
      { text: 'Go back up and leave it open.', next: 'open' },
    ] },
    review: { do: [{ set: { _leaveChoice: 'review' } }], next: 'END' },
    notebook: { do: [{ set: { _leaveChoice: 'notebook' } }], next: 'END' },
    open: { do: [{ set: { _leaveChoice: 'open' } }], next: 'END' },
  } },
  AFTER_STAGED: { start: 'a', nodes: {
    a: { who: 'note', text: 'Grey light. Finch is waiting at the top of the creek path, his hat in his hands.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'He has been dead since the night he went out. Someone kept him in the cold, and hung him up tonight for whoever came running at that scream.', next: 'd' },
    d: { who: 'finch', text: '...For you, then. Or for me.', next: 'e' },
    e: { who: 'silas', text: 'Keep the mill shut and keep him covered. If they ask, tell them a man did this. Not a ghost, and not an Order.', next: 'f' },
    f: { who: 'finch', text: 'They won\'t like that better.', next: 'g' },
    g: { who: 'finch', text: 'But they\'ll hear it from me.', next: 'END' },
  } },
  AFTER_TONIGHT: { start: 'a', nodes: {
    a: { who: 'note', text: 'Grey light. Finch is waiting at the top of the creek path, his hat in his hands.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'He was killed at the mill at a quarter past two. That was his scream. Whoever did it went off along the creek.', next: 'd' },
    d: { who: 'finch', text: 'Then he\'s close. Nobody gets far in this.', next: 'e' },
    e: { who: 'note', text: 'He is gone before I can say anything more, shouting for men and lanterns.', next: 'END' },
  } },
  AFTER_RITE: { start: 'a', nodes: {
    a: { who: 'note', text: 'Grey light. Finch is waiting at the top of the creek path, his hat in his hands.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'Bled, and hung, and the Order\'s mark cut beside him. Somebody wants it known whose work this is.', next: 'd' },
    d: { who: 'finch', text: '...Then it\'s true. What they say.', next: 'e' },
    e: { who: 'note', text: 'He says it quietly. By noon the whole town will be saying it, and saying who told them.', next: 'END' },
  } },
  AFTER_OPEN: { start: 'a', nodes: {
    a: { who: 'note', text: 'Grey light. Finch is waiting at the top of the creek path, his hat in his hands.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'Not yet. I don\'t know enough to say it out loud.', next: 'd' },
    d: { who: 'finch', text: 'The town won\'t wait for you, Mister Vance.', next: 'END' },
  } },
});

// ======================= Chapter 2: the second day =======================
// Who Silas talks to on the second day, and how the first night's outcome colours it: the town frightened by the Order
// story he gave Finch (townFrightened), the mill yard trodden by Finch's search (millSearched), the mill kept shut and
// the town told "a man did this" (millKeptClosed), or nothing said at all. Finch's trust (STEADY / WARY / GUARDED / COLD)
// decides how much he gives.
Object.assign(DIALOGUE, {
  CH2_OPEN: { start: 'a', nodes: {
    a: { who: 'note', text: 'Finch went off up the street with his hat still in his hands. The town is awake, after a fashion: smoke from the chimneys, and nobody on the street who doesn\'t have to be.', next: 'b' },
    b: { branch: [
      { if: { flag: 'townFrightened' }, next: 'frightened' },
      { if: { flag: 'millSearched' }, next: 'searched' },
      { if: { flag: 'millKeptClosed' }, next: 'closed' },
      { next: 'open' },
    ] },
    frightened: { who: 'silas', text: 'By now the whole town has heard what I told Finch. I\'ll be lucky if anyone opens a door to me.', next: 'c' },
    searched: { who: 'silas', text: 'Finch\'s men will be coming down off the ridge about now, cold and empty-handed.', next: 'c' },
    closed: { who: 'silas', text: 'Finch has the mill shut. Whoever dressed that scene will be wondering why the town didn\'t scream back.', next: 'c' },
    open: { who: 'silas', text: 'I gave Finch nothing to tell them. They\'ll have made up their own story by noon.', next: 'c' },
    c: { who: 'silas', text: 'Somebody here bought new rope, and somebody knows the Order\'s old books. A store keeps accounts.', next: 'END' },
  } },

  FINCH_DAY: { start: 'start', nodes: {
    start: { branch: [{ if: { trust: { finch: 'COLD' } }, next: 'cold' }, { next: 'a' }] },
    cold: { who: 'finch', text: 'I\'ve a town to keep quiet, Mister Vance. You\'ve not made it easier.', again: 'I\'ve nothing for you.', next: 'END' },
    a: { who: 'finch', text: 'Mister Vance. Did you sleep?', again: 'Something else?', next: 'hub' },
    hub: { choices: [
      { text: 'What did Hale have on him, the night he went out?', next: 'hale', once: true },
      { text: 'Who in this town wears riding boots?', next: 'boots', once: true, if: { evidence: 'SAWMILL_BOOTPRINTS' } },
      { text: 'Who keeps the telegraph?', next: 'wire', once: true },
      { text: 'Where does the lane by the woodshed go?', next: 'lane', once: true },
      { text: 'That\'ll do.', next: 'bye' },
    ] },
    hale: { branch: [{ if: { trust: { finch: 'STEADY' } }, next: 'hale_s' }, { next: 'hale_w' }] },
    hale_s: { who: 'finch', text: 'His coat, his gun, his star. And a freight bill, folded small in the coat. Rusk\'s store. I didn\'t think anything of it till now.', do: [{ evidence: 'T_FINCH_FREIGHT' }], next: 'hub' },
    hale_w: { who: 'finch', text: 'His coat, his gun, his star. Nothing worth your asking.', next: 'hale_w2' },
    hale_w2: { who: 'note', text: 'He says it to the snow, not to me.', next: 'hub' },
    boots: { who: 'finch', text: 'Half the old men who came up here after the war. They don\'t ride much now. They keep the boots.', do: [{ evidence: 'T_FINCH_BOOTS' }], next: 'hub' },
    wire: { who: 'finch', text: 'Ada Bell, down at the station. Line\'s been dead since the storm. She went up to the tower this morning to see why.', do: [{ set: { knowsAda: true } }], next: 'hub' },
    lane: { who: 'finch', text: 'Up to the chapel and the graves. Past them the path follows the wire up the ridge. The Reverend will be about.', do: [{ set: { knowsLane: true } }], next: 'hub' },
    bye: { who: 'finch', text: 'Watch yourself.', next: 'END' },
  } },

  GABLE_DAY: { start: 'a', nodes: {
    a: { who: 'gable', text: 'You didn\'t sleep.', again: 'Mister Vance.', next: 'hub' },
    hub: { choices: [
      { text: 'What does the Reverend preach, this time of year?', next: 'vale', once: true },
      { text: 'What lies up past the chapel?', next: 'up', once: true },
      { text: 'Who buys at Rusk\'s after dark?', next: 'rusk', once: true, if: { evidence: 'T_RUSK_FREIGHT' } },
      { text: 'Nothing. Good day.', next: 'bye' },
    ] },
    vale: { who: 'gable', text: 'The Pale Figure. Every winter, when the snow shuts the pass. It fills his pews.', do: [{ evidence: 'T_GABLE_VALE' }], next: 'hub' },
    up: { who: 'gable', text: 'The graves, then the wire, then the ridge. Then the old workings, and nobody goes up there. Nobody sensible.', next: 'hub' },
    rusk: { who: 'gable', text: 'Anybody who\'d rather not be seen buying. Jonah keeps a back door, same as I keep a register.', next: 'rusk2' },
    rusk2: { who: 'note', text: 'She hears what she has said a moment after I do.', next: 'hub' },
    bye: { who: 'gable', text: 'Supper\'s at six, if you\'re still with us.', next: 'END' },
  } },

  RUSK: { start: 'start', nodes: {
    start: { branch: [{ if: { all: [{ flag: 'townFrightened' }, { notFlag: 'ruskWarmed' }] }, next: 'frightened' }, { next: 'a' }] },
    frightened: { who: 'rusk', text: 'You\'re the one told Finch it was the Order. Now my customers buy candles and bolt their doors.', next: 'f_hub' },
    f_hub: { choices: [
      { text: 'Then you want this settled as much as I do.', next: 'f_warm' },
      { text: 'I said what I saw.', next: 'f_cold' },
    ] },
    f_warm: { who: 'rusk', text: '...Settled. Hm. Ask, then.', do: [{ set: { ruskWarmed: true } }, { char: { rusk: { trust: 'WARY' } } }], next: 'hub' },
    f_cold: { who: 'rusk', text: 'Then go and see it somewhere else.', next: 'END' },
    a: { who: 'rusk', text: 'Store\'s open. Don\'t touch what you won\'t buy.', again: 'Still here?', next: 'hub' },
    hub: { choices: [
      { text: 'Your last freight. What was on it?', next: 'freight', once: true, if: { evidence: 'STORE_LEDGER' } },
      { text: 'The book says lamp oil. Your barrels are empty.', next: 'oil', once: true, if: { all: [{ evidence: 'T_RUSK_FREIGHT' }, { evidence: 'STORE_OIL' }, { examined: 'STORE_LEDGER' }] } },
      { text: 'Did Sheriff Hale ask you about it?', next: 'hale', once: true, if: { evidence: 'T_RUSK_FREIGHT' } },
      { text: 'Do you sell riding boots?', next: 'boots', once: true, if: { evidence: 'SAWMILL_BOOTPRINTS' } },
      { text: 'What was in the long crate?', next: 'crate', once: true, if: { examined: 'STORE_CRATE' } },
      { text: 'That\'s all.', next: 'bye' },
    ] },
    freight: { who: 'rusk', text: 'Freight\'s freight. I write what the waybill says. What was on it was paid in coin and fetched after dark, and I don\'t ask men their business.', do: [{ evidence: 'T_RUSK_FREIGHT' }], next: 'hub' },
    oil: { who: 'rusk', text: '...Then somebody burned a deal of lamp oil.', next: 'oil2' },
    oil2: { who: 'silas', text: 'Or never bought any.', next: 'oil3' },
    oil3: { who: 'rusk', text: 'I scraped nothing. The page came to me like that, or it got that way after. I keep the book on the counter, Mister Vance. Anybody can lean on a counter.', do: [{ evidence: 'T_RUSK_SCRAPED' }], next: 'hub' },
    hale: { who: 'rusk', text: 'A fortnight back he was in here reading my freight book like scripture. Asked about that same freight. I told him what I\'m telling you.', do: [{ evidence: 'T_RUSK_HALE' }], next: 'hale2' },
    hale2: { who: 'note', text: 'And a fortnight later Hale was dead. Rusk has done that sum too.', next: 'hub' },
    boots: { who: 'rusk', text: 'No call for them. The old troopers brought their own up from the war, and they keep them oiled.', next: 'hub' },
    crate: { who: 'rusk', text: 'Kindling, now. It came up empty, far as I know. Crates do.', next: 'crate2' },
    crate2: { who: 'note', text: 'Crates do not come up the mountain empty. Freight costs by the pound.', next: 'hub' },
    bye: { who: 'rusk', text: 'Shut the door behind you. Heat costs money.', next: 'END' },
  } },

  VALE: { start: 'start', nodes: {
    start: { branch: [
      { if: { seen: 'VALE.hub' }, next: 'again' },
      { if: { flag: 'townFrightened' }, next: 'frightened' },
      { if: { flag: 'millKeptClosed' }, next: 'closed' },
      { if: { flag: 'millSearched' }, next: 'searched' },
      { next: 'open' },
    ] },
    again: { who: 'vale', text: 'Mister Vance.', next: 'hub' },
    frightened: { who: 'vale', text: 'Mister Vance. The whole town has your words by heart: the Order took him. You saw it with your own eyes, they say. You\'ll find my door open to you.', next: 'hub' },
    closed: { who: 'vale', text: 'Constable Finch tells the town a man did this. On your word, I hear. A comfortable thing to tell frightened people.', next: 'hub' },
    searched: { who: 'vale', text: 'Six men tramped the creek all night after a murderer, I hear. They found snow.', next: 'hub' },
    open: { who: 'vale', text: 'You are the man from the Black Ram. The one who found him.', next: 'hub' },
    hub: { who: 'vale', choices: [
      { text: 'Tell me about the Pale Figure.', next: 'figure', once: true },
      { text: 'Who was Amos Pell?', next: 'pell', once: true, if: { evidence: 'GRAVE_STONE' } },
      { text: 'One of your graves has been opened.', next: 'grave', once: true, if: { evidence: 'GRAVE_DISTURBED' } },
      { text: 'Good day, Reverend.', next: 'bye' },
    ] },
    figure: { who: 'vale', text: 'It walks the ridge in the white months, Mister Vance. It carries a lamp. Those who follow it up to the old workings do not come down again.', do: [{ evidence: 'T_VALE_FIGURE' }], next: 'figure2' },
    figure2: { branch: [{ if: { flag: 'ridgeLightSeen' }, next: 'figure3' }, { next: 'hub' }] },
    figure3: { who: 'silas', text: 'I saw a lamp on the ridge last night.', next: 'figure4' },
    figure4: { who: 'vale', text: 'Then you have been warned, and that is more than most are given.', next: 'hub' },
    pell: { who: 'vale', text: 'A miner. The Pale workings fell in on him and four others in seventy-two. The Order paid for his stone. It paid for a great many things, then.', do: [{ evidence: 'T_VALE_ORDER' }], next: 'hub' },
    grave: { who: 'vale', text: 'Dogs dig, in a hard winter. I keep the ground, Mister Vance, not the graves.', next: 'grave2' },
    grave2: { who: 'silas', text: 'Dogs don\'t put the boards back.', next: 'grave3' },
    grave3: { who: 'vale', text: 'Then pray for whoever did.', do: [{ evidence: 'T_VALE_PELL' }], next: 'hub' },
    bye: { who: 'vale', text: 'Keep off the ridge, Mister Vance. The town has buried enough this winter.', next: 'END' },
  } },

  ADA: { start: 'start', nodes: {
    start: { branch: [{ if: { seen: 'ADA.hub' }, next: 'again' }, { next: 'a' }] },
    again: { who: 'ada', text: 'Mister Vance.', next: 'hub' },
    a: { who: 'ada', text: 'You\'ll be the man Constable Finch sent for.', next: 'a2' },
    a2: { who: 'note', text: 'She says "Finch sent for" carefully, the way you step on ice.', next: 'hub' },
    hub: { who: 'ada', choices: [
      { text: 'When did the line go dead?', next: 'line', once: true },
      { text: 'Can you mend it?', next: 'mend', once: true, if: { evidence: 'T_ADA_LINE' } },
      { text: 'You sent my telegram.', next: 'tel', once: true, if: { evidence: 'T_ADA_LINE' } },
      { text: 'Go home, Miss Bell. It isn\'t safe up here.', next: 'home', once: true },
      { text: 'That\'s all.', next: 'bye' },
    ] },
    line: { who: 'ada', text: 'Six o\'clock, the evening you came. I had a message half sent to the county seat. Nothing since.', next: 'line2' },
    line2: { who: 'ada', text: 'I came up to splice it. The next stretch is down too, along the ridge. Somebody walked the line with cutters.', do: [{ evidence: 'T_ADA_LINE' }], next: 'hub' },
    mend: { who: 'ada', text: 'This span, yes. A mile of it along the ridge, in this, no. We\'re shut in, Mister Vance, till the pass opens or somebody walks the line.', do: [{ evidence: 'T_ADA_MEND' }], next: 'hub' },
    tel: { who: 'ada', text: 'I send what\'s handed in, and I write down who hands it in.', next: 'tel2' },
    tel2: { who: 'silas', text: 'Who handed in mine?', next: 'tel3' },
    tel3: { who: 'ada', text: 'Not up here. Not with the line down and nobody to send for.', do: [{ evidence: 'T_ADA_TELEGRAM' }, { set: { adaKnowsSender: true } }], next: 'tel4' },
    tel4: { who: 'note', text: 'She looks down the hill toward the town, not at me.', next: 'hub' },
    home: { who: 'ada', text: 'Neither is the station.', do: [{ set: { adaWarned: true } }], next: 'hub' },
    bye: { who: 'ada', text: 'If the line comes back, Mister Vance, I\'ll know it before anyone.', next: 'END' },
  } },

  CASE_PROMPT_ORDER: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: '_caseDecidable' }, next: 'ready' }, { next: 'unready' }] },
    ready: { who: 'note', text: 'The light is going, and Finch will be inside with his supper and his questions. Before I go in, I should settle what I make of today.', choices: [
      { text: 'Settle it now. [Review the case]', next: 'review' },
      { text: 'Not yet. I\'ll go through my notebook first.', next: 'notebook' },
      { text: 'Go in and keep it to myself.', next: 'open' },
    ] },
    unready: { who: 'note', text: 'Finch will ask what I found today, and I have not yet worked out what it adds up to.', choices: [
      { text: 'Go through my notebook first.', next: 'notebook' },
      { text: 'Go in and keep it to myself.', next: 'open' },
    ] },
    review: { do: [{ set: { _leaveChoice: 'review' } }], next: 'END' },
    notebook: { do: [{ set: { _leaveChoice: 'notebook' } }], next: 'END' },
    open: { do: [{ set: { _leaveChoice: 'open' } }], next: 'END' },
  } },

  AFTER2_BLAST: { start: 'a', nodes: {
    a: { who: 'note', text: 'The parlor, the lamps lit. Finch at the corner table with his coat still on and his supper going cold.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'Somebody bought dynamite on Rusk\'s freight and buried it in Amos Pell\'s grave. The wire was cut to keep us shut in until they\'ve used it.', next: 'd' },
    d: { who: 'finch', text: 'Used it on what?', next: 'e' },
    e: { who: 'silas', text: 'The old workings. Whatever is in them.', next: 'f' },
    f: { branch: [{ if: { trust: { finch: 'COLD' } }, next: 'cold' }, { next: 'g' }] },
    cold: { who: 'finch', text: 'And why should I believe you now?', next: 'cold2' },
    cold2: { who: 'silas', text: 'Because I\'m not asking you to do anything. Leave the grave as it is. Let them come back for it.', next: 'h' },
    g: { who: 'finch', text: 'I\'ll have that grave dug out tonight.', next: 'g2' },
    g2: { who: 'silas', text: 'Don\'t. Leave it as it is, and let them come back for it.', next: 'h' },
    h: { who: 'finch', text: '...And when they do?', next: 'i' },
    i: { who: 'silas', text: 'Then we\'ll know who they are.', next: 'END' },
  } },
  AFTER2_WAR: { start: 'a', nodes: {
    a: { who: 'note', text: 'The parlor, the lamps lit. Finch at the corner table with his coat still on and his supper going cold.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'There\'s a war cache in Amos Pell\'s grave. Old powder in an old trooper\'s jacket. Somebody guards it, and cut the wire so nobody hears about Hale.', next: 'd' },
    d: { who: 'finch', text: 'War stores. Up here.', next: 'e' },
    e: { who: 'finch', text: 'Then I\'ll have it out of the ground before it takes somebody\'s hand off.', next: 'f' },
    f: { who: 'note', text: 'By the time the pie came, he had four men and a wagon.', next: 'END' },
  } },
  AFTER2_RITE: { start: 'a', nodes: {
    a: { who: 'note', text: 'The parlor, the lamps lit. Finch at the corner table with his coat still on and his supper going cold.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'The Order is buying powder for whatever it means to do on that ridge, and its lamp keeps watch over the valley.', next: 'd' },
    d: { who: 'finch', text: 'You\'d best not say that where the Reverend can hear it.', next: 'e' },
    e: { who: 'note', text: 'At a quarter past six the chapel bell began to ring. The Reverend had heard it anyway.', next: 'END' },
  } },
  AFTER2_OPEN: { start: 'a', nodes: {
    a: { who: 'note', text: 'The parlor, the lamps lit. Finch at the corner table with his coat still on and his supper going cold.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'Snow. A dead wire. A storekeeper who doesn\'t ask questions.', next: 'd' },
    d: { who: 'finch', text: 'That\'s not much.', next: 'e' },
    e: { who: 'silas', text: 'No.', next: 'END' },
  } },
});

export const SPEAKERS = {
  silas: 'SILAS VANCE', finch: 'CONSTABLE FINCH', gable: 'MRS. GABLE', conductor: 'CONDUCTOR', note: null,
  rusk: 'JONAH RUSK', vale: 'REVEREND VALE', ada: 'ADA BELL',
};
