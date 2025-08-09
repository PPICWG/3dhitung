// Main Application Controller
const ContainerCalculator = (function() {
    // State variables
    let calculationResults = null;
    let currentVisualizationMode = '2d';
    let scene, camera, renderer, controls;
    let boxMeshes = [];
    let containerMesh = null;
    let animationId = null;
    let isInitialized = false;

    // DOM Elements cache
    const elements = {
        containerVolume: document.getElementById('containerVolume'),
        containerInputs: document.getElementById('containerInputs'),
        containerLength: document.getElementById('containerLength'),
        containerWidth: document.getElementById('containerWidth'),
        containerHeight: document.getElementById('containerHeight'),
        boxLength: document.getElementById('boxLength'),
        boxWidth: document.getElementById('boxWidth'),
        boxHeight: document.getElementById('boxHeight'),
        allowRotation: document.getElementById('allowRotation'),
        enable3D: document.getElementById('enable3D'),
        resultsContainer: document.getElementById('resultsContainer'),
        visualizationContainer: document.getElementById('visualizationContainer'),
        threejsContainer: document.getElementById('threejs-container'),
        layerTabs: document.getElementById('layerTabs'),
        layerSlider: document.getElementById('layerSlider'),
        layerDisplay: document.getElementById('layerDisplay'),
        showAllLayers: document.getElementById('showAllLayers'),
        wireframeMode: document.getElementById('wireframeMode'),
        opacitySlider: document.getElementById('opacitySlider'),
        opacityValue: document.getElementById('opacityValue'),
        toggle3DMode: document.getElementById('toggle3DMode'),
        threeDControls: document.getElementById('threeDControls')
    };

    // Initialization
    function init() {
        if (isInitialized) return;
        
        setupEventListeners();
        updateContainerVolume();
        
        // Initialize Three.js if 3D mode is enabled by default
        if (elements.enable3D.checked) {
            init3DVisualization();
        }
        
        isInitialized = true;
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Container dimension inputs
        elements.containerLength.addEventListener('input', updateContainerVolume);
        elements.containerWidth.addEventListener('input', updateContainerVolume);
        elements.containerHeight.addEventListener('input', updateContainerVolume);

        // Radio button change listeners
        document.querySelectorAll('input[name="layoutPattern"]').forEach(radio => {
            radio.addEventListener('change', function() {
                animateElement(this.closest('.pattern-option'), 'jiffy-bounce');
            });
        });

        // Checkbox listeners
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                animateElement(this.closest('label'), 'jiffy-pulse');
            });
        });

        // Initialize container panel as collapsed
        elements.containerInputs.style.display = 'none';

        // Window resize handler
        window.addEventListener('resize', handleWindowResize);
    }

    // Helper Functions
    function animateElement(element, animationClass, duration = 600) {
        element.classList.add(animationClass);
        setTimeout(() => element.classList.remove(animationClass), duration);
    }

    function showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `jiffy-alert ${type} jiffy-bounce`;
        
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        
        alert.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-xl">${icons[type]}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.classList.add('jiffy-fade-out');
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    function handleWindowResize() {
        if (renderer && camera) {
            camera.aspect = elements.threejsContainer.clientWidth / 600;
            camera.updateProjectionMatrix();
            renderer.setSize(elements.threejsContainer.clientWidth, 600);
        }
    }

    // Core Calculation Functions
    function calculateOptimalLayout() {
        const button = event.target;
        animateElement(button, 'jiffy-pulse');

        // Get input values
        const containerL = parseFloat(elements.containerLength.value);
        const containerW = parseFloat(elements.containerWidth.value);
        const containerH = parseFloat(elements.containerHeight.value);
        
        const boxL = parseFloat(elements.boxLength.value);
        const boxW = parseFloat(elements.boxWidth.value);
        const boxH = parseFloat(elements.boxHeight.value);
        
        const allowRotation = elements.allowRotation.checked;
        const selectedPattern = document.querySelector('input[name="layoutPattern"]:checked').value;

        // Validation
        if (!validateInputs(boxL, boxW, boxH)) return;

        showLoadingState(selectedPattern);

        // Calculate with delay to simulate processing
        setTimeout(() => {
            calculationResults = performCalculations(
                containerL, containerW, containerH,
                boxL, boxW, boxH,
                selectedPattern,
                allowRotation
            );

            displayResults();
            createVisualization();
            showAlert('Perhitungan selesai!', 'success');
        }, 1500); // Reduced delay for better UX
    }

    function validateInputs(boxL, boxW, boxH) {
        if (!boxL || !boxW || !boxH || boxL <= 0 || boxW <= 0 || boxH <= 0) {
            showAlert('Mohon isi semua ukuran kotak dengan benar!', 'error');
            return false;
        }
        return true;
    }

    function showLoadingState(pattern) {
        elements.resultsContainer.innerHTML = `
            <div class="text-center py-12 jiffy-fade-in">
                <div class="loading-spinner mx-auto mb-6"></div>
                <p class="text-xl font-semibold text-gray-700 mb-2 jiffy-slide-up">Menghitung layout ${pattern}...</p>
                <div class="w-64 mx-auto bg-gray-200 rounded-full h-2 mb-4">
                    <div class="jiffy-progress-bar h-2 rounded-full"></div>
                </div>
                <p class="text-sm text-gray-500 jiffy-fade-in jiffy-stagger-1">AI sedang menganalisis konfigurasi optimal</p>
            </div>
        `;
    }

    function performCalculations(containerL, containerW, containerH, boxL, boxW, boxH, pattern, allowRotation) {
        const scenarios = [];
        let optimal;

        if (pattern === 'optimal') {
            const normal = calculateScenario(containerL, containerW, containerH, boxL, boxW, boxH, 'Normal', false);
            scenarios.push(normal);

            if (allowRotation) {
                const rotated = calculateScenario(containerL, containerW, containerH, boxW, boxL, boxH, 'Rotasi 90°', true);
                scenarios.push(rotated);
                
                const mixed = calculateMixedLayout(containerL, containerW, containerH, boxL, boxW, boxH);
                scenarios.push(mixed);
            }

            optimal = scenarios.reduce((best, current) => 
                current.totalBoxes > best.totalBoxes ? current : best
            );
        } else {
            switch (pattern) {
                case 'normal':
                    optimal = calculateScenario(containerL, containerW, containerH, boxL, boxW, boxH, 'Normal', false);
                    break;
                case 'zigzag':
                    optimal = calculateZigZagLayout(containerL, containerW, containerH, boxL, boxW, boxH);
                    break;
                case 'offset':
                    optimal = calculateOffsetLayout(containerL, containerW, containerH, boxL, boxW, boxH);
                    break;
            }
            scenarios.push(optimal);
        }

        // Calculate metrics
        const containerVolume = containerL * containerW * containerH;
        const boxVolume = boxL * boxW * boxH;
        const wastedSpace = containerVolume - (optimal.totalBoxes * boxVolume);

        return {
            scenarios: scenarios,
            optimal: optimal,
            containerDimensions: { length: containerL, width: containerW, height: containerH },
            boxDimensions: { length: boxL, width: boxW, height: boxH },
            metrics: {
                containerVolume: containerVolume,
                boxVolume: boxVolume,
                wastedSpace: wastedSpace,
                spaceSavings: ((optimal.totalBoxes * boxVolume) / containerVolume * 100).toFixed(1)
            }
        };
    }

    // Layout Calculation Functions
    function calculateScenario(containerL, containerW, containerH, boxL, boxW, boxH, name, isRotated = false) {
        const boxesPerWidth = Math.floor(containerW / boxW);
        const boxesPerHeight = Math.floor(containerH / boxH);
        const boxesPerLayer = boxesPerWidth * boxesPerHeight;
        const layers = Math.floor(containerL / boxL);
        const totalBoxes = boxesPerLayer * layers;
        
        const usedVolume = totalBoxes * (boxL * boxW * boxH);
        const containerVolume = containerL * containerW * containerH;
        const efficiency = (usedVolume / containerVolume) * 100;

        return {
            name: name,
            boxesPerRow: boxesPerWidth,
            boxesPerCol: boxesPerHeight,
            boxesPerLayer: boxesPerLayer,
            layers: layers,
            totalBoxes: totalBoxes,
            efficiency: efficiency.toFixed(1),
            layout: generateLayoutPattern(boxesPerWidth, boxesPerHeight, layers, isRotated)
        };
    }

    function calculateMixedLayout(containerL, containerW, containerH, boxL, boxW, boxH) {
        let bestResult = { totalBoxes: 0 };
        
        const normalPerWidth = Math.floor(containerW / boxW);
        const normalPerHeight = Math.floor(containerH / boxH);
        const rotatedPerWidth = Math.floor(containerW / boxL);
        const rotatedPerHeight = Math.floor(containerH / boxW);
        
        for (let normalHeight = 0; normalHeight <= normalPerHeight; normalHeight++) {
            const remainingHeight = containerH - (normalHeight * boxH);
            const rotatedHeight = Math.floor(remainingHeight / boxW);
            
            const totalBoxesPerLayer = (normalHeight * normalPerWidth) + (rotatedHeight * rotatedPerWidth);
            const layers = Math.floor(containerL / boxL);
            const totalBoxes = totalBoxesPerLayer * layers;
            
            if (totalBoxes > bestResult.totalBoxes) {
                const usedVolume = totalBoxes * (boxL * boxW * boxH);
                const containerVolume = containerL * containerW * containerH;
                const efficiency = (usedVolume / containerVolume) * 100;
                
                bestResult = {
                    name: 'Kombinasi Optimal',
                    boxesPerRow: Math.max(normalPerWidth, rotatedPerWidth),
                    boxesPerCol: normalHeight + rotatedHeight,
                    boxesPerLayer: totalBoxesPerLayer,
                    layers: layers,
                    totalBoxes: totalBoxes,
                    efficiency: efficiency.toFixed(1),
                    layout: generateMixedLayoutPattern(normalPerWidth, rotatedPerWidth, normalHeight, rotatedHeight, layers)
                };
            }
        }
        
        return bestResult;
    }

    function calculateZigZagLayout(containerL, containerW, containerH, boxL, boxW, boxH) {
        const normalPerWidth = Math.floor(containerW / boxW);
        const rotatedPerWidth = Math.floor(containerW / boxL);
        
        let totalHeight = 0;
        let currentHeight = 0;
        let alternateNormal = true;
        
        while (currentHeight < containerH) {
            const nextRowHeight = alternateNormal ? boxH : boxW;
            if (currentHeight + nextRowHeight <= containerH) {
                currentHeight += nextRowHeight;
                totalHeight++;
                alternateNormal = !alternateNormal;
            } else {
                break;
            }
        }
        
        const normalRowCount = Math.ceil(totalHeight / 2);
        const rotatedRowCount = Math.floor(totalHeight / 2);
        const boxesPerLayer = (normalRowCount * normalPerWidth) + (rotatedRowCount * rotatedPerWidth);
        const layers = Math.floor(containerL / boxL);
        const totalBoxes = boxesPerLayer * layers;
        
        const usedVolume = totalBoxes * (boxL * boxW * boxH);
        const containerVolume = containerL * containerW * containerH;
        const efficiency = (usedVolume / containerVolume) * 100;
        
        return {
            name: 'Pola Zig-Zag',
            boxesPerRow: Math.max(normalPerWidth, rotatedPerWidth),
            boxesPerCol: totalHeight,
            boxesPerLayer: boxesPerLayer,
            layers: layers,
            totalBoxes: totalBoxes,
            efficiency: efficiency.toFixed(1),
            layout: generateZigZagLayoutPattern(normalPerWidth, rotatedPerWidth, normalRowCount, rotatedRowCount, layers)
        };
    }

    function calculateOffsetLayout(containerL, containerW, containerH, boxL, boxW, boxH) {
        const boxesPerWidth = Math.floor(containerW / boxW);
        const boxesPerHeight = Math.floor(containerH / boxH);
        
        const offsetShift = boxW / 2;
        const offsetBoxesPerWidth = Math.floor((containerW - offsetShift) / boxW);
        
        const fullRows = Math.ceil(boxesPerHeight / 2);
        const offsetRows = Math.floor(boxesPerHeight / 2);
        
        const boxesPerLayer = (fullRows * boxesPerWidth) + (offsetRows * offsetBoxesPerWidth);
        const layers = Math.floor(containerL / boxL);
        const totalBoxes = boxesPerLayer * layers;
        
        const usedVolume = totalBoxes * (boxL * boxW * boxH);
        const containerVolume = containerL * containerW * containerH;
        const efficiency = (usedVolume / containerVolume) * 100;
        
        return {
            name: 'Pola Offset',
            boxesPerRow: boxesPerWidth,
            boxesPerCol: boxesPerHeight,
            boxesPerLayer: boxesPerLayer,
            layers: layers,
            totalBoxes: totalBoxes,
            efficiency: efficiency.toFixed(1),
            layout: generateOffsetLayoutPattern(boxesPerWidth, offsetBoxesPerWidth, fullRows, offsetRows, layers)
        };
    }

    // Pattern Generation Functions
    function generateLayoutPattern(boxesPerRow, boxesPerCol, layers, isRotated) {
        const pattern = [];
        for (let layer = 0; layer < layers; layer++) {
            const layerPattern = [];
            for (let col = 0; col < boxesPerCol; col++) {
                const row = [];
                for (let r = 0; r < boxesPerRow; r++) {
                    row.push({ rotated: isRotated, type: isRotated ? 'rotated' : 'normal' });
                }
                layerPattern.push(row);
            }
            pattern.push(layerPattern);
        }
        return pattern;
    }

    function generateMixedLayoutPattern(normalPerRow, rotatedPerRow, normalRows, rotatedRows, layers) {
        const pattern = [];
        for (let layer = 0; layer < layers; layer++) {
            const layerPattern = [];
            
            for (let col = 0; col < normalRows; col++) {
                const row = [];
                for (let r = 0; r < normalPerRow; r++) {
                    row.push({ rotated: false, type: 'normal' });
                }
                layerPattern.push(row);
            }
            
            for (let col = 0; col < rotatedRows; col++) {
                const row = [];
                for (let r = 0; r < rotatedPerRow; r++) {
                    row.push({ rotated: true, type: 'rotated' });
                }
                layerPattern.push(row);
            }
            
            pattern.push(layerPattern);
        }
        return pattern;
    }

    function generateZigZagLayoutPattern(normalPerRow, rotatedPerRow, normalRowCount, rotatedRowCount, layers) {
        const pattern = [];
        for (let layer = 0; layer < layers; layer++) {
            const layerPattern = [];
            let isNormalRow = true;
            
            for (let row = 0; row < (normalRowCount + rotatedRowCount); row++) {
                const rowPattern = [];
                const boxesInThisRow = isNormalRow ? normalPerRow : rotatedPerRow;
                
                for (let col = 0; col < boxesInThisRow; col++) {
                    rowPattern.push({ 
                        rotated: !isNormalRow, 
                        type: isNormalRow ? 'normal' : 'rotated',
                        zigzag: true 
                    });
                }
                
                layerPattern.push(rowPattern);
                isNormalRow = !isNormalRow;
            }
            
            pattern.push(layerPattern);
        }
        return pattern;
    }

    function generateOffsetLayoutPattern(boxesPerRow, offsetBoxesPerRow, fullRows, offsetRows, layers) {
        const pattern = [];
        for (let layer = 0; layer < layers; layer++) {
            const layerPattern = [];
            let isFullRow = true;
            
            for (let row = 0; row < (fullRows + offsetRows); row++) {
                const rowPattern = [];
                const boxesInThisRow = isFullRow ? boxesPerRow : offsetBoxesPerRow;
                
                for (let col = 0; col < boxesInThisRow; col++) {
                    rowPattern.push({ 
                        rotated: false, 
                        type: 'normal',
                        offset: !isFullRow,
                        offsetShift: !isFullRow ? 0.5 : 0
                    });
                }
                
                layerPattern.push(rowPattern);
                isFullRow = !isFullRow;
            }
            
            pattern.push(layerPattern);
        }
        return pattern;
    }

    // UI Update Functions
    function toggleContainerPanel() {
        const inputs = elements.containerInputs;
        const isHidden = inputs.style.display === 'none';
        
        if (isHidden) {
            inputs.style.display = 'grid';
            inputs.classList.add('jiffy-slide-up');
        } else {
            inputs.style.display = 'none';
            inputs.classList.remove('jiffy-slide-up');
        }
        
        // Reset calculation results when container size changes
        if (calculationResults) {
            calculationResults = null;
            elements.resultsContainer.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <div class="text-8xl mb-6 jiffy-pulse">📦</div>
                    <p class="text-lg font-medium jiffy-fade-in">Ukuran kontainer diubah. Klik "Hitung Layout Optimal" untuk hasil baru</p>
                </div>
            `;
            elements.visualizationContainer.innerHTML = `
                <div class="text-center text-gray-500">
                    <div class="text-6xl lg:text-8xl mb-6 jiffy-pulse">🎨</div>
                    <p class="text-lg lg:text-xl font-medium jiffy-fade-in">Visualisasi akan muncul setelah perhitungan</p>
                </div>
            `;
        }
    }

    function updateContainerVolume() {
        const length = parseFloat(elements.containerLength.value) || 0;
        const width = parseFloat(elements.containerWidth.value) || 0;
        const height = parseFloat(elements.containerHeight.value) || 0;
        
        const volume = (length * width * height) / 1000000; // Convert to m³
        elements.containerVolume.textContent = volume.toFixed(2) + ' m³';
    }

    function displayResults() {
        if (!calculationResults) return;
        
        const { scenarios, optimal, metrics } = calculationResults;
        const container = elements.resultsContainer;
        
        let html = `
            <div class="p-6 rounded-2xl border-l-4 border-green-500 mb-8 jiffy-success" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1));">
                <h3 class="text-2xl font-bold text-green-800 mb-4 flex items-center">
                    <span class="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white mr-3 jiffy-pulse">🏆</span>
                    Layout Optimal: ${optimal.name}
                </h3>
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div class="text-center jiffy-bounce jiffy-stagger-1">
                        <div class="text-4xl font-bold gradient-text">${optimal.totalBoxes}</div>
                        <div class="text-sm font-semibold text-gray-600">Total MC</div>
                    </div>
                    <div class="text-center jiffy-bounce jiffy-stagger-2">
                        <div class="text-4xl font-bold gradient-text">${optimal.efficiency}%</div>
                        <div class="text-sm font-semibold text-gray-600">Efisiensi</div>
                    </div>
                    <div class="text-center jiffy-bounce jiffy-stagger-3">
                        <div class="text-2xl font-bold text-gray-700">${optimal.boxesPerLayer}</div>
                        <div class="text-sm font-semibold text-gray-600">Kotak per Sap</div>
                    </div>
                    <div class="text-center jiffy-bounce jiffy-stagger-4">
                        <div class="text-2xl font-bold text-gray-700">${optimal.layers}</div>
                        <div class="text-sm font-semibold text-gray-600">Tinggi Sap</div>
                    </div>
                </div>
            </div>

            <div class="p-6 rounded-2xl mb-8 jiffy-slide-up" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05));">
                <h4 class="text-2xl font-bold text-blue-800 mb-6 flex items-center">
                    <span class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white mr-3 jiffy-pulse">📊</span>
                    Analisis Mendalam
                </h4>
                <div class="grid grid-cols-2 gap-6">
                    <div class="metric-card p-4 rounded-xl jiffy-hover-lift jiffy-fade-in jiffy-stagger-1">
                        <div class="text-gray-600 font-semibold mb-1">Volume Kontainer</div>
                        <div class="text-2xl font-bold gradient-text">${(metrics.containerVolume / 1000000).toFixed(2)} m³</div>
                    </div>
                    <div class="metric-card p-4 rounded-xl jiffy-hover-lift jiffy-fade-in jiffy-stagger-2">
                        <div class="text-gray-600 font-semibold mb-1">Volume Terpakai</div>
                        <div class="text-2xl font-bold text-green-600">${metrics.spaceSavings}%</div>
                    </div>
                    <div class="metric-card p-4 rounded-xl jiffy-hover-lift jiffy-fade-in jiffy-stagger-3">
                        <div class="text-gray-600 font-semibold mb-1">Ruang Terbuang</div>
                        <div class="text-2xl font-bold text-red-600">${(metrics.wastedSpace / 1000000).toFixed(2)} m³</div>
                    </div>
                    <div class="metric-card p-4 rounded-xl jiffy-hover-lift jiffy-fade-in jiffy-stagger-4">
                        <div class="text-gray-600 font-semibold mb-1">Kotak per m³</div>
                        <div class="text-2xl font-bold text-purple-600">${(optimal.totalBoxes / (metrics.containerVolume / 1000000)).toFixed(0)}</div>
                    </div>
                </div>
            </div>
            
            <div class="space-y-4 jiffy-slide-up">
                <h4 class="text-xl font-bold text-gray-700 flex items-center">
                    <span class="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white text-sm mr-3 jiffy-pulse">📋</span>
                    Perbandingan Semua Skenario
                </h4>
        `;
        
        scenarios.forEach((scenario, index) => {
            const isOptimal = scenario === optimal;
            html += `
                <div class="p-4 rounded-xl border-2 ${isOptimal ? 'border-green-300' : 'border-gray-200'} jiffy-fade-in jiffy-stagger-${index + 1} jiffy-hover-lift" style="background: ${isOptimal ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(59, 130, 246, 0.05))' : 'rgba(255, 255, 255, 0.8)'};">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-lg font-bold ${isOptimal ? 'text-green-800' : 'text-gray-700'}">${scenario.name}</span>
                        ${isOptimal ? '<span class="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold jiffy-bounce">OPTIMAL ✨</span>' : ''}
                    </div>
                    <div class="grid grid-cols-4 gap-4 text-sm">
                        <div class="text-center">
                            <div class="font-bold text-xl ${isOptimal ? 'text-green-600' : 'text-gray-700'}">${scenario.totalBoxes}</div>
                            <div class="text-gray-600">Total</div>
                        </div>
                        <div class="text-center">
                            <div class="font-bold text-lg text-gray-700">${scenario.boxesPerLayer}</div>
                            <div class="text-gray-600">Per Sap</div>
                        </div>
                        <div class="text-center">
                            <div class="font-bold text-lg text-gray-700">${scenario.layers}</div>
                            <div class="text-gray-600">Jumlah Sap</div>
                        </div>
                        <div class="text-center">
                            <div class="font-bold text-lg ${isOptimal ? 'text-blue-600' : 'text-gray-700'}">${scenario.efficiency}%</div>
                            <div class="text-gray-600">Efisiensi</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    // Visualization Functions
    function createVisualization() {
        const enable3D = elements.enable3D.checked;
        
        if (enable3D) {
            currentVisualizationMode = '3d';
            elements.toggle3DMode.textContent = '📋 Mode 2D';
            elements.threeDControls.classList.remove('hidden');
            elements.threeDControls.classList.add('jiffy-zoom-in');
            init3DVisualization();
        } else {
            currentVisualizationMode = '2d';
            elements.toggle3DMode.textContent = '🎮 Mode 3D';
            elements.threeDControls.classList.add('hidden');
            create2DVisualization();
        }
        
        setupLayerControls();
    }

    function toggle3DVisualization() {
        if (currentVisualizationMode === '2d') {
            currentVisualizationMode = '3d';
            elements.toggle3DMode.textContent = '📋 Mode 2D';
            animateElement(elements.toggle3DMode, 'jiffy-bounce');
            
            if (calculationResults) {
                elements.threeDControls.classList.remove('hidden');
                elements.threeDControls.classList.add('jiffy-zoom-in');
                init3DVisualization();
            }
        } else {
            currentVisualizationMode = '2d';
            elements.toggle3DMode.textContent = '🎮 Mode 3D';
            animateElement(elements.toggle3DMode, 'jiffy-bounce');
            
            elements.threeDControls.classList.add('hidden');
            cleanup3D();
            if (calculationResults) {
                create2DVisualization();
            }
        }
    }

    // 3D Visualization Functions
    function init3DVisualization() {
        if (!calculationResults) return;

        cleanup3D();

        elements.visualizationContainer.style.display = 'none';
        elements.threejsContainer.style.display = 'block';
        elements.threejsContainer.classList.add('jiffy-zoom-in');
        
        // Setup Three.js scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);

        // Camera
        camera = new THREE.PerspectiveCamera(75, elements.threejsContainer.clientWidth / 600, 0.1, 1000);
        camera.position.set(50, 50, 50);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(elements.threejsContainer.clientWidth, 600);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        elements.threejsContainer.appendChild(renderer.domElement);

        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Create container and boxes
        createContainer3D();
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
        
        // Create container wireframe with enhanced styling
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x1e40af, 
            linewidth: 4,
            transparent: true,
            opacity: 0.8
        });
        containerMesh = new THREE.LineSegments(edges, material);
        
        // Add semi-transparent container walls
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide
        });
        const containerWalls = new THREE.Mesh(geometry, wallMaterial);
        containerMesh.add(containerWalls);
        
        containerMesh.position.set(
            containerDimensions.length / 20,
            containerDimensions.height / 20,
            containerDimensions.width / 20
        );
        
        scene.add(containerMesh);
    }

    function createBoxes3D() {
        const { optimal, boxDimensions } = calculationResults;
        const showAllLayers = elements.showAllLayers.checked;
        const currentLayer = parseInt(elements.layerSlider.value) - 1;
        
        boxMeshes.forEach(mesh => scene.remove(mesh));
        boxMeshes = [];

        const layersToShow = showAllLayers ? optimal.layers : 1;
        const startLayer = showAllLayers ? 0 : currentLayer;
        const endLayer = showAllLayers ? optimal.layers : currentLayer + 1;

        for (let layerIndex = startLayer; layerIndex < endLayer && layerIndex < optimal.layout.length; layerIndex++) {
            const layer = optimal.layout[layerIndex];
            
            layer.forEach((row, rowIndex) => {
                row.forEach((box, colIndex) => {
                    const boxGeometry = new THREE.BoxGeometry(
                        (box.rotated ? boxDimensions.width : boxDimensions.length) / 10,
                        boxDimensions.height / 10,
                        (box.rotated ? boxDimensions.length : boxDimensions.width) / 10
                    );

                    // Enhanced colors and materials
                    let color = 0x3b82f6; // Normal blue
                    let emissive = 0x1e40af;
                    if (box.rotated) {
                        color = 0xef4444; // Rotated red
                        emissive = 0xb91c1c;
                    } else if (box.zigzag) {
                        color = 0x8b5cf6; // Zigzag purple
                        emissive = 0x6d28d9;
                    } else if (box.offset) {
                        color = 0x10b981; // Offset green
                        emissive = 0x047857;
                    }

                    // Create main box material with enhanced properties
                    const boxMaterial = new THREE.MeshPhongMaterial({ 
                        color: color,
                        emissive: emissive,
                        emissiveIntensity: 0.1,
                        shininess: 30,
                        transparent: true,
                        opacity: parseFloat(elements.opacitySlider.value),
                        side: THREE.DoubleSide,
                        wireframe: elements.wireframeMode.checked
                    });

                    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
                    
                    // Add wireframe edges for clearer borders
                    const edges = new THREE.EdgesGeometry(boxGeometry);
                    const edgeMaterial = new THREE.LineBasicMaterial({ 
                        color: 0x000000, 
                        linewidth: 2,
                        transparent: true,
                        opacity: 0.8
                    });
                    const wireframe = new THREE.LineSegments(edges, edgeMaterial);
                    boxMesh.add(wireframe);
                    
                    // Position calculation
                    const boxWidth = (box.rotated ? boxDimensions.width : boxDimensions.length) / 10;
                    const boxDepth = (box.rotated ? boxDimensions.length : boxDimensions.width) / 10;
                    
                    let offsetX = 0;
                    if (box.offset && box.offsetShift) {
                        offsetX = boxWidth * box.offsetShift;
                    }

                    boxMesh.position.set(
                        (layerIndex * boxDimensions.length / 10) + (boxDimensions.length / 20),
                        (rowIndex * boxDimensions.height / 10) + (boxDimensions.height / 20),
                        (colIndex * boxDepth) + (boxDepth / 2) + offsetX
                    );

                    boxMesh.castShadow = true;
                    boxMesh.receiveShadow = true;
                    
                    scene.add(boxMesh);
                    boxMeshes.push(boxMesh);
                });
            });
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
            if (elements.threejsContainer.contains(renderer.domElement)) {
                elements.threejsContainer.removeChild(renderer.domElement);
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
        
        elements.threejsContainer.style.display = 'none';
        elements.visualizationContainer.style.display = 'flex';
    }

    // 2D Visualization Functions
    function create2DVisualization() {
        const container = elements.visualizationContainer;
        const { optimal, containerDimensions, boxDimensions } = calculationResults;
        
        // Create responsive 2D SVG visualization
        const containerRect = container.getBoundingClientRect();
        const isMobile = window.innerWidth < 1024;
        const svgWidth = Math.min(containerRect.width - (isMobile ? 48 : 64), isMobile ? 500 : 1000);
        const svgHeight = Math.min(containerRect.height - (isMobile ? 48 : 64), isMobile ? 400 : 700);
        
        // Calculate proper scale to fit container in view
        const padding = 120;
        const scaleX = (svgWidth - padding) / containerDimensions.width;
        const scaleY = (svgHeight - padding) / containerDimensions.height;
        const scale = Math.min(scaleX, scaleY, 0.8); // Optimal scale for visibility
        
        const containerWidth = containerDimensions.width * scale;
        const containerHeight = containerDimensions.height * scale;
        
        const showAllLayers = elements.showAllLayers.checked;
        const currentLayer = parseInt(elements.layerSlider.value) - 1;
        
        let html = `
            <div class="w-full jiffy-zoom-in" style="background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%); border-radius: 24px; padding: ${isMobile ? '24px' : '40px'}; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);">
                <div class="mb-6 text-center">
                    <h4 class="text-xl lg:text-2xl font-bold text-white mb-2">Layout Visualization</h4>
                    <p class="text-sm lg:text-base text-slate-300">Tampak belakang kontainer dengan penataan MC optimal</p>
                </div>
                
                <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="mx-auto" style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 16px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                    <defs>
                        <!-- Professional grid pattern -->
                        <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#cbd5e1" stroke-width="0.5" opacity="0.6"/>
                            <circle cx="0" cy="0" r="1" fill="#94a3b8" opacity="0.3"/>
                        </pattern>
                        
                        <!-- Enhanced shadow filters -->
                        <filter id="boxShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                            <feOffset dx="2" dy="4" result="offset"/>
                            <feFlood flood-color="#000000" flood-opacity="0.25"/>
                            <feComposite in2="offset" operator="in"/>
                            <feMerge>
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                        
                        <filter id="containerGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                        
                        <!-- Gradient definitions -->
                        <linearGradient id="containerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.1" />
                            <stop offset="50%" style="stop-color:#1d4ed8;stop-opacity:0.05" />
                            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:0.1" />
                        </linearGradient>
                        
                        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#1d4ed8;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Professional grid background -->
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    <!-- Main container group -->
                    <g transform="translate(${(svgWidth - containerWidth) / 2}, ${(svgHeight - containerHeight) / 2})">
                        
                        <!-- Container shadow -->
                        <rect x="4" y="6" width="${containerWidth}" height="${containerHeight}" 
                              fill="#000000" opacity="0.15" rx="12" />
                        
                        <!-- Main container -->
                        <rect x="0" y="0" width="${containerWidth}" height="${containerHeight}" 
                              fill="url(#containerGradient)" stroke="url(#borderGradient)" stroke-width="4" 
                              rx="12" filter="url(#containerGlow)" />
                        
                        <!-- Container inner border -->
                        <rect x="2" y="2" width="${containerWidth-4}" height="${containerHeight-4}" 
                              fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1" rx="10" />
                        
                        <!-- Container title -->
                        <text x="${containerWidth/2}" y="-35" text-anchor="middle" 
                              class="${isMobile ? 'text-base' : 'text-xl'} font-bold" 
                              fill="url(#borderGradient)" style="font-family: 'Inter', sans-serif;">
                            📦 Kontainer ${containerDimensions.width} × ${containerDimensions.height} cm
                        </text>
                        
                        <!-- Dimension labels -->
                        <text x="${containerWidth/2}" y="-15" text-anchor="middle" 
                              class="${isMobile ? 'text-xs' : 'text-sm'} font-semibold" 
                              fill="#64748b" style="font-family: 'Inter', sans-serif;">
                            Tampak Belakang • Volume: ${((containerDimensions.length * containerDimensions.width * containerDimensions.height) / 1000000).toFixed(2)} m³
                        </text>
        `;
        
        // Add boxes for current layer(s)
        const layersToShow = showAllLayers ? optimal.layers : 1;
        const startLayer = showAllLayers ? 0 : currentLayer;
        const endLayer = showAllLayers ? optimal.layers : currentLayer + 1;

        for (let layerIndex = startLayer; layerIndex < endLayer && layerIndex < optimal.layout.length; layerIndex++) {
            const layer = optimal.layout[layerIndex];
            const opacity = showAllLayers ? Math.max(0.4, 1 - (layerIndex * 0.1)) : 1;
            
            layer.forEach((row, rowIndex) => {
                row.forEach((box, colIndex) => {
                    const boxWidth = (box.rotated ? boxDimensions.height : boxDimensions.width) * scale;
                    const boxHeight = (box.rotated ? boxDimensions.width : boxDimensions.height) * scale;
                    
                    let fillColor = '#60a5fa';
                    let strokeColor = '#3b82f6';
                    
                    // Adjust colors based on layer depth when showing all layers
                    if (showAllLayers) {
                        const layerColorIntensity = 1 - (layerIndex * 0.15);
                        if (box.rotated) {
                            fillColor = `rgba(248, 113, 113, ${layerColorIntensity})`;
                            strokeColor = '#ef4444';
                        } else if (box.zigzag) {
                            fillColor = `rgba(167, 139, 250, ${layerColorIntensity})`;
                            strokeColor = '#8b5cf6';
                        } else if (box.offset) {
                            fillColor = `rgba(52, 211, 153, ${layerColorIntensity})`;
                            strokeColor = '#10b981';
                        } else {
                            fillColor = `rgba(96, 165, 250, ${layerColorIntensity})`;
                            strokeColor = '#3b82f6';
                        }
                    } else {
                        if (box.rotated) {
                            fillColor = '#f87171';
                            strokeColor = '#ef4444';
                        } else if (box.zigzag) {
                            fillColor = '#a78bfa';
                            strokeColor = '#8b5cf6';
                        } else if (box.offset) {
                            fillColor = '#34d399';
                            strokeColor = '#10b981';
                        }
                    }
                    
                    // Calculate position with proper spacing and alignment
                    let boxX = colIndex * (boxDimensions.width * scale) + 8;
                    let boxY = rowIndex * (boxDimensions.height * scale) + 8;
                    
                    // Add depth effect for multiple layers when showing all
                    if (showAllLayers && layerIndex > 0) {
                        boxX += layerIndex * 3;
                        boxY += layerIndex * 3;
                    }
                    
                    // Handle offset positioning
                    if (box.offset && box.offsetShift) {
                        boxX += (boxDimensions.width * scale * box.offsetShift);
                    }
                    
                    // Create enhanced pattern definitions for different box types
                    const patternId = `pattern-${layerIndex}-${rowIndex}-${colIndex}`;
                    const gradientId = `gradient-${layerIndex}-${rowIndex}-${colIndex}`;
                    const glowId = `glow-${layerIndex}-${rowIndex}-${colIndex}`;
                    
                    let patternDef = '';
                    let gradientDef = '';
                    let glowDef = '';
                    
                    if (box.rotated) {
                        patternDef = `
                            <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="12" height="12">
                                <rect width="12" height="12" fill="${fillColor}"/>
                                <path d="M0,12 L12,0 M3,12 L12,3 M0,9 L9,0" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
                            </pattern>
                        `;
                        gradientDef = `
                            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
                                <stop offset="50%" style="stop-color:#dc2626;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
                            </linearGradient>
                        `;
                        glowDef = `
                            <filter id="${glowId}">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        `;
                    } else if (box.zigzag) {
                        patternDef = `
                            <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="16" height="12">
                                <rect width="16" height="12" fill="${fillColor}"/>
                                <path d="M0,6 L4,2 L8,10 L12,2 L16,6" stroke="rgba(255,255,255,0.5)" stroke-width="2" fill="none"/>
                            </pattern>
                        `;
                        gradientDef = `
                            <radialGradient id="${gradientId}" cx="50%" cy="50%" r="70%">
                                <stop offset="0%" style="stop-color:#a78bfa;stop-opacity:1" />
                                <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#6d28d9;stop-opacity:1" />
                            </radialGradient>
                        `;
                        glowDef = `
                            <filter id="${glowId}">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        `;
                    } else if (box.offset) {
                        patternDef = `
                            <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="20" height="20">
                                <rect width="20" height="20" fill="${fillColor}"/>
                                <circle cx="10" cy="10" r="6" stroke="rgba(255,255,255,0.5)" stroke-width="2" fill="none"/>
                                <circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.7)"/>
                            </pattern>
                        `;
                        gradientDef = `
                            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#34d399;stop-opacity:1" />
                                <stop offset="50%" style="stop-color:#10b981;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
                            </linearGradient>
                        `;
                        glowDef = `
                            <filter id="${glowId}">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        `;
                    } else {
                        patternDef = `
                            <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="14" height="14">
                                <rect width="14" height="14" fill="${fillColor}"/>
                                <path d="M0,0 L0,14 M0,0 L14,0 M7,0 L7,14 M0,7 L14,7" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
                            </pattern>
                        `;
                        gradientDef = `
                            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:1" />
                                <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
                            </linearGradient>
                        `;
                        glowDef = `
                            <filter id="${glowId}">
                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        `;
                    }
                    
                    html += `
                        <defs>
                            ${patternDef}
                            ${gradientDef}
                            ${glowDef}
                        </defs>
                        
                        <g class="box-group" style="cursor: pointer;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                            <!-- Enhanced shadow with blur -->
                            <rect x="${boxX + 4}" y="${boxY + 6}" 
                                  width="${boxWidth}" height="${boxHeight}" 
                                  fill="#000000" opacity="0.2" rx="6" 
                                  filter="url(#boxShadow)" />
                            
                            <!-- Main box with enhanced gradient and glow -->
                            <rect x="${boxX}" y="${boxY}" 
                                  width="${boxWidth}" height="${boxHeight}" 
                                  fill="url(#${gradientId})" stroke="${strokeColor}" stroke-width="3" 
                                  rx="6" opacity="${opacity}" filter="url(#${glowId})" />
                            
                            <!-- Pattern overlay with better opacity -->
                            <rect x="${boxX + 2}" y="${boxY + 2}" 
                                  width="${boxWidth - 4}" height="${boxHeight - 4}" 
                                  fill="url(#${patternId})" opacity="0.7" rx="4" />
                            
                            <!-- Enhanced inner border with gradient -->
                            <rect x="${boxX + 1.5}" y="${boxY + 1.5}" 
                                  width="${boxWidth - 3}" height="${boxHeight - 3}" 
                                  fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" rx="4.5" />
                            
                            <!-- Professional box labels -->
                            ${boxWidth > 25 && boxHeight > 25 ? `
                                <!-- Icon background -->
                                <circle cx="${boxX + boxWidth/2}" cy="${boxY + boxHeight/2 - 6}" r="8" 
                                        fill="rgba(0,0,0,0.3)" opacity="${opacity * 0.8}"/>
                                
                                <!-- Box type icon -->
                                <text x="${boxX + boxWidth/2}" y="${boxY + boxHeight/2 - 6}" 
                                      text-anchor="middle" dominant-baseline="middle"
                                      class="${isMobile ? 'text-sm' : 'text-base'} font-bold fill-white" 
                                      style="font-family: 'Inter', sans-serif; pointer-events: none; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);"
                                      opacity="${opacity}">
                                    ${box.rotated ? '↻' : box.zigzag ? '⟲' : box.offset ? '⬢' : '□'}
                                </text>
                                
                                <!-- Box number with background -->
                                <rect x="${boxX + boxWidth/2 - 12}" y="${boxY + boxHeight/2 + 2}" 
                                      width="24" height="12" rx="6" 
                                      fill="rgba(0,0,0,0.4)" opacity="${opacity * 0.9}"/>
                                
                                <text x="${boxX + boxWidth/2}" y="${boxY + boxHeight/2 + 8}" 
                                      text-anchor="middle" dominant-baseline="middle"
                                      class="${isMobile ? 'text-xs' : 'text-sm'} font-bold fill-white" 
                                      style="font-family: 'Inter', sans-serif; pointer-events: none; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);"
                                      opacity="${opacity}">
                                    ${showAllLayers ? `S${layerIndex + 1}` : `${layerIndex + 1}-${rowIndex + 1}-${colIndex + 1}`}
                                </text>
                            ` : boxWidth > 15 && boxHeight > 15 ? `
                                <!-- Minimal label for smaller boxes -->
                                <text x="${boxX + boxWidth/2}" y="${boxY + boxHeight/2}" 
                                      text-anchor="middle" dominant-baseline="middle"
                                      class="text-xs font-bold fill-white" 
                                      style="font-family: 'Inter', sans-serif; pointer-events: none; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);"
                                      opacity="${opacity}">
                                    ${layerIndex + 1}
                                </text>
                            ` : ''}
                        </g>
                    `;

                });
            });
        }
        
        html += `
                    </g>
                    
                    <!-- Professional footer with statistics -->
                    <g transform="translate(0, ${svgHeight - 80})">
                        <!-- Footer background -->
                        <rect x="20" y="0" width="${svgWidth - 40}" height="70" 
                              fill="rgba(30, 41, 59, 0.9)" rx="12" />
                        
                        <!-- Layer information -->
                        <text x="${svgWidth/2}" y="25" text-anchor="middle" 
                              class="${isMobile ? 'text-sm' : 'text-lg'} font-bold fill-white" 
                              style="font-family: 'Inter', sans-serif;">
                            ${showAllLayers ? `📊 Menampilkan Semua ${optimal.layers} Sap (Overlay View)` : `📋 Sap ${currentLayer + 1} dari ${optimal.layers}`}
                        </text>
                        
                        <!-- Statistics row -->
                        <g transform="translate(40, 40)">
                            <text x="0" y="0" class="${isMobile ? 'text-xs' : 'text-sm'} font-semibold fill-slate-300" 
                                  style="font-family: 'Inter', sans-serif;">
                                📦 ${showAllLayers ? `${optimal.totalBoxes} kotak (${optimal.boxesPerLayer} per sap)` : `${optimal.boxesPerLayer} kotak di sap ini`}
                            </text>
                            
                            <text x="${(svgWidth - 80) / 3}" y="0" class="${isMobile ? 'text-xs' : 'text-sm'} font-semibold fill-slate-300" 
                                  style="font-family: 'Inter', sans-serif;">
                                🎯 ${optimal.efficiency}% efisiensi
                            </text>
                            
                            <text x="${2 * (svgWidth - 80) / 3}" y="0" class="${isMobile ? 'text-xs' : 'text-sm'} font-semibold fill-slate-300" 
                                  style="font-family: 'Inter', sans-serif;">
                                📏 ${showAllLayers ? `Kedalaman: 0-${optimal.layers * boxDimensions.length} cm` : `${(currentLayer * boxDimensions.length)}-${((currentLayer + 1) * boxDimensions.length)} cm`}
                            </text>
                        </g>
                    </g>
                    

                </svg>
                
                <!-- Professional control panel -->
                <div class="mt-6 flex flex-col lg:flex-row justify-between items-center gap-4 p-4 bg-slate-800 rounded-xl">
                    <div class="flex items-center gap-4">
                        <div class="text-white font-semibold">🎮 Kontrol Visualisasi:</div>
                        <button onclick="ContainerCalculator.create2DVisualization()" 
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all">
                            🔄 Refresh
                        </button>
                    </div>
                    
                    ${showAllLayers ? `
                    <div class="flex items-center gap-4 text-slate-300 text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 bg-blue-500 rounded opacity-100"></div>
                            <span>Sap 1 (Depan)</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 bg-blue-500 rounded opacity-70"></div>
                            <span>Sap 2-3</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 bg-blue-500 rounded opacity-40"></div>
                            <span>Sap ${optimal.layers} (Belakang)</span>
                        </div>
                    </div>
                    ` : `
                    <div class="flex items-center gap-2 text-slate-300 text-sm">
                        <span>💡 Tips: Hover kotak untuk detail, gunakan layer controls untuk navigasi</span>
                    </div>
                    `}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    // Layer Control Functions
    function setupLayerControls() {
        if (!calculationResults) return;
        
        const { optimal } = calculationResults;
        
        // Show layer controls
        elements.layerControls.classList.remove('hidden');
        elements.layerControls.classList.add('jiffy-elastic');
        
        // Setup layer slider
        elements.layerSlider.max = optimal.layers;
        elements.layerDisplay.textContent = `1 / ${optimal.layers}`;
        
        // Create layer tabs
        elements.layerTabs.innerHTML = '';
        
        for (let i = 1; i <= optimal.layers; i++) {
            const tab = document.createElement('button');
            tab.className = `layer-tab px-4 py-2 text-sm font-semibold border-2 border-gray-200 ${i === 1 ? 'active' : ''} jiffy-hover-lift`;
            tab.textContent = `Sap ${i}`;
            tab.onclick = () => selectLayer(i);
            elements.layerTabs.appendChild(tab);
        }
    }

    function selectLayer(layerNum) {
        // Update slider
        elements.layerSlider.value = layerNum;
        elements.layerDisplay.textContent = `${layerNum} / ${calculationResults.optimal.layers}`;
        
        // Update active tab
        document.querySelectorAll('.layer-tab').forEach((tab, index) => {
            if (index + 1 === layerNum) {
                tab.classList.add('active');
                animateElement(tab, 'jiffy-bounce');
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
        elements.layerDisplay.textContent = `${layerNum} / ${calculationResults.optimal.layers}`;
        selectLayer(parseInt(layerNum));
    }

    function toggleLayerMode() {
        const showAll = elements.showAllLayers.checked;
        
        if (showAll) {
            elements.layerSlider.disabled = true;
            document.querySelectorAll('.layer-tab').forEach(tab => {
                tab.disabled = true;
                tab.classList.add('opacity-50');
            });
        } else {
            elements.layerSlider.disabled = false;
            document.querySelectorAll('.layer-tab').forEach(tab => {
                tab.disabled = false;
                tab.classList.remove('opacity-50');
            });
        }
        
        // Update visualization
        if (currentVisualizationMode === '3d') {
            createBoxes3D();
        } else {
            create2DVisualization();
        }
    }

    // Control Functions
    function resetCamera() {
        if (camera && controls) {
            camera.position.set(50, 50, 50);
            controls.reset();
            
            // Add animation feedback
            animateElement(event.target, 'jiffy-bounce');
            showAlert('Kamera direset ke posisi default', 'info');
        }
    }

    function toggleWireframe() {
        const wireframe = elements.wireframeMode.checked;
        
        boxMeshes.forEach(mesh => {
            mesh.material.wireframe = wireframe;
        });
        
        showAlert(wireframe ? 'Mode wireframe aktif' : 'Mode solid aktif', 'info');
    }

    function updateOpacity(value) {
        elements.opacityValue.textContent = value;
        
        boxMeshes.forEach(mesh => {
            mesh.material.opacity = parseFloat(value);
        });
    }

    function exportToPDF() {
        showAlert('Fitur export PDF sedang dalam pengembangan', 'info');
        animateElement(event.target, 'jiffy-pulse', 2000);
    }

    // Public API
    return {
        init,
        toggleContainerPanel,
        updateContainerVolume,
        calculateOptimalLayout,
        toggle3DVisualization,
        selectLayer,
        showSpecificLayer,
        toggleLayerMode,
        resetCamera,
        toggleWireframe,
        updateOpacity,
        exportToPDF,
        create2DVisualization
    };
})();

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    ContainerCalculator.init();
    
    // Add entrance animations to cards
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('jiffy-fade-in');
        }, index * 100);
    });

    // Add hover effects to interactive elements
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.classList.add('jiffy-hover-lift');
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('jiffy-hover-lift');
        });
    });

    // Add input field animations
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.classList.add('jiffy-zoom-in');
        });
        
        input.addEventListener('blur', function() {
            this.classList.remove('jiffy-zoom-in');
        });
    });
});
