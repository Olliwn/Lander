import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialize scene, camera, and renderer with anti-aliasing
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Set space to black

// Create starfield background
function createStarfield() {
    const starCount = 1500; // Reduced from 2000 for better performance
    const starField = new THREE.Group();
    
    // Create stars with different sizes and brightness
    for (let i = 0; i < starCount; i++) {
        // Random position on a sphere much larger than the scene
        const radius = 40 + Math.random() * 40; // Between 40-80 units (closer for better visibility)
        const theta = Math.random() * Math.PI * 2; // 0-2π
        const phi = Math.acos(2 * Math.random() - 1); // 0-π
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        // Determine star size and brightness
        const size = 0.015 + Math.random() * 0.045; // Slightly larger (0.015-0.06 units)
        const brightness = 0.4 + Math.random() * 0.6; // Brighter (0.4-1.0)
        
        // Create star geometry
        let starGeometry;
        const starType = Math.random();
        
        if (starType < 0.8) { // Increased from 0.7 for more simple points
            // Most stars are simple points
            starGeometry = new THREE.BufferGeometry();
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
        } else if (starType < 0.95) { // Increased from 0.9 for more spheres
            // Some stars are tiny spheres
            starGeometry = new THREE.SphereGeometry(size * 0.5, 4, 4);
        } else {
            // A few stars have a cross shape for a "twinkle" effect
            starGeometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                -size, 0, 0,  size, 0, 0,  // Horizontal line
                0, -size, 0,  0, size, 0   // Vertical line
            ]);
            starGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        }
        
        // Create star material with random color tint
        const colorTint = Math.random();
        let starColor;
        
        if (colorTint < 0.7) {
            // Most stars are white/blue-white
            starColor = new THREE.Color(
                0.9 + Math.random() * 0.1,
                0.9 + Math.random() * 0.1,
                1.0
            );
        } else if (colorTint < 0.8) {
            // Some stars are yellow
            starColor = new THREE.Color(
                1.0,
                0.9 + Math.random() * 0.1,
                0.7 + Math.random() * 0.2
            );
        } else if (colorTint < 0.9) {
            // A few stars are red
            starColor = new THREE.Color(
                1.0,
                0.7 + Math.random() * 0.2,
                0.7 + Math.random() * 0.2
            );
        } else {
            // Rare blue stars
            starColor = new THREE.Color(
                0.7 + Math.random() * 0.2,
                0.7 + Math.random() * 0.2,
                1.0
            );
        }
        
        const starMaterial = new THREE.PointsMaterial({
            color: starColor,
            size: size,
            transparent: true,
            opacity: brightness,
            sizeAttenuation: false
        });
        
        // Create star mesh or points
        let star;
        if (starType < 0.8) { // Increased from 0.7 to match above
            star = new THREE.Points(starGeometry, starMaterial);
        } else if (starType < 0.95) { // Increased from 0.9 to match above
            star = new THREE.Mesh(
                starGeometry,
                new THREE.MeshBasicMaterial({
                    color: starColor,
                    transparent: true,
                    opacity: brightness
                })
            );
        } else {
            star = new THREE.LineSegments(
                starGeometry,
                new THREE.LineBasicMaterial({
                    color: starColor,
                    transparent: true,
                    opacity: brightness
                })
            );
        }
        
        // Position the star
        star.position.set(x, y, z);
        
        // Add to star field
        starField.add(star);
    }
    
    // Add a few "special" bright stars with lens flare effect
    for (let i = 0; i < 20; i++) { // Increased from 15 for more bright stars
        const radius = 50 + Math.random() * 30; // Slightly further away
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() * 0.8 - 0.8); // More concentrated away from the moon
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        // Create a bright point
        const brightStarGeometry = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 8, 8); // Larger (0.06-0.12)
        const brightStarMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 1, 1),
            transparent: true,
            opacity: 0.95 // Increased from 0.9
        });
        
        const brightStar = new THREE.Mesh(brightStarGeometry, brightStarMaterial);
        brightStar.position.set(x, y, z);
        
        // Add a simple "flare" effect
        const flareSize = 0.25 + Math.random() * 0.35; // Larger (0.25-0.6)
        const flareGeometry = new THREE.BufferGeometry();
        const flareVertices = new Float32Array([
            -flareSize, 0, 0,  flareSize, 0, 0,
            0, -flareSize, 0,  0, flareSize, 0
        ]);
        flareGeometry.setAttribute('position', new THREE.BufferAttribute(flareVertices, 3));
        
        const flareMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(1, 1, 1),
            transparent: true,
            opacity: 0.4 + Math.random() * 0.2 // Increased from 0.3-0.5 to 0.4-0.6
        });
        
        const flare = new THREE.LineSegments(flareGeometry, flareMaterial);
        brightStar.add(flare);
        
        // Add to star field
        starField.add(brightStar);
        
        // Store reference for animation
        brightStar.userData.flare = flare;
        brightStar.userData.rotationSpeed = 0.1 + Math.random() * 0.4;
        brightStar.userData.pulseSpeed = 0.5 + Math.random() * 1.0;
        brightStar.userData.pulsePhase = Math.random() * Math.PI * 2;
    }
    
    // Optional: Add a subtle nebula effect in the background
    const nebulaCount = 5;
    for (let i = 0; i < nebulaCount; i++) {
        // Create a large, very transparent colored plane
        const nebulaSize = 15 + Math.random() * 20;
        const nebulaGeometry = new THREE.PlaneGeometry(nebulaSize, nebulaSize);
        
        // Choose a subtle color
        let nebulaColor;
        const nebulaType = Math.random();
        if (nebulaType < 0.33) {
            // Blue nebula
            nebulaColor = new THREE.Color(0.1, 0.1, 0.3);
        } else if (nebulaType < 0.66) {
            // Red nebula
            nebulaColor = new THREE.Color(0.3, 0.1, 0.1);
        } else {
            // Green nebula
            nebulaColor = new THREE.Color(0.1, 0.3, 0.1);
        }
        
        const nebulaMaterial = new THREE.MeshBasicMaterial({
            color: nebulaColor,
            transparent: true,
            opacity: 0.03 + Math.random() * 0.03, // Very subtle (0.03-0.06)
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        
        // Position far away in a random direction
        const nebulaRadius = 70 + Math.random() * 20;
        const nebulaTheta = Math.random() * Math.PI * 2;
        const nebulaPhi = Math.acos(2 * Math.random() - 1);
        
        const nx = nebulaRadius * Math.sin(nebulaPhi) * Math.cos(nebulaTheta);
        const ny = nebulaRadius * Math.sin(nebulaPhi) * Math.sin(nebulaTheta);
        const nz = nebulaRadius * Math.cos(nebulaPhi);
        
        nebula.position.set(nx, ny, nz);
        
        // Orient to face the center
        nebula.lookAt(0, 0, 0);
        
        // Add to star field
        starField.add(nebula);
        
        // Store for animation
        nebula.userData.rotationAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        nebula.userData.rotationSpeed = 0.02 + Math.random() * 0.03;
    }
    
    return starField;
}

// Create starfield and add to scene
const starField = createStarfield();
scene.add(starField);

// Add starfield control state
const starfieldControls = {
    rotating: true // Whether the starfield rotates
};

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false  // Changed to false since we're using scene.background
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Remove shadow mapping from renderer
renderer.shadowMap.enabled = false;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // No longer needed

// Moon setup (1km diameter = 0.5 units radius)
const moonRadius = 0.5;
const moonGeometry = new THREE.IcosahedronGeometry(moonRadius, 14);

// Use Simplex noise (v4.0.1 API with createNoise3D)
const { createNoise3D } = SimplexNoise;
const noise3D = createNoise3D();

// Generate random feature centers for mountains and craters
function generateFeatureCenters(count, minDist) {
    const centers = [];
    const attempts = count * 100; // Maximum attempts to place features
    
    for (let i = 0; i < attempts && centers.length < count; i++) {
        // Generate random point on sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const center = new THREE.Vector3(
            Math.sin(theta) * Math.cos(phi),
            Math.sin(theta) * Math.sin(phi),
            Math.cos(theta)
        );
        
        // Check minimum distance from other centers
        let tooClose = false;
        for (const existing of centers) {
            if (center.distanceTo(existing.position) < minDist) {
                tooClose = true;
                break;
            }
        }
        
        if (!tooClose) {
            centers.push({
                position: center,
                radius: minDist * (0.5 + Math.random() * 0.5), // Random size
                height: 0.02 + Math.random() * 0.08 // Heights between 20m and 100m
            });
        }
    }
    return centers;
}

// RBF function for smooth feature falloff
function rbf(distance, radius) {
    if (distance >= radius) return 0;
    const x = distance / radius;
    return Math.pow(1 - x * x, 2); // Smooth falloff function
}

// Generate feature centers
const mountainCenters = generateFeatureCenters(20, 0.4); // 20 mountain ranges
const craterCenters = generateFeatureCenters(30, 0.2);   // 30 craters

// Add terrain using RBF method
const vertices = moonGeometry.attributes.position.array;
for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new THREE.Vector3(
        vertices[i],
        vertices[i + 1],
        vertices[i + 2]
    ).normalize();

    // Calculate mountain heights
    let mountainHeight = 0;
    for (const mountain of mountainCenters) {
        const distance = vertex.distanceTo(mountain.position);
        mountainHeight += mountain.height * rbf(distance, mountain.radius);
    }

    // Calculate crater depths
    let craterDepth = 0;
    for (const crater of craterCenters) {
        const distance = vertex.distanceTo(crater.position);
        const craterInfluence = rbf(distance, crater.radius);
        
        // Create crater rim
        const rimDistance = distance - crater.radius * 0.7;
        const rimHeight = 0.02 * Math.exp(-rimDistance * rimDistance * 50);
        
        // Combine crater depression with rim
        craterDepth += craterInfluence * -0.03 + rimHeight;
    }

    // Add high-frequency detail noise
    const detailScale = 8.0;
    let detail = 0;
    let amplitude = 0.005;
    for (let octave = 0; octave < 3; octave++) {
        detail += amplitude * noise3D(
            vertex.x * detailScale * (1 << octave),
            vertex.y * detailScale * (1 << octave),
            vertex.z * detailScale * (1 << octave)
        );
        amplitude *= 0.5;
    }

    // Combine all height influences
    const totalHeight = mountainHeight + craterDepth + detail;
    
    // Displace vertex radially
    vertices[i] += vertex.x * totalHeight;
    vertices[i + 1] += vertex.y * totalHeight;
    vertices[i + 2] += vertex.z * totalHeight;
}
moonGeometry.computeVertexNormals();

// Create a more uniform wireframe using segments
const wireframeGeometry = new THREE.WireframeGeometry(moonGeometry);
const wireframeMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.35,
    linewidth: 1,
});
const moonWireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

// Make the surface material lighter and adjust for sunlight
const surfaceMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x1a1a1a,  // Lighter gray
    shininess: 2,     // Slight shine for rocky surface
    flatShading: true // Keep flat shading for retro look
});

// Create moon meshes and group
const moonSurface = new THREE.Mesh(moonGeometry, surfaceMaterial);
const moon = new THREE.Group();
moon.add(moonSurface);
moon.add(moonWireframe);

// Set up sun-like lighting
const ambientLight = new THREE.AmbientLight(0x080808); // Very dim ambient light
scene.add(ambientLight);

// Create a group for moon and its lighting
const moonGroup = new THREE.Group();
scene.add(moonGroup);

// Create distant sun-like light
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2); // Bright white light
sunLight.position.set(50, 30, 20); // Position far away at an angle
sunLight.castShadow = false;
// Remove all shadow camera settings
// sunLight.shadow.mapSize.width = 4096;
// sunLight.shadow.mapSize.height = 4096;
// sunLight.shadow.camera.near = 0.001;
// sunLight.shadow.camera.far = 5;
// sunLight.shadow.camera.left = -0.5;
// sunLight.shadow.camera.right = 0.5;
// sunLight.shadow.camera.top = 0.5;
// sunLight.shadow.camera.bottom = -0.5;
// sunLight.shadow.bias = -0.0001;
// sunLight.shadow.normalBias = 0.02;
moonGroup.add(sunLight);

// Add moon to the moon group instead of scene
moonGroup.add(moon);

// Lander setup
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
const minCameraAngle = Math.PI / 12; // Minimum angle (15 degrees)
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

// Revert to the earlier shadow implementation
function createLanderShadow() {
    // Create a simple circle for the shadow - match lander diameter (10m)
    const shadowGeometry = new THREE.CircleGeometry(0.005, 20); // 5m radius = 10m diameter
    const shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0x888888, // Medium grey shadow
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false // Disable depth test to ensure shadow is always visible
    });
    
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    
    // Add to moon group so it moves with the moon
    moonGroup.add(shadow);
    
    return shadow;
}

// Revert to the earlier updateShadow function
function updateShadow() {
    // Project shadow onto the moon surface
    const directionFromCenter = lander.position.clone().normalize();
    
    // Use the same surface height calculation for shadow positioning
    let shadowSurfaceRadius = moonRadius;
    
    // Sample a few points around the direction
    const shadowSamplePoints = [
        directionFromCenter.clone(),
        directionFromCenter.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.01),
        directionFromCenter.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.01),
        directionFromCenter.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.01)
    ];
    
    // Find the highest point on the surface in this area
    for (const point of shadowSamplePoints) {
        // Calculate surface height at this point
        let mountainHeight = 0;
        for (const mountain of mountainCenters) {
            const distance = point.distanceTo(mountain.position);
            mountainHeight += mountain.height * rbf(distance, mountain.radius);
        }
        
        let craterDepth = 0;
        for (const crater of craterCenters) {
            const distance = point.distanceTo(crater.position);
            const craterInfluence = rbf(distance, crater.radius);
            
            // Create crater rim
            const rimDistance = distance - crater.radius * 0.7;
            const rimHeight = 0.02 * Math.exp(-rimDistance * rimDistance * 50);
            
            // Combine crater depression with rim
            craterDepth += craterInfluence * -0.03 + rimHeight;
        }
        
        // Add simplified detail noise
        const detailScale = 8.0;
        let detail = 0;
        let amplitude = 0.005;
        detail += amplitude * noise3D(
            point.x * detailScale,
            point.y * detailScale,
            point.z * detailScale
        );
        
        // Calculate total radius at this point
        const totalHeight = mountainHeight + craterDepth + detail;
        const pointRadius = moonRadius + totalHeight;
        
        // Keep the maximum radius
        shadowSurfaceRadius = Math.max(shadowSurfaceRadius, pointRadius);
    }
    
    const surfacePoint = directionFromCenter.clone().multiplyScalar(shadowSurfaceRadius);
    
    landerShadow.position.copy(surfacePoint);
    landerShadow.lookAt(surfacePoint.clone().add(directionFromCenter));
    
    const distance = lander.position.distanceTo(surfacePoint);
    
    // Adjust shadow size based on distance
    const sizeScale = Math.max(0.5, 1 - distance / 0.2);
    landerShadow.scale.set(sizeScale, sizeScale, 1);
    
    // Adjust shadow opacity based on distance
    const opacityScale = Math.max(0.1, 0.5 - distance / 0.2);
    landerShadow.material.opacity = 0.8 * opacityScale;
    
    // Make shadow visible only when close to surface
    landerShadow.visible = distance < 0.2;
    
    // Ensure shadow is slightly above the surface to prevent z-fighting
    landerShadow.position.addScaledVector(directionFromCenter, 0.0001);
}

// Create a simpler shadow that follows the lander's position projected onto the moon
const landerShadow = createLanderShadow();

// Make the moon receive shadows
moonSurface.receiveShadow = true;

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
function createMinimap() {
    // Create container for minimap
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '180px'; // Position below gravity control
    container.style.right = '20px';
    container.style.width = '150px';
    container.style.height = '150px';
    container.style.backgroundColor = 'rgba(0,0,0,0.5)';
    container.style.borderRadius = '5px';
    container.style.overflow = 'hidden';
    container.style.border = '1px solid #444';
    
    // Create label
    const label = document.createElement('div');
    label.textContent = 'Minimap';
    label.style.position = 'absolute';
    label.style.top = '5px';
    label.style.left = '5px';
    label.style.color = 'white';
    label.style.fontFamily = 'monospace';
    label.style.fontSize = '12px';
    label.style.zIndex = '1';
    label.style.textShadow = '1px 1px 1px black';
    container.appendChild(label);
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'X';
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = '5px';
    toggleButton.style.right = '5px';
    toggleButton.style.width = '20px';
    toggleButton.style.height = '20px';
    toggleButton.style.padding = '0';
    toggleButton.style.backgroundColor = '#444';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.zIndex = '1';
    toggleButton.style.fontSize = '12px';
    toggleButton.style.fontFamily = 'monospace';
    container.appendChild(toggleButton);
    
    // Create renderer for minimap
    const minimapRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    minimapRenderer.setSize(150, 150);
    minimapRenderer.setClearColor(0x000000, 0.3);
    container.appendChild(minimapRenderer.domElement);
    
    // Create camera for minimap (fixed overhead view)
    const minimapCamera = new THREE.PerspectiveCamera(
        60, // Field of view
        1,  // Aspect ratio (square)
        0.001, // Near clipping plane
        10    // Far clipping plane
    );
    
    // Position camera above north pole
    minimapCamera.position.set(0, 1.5, 0);
    minimapCamera.lookAt(0, 0, 0);
    
    // Create a separate scene for the minimap
    const minimapScene = new THREE.Scene();
    
    // Create a simplified moon for the minimap
    const minimapMoonGeometry = new THREE.SphereGeometry(moonRadius, 16, 16);
    const minimapMoonWireframe = new THREE.WireframeGeometry(minimapMoonGeometry);
    const minimapMoonMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5
    });
    const minimapMoon = new THREE.LineSegments(minimapMoonWireframe, minimapMoonMaterial);
    minimapScene.add(minimapMoon);
    
    // Add simplified terrain features to the minimap
    const minimapFeatures = new THREE.Group();
    minimapScene.add(minimapFeatures);
    
    // Add mountains as small cones
    mountainCenters.forEach(mountain => {
        const mountainGeometry = new THREE.ConeGeometry(
            mountain.radius * 0.3, // Base radius
            mountain.height * 2,   // Height (exaggerated for visibility)
            4                      // Low poly for retro look
        );
        const mountainMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aa00,
            wireframe: true
        });
        const mountainMesh = new THREE.Mesh(mountainGeometry, mountainMaterial);
        
        // Position at the mountain center, on the moon surface
        const pos = mountain.position.clone().normalize().multiplyScalar(moonRadius);
        mountainMesh.position.copy(pos);
        
        // Orient to point away from center
        mountainMesh.lookAt(pos.clone().add(mountain.position));
        
        minimapFeatures.add(mountainMesh);
    });
    
    // Add craters as rings
    craterCenters.forEach(crater => {
        const craterGeometry = new THREE.RingGeometry(
            crater.radius * 0.5,  // Inner radius
            crater.radius * 0.8,  // Outer radius
            8                     // Segments
        );
        const craterMaterial = new THREE.MeshBasicMaterial({
            color: 0x008800,
            wireframe: true,
            side: THREE.DoubleSide
        });
        const craterMesh = new THREE.Mesh(craterGeometry, craterMaterial);
        
        // Position at the crater center, on the moon surface
        const pos = crater.position.clone().normalize().multiplyScalar(moonRadius);
        craterMesh.position.copy(pos);
        
        // Orient to face the camera
        craterMesh.lookAt(pos.clone().add(crater.position));
        
        minimapFeatures.add(craterMesh);
    });
    
    // Create a group for the lander marker
    const landerMarkerGroup = new THREE.Group();
    minimapScene.add(landerMarkerGroup);
    
    // Create a more visible marker for the lander (crosshair style)
    const landerMarkerMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000,
        transparent: false,
        opacity: 1.0,
        linewidth: 2
    });
    
    // Create crosshair geometry
    const crosshairSize = 0.02;
    const crosshairGeometry = new THREE.BufferGeometry();
    const crosshairVertices = new Float32Array([
        -crosshairSize, 0, 0,  crosshairSize, 0, 0,  // Horizontal line
        0, -crosshairSize, 0,  0, crosshairSize, 0,  // Vertical line
        0, 0, -crosshairSize,  0, 0, crosshairSize   // Depth line
    ]);
    crosshairGeometry.setAttribute('position', new THREE.BufferAttribute(crosshairVertices, 3));
    const landerCrosshair = new THREE.LineSegments(crosshairGeometry, landerMarkerMaterial);
    landerMarkerGroup.add(landerCrosshair);
    
    // Add a small sphere at the center of the crosshair
    const landerDotGeometry = new THREE.SphereGeometry(0.005, 8, 8);
    const landerDotMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: false,
        opacity: 1.0
    });
    const landerDot = new THREE.Mesh(landerDotGeometry, landerDotMaterial);
    landerMarkerGroup.add(landerDot);
    
    // Add a direction indicator to show which way the lander is facing
    const directionIndicatorGeometry = new THREE.ConeGeometry(0.008, 0.02, 4);
    const directionIndicatorMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.8
    });
    const directionIndicator = new THREE.Mesh(directionIndicatorGeometry, directionIndicatorMaterial);
    directionIndicator.position.set(0, 0, 0.015); // Position in front of the lander
    directionIndicator.rotation.x = Math.PI / 2; // Point forward
    landerMarkerGroup.add(directionIndicator);
    
    // Add a north indicator
    const northIndicatorGeometry = new THREE.ConeGeometry(0.02, 0.04, 4);
    const northIndicatorMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    const northIndicator = new THREE.Mesh(northIndicatorGeometry, northIndicatorMaterial);
    northIndicator.position.set(0, moonRadius + 0.05, 0);
    northIndicator.rotation.x = Math.PI;
    minimapScene.add(northIndicator);
    
    // Add a "N" label for north using lines
    const nGeometry = new THREE.BufferGeometry();
    const nVertices = new Float32Array([
        -0.01, moonRadius + 0.1, 0,    -0.01, moonRadius + 0.07, 0,  // Left vertical
        -0.01, moonRadius + 0.1, 0,    0.01, moonRadius + 0.07, 0,   // Diagonal
        0.01, moonRadius + 0.1, 0,     0.01, moonRadius + 0.07, 0    // Right vertical
    ]);
    nGeometry.setAttribute('position', new THREE.BufferAttribute(nVertices, 3));
    const northLabel = new THREE.LineSegments(nGeometry, new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    }));
    minimapScene.add(northLabel);
    
    // Add a grid to represent equator
    const gridHelper = new THREE.GridHelper(moonRadius * 2, 4, 0x00ffff, 0x004444);
    gridHelper.rotation.x = Math.PI / 2;
    minimapScene.add(gridHelper);
    
    // Add toggle functionality
    let minimapVisible = true;
    
    // Function to toggle minimap visibility
    function toggleMinimap() {
        minimapVisible = !minimapVisible;
        container.style.display = minimapVisible ? 'block' : 'none';
        toggleButton.textContent = minimapVisible ? 'X' : 'O';
    }
    
    // Add click event to toggle button
    toggleButton.addEventListener('click', toggleMinimap);
    
    // Add keyboard shortcut 'M' to toggle minimap
    window.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            toggleMinimap();
        }
    });
    
    document.body.appendChild(container);
    
    return {
        container,
        renderer: minimapRenderer,
        camera: minimapCamera,
        scene: minimapScene,
        landerMarkerGroup,
        visible: () => minimapVisible,
        toggle: toggleMinimap
    };
}

// Create minimap
const minimap = createMinimap();

// Add function to update minimap
function updateMinimap() {
    // Skip if minimap is not visible
    if (!minimap.visible()) return;
    
    // Get lander position relative to moon center
    const landerPos = lander.position.clone();
    
    // Update lander marker position
    minimap.landerMarkerGroup.position.copy(landerPos);
    
    // Get lander's up direction (which points away from the moon center)
    const landerUp = lander.position.clone().normalize();
    
    // Get lander's forward direction (we'll use the lander's local -Z axis)
    const landerForward = new THREE.Vector3(0, 0, -1);
    landerForward.applyQuaternion(lander.quaternion);
    
    // Project forward direction onto the tangent plane at the lander's position
    // This gives us the forward direction in the minimap's coordinate system
    const projectedForward = landerForward.clone();
    projectedForward.sub(landerUp.clone().multiplyScalar(projectedForward.dot(landerUp)));
    projectedForward.normalize();
    
    // Calculate the rotation to align the marker with the lander's orientation
    // We need to rotate around the landerUp vector to align with projectedForward
    if (projectedForward.lengthSq() > 0.001) { // Only if we have a meaningful direction
        const defaultForward = new THREE.Vector3(0, 0, 1);
        defaultForward.sub(landerUp.clone().multiplyScalar(defaultForward.dot(landerUp)));
        defaultForward.normalize();
        
        // Calculate rotation angle around up vector
        let angle = Math.atan2(
            projectedForward.x * defaultForward.z - projectedForward.z * defaultForward.x,
            projectedForward.x * defaultForward.x + projectedForward.z * defaultForward.z
        );
        
        // Create quaternion for rotation around up vector
        const rotationQuat = new THREE.Quaternion().setFromAxisAngle(landerUp, angle);
        
        // Apply rotation to align marker with lander orientation
        minimap.landerMarkerGroup.quaternion.copy(rotationQuat);
    }
    
    // Render minimap
    minimap.renderer.render(minimap.scene, minimap.camera);
}

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
    
    // Check for collision with moon surface
    const distanceToCenter = lander.position.length();
    
    // Improved collision detection - get actual surface height at this point
    const landerDirection = lander.position.clone().normalize();
    
    // Sample a few points around the direction to get a more accurate surface height
    const landerSamplePoints = [
        landerDirection.clone(),
        landerDirection.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.01),
        landerDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.01),
        landerDirection.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.01)
    ];
    
    // Find the highest point (most outward) on the surface in this area
    let landerSurfaceRadius = moonRadius;
    for (const point of landerSamplePoints) {
        // Project onto moon surface - simplified approximation
        const projectedPoint = point.clone().multiplyScalar(moonRadius);
        
        // Apply the same height modifications as in the moon geometry creation
        let mountainHeight = 0;
        for (const mountain of mountainCenters) {
            const distance = point.distanceTo(mountain.position);
            mountainHeight += mountain.height * rbf(distance, mountain.radius);
        }
        
        let craterDepth = 0;
        for (const crater of craterCenters) {
            const distance = point.distanceTo(crater.position);
            const craterInfluence = rbf(distance, crater.radius);
            
            // Create crater rim
            const rimDistance = distance - crater.radius * 0.7;
            const rimHeight = 0.02 * Math.exp(-rimDistance * rimDistance * 50);
            
            // Combine crater depression with rim
            craterDepth += craterInfluence * -0.03 + rimHeight;
        }
        
        // Add high-frequency detail noise (simplified for performance)
        const detailScale = 8.0;
        let detail = 0;
        let amplitude = 0.005;
        detail += amplitude * noise3D(
            point.x * detailScale,
            point.y * detailScale,
            point.z * detailScale
        );
        
        // Calculate total radius at this point
        const totalHeight = mountainHeight + craterDepth + detail;
        const pointRadius = moonRadius + totalHeight;
        
        // Keep the maximum radius
        landerSurfaceRadius = Math.max(landerSurfaceRadius, pointRadius);
    }
    
    // Store the surface radius in gameState for use in updateUI
    gameState.surfaceRadius = landerSurfaceRadius;
    
    const distanceToSurface = distanceToCenter - landerSurfaceRadius;
    
    if (distanceToSurface <= 0.005) { // Lander radius is about 5m
        // Get surface normal at collision point
        const surfaceNormal = lander.position.clone().normalize();
        
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
    updateShadow();
    
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

// Create retro-style particles with wireframe polyhedrons
function createSpriteParticles() {
    // Create a group to hold all particles
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);
    
    // Create a larger pool of 3D particles
    const particleCount = 100; // Reduced count since 3D objects are more expensive
    const particles = [];
    
    // Create wireframe materials
    const exhaustMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00, // Green to match moon wireframe
        transparent: true,
        opacity: 0.8
    });
    
    const dustMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00, // Green to match moon wireframe
        transparent: true,
        opacity: 0.5
    });
    
    // Create dodecahedron geometry for exhaust particles
    const exhaustGeometry = new THREE.DodecahedronGeometry(1, 0); // Base size 1, detail 0 for low poly
    const exhaustEdges = new THREE.EdgesGeometry(exhaustGeometry);
    
    // Create smaller dodecahedron for dust particles
    const dustGeometry = new THREE.DodecahedronGeometry(0.7, 0); // Smaller size, detail 0
    const dustEdges = new THREE.EdgesGeometry(dustGeometry);
    
    // Create particle pool
    for (let i = 0; i < particleCount; i++) {
        // Create wireframe mesh for exhaust
        const exhaustParticle = new THREE.LineSegments(exhaustEdges, exhaustMaterial.clone());
        exhaustParticle.scale.set(0.003, 0.003, 0.003); // Small scale for game world
        exhaustParticle.visible = false;
        
        // Create wireframe mesh for dust
        const dustParticle = new THREE.LineSegments(dustEdges, dustMaterial.clone());
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
        particleGroup.add(exhaustParticle);
        particleGroup.add(dustParticle);
        particles.push(particle);
    }
    
    // Track emission timing for consistent rate
    let lastEmissionTime = 0;
    const emissionRate = 20; // Reduced rate for 3D objects
    
    // Create a dust shower at the impact point
    function createDustShower(position, normal) {
        // Number of dust particles to create
        const dustCount = 10; // Reduced count
        let created = 0;
        
        // Find inactive particles to use as dust
        for (let i = 0; i < particles.length && created < dustCount; i++) {
            const particle = particles[i];
            
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
                const speed = (0.01 + Math.random() * 0.02) * 0.5; // Changed from 0.25 to 0.5 (2x increase)
                particle.velocity.copy(randomDir).multiplyScalar(speed);
                
                // Add small upward component along normal (also increased)
                particle.velocity.addScaledVector(normal, 0.005); // Increased from 0.0025 (2x)
                
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
    
    return {
        group: particleGroup,
        particles: particles,
        update: function(dt) {
            // Emit particles at a consistent rate when thrusting
            if (landerState.engineOn && gameState.status === 'playing') {
                // Calculate how many particles to emit this frame
                lastEmissionTime += dt;
                const particlesToEmit = Math.floor(lastEmissionTime * emissionRate);
                
                if (particlesToEmit > 0) {
                    lastEmissionTime -= particlesToEmit / emissionRate;
                    
                    // Emit multiple particles per frame
                    let emitted = 0;
                    for (let i = 0; i < particles.length && emitted < particlesToEmit; i++) {
                        const particle = particles[i];
                        
                        if (!particle.active) {
                            // Get engine position in world space
                            const enginePos = new THREE.Vector3(0, -0.005, 0);
                            enginePos.applyMatrix4(lander.matrixWorld);
                            
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
                            engineDir.applyQuaternion(lander.quaternion);
                            
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
            
            // Update existing particles
            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i];
                
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
                    
                    particle.velocity.x += dirToCenter.x * MOON_GRAVITY * gameState.gravityLevel * dt * gravityMultiplier;
                    particle.velocity.y += dirToCenter.y * MOON_GRAVITY * gameState.gravityLevel * dt * gravityMultiplier;
                    particle.velocity.z += dirToCenter.z * MOON_GRAVITY * gameState.gravityLevel * dt * gravityMultiplier;
                    
                    // Slowly rotate the particle for more dynamic look
                    mesh.rotation.x += dt * (particle.isDust ? 0.2 : 1.0);
                    mesh.rotation.y += dt * (particle.isDust ? 0.3 : 1.5);
                    mesh.rotation.z += dt * (particle.isDust ? 0.1 : 0.8);
                    
                    // Check for collision with moon surface
                    const distToCenter = mesh.position.length();
                    
                    // Improved collision detection - get actual surface height at this point
                    const direction = mesh.position.clone().normalize();
                    
                    // Sample a few points around the direction to get a more accurate surface height
                    const samplePoints = [
                        direction.clone(),
                        direction.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.01),
                        direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.01),
                        direction.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.01)
                    ];
                    
                    // Find the highest point (most outward) on the surface in this area
                    let surfaceRadius = moonRadius;
                    for (const point of samplePoints) {
                        // Project onto moon surface - simplified approximation
                        const projectedPoint = point.clone().multiplyScalar(moonRadius);
                        const surfacePoint = new THREE.Vector3(
                            projectedPoint.x,
                            projectedPoint.y,
                            projectedPoint.z
                        );
                        
                        // Apply the same height modifications as in the moon geometry creation
                        let mountainHeight = 0;
                        for (const mountain of mountainCenters) {
                            const distance = point.distanceTo(mountain.position);
                            mountainHeight += mountain.height * rbf(distance, mountain.radius);
                        }
                        
                        let craterDepth = 0;
                        for (const crater of craterCenters) {
                            const distance = point.distanceTo(crater.position);
                            const craterInfluence = rbf(distance, crater.radius);
                            
                            // Create crater rim
                            const rimDistance = distance - crater.radius * 0.7;
                            const rimHeight = 0.02 * Math.exp(-rimDistance * rimDistance * 50);
                            
                            // Combine crater depression with rim
                            craterDepth += craterInfluence * -0.03 + rimHeight;
                        }
                        
                        // Add high-frequency detail noise (simplified for performance)
                        const detailScale = 8.0;
                        let detail = 0;
                        let amplitude = 0.005;
                        detail += amplitude * noise3D(
                            point.x * detailScale,
                            point.y * detailScale,
                            point.z * detailScale
                        );
                        
                        // Calculate total radius at this point
                        const totalHeight = mountainHeight + craterDepth + detail;
                        const pointRadius = moonRadius + totalHeight;
                        
                        // Keep the maximum radius
                        surfaceRadius = Math.max(surfaceRadius, pointRadius);
                    }
                    
                    // Check if particle is below the surface
                    if (distToCenter < surfaceRadius) {
                        // Get surface normal
                        const normal = mesh.position.clone().normalize();
                        
                        if (particle.isDust) {
                            // Dust particles settle on the surface
                            const surfacePos = normal.clone().multiplyScalar(surfaceRadius + 0.0005); // Just 0.5m above surface
                            mesh.position.copy(surfacePos);
                            
                            // Slow down dust particles even more when they hit the surface
                            particle.velocity.multiplyScalar(0.05); // 95% energy loss (increased from 90%)
                            
                            // Add a small random horizontal drift to simulate dust spreading
                            const tangent = new THREE.Vector3();
                            if (Math.abs(normal.y) < 0.99) {
                                tangent.set(normal.z, 0, -normal.x).normalize();
                            } else {
                                tangent.set(1, 0, 0);
                            }
                            const drift = 0.0005 * (Math.random() - 0.5); // Reduced drift
                            particle.velocity.addScaledVector(tangent, drift);
                            
                            // Age dust particles faster when they hit the surface
                            particle.lifetime += dt * 1.5;
                            
                            // Align with surface
                            mesh.lookAt(mesh.position.clone().add(normal));
                        } else {
                            // Exhaust particles create dust and disappear
                            const surfacePos = normal.clone().multiplyScalar(surfaceRadius + 0.001);
                            
                            // Create dust shower at impact point
                            const dustCreated = createDustShower(surfacePos, normal);
                            
                            // Deactivate the exhaust particle
                            particle.active = false;
                            mesh.visible = false;
                        }
                    } else {
                        // Normal aging
                        particle.lifetime += dt;
                    }
                    
                    // Update opacity based on lifetime
                    const maxLifetime = particle.isDust ? 2.0 : 1.0; // Longer lifetime for dust
                    const opacity = 1.0 - (particle.lifetime / maxLifetime);
                    mesh.material.opacity = Math.max(0, opacity);
                    
                    // Check max distance or lifetime
                    const distToLander = mesh.position.distanceTo(lander.position);
                    if (distToLander > 0.3 || particle.lifetime > maxLifetime) {
                        // Deactivate particle
                        particle.active = false;
                        mesh.visible = false;
                    }
                }
            }
        }
    };
}

// Replace the thrustParticles with our new sprite particles
const thrustParticles = createSpriteParticles();

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
        
        // Check if the predicted position is below the surface
        const distanceToCenter = simPosition.length();
        const direction = simPosition.clone().normalize();
        
        // Sample surface height at this position (simplified version)
        let surfaceRadius = moonRadius;
        
        // Calculate mountain heights
        for (const mountain of mountainCenters) {
            const distance = direction.distanceTo(mountain.position);
            surfaceRadius += mountain.height * rbf(distance, mountain.radius);
        }
        
        // Calculate crater depths
        for (const crater of craterCenters) {
            const distance = direction.distanceTo(crater.position);
            const craterInfluence = rbf(distance, crater.radius);
            
            // Create crater rim
            const rimDistance = distance - crater.radius * 0.7;
            const rimHeight = 0.02 * Math.exp(-rimDistance * rimDistance * 50);
            
            // Combine crater depression with rim
            surfaceRadius += craterInfluence * -0.03 + rimHeight;
        }
        
        // Add simplified detail noise
        const detailScale = 8.0;
        let detail = 0.005 * noise3D(
            direction.x * detailScale,
            direction.y * detailScale,
            direction.z * detailScale
        );
        surfaceRadius += detail;
        
        // If predicted position is below surface, hide this and all subsequent markers
        if (distanceToCenter <= surfaceRadius) {
            marker.visible = false;
            
            // Hide all remaining markers
            for (let j = i; j < trajectoryMarkers.length; j++) {
                trajectoryMarkers[j].visible = false;
            }
            
            break;
        }
        
        // Update marker position and make it visible
        marker.position.copy(simPosition);
        marker.visible = true;
        
        // Scale marker size based on distance from current position
        const distanceFromStart = marker.position.distanceTo(lander.position);
        const scaleFactor = Math.max(0.5, Math.min(1.5, 1 + distanceFromStart * 5));
        marker.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Color based on velocity (dark green = slow, light green = fast)
        const currentVelocity = simVelocity.length();
        const velocityRatio = Math.min(1.0, currentVelocity / maxVelocity);
        
        // Create color gradient from dark green to bright green
        const r = Math.floor(velocityRatio * 100); // Keep red low for green hue
        const g = Math.floor(100 + velocityRatio * 155); // 100 (dark green) to 255 (bright green)
        const b = Math.floor(velocityRatio * 100); // Keep blue low for green hue
        
        marker.material.color.setRGB(r/255, g/255, b/255);
        
        // Fade opacity based on prediction time
        const opacity = 1.0 - (i / trajectoryMarkers.length) * 0.7;
        marker.material.opacity = opacity;
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

// Add function to animate stars
function updateStarfield(dt) {
    // Slowly rotate the entire starfield for a subtle parallax effect
    if (starfieldControls.rotating) {
        starField.rotation.y += dt * 0.005; // Reduced from 0.01 for more subtle movement
    }
    
    // Animate the bright stars with flares
    starField.children.forEach(star => {
        if (star.userData.flare) {
            // Rotate the flare
            star.userData.flare.rotation.z += dt * star.userData.rotationSpeed;
            
            // Pulse the opacity
            const time = performance.now() * 0.001;
            const pulse = 0.5 + 0.5 * Math.sin(time * star.userData.pulseSpeed + star.userData.pulsePhase);
            star.userData.flare.material.opacity = 0.3 + pulse * 0.3; // Increased minimum from 0.2 to 0.3
        }
        
        // Rotate nebula planes
        if (star.geometry instanceof THREE.PlaneGeometry && starfieldControls.rotating) {
            star.rotateOnAxis(star.userData.rotationAxis, dt * star.userData.rotationSpeed);
        }
    });
}

// Update the animate function to include starfield animation
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    
    update(dt);
    
    // Update thrust particles
    thrustParticles.update(dt);
    
    // Update trajectory prediction if enabled
    if (showTrajectory) {
        updateTrajectoryPrediction();
    }
    
    // Update minimap
    updateMinimap();
    
    // Update starfield
    updateStarfield(dt);
    
    // Update camera position to follow lander
    updateCamera();
    
    // Update UI
    updateUI();
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Update pixel ratio on resize
    
    // Update minimap if it exists
    if (minimap && minimap.renderer) {
        // Keep the minimap size fixed, but we might need to update its position
        // if the UI layout changes with window size
        minimap.renderer.setPixelRatio(window.devicePixelRatio);
    }
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