import * as THREE from 'three';

// Use the global SimplexNoise reference provided by index.html
const { createNoise3D } = window.SimplexNoise;

// Function to create the starfield
function createStarfield() {
    const starCount = 1500;
    const starField = new THREE.Group();

    for (let i = 0; i < starCount; i++) {
        const radius = 40 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        const size = 0.015 + Math.random() * 0.045;
        const brightness = 0.4 + Math.random() * 0.6;

        let starGeometry;
        const starType = Math.random();

        if (starType < 0.8) {
            starGeometry = new THREE.BufferGeometry();
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
        } else if (starType < 0.95) {
            starGeometry = new THREE.SphereGeometry(size * 0.5, 4, 4);
        } else {
            starGeometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                -size, 0, 0,  size, 0, 0,
                0, -size, 0,  0, size, 0
            ]);
            starGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        }

        const colorTint = Math.random();
        let starColor;

        if (colorTint < 0.7) {
            starColor = new THREE.Color(
                0.9 + Math.random() * 0.1,
                0.9 + Math.random() * 0.1,
                1.0
            );
        } else if (colorTint < 0.8) {
            starColor = new THREE.Color(
                1.0,
                0.9 + Math.random() * 0.1,
                0.7 + Math.random() * 0.2
            );
        } else if (colorTint < 0.9) {
            starColor = new THREE.Color(
                1.0,
                0.7 + Math.random() * 0.2,
                0.7 + Math.random() * 0.2
            );
        } else {
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

        let star;
        if (starType < 0.8) {
            star = new THREE.Points(starGeometry, starMaterial);
        } else if (starType < 0.95) {
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

        star.position.set(x, y, z);
        starField.add(star);
    }

    for (let i = 0; i < 20; i++) {
        const radius = 50 + Math.random() * 30;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() * 0.8 - 0.8);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        const brightStarGeometry = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 8, 8);
        const brightStarMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 1, 1),
            transparent: true,
            opacity: 0.95
        });

        const brightStar = new THREE.Mesh(brightStarGeometry, brightStarMaterial);
        brightStar.position.set(x, y, z);

        const flareSize = 0.25 + Math.random() * 0.35;
        const flareGeometry = new THREE.BufferGeometry();
        const flareVertices = new Float32Array([
            -flareSize, 0, 0,  flareSize, 0, 0,
            0, -flareSize, 0,  0, flareSize, 0
        ]);
        flareGeometry.setAttribute('position', new THREE.BufferAttribute(flareVertices, 3));

        const flareMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(1, 1, 1),
            transparent: true,
            opacity: 0.4 + Math.random() * 0.2
        });

        const flare = new THREE.LineSegments(flareGeometry, flareMaterial);
        brightStar.add(flare);
        starField.add(brightStar);

        brightStar.userData.flare = flare;
        brightStar.userData.rotationSpeed = 0.1 + Math.random() * 0.4;
        brightStar.userData.pulseSpeed = 0.5 + Math.random() * 1.0;
        brightStar.userData.pulsePhase = Math.random() * Math.PI * 2;
    }

    const nebulaCount = 5;
    for (let i = 0; i < nebulaCount; i++) {
        const nebulaSize = 15 + Math.random() * 20;
        const nebulaGeometry = new THREE.PlaneGeometry(nebulaSize, nebulaSize);

        let nebulaColor;
        const nebulaType = Math.random();
        if (nebulaType < 0.33) {
            nebulaColor = new THREE.Color(0.1, 0.1, 0.3);
        } else if (nebulaType < 0.66) {
            nebulaColor = new THREE.Color(0.3, 0.1, 0.1);
        } else {
            nebulaColor = new THREE.Color(0.1, 0.3, 0.1);
        }

        const nebulaMaterial = new THREE.MeshBasicMaterial({
            color: nebulaColor,
            transparent: true,
            opacity: 0.03 + Math.random() * 0.03,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);

        const nebulaRadius = 70 + Math.random() * 20;
        const nebulaTheta = Math.random() * Math.PI * 2;
        const nebulaPhi = Math.acos(2 * Math.random() - 1);

        const nx = nebulaRadius * Math.sin(nebulaPhi) * Math.cos(nebulaTheta);
        const ny = nebulaRadius * Math.sin(nebulaPhi) * Math.sin(nebulaTheta);
        const nz = nebulaRadius * Math.cos(nebulaPhi);

        nebula.position.set(nx, ny, nz);
        nebula.lookAt(0, 0, 0);
        starField.add(nebula);

        nebula.userData.rotationAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        nebula.userData.rotationSpeed = 0.02 + Math.random() * 0.03;
    }

    return starField;
}

// Function to generate feature centers
function generateFeatureCenters(count, minDist) {
    const centers = [];
    const attempts = count * 100;

    for (let i = 0; i < attempts && centers.length < count; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const center = new THREE.Vector3(
            Math.sin(theta) * Math.cos(phi),
            Math.sin(theta) * Math.sin(phi),
            Math.cos(theta)
        );

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
                radius: minDist * (0.5 + Math.random() * 0.5),
                height: 0.02 + Math.random() * 0.08
            });
        }
    }
    return centers;
}

// RBF function for smooth feature falloff
export function rbf(distance, radius) {
    if (distance >= radius) return 0;
    const x = distance / radius;
    return Math.pow(1 - x * x, 2);
}

// Function to create the moon
function createMoon() {
    const moonRadius = 0.5;
    const moonGeometry = new THREE.IcosahedronGeometry(moonRadius, 14);
    const noise3D = createNoise3D();

    const mountainCenters = generateFeatureCenters(20, 0.4);
    const craterCenters = generateFeatureCenters(30, 0.2);

    const vertices = moonGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const vertex = new THREE.Vector3(
            vertices[i],
            vertices[i + 1],
            vertices[i + 2]
        ).normalize();

        let mountainHeight = 0;
        for (const mountain of mountainCenters) {
            const distance = vertex.distanceTo(mountain.position);
            mountainHeight += mountain.height * rbf(distance, mountain.radius);
        }

        let craterDepth = 0;
        for (const crater of craterCenters) {
            const distance = vertex.distanceTo(crater.position);
            const craterInfluence = rbf(distance, crater.radius);
            const rimDistance = distance - crater.radius * 0.7;
            const rimHeight = 0.02 * Math.exp(-rimDistance * rimDistance * 50);
            craterDepth += craterInfluence * -0.03 + rimHeight;
        }

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

        const totalHeight = mountainHeight + craterDepth + detail;

        vertices[i] += vertex.x * totalHeight;
        vertices[i + 1] += vertex.y * totalHeight;
        vertices[i + 2] += vertex.z * totalHeight;
    }
    moonGeometry.computeVertexNormals();

    const wireframeGeometry = new THREE.WireframeGeometry(moonGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.35,
        linewidth: 1,
    });
    const moonWireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

    const surfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        shininess: 2,
        flatShading: true
    });

    const moonSurface = new THREE.Mesh(moonGeometry, surfaceMaterial);
    moonSurface.receiveShadow = true;
    const moon = new THREE.Group();
    moon.add(moonSurface);
    moon.add(moonWireframe);

    return { moon, mountainCenters, craterCenters, moonRadius };
}

// Function to create the sunlight
function createSunlight() {
    return new THREE.DirectionalLight(0xffffff, 1.2);
}

// Function to create the lander shadow
function createLanderShadow() {
    const shadowGeometry = new THREE.CircleGeometry(0.005, 20);
    const shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false
    });

    return new THREE.Mesh(shadowGeometry, shadowMaterial);
}

// Export the world creation functions
export function createWorld() {
    const starfield = createStarfield();
    const { moon, mountainCenters, craterCenters, moonRadius } = createMoon();
    const sunlight = createSunlight();
    const landerShadow = createLanderShadow();

    return {
        starfield,
        moon,
        sunlight,
        landerShadow,
        mountainCenters,
        craterCenters,
        moonRadius
    };
}

// Export the starfield control state
export const starfieldControls = {
    rotating: true
};

// Export update functions for starfield and shadow
export function updateStarfield(starField, dt) {
    if (starfieldControls.rotating) {
        starField.rotation.y += dt * 0.005;
    }

    starField.children.forEach(star => {
        if (star.userData.flare) {
            star.userData.flare.rotation.z += dt * star.userData.rotationSpeed;
            const time = performance.now() * 0.001;
            const pulse = 0.5 + 0.5 * Math.sin(time * star.userData.pulseSpeed + star.userData.pulsePhase);
            star.userData.flare.material.opacity = 0.3 + pulse * 0.3;
        }

        if (star.geometry instanceof THREE.PlaneGeometry && starfieldControls.rotating) {
            star.rotateOnAxis(star.userData.rotationAxis, dt * star.userData.rotationSpeed);
        }
    });
}

export function updateShadow(lander, landerShadow, moonRadius, noise3D, moonMesh) {
    const directionFromCenter = lander.position.clone().normalize();
    
    // Use raycasting to find the exact surface point
    const raycaster = new THREE.Raycaster();
    // Start ray from outside the moon pointing toward the surface
    const rayStart = directionFromCenter.clone().multiplyScalar(lander.position.length() + 0.1);
    raycaster.set(rayStart, directionFromCenter.clone().negate().normalize());
    
    // Cast ray against the moon mesh
    let surfacePoint;
    if (moonMesh) {
        const intersects = raycaster.intersectObject(moonMesh);
        if (intersects.length > 0) {
            // Use the intersection point for the shadow
            surfacePoint = intersects[0].point;
        } else {
            // Simple fallback if no intersection (shouldn't happen)
            surfacePoint = directionFromCenter.clone().multiplyScalar(moonRadius);
        }
    } else {
        // Simple fallback if moonMesh is not provided
        surfacePoint = directionFromCenter.clone().multiplyScalar(moonRadius);
    }

    landerShadow.position.copy(surfacePoint);
    landerShadow.lookAt(surfacePoint.clone().add(directionFromCenter));

    const distance = lander.position.distanceTo(surfacePoint);
    const sizeScale = Math.max(0.5, 1 - distance / 0.2);
    landerShadow.scale.set(sizeScale, sizeScale, 1);
    const opacityScale = Math.max(0.1, 0.5 - distance / 0.2);
    landerShadow.material.opacity = 0.8 * opacityScale;
    landerShadow.visible = distance < 0.2;
    landerShadow.position.addScaledVector(directionFromCenter, 0.0001);
}
