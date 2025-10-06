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
      .scaleExtent([0.2, 5]) // Better zoom range
      .on("zoom", (event) => {
        this.svg.select("g").attr("transform", event.transform);
      });

    this.svg.call(zoom);

    // Add double-click to reset zoom
    this.svg.on("dblclick.zoom", null); // Disable default double-click zoom
    this.svg.on("dblclick", () => {
      this.svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });
  }

  // Get node styling based on content type and node type
  getNodeStyle(node, contentType) {
    const baseStyle = {
      fill: "#4A90E2",
      stroke: "#2E5BBA",
      strokeWidth: 2,
      radius: 25,
    };

    // Style based on node type
    if (node.nodeType === "step") {
      return {
        ...baseStyle,
        fill: "#FF6B6B",
        stroke: "#E53E3E",
        radius: 30,
      };
    } else if (node.nodeType === "comparison") {
      return {
        ...baseStyle,
        fill: "#4ECDC4",
        stroke: "#38B2AC",
        radius: 28,
      };
    } else if (node.nodeType === "category") {
      return {
        ...baseStyle,
        fill: "#45B7D1",
        stroke: "#3182CE",
        radius: 26,
      };
    }

    // Style based on content type
    switch (contentType) {
      case "sequential":
      case "narrative":
        return {
          ...baseStyle,
          fill: "#FF6B6B",
          stroke: "#E53E3E",
        };
      case "comparative":
        return {
          ...baseStyle,
          fill: "#4ECDC4",
          stroke: "#38B2AC",
        };
      case "hierarchical":
        return {
          ...baseStyle,
          fill: "#45B7D1",
          stroke: "#3182CE",
        };
      case "causal":
        return {
          ...baseStyle,
          fill: "#F6AD55",
          stroke: "#ED8936",
        };
      default:
        return baseStyle;
    }
  }

  // Get edge styling based on relationship type
  getEdgeStyle(edge) {
    const baseStyle = {
      stroke: "#666",
      strokeWidth: 2,
      strokeOpacity: 0.6,
    };

    switch (edge.type) {
      case "sequence":
        return {
          ...baseStyle,
          stroke: "#FF6B6B",
          strokeWidth: 3,
          strokeDasharray: "none",
        };
      case "causal":
        return {
          ...baseStyle,
          stroke: "#F6AD55",
          strokeWidth: 3,
          strokeDasharray: "5,5",
        };
      case "comparison":
        return {
          ...baseStyle,
          stroke: "#4ECDC4",
          strokeWidth: 2,
          strokeDasharray: "10,5",
        };
      case "hierarchy":
        return {
          ...baseStyle,
          stroke: "#45B7D1",
          strokeWidth: 2,
          strokeDasharray: "none",
        };
      default:
        return baseStyle;
    }
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
      case "layered":
        this.renderWithElk(g, data, { algorithm: "layered" });
        break;
      case "radial":
        this.renderWithElk(g, data, { algorithm: "radial" });
        break;
      default:
        this.renderFlowchart(g, data);
    }

    console.log(
      `Rendered ${this.currentType} diagram with ${data.nodes.length} nodes`
    );
  }

  // Use ELK (if available) to compute node coordinates, then draw with D3
  async renderWithElk(g, data, options = {}) {
    const hasElk =
      typeof window !== "undefined" &&
      (window.ELK || window.elk || window.elkjs);
    if (!hasElk) {
      console.warn("ELK not available; falling back to flowchart");
      this.renderFlowchart(g, data);
      return;
    }

    const ELK = window.ELK || window.elk || window.elkjs;
    const elk = new ELK();

    const elkGraph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm":
          options.algorithm === "radial"
            ? "org.eclipse.elk.radial"
            : "org.eclipse.elk.layered",
        "elk.direction": "RIGHT",
        "elk.spacing.nodeNode": "40",
        "elk.spacing.edgeEdge": "20",
        "elk.layered.spacing.nodeNodeBetweenLayers": "60",
      },
      children: data.nodes.map((n) => ({
        id: n.id,
        width: 160,
        height: 60,
        labels: [{ text: n.label }],
      })),
      edges: data.edges.map((e, i) => ({
        id: e.id || `e_${i}`,
        sources: [e.source],
        targets: [e.target],
      })),
    };

    try {
      const layout = await elk.layout(elkGraph);

      const nodeById = new Map(layout.children.map((c) => [c.id, c]));

      // Draw edges
      g.append("g")
        .selectAll("line")
        .data(layout.edges)
        .enter()
        .append("line")
        .attr("stroke", "#666")
        .attr("stroke-width", 2)
        .attr("x1", (d) => nodeById.get(d.sources[0]).x + 80)
        .attr("y1", (d) => nodeById.get(d.sources[0]).y + 30)
        .attr("x2", (d) => nodeById.get(d.targets[0]).x + 80)
        .attr("y2", (d) => nodeById.get(d.targets[0]).y + 30);

      // Draw nodes
      const nodes = g
        .append("g")
        .selectAll("g")
        .data(layout.children)
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

      nodes
        .append("rect")
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("width", (d) => d.width)
        .attr("height", (d) => d.height)
        .attr("fill", "#ffffff")
        .attr("stroke", "#cbd5e1");

      nodes
        .append("text")
        .attr("x", 80)
        .attr("y", 34)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#111827")
        .text((d) => (d.labels && d.labels[0] ? d.labels[0].text : d.id));
    } catch (e) {
      console.error("ELK layout failed, falling back:", e);
      this.renderFlowchart(g, data);
    }
  }

  // Render flowchart layout
  renderFlowchart(g, data) {
    const { nodes, edges } = data;

    // Create force simulation with better spacing
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(edges)
          .id((d) => d.id)
          .distance(200) // Increased from 100 to 200
      )
      .force("charge", d3.forceManyBody().strength(-800)) // Increased repulsion
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("collision", d3.forceCollide().radius(100)) // Increased collision radius for larger nodes
      .force("x", d3.forceX(this.width / 2).strength(0.1)) // Keep nodes centered horizontally
      .force("y", d3.forceY(this.height / 2).strength(0.1)); // Keep nodes centered vertically

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

    // Add node circles with dynamic sizing based on content
    node
      .append("circle")
      .attr("r", (d) =>
        Math.max(30, Math.min(50, d.content ? d.content.length / 3 : 30))
      )
      .attr("fill", (d) => this.getNodeStyle(d, data.type).fill)
      .attr("stroke", (d) => this.getNodeStyle(d, data.type).stroke)
      .attr("stroke-width", 2);

    // Add node labels outside the circles
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) =>
        Math.max(40, Math.min(60, d.content ? d.content.length / 3 : 40))
      )
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#333")
      .attr("font-family", "Arial, sans-serif")
      .text((d) => this.truncateText(d.label, 25));

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
    const timelineHeight = this.height - 150; // More space for text
    const timelineWidth = this.width - 200; // More horizontal space
    const stepWidth = Math.max(
      150,
      timelineWidth / Math.max(1, nodes.length - 1)
    ); // Minimum 150px between nodes

    // Create timeline line
    g.append("line")
      .attr("x1", 100)
      .attr("y1", timelineHeight / 2)
      .attr("x2", 100 + (nodes.length - 1) * stepWidth)
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
        (d, i) => `translate(${100 + i * stepWidth},${timelineHeight / 2})`
      );

    // Add node circles with dynamic styling
    node
      .append("circle")
      .attr("r", 20)
      .attr("fill", (d) => this.getNodeStyle(d, data.type).fill)
      .attr("stroke", (d) => this.getNodeStyle(d, data.type).stroke)
      .attr("stroke-width", 2);

    // Add node labels above the circles
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", -35)
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "#333")
      .attr("font-family", "Arial, sans-serif")
      .text((d) => this.truncateText(d.label, 30));

    // Add step numbers below the circles
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 40)
      .attr("font-size", "11px")
      .attr("fill", "#666")
      .attr("font-weight", "bold")
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
