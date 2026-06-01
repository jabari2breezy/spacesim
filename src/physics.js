// Realistic physics engine for orbital mechanics
// Using scaled units (1 unit = 1000 km)
class PhysicsEngine {
    constructor() {
        // Scaled gravitational constant for our units
        // Using a simplified scale for gameplay
        this.G = 1000; // Simplified for visible gameplay
        this.earthMass = 100;
        this.moonMass = 1;
        
        // Time scale (1 second = 10 seconds in game)
        this.timeScale = 10;
        
        // Scale factor for thrust
        this.thrustScale = 1000000;
    }
    
    update(rocket, celestial, delta) {
        const actualDelta = delta * this.timeScale;
        
        // Calculate forces
        const earthGravity = this.calculateGravity(rocket, celestial.earth, celestial.earthRadius);
        const moonGravity = this.calculateGravity(rocket, celestial.moon, celestial.moonRadius);
        
        // Total acceleration
        const totalAcceleration = new THREE.Vector3()
            .add(earthGravity)
            .add(moonGravity);
        
        // Apply thrust
        if (rocket.engineOn) {
            const thrustVector = new THREE.Vector3(0, 1, 0)
                .applyQuaternion(rocket.mesh.quaternion)
                .multiplyScalar(rocket.thrust / this.thrustScale);
            totalAcceleration.add(thrustVector);
            
            // Consume fuel
            rocket.stages[rocket.currentStage - 1].fuel -= rocket.stages[rocket.currentStage - 1].burnRate * actualDelta;
            rocket.fuel = rocket.stages[rocket.currentStage - 1].fuel;
            
            if (rocket.stages[rocket.currentStage - 1].fuel <= 0) {
                rocket.stages[rocket.currentStage - 1].fuel = 0;
                rocket.deactivateEngine();
            }
        }
        
        // Update velocity
        rocket.velocity.add(totalAcceleration.multiplyScalar(actualDelta));
        
        // Update position
        rocket.mesh.position.add(rocket.velocity.clone().multiplyScalar(actualDelta));
        
        // Calculate orbital parameters
        this.calculateOrbit(rocket, celestial);
    }
    
    calculateGravity(rocket, body, bodyRadius) {
        const distance = rocket.mesh.position.distanceTo(body.position);
        
        // Don't apply gravity if inside body
        if (distance < bodyRadius) return new THREE.Vector3(0, 0, 0);
        
        // Calculate gravitational force (acceleration)
        const force = new THREE.Vector3()
            .subVectors(body.position, rocket.mesh.position)
            .normalize()
            .multiplyScalar((this.G * body.userData.mass) / (distance * distance));
        
        return force;
    }
    
    calculateOrbit(rocket, celestial) {
        // Simplified orbital calculation
        const distanceToEarth = rocket.mesh.position.distanceTo(celestial.earth.position);
        const speed = rocket.velocity.length();
        const earthRadius = celestial.earthRadius;
        
        if (distanceToEarth > earthRadius * 1.1) {
            // In orbit around Earth
            const orbitalEnergy = 0.5 * speed * speed - (this.G * this.earthMass) / distanceToEarth;
            if (orbitalEnergy < 0) {
                const semiMajorAxis = -this.G * this.earthMass / (2 * orbitalEnergy);
                rocket.apoapsis = semiMajorAxis * 1000; // Convert to km
                rocket.periapsis = semiMajorAxis * 0.8 * 1000;
            }
        } else {
            rocket.apoapsis = distanceToEarth * 1000;
            rocket.periapsis = distanceToEarth * 1000;
        }
    }
    
    calculateEscapeVelocity(mass, radius) {
        return Math.sqrt(2 * this.G * mass / radius);
    }
}
