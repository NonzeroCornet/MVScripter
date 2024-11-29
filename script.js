const canvas = document.getElementById("blueprint-canvas");
const ctx = canvas.getContext("2d");

// Canvas size and offsets
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let dragStartX = 0;
let dragStartY = 0;

// Nodes array to track all created nodes
const nodes = [];
let activeNode = null; // Currently active node
let isConnecting = false; // Flag for connecting nodes
let connectionStart = null; // Starting point of a connection

function drawElbowCurve(x1, y1, x2, y2) {
  ctx.beginPath();
  if (x1 == x2) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return;
  }
  // Loop through x values from x1 to x2
  x1 <= x2 ? ctx.moveTo(x1, y1) : ctx.moveTo(x2, y2); // Start at the left point

  // Define the parameters of the tanh function
  const amplitude = (y1 - y2) / 2;
  const verticalShift = (y1 + y2) / 2;
  const steepness = 7 / (x1 - x2); // This affects how fast the curve rises

  // Loop through all x values between x1 and x2
  for (let x = x1 <= x2 ? x1 : x2; x <= (x1 <= x2 ? x2 : x1); x++) {
    // Calculate the y value using the tanh-based function
    const y =
      amplitude * Math.tanh(steepness * (x - (x1 + x2) / 2)) + verticalShift;

    // Plot the calculated point
    ctx.lineTo(x, y);
  }

  // Complete the path and draw the curve
  ctx.stroke();
}

// Function to render the grid
const drawWorld = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fill background
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  const gridSize = 20;
  ctx.beginPath();
  for (let x = offsetX % gridSize; x < canvas.width; x += gridSize) {
    ctx.clearRect(x, 0, 2, canvas.height); // Clears vertical grid lines
  }
  for (let y = offsetY % gridSize; y < canvas.height; y += gridSize) {
    ctx.clearRect(0, y, canvas.width, 2); // Clears horizontal grid lines
  }

  // Draw all nodes
  nodes.forEach((node) => node.draw());

  // Draw connections
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  nodes.forEach((node) => {
    node.connections.forEach(({ outputIndex, targetNode, inputIndex }) => {
      const startX = node.x + offsetX + node.width; // Output position
      const startY = node.y + offsetY + 40 + outputIndex * 20; // Output position
      const endX = targetNode.x + offsetX; // Input position
      const endY = targetNode.y + offsetY + 40 + inputIndex * 20; // Input position
      drawElbowCurve(startX, startY, endX, endY);
    });
  });
};

// Node class
class Node {
  constructor(x, y, name, width, height, inputs, outputs, compile) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.width = width;
    this.height = height;
    this.inputs = inputs;
    this.outputs = outputs;
    this.compile = compile;
    this.connections = [];
    this.isDragging = false;
  }

  // Draw the node
  draw() {
    // Draw the card
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.moveTo(this.x + offsetX + 10, this.y + offsetY); // Start at the top left corner, but with a 10px radius
    ctx.arcTo(
      this.x + offsetX + this.width,
      this.y + offsetY,
      this.x + offsetX + this.width,
      this.y + offsetY + this.height,
      10
    ); // Top-right corner
    ctx.arcTo(
      this.x + offsetX + this.width,
      this.y + offsetY + this.height,
      this.x + offsetX,
      this.y + offsetY + this.height,
      10
    ); // Bottom-right corner
    ctx.arcTo(
      this.x + offsetX,
      this.y + offsetY + this.height,
      this.x + offsetX,
      this.y + offsetY,
      10
    ); // Bottom-left corner
    ctx.arcTo(
      this.x + offsetX,
      this.y + offsetY,
      this.x + offsetX + this.width,
      this.y + offsetY,
      10
    ); // Top-left corner
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#555";
    ctx.beginPath();
    ctx.roundRect(
      this.x + offsetX,
      this.y + offsetY,
      this.width,
      this.height,
      10
    );
    ctx.stroke();

    // Draw the title
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.fillText(this.name, this.x + offsetX + 10, this.y + offsetY + 20);

    // Draw inputs with labels
    this.inputs.forEach((input, index) => {
      const inputX = this.x + offsetX;
      const inputY = this.y + offsetY + 40 + index * 20;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(inputX, inputY, 5, 1.5 * Math.PI, 0.5 * Math.PI);
      ctx.fill();
      ctx.fillText(input, inputX + 10, inputY + 4);
    });

    // Draw outputs with labels
    this.outputs.forEach((output, index) => {
      const outputX = this.x + offsetX + this.width;
      const outputY = this.y + offsetY + 40 + index * 20;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(outputX, outputY, 5, 0.5 * Math.PI, 1.5 * Math.PI);
      ctx.fill();
      ctx.fillText(
        output,
        outputX - ctx.measureText(output).width - 10,
        outputY + 4
      );
    });
  }

  // Check if a point is inside the node's bounding box
  isPointInside(px, py) {
    return (
      px >= this.x + offsetX &&
      px <= this.x + offsetX + this.width &&
      py >= this.y + offsetY &&
      py <= this.y + offsetY + this.height
    );
  }

  // Check if a point is over an input or output
  getInputIndexAt(px, py) {
    return this.inputs.findIndex((_, index) => {
      const inputX = this.x + offsetX;
      const inputY = this.y + offsetY + 40 + index * 20;
      return Math.hypot(inputX - px, inputY - py) < 5;
    });
  }

  getOutputIndexAt(px, py) {
    return this.outputs.findIndex((_, index) => {
      const outputX = this.x + offsetX + this.width - 5;
      const outputY = this.y + offsetY + 40 + index * 20;
      return Math.hypot(outputX - px, outputY - py) < 5;
    });
  }
}

// Add new node on "+" button click
document.getElementById("add-button").addEventListener("click", async () => {
  let obj = {};
  Object.keys(NODETYPES).forEach((elem) => {
    obj[elem] = elem;
  });
  const { value: node } = await Swal.fire({
    title: "New Node",
    input: "select",
    inputOptions: obj,
    inputPlaceholder: "Select a Node Type",
    showCancelButton: true,
    inputValidator: (value) => {
      return new Promise((resolve) => {
        if (value === "") {
          resolve("You need to select a node type");
        } else {
          resolve();
        }
      });
    },
  });
  if (node) {
    const centerX = canvas.width / 2 - offsetX - 60;
    const centerY = canvas.height / 2 - offsetY - 50;
    const newNode = new Node(
      centerX,
      centerY,
      node,
      NODETYPES[node].width,
      NODETYPES[node].height,
      NODETYPES[node].inputs,
      NODETYPES[node].outputs,
      NODETYPES[node].compile
    );
    nodes.push(newNode);
    drawWorld();
  }
});

// Mouse events
canvas.addEventListener("mousedown", (event) => {
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  // Check if clicking on a node
  activeNode = nodes
    .slice()
    .reverse()
    .find((node) => node.isPointInside(mouseX, mouseY));

  if (activeNode) {
    const [element] = nodes.splice(nodes.indexOf(activeNode), 1);
    nodes.push(element);
    const outputIndex = activeNode.getOutputIndexAt(mouseX, mouseY);
    if (outputIndex !== -1) {
      // Start connection from this output
      isConnecting = true;
      connectionStart = { node: activeNode, outputIndex };
    } else {
      // If not on output, start dragging the node
      activeNode.isDragging = true;
      dragStartX = mouseX - activeNode.x;
      dragStartY = mouseY - activeNode.y;
    }
  } else {
    // Start panning the canvas
    isPanning = true;
    dragStartX = mouseX - offsetX;
    dragStartY = mouseY - offsetY;
  }
});

const glow = document.getElementById("glow");
canvas.addEventListener("mousemove", (event) => {
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  glow.style.left = mouseX - 500 + "px";
  glow.style.top = mouseY - 500 + "px";

  if (isConnecting) {
    // Draw the connection line temporarily while dragging
    const startX =
      connectionStart.node.x + offsetX + connectionStart.node.width; // Output position
    const startY =
      connectionStart.node.y + offsetY + 40 + connectionStart.outputIndex * 20; // Output position
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before redrawing
    drawWorld(); // Redraw the world (nodes, grid, etc.)
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    drawElbowCurve(startX, startY, mouseX, mouseY);
  } else if (activeNode && activeNode.isDragging) {
    // Drag the node
    activeNode.x = mouseX - dragStartX;
    activeNode.y = mouseY - dragStartY;
    drawWorld();
  } else if (isPanning) {
    // Pan the canvas
    offsetX = mouseX - dragStartX;
    offsetY = mouseY - dragStartY;
    drawWorld();
  }
});

canvas.addEventListener("mouseup", (event) => {
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  if (isConnecting) {
    // Find the target node to connect to
    const targetNode = nodes.find((node) => node.isPointInside(mouseX, mouseY));
    if (targetNode) {
      // Find the input index on the target node
      const inputIndex = targetNode.getInputIndexAt(mouseX, mouseY);
      if (inputIndex !== -1) {
        // Finalize the connection between the nodes
        connectionStart.node.connections.push({
          targetNode,
          outputIndex: connectionStart.outputIndex,
          inputIndex,
        });
      }
    }
    // Reset the connecting flag and redraw the canvas
    isConnecting = false;
    connectionStart = null;
  }

  // Stop dragging or panning
  if (activeNode) activeNode.isDragging = false;
  isPanning = false;
  activeNode = null;
  drawWorld();
});

// Right-click event listener to delete a node
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault(); // Prevent the default right-click menu

  const mouseX = event.clientX;
  const mouseY = event.clientY;

  const activeNode = nodes.find((node) => node.isPointInside(mouseX, mouseY));

  if (activeNode) {
    const outputIndex = activeNode.getOutputIndexAt(mouseX, mouseY);
    if (outputIndex !== -1) {
      let connectionIndex = activeNode.connections.findIndex((elem) => {
        return elem.outputIndex == outputIndex;
      });
      if (connectionIndex != -1) {
        activeNode.connections.splice(connectionIndex, 1);
        drawWorld();
      }
    } else {
      // Remove the node from the nodes array
      const nodeIndex = nodes.indexOf(activeNode);
      if (nodeIndex !== -1) {
        nodes.splice(nodeIndex, 1);
      }
      drawWorld();
    }
  }
});

// Resize the canvas
const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawWorld();
  drawWorld();
};
window.addEventListener("resize", resizeCanvas);

// Initial render
resizeCanvas();
