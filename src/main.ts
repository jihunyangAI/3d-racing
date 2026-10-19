import { drivingKey, readControls } from './input';
import { createTrack } from './track';
import { raceMaps,getRaceMap } from './maps';
import { crossedCheckpoints } from './checkpoints';
import { createF1Car } from './vehicles';
import { buildScenery } from './scenery';
const selectedMap=getRaceMap(new URLSearchParams(location.search).get('map'));
const {curve,curvature}=createTrack(selectedMap);
import { stepDriver, stepRivals, gap } from './driving';
import * as THREE from 'three';
import './style.css';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<div id="world"></div><div class="vignette"></div><header><a class="brand" href="./" aria-label="APEX home">A<span>PEX</span><i>RACING EXPERIENCE</i></a><div class="event"><span class="live-dot"></span> COASTAL RUN <b>01 / EXHIBITION</b></div><button id="pause" class="icon-button" aria-label="일시정지">Ⅱ</button></header><aside class="race-info"><div class="eyebrow">COASTLINE CIRCUIT</div><h1>CHASE THE<br><em>HORIZON.</em></h1><div class="track-meta"><span>PORTO AZZURRO</span><span>18:42 · CLEAR</span></div><div class="race-stats"><div><label>POSITION</label><strong id="position">04<small>/ 04</small></strong></div><div><label>LAP</label><strong id="lap">01<small>/ ${String(selectedMap.laps).padStart(2, "0")}</small></strong></div></div><div class="timer"><label>RACE TIME</label><span id="time">00:00.000</span></div><div class="best"><span>PERSONAL BEST</span><b id="best">— — : — —</b></div></aside><div class="right-note"><span>PURE SPEED.<br>NO LIMITS.</span><div>36° 48′ N<br>10° 18′ E</div></div><section class="map-panel"><div class="eyebrow"><span class="live-dot"></span> LIVE CIRCUIT <span>${selectedMap.laps} LAPS</span></div><canvas id="map" width="260" height="160"></canvas><div class="map-caption"><b>4.2</b> KM <span>COASTLINE / 01</span></div></section><section class="speed-panel"><div class="speed-top"><span id="drive-state">READY TO RACE</span><span class="gear">GEAR <b id="gear">N</b></span></div><div class="speed"><span id="speed">000</span><small>KM/H</small></div><div class="rev-track"><div id="rev"></div></div><div class="speed-bottom"><span>APEX <b>FORMULA</b></span><span>OPEN WHEEL</span></div></section><footer><div class="controls"><span><kbd>W</kbd><kbd>↑</kbd> ACCELERATE</span><span><kbd>S</kbd><kbd>↓</kbd> BRAKE</span><span><kbd>A</kbd><kbd>D</kbd> STEER</span><span><kbd>SPACE</kbd> HANDBRAKE</span><span><kbd>R</kbd> RESET</span></div><span class="edition">BUILT FOR THE DRIVE <i>↗</i></span></footer><div id="countdown"></div><div id="overlay" class="overlay"><div class="modal"><span class="eyebrow">THE COAST IS CALLING</span><h2>Find your<br><em>racing line.</em></h2><p>선택한 코스에서 ${selectedMap.laps}바퀴를 완주하세요.<br>코너에서는 감속하고, 직선에서 한계에 도전하세요.</p><button id="start" class="primary">START YOUR ENGINE <span>↗</span></button><div class="modal-foot">${selectedMap.laps} LAPS <i>•</i> 4 DRIVERS <i>•</i> ONE HORIZON</div></div></div><div class="touch"><div><button data-key="a" aria-label="왼쪽">◀</button><button data-key="d" aria-label="오른쪽">▶</button></div><div><button data-key="s">BRAKE</button><button data-key="w">GAS</button></div></div>`;
const el = (id: string) => document.getElementById(id)!;
document.querySelector('.modal .eyebrow')!.textContent = selectedMap.theme === 'forest' ? 'THE VALLEY IS CALLING' : 'THE COAST IS CALLING';
const picker =document.createElement('div');picker.className='map-picker';picker.innerHTML='<label for="map-select">CHOOSE YOUR CIRCUIT</label><select id="map-select" aria-describedby="map-description"></select><p id="map-description"></p>';el('start').before(picker);
const mapSelect=el('map-select') as HTMLSelectElement;for(const map of raceMaps)mapSelect.add(new Option(map.name,map.id));mapSelect.value=selectedMap.id;el('map-description').textContent=selectedMap.description;mapSelect.onchange=()=>{const url=new URL(location.href);url.searchParams.set('map',mapSelect.value);location.assign(url);};
document.querySelector('.race-info .eyebrow')!.textContent=selectedMap.name.toUpperCase();document.querySelector('.track-meta span')!.textContent=selectedMap.location.toUpperCase();document.querySelector('.event')!.innerHTML='<span class="live-dot"></span> '+selectedMap.name.toUpperCase()+' <b>EXHIBITION</b>';document.querySelector('.map-caption span')!.textContent=selectedMap.id.toUpperCase()+' / 01';
const scoreLayer=document.createElement('div');scoreLayer.className='checkpoint-layer';scoreLayer.setAttribute('aria-hidden','true');app.append(scoreLayer);const scoreDisplay=document.createElement('div');scoreDisplay.className='race-score';scoreDisplay.innerHTML='CHECKPOINT SCORE <b id="score">0</b>';document.querySelector('.race-info')!.append(scoreDisplay);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b7cfcc');
scene.fog = new THREE.Fog('#bdcfca', 160, 650);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 1400);
let renderer: THREE.WebGLRenderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
}
catch (error) {
    app.innerHTML = '<div class="fallback"><h1>3D 화면을 시작할 수 없습니다.</h1><p>WebGL을 지원하는 브라우저에서 하드웨어 가속을 켠 후 새로고침해 주세요.</p><button onclick="location.reload()">다시 시도</button></div>';
    throw error;
}
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
el('world').append(renderer.domElement);
scene.add(new THREE.HemisphereLight('#e6eff1', '#52654d', 2.2));
const sun = new THREE.DirectionalLight('#fff0cc', 3.1);
sun.position.set(-120, 180, 80);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, far: 600 });
sun.shadow.bias = -.0005;
scene.add(sun);
const mat = (color: string, roughness = .8) => new THREE.MeshStandardMaterial({ color, roughness });
const asphalt = mat('#343c3b'), grass = mat('#7d8c69'), sand = mat('#b6ae8c'), white = mat('#e7e7d5'), dark = mat('#182426'), lime = mat('#d0ef59', .28);
function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const a = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); a.position.set(x, y, z); a.castShadow = true; a.receiveShadow = true; return a; }
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1700, 1700), grass);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -.25;
ground.receiveShadow = true;
scene.add(ground);
const sea = new THREE.Mesh(new THREE.PlaneGeometry(1900, 1100, 32, 32), new THREE.MeshStandardMaterial({ color: '#679fa3', roughness: .26, metalness: .32 }));
sea.rotation.x = -Math.PI / 2;
sea.position.set(0, -1.5, -650)…3287 tokens truncated…ion.clone().project(camera);p.element.hidden=view.z>=0||Math.abs(projected.x)>1.3||Math.abs(projected.y)>1.3;p.element.style.left=((projected.x+1)/2*innerWidth)+'px';p.element.style.top=((1-projected.y)/2*innerHeight)+'px';p.element.style.transform='translate(-50%, calc(-50% - '+(reducedMotion?0:p.age*38)+'px))';p.element.style.opacity=String(Math.min(1,(2.2-p.age)*2));}}
let last = performance.now();
const cameraTarget = new THREE.Vector3();
let initialized = false;
function animate(now: number) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    if (state === 'countdown') {
        count -= dt;
        el('countdown').textContent = count > 1 ? String(Math.ceil(count - 1)) : 'GO';
        if (count <= 0) {
            state = 'racing';
            el('countdown').textContent = '';
        }
    }
    else
        el('countdown').textContent = '';
    if (state === 'racing') {
        elapsed += dt;
        const { gas, brake, drift, input } = readControls(keys);
        // Steering, yaw and tyre slip have separate response times: lifting, braking and
        // countersteering all change the car's behaviour instead of sliding it sideways.
        ({ speed, steer, heading, lateralVelocity, lateral, yawRate, acceleration, impact } = stepDriver({ speed, steer, heading, lateralVelocity, lateral, yawRate, acceleration, impact }, { gas, brake, drift, input }, curvature(progress), dt));
        const previousProgress=progress;
        const oldLap = Math.floor(progress);
        progress += speed * Math.max(.65, Math.cos(heading)) * dt / length;
        for(const crossing of crossedCheckpoints(previousProgress,progress,selectedMap.checkpoints,awarded,selectedMap.laps))if(Math.abs(lateral)<=roadWidth/2)showScore(crossing.progress);
        for(const obstacle of (scenery.userData.obstacles??[]) as {progress:number;lateral:number;radius:number}[]){if(Math.abs(gap(obstacle.progress,progress)*length)<1.9+obstacle.radius&&Math.abs(lateral-obstacle.lateral)<1.1+obstacle.radius){speed*=Math.exp(-2*dt);lateral-=Math.sign(obstacle.lateral)*dt*2;impact=Math.max(impact,.4);}}
        if (Math.floor(progress) > oldLap) {
            const lap = elapsed - lapStart;
            lapTimes.push(lap);
            lapStart = elapsed;
            if (!best || lap < best) {
                best = lap;
                try {
                    localStorage.setItem('apex-best:'+selectedMap.id,String(best));
                }
                catch { }
                el('best').textContent = format(best);
            }
            if (progress >= selectedMap.laps) {
                state = 'finished';
                setModal('Horizon<br><em>conquered.</em>', `완주 기록 <b>${format(elapsed)}</b><br>베스트 랩 ${format(Math.min(...lapTimes))} · 최종 ${1 + bots.filter(b => b.progress > progress).length}위`, 'RACE AGAIN');
            }
        }
        stepRivals(bots, { progress, lane: lateral, speed }, elapsed, dt, length, curvature);
        bots.forEach(b => {
            const distance = gap(b.progress, progress) * length;
            if (Math.abs(distance) < 4.2 && Math.abs(b.lane - lateral) < 2.05) {
                const side = Math.sign(lateral - b.lane) || 1;
                lateral = clamp(lateral + side * dt * 2.5, -10.5, 10.5);
                impact = Math.max(impact, .45);
                if (distance > 0 && speed > b.speed)
                    speed = damp(speed, b.speed * .9, 10, dt);
                if (distance < 0 && b.speed > speed)
                    b.speed = damp(b.speed, speed, 12, dt);
            }
        });
    }
    const pf = frame(progress, lateral);
    player.position.copy(pf.p);
    player.rotation.y = Math.atan2(pf.tangent.x, pf.tangent.z) + heading;
    const moving = state === 'racing';
    impact = damp(impact, 0, 6, dt);
    player.rotation.z = damp(player.rotation.z, steer * speed * .0016, 6, dt);
    player.rotation.x = damp(player.rotation.x, -acceleration * .003, 6, dt);
    player.position.y = moving && !reducedMotion ? (Math.sin(elapsed * 37) * speed * .0003 + (Math.abs(lateral) > 7.5 ? Math.sin(elapsed * 53) * .045 : 0)) : 0;
    bots.forEach(b => { const f = frame(b.progress, b.lane); b.mesh.position.copy(f.p); b.mesh.rotation.y = Math.atan2(f.tangent.x, f.tangent.z) - Math.atan2(b.laneVelocity, Math.max(b.speed, 1)); b.mesh.rotation.z = clamp(-b.laneVelocity * .018, -.06, .06); });
    const drivingDirection = new THREE.Vector3(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
    const desired = pf.p.clone().addScaledVector(drivingDirection, cameraMode ? -2.8 : -10.5 - speed * .045);
    desired.addScaledVector(pf.normal, steer * speed * .009);
    desired.y = cameraMode ? 2.25 : 5.1 + speed * .006;
    if (moving && !reducedMotion) {
        desired.y += Math.sin(elapsed * 27) * speed * .00035 + impact * Math.sin(elapsed * 67) * .13;
    }
    const look = pf.p.clone().addScaledVector(pf.tangent, 15 + speed * .14);
    look.y = 1.5 - acceleration * .014;
    if (!initialized) {
        camera.position.copy(desired);
        cameraTarget.copy(look);
        initialized = true;
    }
    camera.position.lerp(desired, 1 - Math.exp(-5 * dt));
    cameraTarget.lerp(look, 1 - Math.exp(-6 * dt));
    camera.lookAt(cameraTarget);
    camera.fov = damp(camera.fov, 58 + (reducedMotion ? 0 : speed * .14), 3, dt);
    camera.updateProjectionMatrix();
    el('speed').textContent = Math.round(speed * 3.6).toString().padStart(3, '0');
    el('gear').textContent = speed < 1 ? 'N' : String(Math.min(6, 1 + Math.floor(speed / 12)));
    el('rev').style.width = `${speed / 70 * 100}%`;
    el('lap').innerHTML = `${Math.min(selectedMap.laps, 1 + Math.floor(progress)).toString().padStart(2, '0')}<small>/ ${String(selectedMap.laps).padStart(2, "0")}</small>`;
    el('position').innerHTML = `${(1 + bots.filter(b => b.progress > progress).length).toString().padStart(2, '0')}<small>/ 04</small>`;
    el('time').textContent = format(elapsed);
    el('drive-state').textContent = state === 'racing' ? (Math.abs(lateral) > 7.4 ? "도로 복귀: ↑ + " + (lateral > 0 ? "←" : "→") : (keys.has(' ') ? 'HANDBRAKE / SLIDING' : keys.has('s') || keys.has('arrowdown') ? 'BRAKING' : Math.abs(heading) > .22 ? 'TYRE SLIP' : keys.has('w') || keys.has('arrowup') ? 'ACCELERATING' : 'COASTING')) : state === 'paused' ? 'RACE PAUSED' : state === 'finished' ? 'RACE COMPLETE' : 'READY TO RACE';
    for(const car of [player,...bots.map(b=>b.mesh)]){for(const wheel of (car.userData.wheels??[]) as THREE.Object3D[])if(moving)wheel.rotation.x+=speed*dt/.42;for(const wheel of (car.userData.frontWheels??[]) as THREE.Object3D[])wheel.rotation.y=car===player?steer*.35:0;}
    updateScores(state==='racing'?dt:0);el('score').textContent=String(score);
    drawMap();
    renderer.render(scene, camera);
}
requestAnimationFrame(animate);
window.addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

// Read-only development telemetry for real keyboard/browser verification.
if ((import.meta as ImportMeta & { env: { DEV: boolean } }).env.DEV) Object.defineProperty(window, '__apexDebug', { get: () => ({
    state, progress, lateral, heading, speed, steer, cameraMode,mapId:selectedMap.id,score,checkpoints:[...awarded],popupCount:popups.length,
    world: { x: player.position.x, z: player.position.z },
    cameraPosition: camera.position.toArray(), keys: [...keys],
}) });
