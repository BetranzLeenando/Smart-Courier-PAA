import random
import math

WIDTH = 1200
HEIGHT = 700


def distance(a, b):
    return math.sqrt(
        (a["x"] - b["x"]) ** 2 +
        (a["y"] - b["y"]) ** 2
    )


def generate_graph(
    node_count=6,
    neighbors=2
):
    """
    Generate a random graph with proper distance-based weights
    """

    nodes = []

    MIN_DISTANCE = 120

    for i in range(node_count):

        while True:

            x = random.randint(80, WIDTH - 80)
            y = random.randint(80, HEIGHT - 80)

            valid = True

            for node in nodes:

                dist = math.sqrt(
                    (x - node["x"])**2 +
                    (y - node["y"])**2
                )

                if dist < MIN_DISTANCE:
                    valid = False
                    break

            if valid:

                nodes.append({
                    "id": i,
                    "x": x,
                    "y": y
                })

                break

    edges = []
    graph = {}

    for node in nodes:
        graph[node["id"]] = []

    # For each node, connect to nearest neighbors
    for node in nodes:

        nearest = sorted(
            nodes,
            key=lambda n: distance(node, n)
        )

        connected = 0

        for other in nearest:

            if other["id"] == node["id"]:
                continue

            if connected >= neighbors:
                break

            # Calculate actual Euclidean distance as weight
            weight = round(
                distance(node, other) / 100,  # Scale to reasonable km values
                2
            )

            edge = sorted(
                [node["id"], other["id"]]
            )

            if edge not in edges:

                edges.append(edge)

                graph[node["id"]].append(
                    (
                        other["id"],
                        weight
                    )
                )

                graph[other["id"]].append(
                    (
                        node["id"],
                        weight
                    )
                )

                connected += 1

    return nodes, edges, graph
