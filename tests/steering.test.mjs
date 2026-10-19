import assert from 'node:assert/strict';
import test from 'node:test';
import { drivingKey, readControls } from '../src/input.ts';
import { stepDriver } from '../src/driving.ts';
import { trackCurvature } from '../src/track.ts';
const initial = () => ({speed:50,steer:0,heading:0,lateralVelocity:0,lateral:0,yawRate:0,acceleration:0,impact:0});
function drive(events,bend) {
 const keys=new Set(events.map(drivingKey));
 let state=initial();
 for(let i=0;i<60;i++)state=stepDriver(state,readControls(keys),bend,1/60);
 return state;
}
test('arrow events retain steering authority on tight corners in both directions',()=>{
 const tightBend=trackCurvature(.4);
 for(const bend of [tightBend,-tightBend]) {
  const left=drive([{key:'ArrowLeft',code:'ArrowLeft'}],bend);
  const right=drive([{key:'ArrowRight',code:'ArrowRight'}],bend);
  const neutral=drive([],bend);
  assert(left.lateral<neutral.lateral-1,'left must move noticeably left of neutral');
  assert(right.lateral>neutral.lateral+1,'right must move noticeably right of neutral');
  assert(left.heading>0,'left must be able to turn left against the curve');
  assert(right.heading<0,'right must be able to turn right against the curve');
 }
});
test('physical A/D with Korean IME behave exactly like arrows',()=>{
 assert.deepEqual(drive([{code:'KeyA',key:'?'}],0),drive([{code:'ArrowLeft',key:'ArrowLeft'}],0));
 assert.deepEqual(drive([{code:'KeyD',key:'?'}],0),drive([{code:'ArrowRight',key:'ArrowRight'}],0));
});
test('release, opposite keys and focus clearing stop requesting steering',()=>{
 const left={code:'ArrowLeft',key:'ArrowLeft'},right={code:'ArrowRight',key:'ArrowRight'};
 const keys=new Set([drivingKey(left),drivingKey(right)]);
 assert.equal(readControls(keys).input,0);
 keys.delete(drivingKey(right));assert.equal(readControls(keys).input,-1);
 keys.delete(drivingKey(left));assert.equal(readControls(keys).input,0);
 keys.add(drivingKey(left));keys.clear();assert.equal(readControls(keys).input,0);
});
import * as THREE from 'three';
import { curve } from '../src/track.ts';

test('actual key events move and point toward the requested screen side in both cameras',()=>{
 for(const progress of [0,.15,.4,.7]) for(const mode of [0,1]) {
  const tangent=curve.getTangentAt(progress), origin=curve.getPointAt(progress);
  const normal=new THREE.Vector3(-tangent.z,0,tangent.x);
  const camera=new THREE.PerspectiveCamera(58,16/9,.1,1400);
  camera.position.copy(origin).addScaledVector(tangent,mode?-2.8:-12);
  camera.position.y=mode?2.25:5.4;
  camera.lookAt(origin.clone().addScaledVector(tangent,20).add(new THREE.Vector3(0,1.5,0)));
  camera.updateMatrixWorld();
  const project=state=>origin.clone().addScaledVector(normal,state.lateral).project(camera).x;
  const neutral=drive([],trackCurvature(progress));
  for(const [key,sign] of [['ArrowLeft',-1],['ArrowRight',1]]) {
   const state=drive([{key,code:key}],trackCurvature(progress));
   assert((project(state)-project(neutral))*sign>0,`${key} at ${progress}, camera ${mode} moves wrong screen direction`);
   const yaw=Math.atan2(tangent.x,tangent.z)+state.heading;
   const neutralYaw=Math.atan2(tangent.x,tangent.z)+neutral.heading;
   const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
   const neutralForward=new THREE.Vector3(Math.sin(neutralYaw),0,Math.cos(neutralYaw));
   assert(forward.sub(neutralForward).dot(normal)*sign>0,`${key} points wrong way`);
  }
 }
});
