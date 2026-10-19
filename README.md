# APEX — Coastal Run

Three.js + TypeScript + Vite로 만든 브라우저 3D 아케이드 레이싱 게임입니다. 외부 모델이나 이미지 없이 코스, 차량, 해안 풍경을 직접 렌더링합니다.

## 실행

Node.js 22 이상을 권장합니다.

```sh
npm install
npm run dev
```

표시되는 로컬 주소를 브라우저에서 엽니다. Windows PowerShell에서 실행 정책 오류가 나면 `npm.cmd install`, `npm.cmd run dev`를 사용하세요.

```sh
npm run build
npm run preview
```

## 조작

- W / ↑: 가속
- S / ↓: 브레이크
- A, D / ←, →: 좌우 조향
- Space: 핸드브레이크 감속
- C: 카메라 전환
- P / Esc: 일시정지 및 재개
- R: 레이스 재시작
- 모바일: 화면 하단의 터치 버튼

START YOUR ENGINE을 누르면 카운트다운 이후 레이스를 시작합니다. AI 차량 세 대와 세 바퀴를 달립니다. 도로 밖에서는 속도가 줄어들며, 개인 최고 랩은 브라우저에 저장됩니다. 탭을 벗어나면 레이스가 자동으로 일시정지됩니다.


## Driving update

- Progressive steering, yaw inertia and tyre slip; braking and lifting off transfer weight visibly. Grass reduces grip and speed. Sharp corners require braking.
- Three rival drivers accelerate and brake for upcoming corners, vary their pace and racing line, look for passing space and avoid nearby cars across the start/finish seam.
- The live minimap shows your actual lateral position and heading with a lime arrow, color-matched rivals and the start/finish line. It remains visible on mobile.
- Speed-sensitive chase camera, body roll and road vibration. Reduced-motion system settings disable camera vibration and changing field of view.

### Validation

Node.js 24 is recommended for the native TypeScript simulation tests:

```sh
npm test
npm run build
```

The tests include a controlled full lap of the actual circuit, steering direction, acceleration/braking, slip, frame-rate stability, traffic near the lap seam and passing decisions.

If this managed Windows environment terminates Vite during output-directory cleanup, preserve existing output for local verification:

```sh
npm run build -- --emptyOutDir false
```

This writes a production build but leaves older hashed assets in `dist`; the default build still cleans output normally on unrestricted machines.


## Contributing a custom circuit

Copy src/maps/forest.ts to a new file and implement RaceMap from src/maps/types.ts. Set a unique stable id, name, location, description, theme (coast or forest), scenery seed, laps (for example, 3), checkpoints (sorted fractions strictly between 0 and 1), and ordered [x,z] controlPoints in metres. Use at least six well-spaced points forming a closed loop; avoid intersections and leave 40 metres between road sections. Shared road width is 17 metres. Import the map into src/maps/index.ts and add it to raceMaps; the start menu lists it automatically.

Map selection reloads the scene before starting or after finishing, clearing resources and race state. Best laps are saved per map ID. Checkpoint gates award +100 once per gate per lap on forward road crossings; the world-projected popup freezes while paused.
