// Automatic flight control system
// Using scaled units (1 unit = 1000 km)
class Autopilot {
    constructor(rocket, celestial, physics) {
        this.rocket = rocket;
        this.celestial = celestial;
        this.physics = physics;
        
        this.state = 'STANDBY';
        this.targetAltitude = 0;
        this.targetVelocity = 0;
        this.targetDirection = new THREE.Vector3(0, 1, 0);
        
        // PID controllers for smooth control
        this.pidAltitude = { kp: 0.0001, ki: 0.000001, kd: 0.001, integral: 0, previous: 0 };
        this.pidVelocity = { kp: 0.5, ki: 0.01, kd: 0.1, integral: 0, previous: 0 };
        this.pidPitch = { kp: 0.1, ki: 0.001, kd: 0.01, integral: 0, previous: 0 };
    }
    
    update(delta, missionPhase) {
        switch (missionPhase) {
            case 'LAUNCH':
                this.launchSequence();
                break;
            case 'TRANS_LUNAR':
                this.transLunarInjection();
                break;
            case 'LUNAR_ORBIT':
                this.lunarOrbitInsertion();
                break;
            case 'LANDING':
                this.lunarLanding();
                break;
        }
    }
    
    launchSequence() {
        this.state = 'LAUNCH';
        
        // Activate first stage
        if (this.rocket.currentStage === 1 && this.rocket.stages[0].fuel > 0) {
            this.rocket.activateEngine();
            
            // Stage separation at specific altitudes (scaled)
            if (this.rocket.altitude > 50 && this.rocket.stages[0].fuel < 0.1) {
                this.rocket.separateStage();
            }
        }
        
        // Second stage
        if (this.rocket.currentStage === 2) {
            this.rocket.activateEngine();
            
            if (this.rocket.altitude > 150 && this.rocket.stages[1].fuel < 0.1) {
                this.rocket.separateStage();
            }
        }
        
        // Third stage - trans lunar injection
        if (this.rocket.currentStage === 3) {
            this.rocket.activateEngine();
            
            // Target: escape Earth's gravity (scaled)
            const distanceToEarth = this.rocket.mesh.position.length() - this.celestial.earthRadius;
            if (distanceToEarth > 300) {
                this.rocket.deactivateEngine();
            }
        }
        
        // Control pitch for gravity turn
        this.gravityTurn();
    }
    
    gravityTurn() {
        const altitude = this.rocket.altitude;
        
        // Gradually pitch over as we ascend (scaled)
        let targetPitch = 0;
        if (altitude < 1) {
            targetPitch = 0; // Vertical
        } else if (altitude < 10) {
            targetPitch = (altitude - 1) / (10 - 1) * 45; // 45 degrees
        } else if (altitude < 50) {
            targetPitch = 45 + (altitude - 10) / (50 - 10) * 45; // 90 degrees
        } else {
            targetPitch = 90; // Horizontal
        }
        
        this.controlPitch(targetPitch);
    }
    
    controlPitch(targetPitch) {
        // Get current pitch
        const euler = new THREE.Euler().setFromQuaternion(this.rocket.mesh.quaternion);
        const currentPitch = THREE.MathUtils.radToDeg(euler.x);
        
        // PID control
        const error = targetPitch - currentPitch;
        this.pidPitch.integral += error;
        const derivative = error - this.pidPitch.previous;
        
        const output = this.pidPitch.kp * error + 
                     this.pidPitch.ki * this.pidPitch.integral + 
                     this.pidPitch.kd * derivative;
        
        this.pidPitch.previous = error;
        
        // Apply rotation
        this.rocket.mesh.rotateX(THREE.MathUtils.degToRad(output * 0.1));
    }
    
    transLunarInjection() {
        this.state = 'TRANS_LUNAR';
        
        // Calculate direction to moon
        const toMoon = new THREE.Vector3()
            .subVectors(this.celestial.moon.position, this.rocket.mesh.position)
            .normalize();
        
        // Point rocket toward moon
        this.pointToDirection(toMoon);
        
        // Activate engine for course corrections
        if (this.rocket.stages[2].fuel > 0) {
            this.rocket.activateEngine();
        }
    }
    
    pointToDirection(targetDir) {
        const currentDir = new THREE.Vector3(0, 1, 0).applyQuaternion(this.rocket.mesh.quaternion);
        const rotationAxis = new THREE.Vector3().crossVectors(currentDir, targetDir);
        
        if (rotationAxis.length() > 0.001) {
            const angle = currentDir.angleTo(targetDir);
            this.rocket.mesh.quaternion.premultiply(
                new THREE.Quaternion().setFromAxisAngle(rotationAxis.normalize(), angle * 0.05)
            );
        }
    }
    
    lunarOrbitInsertion() {
        this.state = 'LUNAR_ORBIT';
        
        // Check if we're approaching the moon
        const distanceToMoon = this.rocket.mesh.position.distanceTo(this.celestial.moon.position);
        
        if (distanceToMoon < this.celestial.moonRadius * 2) {
            // Decelerate for lunar capture
            const toMoonCenter = new THREE.Vector3()
                .subVectors(this.celestial.moon.position, this.rocket.mesh.position)
                .normalize();
            
            this.pointToDirection(toMoonCenter.negate());
            
            if (this.rocket.stages[2].fuel > 0) {
                this.rocket.activateEngine();
            }
        }
    }
    
    lunarLanding() {
        this.state = 'LUNAR_LANDING';
        
        // Point toward moon center
        const toMoonCenter = new THREE.Vector3()
            .subVectors(this.celestial.moon.position, this.rocket.mesh.position)
            .normalize();
        
        this.pointToDirection(toMoonCenter);
        
        // Control descent
        const distanceToMoon = this.rocket.mesh.position.distanceTo(this.celestial.moon.position);
        
        // Target vertical velocity for landing (scaled)
        const targetVerticalVelocity = -0.01; // 10 m/s descent
        
        // PID control for vertical speed
        const verticalVelocity = this.rocket.velocity.y;
        const error = targetVerticalVelocity - verticalVelocity;
        
        this.pidVelocity.integral += error;
        const derivative = error - this.pidVelocity.previous;
        
        const throttle = Math.max(0, Math.min(1, 
            this.pidVelocity.kp * error + 
            this.pidVelocity.ki * this.pidVelocity.integral + 
            this.pidVelocity.kd * derivative
        ));
        
        this.pidVelocity.previous = error;
        
        // Apply throttle
        if (throttle > 0.1) {
            this.rocket.activateEngine();
        } else {
            this.rocket.deactivateEngine();
        }
    }
    
    getStatus() {
        return this.state;
    }
}