import { derived, writable } from 'svelte/store';

// export const currentSlide = writable(0);

export const eventLog = writable([]);

const boolify = value => {
    try {
        const parsed = JSON.parse(value);
        return parsed === true;
    } catch {return false}
};

const queryStringify = (entries) => {
    const params = new URLSearchParams();
    for (let [key, val] of entries) {
        params.set(key, val)
    }
    return params.toString();
}

export const query = writable(
(() => {
        const queryEntries = Object.fromEntries(new URLSearchParams(location.search).entries())
        const filledQuery = {
            role: queryEntries.role || 'both',
            stream: queryEntries.stream || 'both',
            manual: boolify(queryEntries.manual),
            remote: boolify(queryEntries.remote),
            hideSignaling: boolify(queryEntries.hideSignaling),
        };

        return Object.entries(filledQuery).map(([key, value]) => ({ key, value }))
    })()
);

export const configUrl = derived(query, $query =>
    `${window.location.protocol}//${window.location.host}/?${queryStringify($query.map(({ key, value }) => [key, value]))}`
);

export const config = derived(
    query,
    $query => {

        const config = Object.fromEntries($query.map(({ key, value }) => [key, value]));
        let { role, stream, manual, remote, hideSignaling } = config;

        const hasCaller = role !== 'recv';
        const hasReceiver = role !== 'call' && role !== 'send' || false;
        const hasUpstream = stream !== 'down' || false;
        const hasDownstream = stream !== 'up' || false;
        const isManual = manual && manual !== 'no' || false;
        const isRemote = remote && remote !== 'no' || false;
        const to = hasCaller ? 'bob' : 'alice';
        const from = hasReceiver ? 'bob' : 'alice';

        return ({
            ...config,
            role, stream, manual, remote, 
            hasCaller, hasReceiver, hasUpstream, hasDownstream,
            isManual, isRemote,
            hideSignaling,
            to, from,
        });

    }
);

export const eventLogByName = writable({});
export function addEvent(name, short, event) {
    const newEvent = { name, short, event };
    eventLog.update(events => ([...events, newEvent]));
    eventLogByName.update(events => ({ ...events, [name]: [...events[name] || [], short] }));
}

export const addEventFor = (name) => (short, event) => addEvent(name, short, event);



