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
    let { role, stream, manual, remote } = queryString.parse(location.search);
    const hasCaller = role !== 'recv';
    const hasReceiver = role !== 'call' && role !== 'send' || false;
    const hasUpstream = stream !== 'down' || false;
    const hasDownstream = stream !== 'up' || false;
    const isManual = manual && manual !== 'no' || false;
    const isRemote = remote && remote !== 'no' || false;
    const to = hasCaller ? 'bob' : 'alice';
    const from = hasReceiver ? 'bob' : 'alice';

    config.update(config => ({
        ...config,
        role,
        stream,
        manual,
        remote,
        hasCaller,
        hasReceiver,
        hasUpstream,
        hasDownstream,
        isManual,
        isRemote,
        to,
        from,
    }));
    console.log({ role, stream, manual, remote, to, from });
}

