/**
 * MyBrand Web 3D Application - Final Rendering Fix
 */

const FALLBACK_MODELS = {
    "models": [
        {
            "id": "model1",
            "name": "Eco Water Bottle",
            "path": "assets/models/model1.glb",
            "description": "Premium 500ml water bottle featuring a high-clarity polymer simulation. This model utilizes a custom Fresnel Shader for realistic rim lighting.",
            "designChoices": "Transparency and refraction experiments.",
            "audio": "assets/audio/can_opening_edited.mp3",
            "cameraDistanceScale": 1.85,
            "cameras": [{"name": "Hero", "position": [0, 5, 10]}]
        },
        {
            "id": "model2",
            "name": "Soda Can (PBR)",
            "path": "assets/models/model2.glb",
            "description": "Aluminum can with PBR textures. Integrated with Bloom post-processing for a metallic shine.",
            "designChoices": "Reflectivity and metallic workflow.",
            "audio": "assets/audio/can_opening_edited.mp3",
            "cameras": [{"name": "Detail", "position": [5, 5, 5]}]
        },
        {
            "id": "model3",
            "name": "Crushed Can (Physics)",
            "path": "assets/models/model3.glb",
            "description": "Simulation of a crushed aluminum object. Showcases complex mesh topology and vertex manipulation.",
            "designChoices": "Mesh deformation and topology study.",
            "audio": "assets/audio/can_crush.mp3",
            "cameras": [{"name": "Overview", "position": [0, 10, 0]}]
        }
    ]
};

class Web3DApp {
    constructor() {
        this.modelsData = FALLBACK_MODELS.models;
        this.currentModel = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.clock = new THREE.Clock();
        this.lights = [];
        this.isLightingEnabled = true;
        this.isWireframe = false;
        this.useComposer = false; // DISABLED BY DEFAULT FOR RENDERING SUCCESS
        this.useShader = false;    // DISABLED BY DEFAULT
        this.mixer = null;
        this.animationActions = [];
        this.currentModelData = null;
        this.modelCameraViews = [];
        this.modelCenter = new THREE.Vector3(0, 0, 0);
        this.modelRadius = 5;
        this.listener = null;
        this.audio = null;
        this.audioLoader = null;
        this.audioReady = false;
        this.modelLoadToken = 0;
    }

    init() {
        this.initThreeJS();
        this.initPostProcessing();
        this.initNavigation();
        this.fetchModelData();
        this.setupControls();
        this.animate();
    }

    async fetchModelData() {
        try {
            const response = await fetch('assets/data/models.json').catch(() => null);
            if (response && response.ok) {
                const data = await response.json();
                this.modelsData = data.models;
            }
        } catch (e) {}
        this.renderButtons();
        this.loadModel(this.modelsData[0].id);
    }

    renderButtons() {
        const container = document.getElementById('modelSelection');
        if (!container) return;
        container.innerHTML = '';
        this.modelsData.forEach((model, i) => {
            const btn = document.createElement('button');
            btn.className = `btn btn-outline-secondary mb-2 w-100 model-btn ${i===0?'active':''}`;
            btn.innerHTML = `<i class="fas fa-cube"></i> ${model.name}`;
            btn.onclick = () => this.loadModel(model.id);
            container.appendChild(btn);
        });
    }

    updateDescription(model) {
        document.getElementById('modelName').innerText = model.name;
        document.getElementById('modelDescription').innerText = model.description;
        document.getElementById('modelDesign').innerText = model.designChoices;
        document.querySelectorAll('.model-btn').forEach(b => b.classList.toggle('active', b.innerText.includes(model.name)));
    }

    initThreeJS() {
        const canvas = document.getElementById('threeCanvas');
        const container = canvas.parentElement;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); // Lighter background

        this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 12);

        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(container.clientWidth, container.clientHeight, false);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Stronger lighting
        const amb = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(amb);
        this.lights.push(amb);

        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(5, 10, 7);
        this.scene.add(dir);
        this.lights.push(dir);

        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
        this.audio = new THREE.Audio(this.listener);
        this.audioLoader = new THREE.AudioLoader();

        window.addEventListener('resize', () => this.onResize());
    }

    initPostProcessing() {
        try {
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
            const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
            this.composer.addPass(bloom);
        } catch (e) {
            this.useComposer = false;
        }
    }

    loadModel(id) {
        const data = this.modelsData.find(m => m.id === id);
        if (!data) return;

        const loadToken = ++this.modelLoadToken;
        const modelUrl = new URL(data.path, document.baseURI).href;
        this.currentModelData = data;
        this.updateDescription(data);
        this.stopCurrentAnimation();
        this.stopCurrentAudio();
        if (this.currentModel) this.scene.remove(this.currentModel);
        this.currentModel = null;
        this.modelCameraViews = data.cameras || [];
        this.loadModelAudio(data.audio);

        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="spinner-border text-light" role="status"></div>
            <p class="mt-2">Loading Model...</p>
        `;

        const showLoadError = (message) => {
            if (loadToken !== this.modelLoadToken) return;
            overlay.classList.remove('hidden');
            overlay.innerHTML = `
                <p class="fw-bold mb-2">Model failed to load.</p>
                <p class="small mb-0">${message}</p>
            `;
        };

        const loadTimeout = window.setTimeout(() => {
            showLoadError(`Timed out while loading: ${data.path}`);
            console.error('GLB load timed out:', data.path, modelUrl);
        }, 20000);

        new THREE.GLTFLoader().load(modelUrl, (gltf) => {
            if (loadToken !== this.modelLoadToken) return;
            window.clearTimeout(loadTimeout);
            overlay.classList.add('hidden');
            this.currentModel = gltf.scene;

            this.currentModel.traverse(child => {
                if (child.isMesh) {
                    this.prepareModelMaterial(child, data);
                    child.material.wireframe = this.isWireframe;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (this.useShader) {
                        this.applyFresnelGlow(child);
                    }
                }
            });

            const box = this.getMeshBounds(this.currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const scale = 5 / Math.max(size.x, size.y, size.z);
            this.currentModel.scale.setScalar(scale);
            this.currentModel.position.sub(center.multiplyScalar(scale));

            this.scene.add(this.currentModel);
            const fittedBox = this.getMeshBounds(this.currentModel);
            fittedBox.getCenter(this.modelCenter);
            this.modelRadius = Math.max(fittedBox.getSize(new THREE.Vector3()).length() * 0.5, 1);
            this.setupAnimations(gltf.animations || []);
            this.collectEmbeddedCameras(gltf.cameras || []);
            this.applyCameraView('model');
        }, undefined, (error) => {
            window.clearTimeout(loadTimeout);
            showLoadError(data.path);
            console.error('GLB load failed:', data.path, modelUrl, error);
        });
    }

    prepareModelMaterial(mesh, data) {
        if (data.id !== 'model1') return;

        mesh.material = new THREE.MeshPhysicalMaterial({
            color: 0x8fd7ff,
            roughness: 0.18,
            metalness: 0.0,
            transparent: true,
            opacity: 0.78,
            clearcoat: 0.65,
            clearcoatRoughness: 0.2,
            side: THREE.DoubleSide
        });
    }

    getMeshBounds(root) {
        const box = new THREE.Box3();
        root.traverse(child => {
            if (child.isMesh) box.expandByObject(child);
        });
        if (box.isEmpty()) box.setFromObject(root);
        return box;
    }

    applyFresnelGlow(mesh) {
        // GLSL Vertex and Fragment shaders for a Fresnel rim-lighting effect
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPositionNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = `
            varying vec3 vNormal;
            varying vec3 vPositionNormal;
            void main() {
                float intensity = pow(max(0.0, 0.6 - dot(vNormal, vPositionNormal)), 2.5);
                gl_FragColor = vec4(0.2, 0.7, 1.0, 1.0) * intensity;
            }
        `;
        const shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        const glowMesh = new THREE.Mesh(mesh.geometry, shaderMaterial);
        glowMesh.scale.multiplyScalar(1.02);
        mesh.add(glowMesh);
    }

    setupAnimations(clips) {
        this.mixer = null;
        this.animationActions = [];

        if (!this.currentModel || !clips.length) {
            this.updateAnimationButton(false);
            return;
        }

        this.mixer = new THREE.AnimationMixer(this.currentModel);
        this.animationActions = clips.map(clip => {
            const action = this.mixer.clipAction(clip);
            action.clampWhenFinished = false;
            action.loop = THREE.LoopOnce;
            return action;
        });
        this.updateAnimationButton(true);
    }

    stopCurrentAnimation() {
        if (this.animationActions.length) {
            this.animationActions.forEach(action => action.stop());
        }
        if (this.mixer) this.mixer.stopAllAction();
        this.mixer = null;
        this.animationActions = [];
    }

    updateAnimationButton(hasClips) {
        const btn = document.getElementById('playAnimBtn');
        if (!btn) return;
        btn.innerHTML = hasClips
            ? '<i class="fas fa-play"></i> Play Animation + Sound'
            : '<i class="fas fa-play"></i> Rotate Model + Sound';
    }

    collectEmbeddedCameras(cameras) {
        if (!this.currentModel || !cameras.length) return;
        const embeddedViews = [];
        this.currentModel.traverse(child => {
            if (child.isCamera) {
                embeddedViews.push({
                    name: child.name || 'Embedded Camera',
                    position: child.getWorldPosition(new THREE.Vector3()).toArray()
                });
            }
        });
        this.modelCameraViews = [...embeddedViews, ...(this.currentModelData?.cameras || [])];
    }

    loadModelAudio(audioPath) {
        this.audioReady = false;
        this.setAudioStatus(audioPath ? 'Loading audio...' : 'No audio assigned.');
        if (!audioPath || !this.audioLoader || !this.audio) return;

        this.audioLoader.load(audioPath, buffer => {
            this.audio.setBuffer(buffer);
            this.audio.setLoop(false);
            this.audio.setVolume(0.7);
            this.audioReady = true;
            this.setAudioStatus('Audio loaded. Use the interaction button to play it.');
        }, undefined, () => {
            this.setAudioStatus(`Audio file could not be loaded: ${audioPath}`);
        });
    }

    stopCurrentAudio() {
        if (this.audio && this.audio.isPlaying) this.audio.stop();
        if (this.audio) this.audio.setBuffer(null);
        this.audioReady = false;
    }

    playCurrentAudio() {
        if (!this.audio || !this.audioReady) return;
        if (this.audio.isPlaying) this.audio.stop();
        this.audio.play();
    }

    setAudioStatus(message) {
        const el = document.getElementById('audioStatus');
        if (el) el.innerText = message;
    }

    playInteraction() {
        this.playCurrentAudio();
        if (this.animationActions.length) {
            this.animationActions.forEach(action => {
                action.reset();
                action.play();
            });
            return;
        }
        if (this.currentModel) {
            this.currentModel.rotation.y += Math.PI / 2;
        }
    }

    applyCameraView(view) {
        const framingScale = this.currentModelData?.cameraDistanceScale || (this.currentModelData?.id === 'model1' ? 3.0 : 1.25);
        const distance = this.modelRadius / Math.sin(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * framingScale;
        const target = this.modelCenter || new THREE.Vector3(0, 0, 0);
        let direction = new THREE.Vector3(0, 0.2, 1);

        if (view === 'front') direction.set(0, 0.05, 1);
        if (view === 'top') direction.set(0, 1, 0.001);
        if (view === 'side') direction.set(1, 0.05, 0);
        if (view === 'model') {
            const modelView = this.modelCameraViews[0];
            if (modelView?.position?.length === 3) {
                direction.fromArray(modelView.position).sub(target);
            }
        }
        if (direction.lengthSq() < 0.001) direction.set(0, 0.2, 1);
        this.camera.position.copy(target).add(direction.normalize().multiplyScalar(distance));
        this.controls.target.copy(target);
        this.camera.lookAt(target);
        this.controls.update();
    }

    setupControls() {
        document.getElementById('toggleWireframe').onclick = () => {
            this.isWireframe = !this.isWireframe;
            if (this.currentModel) {
                this.currentModel.traverse(c => { if(c.isMesh) c.material.wireframe = this.isWireframe; });
            }
        };

        document.getElementById('toggleLight').onclick = () => {
            this.isLightingEnabled = !this.isLightingEnabled;
            this.lights.forEach(light => {
                light.visible = this.isLightingEnabled;
            });
            const btn = document.getElementById('toggleLight');
            btn.classList.toggle('btn-warning', !this.isLightingEnabled);
            btn.classList.toggle('btn-outline-secondary', this.isLightingEnabled);
        };

        document.getElementById('togglePost').onclick = () => {
            this.useComposer = !this.useComposer;
            const btn = document.getElementById('togglePost');
            btn.classList.toggle('btn-danger', this.useComposer);
            btn.classList.toggle('btn-outline-danger', !this.useComposer);
        };

        document.getElementById('playAnimBtn').onclick = () => {
            this.playInteraction();
        };

        document.querySelectorAll('.cam-btn').forEach(btn => {
            btn.onclick = () => {
                this.applyCameraView(btn.dataset.cam);
            }
        });
    }

    initNavigation() {
        const btns = document.querySelectorAll('.nav-btn');
        const secs = document.querySelectorAll('.page-section');
        btns.forEach(b => b.onclick = () => {
            btns.forEach(x => x.classList.remove('active'));
            secs.forEach(x => x.classList.remove('active-section'));
            b.classList.add('active');
            document.getElementById(b.dataset.target).classList.add('active-section');
            this.onResize();
        });
    }

    onResize() {
        const canvas = document.getElementById('threeCanvas');
        const container = canvas.parentElement;
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight, false);
        if (this.composer) this.composer.setSize(container.clientWidth, container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        if (this.mixer) this.mixer.update(delta);
        if (this.controls) this.controls.update();
        if (this.useComposer && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

const app = new Web3DApp();
app.init();
