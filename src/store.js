import { derived, writable } from 'svelte/store';

// export const currentSlide = writable(0);
import queryString from 'query-string';

export const config = writable({});
export const eventLog = writable([]);
export const eventLogByName = writable({});

export function addEvent(name, short, event) {
    const newEvent = { name, short, event };
    eventLog.update(events =>  ([...events, newEvent]));
    eventLogByName.update(events =>  ({...events, [name]: [ ...events[name] ||[], short]}));
}

export const addEventFor = (name) => (short, event) => addEvent(name, short, event);


{
    let { role, stream, manual } = queryString.parse(location.search);
    config.update(config => ({
        ...config,
        role,
        stream,
        manual,
        hasCaller: role !== 'recv',
        hasReceiver: role !== 'call' && role !== 'send' || false,
        hasUpstream: stream !== 'down' || false,
        hasDownstream: stream !== 'up' || false,
        isManual: manual && manual !== 'no' || false,
    }));
    console.log({ role, stream, manual });
}

