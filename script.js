/**
 * SELECTING DOM ELEMENTS
 */
const searchBtn = document.getElementById("search-btn");
const countryInput = document.getElementById("country-input");
const resultDiv = document.getElementById("result");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const loadingTemplate = document.getElementById("loading-template");
const THEME_KEY = "country-app-theme";

/**
 * FEATURE: DARK/LIGHT MODE TOGGLE
 */
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const nextTheme = theme === "dark" ? "light" : "dark";
    themeIcon.textContent = theme === "dark" ? "🌙" : "☀️";
    themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute("title", `Switch to ${nextTheme} mode`);
}

function initTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
        applyTheme(storedTheme);
    } else {
        applyTheme("dark");
    }
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
});

function showLoading() {
    resultDiv.style.display = "block";
    resultDiv.innerHTML = loadingTemplate.innerHTML;
}

function showError(message) {
    resultDiv.style.display = "block";
    resultDiv.innerHTML = `<p class="error">${message}</p>`;
}

/**
 * MAIN FUNCTION: FETCH COUNTRY DATA
 */
async function getCountryData() {
    const countryName = countryInput.value.trim();

    // Check if input is empty
    if (countryName.length === 0) {
        showError("Please enter a country name.");
        return;
    }

    showLoading();

    // API URL for searching by name
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Country not found");
        }

        const data = await response.json();
        const country = data[0];
        const flag = country.flags?.svg || country.flags?.png || "";
        const name = country.name?.common || "Unknown";
        const capital = country.capital?.[0] || "N/A";
        const population = typeof country.population === "number"
            ? country.population.toLocaleString()
            : "N/A";
        const region = country.region || "N/A";
        const subRegion = country.subregion || "N/A";
        const languages = country.languages
            ? Object.values(country.languages).join(", ")
            : "N/A";
        const currencies = country.currencies
            ? Object.entries(country.currencies)
                .map(([code, info]) => `${info.name || "Unknown"} (${code})`)
                .join(", ")
            : "N/A";
        const timezones = Array.isArray(country.timezones) && country.timezones.length > 0
            ? country.timezones.slice(0, 3).join(", ")
            : "N/A";
        const [lat, lng] = country.latlng || [0, 0];

        // Dynamic body background image from the selected country flag.
        document.body.style.setProperty("--bg-image", flag ? `url("${flag}")` : "none");

        // Rotate 3D Globe
        if (typeof rotateGlobeTo === "function") {
            rotateGlobeTo(lat, lng);
        }

        resultDiv.style.display = "block";
        resultDiv.innerHTML = `
            <div class="flag-wrap">
                <img src="${flag}" alt="Flag of ${name}" class="flag">
            </div>
            <h2>${name}</h2>
            <div class="stats">
                <article class="stat">
                    <p class="label">Capital</p>
                    <p class="value">${capital}</p>
                </article>
                <article class="stat">
                    <p class="label">Population</p>
                    <p class="value">${population}</p>
                </article>
                <article class="stat">
                    <p class="label">Region</p>
                    <p class="value">${region}</p>
                </article>
                <article class="stat">
                    <p class="label">Sub Region</p>
                    <p class="value">${subRegion}</p>
                </article>
                <article class="stat">
                    <p class="label">Currency</p>
                    <p class="value">${currencies}</p>
                </article>
                <article class="stat">
                    <p class="label">Languages</p>
                    <p class="value">${languages}</p>
                </article>
                <article class="stat">
                    <p class="label">Timezones</p>
                    <p class="value">${timezones}</p>
                </article>
            </div>
        `;
    } catch (error) {
        showError(`Oops! ${error.message}. Try again.`);
    }
}

/**
 * EVENT LISTENERS
 */
searchBtn.addEventListener("click", getCountryData);

// Also trigger search when 'Enter' key is pressed
countryInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") getCountryData();
});

initTheme();

/**
 * 3D ANIMATIONS & LIVE GRAPHIC MOTIONS
 */
let globeMesh;
let scene, camera, renderer;
let targetGlobeRotation = { x: 0, y: 0 };
let currentGlobeRotation = { x: 0, y: 0.5 }; // starting rotation
const GLOBE_RADIUS = 5;

function init3D() {
    const canvas = document.getElementById("webgl-canvas");
    if (!canvas || !window.THREE) return;

    // SCENE
    scene = new THREE.Scene();
    // CAMERA
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    // RENDERER
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // GLOBE
    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

    // Create a cool techy material
    const material = new THREE.MeshBasicMaterial({
        color: 0x57d4ff,
        wireframe: true,
        transparent: true,
        opacity: 0.35
    });

    globeMesh = new THREE.Mesh(geometry, material);

    // Add an inner solid sphere to block stars behind the globe
    const innerGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 0.98, 32, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x070b20,
        transparent: true,
        opacity: 0.95
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    globeMesh.add(innerMesh);

    scene.add(globeMesh);

    // PARTICLES (Stars/Dust)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        // Expand particles across a wide area
        posArray[i] = (Math.random() - 0.5) * 50;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.08,
        color: 0x7d9bff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // RESIZE EVENT
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // RENDER LOOP
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Subtle idle particle floating
        particlesMesh.rotation.y = elapsedTime * 0.02;
        particlesMesh.rotation.x = elapsedTime * 0.01;

        // Auto-rotate globe slightly, combined with target rotation
        currentGlobeRotation.y += 0.001; // Idle spin

        globeMesh.rotation.x = currentGlobeRotation.x;
        globeMesh.rotation.y = currentGlobeRotation.y;

        // Parallax effect for cards via GSAP (Mouse movement logic handled below)

        renderer.render(scene, camera);
    }
    animate();
}

/**
 * Convert Latitude & Longitude to 3D Sphere Rotation
 */
function rotateGlobeTo(lat, lng) {
    if (!globeMesh || !window.gsap) return;

    // Convert lat/lng to radians
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    // The desired rotation sets the selected coord to face the camera (+Z)
    // We adjust the axes based on Three.js standard sphere mapping
    const targetX = phi - Math.PI / 2;
    const targetY = -theta + Math.PI / 2;

    // Use GSAP to smoothly animate currentGlobeRotation object
    gsap.to(currentGlobeRotation, {
        x: targetX,
        y: targetY,
        duration: 2.5,
        ease: "power3.inOut"
    });
}

/**
 * MOUSE PARALLAX & TILT (Live Graphic Motions)
 */
document.addEventListener("mousemove", (e) => {
    if (!window.gsap) return;

    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;

    // Tilt UI cards slightly based on mouse
    gsap.to(".glass-card", {
        rotationY: x * 10,
        rotationX: -y * 10,
        transformPerspective: 1000,
        transformOrigin: "center center",
        duration: 0.8,
        ease: "power2.out"
    });

    // Slight parallax for the 3D globe itself
    if (scene) {
        gsap.to(scene.rotation, {
            x: y * 0.2, // Subtle tilt
            y: x * 0.3,
            duration: 1.5,
            ease: "power2.out"
        });
    }
});

// Initialize 3D Graphics
init3D();