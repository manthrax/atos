import Renderer from "./utils/renderer.js"
import startApp from './utils/app.js'
let renderer3 = new Renderer();

let {THREE, scene, controls, gltfLoader, flow, raycasting,ground,buttons,vec3} = renderer3;
window.app = await startApp({
    renderer3
})

let {dd} = renderer3;

renderer3.start();


//dd.moveto(0,0,0);
//dd.lineto(100,100,100);

let {abs,min,max,random,PI,sin,cos}=Math;
let rrng=(n=0,p=1)=>(random()*(p-n))+n;
let grav = -.0098;
function* mt(){}
class sys{
	constructor(){
		this.nodes = []
	}
	step(){
		let i=0,w=0;
		for(;i<this.nodes.length;i++){
			let n = this.nodes[i];
			if(!n.step()){this.nodes[w++]=n}
		}
		this.nodes.length = w;
	}
	emit(fn=mt){
		let n = new sys.node(this);
		flow.start(fn,n);
		n.velocity.randomDirection();
		n.velocity.x *= .1;
		n.velocity.z *= .1;
		n.velocity.y = abs(n.velocity.y);
		n.velocity.y *= .4;
		this.nodes.push(n)
		return n;
	}
}
sys.node = class {

	constructor(sys){
		this.sys = sys;
		this.fuse = 150;
		this.mass = 1.;
		this.drag = 0;
		this.position = vec3()
		this.velocity = vec3()
		this.color = (Math.random()*(1<<24))|0;
		this.prims = new Array(2);
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
		this.fuse = 0;
	}
	step(){
		dd.color = this.color;
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
		this.position.add(this.velocity);
		dd.lineto(this.position)
		this.velocity.y += grav*this.mass;
		this.fuse--;
		if(this.position.y<0){
			this.position.y=0-this.position.y;
			this.velocity.y *= -1.;
			this.velocity.multiplyScalar(.5);
		}else{
			if(this.drag)
				this.velocity.multiplyScalar(this.drag);			
		}
		if(this.fuse<=0){
			this.dispose();
			return true;
		}
	}
}


function* shell(shell){
	shell.velocity.y+=.5;
	shell.velocity.x*=1.5;
	shell.velocity.z*=1.5;
	yield (1900*shell.velocity.y)|0;
	shell.fuse = 0;
	shell.power = rrng(1,2);
	function* spark(n){
		n.position.copy(shell.position);
		n.velocity.randomDirection().multiplyScalar(.23 * shell.power);
		n.velocity.add(shell.velocity);
		n.fuse = 50;
		n.mass = 0.1;
		n.drag = .9
	}
	for(let i=0;i<50;i++){
		shell.sys.emit(spark);
	}
}

function* launcher(launcher){
	launcher.velocity.set(0,0,0);
	while(1){
		yield 1;
		launcher.sys.emit(shell)
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