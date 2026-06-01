// Celestial bodies (Earth and Moon) with realistic textures
class CelestialBodies {
    constructor(scene) {
        this.scene = scene;
        this.earth = null;
        this.moon = null;
        this.earthOrbit = null;
        
        // Real-world scale (scaled down for performance)
        this.earthRadius = 6371000;
        this.moonRadius = 1737000;
        this.earthMoonDistance = 384400000;
        
        // Set masses for physics
        this.earthMass = 5.972e24;
        this.moonMass = 7.342e22;
        
        this.createEarth();
        this.createMoon();
    }
    
    createEarth() {
        // Create Earth with realistic texture
        const earthGeometry = new THREE.SphereGeometry(this.earthRadius, 128, 128);
        
        // Create canvas for procedural Earth texture
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Draw Earth texture
        this.drawEarthTexture(ctx, canvas.width, canvas.height);
        
        const earthTexture = new THREE.CanvasTexture(canvas);
        const earthMaterial = new THREE.MeshStandardMaterial({
            map: earthTexture,
            roughness: 0.7,
            metalness: 0.1
        });
        
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.position.set(0, 0, 0);
        this.earth.userData.mass = this.earthMass;
        this.earth.rotation.y = Math.PI;
        this.scene.add(this.earth);
        
        // Earth's atmosphere glow
        this.createAtmosphere();
    }
    
    drawEarthTexture(ctx, width, height) {
        // Ocean base
        ctx.fillStyle = '#1a4a8c';
        ctx.fillRect(0, 0, width, height);
        
        // Continents (simplified)
        ctx.fillStyle = '#2d6a2d';
        
        // North America
        ctx.beginPath();
        ctx.moveTo(200, 200);
        ctx.bezierCurveTo(300, 150, 400, 200, 500, 250);
        ctx.bezierCurveTo(450, 300, 350, 350, 250, 300);
        ctx.closePath();
        ctx.fill();
        
        // South America
        ctx.beginPath();
        ctx.moveTo(300, 400);
        ctx.bezierCurveTo(350, 450, 400, 550, 350, 650);
        ctx.bezierCurveTo(250, 600, 200, 500, 250, 450);
        ctx.closePath();
        ctx.fill();
        
        // Europe/Africa
        ctx.beginPath();
        ctx.moveTo(550, 250);
        ctx.bezierCurveTo(650, 200, 750, 250, 850, 300);
        ctx.bezierCurveTo(800, 400, 700, 500, 600, 450);
        ctx.bezierCurveTo(500, 400, 500, 300, 550, 250);
        ctx.closePath();
        ctx.fill();
        
        // Asia
        ctx.beginPath();
        ctx.moveTo(700, 150);
        ctx.bezierCurveTo(800, 100, 950, 150, 1050, 200);
        ctx.bezierCurveTo(1100, 300, 1000, 400, 900, 350);
        ctx.bezierCurveTo(800, 300, 750, 200, 700, 150);
        ctx.closePath();
        ctx.fill();
        
        // Australia
        ctx.beginPath();
        ctx.moveTo(900, 550);
        ctx.bezierCurveTo(950, 600, 1000, 650, 950, 700);
        ctx.bezierCurveTo(900, 680, 850, 600, 900, 550);
        ctx.closePath();
        ctx.fill();
        
        // Add cloud patterns
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 50 + 20;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add ice caps
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(1024, 100, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(1024, 900, 100, 0, Math.PI * 2);
        ctx.fill();
    }
    
    createAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(this.earthRadius * 1.02, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x87ceeb) },
                density: { value: 0.5 },
                atmosphereRadius: { value: this.earthRadius * 1.02 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float density;
                uniform float atmosphereRadius;
                varying vec3 vWorldPosition;
                void main() {
                    float dist = length(vWorldPosition);
                    float alpha = density * (1.0 - dist / atmosphereRadius);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.earth.add(atmosphere);
    }
    
    createMoon() {
        // Create Moon with craters
        const moonGeometry = new THREE.SphereGeometry(this.moonRadius, 64, 64);
        
        // Create canvas for procedural Moon texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        this.drawMoonTexture(ctx, canvas.width, canvas.height);
        
        const moonTexture = new THREE.CanvasTexture(canvas);
        const moonMaterial = new THREE.MeshStandardMaterial({
            map: moonTexture,
            roughness: 0.9,
            metalness: 0.1
        });
        
        this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
        this.moon.position.set(this.earthMoonDistance, 0, 0);
        this.moon.userData.mass = this.moonMass;
        this.moon.receiveShadow = true;
        this.moon.castShadow = true;
        this.scene.add(this.moon);
        
        // Moon glow effect
        this.createMoonGlow();
    }
    
    drawMoonTexture(ctx, width, height) {
        // Dark gray base
        ctx.fillStyle = '#444444';
        ctx.fillRect(0, 0, width, height);
        
        // Add craters
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 20 + 5;
            
            const gray = Math.floor(Math.random() * 40 + 100);
            ctx.fillStyle = 'rgb(' + gray + ', ' + gray + ', ' + gray + ')';
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add highlight
            ctx.fillStyle = 'rgb(' + (gray + 30) + ', ' + (gray + 30) + ', ' + (gray + 30) + ')';
            ctx.beginPath();
            ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add larger features (mare)
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.ellipse(300, 250, 150, 100, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(700, 350, 120, 80, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    createMoonGlow() {
        const glowGeometry = new THREE.SphereGeometry(this.moonRadius * 1.05, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xaaaaaa) },
                moonGlowRadius: { value: this.moonRadius * 1.05 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float moonGlowRadius;
                varying vec3 vWorldPosition;
                void main() {
                    float dist = length(vWorldPosition);
                    float alpha = 0.1 * (1.0 - dist / moonGlowRadius);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.moon.add(glow);
    }
}