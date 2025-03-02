import * as THREE from 'three';

/**
 * ParticleSystem class for managing retro-style wireframe particles
 * Encapsulates particle creation, emission, and updating logic
 */
export class ParticleSystem {
    /**
     * Create a new particle system
     * @param {THREE.Scene} scene - The scene to add particles to
     * @param {THREE.Object3D} emitter - The object emitting particles (usually the lander)
     * @param {THREE.Mesh} moonMesh - The moon mesh for collision detection
     * @param {number} moonRadius - The base radius of the moon
     */
    constructor(scene, emitter, moonMesh, moonRadius) {
        // Store references to required objects
        this.scene = scene;
        this.emitter = emitter;
        this.moonMesh = moonMesh;
        this.moonRadius = moonRadius;
        
        // Create a group to hold all particles
        this.particleGroup = new THREE.Group();
        scene.add(this.particleGroup);
        
        // Create a larger pool of 3D particles
        this.particleCount = 200; // Reduced count since 3D objects are more expensive
        this.particles = [];
        
        // Create wireframe materials
        this.exhaustMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00, // Green to match moon wireframe
            transparent: true,
            opacity: 0.8
        });
        
        this.dustMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00, // Green to match moon wireframe
            transparent: true,
            opacity: 0.5
        });
        
        // Create dodecahedron geometry for exhaust particles
        const exhaustGeometry = new THREE.DodecahedronGeometry(1, 0); // Base size 1, detail 0 for low poly
        this.exhaustEdges = new THREE.EdgesGeometry(exhaustGeometry);
        
        // Create smaller dodecahedron for dust particles
        const dustGeometry = new THREE.DodecahedronGeometry(0.7, 0); // Smaller size, detail 0
        this.dustEdges = new THREE.EdgesGeometry(dustGeometry);
        
        // Initialize particle pool
        this._initializeParticlePool();
        
        // Track emission timing for consistent rate
        this.lastEmissionTime = 0;
        this.emissionRate = 20; // Reduced rate for 3D objects
    }
    
    /**
     * Initialize the particle pool
     * @private
     */
    _initializeParticlePool() {
        for (let i = 0; i < this.particleCount; i++) {
            // Create wireframe mesh for exhaust
            const exhaustParticle = new THREE.LineSegments(this.exhaustEdges, this.exhaustMaterial.clone());
            exhaustParticle.scale.set(0.003, 0.003, 0.003); // Small scale for game world
            exhaustParticle.visible = false;
            
            // Create wireframe mesh for dust
            const dustParticle = new THREE.LineSegments(this.dustEdges, this.dustMaterial.clone());
            dustParticle.scale.set(0.0015, 0.0015, 0.0015); // Even smaller for dust
            dustParticle.visible = false;
            
            // Store both meshes in the particle object
            const particle = {
                exhaust: exhaustParticle,
                dust: dustParticle,
                currentMesh: null, // Reference to currently active mesh
                velocity: new THREE.Vector3(),
                lifetime: 0,
                active: false,
                isDust: false,
                id: i
            };
            
            // Add both meshes to the group
            this.particleGroup.add(exhaustParticle);
            this.particleGroup.add(dustParticle);
            this.particles.push(particle);
        }
    }
    
    /**
     * Create a dust shower at the impact point
     * @param {THREE.Vector3} position - The position of the impact
     * @param {THREE.Vector3} normal - The surface normal at the impact point
     * @returns {number} - Number of dust particles created
     */
    createDustShower(position, normal) {
        // Number of dust particles to create
        const dustCount = 10; // Reduced count
        let created = 0;
        
        // Find inactive particles to use as dust
        for (let i = 0; i < this.particles.length && created < dustCount; i++) {
            const particle = this.particles[i];
            
            if (!particle.active) {
                // Position slightly above the surface
                const dustPos = position.clone().add(
                    normal.clone().multiplyScalar(0.001) // 1m above surface
                );
                
                // Activate dust mesh, hide exhaust mesh
                particle.dust.position.copy(dustPos);
                particle.dust.visible = true;
                particle.exhaust.visible = false;
                particle.currentMesh = particle.dust;
                
                // Random direction in hemisphere facing away from surface
                const randomDir = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize();
                
                // Make sure it points away from surface
                if (randomDir.dot(normal) < 0) {
                    randomDir.negate();
                }
                
                // Set velocity - REDUCED BY 4X for better moon gravity effect
                const speed = (0.01 + Math.random() * 0.02) * 0.5;
                particle.velocity.copy(randomDir).multiplyScalar(speed);
                
                // Add small upward component along normal
                particle.velocity.addScaledVector(normal, 0.005);
                
                // Set as dust particle
                particle.active = true;
                particle.isDust = true;
                particle.lifetime = 0;
                
                // Random rotation
                particle.dust.rotation.set(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );
                
                // Random size variation
                const sizeVar = 0.0015 + Math.random() * 0.0005;
                particle.dust.scale.set(sizeVar, sizeVar, sizeVar);
                
                created++;
            }
        }
        
        return created;
    }
    
    /**
     * Emit exhaust particles from the engine
     * @param {number} dt - Delta time in seconds
     * @param {boolean} engineOn - Whether the engine is currently firing
     * @param {string} gameStatus - Current game status ('playing', 'landed', 'crashed')
     */
    emitExhaust(dt, engineOn, gameStatus) {
        // Only emit particles when engine is on and game is in progress
        if (!engineOn || gameStatus !== 'playing') return;
        
        // Calculate how many particles to emit this frame
        this.lastEmissionTime += dt;
        const particlesToEmit = Math.floor(this.lastEmissionTime * this.emissionRate);
        
        if (particlesToEmit > 0) {
            this.lastEmissionTime -= particlesToEmit / this.emissionRate;
            
            // Emit multiple particles per frame
            let emitted = 0;
            for (let i = 0; i < this.particles.length && emitted < particlesToEmit; i++) {
                const particle = this.particles[i];
                
                if (!particle.active) {
                    // Get engine position in world space
                    const enginePos = new THREE.Vector3(0, -0.005, 0);
                    enginePos.applyMatrix4(this.emitter.matrixWorld);
                    
                    // Add slight randomness to position
                    const randomOffset = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.002,
                        (Math.random() - 0.5) * 0.002,
                        (Math.random() - 0.5) * 0.002
                    );
                    enginePos.add(randomOffset);
                    
                    // Activate exhaust mesh, hide dust mesh
                    particle.exhaust.position.copy(enginePos);
                    particle.exhaust.visible = true;
                    particle.dust.visible = false;
                    particle.currentMesh = particle.exhaust;
                    
                    // Random rotation for variety
                    particle.exhaust.rotation.set(
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2
                    );
                    
                    // Set random size - slightly smaller
                    const size = 0.003 + Math.random() * 0.002;
                    particle.exhaust.scale.set(size, size, size);
                    
                    // Get engine direction (opposite to lander's up)
                    const engineDir = new THREE.Vector3(0, -1, 0);
                    engineDir.applyQuaternion(this.emitter.quaternion);
                    
                    // Add randomness to direction
                    engineDir.x += (Math.random() - 0.5) * 0.2;
                    engineDir.z += (Math.random() - 0.5) * 0.2;
                    engineDir.normalize();
                    
                    // Set velocity with high speed
                    const speed = 0.15 + Math.random() * 0.1;
                    particle.velocity.set(
                        engineDir.x * speed,
                        engineDir.y * speed,
                        engineDir.z * speed
                    );
                    
                    // Reset lifetime and activate
                    particle.lifetime = 0;
                    particle.active = true;
                    particle.isDust = false; // This is an exhaust particle
                    
                    // Reset opacity
                    particle.exhaust.material.opacity = 0.8;
                    
                    emitted++;
                }
            }
        }
    }
    
    /**
     * Update all active particles
     * @param {number} dt - Delta time in seconds
     * @param {number} moonGravity - Base moon gravity value
     * @param {number} gravityLevel - Current gravity level multiplier
     */
    updateParticles(dt, moonGravity, gravityLevel) {
        // Update existing particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            if (particle.active && particle.currentMesh) {
                // Get current mesh reference
                const mesh = particle.currentMesh;
                
                // Update position based on velocity
                mesh.position.x += particle.velocity.x * dt;
                mesh.position.y += particle.velocity.y * dt;
                mesh.position.z += particle.velocity.z * dt;
                
                // Apply gravity - increased for dust to ensure they fall back to moon
                const dirToCenter = new THREE.Vector3().sub(mesh.position).normalize();
                // Increased gravity multiplier for dust (from 3 to 12), kept exhaust at 8
                const gravityMultiplier = particle.isDust ? 12 : 8; 
                
                particle.velocity.x += dirToCenter.x * moonGravity * gravityLevel * dt * gravityMultiplier;
                particle.velocity.y += dirToCenter.y * moonGravity * gravityLevel * dt * gravityMultiplier;
                particle.velocity.z += dirToCenter.z * moonGravity * gravityLevel * dt * gravityMultiplier;
                
                // Slowly rotate the particle for more dynamic look
                mesh.rotation.x += dt * (particle.isDust ? 0.2 : 1.0);
                mesh.rotation.y += dt * (particle.isDust ? 0.3 : 1.5);
                mesh.rotation.z += dt * (particle.isDust ? 0.1 : 0.8);
                
                // Check for collision with moon surface
                const distToCenter = mesh.position.length();
                
                // Use raycasting for collision detection
                const direction = mesh.position.clone().normalize();
                
                // Create raycaster from the particle's position toward the moon center
                const raycaster = new THREE.Raycaster();
                raycaster.set(mesh.position, direction.clone().negate());
                
                // Increase precision of raycasting
                raycaster.params.Line.threshold = 0.001;
                raycaster.params.Points.threshold = 0.001;
                
                // Cast ray against the moon mesh
                const intersects = raycaster.intersectObject(this.moonMesh);
                
                // Check if particle is below the surface
                let isColliding = false;
                let normal = direction.clone();
                let surfacePoint = null;
                
                if (intersects.length > 0) {
                    const intersectionPoint = intersects[0].point;
                    surfacePoint = intersectionPoint.clone();
                    
                    // Check if particle is at or below the surface
                    const threshold = 0.0001;
                    if (mesh.position.distanceTo(intersectionPoint) <= threshold) {
                        isColliding = true;
                        
                        // Get the surface normal from the intersection
                        normal = intersects[0].face.normal.clone();
                        // Transform the normal from local to world coordinates
                        const normalMatrix = new THREE.Matrix3().getNormalMatrix(this.moonMesh.matrixWorld);
                        normal.applyMatrix3(normalMatrix).normalize();
                    }
                } else {
                    // Alternative check: if no intersection but particle is below moon surface
                    if (distToCenter <= this.moonRadius) {
                        isColliding = true;
                        // Use direction from center as normal (approximate)
                        normal = direction.clone();
                        // Approximate surface point
                        surfacePoint = direction.clone().multiplyScalar(this.moonRadius);
                    }
                }
                
                if (isColliding) {
                    if (particle.isDust) {
                        // Dust particles settle on the surface
                        if (surfacePoint) {
                            // Place slightly above the exact surface point
                            const offset = normal.clone().multiplyScalar(0.0005);
                            mesh.position.copy(surfacePoint.clone().add(offset));
                        } else {
                            // Fallback if no surface point
                            const surfacePos = normal.clone().multiplyScalar(distToCenter + 0.0005);
                            mesh.position.copy(surfacePos);
                        }
                        
                        // Add bounce effect for dust particles
                        const dot = particle.velocity.dot(normal);
                        const reflection = normal.clone().multiplyScalar(2 * dot);
                        particle.velocity.sub(reflection);
                        
                        // Add energy loss on bounce (95% energy loss)
                        particle.velocity.multiplyScalar(0.05);
                        
                        // Add a small random horizontal drift to simulate dust spreading
                        const tangent = new THREE.Vector3();
                        if (Math.abs(normal.y) < 0.99) {
                            tangent.set(normal.z, 0, -normal.x).normalize();
                        } else {
                            tangent.set(1, 0, 0);
                        }
                        const drift = 0.0005 * (Math.random() - 0.5);
                        particle.velocity.addScaledVector(tangent, drift);
                        
                        // Age dust particles faster when they hit the surface
                        particle.lifetime += dt * 1.5;
                        
                        // Align with surface
                        mesh.lookAt(mesh.position.clone().add(normal));
                    } else {
                        // Exhaust particles create dust and bounce before disappearing
                        const impactPoint = surfacePoint ? surfacePoint.clone() : normal.clone().multiplyScalar(distToCenter);
                        
                        // Calculate reflection vector for velocity (bounce effect)
                        const dot = particle.velocity.dot(normal);
                        const reflection = normal.clone().multiplyScalar(2 * dot);
                        particle.velocity.sub(reflection);
                        
                        // Add energy loss on bounce (80% energy loss - less than dust)
                        particle.velocity.multiplyScalar(0.2);
                        
                        // Add a small random component to make bounces more varied
                        particle.velocity.x += (Math.random() - 0.5) * 0.01;
                        particle.velocity.y += (Math.random() - 0.5) * 0.01;
                        particle.velocity.z += (Math.random() - 0.5) * 0.01;
                        
                        // Create dust shower at impact point
                        this.createDustShower(impactPoint, normal);
                        
                        // Convert exhaust particle to a dust particle after first bounce
                        particle.isDust = true;
                        
                        // Hide exhaust mesh, show dust mesh
                        particle.exhaust.visible = false;
                        particle.dust.visible = true;
                        particle.dust.position.copy(mesh.position);
                        particle.currentMesh = particle.dust;
                        
                        // Reset lifetime for the new dust particle
                        particle.lifetime = 0;
                    }
                } else {
                    // Normal aging
                    particle.lifetime += dt;
                }
                
                // Update opacity based on lifetime
                const maxLifetime = particle.isDust ? 2.0 : 1.0;
                const opacity = 1.0 - (particle.lifetime / maxLifetime);
                mesh.material.opacity = Math.max(0, opacity);
                
                // Check max distance or lifetime
                const distToLander = mesh.position.distanceTo(this.emitter.position);
                if (distToLander > 0.3 || particle.lifetime > maxLifetime) {
                    // Deactivate particle
                    particle.active = false;
                    mesh.visible = false;
                }
            }
        }
    }
}
