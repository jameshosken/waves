class SpatialAudioContext {

    constructor() {
        try {
            // it appears chrome supports up to 6 audio contexts per tab, so we either need to limit contexts created, or swap buffers and change positions
            // TODO: check how many contexts are already open
            const ctx = window.AudioContext || window.webkitAudioContext;
            this.context = new ctx({
                                latencyHint: 'interactive',
                                sampleRate: 44100,
                               });
        } catch(e) {
            alert('Web Audio API is not supported in this browser');
        }

        // keep track of listener objects associated with the files
        // this.listeners = {};
        this.listener = this.context.listener;

        this.initGain();
        this.initPanner();
    };

    updateListener(head_position, head_orientation) {
        const rot = CG.matrixFromQuaternion(head_orientation);
        const forward = CG.matrixTransform(rot, [0, 0, -1]);

        this.context.listener.setOrientation(forward[0], forward[1], forward[2], 0, 1, 0);

        this.context.listener.positionX.value = head_position[0];
        // this.context.listener.positionY.value = head_position[1];
        this.context.listener.positionZ.value = head_position[2];
    };

    initPanner(innerAngle = 360, outerAngle = 360, outerGain = 0.2, refDistance = .1, maxDistance = 10000, rollOff = 1.5) {
        this.panner = new PannerNode(this.context, {
            // equalpower or HRTF
            panningModel: 'HRTF',
            // linear, inverse, exponential
            distanceModel: 'exponential',
            positionX: 0.0,
            positionY: 0.0,
            positionZ: 0.0,
            orientationX: 0.0,
            orientationY: 0.0,
            orientationZ: 0.0,
            refDistance: refDistance,
            maxDistance: maxDistance,
            rolloffFactor: rollOff,
            coneInnerAngle: innerAngle,
            coneOuterAngle: outerAngle,
            coneOuterGain: outerGain
        });
    };

    initGain() {
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
    };

    // freq(Hz), volume(0.0 ~ 1.0), duration(s)
    playToneAt(freq, volume, dur, sound_position, sound_orientation = [0,0,0], type = "square") {
        this.panner.setPosition(sound_position[0], sound_position[1], sound_position[2]);
        this.panner.setOrientation(sound_orientation[0], sound_orientation[1], sound_orientation[2]);

        this.oscillator = this.context.createOscillator();
        let osc = this.oscillator;
        osc
            .connect(this.panner)
            .connect(this.gainNode);

        osc.frequency.value = freq;
        osc.type = type;
        // sine, square, sawtooth, triangle, custom
        this.gainNode.gain.value = volume;
        // 0 ~ 1
        osc.start();
        osc.stop(this.context.currentTime + dur);
        delete this.oscillator;
    };
};