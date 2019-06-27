import { writable } from 'svelte/store';

// export const currentSlide = writable(0);

export const currentSlide = (() => {
    const { subscribe, set: originalSet, update } = writable(0);

    const stored = new URL(document.location).searchParams.get('currentSlide');
    console.debug({stored})
    stored && originalSet(Number(stored)-1||0);

    window.onpopstate = ({state: {currentSlide}}) => originalSet(currentSlide || 0);
    const set = value => {
        let newURL = new URL(document.location);
        newURL.searchParams.set('currentSlide', value+1);
        history.pushState({currentSlide: value},"",newURL);
        originalSet(value)
    };

    return { subscribe, set, update };
})();
