from flask import (
    Flask,
    render_template,
    jsonify
)

from graph.generator import generate_graph
from algorithms.dijkstra import dijkstra

import random
import time

app = Flask(__name__)

nodes = []
edges = []
graph = {}

source = None
destination = None


def build_city():

    global nodes
    global edges
    global graph
    global source
    global destination

    nodes, edges, graph = generate_graph()

    source = random.choice(nodes)["id"]

    destination = random.choice(nodes)["id"]

    while destination == source:
        destination = random.choice(nodes)["id"]


build_city()


@app.route("/")
def home():

    return render_template("index.html")


@app.route("/solve")
def solve():

    global graph
    global source
    global destination

    start_time = time.perf_counter()

    path, visited, distance = dijkstra(
        graph,
        source,
        destination
    )

    elapsed = (
        time.perf_counter()
        - start_time
    ) * 1000

    return jsonify({
        "nodes": nodes,
        "edges": edges,
        "graph": graph,
        "source": source,
        "destination": destination,
        "path": path,
        "visited": visited,
        "distance": distance,
        "time": round(elapsed, 4)
    })


@app.route("/new-map")
def new_map():

    build_city()

    return jsonify({
        "success": True
    })


@app.route("/random-source")
def random_source():

    global source

    source = random.choice(nodes)["id"]

    while source == destination:
        source = random.choice(nodes)["id"]

    return jsonify({
        "success": True,
        "source": source
    })


@app.route("/random-destination")
def random_destination():

    global destination

    destination = random.choice(nodes)["id"]

    while destination == source:
        destination = random.choice(nodes)["id"]

    return jsonify({
        "success": True,
        "destination": destination
    })


@app.route("/clear")
def clear():

    return jsonify({
        "success": True
    })


if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )