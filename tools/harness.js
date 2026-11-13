// Browser test harness (development only). Drives the fixed-step simulation deterministically,
// independent of requestAnimationFrame. Usage in the devtools console:
//   (await import('/tools/harness.js')).install();  T.press('KeyE'); T.walkTo(300); T.info();
export function install() {
  const G = () => window.TWT;
  const T = {
    step(n = 1) { for (let i = 0; i < n; i++) G().update(1 / 60); G().render(); return T.info(); },
    press(code, after = 3) { G().input.pressedCodes.add(code); G().input.anyPressed = true; return T.step(after); },
    hold(code, frames) { G().input.down.add(code); for (let i = 0; i < frames; i++) G().update(1 / 60); G().input.down.delete(code); G().render(); return T.info(); },
    // walk toward a world x using real input (respects bounds, triggers events/exits)
    walkTo(x, maxFrames = 1200) {
      const g = G();
      for (let i = 0; i < maxFrames; i++) {
        const d = x - g.player.x;
        if (Math.abs(d) < 1.5 || !g.canMove()) break;
        const code = d > 0 ? 'KeyD' : 'KeyA';
        g.input.down.add(code); g.update(1 / 60); g.input.down.delete(code);
      }
      g.render();
      return T.info();
    },
    // advance through dialogue/cutscenes, choosing choice index `pick` (or picks list) when asked
    talkThrough(picks = [], maxFrames = 3000) {
      const g = G();
      const queue = Array.isArray(picks) ? picks.slice() : [picks];
      for (let i = 0; i < maxFrames; i++) {
        if (g.overlay && g.overlay.constructor.name === 'DocumentView') { g.input.pressedCodes.add('KeyE'); }
        else if (g.dialogue.active) {
          if (g.dialogue.choices && g.dialogueView.shown >= (g.dialogue.lastText || '').length) {
            const p = queue.length ? queue.shift() : g.dialogue.choices.length - 1;
            g.input.pressedCodes.add(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'][p]);
          } else if (i % 4 === 0) g.input.pressedCodes.add('KeyE');
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
      return !!(g.state.cases.HALE && g.state.cases.HALE.conclusion === cid);
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
            g.input.pressedCodes.add('Digit' + (idx + 1));
          } else if (g.dialogue.active && i % 5 === 0) g.input.pressedCodes.add('KeyE');
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
      for (let i = 0; i < 1200 && g.cutscene; i++) { if (g.dialogue.active && i % 6 === 0) g.input.pressedCodes.add('KeyE'); g.update(1 / 60); }
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
      for (let i = 0; i < 600 && !g.state.flags.ridgeLightSeen; i++) { if (g.dialogue.active && i % 6 === 0) g.input.pressedCodes.add('KeyE'); g.update(1 / 60); }
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
