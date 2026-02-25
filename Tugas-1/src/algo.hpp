#pragma once

#include "graph.hpp"

#include <iostream>
#include <stack>
#include <queue>
#include <string>

template<typename T>
void depthFirstSearch(const Graph<T>& g, const T &start) {
    std::vector<char> visited(g.id().size(), false);

    std::stack<int> dfs{};
    int s = g.id(start);
    dfs.push(s);
    visited[s] = true;

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
    std::vector<char> visited(g.id().size(), false);

    std::queue<int> bfs;
    int s = g.id(start);
    bfs.push(s);
    visited[s] = true;

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
    std::vector<char> visited(g.id().size(), false);

    std::queue<int> bfs;
    int start = g.id(from);
    bfs.push(start);
    visited[start] = true;

    while (!bfs.empty()) {
        int current = bfs.front();
        bfs.pop();

        if (current == g.id(to)) return true;

        for (auto& neighbor : g.adjList(current)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                bfs.push(neighbor);
            }
        }
    }

    return false;
}

template<typename T>
bool isConnected(const Graph<T>& g, bool strongly) {
    if (g.id().empty()) return true;

    std::vector<char> visited(g.id().size(), false);

    std::stack<int> dfs{};
    dfs.push(0);
    visited[0] = true;

    while(!dfs.empty()) {
        int current = dfs.top(); 
        dfs.pop();

        for (auto& neighbor : g.adjList(current)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                dfs.push(neighbor);
            }
        }
    }

    for (auto v : visited) if (!v) return false;

    if (strongly && g.directed()) {
        Graph<T> transposed(g.directed());
        for (int i = 0; i < g.id().size(); i++) {
            transposed.addNode(g.name(i));
        }

        for (int i = 0; i < g.id().size(); i++) {
            for (auto& neighbor : g.adjList(i)) {
                transposed.addEdge(g.name(neighbor), g.name(i));
            }
        }

        std::fill(visited.begin(), visited.end(), false);

        dfs.push(0);
        visited[0] = true;

        while(!dfs.empty()) {
            int current = dfs.top(); 
            dfs.pop();

            for (auto& neighbor : transposed.adjList(current)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    dfs.push(neighbor);
                }
            }
        }

        for (auto v : visited) if (!v) return false;
    }

    return true;
}