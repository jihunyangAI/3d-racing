import test from 'node:test';
import assert from 'node:assert/strict';
import { raceMaps,getRaceMap } from '../src/maps/index.ts';
import { createTrack } from '../src/track.ts';
import { validateMaps } from '../src/maps/validate.ts';
import { crossedCheckpoints } from '../src/checkpoints.ts';
test('registered circuits differ and have closed finite roads',()=>{assert.equal(new Set(raceMaps.map(m=>m.id)).size,raceMaps.length);const tracks=raceMaps.map(createTrack);assert(Math.abs(tracks[0].length-tracks[1].length)>20);for(const track of tracks){assert(track.curve.getPointAt(0).distanceTo(track.curve.getPointAt(1))<.001);for(let i=0;i<100;i++)assert(Number.isFinite(track.curvature(i/100)));}assert.equal(getRaceMap('missing').id,'coastal');});
test('bad contributor maps fail early',()=>{const m=raceMaps[0];for(const bad of [{...m,id:'Bad ID'},{...m,laps:0},{...m,controlPoints:[[0,0],[0,0],[0,0],[0,0]]},{...m,checkpoints:[.4,.2]},{...m,checkpoints:[NaN]}])assert.throws(()=>validateMaps([bad]));assert.throws(()=>validateMaps([m,m]));});
test('checkpoint score is once per gate per lap across skipped frames and wrap',()=>{const set=new Set();assert.equal(crossedCheckpoints(0,.45,[.2,.4,.8],set,3).length,2);assert.equal(crossedCheckpoints(.1,.45,[.2,.4,.8],set,3).length,0);assert.equal(crossedCheckpoints(.45,1.25,[.2,.4,.8],set,3).length,2);assert.equal(crossedCheckpoints(1.25,1.1,[.2,.4,.8],set,3).length,0);assert.equal(crossedCheckpoints(2.7,4,[.2,.4,.8],set,3).length,1);set.clear();assert.equal(crossedCheckpoints(0,.25,[.2,.4,.8],set,3).length,1);});
