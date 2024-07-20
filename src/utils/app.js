//import "./test.js"

import {OBJLoader} from "three/addons/loaders/OBJLoader.js"
import DebugDrawer from "./DebugDrawer.js"
export default async function startApp({renderer3}) {
    let {THREE, renderer, scene, camera, controls, ground, flow, buttons, directionalLight, raycasting, vec3, gltfLoader,keys,gui,postProcessing} = renderer3;

/*
    THREE.DefaultLoadingManager.setURLModifier((url)=>{
        return './assets/'+url;
    })
    if (0)
        await renderer3.loadEnvironmentMap({
            blur: 1
        });*/
    ground.visible = false;

    //renderer3.start();

    let dd = renderer3.dd = new DebugDrawer({
        THREE
        
    });
    scene.add(dd.lines);
    let v0 = vec3();
    let {min, max} = Math;
    let camVel = 0;


    let minCamDist = 1.;
    let maxCamDist = 130.0;
    let camDist = 1.9;
    let targetCamDist = camera.position.distanceTo(controls.target);
    let clamp=(v,min,max)=>v<min?min:(v>max)?max:v
   // controls.enableZoom = false;
    document.addEventListener('wheel',e=>{
        let dlt = e.deltaY;
        targetCamDist += dlt*.001*camDist; //Scale by distance
        targetCamDist = clamp(targetCamDist,minCamDist,maxCamDist)     
    })
    let activeControls={
        camera,controls
    }

    flow.start(function*(){
        //Make camera chase the 
        while(1){
            if(targetCamDist!==camDist){
                camDist += (targetCamDist-camDist)*.05;
                camDist = clamp(camDist,minCamDist,maxCamDist)
                activeControls.camera.position.sub(activeControls.controls.target).setLength(camDist).add(activeControls.controls.target);
            }
            yield 0;
        }
    })
    return{
        activeControls
    }
}

let waveDots=()=>{
    
    let pgeom = new THREE.PlaneGeometry(50,50,100,100)
    let pts = new THREE.Points(pgeom,new THREE.PointsMaterial({
        size:10.2,
        color:'#222',
        blending:THREE.AdditiveBlending,
        transparent:true,
        sizeAttenuation:false,
        vertexColors:true,
        depthWrite:false
    }));
    pts.rotation.x = Math.PI*.5;
    pts.material.onBeforeCompile=(shader)=>{
        shader.uniforms.time = {get value(){return performance.now()/1000}}
        shader.vertexShader=`
            uniform float time;
        `+shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <color_vertex>",`#include <color_vertex>
#ifdef USE_COLOR
    vColor.rgb = abs(vec3(cos(time+position.x*.07),sin(time+position.y*.06),cos(time+position.x*.03)));
#endif
        `)
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
transformed = vec3( position );
transformed.z = sin(time+(transformed.x*.3))*sin((time*.7)+(transformed.y*.5))*1.2;
#ifdef USE_ALPHAHASH
    vPosition = transformed;//vec3( position );
#endif
        `)
        shader.fragmentShader = shader.fragmentShader.replace(`#include <color_fragment>`,`#include <color_fragment>
    diffuseColor.rgba *= smoothstep(1.,0.,length(gl_PointCoord-.5)*2.);
        `) 
    }
    scene.add(pts);
    
}