import *as THREE from "three"
export function ParticleContext({ renderer }) {
    // Particle count and texture size
    let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const nextPowerOfTwo = value => (value <= 0) ? 1 : 1 << 32 - Math.clz32(value - 1);

    const particleCount = 512 * 512;
    const textureSize = Math.ceil(Math.sqrt(particleCount));
    let ntex = nextPowerOfTwo(textureSize);

    // Initialize data for position, quaternion, and state
    const posData = new Float32Array(textureSize * textureSize * 4);
    const quatData = new Float32Array(textureSize * textureSize * 4);
    const stateData = new Float32Array(textureSize * textureSize * 4);

    for (let i = 0; i < particleCount; i++) {
        posData[i * 4 + 0] = (Math.random() - 0.5) * 10; // x
        posData[i * 4 + 1] = (Math.random() - 0.5) * 10; // y
        posData[i * 4 + 2] = (Math.random() - 0.5) * 10; // z
        posData[i * 4 + 3] = 1.0; // w (not used)

        quatData[i * 4 + 0] = Math.random(); // x
        quatData[i * 4 + 1] = Math.random(); // y
        quatData[i * 4 + 2] = Math.random(); // z
        quatData[i * 4 + 3] = Math.random(); // w

        stateData[i * 4 + 0] = (Math.random() - 0.5) * 0.1; // velocity x
        stateData[i * 4 + 1] = (Math.random() - 0.5) * 0.1; // velocity y
        stateData[i * 4 + 2] = (Math.random() - 0.5) * 0.1; // velocity z
        stateData[i * 4 + 3] = 0.0; // additional state info (if needed)
    }

    // Create DataTextures for the initial data
    const posTexture = new THREE.DataTexture(posData, textureSize, textureSize, THREE.RGBAFormat, THREE.FloatType);
    //posTexture.needsUpdate = true;
    const quatTexture = new THREE.DataTexture(quatData, textureSize, textureSize, THREE.RGBAFormat, THREE.FloatType);
    //quatTexture.needsUpdate = true;
    const stateTexture = new THREE.DataTexture(stateData, textureSize, textureSize, THREE.RGBAFormat, THREE.FloatType);
    //stateTexture.needsUpdate = true;

    // Create a multi-render target using WebGLRenderTarget with count
    const multiRenderTarget = new THREE.WebGLRenderTarget(textureSize, textureSize, {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
        stencilBuffer: false,
        count: 3 // Enable MRT with 3 textures
    });

    for (let i = 0; i < 3; i++) {
        multiRenderTarget.textures[i].minFilter = THREE.NearestFilter;
        multiRenderTarget.textures[i].magFilter = THREE.NearestFilter;
        multiRenderTarget.textures[i].wrapS = THREE.RepeatWrapping;
        multiRenderTarget.textures[i].wrapT = THREE.RepeatWrapping;
    }

    // Shader to initialize particle data
    const initShader = new THREE.ShaderMaterial({
        uniforms: {
            posTexture: { value: posTexture },
            quatTexture: { value: quatTexture },
            stateTexture: { value: stateTexture }
        },
        glslVersion: "300 es",
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            layout(location = 0) out vec4 fragData0;
            layout(location = 1) out vec4 fragData1;
            layout(location = 2) out vec4 fragData2;
            varying vec2 vUv;
            uniform sampler2D posTexture;
            uniform sampler2D quatTexture;
            uniform sampler2D stateTexture;
            void main() {
                fragData0 = texture(posTexture, vUv);
                fragData1 = texture(quatTexture, vUv);
                fragData2 = texture(stateTexture, vUv);
            }
        `,
        depthWrite: false,
        depthTest: false
    });
    initShader.onBeforeCompile = (s)=>{
        
    }

    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const initMesh = new THREE.Mesh(planeGeometry, initShader);
    const initScene = new THREE.Scene();
    initScene.add(initMesh);

    // Initialize particle data
    function initializeParticles(renderer) {
        renderer.setRenderTarget(multiRenderTarget);
        renderer.render(initScene, camera);
        renderer.setRenderTarget(null);
    }

    // Update shader to update particle data
    const updateShader = new THREE.ShaderMaterial({
        uniforms: {
            posTexture: { value: null },
            quatTexture: { value: null },
            stateTexture: { value: null },
            deltaTime: { value: 0.016 }
        },
        glslVersion: "300 es",
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            layout(location = 0) out vec4 fragData0;
            layout(location = 1) out vec4 fragData1;
            layout(location = 2) out vec4 fragData2;
            varying vec2 vUv;
            uniform sampler2D posTexture;
            uniform sampler2D quatTexture;
            uniform sampler2D stateTexture;
            uniform float deltaTime;
            void main() {
                vec4 pos = texture(posTexture, vUv);
                vec4 quat = texture(quatTexture, vUv);
                vec4 state = texture(stateTexture, vUv);

                // Simple physics: update position based on velocity stored in state
                pos.xyz += state.xyz * deltaTime;

                // Bounce off walls
                if (pos.x < -5.0 || pos.x > 5.0) state.x *= -1.0;
                if (pos.y < -5.0 || pos.y > 5.0) state.y *= -1.0;
                if (pos.z < -5.0 || pos.z > 5.0) state.z *= -1.0;

                fragData0 = pos;
                fragData1 = quat;
                fragData2 = state;
            }
        `,
        depthWrite: false,
        depthTest: false
    });

    const updateMesh = new THREE.Mesh(planeGeometry, updateShader);
    const updateScene = new THREE.Scene();
    updateScene.add(updateMesh);


    function updateParticles(deltaTime) {
        updateShader.uniforms.posTexture.value = currentRenderTarget.textures[0];
        updateShader.uniforms.quatTexture.value = currentRenderTarget.textures[1];
        updateShader.uniforms.stateTexture.value = currentRenderTarget.textures[2];
        updateShader.uniforms.deltaTime.value = deltaTime;

        renderer.setRenderTarget(nextRenderTarget);
        renderer.render(updateScene, camera);
        renderer.setRenderTarget(null);
        // Swap render targets
        [currentRenderTarget, nextRenderTarget] = [nextRenderTarget, currentRenderTarget];

        updateParticleMaterial();

    }

    // Initialize particle data
    initializeParticles(renderer);
    
    // Ping-Pong Render Targets
    const renderTarget1 = multiRenderTarget.clone();
    const renderTarget2 = multiRenderTarget.clone();

    let currentRenderTarget = renderTarget1;
    let nextRenderTarget = renderTarget2;

    const particleVertexShader = `
        attribute float particleIndex;
        uniform sampler2D posTexture;
        uniform sampler2D quatTexture;
        uniform sampler2D stateTexture;
        uniform float textureSize;
        varying vec2 vUv;
        void main() {
            vUv = uv;

            // Calculate UV index based on particle index
            vec2 uvIndex = vec2(
                mod(particleIndex, textureSize) / textureSize,
                floor(particleIndex / textureSize) / textureSize
            );

            // Fetch particle data from textures
            vec4 posData = texture2D(posTexture, uvIndex);
            vec4 quatData = texture2D(quatTexture, uvIndex);
            vec4 stateData = texture2D(stateTexture, uvIndex);

            // Apply position data to the quad
            posData.xz += uvIndex*100.;
            vec4 mvPosition = modelViewMatrix * vec4(posData.xyz, 1.0);
            gl_Position = projectionMatrix * mvPosition + vec4(position, 0.0);
        }
    `;

    const particleFragmentShader = `
        varying vec2 vUv;
        void main() {
            gl_FragColor = vec4(vUv, 1.0, 1.0);
        }
    `;

    // Create a geometry for the particle quads
    const particleGeometry = new THREE.InstancedBufferGeometry();
    const vertices = new Float32Array([
        -0.05, -0.05, 0.0,
        0.05, -0.05, 0.0,
        0.05, 0.05, 0.0,
        -0.05, 0.05, 0.0
    ]);
    const indices = new Uint16Array([
        0, 1, 2,
        0, 2, 3
    ]);
    const uvs = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ]);

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    particleGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    particleGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // Add the particle index as an attribute
    const particleIndices = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
        particleIndices[i] = i;
    }
    particleGeometry.setAttribute('particleIndex', new THREE.InstancedBufferAttribute(particleIndices, 1));

    // Create a shader material for the particle quads
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            posTexture: { value: null },
            quatTexture: { value: null },
            stateTexture: { value: null },
            textureSize: { value: textureSize }
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        depthWrite: false,
        depthTest: false,
        transparent: true
    });

    // Create the instanced mesh
    const particleMesh = this.instances = new THREE.InstancedMesh(particleGeometry, particleMaterial, particleCount);
    particleMesh.frustumCulled = false;

    // Update the material uniforms with the current render target textures
    function updateParticleMaterial() {
        particleMaterial.uniforms.posTexture.value = currentRenderTarget.textures[0];
        particleMaterial.uniforms.quatTexture.value = currentRenderTarget.textures[1];
        particleMaterial.uniforms.stateTexture.value = currentRenderTarget.textures[2];
    }

 //   let bx = new THREE.Mesh(new THREE.BoxGeometry(10.1,10.1,.1),new THREE.MeshBasicMaterial({map:multiRenderTarget.textures[0]}))
//particleMesh.add(bx);
    return { particleMesh, updateParticles };
}
