// Rocket class with realistic physics and stage management
class Rocket {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.altitude = 0;
        this.speed = 0;
        this.fuel = 1.0;
        this.currentStage = 1;
        this.totalStages = 3;
        
        // Orbital parameters
        this.apoapsis = 0;
        this.periapsis = 0;
        
        // Stage configurations
        this.stages = [
            { thrust: 8000000, fuel: 1.0, burnRate: 0.002, mass: 50000 }, // Stage 1
            { thrust: 4000000, fuel: 1.0, burnRate: 0.0015, mass: 30000 }, // Stage 2
            { thrust: 1000000, fuel: 1.0, burnRate: 0.0008, mass: 10000 }  // Stage 3 (landing)
        ];
        
        // Engine state
        this.engineOn = false;
        this.thrust = 0;
        
        // Visual effects
        this.exhaustParticles = null;
        this.engineFlame = null;
        
        this.createRocket();
    }
    
    createRocket() {
        // Rocket body - realistic proportions
        const rocketGroup = new THREE.Group();
        
        // Materials
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.8
        });
        
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: 0x3366cc,
            roughness: 0.2,
            metalness: 0.9
        });
        
        const engineMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.5,
            metalness: 0.6
        });
        
        // Main booster (Stage 1)
        const boosterGeometry = new THREE.CylinderGeometry(3, 4, 20, 16);
        const booster = new THREE.Mesh(boosterGeometry, metalMaterial);
        booster.position.y = 10;
        booster.castShadow = true;
        rocketGroup.add(booster);
        
        // Intertank
        const intertankGeometry = new THREE.CylinderGeometry(3, 3, 2, 16);
        const intertank = new THREE.Mesh(intertankGeometry, metalMaterial);
        intertank.position.y = 21;
        intertank.castShadow = true;
        rocketGroup.add(intertank);
        
        // Second stage
        const stage2Geometry = new THREE.CylinderGeometry(2.5, 3, 15, 16);
        const stage2 = new THREE.Mesh(stage2Geometry, metalMaterial);
        stage2.position.y = 29.5;
        stage2.castShadow = true;
        rocketGroup.add(stage2);
        
        // Third stage
        const stage3Geometry = new THREE.CylinderGeometry(2, 2.5, 10, 16);
        const stage3 = new THREE.Mesh(stage3Geometry, metalMaterial);
        stage3.position.y = 39;
        stage3.castShadow = true;
        rocketGroup.add(stage3);
        
        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(2, 5, 16);
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.y = 45.5;
        nose.castShadow = true;
        rocketGroup.add(nose);
        
        // Fins
        for (let i = 0; i < 4; i++) {
            const finGeometry = new THREE.BoxGeometry(0.5, 8, 1);
            const fin = new THREE.Mesh(finGeometry, metalMaterial);
            fin.position.set(
                Math.cos(i * Math.PI / 2) * 4,
                0,
                Math.sin(i * Math.PI / 2) * 4
            );
            fin.castShadow = true;
            rocketGroup.add(fin);
        }
        
        // Engine nozzle
        const nozzleGeometry = new THREE.CylinderGeometry(1.5, 2, 3, 16);
        const nozzle = new THREE.Mesh(nozzleGeometry, engineMaterial);
        nozzle.position.y = -2.5;
        nozzle.castShadow = true;
        rocketGroup.add(nozzle);
        
        this.mesh = rocketGroup;
        this.mesh.position.set(0, 6371000 + 10, 0); // Start on Earth surface
        this.scene.add(this.mesh);
        
        // Create exhaust particle system
        this.createExhaustParticles();
        
        // Create engine flame
        this.createEngineFlame();
    }
    
    createExhaustParticles() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i + 1] = -10; // Start below rocket
            sizes[i / 3] = Math.random() * 2 + 1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 3,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        this.exhaustParticles = new THREE.Points(geometry, material);
        this.exhaustParticles.visible = false;
        this.scene.add(this.exhaustParticles);
    }
    
    createEngineFlame() {
        // Create a cone-shaped flame using a sprite
        const flameGeometry = new THREE.ConeGeometry(2, 5, 16);
        const flameMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;
                void main() {
                    float flicker = sin(time * 20.0) * 0.1 + 0.9;
                    float alpha = (1.0 - vUv.y) * intensity * flicker;
                    gl_FragColor = vec4(0.5, 0.2, 0.0, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        this.engineFlame = new THREE.Mesh(flameGeometry, flameMaterial);
        this.engineFlame.position.y = -5;
        this.engineFlame.visible = false;
        this.mesh.add(this.engineFlame);
    }
    
    update(delta) {
        // Update exhaust particles
        if (this.engineOn && this.exhaustParticles) {
            this.exhaustParticles.visible = true;
            this.updateExhaustParticles();
            this.updateEngineFlame(delta);
        } else {
            this.exhaustParticles.visible = false;
            this.engineFlame.visible = false;
        }
        
        // Update speed
        this.speed = this.velocity.length();
        
        // Update altitude
        this.altitude = this.mesh.position.length() - 6371000;
    }
    
    updateExhaustParticles() {
        const positions = this.exhaustParticles.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] *= 0.95;
            positions[i + 1] -= 0.5;
            positions[i + 2] *= 0.95;
            
            if (positions[i + 1] < -20) {
                positions[i] = (Math.random() - 0.5) * 2;
                positions[i + 1] = 0;
                positions[i + 2] = (Math.random() - 0.5) * 2;
            }
        }
        
        this.exhaustParticles.geometry.attributes.position.needsUpdate = true;
        this.exhaustParticles.position.copy(this.mesh.position);
        this.exhaustParticles.quaternion.copy(this.mesh.quaternion);
    }
    
    updateEngineFlame(delta) {
        if (this.engineFlame) {
            this.engineFlame.material.uniforms.time.value += delta;
            this.engineFlame.visible = true;
        }
    }
    
    activateEngine() {
        this.engineOn = true;
        this.thrust = this.stages[this.currentStage - 1].thrust;
    }
    
    deactivateEngine() {
        this.engineOn = false;
        this.thrust = 0;
    }
    
    separateStage() {
        if (this.currentStage < this.totalStages) {
            this.currentStage++;
            this.fuel = this.stages[this.currentStage - 1].fuel;
            this.thrust = this.stages[this.currentStage - 1].thrust;
            
            // Visual effect for stage separation
            this.createStageSeparationEffect();
        }
    }
    
    createStageSeparationEffect() {
        // Create particle explosion for stage separation
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 10;
            positions[i + 1] = (Math.random() - 0.5) * 10;
            positions[i + 2] = (Math.random() - 0.5) * 10;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 2,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.position.copy(this.mesh.position);
        this.scene.add(particles);
        
        // Remove after animation
        setTimeout(() => {
            this.scene.remove(particles);
        }, 2000);
    }
}
