import { writable } from 'svelte/store';

export const offer = writable({});
export const answer = writable({});
export const candidates = writable({});

const appendToStore = store => to => msg => store.update(c => ({ ...c, [to]: [...(c[to] || []), msg] }));

const sendToStore = store => to => msg => store.update(c => ({ ...c, [to]: msg }));

const resetStore = store => to => store.update(c => ({ ...c, [to]: [] }));

export const offerTo = sendToStore(offer);
export const answerTo = sendToStore(answer);
export const candidateTo = appendToStore(candidates);
export const clearCandidates = resetStore(candidates);
