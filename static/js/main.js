const canvas =
document.getElementById(
    "graphCanvas"
);

const ctx =
canvas.getContext("2d");

let graphData = null;

let courierPosition = null;

let courierRotation = 0;

let currentPath = [];

let currentVisited = [];

let visitedTimestamps = {};

let courierImage = null;

// Cached gradient objects for performance
let cachedGradients = {
    node: null,
    destination: null
};

// Animation variables
let animationTime = 0;
let particles = [];

function loadCourierImage(){

    courierImage =
    new Image();

    courierImage.src =
    "/static/img/car.png";

    courierImage.onload = () => {

        console.log(
            "Courier image loaded"
        );
    };
}

function sleep(ms){

    return new Promise(
        resolve =>
        setTimeout(resolve, ms)
    );
}

async function loadGraph(){

    const response =
    await fetch("/solve");

    graphData =
    await response.json();

    updateStats();

    drawGraph();
}

function updateStats(){

    document.getElementById(
        "nodesCount"
    ).innerText =
    graphData.nodes.length;

    document.getElementById(
        "edgesCount"
    ).innerText =
    graphData.edges.length;

    document.getElementById(
        "distance"
    ).innerText =
    graphData.distance;

    document.getElementById(
        "visitedCount"
    ).innerText =
    graphData.visited.length;

    document.getElementById(
        "executionTime"
    ).innerText =
    graphData.time + " ms";
    
    // Update source/destination info
    const sourceNode = getNode(graphData.source);
    const destNode = getNode(graphData.destination);
    
    document.getElementById(
        "currentSource"
    ).innerText = LOCATION_NAMES[sourceNode.id] || `Node ${sourceNode.id}`;
    
    document.getElementById(
        "currentDestination"
    ).innerText = LOCATION_NAMES[destNode.id] || `Node ${destNode.id}`;
}

const GRAPH_W = 1200;
const GRAPH_H = 700;

// Location names for nodes
const LOCATION_NAMES = ['Kampus', 'Ramayana', 'Pelantar', 'Bandara', 'Pantai', 'Senggarang'];

function scaleX(x){ return x * (canvas.width / GRAPH_W); }
function scaleY(y){ return y * (canvas.height / GRAPH_H); }

function getNode(id){

    return graphData.nodes.find(
        n => n.id === id
    );
}

function getEdgeWeight(nodeId1, nodeId2){
    // Find the weight from the graph data structure
    if(!graphData || !graphData.graph) return null;
    
    const neighbors = graphData.graph[nodeId1];
    if(!neighbors) return null;
    
    const edge = neighbors.find(e => e[0] === nodeId2);
    return edge ? edge[1] : null;
}

function drawGridBackground(){

    ctx.save();
    
    // Draw map-like background with gradient
    const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    bgGradient.addColorStop(0, '#1a2332');
    bgGradient.addColorStop(1, '#0d1117');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle grid like city blocks
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.08)';
    ctx.lineWidth = 1;
    
    // Vertical streets
    for(let x = 0; x < canvas.width; x += 60){
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal streets
    for(let y = 0; y < canvas.height; y += 60){
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw some random "buildings" as background decoration
    ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
    for(let i = 0; i < 20; i++){
        const x = (i * 137) % canvas.width;
        const y = (i * 241) % canvas.height;
        const w = 30 + (i * 17) % 40;
        const h = 30 + (i * 23) % 40;
        ctx.fillRect(x, y, w, h);
    }
    
    ctx.restore();
}

function drawGraph(){
    
    animationTime += 0.5;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // grid background
    drawGridBackground();

    // edge - Draw roads with realistic styling

    ctx.save();
    
    // STEP 1: Draw sidewalks (trotoar) - outer layer
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for(const edge of graphData.edges){
        const a = getNode(edge[0]);
        const b = getNode(edge[1]);

        ctx.beginPath();
        ctx.moveTo(scaleX(a.x), scaleY(a.y));
        ctx.lineTo(scaleX(b.x), scaleY(b.y));
        ctx.stroke();
    }
    
    // STEP 2: Draw sidewalk tiles pattern
    ctx.strokeStyle = "rgba(51, 65, 85, 0.5)";
    ctx.lineWidth = 16;
    ctx.setLineDash([5, 5]);

    for(const edge of graphData.edges){
        const a = getNode(edge[0]);
        const b = getNode(edge[1]);

        ctx.beginPath();
        ctx.moveTo(scaleX(a.x), scaleY(a.y));
        ctx.lineTo(scaleX(b.x), scaleY(b.y));
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // STEP 3: Draw road border (curb)
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 12;

    for(const edge of graphData.edges){
        const a = getNode(edge[0]);
        const b = getNode(edge[1]);

        ctx.beginPath();
        ctx.moveTo(scaleX(a.x), scaleY(a.y));
        ctx.lineTo(scaleX(b.x), scaleY(b.y));
        ctx.stroke();
    }
    
    // STEP 4: Draw road surface (asphalt)
    const roadGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    roadGradient.addColorStop(0, '#374151');
    roadGradient.addColorStop(0.5, '#475569');
    roadGradient.addColorStop(1, '#334155');
    
    ctx.strokeStyle = roadGradient;
    ctx.lineWidth = 10;

    for(const edge of graphData.edges){
        const a = getNode(edge[0]);
        const b = getNode(edge[1]);

        ctx.beginPath();
        ctx.moveTo(scaleX(a.x), scaleY(a.y));
        ctx.lineTo(scaleX(b.x), scaleY(b.y));
        ctx.stroke();
    }
    
    // STEP 5: Draw road lanes (yellow lines on sides)
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
    ctx.lineWidth = 1;

    for(const edge of graphData.edges){
        const a = getNode(edge[0]);
        const b = getNode(edge[1]);
        
        const dx = scaleX(b.x) - scaleX(a.x);
        const dy = scaleY(b.y) - scaleY(a.y);
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / len * 4;
        const perpY = dx / len * 4;

        // Left lane
        ctx.beginPath();
        ctx.moveTo(scaleX(a.x) + perpX, scaleY(a.y) + perpY);
        ctx.lineTo(scaleX(b.x) + perpX, scaleY(b.y) + perpY);
        ctx.stroke();
        
        // Right lane
        ctx.beginPath();
        ctx.moveTo(scaleX(a.x) - perpX, scaleY(a.y) - perpY);
        ctx.lineTo(scaleX(b.x) - perpX, scaleY(b.y) - perpY);
        ctx.stroke();
    }
    
    // STEP 6: Draw static center line (white dashed) - NO ANIMATION
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.lineDashOffset = 0; // Static, no animation

    for(const edge of graphData.edges){
        const a = getNode(edge[0]);
        const b = getNode(edge[1]);

        ctx.beginPath();
        ctx.moveTo(scaleX(a.x), scaleY(a.y));
        ctx.lineTo(scaleX(b.x), scaleY(b.y));
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // STEP 7: Draw street lights along roads - STATIC GLOW
    for(const edge of graphData.edges){
        const a = getNode(edge[0]);
        const b = getNode(edge[1]);
        
        const dx = scaleX(b.x) - scaleX(a.x);
        const dy = scaleY(b.y) - scaleY(a.y);
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / len * 10;
        const perpY = dx / len * 10;
        
        const numLights = Math.floor(len / 80);
        
        for(let i = 1; i <= numLights; i++){
            const t = i / (numLights + 1);
            const lx = scaleX(a.x) + dx * t + perpX;
            const ly = scaleY(a.y) + dy * t + perpY;
            
            // Street light pole
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx, ly - 15);
            ctx.stroke();
            
            // Light glow - STATIC
            ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
            ctx.beginPath();
            ctx.arc(lx, ly - 15, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Light bulb - STATIC
            ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
            ctx.beginPath();
            ctx.arc(lx, ly - 15, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // STEP 8: Draw edge weight labels with better styling
    ctx.shadowBlur = 0;
    for(const edge of graphData.edges){
        const a = getNode(edge[0]);
        const b = getNode(edge[1]);
        
        const weight = getEdgeWeight(edge[0], edge[1]);
        if(weight !== null) {
            const midX = scaleX((a.x + b.x) / 2);
            const midY = scaleY((a.y + b.y) / 2);
            
            // Draw background badge
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
            ctx.lineWidth = 2;
            
            const badgeWidth = 50;
            const badgeHeight = 22;
            const radius = 11;
            
            ctx.beginPath();
            ctx.roundRect(midX - badgeWidth/2, midY - badgeHeight/2, badgeWidth, badgeHeight, radius);
            ctx.fill();
            ctx.stroke();
            
            // Draw text
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 11px Inter, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(weight + ' km', midX, midY);
        }
    }
    
    ctx.restore();

    // visited

    for(
        const nodeId
        of currentVisited
    ){

        const node =
        getNode(nodeId);

        const timestamp =
        visitedTimestamps[nodeId] || 0;

        const elapsed =
        Date.now() - timestamp;

        const echoRadius = 8 +
        (elapsed / 30);

        const maxEchoRadius = 40;

        if(
            echoRadius <
            maxEchoRadius
        ){

            const opacity =
            1 -
            (echoRadius / maxEchoRadius);

            ctx.save();
            ctx.strokeStyle =
            `rgba(59, 130, 246, ${opacity})`;

            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(59, 130, 246, ${opacity * 0.8})`;

            ctx.beginPath();

            ctx.arc(
                scaleX(node.x),
                scaleY(node.y),
                echoRadius,
                0,
                Math.PI * 2
            );

            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        
        // Pulsing glow effect
        const pulseTime = Date.now() % 1000;
        const pulseIntensity = 0.5 + (Math.sin(pulseTime / 1000 * Math.PI * 2) * 0.3);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(59, 130, 246, ${pulseIntensity})`;
        ctx.fillStyle = "#3b82f6";

        ctx.beginPath();

        ctx.arc(
            scaleX(node.x),
            scaleY(node.y),
            8,
            0,
            Math.PI * 2
        );

        ctx.fill();
        ctx.restore();
    }

    // path - Draw shortest path with animated glow

    ctx.save();
    
    // Draw glowing path base
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';

    for(let i = 0; i < currentPath.length - 1; i++){
        const a = getNode(currentPath[i]);
        const b = getNode(currentPath[i + 1]);

        // Animated gradient
        const gradient = ctx.createLinearGradient(
            scaleX(a.x), scaleY(a.y),
            scaleX(b.x), scaleY(b.y)
        );
        
        const pulseGlow = 0.7 + Math.sin(animationTime / 10) * 0.3;
        gradient.addColorStop(0, `rgba(34, 197, 94, ${pulseGlow})`);
        gradient.addColorStop(0.5, '#22c55e');
        gradient.addColorStop(1, `rgba(16, 185, 129, ${pulseGlow})`);
        
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(scaleX(a.x), scaleY(a.y));
        ctx.lineTo(scaleX(b.x), scaleY(b.y));
        ctx.stroke();
    }
    
    // Draw animated dashed overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = animationTime * 2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    
    for(let i = 0; i < currentPath.length - 1; i++){
        const a = getNode(currentPath[i]);
        const b = getNode(currentPath[i + 1]);
        
        ctx.beginPath();
        ctx.moveTo(scaleX(a.x), scaleY(a.y));
        ctx.lineTo(scaleX(b.x), scaleY(b.y));
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
    ctx.restore();

    // nodes - Draw as buildings/locations

    for(const node of graphData.nodes){

        ctx.save();
        
        const x = scaleX(node.x);
        const y = scaleY(node.y);
        
        // Draw building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw building base
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw building detail (like a pin marker)
        const pinGradient = ctx.createRadialGradient(x, y - 3, 0, x, y - 3, 10);
        pinGradient.addColorStop(0, '#475569');
        pinGradient.addColorStop(1, '#334155');
        
        ctx.fillStyle = pinGradient;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner circle
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(148, 163, 184, 0.5)';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    // source

    const source =
    getNode(
        graphData.source
    );

    ctx.save();
    
    // Animated pulse for source
    const pulseTime = Date.now() % 1500;
    const pulseScale = 1 + (Math.sin(pulseTime / 1500 * Math.PI * 2) * 0.15);
    
    // Double ring effect
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
    
    ctx.beginPath();
    ctx.arc(
        scaleX(source.x),
        scaleY(source.y),
        18 * pulseScale,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(
        scaleX(source.x),
        scaleY(source.y),
        24 * pulseScale,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    
    // Inner filled circle
    ctx.fillStyle = '#facc15';
    ctx.shadowBlur = 15;

    ctx.beginPath();

    ctx.arc(
        scaleX(source.x),
        scaleY(source.y),
        12,
        0,
        Math.PI * 2
    );

    ctx.fill();
    
    // Draw location name
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 12px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(LOCATION_NAMES[source.id] || `Node ${source.id}`, scaleX(source.x), scaleY(source.y) + 20);
    
    ctx.restore();

    // destination

    const destination =
    getNode(
        graphData.destination
    );

    ctx.save();
    
    // Animated pulse for destination
    const destPulseTime = Date.now() % 1200;
    const destPulseScale = 1 + (Math.sin(destPulseTime / 1200 * Math.PI * 2) * 0.2);
    const destPulseOpacity = 0.5 + (Math.sin(destPulseTime / 1200 * Math.PI * 2) * 0.3);
    
    // Outer glow ring
    ctx.strokeStyle = `rgba(239, 68, 68, ${destPulseOpacity})`;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
    
    ctx.beginPath();
    ctx.arc(
        scaleX(destination.x),
        scaleY(destination.y),
        20 * destPulseScale,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    
    // Inner filled circle with gradient
    const destGradient = ctx.createRadialGradient(
        scaleX(destination.x), scaleY(destination.y), 0,
        scaleX(destination.x), scaleY(destination.y), 12
    );
    destGradient.addColorStop(0, '#fca5a5');
    destGradient.addColorStop(1, '#ef4444');
    
    ctx.fillStyle = destGradient;
    ctx.shadowBlur = 15;

    ctx.beginPath();

    ctx.arc(
        scaleX(destination.x),
        scaleY(destination.y),
        12,
        0,
        Math.PI * 2
    );

    ctx.fill();
    
    // Draw location name
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fecaca';
    ctx.font = 'bold 12px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(LOCATION_NAMES[destination.id] || `Node ${destination.id}`, scaleX(destination.x), scaleY(destination.y) + 20);
    
    ctx.restore();

    drawCourier();
    drawParticles();
}

// Particle system for exhaust effects
function createParticle(x, y) {
    particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1.0,
        size: 2 + Math.random() * 3
    });
}

function updateParticles() {
    for(let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.size *= 0.95;
        
        if(p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    ctx.save();
    for(const p of particles) {
        ctx.fillStyle = `rgba(100, 116, 139, ${p.life * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    updateParticles();
}

function drawCourier(){

    if(
        !courierPosition ||
        !courierImage
    ) return;

    const width = 48;
    const height = 48;
    
    // Create exhaust particles
    if(Math.random() < 0.3) {
        const backX = courierPosition.x - Math.cos(courierRotation) * 20;
        const backY = courierPosition.y - Math.sin(courierRotation) * 20;
        createParticle(backX, backY);
    }

    ctx.save();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
        courierPosition.x + 3,
        courierPosition.y + 3,
        width / 2 - 5,
        height / 4,
        courierRotation,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.translate(
        courierPosition.x,
        courierPosition.y
    );

    ctx.rotate(courierRotation);
    
    // Draw glow around car
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';

    ctx.drawImage(

        courierImage,

        -width / 2,

        -height / 2,

        width,

        height
    );

    ctx.restore();
}

async function startDelivery(){

    currentVisited = [];
    currentPath = [];
    visitedTimestamps = {};

    const animationInterval =
    setInterval(
        drawGraph,
        30
    );

    for(
        const node
        of graphData.visited
    ){

        currentVisited.push(
            node
        );

        visitedTimestamps[node] =
        Date.now();

        await sleep(150);
    }

    for(
        const node
        of graphData.path
    ){

        currentPath.push(
            node
        );

        await sleep(150);
    }

    clearInterval(
        animationInterval
    );

    await animateCourier();
}

async function animateCourier(){

    const path =
    graphData.path;
    
    // Constant speed in pixels per millisecond
    const speed = 0.3; // adjust this for faster/slower movement

    for(
        let i = 0;
        i < path.length - 1;
        i++
    ){

        const a =
        getNode(path[i]);

        const b =
        getNode(path[i+1]);

        // Calculate rotation using scaled coordinates
        const scaledAx = scaleX(a.x);
        const scaledAy = scaleY(a.y);
        const scaledBx = scaleX(b.x);
        const scaledBy = scaleY(b.y);

        const dx = scaledBx - scaledAx;
        const dy = scaledBy - scaledAy;
        
        // Calculate distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate duration based on distance to maintain constant speed
        const duration = distance / speed;
        const frameTime = 25; // milliseconds per frame
        const frames = Math.max(1, Math.ceil(duration / frameTime));
        const step = 1 / frames;

        courierRotation =
        Math.atan2(dy, dx);

        for(
            let t = 0;
            t <= 1;
            t += step
        ){

            courierPosition = {

                x: scaledAx + dx * t,

                y: scaledAy + dy * t
            };

            drawGraph();

            await sleep(frameTime);
        }
        
        // Ensure we reach the exact end point
        courierPosition = {
            x: scaledBx,
            y: scaledBy
        };
        drawGraph();
    }
}

document
.getElementById("sourceBtn")
.addEventListener(
    "click",
    async () => {

        console.log("SOURCE CLICK");

        const response =
        await fetch("/random-source");

        const data =
        await response.json();

        console.log(data);

        await loadGraph();
    }
);

const startBtn =
document.getElementById("startBtn");

if(startBtn){

    startBtn.addEventListener(
        "click",
        async () => {

            console.log("START CLICK");

            await startDelivery();
        }
    );
}

const clearBtn =
document.getElementById("clearBtn");

if(clearBtn){

    clearBtn.addEventListener(
        "click",
        () => {

            console.log("CLEAR CLICK");

            currentVisited = [];
            currentPath = [];
            courierPosition = null;

            drawGraph();
        }
    );
}

document
.getElementById(
    "mapBtn"
)
.addEventListener(
    "click",
    async () => {

        await fetch(
            "/new-map"
        );

        await loadGraph();
    }
);

document
.getElementById(
    "destinationBtn"
)
.addEventListener(
    "click",
    async () => {

        await fetch(
            "/random-destination"
        );

        await loadGraph();
    }
);

