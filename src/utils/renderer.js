import *as THREE from "three"
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {RGBELoader} from "three/addons/loaders/RGBELoader.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {GUI} from "three/addons/libs/lil-gui.module.min.js";
import PostProcessing from "./PostProcessing.js"

let gui = new GUI();
gui.close()

import {Flow} from "./flow.js"

export default function Renderer() { //{THREE,OrbitControls,RGBELoader,GLTFLoader}
    
    let {Scene, WebGLRenderer, PerspectiveCamera, Mesh, BufferGeometry, CircleGeometry, BoxGeometry, MeshBasicMaterial, Vector3, AnimationMixer, Object3D, TextureLoader, Sprite, SpriteMaterial, RepeatWrapping, } = THREE;
    this.THREE = THREE;

    let flow = this.flow = new Flow();

    
    this.vec3=(x,y,z) => new THREE.Vector3(x,y,z);
    let {random, abs, sin, cos, min, max} = Math;
    let rnd = (rng=1)=>random() * rng;
    let srnd = (rng=1)=>random() * rng * 2 - rng;
    console.log("thx🌎");

    let renderer = this.renderer = new WebGLRenderer({
        antialias: true,
    });

    renderer.setClearColor(0);

    const container = document.createElement('div')
    Object.assign(container.style,{position:'fixed',top:'0',left:'0',right:'0',bottom:'0'})
    document.body.appendChild(container)
    container.appendChild(renderer.domElement);

    let scene = this.scene = new Scene();
    let camera = this.camera = new PerspectiveCamera( 75,  1,  0.01,  1000);
    scene.add(camera);
    let controls = this.controls = new OrbitControls(camera,renderer.domElement);
    camera.position.set(-24., 54., -26.)
    controls.target.set(0, 40, 0);
    //controls.maxPolarAngle = Math.PI * 0.5;

    
    const dlight = this.directionalLight = new THREE.DirectionalLight(0xffffff,0.5);
    scene.add(dlight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    //Create a DirectionalLight and turn on shadows for the light
    dlight.position.set(10, 20, 10);
    dlight.castShadow = true;

    //Set up shadow properties for the light
    dlight.shadow.mapSize.width = 1024;
    dlight.shadow.mapSize.height = 1024;
    dlight.shadow.camera.near = 0.5;
    dlight.shadow.camera.far = 50;
    dlight.shadow.camera.left = dlight.shadow.camera.bottom = -8;
    dlight.shadow.camera.top = dlight.shadow.camera.right = 8;


    let postProcessing = this.postProcessing = new PostProcessing({THREE, renderer, scene, camera, gui});

    

    postProcessing.pauseBloom = {
        threshold:0,
        strength:3,
        radius:1
    }

    postProcessing.defaultBloom= {
        threshold:.1,
        strength:.8,
        radius:.5
    }

    Object.assign(postProcessing.bloom,postProcessing.defaultBloom);

    
    this.gltfLoader = new GLTFLoader();

    controls.enableDamping = true;

    let onWindowResize = (event)=>{
        let width = window.innerWidth;
        let height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        postProcessing && postProcessing.resize(width, height);

    }
    
    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerMove(event) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener("pointermove", onPointerMove);

    document.body.oncontextmenu = ()=>false

    let buttons = this.buttons = {
        lastButtons: 0,
        buttons: 0,
    };
    let onButtons=(e)=>{
        buttons.buttons = e.buttons;
        //e.preventDefault()
        //e.stopPropagation()
        return false;
    }
    let keys=this.keys = {}
    window.addEventListener("keydown", (e)=>{
        this.keys[e.code]=true;
    });
    window.addEventListener("keyup", (e)=>{
        this.keys[e.code]=false;
    });
    window.addEventListener("pointerdown", onButtons);
    window.addEventListener("pointerup", onButtons);
    let raycast = (target=scene)=>{
        raycaster.setFromCamera(pointer, camera);
        raycasting.lastHit = raycasting.intersects[0];
        raycasting.intersects.length = 0;
        if (buttons.buttons == 1) {
        } else
            raycasting.startHit = null;
        // calculate objects intersecting the picking ray
        raycaster.intersectObject(target, true, raycasting.intersects);
        raycasting.hit = raycasting.intersects[0];
        if (!buttons.lastButtons) {
            raycasting.startHit = raycasting.hit;
        }
        return raycasting.hit ? true : false;
    }
    
    let raycasting = this.raycasting = {
        intersects: [],
        lastHit: null,
        hit: null,
        raycast,
        buttons
    };
    
    let pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    let envMap;
    this.loadEnvironmentMap= async ({url="./pretville_street_1k (4).hdr",blur=1.}={})=>{
        return new Promise((resolve,reject)=>{
            new RGBELoader().setPath("").load(url, function(texture) {
                envMap = pmremGenerator.fromEquirectangular(texture).texture;
                const blurFactor = .041 * blur;  //Blur the envmap...
                let nscene = new THREE.Scene();
                nscene.environment = envMap;
                nscene.background = envMap;
                texture.dispose();
                scene.background = scene.environment = pmremGenerator.fromScene(nscene,blurFactor).texture;
                pmremGenerator.dispose();
                resolve(scene.environment);
            });
        })
    }
    let ground = this.ground = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({
        color: "white"
    }));
    ground.castShadow = ground.receiveShadow = true;
    ground.scale.set(50, 0.1, 50);
    ground.position.set(0, -0.05, 0);
    scene.add(ground);
    ground.castShadow = ground.receiveShadow = true;

    this.onFrame=null;

    let lastTime;
    let animationLoop = (time)=>{
        let dt=lastTime?(time-lastTime):0;
        lastTime = time;
        this.onFrame && this.onFrame(dt,time)
        flow.updateAll();
        controls.update();
        postProcessing&&postProcessing.render()
//        renderer.render(scene, camera);
    }
    this.start = ()=>renderer.setAnimationLoop(animationLoop)

    let factory={
        'box':()=>new THREE.BoxGeometry(),
        'sphere':()=>new THREE.SphereGeometry(.5),
    }
    this.mesh = ({type='box',geometry,position,rotation,scale,material,metalness,roughness,color}={})=>{
        let mgeometry = geometry||factory[type]();
        let mmaterial = material||new THREE.MeshStandardMaterial({color:color||'red',metalness:metalness||.7,roughness:roughness||.3})
        let mesh = new THREE.Mesh(mgeometry,mmaterial);
        position && mesh.position.copy(position);
        rotation && mesh.rotation.copy(rotation);
        scale && mesh.scale.copy(scale);
        mesh.castShadow = mesh.receiveShadow = true;
        return mesh;
    }
}



/*

   0
 / | \
1--|--2
 \ | /
   3

0---1
|\  |\
| 3---2
4-|-5 |
 \|  \|
  7---6
*/
//camera.add(new THREE.PointLight("white",0.1));
//let url = 'https://cdn.glitch.global/87ad3a8e-ef04-4e2e-a8f1-c2cc0650016d/slot_machine.glb?v=1710267118261'
//import {GUI} from "three/addons/libs/lil-gui.module.min.js";
//import * as SkeletonUtils from "threeModules/utils/SkeletonUtils.js";
 /*this.gltfLoader.load(url,(glb)=>{
  scene.add(glb.scene)
  let meshes=[]
  glb.scene.traverse(e=>e.isMesh&&meshes.push(e))
  meshes.forEach(m=>{
    if(m.material.type=='MeshPhysicalMaterial'){
      let {type,opacity,map,color,metalness,roughness}=m.material;
      m.material = new THREE.MeshStandardMaterial({type,opacity,map,color,metalness,roughness})
      console.log(type,opacity,map,color,metalness,roughness)
    }
  })
  //glb.scene.scale.multiplyScalar(100.)
  console.log("mesh count:",meshes.length)
})
*/
//controls.autoRotate=true;