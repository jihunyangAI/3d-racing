import assert from 'node:assert/strict';
import test from 'node:test';
import {stepDriver,stepRivals,gap} from '../src/driving.ts';
const controls={gas:false,brake:false,drift:false,input:0};
const driver=(speed=0)=>({speed,steer:0,heading:0,lateralVelocity:0,lateral:0,yawRate:0,acceleration:0,impact:0});
function simulate(state,input,seconds,bend=0,hz=60){for(let i=0;i<seconds*hz;i++)state=stepDriver(state,{...controls,...input},bend,1/hz);return state;}
const rival=(overrides={})=>({progress:0,lane:0,speed:40,targetLane:0,laneVelocity:0,cruise:52,phase:0,...overrides});
const farPlayer={progress:.4,lane:0,speed:30};
test('stationary steering never moves the car sideways',()=>{const s=simulate(driver(),{input:1},5);assert.equal(s.speed,0);assert.equal(s.lateral,0);assert.equal(s.heading,0);});
test('right steering turns right in road coordinates and left mirrors it',()=>{const r=simulate(driver(25),{input:1},.5),l=simulate(driver(25),{input:-1},.5);assert(r.heading<0);assert(r.lateral>0);assert(l.lateral<0);assert(Math.abs(r.lateral+l.lateral)<1e-10);});
test('braking is stronger than coasting; throttle accelerates continuously',()=>{const s=driver(30),braked=simulate(s,{brake:true},.5),coast=simulate(s,{},.5),gas=simulate(s,{gas:true},.5);assert(braked.speed<coast.speed);assert(coast.speed<30);assert(gas.speed>30);assert(braked.speed>0);});
test('inertia persists after steering release and countersteering reverses it',()=>{const s=simulate(driver(30),{input:1},.4);const release=simulate(s,{},.1);assert(release.lateral>s.lateral);const counter=simulate(s,{input:-1},1);assert(counter.heading>0);});
test('curve curvature and grass both affect driving',()=>{const straight=simulate(driver(30),{},.5),bend=simulate(driver(30),{},.5,.015),grass=simulate({...driver(30),lateral:8},{},.5);assert(bend.lateral>straight.lateral);assert(grass.speed<straight.speed);});
test('simulation is stable across frame rates and boundaries',()=>{const a=simulate(driver(),{gas:true},10,0,30),b=simulate(driver(),{gas:true},10,0,120);assert(Math.abs(a.speed-b.speed)<.1);let s=simulate(driver(60),{gas:true,input:1,drift:true},60,.03);assert(Object.values(s).every(Number.isFinite));assert(Math.abs(s.lateral)<=10.5);assert(s.speed>=0&&s.speed<=70);});
test('wrapped distances detect traffic across lap seam',()=>{assert(Math.abs(gap(1.005,.995)-.01)<1e-10);assert(Math.abs(gap(.995,1.005)+.01)<1e-10);});
test('rivals brake for corners, accelerate smoothly and vary speed/lane',()=>{const straight=[rival()],corner=[rival()];stepRivals(straight,farPlayer,0,.05,1000,()=>0);stepRivals(corner,farPlayer,0,.05,1000,()=>.04);assert(straight[0].speed>40);assert(corner[0].speed<40);assert(Math.abs(straight[0].speed-40)<=.45+1e-9);const history=[];for(let i=0;i<1200;i++){stepRivals(straight,farPlayer,i/60,1/60,1000,()=>0);history.push([straight[0].speed,straight[0].lane]);}assert(Math.max(...history.map(v=>v[0]))-Math.min(...history.map(v=>v[0]))>4);assert(Math.max(...history.map(v=>v[1]))-Math.min(...history.map(v=>v[1]))>1);});
test('rivals attempt a smooth pass and slow for a close slower car at seam',()=>{const bots=[rival({progress:.995,speed:45})];stepRivals(bots,{progress:1.003,lane:0,speed:20},0,.05,1000,()=>0);assert(bots[0].speed<45);assert(Math.abs(bots[0].targetLane)>3);assert(Math.abs(bots[0].lane)<.3);});
test('rivals avoid occupied passing lanes and stay finite within track',()=>{const bots=[rival({progress:.1}),rival({progress:.101,lane:-4.8}),rival({progress:.101,lane:4.8})];stepRivals(bots,{progress:.108,lane:0,speed:10},0,.05,1000,()=>0);assert(Math.abs(bots[0].targetLane)<4);for(let i=0;i<3600;i++)stepRivals(bots,farPlayer,i/60,1/60,1000,t=>Math.sin(t*6.28)*.025);for(const b of bots){assert(Object.values(b).every(Number.isFinite));assert(Math.abs(b.lane)<=5.2);assert(b.speed>=0);}});
import {trackLength,trackCurvature} from '../src/track.ts';
test('a competent driver can finish the actual coastal circuit without hitting an edge',()=>{
 let s=driver(),progress=0,maxLateral=0;
 for(let tick=0;tick<60*180&&progress<1;tick++){
  const upcoming=[0,.006,.012,.022,.035,.045].map(o=>Math.abs(trackCurvature(progress+o)));
  const target=Math.max(8,Math.min(45,Math.sqrt(11/Math.max(...upcoming,.001))));
  const yaw=trackCurvature(progress)*s.speed+s.lateral*.12-s.heading*1.8;
  const input=Math.max(-1,Math.min(1,-yaw*(4+s.speed*.12)/Math.max(s.speed,1)));
  s=stepDriver(s,{gas:s.speed<target,brake:s.speed>target+1,drift:false,input},trackCurvature(progress),1/60);
  progress+=s.speed*Math.max(.65,Math.cos(s.heading))/60/trackLength;
  maxLateral=Math.max(maxLateral,Math.abs(s.lateral));
 }
 assert(progress>=1,'driver must complete a lap');assert(maxLateral<7.5,`driver left road: ${maxLateral}`);
});
test('overlapping same-lane rivals choose opposite avoidance sides',()=>{const bots=[rival({progress:.1}),rival({progress:.1})];stepRivals(bots,farPlayer,0,.05,1000,()=>0);assert(bots[0].targetLane>0);assert(bots[1].targetLane<0);});


test('stopped shoulder cars rejoin both edges of the actual circuit with throttle and inward steering',()=>{
 for(const side of [-1,1])for(let start=0;start<1;start+=.05)for(const hz of [30,120]){
  let s={...driver(),lateral:side*10.5,heading:-side*.7},progress=start,rejoined=false;
  for(let tick=0;tick<3*hz;tick++){
   s=stepDriver(s,{...controls,gas:true,input:-side},trackCurvature(progress),1/hz);
   progress+=s.speed*Math.max(.65,Math.cos(s.heading))/hz/trackLength;
   assert(Math.abs(s.lateral)<=10.5);
   if(Math.abs(s.lateral)<7.5){rejoined=true;break;}
  }
  assert(rejoined,`failed to rejoin side ${side}, progress ${start}, ${hz} fps`);
 }
});

test('steering alone cannot move a stopped car out of the shoulder',()=>{
 for(const side of [-1,1]){
  const initial={...driver(),lateral:side*10.5,heading:-side*.7};
  const s=simulate(initial,{input:-side},5);
  assert.equal(s.lateral,initial.lateral);assert.equal(s.speed,0);
 }
});

test('grass permits a low-speed pull-away while retaining high-speed resistance',()=>{
 const road=simulate(driver(),{gas:true},1),grass=simulate({...driver(),lateral:8},{gas:true},1);
 assert(grass.speed>8,'shoulder must have enough low-speed traction');
 assert(grass.speed<road.speed,'grass must still slow acceleration');
 const fastRoad=simulate(driver(40),{gas:true},.5),fastGrass=simulate({...driver(40),lateral:8},{gas:true},.5);
 assert(fastGrass.speed<fastRoad.speed-5,'high-speed offroad penalty must remain');
});

test('boundary contact preserves inward-facing heading instead of bouncing back out',()=>{
 for(const side of [-1,1]){
  const s=stepDriver({...driver(15),lateral:side*10.5,lateralVelocity:side*10,heading:side*.2},{...controls,input:-side},0,1/60);
  assert(s.heading*side>0);assert.equal(s.lateralVelocity,0);assert.equal(s.lateral,side*10.5);
 }
});
