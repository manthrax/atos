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
        object.radius = object.scale.x * .5;
    }
    add(link) {
        links.push(link);
    }
}
let v0 = vec3();
let v1 = vec3();
let v2 = vec3();
let {min, max, sin, cos} = Math;
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
        let o0 = this.node.object;
        let o1 = this.node1.object;
        delt.setLength(this.distance * .5);
        let cent = v1.copy(o1.position).add(o0.position).multiplyScalar(.5);
        o0.position.copy(cent).sub(delt);
        o1.position.copy(cent).add(delt);

        o0.position.y = max(o0.position.y - grav, o0.radius)
        o1.position.y = max(o1.position.y - grav, o1.radius)
        if (o0.height)
            o0.position.y = max(o0.position.y, o0.height);
        if (o1.height)
            o1.position.y = max(o1.position.y, o1.height);

        this.node.object.updateMatrixWorld()
        this.node1.object.updateMatrixWorld()
        this.node1.object.localToWorld(v0.copy(this.localPositionA));
        this.node.object.position.lerp(v0, .1)
        this.node.object.localToWorld(v0.copy(this.localPositionB));
        this.node1.object.position.lerp(v0, .1);
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
let findNodes = (names)=>{
    let nodes = {}
    names.forEach(n=>nodes[n] = geckModel.scene.getObjectByName(n))
    return nodes;
}
let nd = findNodes(['nose', 'head', 'chest', 'hips', 'footleft', 'footright', 'handleft', 'handright'])
let k = Object.keys(nd);
k.forEach(k=>nd[k].height = nd[k].position.y);

nd.head.material.emissive.set(5., .5, .05);
nd.head.material.emissiveMap = nd.head.material.map;
let geck = new Fabrik(constraints)

flow.start(function*() {
    while (1) {
        let time = performance.now() / 1000;
        if (false && (buttons.buttons !== 2)) {
            if (raycasting.raycast(ground)) {
                controls.enabled = false;
                nd.nose.position.copy(raycasting.hit.point);
                //hit.point
            }
        } else {
            controls.enabled = true;
            v0.set(sin(time * .75), 0, cos(time * .55)).multiplyScalar(25);
            v1.set(cos(time * 1.9), 0, sin(-time * 1.3)).multiplyScalar(25);
            v2.set(cos(-time * 2.9), 0, sin(time * 1.93)).multiplyScalar(15);
            nd.nose.position.copy(v0.add(v1).add(v2));
        }
        dd.cls();
        if (0)
            constraints.forEach(c=>{
                let {node, node1} = c;
                dd.moveto(node.object.position);
                dd.lineto(node1.object.position);

            }
            )

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

/*
import {MTLLoader} from "three/addons/loaders/MTLLoader.js"
import {OBJLoader} from "three/addons/loaders/OBJLoader.js"
new MTLLoader()
    .setPath("./assets/")
	.load( 'small.mtl', function ( materials ) {
		materials.preload();
		new OBJLoader()
            .setPath("./assets/")
			.setMaterials( materials )
			.load( 'small.obj', function ( object ) {
				scene.add( object );
                object.position.set(0,0,0)
                object.scale.set(1,1,1);
                let mesh = object.children[0];
                let box = new THREE.Box3().setFromObject(object)
                let center = box.getCenter(new THREE.Vector3())
                mesh.geometry.translate(-center.x,-center.y,-center.z);
                let size = box.getSize(new THREE.Vector3())
                let maxSz = Math.max(size.x,Math.max(size.y,size.z));
                let rescale = 1/maxSz;
                mesh.geometry.scale(rescale,rescale,rescale);
                mesh.geometry.rotateX(Math.PI*-.5);
                object.scale.multiplyScalar(30.)
			});
	} );

scene.add(new THREE.AmbientLight());
*/

/*
let canv = document.createElement('canvas')
canv.width = canv.height = 256;
let {width,height}=canv;
let ctx = canv.getContext('2d');
ctx.clearRect(0,0,256,256)
ctx.fillStyle = 'white'
ctx.beginPath();
for(let i=0;i<10;i++){
ctx.arc(128+((Math.random()-.5)*100),128+((Math.random()-.5)*100),64,0,Math.PI*2);
}
ctx.fill();
let pln = new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canv)}))
pln.rotation.x = -Math.PI*.5
scene.add(pln)
*/
