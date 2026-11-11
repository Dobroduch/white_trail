// Dialogue runner: walks data-driven nodes, applies effects, filters choices by condition.
// Presentation (typewriter, layout) lives in ui/dialogueView.js.
import { DIALOGUE } from '../data/dialogue.js';
import { test, apply } from './storyState.js';

export class DialogueRunner {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.lines = null;
  }

  // Start a scripted conversation by id.
  start(id, { speakerNpc = null, onEnd = null } = {}) {
    const d = DIALOGUE[id];
    if (!d) { console.error(`[dialogue] unknown dialogue "${id}"`); onEnd && onEnd(); return; }
    this.id = id;
    this.def = d;
    this.active = true;
    this.speakerNpc = speakerNpc;
    this.onEnd = onEnd;
    this.lastText = null;
    this.lastWho = null;
    this.pendingScripts = [];
    this.visit(d.start);
  }

  // Ad-hoc sequence of lines (examinations, barks that need a box).
  startLines(lines, { who = 'note', onEnd = null } = {}) {
    const nodes = {};
    lines.forEach((t, i) => {
      const line = typeof t === 'string' ? { who, text: t } : t;
      nodes['l' + i] = { who: line.who || who, text: line.text, next: i < lines.length - 1 ? 'l' + (i + 1) : 'END' };
    });
    this.id = '_lines';
    this.def = { start: 'l0', nodes };
    this.active = true;
    this.speakerNpc = null;
    this.onEnd = onEnd;
    this.lastText = null;
    this.pendingScripts = [];
    this.visit('l0');
  }

  visit(nodeId) {
    const s = this.game.state;
    for (let guard = 0; guard < 20; guard++) {
      if (!nodeId || nodeId === 'END') return this.finish();
      const node = this.def.nodes[nodeId];
      if (!node) { console.error(`[dialogue] missing node ${this.id}.${nodeId}`); return this.finish(); }
      if (node.branch) {
        const b = node.branch.find((br) => test(br.if, s));
        nodeId = b ? b.next : 'END';
        continue;
      }
      const key = this.id + '.' + nodeId;
      const revisit = !!s.seen[key];
      s.seen[key] = true;
      const results = apply(node.do, s);
      this.game.handleEffects(results, this.pendingScripts);
      this.nodeId = nodeId;
      this.node = node;
      let text = node.text;
      if (revisit && node.again) text = node.again;
      if (text) { this.lastText = text; this.lastWho = node.who || 'note'; this.freshText = true; } else this.freshText = false;
      this.choices = node.choices ? node.choices.filter((c) => {
        if (c.once && s.seen[this.id + '.' + c.next]) return false;
        return test(c.if, s);
      }) : null;
      if (!text && !this.choices) { nodeId = node.next; continue; }
      this.game.onDialogueNode && this.game.onDialogueNode(this);
      return;
    }
    console.error('[dialogue] branch loop guard hit');
    this.finish();
  }

  advance() {
    if (!this.active || this.choices) return;
    this.visit(this.node.next);
  }

  choose(i) {
    if (!this.active || !this.choices || !this.choices[i]) return;
    const c = this.choices[i];
    this.lastText = null;
    this.visit(c.next);
  }

  finish() {
    this.active = false;
    this.node = null;
    this.choices = null;
    const cb = this.onEnd;
    const scripts = this.pendingScripts || [];
    this.onEnd = null;
    this.game.onDialogueEnd && this.game.onDialogueEnd();
    cb && cb();
    for (const sc of scripts) this.game.runScript(sc);
  }
}
