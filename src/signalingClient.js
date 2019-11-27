import {
    offerStore, answerStore, candidatesStore,
    sendOfferFrom, sendAnswerFrom, sendCandidateFrom, clearCandidatesFrom
} from './signalingStore.js';

export class SignalingClient {
    constructor({to, from}) {
        this.to = to;
        this.from = from;
    }

    connect({url}) {
        this.url = url;
        const socket = new WebSocket(url);
        socket.onopen = () => {
            this.socket = socket;
            this.socket.onmessage = this.received.bind(this);
        };
    }

    received({data}) {
        const payload = JSON.parse(data)
        const { [this.to]: forMe, type} = payload;

        console.debug('its for me!', forMe);

        const from = this.to;
        switch (type) {
            case 'offer':     {sendOfferFrom({from, offer: forMe})}; break;
            case 'answer':    {sendAnswerFrom({from, answer: forMe})}; break;
            case 'candidate': {sendCandidateFrom({from, candidate: new RTCIceCandidate(forMe)})}; break;
        }
    }

    sendOffer(offer) {
        if (offer) {
            const payload = {[this.from]: offer, type: 'offer'};
            this.send(payload);
        }
    }

    sendAnswer(answer) {
        if (answer) {
            const payload = {[this.from]: answer, type: 'answer'};
            this.send(payload);
        }
    }

    sendCandidate(candidate) {
        if (candidate) {
            const payload = {[this.from]: candidate, type: 'candidate'};
            this.send(payload);
        }
    }

    send(obj) {
        if (this.socket) {
            const payload = JSON.stringify(obj);
            this.socket.send(payload)
        } else {
        }
    }

    toString() {
        return `[Signaling Server calling ${this.from} → ${this.to}]`;
    }
}