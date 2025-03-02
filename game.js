import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWorld, updateStarfield, updateShadow, starfieldControls, rbf } from './src/components/World.js';
import { createMinimap, updateMinimap, resizeMinimap } from './minimap.js';
import { ParticleSystem } from './particles.js';

// Use the global SimplexNoise reference provided by index.html
const { createNoise3D } = window.SimplexNoise;

// Create noise3D function for terrain generation and effects
const noise3D = createNoise3D();

// Initialize scene, camera, and renderer with anti-aliasing
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Set space to black

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false  // Changed to false since we're using scene.background
});

// Initialize world objects
const { starfield, moon, sunlight, landerShadow, mountainCenters, craterCenters, moonRadius } = createWorld();

// Reference to the moon mesh for collision detection
let moonMesh;

// Add world objects to the scene
scene.add(starfield);
const moonGroup = new THREE.Group();
scene.add(moonGroup);
moonGroup.add(sunlight);
moonGroup.add(moon);
moonGroup.add(landerShadow); // Lander shadow is now part of the world

// Find the actual moon mesh for collision detection
// The moon is a group containing the surface mesh and wireframe
moonMesh = moon.children.find(child => child instanceof THREE.Mesh);

// Set up sun-like lighting (this is now just ambient light, since sunlight is part of the world)
const ambientLight = new THREE.AmbientLight(0x080808); // Very dim ambient light
scene.add(ambientLight);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Remove shadow mapping from renderer
renderer.shadowMap.enabled = false;

// Lander setup (rest of the code remains the same, but we'll reference moonRadius from world)
const landerAltitude = 0.15;
const landerScale = 0.01; // 10m compared to 1km moon diameter

// Simplify lander to a cone only
// Create lander group
const lander = new THREE.Group();
lander.position.set(0, moonRadius + landerAltitude, 0);

// Create main body (cone)
const bodyGeometry = new THREE.ConeGeometry(
    0.005, // radius = 5m (half of 10m diameter)
    0.01,  // height = 10m
    6      // reduced segments for more retro look
);
const bodyEdges = new THREE.EdgesGeometry(bodyGeometry, 1);
const bodyMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00, // Match the green wireframe theme
    transparent: true,
    opacity: 0.8
});

// Add solid body for proper occlusion
const solidBodyMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.FrontSide
});
const solidBody = new THREE.Mesh(bodyGeometry, solidBodyMaterial);
solidBody.position.y = 0.005; // Half height
lander.add(solidBody);

const bodyWireframe = new THREE.LineSegments(bodyEdges, bodyMaterial);
bodyWireframe.position.y = 0.005; // Half height
lander.add(bodyWireframe);

// Add a simple engine nozzle at the bottom
const nozzleGeometry = new THREE.BufferGeometry();
const nozzlePoints = new Float32Array([
    // Simple triangle for the nozzle
    0, 0, 0,          0.002, -0.002, 0,
    0, 0, 0,          -0.002, -0.002, 0,
    0.002, -0.002, 0, -0.002, -0.002, 0
]);
nozzleGeometry.setAttribute('position', new THREE.BufferAttribute(nozzlePoints, 3));
const nozzle = new THREE.LineSegments(nozzleGeometry, bodyMaterial);
lander.add(nozzle);

scene.add(lander);

// First define the camera and its parameters
let cameraDistance = 0.05;
const minCameraDistance = 0.02; // Minimum zoom distance
const maxCameraDistance = 0.2;  // Maximum zoom distance
let cameraAngle = Math.PI / 4; // 45 degrees down angle
const minCameraAngle = Math.PI / 12;
const maxCameraAngle = Math.PI / 2.5; // Maximum angle (72 degrees)

// Add camera orbit controls
const cameraControls = {
    orbitActive: false,
    orbitStartX: 0,
    orbitStartY: 0,
    orbitX: 0, // Horizontal orbit angle
    orbitY: 0, // Vertical orbit angle
    sensitivity: 0.01,
    zoomSpeed: 0.005
};

const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight,
    0.001, // Near clipping plane
    1000   // Far clipping plane
);
scene.add(camera);

// Define the camera update function with improved pole handling and orbit controls
function updateCamera() {
    // Get direction from moon center to lander (up direction)
    const upDirection = lander.position.clone().normalize();
    
    // Store the previous camera orientation
    const prevForward = new THREE.Vector3();
    camera.getWorldDirection(prevForward);
    
    // We'll use a quaternion-based approach for smoother transitions
    // First, create a quaternion that rotates from world-up to our local-up
    const alignToUp = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), 
        upDirection
    );
    
    // Create a rotation around the up axis based on the current moon rotation
    // This keeps our camera orientation consistent with the moon's rotation
    const moonRotation = new THREE.Quaternion();
    moonGroup.getWorldQuaternion(moonRotation);
    
    // Combine these rotations
    const baseOrientation = new THREE.Quaternion().multiplyQuaternions(
        alignToUp,
        moonRotation
    );
    
    // Calculate camera position
    const cameraPos = lander.position.clone();
    
    // Create a forward vector (initially pointing along world Z)
    const forward = new THREE.Vector3(0, 0, 1);
    
    // Apply our combined rotation to get the camera's forward direction
    forward.applyQuaternion(baseOrientation);
    
    // Calculate right vector
    const right = new THREE.Vector3();
    right.crossVectors(upDirection, forward).normalize();
    
    // Recalculate forward for perfect orthogonality
    forward.crossVectors(right, upDirection).normalize();
    
    // Apply orbit rotation around the up vector (horizontal orbit)
    const horizontalOrbit = new THREE.Quaternion().setFromAxisAngle(
        upDirection,
        cameraControls.orbitX
    );
    forward.applyQuaternion(horizontalOrbit);
    right.crossVectors(upDirection, forward).normalize();
    
    // Apply orbit rotation around the right vector (vertical orbit)
    // This affects the camera angle
    const verticalOrbitAngle = Math.max(
        minCameraAngle,
        Math.min(maxCameraAngle, cameraAngle + cameraControls.orbitY)
    );
    
    // Move backward along forward direction
    cameraPos.addScaledVector(forward, -cameraDistance * Math.cos(verticalOrbitAngle));
    
    // Move up along up direction
    cameraPos.addScaledVector(upDirection, cameraDistance * Math.sin(verticalOrbitAngle));
    
    // Set camera position and orientation
    camera.position.copy(cameraPos);
    camera.up.copy(upDirection);
    camera.lookAt(lander.position);
}

// Physics parameters adjustments
const MOON_GRAVITY = 0.00162; // 1.62 m/s² converted to km/s²
const ENGINE_POWER = MOON_GRAVITY * 4; // 4x gravity force (increased from 2x)
const ROTATION_SPEED = 2.0; // Doubled rotation speed

// Lander physics state
const landerState = {
    position: new THREE.Vector3(0, moonRadius + landerAltitude, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    acceleration: new THREE.Vector3(0, 0, 0),
    tilt: new THREE.Vector2(0, 0), // x and z axis tilt
    engineOn: false
};

// Now initialize the camera after landerState is defined
updateCamera();

// Wrapper function to call the imported updateShadow function
function updateShadowWrapper() {
    // Call the imported updateShadow function with all required parameters
    updateShadow(lander, landerShadow, moonRadius, moonMesh);
}

// Note: The moon surface is already set to receive shadows in the World.js module

// Add mouse control variables
const mouseControls = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    sensitivity: 0.01
};

// Update mouse controls to handle both lander tilt and camera orbit
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left mouse button for lander tilt
        mouseControls.active = true;
        mouseControls.startX = e.clientX;
        mouseControls.startY = e.clientY;
        mouseControls.currentX = e.clientX;
        mouseControls.currentY = e.clientY;
    } else if (e.button === 2) { // Right mouse button for camera orbit
        cameraControls.orbitActive = true;
        cameraControls.orbitStartX = e.clientX;
        cameraControls.orbitStartY = e.clientY;
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // Left mouse button
        mouseControls.active = false;
    } else if (e.button === 2) { // Right mouse button
        cameraControls.orbitActive = false;
    }
});

window.addEventListener('mousemove', (e) => {
    if (mouseControls.active) {
        mouseControls.currentX = e.clientX;
        mouseControls.currentY = e.clientY;
    }
    
    if (cameraControls.orbitActive) {
        // Calculate delta movement
        const deltaX = e.clientX - cameraControls.orbitStartX;
        const deltaY = e.clientY - cameraControls.orbitStartY;
        
        // Update orbit angles
        cameraControls.orbitX += deltaX * cameraControls.sensitivity * 0.1;
        cameraControls.orbitY += deltaY * cameraControls.sensitivity * 0.1;
        
        // Clamp vertical orbit to avoid flipping
        cameraControls.orbitY = Math.max(
            minCameraAngle - cameraAngle,
            Math.min(maxCameraAngle - cameraAngle, cameraControls.orbitY)
        );
        
        // Reset start position for next movement
        cameraControls.orbitStartX = e.clientX;
        cameraControls.orbitStartY = e.clientY;
        
        // Update camera immediately for responsive feel
        updateCamera();
    }
});

// Add mouse wheel for zoom
window.addEventListener('wheel', (e) => {
    // Determine zoom direction
    const zoomDirection = e.deltaY > 0 ? 1 : -1;
    
    // Update camera distance
    cameraDistance = Math.max(
        minCameraDistance,
        Math.min(maxCameraDistance, cameraDistance + zoomDirection * cameraControls.zoomSpeed)
    );
    
    // Update camera immediately
    updateCamera();
    
    // Prevent default scrolling behavior
    e.preventDefault();
}, { passive: false });

// Prevent context menu on right click
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Movement parameters
const speed = 1.0; // Radians per second for moon rotation

// Move the engine flame creation to before updateLanderPhysics
// Create engine flame for visual feedback
function createEngineFlame() {
    // Create a cone for the flame
    const flameGeometry = new THREE.ConeGeometry(0.003, 0.006, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
    });
    
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    
    // Position at bottom of lander, pointing downward
    flame.position.y = -0.001;
    flame.rotation.x = Math.PI; // Rotate to point downward
    
    // Initially hidden
    flame.visible = false;
    
    // Add to lander
    lander.add(flame);
    
    return flame;
}

// Create the engine flame
const engineFlame = createEngineFlame();

// Fix the thrust-to-weight ratio calculation and scale thrust with gravity
const rocketPhysics = {
    dryMass: 1000,          // Dry mass in kg (lander without fuel)
    fuelMass: 1000,         // Initial fuel mass in kg
    specificImpulse: 311,   // Specific impulse in seconds (typical for hypergolic propellants)
    baseThrustForce: 12000, // Base thrust force in Newtons at 1x gravity
    g0: 9.81,               // Standard gravity for Isp calculations (m/s²)
    get currentMass() {     // Total current mass (dry + remaining fuel)
        return this.dryMass + this.fuelMass * (gameState.fuel / 100);
    },
    get maxThrustForce() {  // Thrust scales with gravity level
        return this.baseThrustForce * gameState.gravityLevel;
    },
    get thrustToWeightRatio() { // Thrust-to-weight ratio at current mass
        // Calculate using Earth gravity for consistency
        const earthWeight = this.currentMass * this.g0; // Weight in N on Earth
        return this.baseThrustForce / earthWeight; // Use base thrust for consistent TWR
    },
    get effectiveTWR() { // Effective thrust-to-weight ratio in current gravity
        // Calculate using the current gravity level
        const currentWeight = this.currentMass * MOON_GRAVITY * gameState.gravityLevel * 1000; // Weight in N
        return this.maxThrustForce / currentWeight; // Should remain constant as gravity changes
    }
};

// Update game state to include gravity level control
const gameState = {
    status: 'playing',                // 'playing', 'landed', 'crashed'
    landingSpeed: 0.005,              // Maximum safe landing speed (5 m/s)
    landingAngle: Math.PI / 12,       // Maximum safe landing angle (15 degrees)
    score: 0,
    fuel: 100,                        // Fuel percentage (0-100)
    gravityLevel: 1.0,                // Multiplier for gravity (1.0 = moon gravity)
    surfaceRadius: moonRadius,        // Current surface radius at lander position (initialized to base radius)
    get fuelMassRemaining() {         // Current fuel mass in kg
        return rocketPhysics.fuelMass * (this.fuel / 100);
    },
    get totalMass() {                 // Total current mass
        return rocketPhysics.dryMass + this.fuelMassRemaining;
    }
};

// Add UI elements for game state
function createGameUI() {
    // Create container for game UI
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '20px';
    uiContainer.style.left = '20px';
    uiContainer.style.color = 'white';
    uiContainer.style.fontFamily = 'monospace';
    uiContainer.style.fontSize = '16px';
    uiContainer.style.textShadow = '1px 1px 1px black';
    document.body.appendChild(uiContainer);
    
    // Create status display
    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'status-display';
    uiContainer.appendChild(statusDisplay);
    
    // Create fuel gauge
    const fuelGauge = document.createElement('div');
    fuelGauge.id = 'fuel-gauge';
    fuelGauge.style.marginTop = '10px';
    uiContainer.appendChild(fuelGauge);
    
    // Create velocity display
    const velocityDisplay = document.createElement('div');
    velocityDisplay.id = 'velocity-display';
    velocityDisplay.style.marginTop = '10px';
    uiContainer.appendChild(velocityDisplay);
    
    // Create angle display
    const angleDisplay = document.createElement('div');
    angleDisplay.id = 'angle-display';
    angleDisplay.style.marginTop = '5px';
    uiContainer.appendChild(angleDisplay);
    
    // Create restart button (initially hidden)
    const restartButton = document.createElement('button');
    restartButton.id = 'restart-button';
    restartButton.textContent = 'Restart Mission';
    restartButton.style.marginTop = '20px';
    restartButton.style.padding = '10px';
    restartButton.style.backgroundColor = '#ff3300';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '5px';
    restartButton.style.cursor = 'pointer';
    restartButton.style.display = 'none';
    restartButton.addEventListener('click', restartGame);
    uiContainer.appendChild(restartButton);
    
    return {
        statusDisplay,
        fuelGauge,
        velocityDisplay,
        angleDisplay,
        restartButton
    };
}

// Create UI elements
const ui = createGameUI();

// Add gravity control UI
function createGravityControl() {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.backgroundColor = 'rgba(0,0,0,0.5)';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.color = 'white';
    container.style.fontFamily = 'monospace';
    
    const label = document.createElement('div');
    label.textContent = 'Gravity Level:';
    container.appendChild(label);
    
    const valueDisplay = document.createElement('div');
    valueDisplay.id = 'gravity-value';
    valueDisplay.textContent = `${gameState.gravityLevel.toFixed(1)}x Moon`;
    valueDisplay.style.marginBottom = '5px';
    container.appendChild(valueDisplay);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0.5';
    slider.max = '4.0';
    slider.step = '0.1';
    slider.value = gameState.gravityLevel;
    slider.style.width = '150px';
    
    slider.addEventListener('input', () => {
        gameState.gravityLevel = parseFloat(slider.value);
        valueDisplay.textContent = `${gameState.gravityLevel.toFixed(1)}x Moon`;
        
        // Only update if game is in progress
        if (gameState.status === 'playing') {
            updateUI();
        }
    });
    
    container.appendChild(slider);
    
    // Add preset buttons
    const presetContainer = document.createElement('div');
    presetContainer.style.marginTop = '10px';
    presetContainer.style.display = 'flex';
    presetContainer.style.justifyContent = 'space-between';
    
    const presets = [
        { name: 'Moon', value: 1.0 },
        { name: 'Mars', value: 2.6 },  // Mars gravity is ~2.6x Moon's
        { name: 'Earth', value: 6.0 }  // Earth gravity is ~6x Moon's but we cap at 4
    ];
    
    presets.forEach(preset => {
        const button = document.createElement('button');
        button.textContent = preset.name;
        button.style.padding = '5px';
        button.style.backgroundColor = '#444';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
        
        button.addEventListener('click', () => {
            const value = Math.min(4.0, preset.value); // Cap at 4x
            gameState.gravityLevel = value;
            slider.value = value;
            valueDisplay.textContent = `${value.toFixed(1)}x Moon`;
            
            // Only update if game is in progress
            if (gameState.status === 'playing') {
                updateUI();
            }
        });
        
        presetContainer.appendChild(button);
    });
    
    container.appendChild(presetContainer);
    document.body.appendChild(container);
    
    return { container, slider, valueDisplay };
}

// Create gravity control
const gravityControl = createGravityControl();

// Create minimap
const minimap = createMinimap(moonRadius, mountainCenters, craterCenters);


// Modify updateLanderPhysics to use the scaled thrust
function updateLanderPhysics(dt) {
    // Skip physics updates if game is over
    if (gameState.status !== 'playing') return;
    
    // Calculate current mass
    const currentMass = gameState.totalMass;
    
    // Calculate direction to moon center for gravity
    const directionToCenter = new THREE.Vector3(0, 0, 0).sub(lander.position).normalize();
    
    // F = ma, so a = F/m
    // Calculate gravitational acceleration based on current mass and gravity level
    const gravityAccel = MOON_GRAVITY * gameState.gravityLevel;
    landerState.acceleration.copy(directionToCenter.multiplyScalar(gravityAccel));

    // Get camera-relative directions
    const upDirection = lander.position.clone().normalize(); // Up is away from moon center
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    // Project camera direction onto tangent plane at lander position
    const tangentCameraDir = cameraDirection.clone();
    tangentCameraDir.sub(upDirection.clone().multiplyScalar(cameraDirection.dot(upDirection)));
    tangentCameraDir.normalize();
    
    // Calculate right vector (perpendicular to up and camera direction)
    const rightVector = new THREE.Vector3();
    rightVector.crossVectors(tangentCameraDir, upDirection).normalize();
    
    // Reset lander rotation to align with local up direction
    lander.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), upDirection);
    
    // Apply tilt based on landerState.tilt values
    const tiltMatrix = new THREE.Matrix4();
    
    // Handle keyboard controls relative to camera view
    if (keys['ArrowLeft']) {
        landerState.tilt.y += ROTATION_SPEED * dt;
    }
    if (keys['ArrowRight']) {
        landerState.tilt.y -= ROTATION_SPEED * dt;
    }
    if (keys['ArrowUp']) {
        landerState.tilt.x -= ROTATION_SPEED * dt;
    }
    if (keys['ArrowDown']) {
        landerState.tilt.x += ROTATION_SPEED * dt;
    }
    
    // Handle mouse controls when active
    if (mouseControls.active) {
        // Calculate mouse movement delta
        const deltaX = mouseControls.currentX - mouseControls.startX;
        const deltaY = mouseControls.currentY - mouseControls.startY;
        
        // Apply tilt based on mouse position relative to camera view
        landerState.tilt.y = -deltaX * mouseControls.sensitivity;
        landerState.tilt.x = deltaY * mouseControls.sensitivity;
    }
    
    // Apply tilt in camera-relative directions
    // First tilt around the right vector (forward/backward tilt)
    lander.rotateOnWorldAxis(rightVector.clone().cross(upDirection), landerState.tilt.y);
    
    // Then tilt around the forward vector (left/right tilt)
    lander.rotateOnWorldAxis(rightVector, landerState.tilt.x);
    
    // Only use space for thrust if there's fuel
    const thrustRequested = keys[' '] === true;
    landerState.engineOn = thrustRequested && gameState.fuel > 0;
    
    if (landerState.engineOn) {
        // Calculate fuel consumption using the rocket equation
        // mdot = F / (Isp * g0)
        const thrustForce = rocketPhysics.maxThrustForce; // N (now scales with gravity)
        const mdot = thrustForce / (rocketPhysics.specificImpulse * rocketPhysics.g0); // kg/s
        
        // Convert to percentage points per second
        const fuelPercentPerSecond = (mdot / rocketPhysics.fuelMass) * 100;
        
        // Consume fuel
        gameState.fuel = Math.max(0, gameState.fuel - fuelPercentPerSecond * dt);
        
        // Get the lander's up direction (opposite to its local Y axis)
        const thrustDirection = new THREE.Vector3(0, 1, 0);
        thrustDirection.applyQuaternion(lander.quaternion);
        
        // Calculate thrust acceleration: a = F/m
        const thrustAccel = thrustForce / (currentMass * 1000); // Convert to km/s²
        
        // Apply thrust acceleration
        landerState.acceleration.addScaledVector(thrustDirection, thrustAccel);
    }

    // Update velocity and position using basic Euler integration
    landerState.velocity.addScaledVector(landerState.acceleration, dt);
    landerState.position.addScaledVector(landerState.velocity, dt);

    // Update lander visual position
    lander.position.copy(landerState.position);
    
    // Check for collision with moon surface using raycasting
    const landerDirection = lander.position.clone().normalize();
    const landerDistanceToCenter = lander.position.length();
    
    // Create raycaster from the lander position toward the moon center
    const raycaster = new THREE.Raycaster();
    raycaster.set(lander.position, landerDirection.clone().negate());
    
    // Increase precision of raycasting
    raycaster.params.Line.threshold = 0.001;
    raycaster.params.Points.threshold = 0.001;
    
    // Cast ray against the moon mesh
    const intersects = raycaster.intersectObject(moonMesh);
    
    // Store the surface radius for UI and other calculations
    let surfacePoint;
    if (intersects.length > 0) {
        // Use the first intersection point
        surfacePoint = intersects[0].point;
        gameState.surfaceRadius = surfacePoint.length();
    } else {
        // Fallback to base radius if no intersection (shouldn't happen)
        gameState.surfaceRadius = moonRadius;
        surfacePoint = landerDirection.clone().multiplyScalar(moonRadius);
    }
    
    // Calculate distance to surface - use a more precise approach
    // First get the distance to the intersection point
    const distanceToIntersection = lander.position.distanceTo(surfacePoint);
    // Then subtract the lander radius (5m)
    const distanceToSurface = distanceToIntersection - 0.005;
    
    if (distanceToSurface <= 0) {
        // Get surface normal at collision point from the intersection
        let surfaceNormal;
        if (intersects.length > 0) {
            surfaceNormal = intersects[0].face.normal.clone();
            // Transform the normal from local to world coordinates
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(moonMesh.matrixWorld);
            surfaceNormal.applyMatrix3(normalMatrix).normalize();
        } else {
            // Fallback to direction from center if no intersection
            surfaceNormal = surfacePoint.clone().normalize();
        }
        
        // Get lander's velocity
        const velocity = landerState.velocity.length();
        
        // Get lander's up vector
        const landerUp = new THREE.Vector3(0, 1, 0).applyQuaternion(lander.quaternion);
        
        // Calculate angle between lander up and surface normal
        const angle = Math.acos(landerUp.dot(surfaceNormal));
        
        // Check landing conditions
        if (velocity <= gameState.landingSpeed && angle <= gameState.landingAngle) {
            // Successful landing
            gameState.status = 'landed';
            
            // Stop all movement
            landerState.velocity.set(0, 0, 0);
            
            // Align lander with surface normal
            lander.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfaceNormal);
            
            // Position lander exactly on surface
            lander.position.copy(surfaceNormal.multiplyScalar(moonRadius + 0.005));
            
            // Calculate score based on remaining fuel
            gameState.score = Math.round(gameState.fuel);
            
            // Play success sound
            playSound('landing');
        } else {
            // Crash
            gameState.status = 'crashed';
            
            // Stop all movement
            landerState.velocity.set(0, 0, 0);
            
            // Tilt the lander to show crash
            const crashTilt = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
                Math.PI / 4
            );
            lander.quaternion.premultiply(crashTilt);
            
            // Position lander on surface
            lander.position.copy(surfaceNormal.multiplyScalar(moonRadius + 0.005));
            
            // Play crash sound
            playSound('crash');
        }
    }
    
    // Update shadow position
    updateShadowWrapper();
    
    // Update UI
    updateUI();
}

// Update UI to show both TWR values and note that thrust scales with gravity
function updateUI() {
    // Update status
    let statusText = '';
    let statusColor = 'white';
    
    switch(gameState.status) {
        case 'playing':
            statusText = 'Mission Status: In Progress';
            break;
        case 'landed':
            statusText = 'Mission Status: LANDED SUCCESSFULLY!';
            statusColor = '#00ff00';
            break;
        case 'crashed':
            statusText = 'Mission Status: CRASHED!';
            statusColor = '#ff0000';
            break;
    }
    
    ui.statusDisplay.textContent = statusText;
    ui.statusDisplay.style.color = statusColor;
    
    // Update fuel gauge with mass information
    const fuelWidth = Math.max(0, gameState.fuel);
    ui.fuelGauge.innerHTML = `Fuel: <div style="background-color: ${fuelWidth > 20 ? '#00ff00' : '#ff0000'}; 
                                          width: ${fuelWidth}px; 
                                          height: 10px; 
                                          display: inline-block;"></div> ${Math.round(fuelWidth)}% (${Math.round(gameState.fuelMassRemaining)} kg)`;
    
    // Update velocity
    const velocity = landerState.velocity.length() * 1000; // Convert to m/s
    const velocityColor = velocity < gameState.landingSpeed * 1000 ? '#00ff00' : '#ff0000';
    ui.velocityDisplay.innerHTML = `Velocity: <span style="color: ${velocityColor}">${velocity.toFixed(1)} m/s</span>`;
    
    // Update angle
    const upVector = new THREE.Vector3(0, 1, 0).applyQuaternion(lander.quaternion);
    const surfaceNormal = lander.position.clone().normalize();
    const angle = Math.acos(upVector.dot(surfaceNormal)) * 180 / Math.PI;
    const angleColor = angle < gameState.landingAngle * 180 / Math.PI ? '#00ff00' : '#ff0000';
    ui.angleDisplay.innerHTML = `Angle: <span style="color: ${angleColor}">${angle.toFixed(1)}°</span>`;
    
    // Show/hide restart button
    ui.restartButton.style.display = (gameState.status !== 'playing') ? 'block' : 'none';
    
    // Add mass display if it doesn't exist
    if (!ui.massDisplay) {
        ui.massDisplay = document.createElement('div');
        ui.massDisplay.id = 'mass-display';
        ui.massDisplay.style.marginTop = '5px';
        ui.fuelGauge.parentNode.insertBefore(ui.massDisplay, ui.fuelGauge.nextSibling);
    }
    
    // Update mass display
    ui.massDisplay.innerHTML = `Total Mass: ${Math.round(gameState.totalMass)} kg`;
    
    // Add TWR display if it doesn't exist
    if (!ui.twrDisplay) {
        ui.twrDisplay = document.createElement('div');
        ui.twrDisplay.id = 'twr-display';
        ui.twrDisplay.style.marginTop = '5px';
        ui.massDisplay.parentNode.insertBefore(ui.twrDisplay, ui.massDisplay.nextSibling);
    }
    
    // Update thrust-to-weight ratio displays
    const twr = rocketPhysics.thrustToWeightRatio;
    ui.twrDisplay.innerHTML = `Thrust/Weight: <span style="color: ${twr > 1 ? '#00ff00' : '#ff0000'}">${twr.toFixed(2)}</span> (Earth)`;
    
    // Add effective TWR display if it doesn't exist
    if (!ui.effectiveTWRDisplay) {
        ui.effectiveTWRDisplay = document.createElement('div');
        ui.effectiveTWRDisplay.id = 'effective-twr-display';
        ui.effectiveTWRDisplay.style.marginTop = '5px';
        ui.twrDisplay.parentNode.insertBefore(ui.effectiveTWRDisplay, ui.twrDisplay.nextSibling);
    }
    
    // Update effective TWR display
    const effectiveTWR = rocketPhysics.effectiveTWR;
    ui.effectiveTWRDisplay.innerHTML = `Effective T/W: <span style="color: ${effectiveTWR > 1 ? '#00ff00' : '#ff0000'}">${effectiveTWR.toFixed(2)}</span> (thrust scales with gravity)`;
    
    // Add altitude display if it doesn't exist
    if (!ui.altitudeDisplay) {
        ui.altitudeDisplay = document.createElement('div');
        ui.altitudeDisplay.id = 'altitude-display';
        ui.altitudeDisplay.style.marginTop = '5px';
        ui.velocityDisplay.parentNode.insertBefore(ui.altitudeDisplay, ui.velocityDisplay.nextSibling);
    }
    
    // Update altitude display
    const altitude = (lander.position.length() - gameState.surfaceRadius) * 1000; // Convert to meters
    ui.altitudeDisplay.innerHTML = `Altitude: ${altitude.toFixed(1)} m`;
}

// Add a debug display to show control state
function addDebugDisplay() {
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'absolute';
    debugDiv.style.top = '10px';
    debugDiv.style.right = '10px';
    debugDiv.style.color = 'white';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.fontSize = '12px';
    debugDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
    debugDiv.style.padding = '5px';
    document.body.appendChild(debugDiv);
    
    // Update debug info in animation loop
    function updateDebugInfo() {
        debugDiv.innerHTML = `
            Engine: ${landerState.engineOn ? 'ON' : 'OFF'}<br>
            Space: ${keys[' '] ? 'PRESSED' : 'RELEASED'}<br>
            Mouse Active: ${mouseControls.active ? 'YES' : 'NO'}<br>
            Height: ${(lander.position.length() - gameState.surfaceRadius).toFixed(3)}km
        `;
        requestAnimationFrame(updateDebugInfo);
    }
    updateDebugInfo();
}

// Uncomment to add debug display
// addDebugDisplay();

// Fix the missing mousemove event listener
window.addEventListener('mousemove', (e) => {
    if (mouseControls.active) {
        mouseControls.currentX = e.clientX;
        mouseControls.currentY = e.clientY;
    }
});

// Add sound effects
const sounds = {
    landing: new Audio('https://assets.codepen.io/21542/success-1.mp3'),
    crash: new Audio('https://assets.codepen.io/21542/explosion-01.mp3')
};

function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log("Audio play failed:", e));
    }
}

// Restart game function
function restartGame() {
    // Reset game state
    gameState.status = 'playing';
    gameState.fuel = 100;
    gameState.score = 0;
    gameState.surfaceRadius = moonRadius; // Reset surface radius to base value
    
    // Reset lander position and physics
    landerState.position.set(0, moonRadius + landerAltitude, 0);
    landerState.velocity.set(0, 0, 0);
    landerState.acceleration.set(0, 0, 0);
    landerState.tilt.set(0, 0);
    landerState.engineOn = false;
    
    // Update lander visual position
    lander.position.copy(landerState.position);
    
    // Reset lander rotation
    lander.quaternion.identity();
    
    // Update UI
    updateUI();
}


// Create the particle system
const particleSystem = new ParticleSystem(scene, lander, moonMesh, moonRadius);

// Add a clock for timing
const clock = new THREE.Clock();

// Add the missing update function
function update(dt) {
    // Update lander physics
    updateLanderPhysics(dt);
    
    // Handle moon rotation with A/D keys
    if (keys['a'] || keys['A']) {
        moonGroup.rotation.y += speed * dt;
    }
    if (keys['d'] || keys['D']) {
        moonGroup.rotation.y -= speed * dt;
    }
}

// Create a group for trajectory prediction markers
const trajectoryGroup = new THREE.Group();
scene.add(trajectoryGroup);

// Create trajectory prediction markers
function createTrajectoryPrediction() {
    // Number of prediction points (one per second for 30 seconds)
    const predictionPoints = 30;
    const markers = [];
    
    // Create markers
    for (let i = 0; i < predictionPoints; i++) {
        // Create a small cube geometry - reduced by 4x
        const markerGeometry = new THREE.BoxGeometry(0.0005, 0.0005, 0.0005);
        const markerEdges = new THREE.EdgesGeometry(markerGeometry);
        
        // Create wireframe cube with base color (will be updated based on velocity)
        const markerMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00, // Green color to match game theme
            transparent: true,
            opacity: 0.7
        });
        
        // Create wireframe cube
        const marker = new THREE.LineSegments(markerEdges, markerMaterial);
        
        // Initially hide the marker
        marker.visible = false;
        
        // Add to group
        trajectoryGroup.add(marker);
        markers.push(marker);
    }
    
    return markers;
}

// Create trajectory markers
const trajectoryMarkers = createTrajectoryPrediction();

// Update trajectory prediction
function updateTrajectoryPrediction() {
    // Only show trajectory when playing
    if (gameState.status !== 'playing') {
        // Hide all markers when not playing
        trajectoryMarkers.forEach(marker => {
            marker.visible = false;
        });
        return;
    }
    
    // Create a physics simulation to predict trajectory
    // Clone current state to avoid modifying the actual lander state
    const simPosition = landerState.position.clone();
    const simVelocity = landerState.velocity.clone();
    
    // Time step for simulation (1 second per marker)
    const simTimeStep = 1.0;
    
    // Find max velocity for color scaling
    let maxVelocity = landerState.velocity.length();
    
    // First pass to determine max velocity for color scaling
    let tempPosition = simPosition.clone();
    let tempVelocity = simVelocity.clone();
    
    for (let i = 0; i < trajectoryMarkers.length; i++) {
        // Simulate physics for this time step
        for (let step = 0; step < simTimeStep; step += 0.1) {
            // Calculate direction to moon center for gravity
            const dirToCenter = new THREE.Vector3(0, 0, 0).sub(tempPosition).normalize();
            
            // Apply gravity
            const gravityAccel = MOON_GRAVITY * gameState.gravityLevel;
            const gravityStep = dirToCenter.clone().multiplyScalar(gravityAccel * 0.1);
            tempVelocity.add(gravityStep);
            
            // Update position
            const positionStep = tempVelocity.clone().multiplyScalar(0.1);
            tempPosition.add(positionStep);
        }
        
        // Check if this velocity is higher than our current max
        maxVelocity = Math.max(maxVelocity, tempVelocity.length());
    }
    
    // Reset simulation for actual marker placement
    simPosition.copy(landerState.position);
    simVelocity.copy(landerState.velocity);
    
    // Create raycaster for collision detection
    const raycaster = new THREE.Raycaster();
    
    // Update each marker with predicted position
    for (let i = 0; i < trajectoryMarkers.length; i++) {
        const marker = trajectoryMarkers[i];
        
        // Simulate physics for this time step
        for (let step = 0; step < simTimeStep; step += 0.1) {
            // Calculate direction to moon center for gravity
            const dirToCenter = new THREE.Vector3(0, 0, 0).sub(simPosition).normalize();
            
            // Apply gravity
            const gravityAccel = MOON_GRAVITY * gameState.gravityLevel;
            const gravityStep = dirToCenter.clone().multiplyScalar(gravityAccel * 0.1);
            simVelocity.add(gravityStep);
            
            // Update position
            const positionStep = simVelocity.clone().multiplyScalar(0.1);
            simPosition.add(positionStep);
        }
        
        // Check if the predicted position is below the surface using raycasting
        const direction = simPosition.clone().normalize();
        const distanceToCenter = simPosition.length();
        
        // Set up raycaster from the predicted position toward the moon center
        raycaster.set(simPosition, direction.clone().negate());
        
        // Increase precision of raycasting
        raycaster.params.Line.threshold = 0.001;
        raycaster.params.Points.threshold = 0.001;
        
        // Cast ray against the moon mesh
        const intersects = raycaster.intersectObject(moonMesh);
        
        // If we have an intersection and the predicted position is near the intersection point
        let collisionDetected = false;
        
        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;
            // Use a small threshold to detect collision
            const threshold = 0.0001;
            if (simPosition.distanceTo(intersectionPoint) <= threshold) {
                collisionDetected = true;
            }
        } else {
            // Alternative check: if no intersection but position is below moon surface
            const moonSurfaceRadius = moonRadius;
            if (distanceToCenter <= moonSurfaceRadius) {
                collisionDetected = true;
            }
        }
        
        if (collisionDetected) {
            marker.visible = false;
            
            // Hide all remaining markers
            for (let j = i; j < trajectoryMarkers.length; j++) {
                trajectoryMarkers[j].visible = false;
            }
            
            break;
        }
        
        // Update marker position and color
        marker.position.copy(simPosition);
        
        // Scale marker size based on distance from current position
        const distanceFromStart = marker.position.distanceTo(lander.position);
        const scaleFactor = Math.max(0.5, Math.min(1.5, 1 + distanceFromStart * 5));
        marker.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Color based on velocity (dark green to bright green to red)
        const currentVelocity = simVelocity.length();
        const velocityRatio = Math.min(1.0, currentVelocity / maxVelocity);
        
        // Create color gradient from green to red
        const r = Math.floor(velocityRatio * 255); // 0 to 255
        const g = Math.floor(255 - velocityRatio * 155); // 255 to 100
        const b = 0; // Keep blue at 0
        
        marker.material.color.setRGB(r/255, g/255, b/255);
        
        // Fade opacity based on prediction time
        const opacity = 1.0 - (i / trajectoryMarkers.length) * 0.7;
        marker.material.opacity = opacity;
        
        // Make marker visible
        marker.visible = true;
    }
}

// Add a toggle for trajectory prediction
let showTrajectory = true;

// Add key listener for toggling trajectory
window.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
        showTrajectory = !showTrajectory;
        
        // Hide all markers if disabled
        if (!showTrajectory) {
            trajectoryMarkers.forEach(marker => {
                marker.visible = false;
            });
        }
    }
    
    // Add toggle for starfield rotation
    if (e.key === 's' || e.key === 'S') {
        starfieldControls.rotating = !starfieldControls.rotating;
    }
});

// Wrapper function to call the imported updateStarfield function
function updateStarfieldWrapper(dt) {
    // Call the imported updateStarfield function
    updateStarfield(starfield, dt);
}

// Update the animate function to include starfield animation
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    
    update(dt);
    
    // Update particle system
    particleSystem.emitExhaust(dt, landerState.engineOn, gameState.status);
    particleSystem.updateParticles(dt, MOON_GRAVITY, gameState.gravityLevel);
    
    // Update trajectory prediction if enabled
    if (showTrajectory) {
        updateTrajectoryPrediction();
    }
    
    // Update minimap
    updateMinimap(minimap, lander);
    
    // Update starfield
    updateStarfieldWrapper(dt);
    
    // Update camera position to follow lander
    updateCamera();
    
    // Update UI
    updateUI();
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Update minimap if it exists
    resizeMinimap(minimap);
});

// Update instructions to include trajectory toggle
const instructions = document.createElement('div');
instructions.style.position = 'absolute';
instructions.style.bottom = '20px';
instructions.style.left = '20px';
instructions.style.color = 'white';
instructions.style.fontFamily = 'monospace';
instructions.style.fontSize = '14px';
instructions.style.textShadow = '1px 1px 1px black';
instructions.innerHTML = `
    Controls:<br>
    Arrow Keys: Tilt lander<br>
    Space: Thrust<br>
    A/D: Rotate view<br>
    T: Toggle trajectory prediction<br>
    M: Toggle minimap<br>
    S: Toggle starfield rotation<br>
    <br>
    Mouse Controls:<br>
    Left Drag: Tilt lander<br>
    Right Drag: Rotate camera<br>
    Mouse Wheel: Zoom in/out<br>
    <br>
    Minimap: Shows fixed north-up view<br>
    Red marker: Lander position
`;
document.body.appendChild(instructions);
