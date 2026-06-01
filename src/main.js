// Main entry point for AutoPilot SpaceFlight Simulator
class SpaceFlightSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.rocket = null;
        this.celestial = null;
        this.physics = null;
        this.autopilot = null;
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.missionPhase = 'READY'; // READY, LAUNCH, TRANS_LUNAR, LUNAR_ORBIT, LANDING, LANDED
        
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000010);
        this.scene.fog = new THREE.Fog(0x000010, 1000, 500000);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000000);
        this.camera.position.set(0, 100, 200);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Add stars
        this.createStarfield();
        
        // Initialize systems
        this.celestial = new CelestialBodies(this.scene);
        this.rocket = new Rocket(this.scene);
        this.physics = new PhysicsEngine();
        this.autopilot = new Autopilot(this.rocket, this.celestial, this.physics);
        
        // Setup lighting
        this.setupLighting();
        
        // Event listeners
        window.addEventListener('resize', () => this.onResize());
        document.getElementById('start-btn').addEventListener('click', () => this.startMission());
        
        // Start render loop
        this.animate();
    }
    
    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000000;
            positions[i + 1] = (Math.random() - 0.5) * 2000000;
            positions[i + 2] = (Math.random() - 0.5) * 2000000;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            sizeAttenuation: false
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 2);
        sunLight.position.set(100000, 100000, 100000);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
    }
    
    startMission() {
        this.isRunning = true;
        this.missionPhase = 'LAUNCH';
        document.getElementById('start-btn').style.display = 'none';
        this.updateUI();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isRunning) {
            const delta = this.clock.getDelta();
            
            // Update autopilot
            this.autopilot.update(delta, this.missionPhase);
            
            // Update rocket
            this.rocket.update(delta);
            
            // Update physics
            this.physics.update(this.rocket, this.celestial, delta);
            
            // Check mission phases
            this.checkMissionProgress();
            
            // Update UI
            this.updateUI();
        }
        
        // Update camera to follow rocket
        if (this.rocket.mesh) {
            const rocketPos = this.rocket.mesh.position;
            const cameraOffset = new THREE.Vector3(0, 50, -100);
            const cameraPos = rocketPos.clone().add(cameraOffset);
            this.camera.position.lerp(cameraPos, 0.05);
            this.camera.lookAt(rocketPos);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    checkMissionProgress() {
        const rocketPos = this.rocket.mesh.position;
        const moonPos = this.celestial.moon.position;
        const distanceToMoon = rocketPos.distanceTo(moonPos);
        
        // Update distance display
        document.getElementById('distance').textContent = 
            distanceToMoon > 1000 ? 
            `${(distanceToMoon / 1000).toFixed(0)} km` : 
            `${distanceToMoon.toFixed(0)} m`;
        
        // Mission phase transitions
        if (this.missionPhase === 'LAUNCH') {
            // Check if we've reached orbit
            const altitude = this.rocket.altitude;
            if (altitude > 200000 && this.rocket.currentStage === 3) {
                this.missionPhase = 'TRANS_LUNAR';
            }
        }
        
        if (this.missionPhase === 'TRANS_LUNAR') {
            // Check if we're approaching the moon
            if (distanceToMoon < this.celestial.earthMoonDistance * 0.5) {
                this.missionPhase = 'LUNAR_ORBIT';
            }
        }
        
        if (this.missionPhase === 'LUNAR_ORBIT') {
            // Check if we're close enough to start landing
            if (distanceToMoon < this.celestial.moonRadius * 5) {
                this.missionPhase = 'LANDING';
            }
        }
        
        // Check for moon landing
        if (this.missionPhase === 'LANDING' && distanceToMoon < 100) {
            const verticalVelocity = Math.abs(this.rocket.velocity.y);
            const horizontalVelocity = Math.sqrt(
                this.rocket.velocity.x ** 2 + this.rocket.velocity.z ** 2
            );
            
            if (verticalVelocity < 10 && horizontalVelocity < 10) {
                this.missionPhase = 'LANDED';
                this.showLandingResult(true);
            } else {
                this.showLandingResult(false);
            }
        }
    }
    
    showLandingResult(success) {
        const landingStatus = document.getElementById('landing-status');
        landingStatus.style.display = 'block';
        landingStatus.className = success ? 'success' : 'failure';
        landingStatus.innerHTML = success ? 
            '<div>MISSION SUCCESS</div><div style="font-size: 24px;">Moon Landing Achieved!</div>' :
            '<div>MISSION FAILED</div><div style="font-size: 24px;">Crash Landing</div>';
    }
    
    updateUI() {
        document.getElementById('altitude').textContent = 
            `${(this.rocket.altitude / 1000).toFixed(1)} km`;
        document.getElementById('velocity').textContent = 
            `${this.rocket.speed.toFixed(1)} m/s`;
        document.getElementById('fuel').textContent = 
            `${(this.rocket.fuel * 100).toFixed(1)}%`;
        document.getElementById('stage').textContent = 
            `${this.rocket.currentStage}/${this.rocket.totalStages}`;
        document.getElementById('apoapsis').textContent = 
            `${(this.rocket.apoapsis / 1000).toFixed(0)} km`;
        document.getElementById('periapsis').textContent = 
            `${(this.rocket.periapsis / 1000).toFixed(0)} km`;
        document.getElementById('status').textContent = this.missionPhase;
        document.getElementById('autopilot').textContent = this.autopilot.getStatus();
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new SpaceFlightSimulator();
});