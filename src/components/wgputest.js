import * as THREE from 'three';
import {range,texture,mix,uv,color,positionLocal,timerLocal,SpriteNodeMaterial,float} from 'three/nodes';
import WebGL from 'three/addons/capabilities/WebGL.js';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

//- Smoke
let SmkMat = "https://threejs.org/examples/textures/opengameart/smoke1.png";
let SmkMap = 0;

// Standard
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
// Camera
let {innerWidth, innerHeight} = window;
let camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 1, 5000);
	camera.position.set(30,0,-10);
// Renderer
let renderer = new WebGPURenderer({antialias: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setAnimationLoop(rendAll);
	document.body.appendChild(renderer.domElement);
// Controls
let controls = new OrbitControls(camera, renderer.domElement);
//
	window.addEventListener('resize', onWindowResize);

let txtrLoader = new THREE.TextureLoader();

//= MAIN PROGRAM ===============================================================
	loadAll();
	initAll();

//= LOAD ALL ===================================================================
function loadAll() {
	loadSmkMat();
}

//= INIT ALL ===================================================================
function initAll() {
	initSmokeW();
}

//= RENDALL ALL ===================================================================
function rendAll() {
	renderer.render(scene, camera);
}

//= SMOKE ======================================================================

//- Load Smoke -----------------------------------------------------------------
function loadSmkMat() {
	SmkMap = txtrLoader.load(SmkMat);
}

//- Init Smoke -----------------------------------------------------------------
function initSmokeW() {
	// create nodes
	let lifeRange = range(0.1,1);
	let offsetRange = range(new THREE.Vector3(0,3,0), new THREE.Vector3(0,5,0));
	let timer = timerLocal(.2,1);
	let lifeTime = timer.mul(lifeRange).mod(.05);
	let scaleRange = range(.01,.02);
	let rotateRange = range(.1,4);
	let life = lifeTime.div(lifeRange);
	let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
	let textureNode = texture(SmkMap, uv().rotateUV(timer.mul(rotateRange)));
//	let opacityNode = 0.01;
//  let opacityNode = textureNode.a.mul(life.oneMinus(),0.1);
//  let opacityNode = textureNode.a.mul(life.oneMinus(),0.05);
  let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);
//  let opacityNode = textureNode.a.mul(life.pow(20).oneMinus(),0.1);
	// Smoke
	let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
	let smokeNodeMaterial = new SpriteNodeMaterial();
		smokeNodeMaterial.colorNode = mix(color(0xffffff), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		smokeNodeMaterial.opacityNode = opacityNode;
		smokeNodeMaterial.positionNode = offsetRange.mul(lifeTime);
		smokeNodeMaterial.scaleNode = scaleRange.mul(lifeTime.max(0.3));
		smokeNodeMaterial.depthWrite = false;
		smokeNodeMaterial.transparent = true;
	let smokeInstancedSprite = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), smokeNodeMaterial);
		smokeInstancedSprite.scale.setScalar(400);
		smokeInstancedSprite.isInstancedMesh = true;
		smokeInstancedSprite.count = 100;
		smokeInstancedSprite.rotation.x = Math.PI/2;
		scene.add(smokeInstancedSprite);
}

function onWindowResize() {
	let {innerWidth, innerHeight} = window;
	camera.aspect = innerWidth / innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(innerWidth, innerHeight);
}
