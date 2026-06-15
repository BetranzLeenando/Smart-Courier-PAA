import heapq


def dijkstra(
    graph,
    start,
    destination
):

    pq = [(0, start)]

    distances = {
        start: 0
    }

    previous = {}

    visited_order = []

    while pq:

        current_distance, node = (
            heapq.heappop(pq)
        )

        if node in visited_order:
            continue

        visited_order.append(node)

        if node == destination:
            break

        for neighbor, weight in graph[node]:

            new_distance = (
                current_distance +
                weight
            )

            if (
                neighbor not in distances
                or
                new_distance <
                distances[neighbor]
            ):

                distances[neighbor] = (
                    new_distance
                )

                previous[neighbor] = node

                heapq.heappush(
                    pq,
                    (
                        new_distance,
                        neighbor
                    )
                )

    path = []

    if destination in distances:

        current = destination

        while current != start:

            path.append(current)

            current = previous[current]

        path.append(start)

        path.reverse()

    return (
        path,
        visited_order,
        round(
            distances.get(
                destination,
                0
            ),
            2
        )
    )

