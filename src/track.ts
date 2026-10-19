import * as THREE from 'three';
import { getRaceMap } from './maps/index.ts';
import type { RaceMap } from './maps/index.ts';
export function createTrack(map:RaceMap){const curve=new THREE.CatmullRomCurve3(map.controlPoints.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'catmullrom',.35);const length=curve.getLength();const curvature=(t:number)=>{const wrap=(v:number)=>((v%1)+1)%1;const a=curve.getTangentAt(wrap(t)),b=curve.getTangentAt(wrap(t+.002));return Math.atan2(a.z*b.x-a.x*b.z,a.dot(b))/(length*.002);};return {curve,length,curvature};}
const defaultTrack=createTrack(getRaceMap(null));export const curve=defaultTrack.curve;export const trackLength=defaultTrack.length;export const trackCurvature=defaultTrack.curvature;
