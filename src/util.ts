export const justTheSdp = thing =>
    typeof thing === 'string'
    ? JSON.parse(thing).sdp
    : typeof thing === 'object'
    ? thing.sdp : undefined;

export const safeParse = <T>(json: string, fallback: T): T => {
    try {
        return JSON.parse(json);
    } catch (parseError) {
        if (json !== '') console.warn({ parseError });
        return fallback;
    }
};

export const packOffer = (sdp: string): RTCSessionDescriptionInit => ({ type: 'offer', sdp });
export const packAnswer = (sdp: string): RTCSessionDescriptionInit => ({ type: 'answer', sdp });