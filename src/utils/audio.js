import*as THREE from "three"

export default class Audio {
    constructor(camera) {
        this.sounds = {};
        this.soundsLoading = {}

        this.play = (name,position,volume,detune)=>{}
        let firstClick = ()=>{
            document.removeEventListener('pointerdown', firstClick)
            let listener = new THREE.AudioListener()
            camera.add(listener)
            this.audioLoader = new THREE.AudioLoader();
            this.load('boom0', './assets/boom0.mp3')
            this.load('launch0', './assets/launch0.mp3')
            this.load('pop0', './assets/pop0.mp3')
                
            this.listener = listener;
            this.play=this._play;
            setTimeout(()=>{
                this.play('boom0')
            }
            , 1000)
        }

        document.addEventListener('pointerdown', firstClick)

    }

    load(name, url) {
        this.soundsLoading[name] = url;
        this.audioLoader.load(url, (buffer)=>{
            this.sounds[name] = {
                name,
                buffer,
                maxInstances: 6,
                instanceCount: 0
            };
        }
        );
    }

    _play(name, position, gain, detune) {
        let snd = this.sounds[name];
        if (!snd) {
            if (!this.soundsLoading[name])
                console.error(`Sound ${name} not found...`);
            return;
        }
        if (snd.instanceCount >= snd.maxInstances)
            return;

        const sound = new THREE.PositionalAudio(this.listener);
        sound.setBuffer(snd.buffer);
        sound.setRefDistance(5);
        detune && (sound.detune = detune);
        gain && (sound.gain.gain.value = gain);
        position && sound.position.copy(position);
        sound.play();
        snd.instanceCount++;
        // Dispose of the sound when it's done playing
        sound.source.onended = ()=>{
            sound.disconnect();
            sound.removeFromParent();
            snd.instanceCount--;
        }
        ;

        return sound;
    }
}
