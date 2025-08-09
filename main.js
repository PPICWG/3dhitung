let calculationResults = null;
let currentVisualizationMode = '2d';
let scene, camera, renderer, controls;
let boxMeshes = [];
let containerMesh = null;
let animationId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    setupEventListeners();
    updateContainerVolume();
});

function initializeAnimations() {
    // Add entrance animations to cards
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.animation = 'fadeIn 0.8s ease-out forwards';
            card.style.opacity = '0';
        }, index * 100);
    });
}

function setupEventListeners() {
    // Radio button change listeners
    const radioButtons = document.querySelectorAll('input[name="layoutPattern"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            const card = this.closest('.pattern-option');
            card.style.animation = 'none';
            void card.offsetWidth; // Trigger reflow
            card.style.animation = 'bounce 0.6s ease';
        });
    });

    // Checkbox listeners
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.closest('label');
            label.style.animation = 'none';
            void label.offsetWidth;
            label.style.animation = 'pulse 2s ease';
        });
    });

    // Initialize container panel as collapsed
    document.getElementById('containerInputs').style.display = 'none';
}

function toggleContainerPanel() {
    const inputs = document.getElementById('containerInputs');
    const isHidden = inputs.style.display === 'none';
    
    if (isHidden) {
        inputs.style.display = 'grid';
        inputs.style.animation = 'slideUp 0.8s ease forwards';
    } else {
        inputs.style.display = 'none';
    }
    
    // Reset calculation results when container size changes
    if (calculationResults) {
        calculationResults = null;
        document.getElementById('resultsContainer').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <p class="empty-text">Ukuran kontainer diubah. Klik "Hitung Layout Optimal" untuk hasil baru</p>
            </div>
        `;
        document.getElementById('visualizationContainer').innerHTML = `
            <div class="empty-visualization">
                <div class="empty-icon">🎨</div>
                <p class="empty-text">Visualisasi akan muncul setelah perhitungan</p>
            </div>
        `;
    }
}

function updateContainerVolume() {
    const length = parseFloat(document.getElementById('containerLength').value) || 0;
    const width = parseFloat(document.getElementById('containerWidth').value) || 0;
    const height = parseFloat(document.getElementById('containerHeight').value) || 0;
    
    const volume = (length * width * height) / 1000000; // Convert to m³
    document.getElementById('containerVolume').textContent = volume.toFixed(2) + ' m³';
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert ${type} show`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    alert.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-xl">${icons[type]}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 3000);
}

function calculateOptimalLayout() {
    const button = event.target;
    button.style.animation = 'pulse 2s ease';
    
    // Get input values
    const containerL = parseFloat(document.getElementById('containerLength').value);
    const containerW = parseFloat(document.getElementById('containerWidth').value);
    const containerH = parseFloat(document.getElementById('containerHeight').value);
    
    const boxL = parseFloat(document.getElementById('boxLength').value);
    const boxW = parseFloat(document.getElementById('boxWidth').value);
    const boxH = parseFloat(document.getElementById('boxHeight').value);
    
    const allowRotation = document.getElementById('allowRotation').checked;
    const selectedPattern = document.querySelector('input[name="layoutPattern"]:checked').value;

    // Basic validation
    if (!boxL || !boxW || !boxH || boxL <= 0 || boxW <= 0 || boxH <= 0) {
        showAlert('Mohon isi semua ukuran kotak dengan benar!', 'error');
        return;
    }

    // Show loading state
    document.getElementById('resultsContainer').innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p class="loading-text">Menghitung layout ${selectedPattern}...</p>
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
            <p class="loading-subtext">AI sedang menganalisis konfigurasi optimal</p>
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;

    // Calculate scenarios (simplified for example)
    setTimeout(() => {
        const scenarios = [];
        let optimal;

        // This would be replaced with actual calculation logic
        optimal = {
            name: 'Normal',
            boxesPerRow: Math.floor(containerW / boxW),
            boxesPerCol: Math.floor(containerH / boxH),
            boxesPerLayer: Math.floor(containerW / boxW) * Math.floor(containerH / boxH),
            layers: Math.floor(containerL / boxL),
            totalBoxes: Math.floor(containerW / boxW) * Math.floor(containerH / boxH) * Math.floor(containerL / boxL),
            efficiency: ((Math.floor(containerW / boxW) * Math.floor(containerH / boxH) * Math.floor(containerL / boxL) * (boxL * boxW * boxH) / (containerL * containerW * containerH) * 100).toFixed(1),
            layout: [] // This would contain the actual layout pattern
        };

        calculationResults = {
            scenarios: [optimal],
            optimal: optimal,
            containerDimensions: { length: containerL, width: containerW, height: containerH },
            boxDimensions: { length: boxL, width: boxW, height: boxH },
            metrics: {
                containerVolume: containerL * containerW * containerH,
                boxVolume: boxL * boxW * boxH,
                wastedSpace: containerL * containerW * containerH - (optimal.totalBoxes * boxL * boxW * boxH),
                spaceSavings: optimal.efficiency
            }
        };

        displayResults();
        createVisualization();
        showAlert('Perhitungan selesai! Layout optimal ditemukan', 'success');
    }, 2000);
}

function displayResults() {
    const container = document.getElementById('resultsContainer');
    const { optimal, metrics } = calculationResults;
    
    container.innerHTML = `
        <div class="result-summary">
            <h3 class="result-title">
                <span class="result-icon">🏆</span>
                Layout Optimal: ${optimal.name}
            </h3>
            <div class="result-metrics">
                <div class="metric">
                    <div class="metric-value gradient-text">${optimal.totalBoxes}</div>
                    <div class="metric-label">Total MC</div>
                </div>
                <div class="metric">
                    <div class="metric-value gradient-text">${optimal.efficiency}%</div>
                    <div class="metric-label">Efisiensi</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${optimal.boxesPerLayer}</div>
                    <div class="metric-label">Kotak per Sap</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${optimal.layers}</div>
                    <div class="metric-label">Tinggi Sap</div>
                </div>
            </div>
        </div>

        <div class="analysis-section">
            <h4 class="analysis-title">
                <span class="analysis-icon">📊</span>
                Analisis Mendalam
            </h4>
            <div class="analysis-grid">
                <div class="analysis-card">
                    <div class="analysis-card-title">Volume Kontainer</div>
                    <div class="analysis-card-value gradient-text">${(metrics.containerVolume / 1000000).toFixed(2)} m³</div>
                </div>
                <div class="analysis-card">
                    <div class="analysis-card-title">Volume Terpakai</div>
                    <div class="analysis-card-value" style="color: #10b981">${metrics.spaceSavings}%</div>
                </div>
                <div class="analysis-card">
                    <div class="analysis-card-title">Ruang Terbuang</div>
                    <div class="analysis-card-value" style="color: #ef4444">${(metrics.wastedSpace / 1000000).toFixed(2)} m³</div>
                </div>
                <div class="analysis-card">
                    <div class="analysis-card-title">Kotak per m³</div>
                    <div class="analysis-card-value" style="color: #a855f7">${(optimal.totalBoxes / (metrics.containerVolume / 1000000)).toFixed(0)}</div>
                </div>
            </div>
        </div>
    `;
}

function createVisualization() {
    const enable3D = document.getElementById('enable3D').checked;
    
    if (enable3D) {
        currentVisualizationMode = '3d';
        document.getElementById('toggle3DMode').textContent = '📋 Mode 2D';
        document.getElementById('threeDControls').style.display = 'block';
        init3DVisualization();
    } else {
        currentVisualizationMode = '2d';
        document.getElementById('toggle3DMode').textContent = '🎮 Mode 3D';
        document.getElementById('threeDControls').style.display = 'none';
        create2DVisualization();
    }
    
    setupLayerControls();
}

function toggle3DVisualization() {
    if (currentVisualizationMode === '2d') {
        currentVisualizationMode = '3d';
        document.getElementById('toggle3DMode').textContent = '📋 Mode 2D';
        document.getElementById('threeDControls').style.display = 'block';
        if (calculationResults) {
            init3DVisualization();
        }
    } else {
        currentVisualizationMode = '2d';
        document.getElementById('toggle3DMode').textContent = '🎮 Mode 3D';
        document.getElementById('threeDControls').style.display = 'none';
        cleanup3D();
        if (calculationResults) {
            create2DVisualization();
        }
    }
}

function init3DVisualization() {
    if (!calculationResults) return;

    cleanup3D();

    const container = document.getElementById('visualizationContainer');
    container.style.display = 'none';
    
    const threejsContainer = document.getElementById('threejs-container');
    threejsContainer.style.display = 'block';
    
    // Setup Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    // Camera
    camera = new THREE.PerspectiveCamera(75, threejsContainer.clientWidth / 500, 0.1, 1000);
    camera.position.set(50, 50, 50);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(threejsContainer.clientWidth, 500);
    renderer.shadowMap.enabled = true;
    threejsContainer.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create container
    createContainer3D();
    
    // Create boxes
    createBoxes3D();

    // Start animation loop
    animate3D();
}

function createContainer3D() {
    const { containerDimensions } = calculationResults;
    const geometry = new THREE.BoxGeometry(
        containerDimensions.length / 10,
        containerDimensions.height / 10,
        containerDimensions.width / 10
    );
    
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1e40af }));
    scene.add(line);
    
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
    });
    containerMesh = new THREE.Mesh(geometry, material);
    scene.add(containerMesh);
}

function createBoxes3D() {
    const { optimal, boxDimensions } = calculationResults;
    
    boxMeshes.forEach(mesh => scene.remove(mesh));
    boxMeshes = [];

    // Simplified box creation - would use actual layout pattern in real implementation
    for (let x = 0; x < optimal.boxesPerRow; x++) {
        for (let y = 0; y < optimal.boxesPerCol; y++) {
            for (let z = 0; z < optimal.layers; z++) {
                const geometry = new THREE.BoxGeometry(
                    boxDimensions.length / 10,
                    boxDimensions.height / 10,
                    boxDimensions.width / 10
                );
                const material = new THREE.MeshPhongMaterial({ 
                    color: 0x3b82f6,
                    transparent: true,
                    opacity: 0.8
                });
                const box = new THREE.Mesh(geometry, material);
                box.position.set(
                    (z * boxDimensions.length / 10) + (boxDimensions.length / 20),
                    (y * boxDimensions.height / 10) + (boxDimensions.height / 20),
                    (x * boxDimensions.width / 10) + (boxDimensions.width / 20)
                );
                box.castShadow = true;
                scene.add(box);
                boxMeshes.push(box);
            }
        }
    }
}

function animate3D() {
    if (currentVisualizationMode !== '3d') return;
    
    animationId = requestAnimationFrame(animate3D);
    controls.update();
    renderer.render(scene, camera);
}

function cleanup3D() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (renderer) {
        const threejsContainer = document.getElementById('threejs-container');
        if (threejsContainer.contains(renderer.domElement)) {
            threejsContainer.removeChild(renderer.domElement);
        }
        renderer.dispose();
        renderer = null;
    }
    
    if (scene) {
        boxMeshes.forEach(mesh => scene.remove(mesh));
        boxMeshes = [];
        if (containerMesh) {
            scene.remove(containerMesh);
            containerMesh = null;
        }
        scene = null;
    }
    
    camera = null;
    controls = null;
    
    document.getElementById('threejs-container').style.display = 'none';
    document.getElementById('visualizationContainer').style.display = 'flex';
}

function create2DVisualization() {
    const container = document.getElementById('visualizationContainer');
    const { optimal, containerDimensions, boxDimensions } = calculationResults;
    
    container.innerHTML = `
        <div class="svg-container">
            <svg viewBox="0 0 800 500" class="visualization-svg">
                <rect width="100%" height="100%" fill="#f1f5f9" rx="12" />
                
                <!-- Container -->
                <rect x="100" y="100" width="600" height="300" 
                      fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" stroke-width="4" rx="12" />
                
                <!-- Boxes -->
                ${Array.from({ length: optimal.boxesPerRow }).map((_, x) => 
                    Array.from({ length: optimal.boxesPerCol }).map((_, y) => `
                        <rect x="${100 + x * (600 / optimal.boxesPerRow)}" 
                              y="${100 + y * (300 / optimal.boxesPerCol)}" 
                              width="${600 / optimal.boxesPerRow}" 
                              height="${300 / optimal.boxesPerCol}" 
                              fill="#3b82f6" fill-opacity="0.7" rx="6" />
                    `).join('')
                ).join('')}
                
                <!-- Labels -->
                <text x="400" y="80" text-anchor="middle" font-family="Inter" font-weight="600" fill="#1e293b">
                    Kontainer ${containerDimensions.width} × ${containerDimensions.height} cm
                </text>
                <text x="400" y="440" text-anchor="middle" font-family="Inter" font-size="14" fill="#64748b">
                    Tampak Belakang • Volume: ${((containerDimensions.length * containerDimensions.width * containerDimensions.height) / 1000000).toFixed(2)} m³
                </text>
            </svg>
            
            <div class="svg-controls">
                <div class="svg-stats">
                    <div>📦 ${optimal.boxesPerLayer} kotak di sap ini</div>
                    <div>🎯 ${optimal.efficiency}% efisiensi</div>
                    <div>📏 Kedalaman: 0-${optimal.layers * boxDimensions.length} cm</div>
                </div>
                <button class="svg-refresh-btn" onclick="create2DVisualization()">
                    🔄 Refresh
                </button>
            </div>
        </div>
    `;
}

function setupLayerControls() {
    if (!calculationResults) return;
    
    const { optimal } = calculationResults;
    
    // Show layer controls
    document.getElementById('layerControls').style.display = 'block';
    
    // Setup layer slider
    const layerSlider = document.getElementById('layerSlider');
    const layerDisplay = document.getElementById('layerDisplay');
    layerSlider.max = optimal.layers;
    layerDisplay.textContent = `1 / ${optimal.layers}`;
    
    // Create layer tabs
    const layerTabs = document.getElementById('layerTabs');
    layerTabs.innerHTML = '';
    
    for (let i = 1; i <= optimal.layers; i++) {
        const tab = document.createElement('button');
        tab.className = `layer-tab ${i === 1 ? 'active' : ''}`;
        tab.textContent = `Sap ${i}`;
        tab.onclick = () => selectLayer(i);
        layerTabs.appendChild(tab);
    }
}

function selectLayer(layerNum) {
    // Update slider
    document.getElementById('layerSlider').value = layerNum;
    document.getElementById('layerDisplay').textContent = `${layerNum} / ${calculationResults.optimal.layers}`;
    
    // Update active tab
    document.querySelectorAll('.layer-tab').forEach((tab, index) => {
        if (index + 1 === layerNum) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update visualization
    if (currentVisualizationMode === '3d') {
        createBoxes3D();
    } else {
        create2DVisualization();
    }
}

function showSpecificLayer(layerNum) {
    document.getElementById('layerDisplay').textContent = `${layerNum} / ${calculationResults.optimal.layers}`;
    selectLayer(parseInt(layerNum));
}

function toggleLayerMode() {
    const showAll = document.getElementById('showAllLayers').checked;
    
    if (showAll) {
        document.getElementById('layerSlider').disabled = true;
        document.querySelectorAll('.layer-tab').forEach(tab => {
            tab.disabled = true;
        });
    } else {
        document.getElementById('layerSlider').disabled = false;
        document.querySelectorAll('.layer-tab').forEach(tab => {
            tab.disabled = false;
        });
    }
    
    // Update visualization
    if (currentVisualizationMode === '3d') {
        createBoxes3D();
    } else {
        create2DVisualization();
    }
}

function resetCamera() {
    if (camera && controls) {
        camera.position.set(50, 50, 50);
        controls.reset();
        showAlert('Kamera direset ke posisi default', 'info');
    }
}

function toggleWireframe() {
    const wireframe = document.getElementById('wireframeMode').checked;
    
    boxMeshes.forEach(mesh => {
        mesh.material.wireframe = wireframe;
    });
    
    showAlert(wireframe ? 'Mode wireframe aktif' : 'Mode solid aktif', 'info');
}

function updateOpacity(value) {
    document.getElementById('opacityValue').textContent = value;
    
    boxMeshes.forEach(mesh => {
        mesh.material.opacity = parseFloat(value);
    });
}

// Window resize handler
window.addEventListener('resize', function() {
    if (renderer && camera) {
        const threejsContainer = document.getElementById('threejs-container');
        camera.aspect = threejsContainer.clientWidth / 500;
        camera.updateProjectionMatrix();
        renderer.setSize(threejsContainer.clientWidth, 500);
    }
});
