#include "algo.hpp"

#include <iostream>
#include <stack>
#include <queue>

template<typename T>
void depthFirstSearch(const Graph<T>& g, const T &start) {
    std::vector<bool> visited(g.id().size(), false);

    std::stack<int> dfs{};
    dfs.push(g.id(start));
    visited[g.id(start)] = true;

    while(!dfs.empty()) {
        int current = dfs.top(); 
        dfs.pop();

        std::cout << g.name(current) << " -> ";

        for (auto& neighbor : g.adjList(current)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                dfs.push(neighbor);
            }
        }
    }
}

template<typename T>
void breadthFirstSearch(const Graph<T>& g, const T &start) {
    std::vector<bool> visited(g.id().size(), false);

    std::queue<int> bfs;
    bfs.push(g.id(start));
    visited[g.id(start)] = true;

    while (!bfs.empty()) {
        int current = bfs.front();
        bfs.pop();

        std::cout << g.name(current) << " -> ";

        for (auto& neighbor : g.adjList(current)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                bfs.push(neighbor);
            }
        }
    }
}

template<typename T>
bool pathExist(const Graph<T>& g, const T &from, const T &to) {
    std::vector<bool> visited(g.id().size(), false);

    std::queue<int> traverse;
    traverse.push(g.id(from));

    while (!traverse.empty()) {
        int current = traverse.front();
        visited[current] = true;
        traverse.pop();

        if (current == g.id(to)) return true;

        for (auto& neighbor : g.adjList(current)) {
            if (!visited[neighbor]) traverse.push(neighbor);
        }
    }

    return false;
}

template<typename T>
bool algo::isConnected(const Graph<T> &g, bool strongly) {
    std::vector<bool> visited(g.id().size(), false);

    std::stack<int> traverse{};
    traverse.push(0);
    visited[0] = true;

    while(!traverse.empty()) {
        int current = traverse.top(); 
        traverse.pop();

        for (auto& neighbor : g.adjList(current)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                traverse.push(neighbor);
            }
        }
    }

    for (auto v : visited) if (!v) return false;

    if (strongly && g.directed()) {
        std::fill(visited.begin(), visited.end(), false);

        traverse.push(0);
        visited[0] = true;

        while(!traverse.empty()) {
            int current = traverse.top(); 
            traverse.pop();

            for (auto& neighbor : g.adjList(current)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    traverse.push(neighbor);
                }
            }
        }

        for (auto v : visited) if (!v) return false;
    }

    return true;
}