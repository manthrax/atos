import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
export default function PostProcessing({THREE, renderer, scene, camera, gui}) {

    let composer = new EffectComposer(renderer);
composer.renderTarget1.samples = 8;
composer.renderTarget2.samples = 8;
    const renderPass = new RenderPass(scene,camera);
    composer.addPass(renderPass);

    const params = {
        threshold: .23,
        strength: .036,
        radius: 0
    };

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth,window.innerHeight),1.5,0.4,0.85);
    bloomPass.threshold = params.threshold;
    bloomPass.strength = params.strength;
    bloomPass.radius = params.radius;
    composer.addPass(bloomPass);
    let bloom=this.bloom={
        set threshold(v){
            bloomPass.threshold = Number(v);    
        },
        set strength(v){
            bloomPass.strength = Number(v);
        },
        set radius(v){
            bloomPass.radius = Number(v);
            bloomUniforms.bloomRadius.value = bloomPass.radius
        }
    }

    
    const bloomFolder = gui.addFolder('bloom');

    let bloomUniforms = bloomPass.compositeMaterial.uniforms;
    let bfac= bloomUniforms.bloomFactors.value;
    for(let i=0;i<5;i++)bfac[i]=10.1-(2.02*i);

    bloomFolder.add(params, 'threshold', 0.0, 1.0).onChange((v)=>bloom.threshold = v);
    bloomFolder.add(params, 'strength', 0.0, 3.0).onChange((v)=>bloom.strength = v);
    bloomFolder.add(params, 'radius', 0.0, 1.0).step(0.01).onChange((v)=>bloom.radius = v);
    
    bloomFolder.close();
    const wwidth = window.innerWidth;
    const wheight = window.innerHeight;

    let resize = this.resize=(width,height)=>{
        composer.setSize(width, height);
        
    }
    function onWindowResize() {

        const width = window.innerWidth;
        const height = window.innerHeight;
        resize(width,height)
    }

    /*
    const gtaoPass = new GTAOPass(scene,camera,wwidth,wheight);
    gtaoPass.output = GTAOPass.OUTPUT.Default;

    composer.addPass(gtaoPass);

    const aoParameters = {
        radius: 0.25,
        distanceExponent: 1.,
        thickness: 1.,
        scale: 1.,
        samples: 16,
        distanceFallOff: 1.,
        screenSpaceRadius: false,
    };
    const pdParameters = {
        lumaPhi: 10.,
        depthPhi: 2.,
        normalPhi: 3.,
        radius: 4.,
        radiusExponent: 1.,
        rings: 2.,
        samples: 16,
    };
    gtaoPass.updateGtaoMaterial(aoParameters);
    gtaoPass.updatePdMaterial(pdParameters);
    const gtaoFolder = gui.addFolder('gtao');
    gtaoFolder.add(gtaoPass, 'blendIntensity').min(0).max(1).step(0.01);
    gtaoFolder.add(aoParameters, 'radius').min(0.01).max(1).step(0.01).onChange(()=>gtaoPass.updateGtaoMaterial(aoParameters));
    gtaoFolder.add(aoParameters, 'distanceExponent').min(1).max(4).step(0.01).onChange(()=>gtaoPass.updateGtaoMaterial(aoParameters));
    gtaoFolder.add(aoParameters, 'thickness').min(0.01).max(10).step(0.01).onChange(()=>gtaoPass.updateGtaoMaterial(aoParameters));
    gtaoFolder.add(aoParameters, 'distanceFallOff').min(0).max(1).step(0.01).onChange(()=>gtaoPass.updateGtaoMaterial(aoParameters));
    gtaoFolder.add(aoParameters, 'scale').min(0.01).max(2.0).step(0.01).onChange(()=>gtaoPass.updateGtaoMaterial(aoParameters));
    gtaoFolder.add(aoParameters, 'samples').min(2).max(32).step(1).onChange(()=>gtaoPass.updateGtaoMaterial(aoParameters));
    gtaoFolder.add(aoParameters, 'screenSpaceRadius').onChange(()=>gtaoPass.updateGtaoMaterial(aoParameters));
    gtaoFolder.add(pdParameters, 'lumaPhi').min(0).max(20).step(0.01).onChange(()=>gtaoPass.updatePdMaterial(pdParameters));
    gtaoFolder.add(pdParameters, 'depthPhi').min(0.01).max(20).step(0.01).onChange(()=>gtaoPass.updatePdMaterial(pdParameters));
    gtaoFolder.add(pdParameters, 'normalPhi').min(0.01).max(20).step(0.01).onChange(()=>gtaoPass.updatePdMaterial(pdParameters));
    gtaoFolder.add(pdParameters, 'radius').min(0).max(32).step(1).onChange(()=>gtaoPass.updatePdMaterial(pdParameters));
    gtaoFolder.add(pdParameters, 'radiusExponent').min(0.1).max(4.).step(0.1).onChange(()=>gtaoPass.updatePdMaterial(pdParameters));
    gtaoFolder.add(pdParameters, 'rings').min(1).max(16).step(0.125).onChange(()=>gtaoPass.updatePdMaterial(pdParameters));
    gtaoFolder.add(pdParameters, 'samples').min(2).max(32).step(1).onChange(()=>gtaoPass.updatePdMaterial(pdParameters));
    
    gui.add(gtaoPass, 'output', {
        'Default': GTAOPass.OUTPUT.Default,
        'Diffuse': GTAOPass.OUTPUT.Diffuse,
        'AO Only': GTAOPass.OUTPUT.AO,
        'AO Only + Denoise': GTAOPass.OUTPUT.Denoise,
        'Depth': GTAOPass.OUTPUT.Depth,
        'Normal': GTAOPass.OUTPUT.Normal
    }).onChange(function(value) {

        gtaoPass.output = value;

    });


*/
    window.addEventListener('resize', onWindowResize);

    const outputPass = new OutputPass();

    composer.addPass(outputPass);

    this.render = ()=>{

        //let saveClear = renderer.autoClear;
        //renderer.autoClear = false;
        //postRenderer.renderPost(renderer, postTarget, screenTarget)
        //renderer.autoClear = true;
        composer.render(scene, camera)
    }
}
