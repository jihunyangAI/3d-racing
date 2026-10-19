// Road-relative arcade dynamics. Distances are metres and speeds metres/second.
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const damp = (value: number, target: number, rate: number, dt: number) => target + (value - target) * Math.exp(-rate * dt);
export function gap(a: number, b: number) { return ((a - b + .5) % 1 + 1) % 1 - .5; }
export interface DriverState {
    speed: number;
    steer: number;
    heading: number;
    lateralVelocity: number;
    lateral: number;
    yawRate: number;
    acceleration: number;
    impact: number;
}
export function stepDriver(driver: DriverState, controls: {
    gas: boolean;
    brake: boolean;
    drift: boolean;
    input: number;
}, roadBend: number, dt: number): DriverState {
    let { speed, steer, heading, lateralVelocity, lateral, yawRate, acceleration, impact } = driver;
    const { gas, brake, drift, input } = controls;
    // Steering, yaw and tyre slip have separate response times: lifting, braking and
    // countersteering all change the car's behaviour instead of sliding it sideways.
    steer = damp(steer, input, 5.5, dt);
    const previousSpeed = speed;
    const offroad = Math.abs(lateral) > 7.5;
    const engine = gas ? 20 * (1 - speed / 100) : 0;
    // Keep the high-speed grass penalty, but leave traction to pull away at low speed.
    const grassResistance = offroad ? 15 * clamp(speed / 12, 0, 1) : 0;
    speed = clamp(speed + (engine - (brake ? 32 : 0) - (drift ? 13 : 0) - 1.1 - speed * speed * .0024 - grassResistance) * dt, 0, 70);
    acceleration = damp(acceleration, (speed - previousSpeed) / Math.max(dt, .001), 9, dt);
    const bend = roadBend, grip = drift ? 2.0 : offroad ? 3.5 : 8;
    // Bicycle-model steering with a speed-dependent tyre force limit. Slow down
    // for hairpins: steering harder at high speed cannot create unlimited grip.
    const yawLimit = (drift ? 21 : offroad ? 10 : 18) / Math.max(speed, 8);
    // Positive road offset is camera-right, but positive world yaw turns left.
    const requestedYaw = clamp(-steer * speed / (4 + speed * .12) * (drift ? 1.35 : 1), -yawLimit, yawLimit);
    yawRate = damp(yawRate, requestedYaw, drift ? 3 : 7, dt);
    // Assist road alignment when road rotation exceeds the available tyre grip.
    // Reserve steering authority so opposite inputs cannot both push into the
    // same barrier on a fast, tight corner.
    const roadYaw = clamp(bend * speed, -yawLimit * .65, yawLimit * .65);
    heading = clamp(heading + (yawRate - roadYaw) * dt, -.7, .7);
    // Mild alignment assistance keeps the arcade model approachable, while still
    // requiring steering through corners and allowing understeer at excessive speed.
    heading = damp(heading, 0, drift ? .55 : 1.8, dt);
    lateralVelocity = damp(lateralVelocity, -Math.sin(heading) * speed, grip, dt);
    lateral += lateralVelocity * dt;
    if (Math.abs(lateral) > 10.5) {
        lateral = clamp(lateral, -10.5, 10.5);
        // Resolve only outward contact so repeated impacts do not fight inward steering.
        const side = Math.sign(lateral);
        if (lateralVelocity * side > 0) lateralVelocity = 0;
        if (heading * side < 0) heading = 0;
        speed *= Math.exp(-2 * dt);
        impact = .8;
    }
    return { speed, steer, heading, lateralVelocity, lateral, yawRate, acceleration, impact };
}
export interface RivalState {
    progress: number;
    lane: number;
    speed: number;
    targetLane: number;
    laneVelocity: number;
    cruise: number;
    phase: number;
}
export interface Traffic {
    progress: number;
    lane: number;
    speed: number;
}
export function stepRivals(bots: RivalState[], player: Traffic, elapsed: number, dt: number, length: number, curvature: (t: number) => number) {
    const traffic = [...bots.map(b => ({ progress: b.progress, lane: b.lane, speed: b.speed })), player];
    bots.forEach((b, i) => {
        const bend = curvature(b.progress + .012);
        const upcoming = [0, .006, .012, .022, .035, .045].map(offset => Math.abs(curvature(b.progress + offset)));
        const cornerSpeed = clamp(Math.sqrt(9 / Math.max(...upcoming, .001)), 9, 61);
        let desiredSpeed = Math.min(cornerSpeed, b.cruise + 3 * Math.sin(elapsed * .63 + b.phase) + 1.8 * Math.sin(elapsed * 1.47 + b.phase));
        b.targetLane = clamp(bend * 110 + 1.5 * Math.sin(elapsed * .24 + b.phase), -4.8, 4.8);
        const ahead = traffic.filter((_, j) => j !== i).map(v => ({ ...v, distance: gap(v.progress, b.progress) * length })).filter(v => v.distance > 0 && v.distance < 29).sort((a, c) => a.distance - c.distance)[0];
        if (ahead && Math.abs(ahead.lane - b.lane) < 3.1) {
            const options = [-4.8, 4.8].filter(lane => traffic.every((v, j) => j === i || Math.abs(gap(v.progress, b.progress) * length) > 13 || Math.abs(v.lane - lane) > 2.5));
            if (options.length) {
                b.targetLane = options.reduce((a, c) => Math.abs(c - b.lane) < Math.abs(a - b.lane) ? c : a);
            }
            if (ahead.distance < 14)
                desiredSpeed = Math.min(desiredSpeed, Math.max(5, ahead.speed - (14 - ahead.distance) * 1.5));
        }
        // Never move sideways into a car alongside.
        for (const [j, v] of traffic.entries())
            if (j !== i && Math.abs(gap(v.progress, b.progress) * length) < 5 && Math.abs(v.lane - b.lane) < 3.2)
                b.targetLane = clamp(b.lane + (Math.abs(b.lane - v.lane) < .01 ? (i < j ? 2 : -2) : b.lane > v.lane ? 2 : -2), -5.2, 5.2);
        const oldLane = b.lane;
        b.lane = damp(b.lane, b.targetLane, 1.1, dt);
        b.laneVelocity = dt > 0 ? (b.lane - oldLane) / dt : 0;
        b.speed += clamp(desiredSpeed - b.speed, -20 * dt, 9 * dt);
        b.progress += b.speed * dt / length;
    });
}
