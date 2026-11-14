// Browser test harness (development only). Drives the fixed-step simulation deterministically,
// independent of requestAnimationFrame. Usage in the devtools console:
//   (await import('/tools/harness.js')).install();  T.press('KeyE'); T.walkTo(300); T.info();
//
// Touch mode (T.useTouch(true)): every key press the harness makes goes through the on-screen touch controls
// instead (src/ui/touchControls.js): it finds the VISIBLE button for that action and dispatches real
// pointerdown / pointerup events (pointerType 'touch') on it; dialogue choices and dialogue advancing are taps
// on the canvas at the choice / text. A key with no visible touch equivalent is recorded in T.touchMisses, so a
// touch-only playthrough proves every action it needed has a touch control. Walking holds the walk pads.
import { UI_OX, UI_OY, UI_DEV } from '/src/engine/display.js';

export function install() {
  const G = () => window.TWT;
  // keyboard code -> the touch control's code
  const TOUCH_CODE = { KeyD: 'ArrowRight', KeyA: 'ArrowLeft', KeyW: 'ArrowUp', KeyS: 'ArrowDown', Tab: 'KeyN', KeyJ: 'KeyN', Enter: 'KeyE', Space: 'KeyE', NumpadEnter: 'KeyE', Backspace: 'Escape' };
  const ptr = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }));
  const visibleButton = (code) => [...document.querySelectorAll('#touch .tc.on button')].find((b) => b.dataset.code === code && b.offsetParent && b.style.display !== 'none' && !b.disabled);
  const uiToClient = (ux, uy) => {
    const c = G().display.canvas, r = c.getBoundingClientRect(), k = r.width / c.width;
    return { x: r.left + (ux + UI_OX) * UI_DEV * k, y: r.top + (uy + UI_OY) * UI_DEV * k };
  };
  const tapCanvas = (x, y) => { const c = G().display.canvas; ptr(c, 'pointerdown', x, y); ptr(window, 'pointerup', x, y); };
  const T = {
    touch: false,
    touchMisses: [],
    touchTaps: 0,
    useTouch(on = true) { T.touch = !!on; T.touchMisses = []; T.touchTaps = 0; G().render(); return T.touch; },
    uiToClient,
    // one key press, through the keyboard path or (touch mode) the visible touch control
    key(code) {
      const g = G();
      if (!T.touch) { g.input.pressedCodes.add(code); g.input.anyPressed = true; return true; }
      g.render(); // the touch layer shows the controls for what is on screen now
      const m = /^Digit([1-5])$/.exec(code);
      if (m && g.dialogue.active && g.dialogue.choices) {
        const r = (g.dialogueView.choiceRects || [])[Number(m[1]) - 1];
        if (r) { const p = uiToClient(r.x + r.w / 2, r.y + r.h / 2); tapCanvas(p.x, p.y); T.touchTaps++; return true; }
      }
      const tc = TOUCH_CODE[code] || code;
      // the notebook has no ◀ ▶ buttons: a finger taps the neighbouring tab on the page
      const ov = g.overlay;
      if ((tc === 'ArrowLeft' || tc === 'ArrowRight') && ov && ov.panelKind === 'notebook' && g.notebook.tabRects) {
        const n = g.notebook.tabRects.length, t = (g.notebook.tab + (tc === 'ArrowRight' ? 1 : -1) + n) % n;
        const r = g.notebook.tabRects[t], p = uiToClient(r.x + r.w / 2, r.y + r.h / 2);
        tapCanvas(p.x, p.y); T.touchTaps++; return true;
      }
      // in the notebook, "E" is a second tap on the selected line (or mind-map node)
      if (tc === 'KeyE' && ov && ov.panelKind === 'notebook') {
        const r = (g.notebook.rowRects || []).find((x) => x.i === g.notebook.sel);
        if (r) { const p = uiToClient(r.x + r.w / 2, r.y + r.h / 2); tapCanvas(p.x, p.y); T.touchTaps++; return true; }
      }
      const b = visibleButton(tc);
      if (b) { const r = b.getBoundingClientRect(); ptr(b, 'pointerdown', r.x + r.width / 2, r.y + r.height / 2); ptr(b, 'pointerup', r.x + r.width / 2, r.y + r.height / 2); T.touchTaps++; return true; }
      // dialogue text and the title's "tap to begin": a tap on the canvas (on the dialogue box, top centre)
      if ((tc === 'KeyE' && g.dialogue.active && !g.dialogue.choices) || (g.mode === 'title' && document.documentElement.dataset.tc === 'none')) {
        const p = uiToClient(160, 30); tapCanvas(p.x, p.y); T.touchTaps++; return true;
      }
      T.touchMisses.push(code + ' @' + (document.documentElement.dataset.tc || '?'));
      return false;
    },
    // hold a key down (walk) / let it go
    down(code) {
      const g = G();
      if (!T.touch) { g.input.down.add(code); return; }
      if (T.held === code) return;
      T.up();
      g.render();
      const b = visibleButton(TOUCH_CODE[code] || code);
      if (!b) { T.touchMisses.push('hold ' + code + ' @' + document.documentElement.dataset.tc); return; }
      const r = b.getBoundingClientRect();
      ptr(b, 'pointerdown', r.x + r.width / 2, r.y + r.height / 2);
      T.held = code; T.heldBtn = b;
    },
    up(code) {
      const g = G();
      if (!T.touch) { if (code) g.input.down.delete(code); return; }
      if (!T.heldBtn) return;
      const r = T.heldBtn.getBoundingClientRect();
      ptr(T.heldBtn, 'pointerup', r.x + r.width / 2, r.y + r.height / 2);
      // a release is immediate for the harness's frame counting
      const c = TOUCH_CODE[T.held] || T.held;
      g.input.pendingUp.delete(c); g.input.down.delete(c);
      T.held = null; T.heldBtn = null;
    },
    step(n = 1) { for (let i = 0; i < n; i++) G().update(1 / 60); G().render(); return T.info(); },
    press(code, after = 3) { T.key(code); return T.step(after); },
    hold(code, frames) { T.down(code); for (let i = 0; i < frames; i++) G().update(1 / 60); T.up(code); G().render(); return T.info(); },
    // walk toward a world x using real input (respects bounds, triggers events/exits)
    walkTo(x, maxFrames = 1200) {
      const g = G();
      for (let i = 0; i < maxFrames; i++) {
        const d = x - g.player.x;
        if (Math.abs(d) < 1.5 || !g.canMove()) break;
        const code = d > 0 ? 'KeyD' : 'KeyA';
        if (T.touch) { T.down(code); g.update(1 / 60); continue; }
        g.input.down.add(code); g.update(1 / 60); g.input.down.delete(code);
      }
      if (T.touch) T.up();
      g.render();
      return T.info();
    },
    // advance through dialogue/cutscenes, choosing choice index `pick` (or picks list) when asked
    talkThrough(picks = [], maxFrames = 3000) {
      const g = G();
      const queue = Array.isArray(picks) ? picks.slice() : [picks];
      for (let i = 0; i < maxFrames; i++) {
        if (g.overlay && g.overlay.constructor.name === 'DocumentView') { if (i % 4 === 0) T.key('KeyE'); }
        else if (g.dialogue.active) {
          if (g.dialogue.choices && g.dialogueView.shown >= (g.dialogue.lastText || '').length) {
            const p = queue.length ? queue.shift() : g.dialogue.choices.length - 1;
            T.key(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'][p]);
          } else if (i % 4 === 0) T.key('KeyE');
        } else if (i > 8 && !g.cutsceneBlocking() && !g.transition && !g.overlay) break;
        g.update(1 / 60);
      }
      for (let i = 0; i < 16; i++) g.update(1 / 60); // let post-dialogue cooldowns settle
      g.render();
      return T.info();
    },
    // Full scripted playthrough of the vertical slice using real inputs. Returns a report.
    // Notebook must be open on the Deductions page: mark statement a, then b (real Up/Down/E input).
    deduce(a, b) {
      const nb = G().notebook;
      for (const id of [a, b]) {
        const i = nb.listFor(nb.tab).indexOf('S:' + id);
        if (i < 0) return false;
        for (let k = 0; k < 60 && nb.sel !== i; k++) T.press(nb.sel < i ? 'ArrowDown' : 'ArrowUp', 1);
        T.press('KeyE', 1);
      }
      return true;
    },
    // In the case review (top overlay): set each reading the conclusion rests on, then commit and confirm.
    decide(cid) {
      const g = G();
      const ov = () => g.overlay;
      const goRow = (pred) => { for (let k = 0; k < 40; k++) { const rows = ov().rows(); const i = rows.findIndex(pred); if (i < 0) return false; if (ov().sel === i) return true; T.press('ArrowDown', 1); } return false; };
      const row = ov().rows().find((r) => r.kind === 'c' && r.id === cid);
      if (!row) return false;
      for (const req of row.row.rows) {
        if (!goRow((r) => r.kind === 'd' && r.id === req.did)) return false;
        for (let k = 0; k < 3 && g.state.readings[req.did] !== req.key; k++) T.press('ArrowRight', 1);
      }
      goRow((r) => r.kind === 'c' && r.id === cid);
      T.press('KeyE', 2);
      if (g.overlay && g.overlay.constructor.name === 'Confirm') { T.press('ArrowUp', 1); T.press('KeyE', 2); }
      return Object.values(g.state.cases || {}).some((k) => k.conclusion === cid);
    },
    leaveOpen() {
      const g = G();
      for (let k = 0; k < 40 && g.overlay.rows()[g.overlay.sel].kind !== 'leave'; k++) T.press('ArrowDown', 1);
      T.press('KeyE', 2);
      if (g.overlay && g.overlay.constructor.name === 'Confirm') { T.press('ArrowUp', 1); T.press('KeyE', 2); }
    },
    fullRun({ finchKind = true, examineAll = true, conclusion = null, pit = false } = {}) {
      const g = G();
      const rep = { steps: [], errors: [] };
      const check = (name, cond) => { rep.steps.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) rep.errors.push(name); };
      const look = (x, times = 2) => { T.walkTo(x); for (let k = 0; k < times; k++) { if (!g.prompt) break; T.press('KeyE'); T.talkThrough(); } };
      const pickBy = (fn) => { // drive one dialogue with a chooser over choice texts
        for (let i = 0; i < 4000 && (g.dialogue.active || g.cutsceneBlocking()); i++) {
          if (g.dialogue.active && g.dialogue.choices && g.dialogueView.shown >= (g.dialogue.lastText || '').length) {
            const idx = Math.max(0, fn(g.dialogue.choices.map((c) => c.text)));
            T.key('Digit' + (idx + 1));
          } else if (g.dialogue.active && i % 5 === 0) T.key('KeyE');
          g.update(1 / 60);
        }
        for (let i = 0; i < 16; i++) g.update(1 / 60);
      };
      g.newGame();
      T.talkThrough([], 3000);
      check('intro hands control back at the station', g.scene.id === 'STATION' && g.canMove() && g.state.flags.introDone);
      T.walkTo(554); T.hold('KeyD', 20); T.step(5); T.talkThrough();
      check('cannot leave before the conductor', g.scene.id === 'STATION');
      if (examineAll) for (const x of [300, 354, 429, 457]) look(x, 1);
      T.walkTo(214); T.press('KeyE'); pickBy((c) => c.length - 1);
      T.step(200);
      check('conductor statement recorded', !!g.state.evidence.T_CONDUCTOR_PASS);
      check('train departed', g.state.flags.trainDeparted);
      T.walkTo(554); T.hold('KeyD', 20); T.step(70);
      check('reached the road', g.scene.id === 'ROAD');
      T.press('KeyF');
      check('lantern lit', g.state.lanternOn);
      look(728, 2);
      T.walkTo(796); T.hold('KeyD', 20); T.step(70);
      check('reached the village', g.scene.id === 'VILLAGE');
      T.walkTo(300);
      pickBy((c) => {
        const order = ['Tell me about the sheriff.', 'Your telegram', 'What are people', "That'll do", finchKind ? 'You look like' : "You're holding"];
        for (const o of order) { const i = c.findIndex((t) => t.startsWith(o)); if (i >= 0) return i; }
        return 0;
      });
      check('met Finch', g.state.flags.metFinch && g.state.chars.finch.trust === (finchKind ? 'STEADY' : 'GUARDED'));
      T.walkTo(476); T.hold('KeyD', 20); T.step(70);
      check('walked on to the hotel forecourt', g.scene.id === 'BLACK_RAM_EXTERIOR');
      T.walkTo(320); T.press('KeyE'); T.step(80); T.talkThrough();
      check('entered the Black Ram', g.scene.id === 'PARLOR');
      T.walkTo(258); T.press('KeyE'); pickBy((c) => c.findIndex((t) => t.startsWith('Did you know')) >= 0 ? c.findIndex((t) => t.startsWith('Did you know')) : c.length - 1);
      check('got the key to Room 4', g.state.items.includes('ROOM4_KEY'));
      look(303, 1);
      T.walkTo(140); T.press('KeyE'); pickBy(() => 0);
      T.walkTo(352); T.press('KeyE'); T.step(80);
      check('entered Room 4', g.scene.id === 'ROOM4');
      look(187, 2);
      check('scrubbed boards observed and examined', g.state.evidence.HOTEL_ROOM4_BOARDS && g.state.evidence.HOTEL_ROOM4_BOARDS.examined);
      T.walkTo(24); T.press('KeyE'); T.step(80);
      T.walkTo(258); T.press('KeyE');
      pickBy((c) => { for (const o of ['Someone scrubbed', 'Say nothing', 'Your register', 'Goodnight']) { const i = c.findIndex((t) => t.startsWith(o)); if (i >= 0) return i; } return c.length - 1; });
      check('Gable questioned about Room 4 and the register', g.state.flags.askedGableAboutRoom4 && g.state.flags.confrontedGableRegister);
      T.walkTo(352); T.press('KeyE'); T.step(80);
      T.walkTo(244); T.press('KeyE'); pickBy(() => 0);
      for (let i = 0; i < 1200 && g.cutscene; i++) { if (g.dialogue.active && i % 6 === 0) T.key('KeyE'); g.update(1 / 60); }
      T.talkThrough();
      check('02:15 — night phase after the scream', g.state.phase === 'NIGHT' && g.state.flags.heardScream);
      const evBefore = Object.keys(g.state.evidence).length;
      T.walkTo(24); T.press('KeyE'); T.step(80); pickBy(() => 1);
      check('Mrs. Gable unbolts the door', g.state.flags.gableUnbolted);
      T.walkTo(32); T.press('KeyE'); T.step(80);
      check('back on the street at night', g.scene.id === 'BLACK_RAM_EXTERIOR' && g.state.phase === 'NIGHT');
      T.walkTo(630); T.hold('KeyD', 20); T.step(80);
      check('reached the creek path', g.scene.id === 'CREEK');
      look(116, 2);
      T.walkTo(648); T.press('KeyE'); T.step(80);
      check('reached the sawmill', g.scene.id === 'SAWMILL');
      T.walkTo(310); T.talkThrough();
      check('found Sheriff Hale', g.state.flags.foundSheriffBody);
      for (const x of examineAll ? [292, 256, 350, 371] : [292, 256, 350, 371]) look(x, 2);
      for (let i = 0; i < 600 && !g.state.flags.ridgeLightSeen; i++) { if (g.dialogue.active && i % 6 === 0) T.key('KeyE'); g.update(1 / 60); }
      T.talkThrough();
      check('ridge light beat played once', g.state.flags.ridgeLightSeen && g.state.eventsDone.filter((e) => e === 'RIDGE_LIGHT').length === 1);
      if (examineAll) for (const x of [392, 464, 494]) look(x, 2);
      const sawmill = Object.keys(g.state.evidence).filter((k) => k.startsWith('SAWMILL')).length;
      check(`sawmill clues recorded (${sawmill})`, sawmill >= 4);
      // re-entry must not duplicate anything
      const n0 = Object.keys(g.state.evidence).length, c0 = g.state.evidenceCount;
      look(292, 2); look(350, 2);
      check('re-examining does not duplicate evidence', Object.keys(g.state.evidence).length === n0 && g.state.evidenceCount === c0);
      // the optional wheel pit (its entrance exists only after the furrow's closer look, or Mrs. Gable's word)
      if (pit) {
        check('the wheel pit is known before going down', !!g.state.flags.knowsWheelPit);
        T.walkTo(437); T.step(30); T.talkThrough();
        check('the pit entrance is offered once known', g.prompt && /Wheel pit/.test(g.prompt.label));
        T.press('KeyE'); T.step(80);
        check('climbed down into the wheel pit', g.scene.id === 'WHEEL_PIT');
        T.talkThrough(); look(144, 2);
        check('the hollow in the ice recorded and examined', g.state.evidence.PIT_HOLLOW && g.state.evidence.PIT_HOLLOW.examined);
        T.walkTo(44); T.press('KeyE'); T.step(80);
        check('back up in the mill yard', g.scene.id === 'SAWMILL');
      }
      // deduction via the notebook (key statements, not raw records)
      T.press('Tab');
      const nb = g.notebook; while (nb.tab !== 4) T.press('ArrowRight', 1);
      if (g.state.evidence.SAWMILL_BODY) {
        T.deduce('S_LITTLE_BLOOD', 'S_HOISTED');
        check('deduction formed: he did not bleed here', g.state.deductions.includes('D_SCENE_ARRANGED'));
        T.deduce('S_LITTLE_BLOOD', 'S_LEDGER');
        check('a wrong pair is refused without a hint', nb.result && !nb.result.ok && g.state.deductions.length === 1);
      } else {
        // fairness: without the body examined, the deduction is not on offer at all
        check('no deduction without its evidence', !nb.listFor(nb.tab).includes('S:S_LITTLE_BLOOD') && !g.state.deductions.includes('D_SCENE_ARRANGED'));
      }
      if (conclusion) {
        for (const [a, b] of [['S_OLD_BLOOD', 'S_MISSING'], ['S_MARKS', 'S_LEDGER'], ['S_SCREAM', 'S_RIDGE']]) T.deduce(a, b);
        if (pit) T.deduce('S_PIT', 'S_FROM_CREEK');
        check('the four Hale deductions formed', ['D_SCENE_ARRANGED', 'D_LONG_DEAD', 'D_SAME_COUNTING', 'D_THE_SCREAM'].every((d) => g.state.deductions.includes(d)));
      }
      T.press('Escape');
      // leaving the mill: decide (commit) or leave it open, then the aftermath at first light, then the end card
      T.walkTo(6); T.hold('KeyA', 20); T.step(20);
      check('asked what I make of it before leaving', g.dialogue.active && g.dialogue.id === 'CASE_PROMPT');
      if (conclusion) {
        T.talkThrough([0]); // "Settle it now."
        check('the case review opens before leaving', g.overlay && g.overlay.constructor.name === 'CaseReview' && g.overlay.prompt);
        T.decide(conclusion);
      } else T.talkThrough(); // the last choice: go back up and leave it open
      check(conclusion ? `committed to ${conclusion}` : 'left the case open', conclusion ? g.state.cases.HALE && g.state.cases.HALE.conclusion === conclusion : !g.state.cases.HALE);
      if (g.overlay && g.overlay.constructor.name === 'CaseReview') T.press('Escape', 2);
      for (let i = 0; i < 600 && !g.dialogue.active; i++) g.update(1 / 60);
      rep.aftermath = g.dialogue.id;
      T.talkThrough([], 4000); T.step(60);
      check('aftermath played once', !!g.state.flags.aftermath_HALE);
      check('slice end card shown', g.overlay && g.overlay.constructor.name === 'EndCard' && g.state.flags.sliceComplete);
      check('no player-caused deaths, no shots', g.state.consequences.shotsFired === 0 && g.state.consequences.peopleKilled.length === 0);
      check('revolver untouched (3 of 6)', g.state.revolver.loaded === 3);
      check('no runtime errors', g.errorsSeen.size === 0);
      rep.evidence = Object.keys(g.state.evidence).length;
      rep.passed = rep.errors.length === 0;
      void evBefore;
      return rep;
    },
    // Chapter 2, played on from the first night's end card with real inputs (or touch, after T.useTouch(true)). Opts:
    //   conclusion: 'C2_BLAST' | 'C2_WAR' | 'C2_RITE' | null (keep it to myself)   thorough: also the optional finds/talks
    fullRun2({ conclusion = 'C2_BLAST', thorough = true } = {}) {
      const g = G();
      const rep = { steps: [], errors: [] };
      T.lastRep = rep;
      const check = (name, cond) => { rep.steps.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) rep.errors.push(name); };
      const look = (x, times = 2) => { T.walkTo(x); for (let k = 0; k < times; k++) { if (!g.prompt) break; T.press('KeyE'); T.talkThrough(); } };
      const talk = (x, order) => { // walk up, speak, then choose by the start of each choice text, in order; the last choice ends it
        T.walkTo(x); if (!g.prompt) return false;
        T.press('KeyE');
        for (let i = 0; i < 4000 && (g.dialogue.active || g.cutsceneBlocking()); i++) {
          if (g.dialogue.active && g.dialogue.choices && g.dialogueView.shown >= (g.dialogue.lastText || '').length) {
            const c = g.dialogue.choices.map((x) => x.text);
            let idx = -1;
            for (const o of order) { idx = c.findIndex((t) => t.startsWith(o)); if (idx >= 0) break; }
            T.key('Digit' + ((idx >= 0 ? idx : c.length - 1) + 1));
          } else if (g.dialogue.active && i % 5 === 0) T.key('KeyE');
          g.update(1 / 60);
        }
        for (let i = 0; i < 16; i++) g.update(1 / 60);
        return true;
      };
      const leave = (dir, frames = 20) => { T.hold(dir === 'right' ? 'KeyD' : 'KeyA', frames); T.step(80); T.talkThrough(); };
      const door = (x) => { T.walkTo(x); T.press('KeyE'); T.step(80); T.talkThrough(); };
      const s = g.state;
      const before = { items: s.items.slice(), evidence: Object.keys(s.evidence).length, hale: s.cases.HALE ? s.cases.HALE.conclusion : null, trust: s.chars.finch.trust };
      // ---- from the first night's end card straight on into the second day ----
      check('first night\'s end card offers the second day', g.overlay && g.overlay.constructor.name === 'EndCard' && g.overlay.chapter === 1 && g.overlay.items[0].act === 'nextChapter');
      for (let i = 0; i < 150; i++) g.update(1 / 60); // the card's menu appears after 2 s
      T.press('KeyE', 3);
      for (let i = 0; i < 900 && !g.dialogue.active; i++) g.update(1 / 60);
      T.talkThrough([], 3000);
      check('day two opens on the hotel forecourt, in daylight', g.scene.id === 'BLACK_RAM_EXTERIOR' && s.phase === 'DAY' && s.time.day === 2 && g.canMove());
      check('nothing carried or recorded was lost', before.items.every((i) => s.items.includes(i)) && Object.keys(s.evidence).length >= before.evidence);
      check('the first night\'s decision stands', (s.cases.HALE ? s.cases.HALE.conclusion : null) === before.hale && s.flags.sliceComplete && s.flags.aftermath_HALE);
      check('the first night\'s scripted beats do not replay', s.eventsDone.filter((e) => e === 'RIDGE_LIGHT').length <= 1 && !g.npcs.some((n) => n.id === 'finch' && n.dialogue === 'FINCH_MEET'));
      // ---- Main Street: Finch by day ----
      T.walkTo(6); leave('left');
      check('west to Main Street', g.scene.id === 'VILLAGE');
      if (before.trust !== 'COLD') {
        talk(100, ['What did Hale have', 'Who in this town wears', 'Who keeps the telegraph', 'Where does the lane', 'That\'ll do']);
        check('Finch says where Ada Bell is, and where the lane goes', s.flags.knowsAda && s.flags.knowsLane);
      } else { talk(100, []); check('Finch, cold, gives nothing', !s.flags.knowsAda); }
      // ---- Rusk's store ----
      door(197);
      check('into Rusk\'s store', g.scene.id === 'RUSK_STORE');
      look(159, 2);
      check('the account book: the scraped entry', s.evidence.STORE_LEDGER && s.evidence.STORE_LEDGER.examined);
      look(60, 1); look(293, 2);
      check('the empty powder crate, stencilled', s.evidence.STORE_CRATE && s.evidence.STORE_CRATE.examined);
      if (thorough) look(123, 1);
      talk(229, ['Then you want this settled', 'Your last freight', 'The book says lamp oil', 'Did Sheriff Hale', 'Do you sell riding', 'What was in the long', 'That\'s all']);
      check('Rusk on the freight', !!s.evidence.T_RUSK_FREIGHT);
      door(21);
      check('back on Main Street', g.scene.id === 'VILLAGE');
      // ---- the chapel and the graves ----
      door(373);
      check('up the chapel lane to the graves', g.scene.id === 'GRAVEYARD');
      talk(139, ['Tell me about the Pale', 'Good day']);
      check('Vale on the Pale Figure', !!s.evidence.T_VALE_FIGURE);
      look(325, 1); look(360, 2);
      check('the disturbed grave opened: powder, fuse, caps', s.evidence.GRAVE_DISTURBED && s.evidence.GRAVE_DISTURBED.examined && s.flags.graveOpened);
      check('the opened grave is drawn', g.props.some((p) => p.id === 'graveOpen'));
      look(360, 2);
      check('what was buried: new paper, old jacket', s.evidence.GRAVE_CACHE && s.evidence.GRAVE_CACHE.examined);
      look(403, 1);
      check('riding-boot prints by the fence', !!s.evidence.GRAVE_PRINTS);
      if (thorough) talk(139, ['Who was Amos Pell', 'One of your graves', 'Good day']);
      T.walkTo(506); leave('right');
      check('up the path to the telegraph tower', g.scene.id === 'TELEGRAPH');
      // ---- the telegraph tower ----
      talk(235, ['When did the line', 'Can you mend', 'You sent my telegram', 'That\'s all']);
      check('Ada Bell on the dead line', !!s.evidence.T_ADA_LINE);
      look(279, 1); look(316, 2);
      check('the wire was cut, not snapped', s.evidence.TOWER_WIRE && s.evidence.TOWER_WIRE.examined && !!s.evidence.TOWER_SOOT);
      if (thorough) look(360, 1);
      for (let i = 0; i < 400 && !s.flags.ch2DuskReady; i++) g.update(1 / 60);
      T.talkThrough();
      check('the light starts to go once the day\'s finds are made', s.flags.ch2DuskReady && s.time.h >= 16);
      T.walkTo(440); T.hold('KeyD', 20); T.step(20); T.talkThrough();
      check('the ridge path onward is closed for now', g.scene.id === 'TELEGRAPH');
      // ---- the notebook: the second question ----
      T.press('Tab');
      const nb = g.notebook; for (let k = 0; k < 10 && nb.tab !== 4; k++) T.press('ArrowRight', 1);
      for (let k = 0; k < 4 && nb.q !== 'Q_ORDER'; k++) T.press('KeyQ', 1);
      check('the second question is on the Deductions page', nb.q === 'Q_ORDER');
      const pairs = [['S2_FREIGHT', 'S2_COIN'], ['S2_CACHE', 'S2_CRATE'], ['S2_WIRE', 'S2_LINE_DEAD'], ['S2_SOOT', s.flags.ridgeLightSeen ? 'S2_WATCHER' : 'S2_FIGURE'], ['S2_HEELS', 'S2_MILL_HEELS'], ['S2_HALE_ASKED', 'S2_FREIGHT']];
      for (const [a, b] of pairs) T.deduce(a, b);
      check('the three deductions with readings formed', ['D2_GRAVE_POWDER', 'D2_CUT_OFF', 'D2_TOWER_LIGHT'].every((d) => s.deductions.includes(d)));
      T.press('Escape');
      // ---- back down to the Black Ram at dusk ----
      T.walkTo(6); leave('left');
      check('back down to the graves', g.scene.id === 'GRAVEYARD');
      T.walkTo(6); leave('left');
      check('back down to Main Street', g.scene.id === 'VILLAGE');
      T.walkTo(474); leave('right');
      check('back to the hotel forecourt', g.scene.id === 'BLACK_RAM_EXTERIOR');
      T.walkTo(320); T.press('KeyE'); T.step(20);
      check('at the door: asked what today adds up to', g.dialogue.active && g.dialogue.id === 'CASE_PROMPT_ORDER');
      if (conclusion) {
        T.talkThrough([0]);
        check('the case review opens', g.overlay && g.overlay.constructor.name === 'CaseReview');
        T.decide(conclusion);
      } else T.talkThrough([2]);
      check(conclusion ? `committed to ${conclusion}` : 'kept it to myself', conclusion ? s.cases.ORDER && s.cases.ORDER.conclusion === conclusion : !s.cases.ORDER);
      if (g.overlay && g.overlay.constructor.name === 'CaseReview') T.press('Escape', 2);
      for (let i = 0; i < 600 && !g.dialogue.active; i++) g.update(1 / 60);
      rep.aftermath = g.dialogue.id;
      T.step(100); // the card has gone and the parlor fades in under the conversation
      check('supper with Finch is seen, in the parlor, not over a black screen', g.scene.id === 'PARLOR' && !g.card && g.fade.v < 0.05 && g.npcs.some((n) => n.id === 'finch' && !n.hidden) && g.props.some((p) => p.id === 'fireSupper'));
      T.talkThrough([], 4000); T.step(60);
      check('supper with Finch played once', !!s.flags.aftermath_ORDER);
      check('the second day\'s end card', g.overlay && g.overlay.constructor.name === 'EndCard' && g.overlay.chapter === 2 && s.flags.chapter2Complete);
      check('the first case is untouched', (s.cases.HALE ? s.cases.HALE.conclusion : null) === before.hale);
      check('no shots, no deaths', s.consequences.shotsFired === 0 && s.consequences.peopleKilled.length === 0);
      check('no runtime errors', g.errorsSeen.size === 0);
      rep.passed = rep.errors.length === 0;
      return rep;
    },
    info() {
      const g = G();
      return {
        mode: g.mode, scene: g.scene && g.scene.id, x: Math.round(g.player.x), ov: g.overlay && g.overlay.constructor.name,
        dlg: g.dialogue.active ? ((g.dialogue.lastWho || '') + ': ' + (g.dialogue.lastText || '')).slice(0, 100) : null,
        choices: g.dialogue.choices && g.dialogue.choices.map((c) => c.text),
        cut: g.cutscene && !g.cutscene.done ? g.cutscene.id + ':' + g.cutscene.i : null,
        prompt: g.prompt && g.prompt.label, ctl: g.playerControl, fade: +g.fade.v.toFixed(2), phase: g.state.phase,
        time: `${g.state.time.h}:${String(g.state.time.m).padStart(2, '0')}`,
        evidence: Object.keys(g.state.evidence).length, lantern: g.state.lanternOn,
      };
    },
  };
  window.T = T;
  return 'harness installed';
}
