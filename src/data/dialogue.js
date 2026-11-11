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
        { text: 'Someone may need help out there.', next: 'help' },
        { text: 'Go back to bed, Mrs. Gable.', next: 'bed' },
      ] },
      before: { who: 'note', text: 'The candle flame shakes, once.', next: 'before2' },
      before2: { who: 'gable', text: 'The wind makes all kinds of sounds up here.', next: 'hub' },
      help: { who: 'gable', text: 'Then go, if you\'re going. I\'ll not wait up, and I\'ll not go with you.', next: 'help2' },
      help2: { who: 'note', text: 'She draws back the bolt on the front door and steps away from it.', do: [{ set: { gableUnbolted: true } }], next: 'END' },
      bed: { who: 'gable', text: 'I intend to.', next: 'bed2' },
      bed2: { who: 'note', text: 'All the same, she draws back the bolt for me before she goes up.', do: [{ set: { gableUnbolted: true } }], next: 'END' },
    },
  },

  GABLE_NIGHT_AGAIN: {
    start: 'a',
    nodes: {
      a: { who: 'gable', text: 'The door\'s open, Mister Vance. Go, if you\'re going.', next: 'END' },
    },
  },

  BED: {
    start: 'start',
    nodes: {
      start: { branch: [{ if: { phase: 'NIGHT' }, next: 'night' }, { next: 'a' }] },
      a: { who: 'note', text: 'The storm leans on the window. Nothing more will happen tonight that I can do anything about.', choices: [
        { text: 'Turn in for the night.', next: 'sleep' },
        { text: 'Not yet.', next: 'END' },
      ] },
      sleep: { do: [{ script: 'NIGHT_0215' }], next: 'END' },
      night: { who: 'note', text: 'No sleeping now. Whatever that was, it came from outside.', next: 'END' },
    },
  },
};

export const SPEAKERS = {
  silas: 'SILAS VANCE', finch: 'CONSTABLE FINCH', gable: 'MRS. GABLE', conductor: 'CONDUCTOR', note: null,
};
