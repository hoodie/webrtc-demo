export const justTheSdp = thing =>
    typeof thing === 'string'
    ? JSON.parse(thing).sdp
    : typeof thing === 'object'
    ? thing.sdp : undefined;

export const safeParse = json => {
    try {
        return JSON.parse(json);
    } catch (parseError) {
        if (json !== '') console.warn({ parseError });
        return [];
    }
};

export const packOffer = sdp => ({ type: 'offer', sdp });
export const packAnswer = sdp => ({ type: 'answer', sdp });