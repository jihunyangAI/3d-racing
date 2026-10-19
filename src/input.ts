// Physical key codes remain stable with Korean IME and other keyboard layouts.
export function drivingKey(event: { code?: string; key: string }): string {
    const codes: Record<string, string> = {
        KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
        ArrowUp: 'arrowup', ArrowDown: 'arrowdown',
        ArrowLeft: 'arrowleft', ArrowRight: 'arrowright', Space: ' ',
    };
    return codes[event.code ?? ''] ?? event.key.toLowerCase();
}
export function readControls(keys: ReadonlySet<string>) {
    return {
        gas: keys.has('w') || keys.has('arrowup'),
        brake: keys.has('s') || keys.has('arrowdown'),
        drift: keys.has(' '),
        input: Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')),
    };
}
