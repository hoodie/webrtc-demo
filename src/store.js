import { derived, writable } from 'svelte/store';

// export const currentSlide = writable(0);
import queryString from 'query-string';

export const eventLog = writable([]);

const boolify = value => {
    try {
        const parsed = JSON.parse(value);
        return parsed === true;
    } catch {return false}
};

export const query = writable(
(() => {
        const original_query = queryString.parse(location.search);
        const filled_query = {
            role: original_query.role || 'both',
            stream: original_query.stream || 'both',
            manual: boolify(original_query.manual),
            remote: boolify(original_query.remote),
        };

        return Object.entries(filled_query).map(([key, value]) => ({ key, value }))
    })()
);

export const configUrl = derived(query, $query =>
    `${window.location.protocol}//${window.location.host}/?${queryString.stringify(Object.fromEntries($query.map(({ key, value }) => [key, value])))}`
);

export const config = derived(
    query,
    $query => {

        const config = Object.fromEntries($query.map(({ key, value }) => [key, value]));
        let { role, stream, manual, remote } = config;

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



