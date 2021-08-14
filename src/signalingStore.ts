import { derived, writable, Writable } from 'svelte/store';

export const offerStore = writable({
    /*[from]: {type: 'offer', sdp: string}*/
});
export const answerStore = writable({
    /*[from]: {type: 'answer', sdp: string}*/
});
export const candidatesStore: Writable<Record<string, any>> = writable({
    /*[from]: [Candidate]*/
});

export function sendOfferFrom({ from, offer }) {
    offerStore.update((store) => ({ ...store, [from]: offer }));
}

export function sendAnswerFrom({ from, answer }) {
    answerStore.update((store) => ({ ...store, [from]: answer }));
}

export function sendCandidateFrom({ from, candidate }) {
    candidatesStore.update((store) => {
        const existingCandidates = store[from] || [];
        return { ...store, [from]: [...existingCandidates, candidate] };
    });
}

export function clearCandidatesFrom({ from }) {
    candidatesStore.update((store) => ({ ...store, [from]: [] }));
}

export const EVENT_BUS = new EventTarget();