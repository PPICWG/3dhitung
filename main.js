// DOM Elements
const containerVolume = document.getElementById('containerVolume');
const containerInputs = document.getElementById('containerInputs');
const containerLength = document.getElementById('containerLength');
const containerWidth = document.getElementById('containerWidth');
const containerHeight = document.getElementById('containerHeight');
const boxLength = document.getElementById('boxLength');
const boxWidth = document.getElementById('boxWidth');
const boxHeight = document.getElementById('boxHeight');
const allowRotation = document.getElementById('allowRotation');
const enable3D = document.getElementById('enable3D');
const resultsContainer = document.getElementById('resultsContainer');
const visualizationContainer = document.getElementById('visualizationContainer');
const threejsContainer = document.getElementById('threejs-container');
const layerTabs = document.getElementById('layerTabs');
const layerSlider = document.getElementById('layerSlider');
const layerDisplay = document.getElementById('layerDisplay');
const showAllLayers = document.getElementById('showAllLayers');
const wireframeMode = document.getElementById('wireframeMode');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');

// State variables
let is3DModeActive = false;
let currentLayer = 1;
let totalLayers = 1;
let scene, camera, renderer, controls, boxes = [];
let layersData = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateContainerVolume();
    
    // Initialize Three.js if 3D mode is enabled by default
    if (enable3D.checked) {
        initThreeJS();
    }
});

// Toggle container dimension inputs
function toggleContainerPanel() {
    containerInputs.style.display = containerInputs.style.display === 'none' ? 'grid' : 'none';
    updateContainerVolume();
}

// Update container volume display
function updateContainerVolume() {
    const length = parseFloat(containerLength.value) || 0;
    const width = parseFloat(containerWidth.value) || 0;
    const height = parseFloat(containerHeight.value) || 0;
    
    const volume = (length * width * height) / 1000000; // Convert to m³
    containerVolume.textContent = volume.toFixed(2) + ' m³';
}

// Calculate optimal layout
function calculateOptimalLayout() {
    // Get container dimensions
    const container = {
        length: parseFloat(containerLength.value) || 0,
        width: parseFloat(containerWidth.value) || 0,
        height: parseFloat(containerHeight.value) || 0
    };
    
    // Get box dimensions
    const box = {
        length: parseFloat(boxLength.value) || 0,
        width: parseFloat(boxWidth.value) || 0,
        height: parseFloat(boxHeight.value) || 0
    };
    
    // Get selected layout pattern
    const layoutPattern = document.querySelector('input[name="layoutPattern"]:checked').value;
    
    // Check if rotation is allowed
    const rotationAllowed = allowRotation.checked;
    
    // Perform calculations (simplified for demo)
    const results = calculateBoxPlacement(container, box, layoutPattern, rotationAllowed);
    
    // Display results
    displayResults(results);
    
    // Generate layers data
    generateLayersData(results);
    
    // Update layer controls
    updateLayerControls();
    
    // Show visualization
    showVisualization(results);
    
    // Initialize 3D if enabled
    if (enable3D.checked && !is3DModeActive) {
        initThreeJS();
        is3DModeActive = true;
    }
    
    // Render 3D if enabled
    if (enable3D.checked && is3DModeActive) {
        render3DVisualization(results);
    }
}

// Core calculation function
function calculateBoxPlacement(container, box, pattern, rotationAllowed) {
    let boxes = [];
    let totalBoxes = 0;
    let efficiency = 0;
    
    // Calculate how many boxes fit in each dimension
    const lengthFit = Math.floor(container.length / box.length);
    const widthFit = Math.floor(container.width / box.width);
    const heightFit = Math.floor(container.height / box.height);
    
    // Basic calculation (simplified)
    totalBoxes = lengthFit * widthFit * heightFit;
    
    // Calculate efficiency
    const containerVolume = container.length * container.width * container.height;
    const boxesVolume = totalBoxes * box.length * box.width * box.height;
    efficiency = (boxesVolume / containerVolume) * 100;
    
    // Generate box positions (simplified for demo)
    for (let x = 0; x < lengthFit; x++) {
        for (let y = 0; y < widthFit; y++) {
            for (let z = 0; z < heightFit; z++) {
                boxes.push({
                    x: x * box.length,
                    y: y * box.width,
                    z: z * box.height,
                    length: box.length,
                    width: box.width,
                    height: box.height,
                    color: getRandomColor()
                });
            }
        }
    }
    
    return {
        totalBoxes,
        efficiency,
        boxes,
        container,
        box
    };
}

// Display results in the results panel
function displayResults(results) {
    resultsContainer.innerHTML = `
        <div class="result-card">
            <div class="result-icon">📦</div>
            <div class="result-value">${results.totalBoxes}</div>
            <div class="result-label">Total MC</div>
        </div>
        <div class="result-card">
            <div class="result-icon">📏</div>
            <div class="result-value">${results.efficiency.toFixed(1)}%</div>
            <div class="result-label">Efisiensi Ruang</div>
        </div>
        <div class="result-card">
            <div class="result-icon">📊</div>
            <div class="result-value">${Math.floor(results.container.length / results.box.length)}</div>
            <div class="result-label">MC per Baris (P)</div>
        </div>
        <div class="result-card">
            <div class="result-icon">📊</div>
            <div class="result-value">${Math.floor(results.container.width / results.box.width)}</div>
            <div class="result-label">MC per Kolom (L)</div>
        </div>
        <div class="result-card">
            <div class="result-icon">📊</div>
            <div class="result-value">${Math.floor(results.container.height / results.box.height)}</div>
            <div class="result-label">Tumpukan (T)</div>
        </div>
        
        <div class="result-details">
            <h3 class="details-header">Detail Konfigurasi</h3>
            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">Dimensi Kontainer:</span>
                    <span class="detail-value">${results.container.length} × ${results.container.width} × ${results.container.height} cm</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Dimensi MC:</span>
                    <span class="detail-value">${results.box.length} × ${results.box.width} × ${results.box.height} cm</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Volume Terpakai:</span>
                    <span class="detail-value">${(results.totalBoxes * results.box.length * results.box.width * results.box.height / 1000000).toFixed(2)} m³</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Sisa Ruang:</span>
                    <span class="detail-value">${(100 - results.efficiency).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    `;
}

// Generate layers data for 2D visualization
function generateLayersData(results) {
    layersData = [];
    const boxHeight = results.box.height;
    const containerHeight = results.container.height;
    totalLayers = Math.floor(containerHeight / boxHeight);
    
    for (let layer = 0; layer < totalLayers; layer++) {
        const layerBoxes = results.boxes.filter(box => 
            Math.floor(box.z / boxHeight) === layer
        );
        
        layersData.push({
            layer: layer + 1,
            boxes: layerBoxes,
            count: layerBoxes.length
        });
    }
}

// Update layer controls
function updateLayerControls() {
    // Update slider
    layerSlider.max = totalLayers;
    layerSlider.value = 1;
    layerDisplay.textContent = `1 / ${totalLayers}`;
    
    // Update tabs
    layerTabs.innerHTML = '';
    layersData.forEach((layer, index) => {
        const tab = document.createElement('div');
        tab.className = `layer-tab ${index === 0 ? 'active' : ''}`;
        tab.innerHTML = `
            <div class="layer-number">Sap ${layer.layer}</div>
            <div class="layer-count">${layer.count} MC</div>
        `;
        tab.addEventListener('click', () => {
            document.querySelectorAll('.layer-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            showSpecificLayer(layer.layer);
            layerSlider.value = layer.layer;
            layerDisplay.textContent = `${layer.layer} / ${totalLayers}`;
        });
        layerTabs.appendChild(tab);
    });
}

// Show specific layer visualization
function showSpecificLayer(layerNumber) {
    currentLayer = parseInt(layerNumber);
    const layerData = layersData.find(l => l.layer === currentLayer);
    
    if (layerData) {
        showLayerVisualization(layerData);
    }
}

// Toggle between showing all layers or single layer
function toggleLayerMode() {
    if (showAllLayers.checked) {
        // Show all layers
        showAllLayersVisualization();
    } else {
        // Show current layer
        showSpecificLayer(currentLayer);
    }
}

// Show 2D visualization of a specific layer
function showLayerVisualization(layerData) {
    const containerWidth = parseFloat(containerWidth.value);
    const containerLength = parseFloat(containerLength.value);
    
    visualizationContainer.innerHTML = `
        <div class="visualization-header">
            <h3>Sap ${layerData.layer} - ${layerData.count} MC</h3>
        </div>
        <div class="visualization-2d-container">
            <svg class="visualization-svg" viewBox="0 0 ${containerLength} ${containerWidth}">
                <!-- Container outline -->
                <rect x="0" y="0" width="${containerLength}" height="${containerWidth}" 
                      fill="none" stroke="#3a86ff" stroke-width="2" stroke-dasharray="5,5" />
                
                <!-- Boxes -->
                ${layerData.boxes.map(box => `
                    <rect x="${box.x}" y="${box.y}" width="${box.length}" height="${box.width}" 
                          fill="${box.color}" fill-opacity="0.7" stroke="#333" stroke-width="1" />
                `).join('')}
            </svg>
        </div>
        <div class="visualization-legend">
            <div class="legend-item">
                <div class="legend-color" style="background-color: #3a86ff;"></div>
                <div class="legend-label">Kontainer (${containerLength} × ${containerWidth} cm)</div>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${layerData.boxes[0]?.color || '#4cc9f0'};"></div>
                <div class="legend-label">MC (${layerData.boxes[0]?.length || 0} × ${layerData.boxes[0]?.width || 0} cm)</div>
            </div>
        </div>
    `;
}

// Show all layers visualization
function showAllLayersVisualization() {
    const containerWidth = parseFloat(containerWidth.value);
    const containerLength = parseFloat(containerLength.value);
    const containerHeight = parseFloat(containerHeight.value);
    
    visualizationContainer.innerHTML = `
        <div class="visualization-header">
            <h3>Semua Sap (Total ${totalLayers} Sap)</h3>
        </div>
        <div class="visualization-2d-container">
            <svg class="visualization-svg" viewBox="0 0 ${containerLength} ${containerHeight}">
                <!-- Container outline -->
                <rect x="0" y="0" width="${containerLength}" height="${containerHeight}" 
                      fill="none" stroke="#3a86ff" stroke-width="2" stroke-dasharray="5,5" />
                
                <!-- Boxes - stacked vertically -->
                ${layersData.map(layer => layer.boxes.map(box => `
                    <rect x="${box.x}" y="${box.z}" width="${box.length}" height="${box.height}" 
                          fill="${box.color}" fill-opacity="0.7" stroke="#333" stroke-width="1" />
                `).join('')).join('')}
            </svg>
        </div>
        <div class="visualization-legend">
            <div class="legend-item">
                <div class="legend-color" style="background-color: #3a86ff;"></div>
                <div class="legend-label">Kontainer (${containerLength} × ${containerHeight} cm)</div>
            </div>
            ${layersData.slice(0, 3).map((layer, i) => `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${layer.boxes[0]?.color || '#4cc9f0'};"></div>
                    <div class="legend-label">Sap ${layer.layer} (${layer.count} MC)</div>
                </div>
            `).join('')}
            ${totalLayers > 3 ? `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #888;"></div>
                    <div class="legend-label">+ ${totalLayers - 3} sap lainnya</div>
                </div>
            ` : ''}
        </div>
    `;
}

// Show visualization based on current mode
function showVisualization(results) {
    if (showAllLayers.checked) {
        showAllLayersVisualization();
    } else {
        showSpecificLayer(1);
    }
}

// Initialize Three.js for 3D visualization
function initThreeJS() {
    // Clear previous scene if exists
    if (scene) {
        threejsContainer.innerHTML = '';
        boxes = [];
    }
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, threejsContainer.clientWidth / threejsContainer.clientHeight, 0.1, 1000);
    camera.position.set(2, 2, 2);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
    threejsContainer.appendChild(renderer.domElement);
    
    // Add controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

// Render 3D visualization
function render3DVisualization(results) {
    // Clear previous boxes
    boxes.forEach(box => scene.remove(box));
    boxes = [];
    
    // Add container wireframe
    const containerGeometry = new THREE.BoxGeometry(
        results.container.length / 100,
        results.container.width / 100,
        results.container.height / 100
    );
    const containerEdges = new THREE.EdgesGeometry(containerGeometry);
    const container = new THREE.LineSegments(
        containerEdges,
        new THREE.LineBasicMaterial({ color: 0x3a86ff, linewidth: 2 })
    );
    scene.add(container);
    
    // Add boxes
    results.boxes.forEach(boxData => {
        const boxGeometry = new THREE.BoxGeometry(
            boxData.length / 100,
            boxData.width / 100,
            boxData.height / 100
        );
        const boxMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(boxData.color),
            transparent: true,
            opacity: parseFloat(opacitySlider.value),
            wireframe: wireframeMode.checked
        });
        const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        
        // Position the box (convert cm to meters)
        boxMesh.position.set(
            (boxData.x + boxData.length/2) / 100 - results.container.length/200,
            (boxData.y + boxData.width/2) / 100 - results.container.width/200,
            (boxData.z + boxData.height/2) / 100 - results.container.height/200
        );
        
        scene.add(boxMesh);
        boxes.push(boxMesh);
    });
    
    // Center camera on the container
    camera.lookAt(0, 0, 0);
    controls.update();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = threejsContainer.clientWidth / threejsContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
}

// Toggle 3D visualization
function toggle3DVisualization() {
    is3DModeActive = !is3DModeActive;
    
    if (is3DModeActive) {
        initThreeJS();
        const results = getCurrentResults(); // You would need to implement this
        if (results) render3DVisualization(results);
        threejsContainer.style.display = 'block';
        visualizationContainer.style.display = 'none';
    } else {
        threejsContainer.style.display = 'none';
        visualizationContainer.style.display = 'block';
    }
}

// Reset camera view
function resetCamera() {
    if (controls) {
        controls.reset();
        camera.position.set(2, 2, 2);
        camera.lookAt(0, 0, 0);
    }
}

// Toggle wireframe mode
function toggleWireframe() {
    boxes.forEach(box => {
        box.material.wireframe = wireframeMode.checked;
    });
}

// Update box opacity
function updateOpacity(value) {
    opacityValue.textContent = value;
    boxes.forEach(box => {
        box.material.opacity = parseFloat(value);
    });
}

// Helper function to get random color
function getRandomColor() {
    const colors = [
        '#4cc9f0', '#4895ef', '#4361ee', '#3f37c9', 
        '#f72585', '#b5179e', '#7209b7', '#560bad',
        '#3a0ca3', '#480ca8', '#3a86ff', '#8338ec'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Helper function to get current results (for demo purposes)
function getCurrentResults() {
    const container = {
        length: parseFloat(containerLength.value) || 1158,
        width: parseFloat(containerWidth.value) || 228,
        height: parseFloat(containerHeight.value) || 252
    };
    
    const box = {
        length: parseFloat(boxLength.value) || 60,
        width: parseFloat(boxWidth.value) || 40,
        height: parseFloat(boxHeight.value) || 30
    };
    
    return calculateBoxPlacement(
        container, 
        box, 
        document.querySelector('input[name="layoutPattern"]:checked').value,
        allowRotation.checked
    );
}
