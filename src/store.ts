import { derived, writable } from 'svelte/store';

// export const currentSlide = writable(0);

export const eventLog = writable([]);

const boolify = (value) => {
    try {
        const parsed = JSON.parse(value);
        return parsed === true;
    } catch {
        return false;
    }
};

const queryStringify = (entries) => {
    const params = new URLSearchParams();
    for (let [key, val] of entries) {
        params.set(key, val);
    }
    return params.toString();
};

const readConfigFromQuery = () => {
    const queryEntries = Object.fromEntries(new URLSearchParams(location.search).entries());
    const filledQuery = {
        role: queryEntries.role || 'both',
        stream: queryEntries.stream || 'both',
        autoSignal: boolify(queryEntries.autoSignal),
        audioVisOnly: boolify(queryEntries.audioVisOnly),
        manual: boolify(queryEntries.manual),
        remote: boolify(queryEntries.remote),
        hideSignaling: boolify(queryEntries.hideSignaling),
        hideEvents: boolify(queryEntries.hideEvents),
        showCandidateEvents: boolify(queryEntries.showCandidateEvents),
        showTransceivers: boolify(queryEntries.showTransceivers ?? true),
    };

    return Object.entries(filledQuery).map(([key, value]) => ({ key, value }));
};

export const query = writable(readConfigFromQuery());

export const configUrl = derived(
    query,
    ($query) => `${window.origin}${window.location.pathname}?${queryStringify($query.map(({ key, value }) => [key, value]))}`
);

export const config = derived(query, ($query) => {
    const config = Object.fromEntries($query.map(({ key, value }) => [key, value]));
    let { role, stream, manual, remote, hideSignaling, hideEvents, showTransceivers, autoSignal, showCandidateEvents } = config;

    const hasCaller = role !== 'recv';
    const hasReceiver = (role !== 'call' && role !== 'send') || false;
    const hasUpstream = stream !== 'down' || false;
    const hasDownstream = stream !== 'up' || false;
    const isManual = (manual && manual !== 'no') || false;
    const isRemote = (remote && remote !== 'no') || false;
    const to = hasCaller ? 'bob' : 'alice';
    const from = hasReceiver ? 'bob' : 'alice';

    return {
        ...config,
        role,
        stream,
        manual,
        remote,
        hasCaller,
        hasReceiver,
        hasUpstream,
        hasDownstream,
        autoSignal,
        isManual,
        isRemote,
        hideSignaling,
        hideEvents,
        showTransceivers,
        showCandidateEvents,
        to,
        from,
    };
});

export const eventLogByName = writable({});

export function addEvent(name: string, short?: string, event?: any) {
    const newEvent = { name, short, event, timestamp: new Date().toISOString().split('T')[1] };
    eventLog.update((events) => [...events, newEvent]);
    eventLogByName.update((events) => ({ ...events, [name]: [...(events[name] || []), short] }));
}

export const addEventFor = (name: string) => (short: string, event?: any) => addEvent(name, short, event);
