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
      start: { branch: [{ if: { flag: 'ch3Night' }, next: 'ch3' }, { if: { phase: 'NIGHT' }, next: 'night' }, { if: { phase: 'DAY' }, next: 'day' }, { next: 'a' }] },
      ch3: { who: 'note', text: 'Not tonight. Whoever wrote that note knows I have it. I\'ll sit up downstairs, by the fire and the stair.', next: 'END' },
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
    c: { who: 'silas', text: 'New hemp on a dead man, and old books on a dead fire. Somebody in this town paid for that rope.', next: 'END' },
  } },

  FINCH_DAY: { start: 'start', nodes: {
    start: { branch: [{ if: { trust: { finch: 'COLD' } }, next: 'cold' }, { next: 'a' }] },
    cold: { who: 'finch', text: 'I\'ve a town to keep quiet, Mister Vance. You\'ve not made it easier.', again: 'I\'ve nothing for you.', next: 'END' },
    a: { who: 'finch', text: 'Mister Vance. Did you sleep?', again: 'Something else?', next: 'hub' },
    hub: { choices: [
      { text: 'Not much. Did you?', next: 'sleep', once: true },
      { text: 'What did Hale have on him, the night he went out?', next: 'hale', once: true },
      { text: 'Who in this town wears riding boots?', next: 'boots', once: true, if: { evidence: 'SAWMILL_BOOTPRINTS' } },
      { text: 'Who keeps the telegraph?', next: 'wire', once: true },
      { text: 'Where does the lane by the woodshed go?', next: 'lane', once: true },
      { text: 'That\'ll do.', next: 'bye' },
    ] },
    sleep: { who: 'finch', text: 'I sat up with him. At the jail. Somebody ought to.', next: 'sleep2' },
    sleep2: { who: 'note', text: 'He has not shaved, and his collar is the one he wore at the mill.', next: 'hub' },
    hale: { branch: [{ if: { trust: { finch: 'STEADY' } }, next: 'hale_s' }, { next: 'hale_w' }] },
    hale_s: { who: 'finch', text: 'His coat, his gun, his star. And a freight bill, folded small in the coat. Rusk\'s store. I didn\'t think anything of it till now.', do: [{ evidence: 'T_FINCH_FREIGHT' }], next: 'hub' },
    hale_w: { who: 'finch', text: 'His coat, his gun, his star. Nothing worth your asking.', next: 'hale_w2' },
    hale_w2: { who: 'note', text: 'He says it to the snow, not to me.', next: 'hub' },
    boots: { who: 'finch', text: 'Half the old men who came up here after the war. They don\'t ride much now. They keep the boots.', do: [{ evidence: 'T_FINCH_BOOTS' }], next: 'hub' },
    wire: { who: 'finch', text: 'Ada Bell, down at the station. Line\'s been dead since the storm. She went up to the tower this morning to see why.', do: [{ set: { knowsAda: true } }], next: 'hub' },
    lane: { who: 'finch', text: 'Up to the chapel and the graves. Past them the path follows the wire up the ridge. The Reverend will be about.', do: [{ set: { knowsLane: true } }], next: 'hub' },
    bye: { who: 'finch', text: 'Watch yourself.', next: 'END' },
  } },

  GABLE_DAY: { start: 'start', nodes: {
    start: { branch: [{ if: { flag: 'ch4Started' }, next: 'g4' }, { next: 'a' }] },
    a: { who: 'gable', text: 'You didn\'t sleep.', again: 'Mister Vance.', next: 'hub' },
    hub: { choices: [
      { text: 'What does the Reverend preach, this time of year?', next: 'vale', once: true },
      { text: 'What lies up past the chapel?', next: 'up', once: true },
      { text: 'Who buys at Rusk\'s after dark?', next: 'rusk', once: true, if: { evidence: 'T_RUSK_FREIGHT' } },
      { text: 'Somebody laid a rug in my room.', next: 'rug', once: true, if: { evidence: 'ROOM4_RUG' } },
      { text: '[Show her something from my notebook]', present: { q: 'Q_ROOM4', wrong: 'showNo', accept: [
        { clue: 'S3_BUTTON', next: 'showBtn', if: { noEvidence: 'T3_GABLE_STAIR' } },
        { clue: 'S3_STAIR', next: 'showStair', if: { all: [{ examined: 'EV3_PANEL' }, { evidence: 'EV3_BUTTON' }] }, else: 'stairNotYet' },
      ] } },
      { text: 'Who was she?', next: 'who', once: true, if: { evidence: 'T3_GABLE_STAIR' } },
      { text: 'Whose glove is this? [Show it]', next: 'glove', once: true, if: { evidence: 'EV3_GLOVE' } },
      { text: 'Nothing. Good day.', next: 'bye' },
    ] },
    rug: { who: 'gable', text: 'The floors are cold in the mornings, Mister Vance.', next: 'rug2' },
    rug2: { who: 'note', text: 'She turns a page of the register she has already read.', do: [{ set: { askedGableRug: true } }], next: 'hub' },
    // shown from the notebook
    showBtn: { who: 'silas', text: 'This was under the bed in Room 4.', next: 'btn' },
    showStair: { who: 'silas', text: 'Your wardrobe has a back to it.', next: 'stair' },
    stairNotYet: { who: 'note', text: 'Not yet. I would want something of whoever used that stair before I put it to her.', next: 'hub' },
    showNo: { who: 'gable', text: 'I keep a hotel, Mister Vance, not a lost-property office.', next: 'hub' },
    btn: { who: 'gable', text: 'Buttons come off, Mister Vance. Coats come through my rooms.', next: 'btn2' },
    btn2: { who: 'note', text: 'She doesn\'t ask whose.', next: 'hub' },
    stair: { who: 'note', text: 'She sets the pen down. For a while she looks at the door to the kitchen passage, not at me.', next: 'stair2' },
    stair2: { who: 'gable', text: 'He came up the back stair. The way he\'d been coming to see her.', next: 'stair3' },
    stair3: { who: 'silas', text: 'Her.', next: 'stair4' },
    stair4: { who: 'gable', text: 'Then another tread after his, heavier. I heard him say a name I didn\'t know, and then nothing for a long while. I didn\'t open my door, Mister Vance. I have a hotel to keep.', next: 'stair5' },
    stair5: { who: 'gable', text: 'In the morning this was under it.', do: [{ evidence: 'T3_GABLE_STAIR' }, { evidence: 'EV3_NOTE' }, { item: 'GABLE_NOTE' }, { log: 'Mrs. Gable told me about the back stair, and gave me the note.' }], next: 'stair6' },
    stair6: { who: 'note', text: 'Block capitals on a torn half-sheet. She has kept it folded small, the way you keep a thing you mean to burn.', next: 'hub' },
    who: { who: 'gable', text: 'She paid me not to write her name. She paid in more than money.', next: 'who2' },
    who2: { who: 'note', text: 'That is all I will get. She has said it before, to herself.', next: 'hub' },
    glove: { who: 'gable', text: 'Put that away, Mister Vance.', next: 'glove2' },
    glove2: { who: 'note', text: 'Not angry. Frightened, and not for herself.', next: 'glove3' },
    glove3: { who: 'gable', text: 'Please.', do: [{ set: { gableGlove: true } }], next: 'hub' },
    vale: { who: 'gable', text: 'The Pale Figure. Every winter, when the snow shuts the pass. It fills his pews.', do: [{ evidence: 'T_GABLE_VALE' }], next: 'hub' },
    up: { who: 'gable', text: 'The graves, then the wire, then the ridge. Then the old workings, and nobody goes up there. Nobody sensible.', next: 'hub' },
    rusk: { who: 'gable', text: 'Anybody who\'d rather not be seen buying. Jonah keeps a back door, same as I keep a register.', next: 'rusk2' },
    rusk2: { who: 'note', text: 'She hears what she has said a moment after I do.', next: 'hub' },
    bye: { who: 'gable', text: 'Supper\'s at six, if you\'re still with us.', next: 'END' },
  } },

  RUSK: { start: 'start', nodes: {
    start: { branch: [{ if: { flag: 'ch4Started' }, next: 'r4' }, { if: { all: [{ flag: 'townFrightened' }, { notFlag: 'ruskWarmed' }] }, next: 'frightened' }, { next: 'a' }] },
    frightened: { who: 'rusk', text: 'You\'re the one told Finch it was the Order. Now my customers buy candles and bolt their doors.', next: 'f_hub' },
    f_hub: { choices: [
      { text: 'Then you want this settled as much as I do.', next: 'f_warm' },
      { text: 'I said what I saw.', next: 'f_cold' },
    ] },
    f_warm: { who: 'rusk', text: '...Settled. Hm. Ask, then.', do: [{ set: { ruskWarmed: true } }, { char: { rusk: { trust: 'WARY' } } }], next: 'hub' },
    f_cold: { who: 'rusk', text: 'Then go and see it somewhere else.', next: 'END' },
    a: { who: 'rusk', text: 'Store\'s open. Don\'t touch what you won\'t buy.', again: 'Still here?', next: 'hub' },
    hub: { choices: [
      { text: 'Quiet morning.', next: 'quiet', once: true },
      { text: 'Your last freight. What was on it?', next: 'freight', once: true, if: { evidence: 'STORE_LEDGER' } },
      { text: 'The book says lamp oil. Your barrels are empty.', next: 'oil', once: true, if: { all: [{ evidence: 'T_RUSK_FREIGHT' }, { evidence: 'STORE_OIL' }, { examined: 'STORE_LEDGER' }] } },
      { text: 'Did Sheriff Hale ask you about it?', next: 'hale', once: true, if: { evidence: 'T_RUSK_FREIGHT' } },
      { text: 'Do you sell riding boots?', next: 'boots', once: true, if: { evidence: 'SAWMILL_BOOTPRINTS' } },
      { text: 'What was in the long crate?', next: 'crate', once: true, if: { examined: 'STORE_CRATE' } },
      { text: 'That\'s all.', next: 'bye' },
    ] },
    quiet: { who: 'rusk', text: 'Every morning since the pass shut. They buy flour and salt, and look at the door while I count their change.', next: 'hub' },
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
      { if: { flag: 'ch4Started' }, next: 'v4' },
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
      { text: 'Did the sheriff come to your services?', next: 'hale', once: true },
      { text: 'Who was Amos Pell?', next: 'pell', once: true, if: { evidence: 'GRAVE_STONE' } },
      { text: 'One of your graves has been opened.', next: 'grave', once: true, if: { evidence: 'GRAVE_DISTURBED' } },
      { text: 'Good day, Reverend.', next: 'bye' },
    ] },
    figure: { who: 'vale', text: 'It walks the ridge in the white months, Mister Vance. It carries a lamp. Those who follow it up to the old workings do not come down again.', do: [{ evidence: 'T_VALE_FIGURE' }], next: 'figure2' },
    figure2: { branch: [{ if: { flag: 'ridgeLightSeen' }, next: 'figure3' }, { next: 'hub' }] },
    figure3: { who: 'silas', text: 'I saw a lamp on the ridge last night.', next: 'figure4' },
    figure4: { who: 'vale', text: 'Then you have been warned, and that is more than most are given.', next: 'hub' },
    hale: { who: 'vale', text: 'At the back, when he came at all. Always the last pew, by the door.', next: 'hub' },
    pell: { who: 'vale', text: 'A miner. The Pale workings fell in on him and four others in seventy-two. The Order paid for his stone. It paid for a great many things, then.', do: [{ evidence: 'T_VALE_ORDER' }], next: 'hub' },
    grave: { who: 'vale', text: 'Dogs dig, in a hard winter. I keep the ground, Mister Vance, not the graves.', next: 'grave2' },
    grave2: { who: 'silas', text: 'Dogs don\'t put the boards back.', next: 'grave3' },
    grave3: { who: 'vale', text: 'Then pray for whoever did.', do: [{ evidence: 'T_VALE_PELL' }], next: 'hub' },
    bye: { who: 'vale', text: 'Keep off the ridge, Mister Vance. The town has buried enough this winter.', next: 'END' },
  } },

  ADA: { start: 'start', nodes: {
    start: { branch: [{ if: { flag: 'ch4Started' }, next: 'd4' }, { if: { seen: 'ADA.hub' }, next: 'again' }, { next: 'a' }] },
    again: { who: 'ada', text: 'Mister Vance.', next: 'hub' },
    a: { who: 'ada', text: 'You\'ll be the man Constable Finch sent for.', next: 'a2' },
    a2: { who: 'note', text: 'She says "Finch sent for" carefully, the way you step on ice.', next: 'hub' },
    hub: { who: 'ada', choices: [
      { text: 'Cold work, up here.', next: 'cold', once: true },
      { text: 'When did the line go dead?', next: 'line', once: true },
      { text: 'Can you mend it?', next: 'mend', once: true, if: { evidence: 'T_ADA_LINE' } },
      { text: 'You sent my telegram.', next: 'tel', once: true, if: { evidence: 'T_ADA_LINE' } },
      { text: 'Go home, Miss Bell. It isn\'t safe up here.', next: 'home', once: true },
      { text: 'That\'s all.', next: 'bye' },
    ] },
    cold: { who: 'ada', text: 'Colder at the station, with nothing on the wire. Up here at least I can see what\'s wrong.', next: 'hub' },
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
    a: { who: 'note', text: 'The parlor at dusk, the fire built up. Finch by it with his coat still on and his supper going cold.', next: 'b' },
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
    a: { who: 'note', text: 'The parlor at dusk, the fire built up. Finch by it with his coat still on and his supper going cold.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'There\'s a war cache in Amos Pell\'s grave. Old powder in an old trooper\'s jacket. Somebody guards it, and cut the wire so nobody hears about Hale.', next: 'd' },
    d: { who: 'finch', text: 'War stores. Up here.', next: 'e' },
    e: { who: 'finch', text: 'Then I\'ll have it out of the ground before it takes somebody\'s hand off.', next: 'f' },
    f: { who: 'note', text: 'By the time the pie came, he had four men and a wagon.', next: 'END' },
  } },
  AFTER2_RITE: { start: 'a', nodes: {
    a: { who: 'note', text: 'The parlor at dusk, the fire built up. Finch by it with his coat still on and his supper going cold.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'The Order is buying powder for whatever it means to do on that ridge, and its lamp keeps watch over the valley.', next: 'd' },
    d: { who: 'finch', text: 'You\'d best not say that where the Reverend can hear it.', next: 'e' },
    e: { who: 'note', text: 'At a quarter past six the chapel bell began to ring. The Reverend had heard it anyway.', next: 'END' },
  } },
  AFTER2_OPEN: { start: 'a', nodes: {
    a: { who: 'note', text: 'The parlor at dusk, the fire built up. Finch by it with his coat still on and his supper going cold.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'Snow. A dead wire. A storekeeper who doesn\'t ask questions.', next: 'd' },
    d: { who: 'finch', text: 'That\'s not much.', next: 'e' },
    e: { who: 'silas', text: 'No.', next: 'END' },
  } },
});

// ======================= Chapter 3: the third day and night =======================
Object.assign(DIALOGUE, {
  CH3_OPEN: { start: 'a', nodes: {
    a: { who: 'note', text: 'Morning. I slept, after a fashion, with the chair under the door handle.', next: 'b' },
    b: { who: 'silas', text: 'Hale goes into the ground at noon. Until then he lies at Finch\'s office, at the end of the street.', next: 'END' },
  } },

  FINCH_OFFICE: { start: 'start', nodes: {
    start: { branch: [{ if: { flag: 'ch4Started' }, next: 'f4' }, { if: { seen: 'FINCH_OFFICE.hub' }, next: 'again' }, { if: { trust: { finch: 'COLD' } }, next: 'cold' }, { next: 'a' }] },
    cold: { who: 'finch', text: 'He goes in the ground at noon. Look at him if you must. You will anyway.', next: 'hub' },
    a: { who: 'finch', text: 'You\'ll want to see him. Mind the canvas; I\'ve only the one.', next: 'hub' },
    again: { who: 'finch', text: 'Vance.', next: 'hub' },
    hub: { choices: [
      { text: 'Who brought him here?', next: 'brought', once: true },
      { text: 'Who\'s burying him?', next: 'burial', once: true },
      { text: 'These forms are signed already.', next: 'forms', once: true, if: { evidence: 'EV3_PAD' } },
      { text: 'Number forty-one is missing.', next: 'f41', once: true, if: { all: [{ examined: 'EV3_PAD' }, { seen: 'FINCH_OFFICE.forms' }] } },
      { text: 'Who was at that window, the night I came?', next: 'watch', once: true, if: { flag: 'curtainDrawn' } },
      { text: 'That\'ll do.', next: 'bye' },
    ] },
    brought: { who: 'finch', text: 'Me and Rusk\'s boy, on a door, at first light the day after you came. I\'ve not let anyone else touch him. Not the Reverend, not Mr. Mercer.', next: 'brought2' },
    brought2: { who: 'note', text: 'He looks at the canvas the way a man looks at a debt.', next: 'hub' },
    burial: { who: 'finch', text: 'The Reverend says the words, at noon, up by the chapel. Mr. Mercer\'s paying for the stone. He pays for most things.', next: 'hub' },
    forms: { who: 'finch', text: 'Hale had me sign a pad of them, so the office could wire the county when I was out on the road. Don\'t look at me like that.', do: [{ evidence: 'T3_FINCH_FORMS' }], next: 'forms2' },
    forms2: { who: 'note', text: 'He looks at the pad, and then not at it.', next: 'hub' },
    f41: { who: 'finch', text: '...Then somebody tore it out.', next: 'f412' },
    f412: { who: 'note', text: 'He has known that a while, I think. He has not let himself wonder who.', do: [{ set: { finchForm41: true } }], next: 'hub' },
    watch: { who: 'finch', text: 'Me. Waiting for the train\'s man. I didn\'t know if you\'d be on it, or who else would.', next: 'hub' },
    bye: { who: 'finch', text: 'Noon, Vance.', next: 'END' },
  } },

  MERCER: { start: 'start', nodes: {
    start: { branch: [{ if: { seen: 'MERCER.hub' }, next: 'again' }, { next: 'a' }] },
    again: { who: 'mercer', text: 'Mister Vance.', next: 'hub' },
    a: { who: 'mercer', text: 'Mister Vance. Gideon Mercer.', next: 'a2' },
    a2: { who: 'mercer', text: 'You\'ll be the man looking for my daughter.', next: 'a3' },
    a3: { who: 'note', text: 'A grey greatcoat, white whiskers, a voice used to rooms going quiet for it.', next: 'hub' },
    hub: { who: 'mercer', choices: [
      { text: 'Where would she go?', next: 'clara', once: true },
      { text: 'You knew the sheriff.', next: 'hale', once: true },
      { text: 'The Pale Order.', next: 'order', once: true },
      { text: 'Good day, Mr. Mercer.', next: 'bye' },
    ] },
    clara: { who: 'mercer', text: 'Clara has a temper and a good horse, Mister Vance. She has done this before. She will come home when she is ready, and I would pay a good deal to know where she is meanwhile.', do: [{ evidence: 'T3_MERCER' }], next: 'clara2' },
    clara2: { who: 'note', text: 'He speaks of her as if she were late for supper.', next: 'hub' },
    hale: { who: 'mercer', text: 'Since he was a deputy with no boots. A good man, who didn\'t know when to leave old things alone.', next: 'hub' },
    order: { who: 'mercer', text: 'A mining company, Mister Vance. I lost money in it like everyone else. Ask the Reverend about ghosts. Ask me about debts.', next: 'order2' },
    order2: { who: 'note', text: 'He smiles. It stops below the eyes.', next: 'hub' },
    bye: { who: 'mercer', text: 'Find her, and you\'ll find me grateful. Find anything else, and you\'ll find this a small town.', next: 'END' },
  } },

  CASE_PROMPT_ROOM4: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: '_caseDecidable' }, next: 'ready' }, { next: 'unready' }] },
    ready: { who: 'note', text: 'Finch will be at supper. Before I sit down with him, I should settle what happened in my room.', choices: [
      { text: 'Settle it now. [Review the case]', next: 'review' },
      { text: 'Not yet. I\'ll go through my notebook first.', next: 'notebook' },
      { text: 'Go in and keep it to myself.', next: 'open' },
    ] },
    unready: { who: 'note', text: 'Finch will ask about Room 4, and I have not yet worked out what happened there.', choices: [
      { text: 'Go through my notebook first.', next: 'notebook' },
      { text: 'Go in and keep it to myself.', next: 'open' },
    ] },
    review: { do: [{ set: { _leaveChoice: 'review' } }], next: 'END' },
    notebook: { do: [{ set: { _leaveChoice: 'notebook' } }], next: 'END' },
    open: { do: [{ set: { _leaveChoice: 'open' } }], next: 'END' },
  } },

  AFTER3_HALE: { start: 'a', nodes: {
    a: { who: 'note', text: 'Supper in the parlor. Finch eats like a man who has forgotten how. Mrs. Gable stays by the kitchen door.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'He died upstairs. On the floor of my room. He came up the back stair to somebody, and somebody came up after him.', next: 'd' },
    d: { who: 'finch', text: '...Under her roof.', next: 'e' },
    e: { who: 'note', text: 'Mrs. Gable doesn\'t look away this time.', next: 'f' },
    f: { who: 'gable', text: 'I\'ll bolt the kitchen passage myself tonight, Constable. And the gentleman can have the last of the coffee.', next: 'END' },
  } },
  AFTER3_GUEST: { start: 'a', nodes: {
    a: { who: 'note', text: 'Supper in the parlor. Finch eats like a man who has forgotten how. Mrs. Gable stays by the kitchen door.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'There was a guest. She was hurt in that room and went down the back stair, and Hale went after her.', next: 'd' },
    d: { who: 'finch', text: 'A woman. Hurt, in this.', next: 'e' },
    e: { who: 'finch', text: 'Then I\'ll find her.', next: 'f' },
    f: { who: 'note', text: 'He is up from the table before his plate is empty. I should have liked to know whose doors he means to knock on.', next: 'END' },
  } },
  AFTER3_GABLE: { start: 'a', nodes: {
    a: { who: 'note', text: 'Supper in the parlor. Finch eats like a man who has forgotten how. Mrs. Gable stays by the kitchen door.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'There was no guest. Whatever happened in Room 4, Mrs. Gable cleaned it, and the story is hers.', next: 'd' },
    d: { who: 'note', text: 'Mrs. Gable sets the coffee pot down on the hob very carefully.', next: 'e' },
    e: { who: 'finch', text: 'Mrs. Gable. I\'ll want your keys.', next: 'f' },
    f: { who: 'gable', text: 'Take them. You\'ll find nothing in my rooms but my rooms.', next: 'END' },
  } },
  AFTER3_OPEN: { start: 'a', nodes: {
    a: { who: 'note', text: 'Supper in the parlor. Finch eats like a man who has forgotten how. Mrs. Gable stays by the kitchen door.', next: 'b' },
    b: { who: 'finch', text: 'Well?', next: 'c' },
    c: { who: 'silas', text: 'Not yet.', next: 'd' },
    d: { who: 'finch', text: 'You were up and down those stairs all day.', next: 'e' },
    e: { who: 'silas', text: 'And I\'ll be up with them tonight.', next: 'END' },
  } },

  CH3_NIGHT: { start: 'a', nodes: {
    a: { who: 'note', text: 'The house is abed. Mrs. Gable bolted the front door and went up with the key. The fire is down to embers.', next: 'b' },
    b: { who: 'silas', text: 'Whoever wrote that note knows I have it. Let them come for it. I\'ll be down here, between the fire and the stair.', next: 'END' },
  } },

  COFFEE: { start: 'a', nodes: {
    a: { who: 'note', text: 'The pot on the hob, still warm. It will be a long night by a dead fire.', choices: [
      { text: 'Pour a cup.', next: 'pour' },
      { text: 'Not yet.', next: 'END' },
    ] },
    pour: { do: [{ script: 'CH3_DRUGGED' }], next: 'END' },
  } },
});

// ======================= Chapter 4: the fourth day =======================
const choiceOf = (text, next, extra = {}) => Object.assign({ text, next }, extra);
// "[Show him something from my notebook]": the notebook's clues open over the conversation (systems/dialogue.js present)
const showChoice = (whom, spec) => ({ text: `[Show ${whom} something from my notebook]`, present: spec });
Object.assign(DIALOGUE, {
  CH4_OPEN: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'gableAccused' }, next: 'acc' }, { if: { flag: 'gableConfides' }, next: 'conf' }, { next: 'plain' }] },
    conf: { who: 'note', text: 'Grey light, and a blanket over me that was not there at three. Mrs. Gable is at the hearth, raking out the dead fire, and she does not ask how I came to be on her floor.', next: 'b' },
    acc: { who: 'note', text: 'Grey light. Mrs. Gable steps round me on her way to the hearth as if I were a chair somebody left out.', next: 'b' },
    plain: { who: 'note', text: 'Grey light on the parlor floor, and my head full of wet sand. Somebody has put a blanket over me.', next: 'b' },
    b: { who: 'silas', text: 'Laudanum, and Rusk\'s label on the tin. Whoever went through my coat came up the back stair, and somebody sold them the means. Rusk first.', next: 'c' },
    c: { who: 'note', text: 'Over the ridge the sky has the colour of an old bruise. The storm that shut the pass is coming back for another look.', next: 'END' },
  } },

  // in the parlor after the third night's end card ("Sit by the dead fire a while"): wait for the fourth day
  DAWN_WAIT: { start: 'a', nodes: {
    a: { who: 'note', text: 'The fire is dead and the house is asleep. First light is a few hours off.', choices: [
      choiceOf('Sit and wait for first light.', 'go'),
      choiceOf('Not yet.', 'END'),
    ] },
    go: { do: [{ script: 'CH4_OPEN' }], next: 'END' },
  } },

  CUTLER: { start: 'start', nodes: {
    start: { branch: [{ if: { seen: 'CUTLER.hub' }, next: 'again' }, { next: 'a' }] },
    again: { who: 'cutler', text: 'Still here.', next: 'hub' },
    a: { who: 'note', text: 'A big man at the foot of the loft stair, saddling a grey. A trooper\'s seat, a trooper\'s moustache, and a long knife at his belt: narrow, single-edged, the sheath worn pale.', next: 'a2' },
    a2: { who: 'cutler', text: 'You\'re the Pinkerton. Mr. Mercer said you\'d come round to me sooner or later.', do: [{ evidence: 'T4_CUTLER' }, { set: { cutlerMet: true } }], next: 'hub' },
    hub: { choices: [
      choiceOf('I\'m not a Pinkerton.', 'pink', { once: true }),
      choiceOf('You lean on Rusk\'s counter.', 'rusk', { once: true }),
      choiceOf('That\'s a cavalry knife.', 'knife', { once: true }),
      choiceOf('Where were you, the night the sheriff went missing?', 'night', { once: true }),
      choiceOf('[Draw the revolver] Stay where you are.', 'gun', { once: true }),
      choiceOf('Ride careful.', 'bye'),
    ] },
    pink: { who: 'cutler', text: 'County, then. It\'s all the same up here. You\'ll go home when the pass opens, and we\'ll still be here.', next: 'hub' },
    rusk: { who: 'cutler', text: 'Jonah sells. I buy. Mr. Mercer settles the account. That\'s how a town works, mister.', next: 'hub' },
    knife: { who: 'cutler', text: 'My father\'s. He rode with Mr. Mercer in the war. Most of the men who came up here did.', next: 'knife2' },
    knife2: { who: 'note', text: 'His thumb goes to the hilt and rests there, the way another man\'s goes to his watch chain.', next: 'hub' },
    night: { who: 'cutler', text: 'Asleep, like an honest man. Ask anybody who was awake to see me.', next: 'night2' },
    night2: { who: 'note', text: 'He smiles at that, as if it were a joke he had made before, to someone else.', next: 'hub' },
    gun: { who: 'note', text: 'The revolver comes out. He looks at it, then at me, and does not stop tightening the girth.', do: [{ threat: 'cutler' }, { set: { cutlerWarned: true } }], next: 'gun2' },
    gun2: { who: 'cutler', text: 'Three in that, I\'d guess, and none to spare up here. Put it up, mister. You\'ll want them later.', next: 'bye' },
    bye: { who: 'cutler', text: 'I\'ve work up the ridge. Don\'t follow me up there in this.', do: [{ script: 'CUTLER_RIDES' }], next: 'END' },
  } },

  CASE_PROMPT_KILLER: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: '_caseDecidable' }, next: 'ready' }, { next: 'unready' }] },
    ready: { who: 'note', text: 'The storm is coming down the street. Before I go in out of it, I should settle who came up that stair after Hale, and on whose word.', choices: [
      choiceOf('Settle it now. [Review the case]', 'review'),
      choiceOf('Not yet. I\'ll go through my notebook first.', 'notebook'),
      choiceOf('Go in and keep it to myself.', 'open'),
    ] },
    unready: { who: 'note', text: 'Supper, and then the ridge. I have not yet worked out who came up the stair after Hale.', choices: [
      choiceOf('Go through my notebook first.', 'notebook'),
      choiceOf('Go in and keep it to myself.', 'open'),
    ] },
    review: { do: [{ set: { _leaveChoice: 'review' } }], next: 'END' },
    notebook: { do: [{ set: { _leaveChoice: 'notebook' } }], next: 'END' },
    open: { do: [{ set: { _leaveChoice: 'open' } }], next: 'END' },
  } },

  // supper on the fourth evening: with Finch, or, if he went up the ridge after "the woman", with Mrs. Gable
  AFTER4_CUTLER: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'huntForGuest' }, next: 'g' }, { next: 'f' }] },
    f: { who: 'note', text: 'Supper by a fire that keeps blowing back down the chimney. Finch eats with his hat on the table beside him.', next: 'f1' },
    f1: { who: 'silas', text: 'Wade Cutler killed Hale. Up the back stair, with that knife of his. And he did it because Gideon Mercer told him to.', next: 'f2' },
    f2: { branch: [{ if: { trust: { finch: 'COLD' } }, next: 'fcold' }, { next: 'f3' }] },
    fcold: { who: 'finch', text: 'Mercer holds the note on my mother\'s house, Vance. You know what you\'re asking.', next: 'f4' },
    f3: { who: 'finch', text: 'Then I\'ll take him. Tonight.', next: 'f4' },
    f4: { who: 'silas', text: 'He rode up the ridge this morning with his saddlebags full. Whatever is up there, he means to open it tonight, in the storm.', next: 'END' },
    g: { who: 'note', text: 'Supper alone, by a fire that keeps blowing back down the chimney. Finch has not come back from the ridge. Mrs. Gable sets two places and takes one away.', next: 'g1' },
    g1: { who: 'silas', text: 'Cutler killed him, Mrs. Gable. On Mercer\'s word.', next: 'g2' },
    g2: { who: 'gable', text: 'And the constable is up there, in this, looking for her. With Cutler.', next: 'END' },
  } },
  AFTER4_ALONE: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'huntForGuest' }, next: 'g' }, { next: 'f' }] },
    f: { who: 'note', text: 'Supper by a fire that keeps blowing back down the chimney. Finch eats with his hat on the table beside him.', next: 'f1' },
    f1: { who: 'silas', text: 'Cutler killed Hale. For his father\'s share, whatever that is.', next: 'f2' },
    f2: { who: 'finch', text: 'Mr. Mercer\'s foreman. He\'ll want to hear it from me before he hears it in the street.', next: 'f3' },
    f3: { who: 'note', text: 'He was gone an hour. He came back with Mercer\'s regrets, and a bottle, and less colour than he went with.', next: 'END' },
    g: { who: 'note', text: 'Supper alone. Finch has not come back from the ridge. Mrs. Gable sets two places and takes one away.', next: 'g1' },
    g1: { who: 'silas', text: 'Cutler did it, Mrs. Gable. On his own account.', next: 'g2' },
    g2: { who: 'gable', text: 'Cutler never did a thing on his own account in his life.', next: 'END' },
  } },
  AFTER4_MERCER: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'huntForGuest' }, next: 'g' }, { next: 'f' }] },
    f: { who: 'note', text: 'Supper by a fire that keeps blowing back down the chimney. Finch eats with his hat on the table beside him.', next: 'f1' },
    f1: { who: 'silas', text: 'Gideon Mercer went up that stair and killed his sheriff himself.', next: 'f2' },
    f2: { who: 'finch', text: 'Mr. Mercer is sixty-one, Vance, and walks with a stick on the ice.', next: 'f3' },
    f3: { who: 'silas', text: 'Then he walked carefully.', next: 'f4' },
    f4: { who: 'note', text: 'Finch says nothing more. Across the street a lamp goes up in Mercer\'s window, and stays up.', next: 'END' },
    g: { who: 'note', text: 'Supper alone. Finch has not come back from the ridge. Mrs. Gable sets two places and takes one away.', next: 'g1' },
    g1: { who: 'silas', text: 'Mercer killed him, Mrs. Gable. With his own hand.', next: 'g2' },
    g2: { who: 'gable', text: 'Then God help her, because she\'s his.', next: 'END' },
  } },
  AFTER4_OPEN: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'huntForGuest' }, next: 'g' }, { next: 'f' }] },
    f: { who: 'note', text: 'Supper by a fire that keeps blowing back down the chimney. Finch eats with his hat on the table beside him.', next: 'f1' },
    f1: { who: 'finch', text: 'Well?', next: 'f2' },
    f2: { who: 'silas', text: 'Not here. Not yet.', next: 'END' },
    g: { who: 'note', text: 'Supper alone. Finch has not come back from the ridge. Mrs. Gable sets two places and takes one away.', next: 'END' },
  } },

  // after supper: the storm, and what Silas means to do about the ridge
  CH4_STORM: { start: 'a', nodes: {
    a: { who: 'note', text: 'The storm comes down off the ridge at full dark, and the Black Ram creaks like a ship.', next: 'b' },
    b: { branch: [{ if: { evidence: 'T4_GABLE_CLARA' }, next: 'known' }, { if: { evidence: 'T4_FINCH_CONFESS' }, next: 'known' }, { next: 'unknown' }] },
    known: { who: 'silas', text: 'Clara Mercer is up there, at her mother\'s cabin past the workings. So is Cutler, with forty pounds of powder. I can\'t wait for morning.', next: 'c' },
    unknown: { who: 'silas', text: 'Clara Mercer is somewhere up on that ridge, and so is Cutler, with forty pounds of powder. I can\'t wait for morning.', next: 'c' },
    c: { branch: [{ if: { flag: 'huntForGuest' }, next: 'finch' }, { next: 'd' }] },
    finch: { who: 'note', text: 'And somewhere up there, Finch, with a lantern, calling for a woman whose name he does not know.', next: 'd' },
    d: { who: 'note', text: 'I fill the lantern and load what I have. Three cartridges. They will have to do.', next: 'END' },
  } },
});

// --- the fourth day's turns of existing conversations ---
Object.assign(DIALOGUE.RUSK.nodes, {
  r4: { branch: [{ if: { seen: 'RUSK.r4hub' }, next: 'r4again' }, { next: 'r4a' }] },
  r4a: { who: 'rusk', text: 'You\'re up.', next: 'r4a2' },
  r4a2: { who: 'note', text: 'He says it the way a man reads a bill he hoped had gone to the wrong house.', next: 'r4hub' },
  r4again: { who: 'rusk', text: 'What now?', next: 'r4hub' },
  r4hub: { choices: [
    showChoice('him', { q: 'Q_COFFEE', wrong: 'showNo', accept: [
      { clue: 'S3_TIN', next: 'showTin' },
      { clue: 'S4_REGISTER', next: 'showReg' },
    ] }),
    choiceOf('Can you open a watch?', 'watch', { once: true, if: { all: [{ item: 'WATCH' }, { any: [{ evidence: 'T4_RUSK_CONFESS' }, { evidence: 'T4_RUSK_CUTLER' }] }] } }),
    choiceOf('That\'s all.', 'r4bye'),
  ] },
  showTin: { who: 'silas', text: 'Mrs. Gable bought a new tin of coffee from you yesterday.', next: 'tin' },
  showReg: { who: 'silas', text: 'Your poison register is short a page.', next: 'reg' },
  showNo: { who: 'rusk', text: 'I sell nails and flour, mister. I don\'t know what that\'s meant to be.', next: 'r4hub' },
  tin: { who: 'rusk', text: 'Coffee\'s coffee. Comes up sealed from the railhead. I put my label on it, that\'s all.', next: 'tin2' },
  tin2: { who: 'note', text: 'His eyes go to the counter, and under it.', next: 'r4hub' },
  reg: { branch: [{ if: { flag: 'ruskWarmed' }, next: 'conf' }, { next: 'press' }] },
  conf: { who: 'note', text: 'He takes his hands off the counter. For a while he looks at the stove, as if it might help.', next: 'conf2' },
  conf2: { who: 'rusk', text: 'Mr. Mercer told me to. He holds the note on this store, the roof over this counter, the boots on my boy. He said it would only make you sleep, so his man could get a paper back from you.', next: 'conf3' },
  conf3: { who: 'rusk', text: 'His man. Cutler. Wade Cutler, the foreman. It was Cutler scraped my book that day, on this counter, and Cutler fetched the powder after dark. I said it came to me like that. It came to me with Cutler\'s elbow on it.', do: [{ evidence: 'T4_RUSK_CONFESS' }, { set: { ruskConfessed: true } }, { char: { rusk: { trust: 'OPEN' } } }, { log: 'Rusk told me: Mercer ordered the coffee, and Cutler scraped the freight book.' }], next: 'conf4' },
  conf4: { who: 'rusk', text: 'I\'d have stood up in a court and said so, once. Not now. Not with the pass shut and him across the street.', next: 'r4hub' },
  press: { who: 'rusk', text: 'Registers get torn. Pages go for spills.', choices: [
    choiceOf('It was enough to put me under, Jonah, not to kill me. I don\'t think you meant me dead.', 'decent', { if: { examined: 'EV3_CUP' } }),
    choiceOf('Tell me who, and I\'ll keep your name out of it.', 'deal'),
    choiceOf('[Draw the revolver] Who, Jonah?', 'gun'),
    choiceOf('Have it your way.', 'r4hub'),
  ] },
  decent: { who: 'rusk', text: '...No. God, no. He said you\'d only sleep.', do: [{ set: { ruskWarmed: true } }], next: 'conf' },
  deal: { who: 'rusk', text: '...Cutler. Wade Cutler, Mr. Mercer\'s foreman. He leans on my counter when he likes. Ask him about books. Not me.', do: [{ evidence: 'T4_RUSK_CUTLER' }, { log: 'Rusk gave me a name: Wade Cutler, Mercer\'s foreman.' }], next: 'r4hub' },
  gun: { who: 'note', text: 'The revolver comes out. He goes white to the lips.', do: [{ threat: 'rusk' }], next: 'gun2' },
  gun2: { who: 'rusk', text: 'Cutler! Wade Cutler! God, put it away!', do: [{ evidence: 'T4_RUSK_CUTLER' }, { set: { ruskFled: true } }, { char: { rusk: { trust: 'COLD' } } }, { log: 'Drew on Rusk. He gave me Cutler\'s name and ran out the back.' }], next: 'gun3' },
  gun3: { who: 'note', text: 'He is out through the back door before I have the hammer down, into the snow, without his coat.', do: [{ script: 'RUSK_FLEES' }], next: 'END' },
  watch: { who: 'rusk', text: 'I mend clocks in the winter. Give it here.', next: 'watch2' },
  watch2: { who: 'note', text: 'He takes the back off with a pin, and is quiet for a while.', do: [{ evidence: 'EV4_WATCH' }], next: 'watch3' },
  watch3: { who: 'rusk', text: 'Ran down on its own, days back. Somebody turned the hands after. You don\'t bend an arbor like that dropping it.', next: 'r4hub' },
  r4bye: { who: 'rusk', text: 'Shut the door. The heat.', next: 'END' },
});

Object.assign(DIALOGUE.FINCH_OFFICE.nodes, {
  f4: { branch: [{ if: { seen: 'FINCH_OFFICE.f4hub' }, next: 'f4again' }, { if: { trust: { finch: 'COLD' } }, next: 'f4cold' }, { next: 'f4a' }] },
  f4cold: { who: 'finch', text: 'You\'re still standing. That\'s something, in this town.', next: 'f4hub' },
  f4a: { who: 'finch', text: 'Vance. Mrs. Gable sent word you were on her floor at first light. I\'ve made coffee. My own.', next: 'f4hub' },
  f4again: { who: 'finch', text: 'Vance.', next: 'f4hub' },
  f4hub: { choices: [
    choiceOf('Who is Wade Cutler?', 'cut', { once: true, if: { any: [{ evidence: 'T4_RUSK_CONFESS' }, { evidence: 'T4_RUSK_CUTLER' }] } }),
    showChoice('him', { q: 'Q_TELEGRAM', wrong: 'showNo', accept: [
      { clue: 'S4_BOOK', next: 'showBook' },
      { clue: 'S4_PAD', next: 'showForms', if: { notSeen: 'FINCH_OFFICE.forms' } },
      { clue: 'S4_PAD', next: 'showF41', if: { notSeen: 'FINCH_OFFICE.f41' } },
    ] }),
    choiceOf('That\'ll do.', 'f4bye'),
  ] },
  showBook: { who: 'silas', text: 'Clara Mercer sent my telegram.', next: 'clara' },
  showForms: { who: 'silas', text: 'These forms are signed already.', next: 'forms' },
  showF41: { who: 'silas', text: 'Number forty-one is missing.', next: 'f41' },
  showNo: { who: 'finch', text: 'I\'ve seen it, Vance. I don\'t see what it\'s got to do with me.', next: 'f4hub' },
  cut: { who: 'finch', text: 'Mercer\'s foreman. Came up after the war with his father, who rode with Mercer. Keeps the loft over the woodshed at the east end of the street. Nobody crosses him, Vance, and I\'ve never had cause to try.', do: [{ set: { knowsLoft: true } }], next: 'f4hub' },
  clara: { who: 'note', text: 'He sits down on the edge of the desk, slowly, like a man much older.', next: 'clara2' },
  clara2: { who: 'finch', text: 'I knew it the night you came. My name, and words I never wrote. She\'d been in here with Hale, a week before, sitting where you\'re standing.', next: 'clara3' },
  clara3: { who: 'finch', text: 'I said nothing, because if I said it, her father would hear it by supper. If she\'s anywhere, it\'s her mother\'s old cabin, the observatory, up past the workings.', do: [{ evidence: 'T4_FINCH_CONFESS' }, { set: { knowsObservatory: true } }, { char: { finch: { trust: 'STEADY' } } }, { log: 'Finch told me he guessed Clara sent the telegram, and kept quiet to protect her.' }], next: 'f4hub' },
  f4bye: { who: 'finch', text: 'Mind the street. The wind\'s getting up.', next: 'END' },
});

Object.assign(DIALOGUE.GABLE_DAY.nodes, {
  g4: { branch: [{ if: { flag: 'gableAccused' }, next: 'g4cold' }, { if: { seen: 'GABLE_DAY.g4hub' }, next: 'g4again' }, { if: { flag: 'gableConfides' }, next: 'g4warm' }, { next: 'g4a' }] },
  g4cold: { who: 'gable', text: 'The constable has my keys, Mister Vance. Ask him what\'s in my rooms.', next: 'END' },
  g4warm: { who: 'gable', text: 'I bolted the passage myself last night, and showed you I had. This morning the bolt was back.', next: 'g4hub' },
  g4a: { who: 'gable', text: 'You\'ll want breakfast. You won\'t get coffee.', next: 'g4hub' },
  g4again: { who: 'gable', text: 'Mister Vance.', next: 'g4hub' },
  g4hub: { choices: [
    choiceOf('Somebody came up the back stair last night.', 'stairs', { once: true }),
    choiceOf('Clara Mercer was your guest.', 'clara', { once: true, if: { any: [{ flag: 'gableConfides' }, { all: [{ item: 'GLOVE' }, { evidence: 'T3_GABLE_STAIR' }] }] } }),
    showChoice('her', { q: 'Q_TELEGRAM', wrong: 'showNo4', accept: [
      { clue: 'S4_BOOK', next: 'showBook', if: { notSeen: 'GABLE_DAY.clara' } },
    ] }),
    choiceOf('Nothing. Good day.', 'g4bye'),
  ] },
  showBook: { who: 'silas', text: 'Ada Bell wrote down who handed in my telegram. Clara Mercer was your guest.', next: 'clara' },
  showNo4: { who: 'gable', text: 'You\'ve shown me a great many things this week, Mister Vance. That one tells me nothing.', next: 'g4hub' },
  stairs: { who: 'gable', text: 'Then he has a key to my yard gate, or he has my bolt\'s measure. Either way it\'s not a ghost, Mister Vance.', next: 'g4hub' },
  clara: { who: 'note', text: 'She closes the register, and puts her hand flat on it.', next: 'clara2' },
  clara2: { who: 'gable', text: 'Clara. Clara Mercer. She paid off my note to her father last winter and asked nothing for it. When she needed a room off the book, she had one.', next: 'clara3' },
  clara3: { who: 'gable', text: 'She got out down the back stair that night, while they were busy with him. Her mother had a cabin up on the ridge, the old observatory, past the workings. She\'d go there. She always went there.', do: [{ evidence: 'T4_GABLE_CLARA' }, { set: { knowsObservatory: true } }, { char: { gable: { cooperation: 'OPEN' } } }, { log: 'Mrs. Gable told me: Clara was her guest, and fled to her mother\'s cabin on the ridge.' }], next: 'g4hub' },
  g4bye: { who: 'gable', text: 'Keep out of the wind.', next: 'END' },
});

Object.assign(DIALOGUE.ADA.nodes, {
  d4: { branch: [{ if: { seen: 'ADA.d4hub' }, next: 'd4again' }, { if: { flag: 'adaWarned' }, next: 'd4office' }, { next: 'd4a' }] },
  d4office: { who: 'ada', text: 'You told me to go home. I came down here instead, to the constable\'s stove. It\'s nearer.', next: 'd4hub' },
  d4a: { who: 'ada', text: 'Still dead, all of it. I\'ve walked a mile of the ridge looking for the next cut.', next: 'd4hub' },
  d4again: { who: 'ada', text: 'Mister Vance.', next: 'd4hub' },
  d4hub: { choices: [
    showChoice('her', { q: 'Q_TELEGRAM', wrong: 'showNo', accept: [
      { clue: 'S4_PAD', next: 'showF41', if: { noEvidence: 'EV4_ADA_BOOK' } },
    ] }),
    choiceOf('Whose glove is this? [Show it]', 'glove', { once: true, if: { all: [{ item: 'GLOVE' }, { noEvidence: 'EV4_ADA_BOOK' }] } }),
    choiceOf('Did you see anyone on the ridge this morning?', 'ridge', { once: true }),
    choiceOf('That\'s all.', 'd4bye'),
  ] },
  showF41: { who: 'silas', text: 'My telegram was written on form forty-one.', next: 'f41' },
  showNo: { who: 'ada', text: 'I take down what comes over the wire, Mister Vance. That didn\'t.', next: 'd4hub' },
  f41: { who: 'note', text: 'She looks at me a long moment. Then she takes a book out of her coat, the receiving book she would not leave at the station with the line down.', next: 'book' },
  glove: { who: 'note', text: 'She knows it. I watch her know it. Then she takes a book out of her coat, the receiving book she would not leave at the station with the line down.', next: 'book' },
  book: { who: 'ada', text: 'I write down who hands it in, Mister Vance. I told you so. Read it, and then forget where you read it.', do: [{ evidence: 'EV4_ADA_BOOK' }], next: 'd4hub' },
  ridge: { who: 'ada', text: 'A rider on a grey, at first light, going up past the tower toward the workings. Saddlebags, and something long across the pommel.', next: 'd4hub' },
  d4bye: { who: 'ada', text: 'Go carefully. The wind is turning.', next: 'END' },
});

Object.assign(DIALOGUE.VALE.nodes, {
  v4: { branch: [{ if: { seen: 'VALE.v4hub' }, next: 'v4again' }, { next: 'v4a' }] },
  v4a: { who: 'note', text: 'The Reverend is sweeping snow off Hale\'s new grave, which the wind puts back as fast as he moves it.', next: 'v4hub' },
  v4again: { who: 'vale', text: 'Mister Vance.', next: 'v4hub' },
  v4hub: { choices: [
    showChoice('him', { q: 'Q_KILLER', wrong: 'showNo', accept: [
      { clue: 'S4_HAND', next: 'showTally', if: { examined: 'EV4_TALLY' }, else: 'tallyNotYet' },
      { clue: 'S2_CACHE', next: 'showGrave', if: { notSeen: 'VALE.tally' } },
    ] }),
    choiceOf('Good day, Reverend.', 'v4bye'),
  ] },
  showTally: { who: 'silas', text: 'Mercer\'s foreman struck a sheriff off his books.', next: 'tally' },
  tallyNotYet: { who: 'note', text: 'Not yet. I have not read that book closely enough to put it to a man of God.', next: 'v4hub' },
  showGrave: { who: 'silas', text: 'You knew what was in Amos Pell\'s grave.', next: 'grave' },
  showNo: { who: 'vale', text: 'The Lord sees a great deal, Mister Vance. I see less. What is it?', next: 'v4hub' },
  grave: { who: 'vale', text: 'I keep the ground, Mister Vance. I told you.', next: 'grave2' },
  grave2: { who: 'note', text: 'He does not look at Pell\'s stone. He has not looked at it once.', next: 'v4hub' },
  tally: { branch: [{ if: { flag: 'valeEmboldened' }, next: 'hard' }, { next: 'soft' }] },
  hard: { who: 'vale', text: 'The Figure walks the ridge, Mister Vance, and men who follow it do not come down. You told the town so yourself. I only preached it.', do: [{ set: { valeHardened: true } }], next: 'v4hub' },
  soft: { who: 'note', text: 'The broom stops.', next: 'soft2' },
  soft2: { who: 'vale', text: 'Mercer told me the Order\'s money lies behind the fall in the old workings. Enough to put a roof on every house in this valley. I preached the Figure to keep fools off the ridge until he could get it out.', next: 'soft3' },
  soft3: { who: 'vale', text: 'I knew about the powder. I did not know about Hale. Before God, Mister Vance, I did not know.', do: [{ evidence: 'T4_VALE_MONEY' }, { log: 'Vale told me Mercer means to take the Order\'s money from behind the fall.' }], choices: [
    choiceOf('You didn\'t know they would kill him.', 'turn'),
    choiceOf('You built the fear they killed him under.', 'harden'),
  ] },
  turn: { who: 'vale', text: '...No. But I know now. If you need the town, Mister Vance, I can ring the bell.', do: [{ set: { valeTurned: true } }], next: 'v4hub' },
  harden: { who: 'vale', text: 'Then let God judge which of us brought this valley more fear.', do: [{ set: { valeHardened: true } }], next: 'v4hub' },
  v4bye: { who: 'vale', text: 'Keep off the ridge tonight. Whatever is up there.', next: 'END' },
});

// ======================= Chapter 5: the fourth night =======================
// The proof Silas can carry down (Mystery Bible §8, Q8: one living witness and one document).
const WITNESS = { any: [{ all: [{ flag: 'claraTestifies' }, { notFlag: 'claraLost' }] }, { all: [{ flag: 'ruskConfessed' }, { notFlag: 'ruskFled' }] }, { evidence: 'T4_FINCH_CONFESS' },
  // settled on "Cutler, on Mercer's word" and took him alive: Cutler will not hang alone
  { all: [{ flag: 'killerKnown' }, { flag: 'cutlerTaken' }, { notFlag: 'cutlerShot' }] }] };
const DOCUMENT = { any: [{ item: 'TALLY_BOOK' }, { evidence: 'EV4_ADA_BOOK' }, { all: [{ examined: 'EV5_PAYROLL' }, { evidence: 'SAWMILL_LEDGER' }] }] };
export const PROOF = { all: [WITNESS, DOCUMENT] };
const CLARA_AT_CABIN = { all: [{ flag: 'knowsObservatory' }, { notFlag: 'huntForGuest' }] };
Object.assign(DIALOGUE, {
  // after "Sit by the fire a while" on the fourth day's end card: the front door, at night
  NIGHT_GO: { start: 'a', nodes: {
    a: { who: 'note', text: 'The storm is leaning on the door. Clara Mercer is up there in it, and so is Cutler, with forty pounds of powder.', choices: [
      choiceOf('Go up the ridge now.', 'go'),
      choiceOf('Not yet.', 'END'),
    ] },
    go: { do: [{ script: 'CH5_OPEN' }], next: 'END' },
  } },

  CH5_OPEN: { start: 'a', nodes: {
    a: { who: 'note', text: 'Up the chapel lane in the dark, past Hale\'s new grave, to the tower. The wind takes the breath out of my mouth before I can use it.', next: 'b' },
    b: { branch: [{ if: { flag: 'valeTurned' }, next: 'vale' }, { next: 'c' }] },
    vale: { who: 'note', text: 'A light in the chapel as I passed. Vale, at the bell rope, waiting for a reason.', next: 'c' },
    c: { branch: [{ if: { flag: 'huntForGuest' }, next: 'finch' }, { if: { flag: 'knowsObservatory' }, next: 'cabin' }, { next: 'blind' }] },
    finch: { who: 'silas', text: 'The ridge path runs on east from here, to the workings. Somewhere along it is Finch, and whoever he went looking for.', next: 'END' },
    cabin: { who: 'silas', text: 'The ridge path runs on east from here, to the workings, and past them to her mother\'s cabin. Clara first.', next: 'END' },
    blind: { who: 'silas', text: 'The ridge path runs on east from here, to the workings. Whatever Cutler means to open, he is opening it tonight.', next: 'END' },
  } },

  // the ridge: Finch, if he went up after "the woman" yesterday
  FINCH_RIDGE: { start: 'start', nodes: {
    start: { branch: [{ if: { seen: 'FINCH_RIDGE.hub' }, next: 'again' }, { next: 'a' }] },
    again: { who: 'finch', text: 'Go on, Vance. I\'ll keep.', next: 'END' },
    a: { who: 'note', text: 'Finch, standing in the lee of a rock, his lantern broken at his feet and blood frozen in one eyebrow.', next: 'b' },
    b: { who: 'finch', text: 'Vance. I found her. Up at the old cabin, the observatory. I\'d hardly said her name when Cutler came in behind me.', next: 'c' },
    c: { who: 'finch', text: 'He took her down to the workings. I went up there looking for a murderess, and I led him straight to her.', do: [{ evidence: 'T5_FINCH_RIDGE' }, { set: { finchFound: true } }, { log: 'Found Finch hurt on the ridge. Cutler took Clara from the cabin to the workings.' }], next: 'hub' },
    hub: { choices: [
      choiceOf('Can you walk?', 'walk', { once: true }),
      choiceOf('Keep your head down. I\'ll come back for you.', 'bye'),
    ] },
    walk: { who: 'finch', text: 'Down, maybe. Not up. Go.', next: 'hub' },
    bye: { who: 'finch', text: 'She\'s alive, Vance. She was alive when he took her.', next: 'END' },
  } },

  // the observatory cabin: Clara, or the empty room Cutler left
  CABIN_IN: { start: 'start', nodes: {
    start: { branch: [{ if: { flag: 'claraWithSilas' }, next: 'gone' }, { if: CLARA_AT_CABIN, next: 'a' }, { next: 'empty' }] },
    gone: { who: 'note', text: 'Her mother\'s cabin, with the stove going and nobody in it.', next: 'END' },
    empty: { who: 'note', text: 'The door is off its top hinge. Inside, cold: the stove kicked over, a chair on its back, and nobody.', next: 'empty2' },
    empty2: { who: 'note', text: 'Finch found her. And somebody followed Finch.', next: 'END' },
    a: { who: 'note', text: 'A woman by the stove in a grey riding cloak, a poker in her hand. Red hair under the hood. She does not put the poker down.', do: [{ set: { claraMet: true } }, { char: { clara: { location: 'OBSERVATORY' } } }], next: 'a2' },
    a2: { who: 'clara', text: 'Stay by the door. ...You\'re Vance.', next: 'a3' },
    a3: { who: 'silas', text: 'You sent for me. Form forty-one, signed by a constable who never wrote it.', next: 'a4' },
    a4: { who: 'clara', text: 'I\'m sorry it took a dead man to make it worth your fare. Do you know who killed Nathaniel Hale?', choices: [
      choiceOf('Wade Cutler. On your father\'s word.', 'k1', { if: { evidence: 'T4_CUTLER' } }),
      choiceOf('Your father.', 'k2'),
      choiceOf('Not for certain. Tell me.', 'k3'),
    ] },
    k1: { who: 'clara', text: 'Yes.', next: 'tell' },
    k2: { who: 'clara', text: 'My father has never held a knife in his life. He has men for that.', next: 'tell' },
    k3: { who: 'clara', text: 'Then I will.', next: 'tell' },
    tell: { who: 'clara', text: 'I was in Room 4. Nathaniel came up the back stair with one of Rusk\'s freight bills. Wade came up after him. My father waited in the yard; I heard him. I saw Wade\'s knife, and then I was on the stair, and then I was running.', do: [{ evidence: 'T5_CLARA' }, { log: 'Clara Mercer, at her mother\'s cabin: she saw Cutler follow Hale up the back stair, and her father waiting in the yard.' }], next: 'tell2' },
    tell2: { who: 'clara', text: 'Wade went into the workings at dusk with the powder. My father went up after him an hour ago. I have been watching them through my mother\'s glass.', next: 'ask' },
    ask: { who: 'clara', text: 'If I come down off this ridge with you, Mr. Vance, will you take it all the way? Even him?', choices: [
      choiceOf('All the way. Even him.', 'yes'),
      choiceOf('I\'ll see you safe. The rest is for the county.', 'no'),
    ] },
    yes: { who: 'clara', text: 'Then I will stand up and say it, in front of whoever they send.', do: [{ set: { claraTestifies: true, claraAsked: true } }], next: 'go' },
    no: { who: 'clara', text: 'The county. ...Safe, then.', do: [{ set: { claraAsked: true } }], next: 'go' },
    go: { who: 'clara', text: 'Come on. Before he lights it.', do: [{ set: { claraWithSilas: true } }, { char: { clara: { location: 'WITH_SILAS' } } }, { script: 'CLARA_JOINS' }], next: 'END' },
  } },

  // the workings: what Silas walks in on
  WK_IN: { start: 'a', nodes: {
    a: { who: 'note', text: 'Lamplight, far in. The drift runs back under the mountain on old timbers, and at the end of it the fall of \'72 goes up to the roof.', next: 'b' },
    b: { branch: [{ if: { any: [{ flag: 'cutlerWarned' }, { flag: 'mercerAccused' }, { flag: 'huntForGuest' }] }, next: 'lit' }, { next: 'unlit' }] },
    lit: { who: 'note', text: 'Along the floor, a thread of sparks is eating its way toward the fall. The fuse is already burning.', do: [{ set: { fuseLit: true } }], next: 'm' },
    unlit: { who: 'note', text: 'Cutler is at the foot of the fall, tamping the last of the powder into a hole with a stick. The fuse lies coiled beside him, not lit.', next: 'm' },
    m: { branch: [{ if: { flag: 'claraWithSilas' }, next: 'mc' }, { next: 'mh' }] },
    mc: { who: 'note', text: 'Gideon Mercer stands by an open chest in the lamplight, a canvas bag in his hand. He sees his daughter behind me, and the bag goes still.', next: 'say' },
    mh: { who: 'note', text: 'Gideon Mercer stands by an open chest in the lamplight, a canvas bag in his hand. Beyond him, by the fall, Clara Mercer stands with her back to the rock and her hands tied in front of her. Cutler is between her and me.', do: [{ set: { claraMet: true } }], next: 'say' },
    say: { who: 'mercer', text: 'Mister Vance. Stay where you are, and nobody else need be hurt.', next: 'e' },
    e: { branch: [{ if: { flag: 'fuseLit' }, next: 'now' }, { next: 'walk' }] },
    walk: { who: 'note', text: 'Cutler has not looked round. He has the end of the fuse in his hand.', next: 'END' },
    now: { do: [{ script: 'CLIMAX' }], next: 'END' },
  } },

  // Mercer, before it comes to Cutler (only while the fuse is not lit)
  MERCER_WK: { start: 'start', nodes: {
    start: { branch: [{ if: { seen: 'MERCER_WK.hub' }, next: 'again' }, { next: 'a' }] },
    again: { who: 'mercer', text: 'Well?', next: 'hub' },
    a: { who: 'mercer', text: 'Look in the chest before you judge anybody, Mister Vance. That is what built this town, and what will rebuild it.', next: 'hub' },
    hub: { choices: [
      choiceOf('Who killed Nathaniel Hale?', 'hale', { once: true }),
      choiceOf('Call Cutler off.', 'off', { once: true }),
      choiceOf('[Leave him]', 'END'),
    ] },
    hale: { who: 'mercer', text: 'A sheriff who did not know when to leave old things alone. Ask the mountain.', next: 'hub' },
    off: { who: 'mercer', text: 'Wade has not taken an order from anyone but me since he was fourteen. He will finish, and then we will talk.', next: 'hub' },
  } },
  CLARA_WK: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'climaxDone' }, next: 'after' }, { if: { flag: 'claraWithSilas' }, next: 'with' }, { next: 'held' }] },
    with: { who: 'clara', text: 'Don\'t look at him. Look at Wade. Wade is the one with the match.', next: 'END' },
    held: { who: 'note', text: 'She does not look at me. She is looking at her father, and he is looking at the chest.', next: 'END' },
    after: { who: 'clara', text: 'Finish it, Mr. Vance.', next: 'END' },
  } },

  // the fall: Cutler, the charge, and the one choice the revolver gives
  CUTLER_FALL: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'climaxDone' }, next: 'done' }, { if: { flag: 'fuseLit' }, next: 'lit' }, { next: 'unlit' }] },
    done: { who: 'cutler', text: '...', next: 'END' },
    lit: { branch: [{ if: { flag: 'cutlerWarned' }, next: 'lw' }, { if: { flag: 'mercerAccused' }, next: 'lm' }, { next: 'lh' }] },
    lw: { who: 'cutler', text: 'Told you to keep those three for later, Pinkerton. This is later.', next: 'l2' },
    lm: { who: 'cutler', text: 'You named him in the street. So we\'re early. That\'s on you, mister.', next: 'l2' },
    lh: { who: 'cutler', text: 'Your constable brought me to her. Tell him I said thanks.', next: 'l2' },
    l2: { who: 'note', text: 'The spark is a yard from the charge and closing. Cutler stands between me and it, the knife out. One shot, and I could reach it. Hold, and it goes.', do: [{ set: { climaxStarted: true } }], choices: [
      choiceOf('[Fire]', 'fireLit'),
      choiceOf('[Hold fire] It\'s over, Wade. Step away from it.', 'holdLit'),
    ] },
    unlit: { who: 'cutler', text: 'You came up after all.', next: 'u2' },
    u2: { branch: [{ if: { flag: 'claraWithSilas' }, next: 'u3' }, { next: 'u3h' }] },
    u3: { who: 'note', text: 'He has the knife in one hand and the end of the fuse in the other, and a match ready on the rock.', do: [{ set: { climaxStarted: true } }], next: 'uc' },
    u3h: { who: 'note', text: 'He has the knife in his hand, Clara at his back with her hands tied, and a match ready on the rock beside the fuse.', do: [{ set: { climaxStarted: true } }], next: 'uc' },
    uc: { choices: [
      choiceOf('[Fire]', 'fire'),
      choiceOf('[Hold fire] Leave the match, Wade. It\'s over.', 'hold'),
    ] },
    fire: { who: 'note', text: 'The shot is enormous in the drift. Cutler sits down against the rock as if he were tired, and does not get up.', do: [{ shoot: 'cutler' }, { set: { cutlerShot: true, climaxDone: true } }, { log: 'Shot Wade Cutler at the foot of the fall.' }, { script: 'SHOT' }], next: 'END' },
    fireLit: { who: 'note', text: 'The shot is enormous in the drift. Cutler sits down against the rock as if he were tired. I go past him on my knees and tear the fuse out of the charge with my hand.', do: [{ shoot: 'cutler' }, { set: { cutlerShot: true, fuseOut: true, climaxDone: true } }, { log: 'Shot Wade Cutler, and pulled the fuse before it reached the charge.' }, { script: 'SHOT' }], next: 'END' },
    hold: { branch: [{ if: { flag: 'claraWithSilas' }, next: 'holdC' }, { next: 'holdH' }] },
    holdC: { who: 'clara', text: 'Wade. Put it down.', next: 'hold2' },
    holdH: { who: 'silas', text: 'Your father rode with him, Wade. Not for this. Not for a girl with her hands tied, in a hole in the ground.', next: 'hold2' },
    hold2: { who: 'note', text: 'He looks a long time at nothing. Then he knocks the match into the wet with his knuckle and holds out the knife, hilt first.', do: [{ set: { cutlerTaken: true, climaxDone: true } }, { log: 'Held my fire. Cutler gave up his knife at the foot of the fall.' }, { script: 'RECKONING' }], next: 'END' },
    holdLit: { who: 'cutler', text: 'It\'s lit, mister. Nothing\'s over.', next: 'holdLit2' },
    holdLit2: { who: 'note', text: 'He goes past me for the mouth at a run. I let him go, and I go for the charge, and I am not going to reach it.', do: [{ set: { cutlerRan: true, cutlerTaken: true, climaxDone: true } }, { log: 'Held my fire. Cutler ran, and the fuse ran on.' }, { script: 'BLAST' }], next: 'END' },
  } },

  // after the blast (the fuse burning, the revolver held): who comes out from under it
  AFTER_BLAST: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'claraWithSilas' }, next: 'with' }, { if: { flag: 'valeTurned' }, next: 'town' }, { if: { all: [{ flag: 'watchGrave' }, { notFlag: 'huntForGuest' }] }, next: 'watch' }, { next: 'lost' }] },
    watch: { who: 'note', text: 'The fall came down between me and Clara, and the dark was full of stone dust. I dug with my hands. Then a lantern in the mouth behind me: Finch, and the two men he had kept on the chapel lane since I told him what Cutler meant to do.', do: [{ set: { workingsBlown: true, finchCame: true } }], next: 'watch2' },
    watch2: { who: 'note', text: 'They had heard the blast from the grave. Between the four of us we had her out before the lamp burned down, white with dust and alive.', do: [{ log: 'Finch kept watch on the lane, as I asked. He heard the blast and helped dig Clara out.' }], next: 'cut' },
    with: { who: 'note', text: 'I had Clara down behind the chest when the fall came. The roof came down where Cutler had stood, and the chest, and the drift beyond it, and the dark was full of stone dust.', do: [{ set: { workingsBlown: true } }], next: 'with2' },
    with2: { who: 'note', text: 'When the lamp would burn again she was beside me, coughing, alive. The chest was under twenty feet of the mountain.', next: 'cut' },
    town: { who: 'note', text: 'The fall came down between me and Clara, and the dark was full of stone dust. I dug with my hands. Then there were lanterns in the mouth behind me: Vale, and twenty men from the town with picks and shovels.', do: [{ set: { workingsBlown: true, townCame: true } }], next: 'town2' },
    town2: { who: 'note', text: 'They had come up the ridge on the bell. They dug her out from behind the timbers an hour later, white with dust and alive.', do: [{ log: 'The town came up on Vale\'s bell and dug Clara out from behind the fall.' }], next: 'cut' },
    lost: { who: 'note', text: 'The fall came down between me and Clara, and the dark was full of stone dust. I dug until my hands were no use to me.', do: [{ set: { workingsBlown: true, claraLost: true } }, { char: { clara: { alive: false, location: 'THE_FALL' } } }], next: 'lost2' },
    lost2: { who: 'note', text: 'There was no one to help, and after a while there was no sound from behind the rock.', do: [{ log: 'The fall came down. Clara Mercer is behind it.' }], next: 'cut' },
    cut: { who: 'note', text: 'Cutler was in the snow outside the mouth, where the blast had thrown him. Alive. He did not try to get up when I came for him.', next: 'END' },
  } },

  // the reckoning: Clara's question (if it has not been asked), then Mercer, the payroll in his hands
  RECKONING: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'claraLost' }, next: 'fall' }, { if: { flag: 'claraAsked' }, next: 'm' }, { next: 'ask' }] },
    fall: { who: 'note', text: 'Gideon Mercer was on his knees at the new fall, pulling at the rock with his bare hands, with the bag of coin still tied to his wrist.', next: 'fall2' },
    fall2: { who: 'mercer', text: 'Clara. Clara.', next: 'fall3' },
    fall3: { who: 'note', text: 'He did not answer me when I spoke to him. He did not answer anyone, after that.', do: [{ script: 'ENDING_FALL' }], next: 'END' },
    ask: { who: 'clara', text: 'Mr. Vance. If I come down off this mountain, will you take it all the way? Even him?', do: [{ set: { claraAsked: true } }], choices: [
      choiceOf('All the way. Even him.', 'yes'),
      choiceOf('I\'ll see you safe. The rest is for the county.', 'no'),
    ] },
    yes: { who: 'clara', text: 'Then I will stand up and say what I saw.', do: [{ set: { claraTestifies: true } }, { evidence: 'T5_CLARA' }], next: 'm' },
    no: { who: 'clara', text: 'Safe. ...Yes.', next: 'm' },
    m: { branch: [{ if: { flag: 'workingsBlown' }, next: 'mb' }, { next: 'mc' }] },
    mb: { who: 'note', text: 'Gideon Mercer stood in the settling dust with one canvas bag in his hand: all that was left out of the mountain. His daughter was watching him hold it.', next: 'offer' },
    mc: { who: 'note', text: 'Gideon Mercer had not moved from the chest. In the lamplight the stencil on its lid read clear under the rust: U.S. PAYMASTER, 2ND DIV. His daughter was watching him.', do: [{ examine: 'EV5_PAYROLL' }], next: 'offer' },
    offer: { who: 'mercer', text: 'Take her down, Mister Vance. Leave me the mountain. Nobody else need die for it, and nobody in that valley will thank you for the truth.', choices: [
      choiceOf('No. You\'re coming down, and so is this.', 'take'),
      choiceOf('Go. Take it and go.', 'let'),
    ] },
    take: { branch: [{ if: PROOF, next: 'proof' }, { next: 'noproof' }] },
    proof: { who: 'note', text: 'He looked at his daughter for a long time. Then he set the bag down on the chest, and held out his hands for the rope.', do: [{ set: { mercerTaken: true } }, { log: 'Took Gideon Mercer down off the ridge with the proof.' }, { script: 'ENDING_EXPOSED' }], next: 'END' },
    noproof: { who: 'mercer', text: 'On whose word, Mister Vance? A dead man\'s book, and a stranger\'s notebook? I hold the note on every house in that valley. Bring me down, and see who stands up.', next: 'np1' },
    np1: { branch: [{ if: { flag: 'cutlerAlone' }, next: 'npAlone' }, { next: 'noproof2' }] },
    npAlone: { who: 'mercer', text: 'You stood in that town and told them Wade did it on his own account. They believed you. So will the judge.', next: 'noproof2' },
    noproof2: { who: 'note', text: 'He was right, and he knew it. Nobody I had would stand up in front of a county judge and say it.', do: [{ set: { noProof: true } }, { log: 'Had no witness who would stand up. Mercer walked down ahead of me.' }, { script: 'ENDING_BURIED' }], next: 'END' },
    let: { who: 'note', text: 'He did not thank me. He picked up the bag, and went out past his daughter into the storm without looking at her.', do: [{ set: { letMercerGo: true } }, { log: 'Let Gideon Mercer go with the gold.' }, { script: 'ENDING_BURIED' }], next: 'END' },
  } },

  // the epilogues, over black
  EPI_EXPOSED: { start: 'a', nodes: {
    a: { who: 'note', text: 'We came down off the ridge at first light: Clara, and her father between us with his hands tied in front of him, and the canvas bag on my shoulder.', next: 'b' },
    b: { branch: [{ if: { flag: 'cutlerShot' }, next: 'bs' }, { next: 'bt' }] },
    bs: { who: 'note', text: 'We left Wade Cutler where he sat. His tally book will have to speak for him.', next: 'c' },
    bt: { who: 'note', text: 'Wade Cutler walked ahead of us on a rope and did not say a word the whole way down.', next: 'c' },
    c: { branch: [{ if: { flag: 'valeTurned' }, next: 'cv' }, { next: 'd' }] },
    cv: { who: 'note', text: 'Vale\'s bell had the whole town at the foot of the ridge. They saw what we carried down. That was the point of it.', next: 'd' },
    d: { branch: [{ if: { flag: 'claraTestifies' }, next: 'dc' }, { next: 'do' }] },
    dc: { who: 'note', text: 'The pass opened on the ninth day. The county men came up on the first train, and Clara Mercer told them all of it, from the paymaster\'s chest to the back stair of the Black Ram.', next: 'e' },
    do: { who: 'note', text: 'The pass opened on the ninth day. The county men came up on the first train, and the people who had kept quiet for twenty years found, one at a time, that they had things to say.', next: 'e' },
    e: { who: 'note', text: 'They took Gideon Mercer down the mountain to be tried. The gold went back to the government that lost it, thirty years late.', next: 'f' },
    f: { who: 'note', text: 'I took the train down the day after. Nobody came to see me off but Ada Bell, who wrote down that I had gone.', next: 'END' },
  } },
  EPI_BURIED: { start: 'a', nodes: {
    a: { branch: [{ if: { flag: 'letMercerGo' }, next: 'let' }, { next: 'np' }] },
    let: { who: 'note', text: 'He went down the far side of the ridge in the storm with as much of the gold as one man and a mule can carry. Nobody in Crow\'s Hollow has seen him since.', next: 'b' },
    np: { who: 'note', text: 'He walked down the ridge ahead of me as if he owned it, which he did. What I had would not have stood up in front of a county judge with Gideon Mercer\'s lawyers on the other side.', next: 'b' },
    b: { who: 'note', text: 'Clara Mercer left the valley when the pass opened, on the first train down. She did not say where. Somebody had paid for her ticket in gold coin.', next: 'c' },
    c: { who: 'note', text: 'I wrote it all down for the county. They filed it. Hale has a stone, the Pale Figure has a story, and the story is the one people will go on telling.', next: 'END' },
  } },
  EPI_FALL: { start: 'a', nodes: {
    a: { who: 'note', text: 'They never opened the fall. The money is still in there, with Amos Pell and four other men, and with Clara Mercer, who sent for me.', next: 'b' },
    b: { who: 'note', text: 'Gideon Mercer was tried at the county seat in the spring, and said nothing at his trial, or anywhere else.', next: 'c' },
    c: { who: 'note', text: 'I took the train down when the pass opened. Her telegram is still in my coat. I have not been able to throw it away.', next: 'END' },
  } },
});

export const SPEAKERS = {
  silas: 'SILAS VANCE', finch: 'CONSTABLE FINCH', gable: 'MRS. GABLE', conductor: 'CONDUCTOR', note: null,
  rusk: 'JONAH RUSK', vale: 'REVEREND VALE', ada: 'ADA BELL', mercer: 'GIDEON MERCER', cutler: 'WADE CUTLER', clara: 'CLARA MERCER',
};
