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
