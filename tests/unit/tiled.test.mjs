// Unit tests for the pure Tiled → scene conversion (node --test tests/unit/).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sceneFromTiled, layerPlan, resolveUrl, props } from '../../src/world/tiled/tiledMap.js';

const P = (name, value, type = typeof value === 'number' ? 'float' : typeof value === 'boolean' ? 'bool' : 'string') => ({ name, type, value });
const map = (objects, extra = {}) => ({
  type: 'map', orientation: 'orthogonal', infinite: false, width: 60, height: 17, tilewidth: 16, tileheight: 16,
  properties: [], tilesets: [], layers: [{ type: 'objectgroup', name: 'gameplay', objects }], ...extra,
});
const spawn = { id: 1, name: 'start', type: 'spawn', x: 30, y: 225, point: true };

test('units: native px → world units (÷1.5), map size → scene width', () => {
  const { scene, errors } = sceneFromTiled(map([spawn, { id: 2, name: 'b', type: 'bounds', x: 6, y: 0, width: 948, height: 10 }]), 'T');
  assert.deepEqual(errors, []);
  assert.equal(scene.width, 640);
  assert.deepEqual(scene.bounds, [4, 636]);
  assert.deepEqual(scene.spawns.start, { x: 20, facing: 1 });
  assert.deepEqual(scene.ground, [[0, 150], [640, 150]]); // default ground line
});

test('objects: door, exit, interactable (multi-line), npc, light, prop, event zone', () => {
  const { scene, errors } = sceneFromTiled(map([
    spawn,
    { id: 2, name: 'frontDoor', type: 'door', x: 480, y: 225, point: true, properties: [P('to', 'PARLOR'), P('spawn', 'fromStreet'), P('label', 'Hotel')] },
    { id: 3, name: 'e', type: 'exit', x: 950, y: 100, width: 10, height: 100, properties: [P('to', 'VILLAGE'), P('spawn', 'fromHotel')] },
    { id: 4, name: 'sign', type: 'interactable', x: 300, y: 120, width: 30, height: 30, properties: [P('label', 'Sign'), P('lines', 'One.\n\nTwo.'), P('if', '{"flag":"x"}'), P('phase', 'NIGHT')] },
    { id: 5, name: 'finch', type: 'npc', x: 600, y: 225, point: true, properties: [P('sprite', 'finch_idle'), P('dialogue', 'FINCH_MEET'), P('lantern', true)] },
    { id: 6, name: 'l', type: 'light', x: 150, y: 150, point: true, properties: [P('r', 90), P('warm', 0.2)] },
    { id: 7, name: '', type: 'prop', x: 0, y: 0, point: true, properties: [P('propType', 'fire'), P('args', '[84,148]')] },
    { id: 8, name: 'ZONE', type: 'event', x: 300, y: 100, width: 150, height: 50, properties: [P('bark', 'Hm.')] },
  ]), 'T');
  assert.deepEqual(errors, []);
  assert.deepEqual(scene.doors[0], { id: 'frontDoor', x: 320, label: 'Hotel', verb: 'Enter', to: 'PARLOR', spawn: 'fromStreet' });
  assert.equal(scene.exits[0].side, 'right'); // inferred from position
  assert.deepEqual(scene.interactables[0].lines, ['One.', 'Two.']);
  assert.deepEqual(scene.interactables[0].if, { all: [{ flag: 'x' }, { phase: 'NIGHT' }] });
  assert.deepEqual(scene.interactables[0].x, 210);
  assert.equal(scene.npcs[0].id, 'finch');
  assert.equal(scene.npcs[0].lantern, true);
  assert.deepEqual(scene.lights[0], { x: 100, y: 100, r: 60, warm: 0.2 });
  assert.deepEqual(scene.props[0], { type: 'fire', args: [84, 148] });
  assert.deepEqual(scene.events[0].if, { all: [{}, { xMin: 200 }, { xMax: 300 }] });
});

test('phase-tagged lights produce a night override; untagged lights are shared', () => {
  const { scene } = sceneFromTiled(map([
    spawn,
    { id: 2, type: 'light', x: 0, y: 0, point: true, properties: [P('r', 30)] },
    { id: 3, type: 'light', x: 30, y: 0, point: true, properties: [P('r', 30), P('phase', 'EVENING')] },
    { id: 4, type: 'light', x: 60, y: 0, point: true, properties: [P('r', 30), P('phase', 'NIGHT')] },
  ]), 'T');
  assert.deepEqual(scene.lights.map((l) => l.x), [0, 20]);
  assert.deepEqual(scene.night.lights.map((l) => l.x), [0, 40]);
});

test('errors: infinite, too short, no spawn, bad JSON; warnings for unknown classes', () => {
  const r = sceneFromTiled(map([{ id: 1, type: 'interactable', x: 0, y: 0, point: true, properties: [P('if', '{nope')] }, { id: 2, type: 'mystery', x: 0, y: 0 }], { infinite: true, height: 10 }), 'T');
  const all = r.errors.join('\n');
  assert.match(all, /infinite/);
  assert.match(all, /at least 270/);
  assert.match(all, /no spawn/);
  assert.match(all, /invalid JSON/);
  assert.match(r.warnings.join('\n'), /unknown object class "mystery"/);
});

test('layer roles: from property, else from parallax factor; group parallax multiplies', () => {
  const plan = layerPlan({ layers: [
    { type: 'imagelayer', name: 'sky', parallaxx: 0, image: 'a.png' },
    { type: 'group', name: 'g', parallaxx: 0.5, layers: [{ type: 'imagelayer', name: 'roofs', parallaxx: 1, image: 'b.png' }] },
    { type: 'tilelayer', name: 'ground', data: [] },
    { type: 'tilelayer', name: 'win', data: [], properties: [P('role', 'glow'), P('phase', 'night')] },
    { type: 'imagelayer', name: 'fg', parallaxx: 1.2, image: 'c.png' },
    { type: 'tilelayer', name: 'hidden', visible: false, data: [] },
  ] });
  assert.deepEqual(plan.map((p) => [p.name, p.role, p.factor, p.phase]), [
    ['sky', 'back', 0, null], ['roofs', 'back', 0.5, null], ['ground', 'main', 1, null], ['win', 'glow', 1, 'NIGHT'], ['fg', 'front', 1.2, null],
  ]);
});

test('helpers: resolveUrl and props', () => {
  assert.equal(resolveUrl('assets/levels/a.tmj', 'tilesets/t.tsj'), 'assets/levels/tilesets/t.tsj');
  assert.equal(resolveUrl('assets/levels/tilesets/t.tsj', '../../export/tilesets/t.png'), 'assets/export/tilesets/t.png');
  assert.deepEqual(props({ properties: [P('a', 1)] }), { a: 1 });
});

test('the shipped Black Ram map converts cleanly', () => {
  const m = JSON.parse(readFileSync(new URL('../../assets/levels/black_ram_exterior.tmj', import.meta.url), 'utf8'));
  const { scene, errors, warnings } = sceneFromTiled(m, 'BLACK_RAM_EXTERIOR');
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.equal(scene.width, 640);
  assert.ok(scene.doors.some((d) => d.to === 'PARLOR'));
});
