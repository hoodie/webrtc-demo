import { derived, writable } from 'svelte/store';

// export const currentSlide = writable(0);
import queryString from 'query-string';

export const config = writable({});

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

