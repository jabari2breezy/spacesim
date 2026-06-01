// Celestial bodies (Earth and Moon) with realistic textures
// Using scaled units for visibility (1 unit = 1000 km)
class CelestialBodies {
    constructor(scene) {
        this.scene = scene;
        this.earth = null;
        this.moon = null;
        
        // Scaled for visibility (1 unit = 1000 km)
        this.earthRadius = 6.371; // 6371 km
        this.moonRadius = 1.737; // 1737 km
        this.earthMoonDistance = 384.4; // 384,400 km
        
        // Set masses for physics (scaled accordingly)
        this.earthMass = 5.972e24;
        this.moonMass = 7.342e22;
        
        this.createEarth();
        this.createMoon();
    }
    
    createEarth() {
        // Create Earth with realistic texture
        const earthGeometry = new THREE.SphereGeometry(this.earthRadius, 64, 64);
        
        // Create canvas for procedural Earth texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
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
        ctx.moveTo(50, 50);
        ctx.bezierCurveTo(75, 38, 100, 50, 125, 62);
        ctx.bezierCurveTo(112, 75, 87, 87, 62, 75);
        ctx.closePath();
        ctx.fill();
        
        // South America
        ctx.beginPath();
        ctx.moveTo(75, 100);
        ctx.bezierCurveTo(87, 112, 100, 137, 87, 162);
        ctx.bezierCurveTo(62, 150, 50, 125, 62, 112);
        ctx.closePath();
        ctx.fill();
        
        // Europe/Africa
        ctx.beginPath();
        ctx.moveTo(137, 62);
        ctx.bezierCurveTo(162, 50, 187, 62, 212, 75);
        ctx.bezierCurveTo(200, 100, 175, 125, 150, 112);
        ctx.bezierCurveTo(125, 100, 125, 75, 137, 62);
        ctx.closePath();
        ctx.fill();
        
        // Asia
        ctx.beginPath();
        ctx.moveTo(175, 38);
        ctx.bezierCurveTo(200, 25, 237, 38, 262, 50);
        ctx.bezierCurveTo(275, 75, 250, 100, 225, 87);
        ctx.bezierCurveTo(200, 75, 187, 50, 175, 38);
        ctx.closePath();
        ctx.fill();
        
        // Australia
        ctx.beginPath();
        ctx.moveTo(225, 137);
        ctx.bezierCurveTo(237, 150, 250, 162, 237, 175);
        ctx.bezierCurveTo(225, 170, 212, 150, 225, 137);
        ctx.closePath();
        ctx.fill();
        
        // Add cloud patterns
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 12 + 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add ice caps
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(256, 25, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(256, 230, 10, 0, Math.PI * 2);
        ctx.fill();
    }
    
    createAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(this.earthRadius * 1.05, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide,
            depthWrite: false
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.earth.add(atmosphere);
    }
    
    createMoon() {
        // Create Moon with craters
        const moonGeometry = new THREE.SphereGeometry(this.moonRadius, 32, 32);
        
        // Create canvas for procedural Moon texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
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
    }
    
    drawMoonTexture(ctx, width, height) {
        // Dark gray base
        ctx.fillStyle = '#444444';
        ctx.fillRect(0, 0, width, height);
        
        // Add craters
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 5 + 2;
            
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
        ctx.ellipse(75, 62, 37, 25, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(175, 87, 30, 20, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
    }
}