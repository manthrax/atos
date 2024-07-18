import Renderer from "./utils/renderer.js"
import startApp from './utils/app.js'
let renderer3 = new Renderer();

let {THREE, scene, controls, gltfLoader, flow, raycasting,ground,buttons,vec3} = renderer3;
window.app = await startApp({
    renderer3
})

let {dd} = renderer3;

class Fabrik {
    constructor(constraints) {
        this.constraints = constraints;
    }
    update(steps) {
        let {constraints} = this;
        for (let s = 0; s < steps; s++) {
            for (let i = 0, il = constraints.length; i < il; i++)
                constraints[i].apply()
            for (let i = constraints.length - 1, il = 0; i >= il; i--)
                constraints[i].apply()
        }
    }
}

Fabrik.Node = class {
    constraints = [];
    constructor(object) {
        this.object = object;
        object.radius = object.scale.x*.5;
    }
    add(link) {
        links.push(link);
    }
}
let v0=vec3();
let v1=vec3();
let v2=vec3();
let {min,max,sin,cos} = Math;
let grav = .01;
Fabrik.DistanceConstraint = class {
    constructor(node, node1, distance) {
        this.node1 = node1;
        this.node = node;
        this.distance = distance || (node.object.position.distanceTo(node1.object.position));
        this.localPositionA = node1.object.worldToLocal(node.object.position.clone())
        this.localPositionB = node.object.worldToLocal(node1.object.position.clone())
    }
    apply() {
        let delt = v0.copy(this.node1.object.position).sub(this.node.object.position);
        let o0=this.node.object;
        let o1=this.node1.object;
        delt.setLength(this.distance*.5);
        let cent = v1.copy(o1.position).add(o0.position).multiplyScalar(.5);
        o0.position.copy(cent).sub(delt);
        o1.position.copy(cent).add(delt);

        
        o0.position.y = max(o0.position.y-grav,o0.radius)
        o1.position.y = max(o1.position.y-grav,o1.radius)
        if(o0.height)o0.position.y = max(o0.position.y,o0.height);
        if(o1.height)o1.position.y = max(o1.position.y,o1.height);
        
        this.node.object.updateMatrixWorld()
        this.node1.object.updateMatrixWorld()
        this.node1.object.localToWorld(v0.copy(this.localPositionA));
        this.node.object.position.lerp(v0,.1)
        this.node.object.localToWorld(v0.copy(this.localPositionB));
        this.node1.object.position.lerp(v0,.1);
        this.node.object.updateMatrixWorld()
        this.node1.object.updateMatrixWorld()
    }
}

let geckModel = await gltfLoader.loadAsync('./assets/gecko.glb')
let nodes = []
geckModel.scene.updateMatrixWorld(true)
geckModel.scene.traverse(e=>e.isMesh && nodes.push(new Fabrik.Node(e)));

scene.add(geckModel.scene)

let constraints = []
let nnodes = nodes.length;
let sphereDistanceSigned = (s0,s1)=>{
    return s0.object.position.distanceTo(s1.object.position) - ((s0.object.scale.x + s1.object.scale.x) * .5);
}
dd.lines.material.depthTest = false;
for (let i = 0; i < nnodes; i++) {
    for (let j = i; j < nnodes; j++) {
        if (i !== j) {
            let n1 = nodes[i];
            let n2 = nodes[j];
            let sd = sphereDistanceSigned(n1, n2);
            if (sd < .1) {
                //console.log("adding", n1.object.name, n2.object.name, sd);
                let c = new Fabrik.DistanceConstraint(n1,n2);
                constraints.push(c);
            }
        }
    }
}
let findNodes=(names)=>{
    let nodes={}
    names.forEach(n=>nodes[n]=geckModel.scene.getObjectByName(n))
    return nodes;
}
let nd = findNodes(['nose','head','chest','hips','footleft','footright','handleft','handright'])
let k = Object.keys(nd);
k.forEach(k=>nd[k].height=nd[k].position.y);

nd.head.material.emissive.set(5.,.5,.05);
nd.head.material.emissiveMap = nd.head.material.map;
let geck = new Fabrik(constraints)

flow.start(function*() {
    while (1) {
        let time = performance.now()/1000;
        if(buttons.buttons!==2){
            if(raycasting.raycast(ground)){
                controls.enabled = false;
                nd.nose.position.copy(raycasting.hit.point);
                //hit.point
            } 
        }else{
            controls.enabled = true;
            v0.set(sin(time*.75),0,cos(time*.55)).multiplyScalar(25);
            v1.set(cos(time*1.9),0,sin(-time*1.3)).multiplyScalar(25);
            v2.set(cos(-time*2.9),0,sin(time*1.93)).multiplyScalar(15);
            nd.nose.position.copy(v0.add(v1).add(v2));
        }
        dd.cls();
        if(0)
        constraints.forEach(c=>{
            let {node,node1} = c;
            dd.moveto(node.object.position);
            dd.lineto(node1.object.position);
            
        })
        
        /*
        let msin = Math.sin(performance.now()/1000);
        constraints.forEach(c=>{
            if(!c.baseDistance)c.baseDistance = c.distance;
            c.distance = c.baseDistance + (msin*c.baseDistance*.5);
        })
        */
        geck.update(6);
        yield 0;
    }
})

//scene.add(new THREE.Mesh(new THREE.SphereGeometry()))//,new THREE.MeshStandardMaterial()));

renderer3.start();
