(function() {

    var tabcouleurs = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#d58fd5", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#6873c6", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    var color = d3.scaleOrdinal(tabcouleurs);
    // x = d3.scaleOrdinal().range([100, width - 20]);

    var canvas = d3.select("#leCanvas"),
        width = canvas.attr("width"),
        height = canvas.attr("height"),
        r = 10,
        ctx = canvas.node().getContext("2d"),
        simulation = d3.forceSimulation()
        .force("x", d3.forceX(width / 2)) // function(d) { return x(d.group); }
        .force("y", d3.forceY(height / 2))
        .force("collide", d3.forceCollide(r + 2))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("link", d3.forceLink().id(function(d) { return d.id; })); //.id(function(d) { return d.id; })

    d3.json("MVerne.json").then(function(graph) {

        console.log(graph.nodes.length + " nodes");

        simulation
            .nodes(graph.nodes)
            .on("tick", update)
            .force("link")
            .links(graph.links);

        canvas
            .call(d3.drag()
                .container(canvas.node())
                .subject(dragsubject)
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        function update() {
            ctx.clearRect(0, 0, width, height);

            ctx.beginPath();
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = "#bbb";
            graph.links.forEach(drawLink);
            ctx.stroke();

            ctx.globalAlpha = 1.0;
            graph.nodes.forEach(drawNode);
        }

        function dragsubject() {
            return simulation.find(d3.event.x, d3.event.y);
        }

    });

    function drawNode(d) {
        ctx.beginPath();
        ctx.fillStyle = color(d.id);
        ctx.moveTo(d.x, d.y);
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        // ctx.fillText(d.id, d.x + 10, d.y + 3);
        ctx.fill();
    }

    function drawLink(l) {
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
    }

    function dragstarted() {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d3.event.subject.fx = d3.event.subject.x;
        d3.event.subject.fy = d3.event.subject.y;
    }

    function dragged() {
        d3.event.subject.fx = d3.event.x;
        d3.event.subject.fy = d3.event.y;
    }

    function dragended() {
        if (!d3.event.active) simulation.alphaTarget(0);
        d3.event.subject.fx = null;
        d3.event.subject.fy = null;
    }
})();