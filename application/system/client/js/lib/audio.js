class SpatialAudioContext {

    constructor(files = []) {

        try {
            // it appears chrome supports up to 6 audio contexts per tab, so we either need to limit contexts created, or swap buffers and change positions
            // TODO: check how many contexts are already open
            const ctx = window.AudioContext || window.webkitAudioContext;
            this.context = new ctx({
                latencyHint: 'interactive',
                sampleRate: 44100,
            });
        } catch (e) {
            alert('Web Audio API is not supported in this browser');
        }

        // store loaded buffers here
        this.cache = {};

        this.reverbCache = {};
        // keep track of listener objects associated with the files
        // this.listeners = {};
        this.listener = this.context.listener;

        files.forEach((f) => {
            this.loadFile(f);
        });

        this.initGain();
        this.setGain(6);
        this.initReverb();
        this.initPanner();
        this.pausedAt = 0;
        this.startedAt = 0;
        this.playing = false;

        this.wave = "sawtooth"; // <<- JH: Change this for different sound waves. sine, square, sawtooth, triangle

        this.osc = null;

        this.stopTimer = null;

    };


    updateListener(head_position, head_orientation) {
        const rot = CG.matrixFromQuaternion(head_orientation);
        const forward = CG.matrixTransform(rot, [0, 0, -1]);

        this.context.listener.setOrientation(forward[0], forward[1], forward[2], 0, 1, 0);

        this.context.listener.positionX.value = head_position[0];
        // this.context.listener.positionY.value = head_position[1];
        this.context.listener.positionZ.value = head_position[2];
    }

    isPlaying() { return this.playing; };

    getDuration(url) {
        return this.cache[url].duration;
    };

    resume() {
        // this.playing = true;
        return this.context.resume();
    };

    playFileAt(url, sound_position, sound_orientation = [0, 0, 0], offset = 0.0, time = 0.0) {

        if (!(url in this.cache)) {
            console.log("invalid url, not currently loaded");
            this.loadFile(url);
            return;
        }

        const source = this.context.createBufferSource();
        source.buffer = this.cache[url];

        this.panner.setPosition(sound_position[0], sound_position[1], sound_position[2]);
        this.panner.setOrientation(sound_orientation[0], sound_orientation[1], sound_orientation[2]);

        source
            .connect(this.panner)
            .connect(this.gainNode)
            .connect(this.context.destination);

        source.start(this.context.currentTime + time, offset);

        let timer = setTimeout(() => {
            this.stop(source);
            // this.playing = false;
        }, source.buffer.duration * 1000);

        this.playing = true;

    };

    stop(source) {
        source.stop();
        this.playing = false;
    };

    pause(url) {
        // TODO: track 
    };

    async loadFile(url) {

        console.log("fetching...", url);

        const response = await axios.get(url, {
            responseType: 'arraybuffer', // <- important param
        });

        console.log("decoding...", url);
        const audioBuffer = await this.context.decodeAudioData(response.data);
        this.cache[url] = audioBuffer;

    };

    unloadFile(url) {
        delete this.cache[url];
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
    };

    setGain(level) {
        this.gainNode.gain.value = level;
    };

    initReverb(url) {

        this.reverbNode = this.context.createConvolver();
        this.reverbNode.buffer = this.reverbCache[url];
    };

    setImpulseResponse(url) {
        if (!(url in this.reverbCache)) {
            console.log("invalid url, not currently loaded");
        }

        this.reverbNode.buffer = this.reverbCache[url];
    };

    /* MODS FOR SYNTH BELOW */

    playToneAt(position, orientation = [0, 0, 0]) {

        this.panner.setPosition(position[0], position[1], position[2]);
        this.panner.setOrientation(orientation[0], orientation[1], orientation[2]);

        //Proof of concept - take height from position and map to freq:
        let freq = this.map_range(position[1], -1, 2, 27, 2700)
        this.osc = this.playTone(freq);

    }

    reset() {
        this.osc = null;
    }

    playTone(freq) {
        
        /**JH: Envelope is in basic terms how the sound enters and exits. 
         * A low attack means the sound reaches peak volume relatively 
         * quickly (as if the instrument was struck), and a high
         * release means the sound lingers around for longer. */

        this.envelope = {
            attack: 0.1,
            release: .5
        }


        let now = this.context.currentTime;
        let osc = this.context.createOscillator();

        
        let envGainNode = this.context.createGain();

        osc.type = this.wave;
        osc.frequency.value = freq;

        // envGain.cancelScheduledValues(now);
        envGainNode.gain.setValueAtTime(0, now);
        envGainNode.gain.linearRampToValueAtTime(1, now + this.envelope.attack);
        envGainNode.gain.linearRampToValueAtTime(0, now + this.envelope.attack + this.envelope.release);
        osc
            .connect(this.panner)
            .connect(this.gainNode)     // Spatial
            .connect(envGainNode)       //Envelope
            .connect(this.context.destination);

        osc.start();

        let dur = (this.envelope.attack + this.envelope.release)
        osc.stop(now + dur + 1);    //+1 helps prevent popping at the end of tones
        return osc;

        

    }


    map_range(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }

};


