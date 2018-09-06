/*jshint esversion: 6 */
(function() {
    var tabcouleurs = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#d58fd5", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#6873c6", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    var color = d3.scaleOrdinal(tabcouleurs);
    // x = d3.scaleOrdinal().range([100, width - 20]);


    var nodes = []; //Les noeuds
    var links = []; //Les arcs
    var graph = {}; //Objet des tableaux noeuds/liens

    var canvas = d3.select("#leCanvas"),
        width = canvas.attr("width"),
        height = canvas.attr("height"),
        r = 10,
        ctx = canvas.node().getContext("2d"),
        simulation = d3.forceSimulation()
        .force("x", d3.forceX(width / 2)) // function(d) { return x(d.group); }
        .force("y", d3.forceY(height / 2))
        .force("collide", d3.forceCollide(r))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("link", d3.forceLink().id(function(d) {
            return d.id;
        })); //.id(function(d) { return d.id; })

    //point de terminaison
    var endpoint = "http://data.bnf.fr/sparql";
    var uri = "http://data.bnf.fr/ark:/12148/cb11907966z"; //=> auteur

    //Préfixes 
    //note: <http://rdvocab.info/ElementsGr2/> est obsolète (FRAD) mais toujours utilisé dans le modèle de données de data.bnf.fr 
    var prefixes = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX foaf: <http://xmlns.com/foaf/0.1/> PREFIX dcterms: <http://purl.org/dc/terms/> PREFIX frad: <http://rdvocab.info/ElementsGr2/>";

    //Requête SPARQL 
    //(SAMPLE(?depic) as ?fdepic) (SAMPLE(?wDepic) as ?wdepic)
    //OPTIONAL { ?oeuvre foaf:depiction ?wDepic. } OPTIONAL { ?person foaf:depiction ?depic. }
    var req = "SELECT DISTINCT ?pred ?objet WHERE {<" + uri + "#about> ?pred ?objet. FILTER(!regex(?objet,'thumbnail$','i'))} ORDER BY RAND() LIMIT 500";
    //var req2 = "SELECT DISTINCT ?sujet ?pred WHERE {<" + uri + "> ?pred ?objet.} ORDER BY RAND() LIMIT 500";

    $('#laReq').html(prefixes.replace(/</g, '&lt;').replace(/>/g, '&gt;') + " " + req.replace(/</g, '&lt;').replace(/>/g, '&gt;'));


    //méthode fetch => ajout de {output: 'json'} dans la requête 
    var url = new URL(endpoint),
        params = {
            queryLn: 'SPARQL',
            output: 'json',
            query: prefixes + " " + req,
            limit: 'none',
            infer: 'true',
            Accept: 'application/sparql-results+json'
        };
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    //Envoi de la requête (asynchrone avec promesse)
    fetch(url)
        .then(reponse => reponse.json())
        .then(data => creeJson(data))
        .catch(err => console.log(err));

    function creeJson(oeuvres) {

        if ((oeuvres.results.bindings.length)) { //S'il y a des résultats
            $.each(oeuvres.results.bindings, function(i, oeuvre) {
                nodes.push({
                    id: uri,
                    group: "uri"
                });
                nodes.push({
                    id: oeuvre.objet.value,
                    group: "objet"
                });
                links.push({
                    source: uri,
                    target: oeuvre.objet.value,
                    value: oeuvre.pred.value
                });

            });

            //var newnodes = supprDoublons(nodes, "id"); //Tableau des noeuds uniques
            graph = {
                nodes: nodes,
                links: links
            };

            creeGraph(graph);
        }
    }

    function creeGraph(graph) {

        //console.log(graph.nodes.length + " nodes");

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

    }

    function drawNode(d) {
        ctx.beginPath();
        // var image = new Image();
        // image.src = d.depic;
        // image.onload = function() {
        //     var pat = ctx.createPattern(image, "no-repeat");
        //     ctx.fillStyle = pat; //color(d.id);
        // };
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