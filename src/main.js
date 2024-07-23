import Renderer from "./utils/renderer.js"
import startApp from './utils/app.js'
let renderer3 = new Renderer();

let {THREE, scene,camera,renderer, controls, gltfLoader, flow, raycasting,ground,buttons,vec3} = renderer3;
window.app = await startApp({
    renderer3
})

let {dd} = renderer3;

renderer3.start();


import {ParticleContext} from "./components/rtparticles2.js"

import Audio from "./utils/audio.js"

let audio = new Audio(camera);


let sfx=({name,position,minGain=.05,maxGain=.3,minDetune=-700,maxDetune=-200})=>{
	audio.play(name,position,rrng(minGain,maxGain),rrng(minDetune,maxDetune))
}
//dd.moveto(0,0,0);
//dd.lineto(100,100,100);

let {abs,min,max,random,PI,sin,cos}=Math;
let rrng=(n=0,p=1)=>(random()*(p-n))+n;
let irrng=(n=0,p=1)=>((random()*(p-n))+n)|0;
let grav = -.0098;
function* mt(){}
class sys{
	constructor(){
		this.nodes = []
		this.now=performance.now()/1000;
	}
	step(){
		let now=performance.now()/1000;
		this.dt = now-this.now;
		this.now=now;
		this.ndt = this.dt/(1/60)
		let i=0,w=0;
		for(;i<this.nodes.length;i++){
			let n = this.nodes[i];
			if(!n.step()){this.nodes[w++]=n}
		}
		this.nodes.length = w;
	}
	emit(fn=mt,ctx){
		let n = new sys.node(this);
		n.flow = flow.start(fn,n,ctx);
		n.flow.onDone=()=>n.dead=true;
		n.velocity.randomDirection();
		n.velocity.x *= .1;
		n.velocity.z *= .1;
		n.velocity.y = abs(n.velocity.y);
		n.velocity.y *= .4;
		this.nodes.push(n)
		return n;
	}
}

	let _p=vec3();
	let _n=vec3();
let cscale=(c,v)=>{
	return (((((c>>0)&255)*v)|0)<<0)
			(((((c>>8)&255)*v)|0)<<8)
			(((((c>>16)&255)*v)|0)<<16);
}
sys.node = class {
	constructor(sys){
		this.sys = sys;
		this.life = .2;
		this.spawntime = sys.now
		this.mass = 1.;
		this.drag = 0;
		this.position = vec3()
		this.velocity = vec3()
		this.color = (Math.random()*(1<<24))|0;
		this.prims = new Array(8);
		this.ptop = 0;
	}
	destroyPrim(p){
		dd.pushtop(p)
		dd.moveto(0,0,0)
		dd.lineto(0,0,0)
		dd.poptop()
	}
	dispose(){
		let t=this.ptop;
		if(this.ptop>=this.prims.length)t=this.prims.length;
		for(let i=0;i<t;i++)
			this.destroyPrim(this.prims[i])
	}
	step(){
		dd.color = this.color;

		let age = min(1,(this.sys.now-this.spawntime)/this.life);

		
		if(this.ptop>=this.prims.length){
			let p = this.prims[this.ptop%this.prims.length]
			dd.pushtop(p)
			dd.moveto(0,0,0)
			dd.lineto(0,0,0)
			dd.poptop()
		}
		
		this.prims[this.ptop%this.prims.length]=dd.top();
		this.ptop++;
		dd.moveto(this.position)
		_p.copy(this.velocity);
		_p.multiplyScalar(this.sys.ndt);
		this.position.add(_p);
		dd.lineto(this.position)
		this.velocity.y += grav*this.mass*this.sys.ndt;
		if(this.position.y<0){
			this.position.y=0-this.position.y;
			this.velocity.y *= -1.;
			this.velocity.multiplyScalar(.5);
		}else{
			if(this.drag)
				this.velocity.multiplyScalar(this.drag);			
		}
		for(let i=0,t=min(this.prims.length,this.ptop);i<t;i++){
			let id=(this.ptop+i)%this.prims.length;
			let p = this.prims[id]
			let brightness = (i/t)*(((1-age)**2)*2.0);
			dd.pushtop(p)
			dd.lineCol(dd._color,brightness);
			dd.poptop()
		}
		
		if(this.dead){
			this.dispose();
			return true;
		}
	}
}


function* spark(n,shell){
	n.position.copy(shell.position);
	n.velocity.randomDirection().multiplyScalar(.23 * shell.power);
	n.velocity.add(shell.velocity);
	n.life = rrng(.8,1.);
	n.mass = rrng(0.5,1.);
	n.drag = rrng(.95,.99);
	yield n.life*1000;
}

function* shell(shell){
	shell.velocity.y+=.7;
	shell.velocity.x*=1.5;
	shell.velocity.z*=1.5;
	shell.power = rrng(1,2);
	shell.life = 1.05*shell.power;
	yield shell.life*1000;// (1900*shell.velocity.y)|0;
	shell.dead = true;
	sfx({name:(random()>.1)?'boom0':'pop0',position:shell.position,minDetune:-2000,maxDetune:500,minGain:.5,maxGain:.7});

	if(thraxBomb&&(!irrng(0,20))){
		shell.sys.emit(thraxBomb,shell);
	}
	for(let i=0;i<50;i++){
		shell.sys.emit(spark,shell);
	}
}

function* launcher(launcher){
	launcher.velocity.set(0,0,0);
	while(1){
		yield irrng(10,30);
		if(rrng()>.95)
			yield 3000;
		sfx({name:'launch0',position:launcher.position,minDetune:-500,maxDetune:3500});
		launcher.sys.emit(shell,launcher)
	}
}
let msys = new sys;
msys.emit(launcher);

flow.start(function*(){
	while(1){
		msys.step()
		yield 0;
	}
})





import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
const loader = new FontLoader();
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

let thraxBomb;
loader.load( 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function ( font ) {

	const geometry = new TextGeometry( 'thrax', {
		font: font,
		size: 16,
		depth: 1.,
		curveSegments: 2,
		bevelEnabled: true,
		bevelThickness: .1,
		bevelSize: .1,
		bevelOffset: 0,
		bevelSegments: 1
	} );
	let mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#300'}))
	
	scene.add(mesh)
	let bnds = new THREE.Box3().setFromObject(mesh);
	bnds.getCenter(_p);
	mesh.geometry.translate(-_p.x,-_p.y,-_p.z)
	bnds.getSize(_p);
	let sc=1/_p.x;
	mesh.geometry.scale(sc,sc,sc);
	//mesh.visible = false;
	//camera.add(mesh)
	//mesh.position.set()

	let mss = new MeshSurfaceSampler(mesh)
					.setWeightAttribute(  null )
					.build();


	function* meshSpark(n,shell){
		mss.sample(_p,_n);
		_p.applyQuaternion(camera.quaternion);//localToWorld(_p);
		n.position.copy(shell.position);
		n.position.add(_p);
		_p.multiplyScalar(1.5);
		n.velocity.copy(_p);
		//n.velocity.randomDirection().multiplyScalar(.23 * shell.power);
		n.velocity.add(shell.velocity);
		n.life = rrng(1.5,3);
		n.mass = 1.2;//rrng(0.1,0.11);
		n.drag = .99;//rrng(.95,.95);
		yield n.life*1000;
	}
	
	thraxBomb = function*(n,shell){
//mesh.rotation.z=rrng(0,PI*2)
//camera.localToWorld(mesh.position.set(0,0,-10));
//mesh.updateMatrix();
//	mesh.lookAt(camera.position)
		for(let i=0;i<300;i++){
			let spark = n.sys.emit(meshSpark,shell)
			spark.color = n.color;
		}
	}


	
	/*
	let s = new ParticleContext({
		renderer,
		motion:"position += velocity;"
	});
	scene.add(s.particleMesh)
	
	flow.start(function*(){
		while(1){
			s.updateParticles(this.dt)
			yield 0;
		}
	})
	*/
} );

