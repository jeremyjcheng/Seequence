// Diagram Renderer for Seequence Chrome extension
// Handles D3.js-based visualization of AI-generated diagram data

class DiagramRenderer {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.svg = null;
    this.width = 0;
    this.height = 0;
    this.currentData = null;
    this.currentType = "flowchart";
  }

  // Initialize the diagram container
  initialize() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      throw new Error(`Container with id '${this.containerId}' not found`);
    }

    // Set dimensions based on container
    this.width = this.container.clientWidth || 400;
    this.height = this.container.clientHeight || 300;

    // Create SVG element
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .style("background", "#ffffff")
      .style("border-radius", "8px")
      .style("border", "1px solid #e1e5e9");

    // Add zoom behavior
    this.addZoomBehavior();

    console.log("Diagram renderer initialized");
  }

  // Add zoom and pan functionality
  addZoomBehavior() {
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        this.svg.select("g").attr("transform", event.transform);
      });

    this.svg.call(zoom);
  }

  // Render diagram based on type
  render(data, type = "auto") {
    if (!this.svg) {
      this.initialize();
    }

    this.currentData = data;
    this.currentType = type === "auto" ? data.layout : type;

    // Clear previous content
    this.svg.selectAll("*").remove();
    this.addZoomBehavior();

    // Create main group for transformations
    const g = this.svg.append("g");

    switch (this.currentType) {
      case "flowchart":
        this.renderFlowchart(g, data);
        break;
      case "mindmap":
        this.renderMindmap(g, data);
        break;
      case "timeline":
        this.renderTimeline(g, data);
        break;
      case "compare":
        this.renderCompare(g, data);
        break;
      default:
        this.renderFlowchart(g, data);
    }

    console.log(
      `Rendered ${this.currentType} diagram with ${data.nodes.length} nodes`
    );
  }

  // Render flowchart layout
  renderFlowchart(g, data) {
    const { nodes, edges } = data;

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(edges)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Create links
    const link = g
      .append("g")
      .selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .attr("stroke", "#666")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrowhead)");

    // Add arrowhead marker
    this.svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#666");

    // Create nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Add node circles
    node
      .append("circle")
      .attr("r", 20)
      .attr("fill", "#4A90E2")
      .attr("stroke", "#2E5BBA")
      .attr("stroke-width", 2);

    // Add node labels
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "#ffffff")
      .text((d) => this.truncateText(d.label, 15));

    // Add node tooltips
    node.append("title").text((d) => d.content || d.label);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }

  // Render mind map layout
  renderMindmap(g, data) {
    const { nodes, edges } = data;

    // Create hierarchical layout
    const root = this.createHierarchy(nodes, edges);
    const treeLayout = d3.tree().size([this.height - 100, this.width - 200]);
    treeLayout(root);

    // Create links
    const link = g
      .append("g")
      .selectAll("path")
      .data(root.links())
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#666")
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d) => d.y + 100)
          .y((d) => d.x + 50)
      );

    // Create nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.y + 100},${d.x + 50})`);

    // Add node circles
    node
      .append("circle")
      .attr("r", (d) => (d.depth === 0 ? 25 : 18))
      .attr("fill", (d) => (d.depth === 0 ? "#E74C3C" : "#3498DB"))
      .attr("stroke", (d) => (d.depth === 0 ? "#C0392B" : "#2980B9"))
      .attr("stroke-width", 2);

    // Add node labels
    node
      .append("text")
      .attr("text-anchor", (d) => (d.children ? "middle" : "start"))
      .attr("x", (d) => (d.children ? 0 : 25))
      .attr("dy", ".35em")
      .attr("font-size", (d) => (d.depth === 0 ? "14px" : "12px"))
      .attr("font-weight", (d) => (d.depth === 0 ? "bold" : "normal"))
      .attr("fill", "#ffffff")
      .text((d) => this.truncateText(d.data.label, d.depth === 0 ? 20 : 15));

    // Add tooltips
    node.append("title").text((d) => d.data.content || d.data.label);
  }

  // Render timeline layout
  renderTimeline(g, data) {
    const { nodes } = data;
    const timelineHeight = this.height - 100;
    const timelineWidth = this.width - 100;
    const stepWidth = timelineWidth / (nodes.length - 1);

    // Create timeline line
    g.append("line")
      .attr("x1", 50)
      .attr("y1", timelineHeight / 2)
      .attr("x2", timelineWidth + 50)
      .attr("y2", timelineHeight / 2)
      .attr("stroke", "#666")
      .attr("stroke-width", 3);

    // Create nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr(
        "transform",
        (d, i) => `translate(${50 + i * stepWidth},${timelineHeight / 2})`
      );

    // Add node circles
    node
      .append("circle")
      .attr("r", 15)
      .attr("fill", "#E67E22")
      .attr("stroke", "#D35400")
      .attr("stroke-width", 2);

    // Add node labels
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", -25)
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#333")
      .text((d) => this.truncateText(d.label, 20));

    // Add step numbers
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 30)
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .text((d, i) => `Step ${i + 1}`);

    // Add tooltips
    node.append("title").text((d) => d.content || d.label);
  }

  // Render comparison layout
  renderCompare(g, data) {
    const { nodes } = data;
    const midX = this.width / 2;
    const leftX = midX - 150;
    const rightX = midX + 150;
    const startY = 100;
    const stepY = (this.height - 200) / Math.max(nodes.length - 1, 1);

    // Create comparison line
    g.append("line")
      .attr("x1", midX)
      .attr("y1", 50)
      .attr("x2", midX)
      .attr("y2", this.height - 50)
      .attr("stroke", "#666")
      .attr("stroke-width", 2);

    // Create nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", (d, i) => {
        const x = i % 2 === 0 ? leftX : rightX;
        const y = startY + Math.floor(i / 2) * stepY;
        return `translate(${x},${y})`;
      });

    // Add node rectangles
    node
      .append("rect")
      .attr("width", 120)
      .attr("height", 40)
      .attr("x", -60)
      .attr("y", -20)
      .attr("rx", 8)
      .attr("fill", "#9B59B6")
      .attr("stroke", "#8E44AD")
      .attr("stroke-width", 2);

    // Add node labels
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#ffffff")
      .text((d) => this.truncateText(d.label, 15));

    // Add tooltips
    node.append("title").text((d) => d.content || d.label);
  }

  // Create hierarchy for tree layouts
  createHierarchy(nodes, edges) {
    const nodeMap = new Map();
    const root = { id: "root", children: [] };

    // Create node map
    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Build hierarchy
    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (source && target) {
        source.children.push(target);
      }
    });

    // Find root nodes (nodes with no incoming edges)
    const hasIncoming = new Set(edges.map((e) => e.target));
    const rootNodes = nodes.filter((n) => !hasIncoming.has(n.id));

    if (rootNodes.length > 0) {
      root.children = rootNodes.map((n) => nodeMap.get(n.id));
    } else if (nodes.length > 0) {
      root.children = [nodeMap.get(nodes[0].id)];
    }

    return d3.hierarchy(root);
  }

  // Utility function to truncate text
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  // Switch diagram type
  switchType(newType) {
    if (this.currentData) {
      this.render(this.currentData, newType);
    }
  }

  // Export diagram as SVG
  exportSVG() {
    if (!this.svg) return null;

    const svgData = new XMLSerializer().serializeToString(this.svg.node());
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    return URL.createObjectURL(svgBlob);
  }

  // Export diagram as PNG
  exportPNG() {
    if (!this.svg) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = this.width;
        canvas.height = this.height;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(resolve, "image/png");
      };

      const svgData = new XMLSerializer().serializeToString(this.svg.node());
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    });
  }

  // Resize diagram
  resize(width, height) {
    this.width = width;
    this.height = height;

    if (this.svg) {
      this.svg.attr("width", width).attr("height", height);
      if (this.currentData) {
        this.render(this.currentData, this.currentType);
      }
    }
  }

  // Clear diagram
  clear() {
    if (this.svg) {
      this.svg.selectAll("*").remove();
    }
    this.currentData = null;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = DiagramRenderer;
} else {
  window.DiagramRenderer = DiagramRenderer;
}
