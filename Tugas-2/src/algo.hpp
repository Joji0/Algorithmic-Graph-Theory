#pragma once

#include "graph.hpp"
#include "printer.hpp"
#include <stack>

template<typename T>
int depthFirstSearch(const Graph<T>& g, const T &start, std::vector<char>& visited) {
    std::stack<int> dfs{};
    int s = g.id(start);
    dfs.push(s);
    visited[s] = true;
    int count = 1;

    while(!dfs.empty()) {
        int current = dfs.top(); 
        print(Color::YELLOW, g.name(current), " -> ");
        dfs.pop();
        for (auto& neighbor : g.adjList(current)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                dfs.push(neighbor);
                count++;
            }
        }
    }
    
    println(Color::YELLOW, " [END] Total: ", count);

    return count;
}

template<typename T>
int findComponentCount(Graph<T>& g) {
    if (g.directed()) {
        auto undirected = g.undirected();
        printInfo("Current graph is directed, transforming to undirected for component counting");
        return findComponentCount(undirected);
    }

    int components = 0;
    std::vector<char> visited(g.size(), false);

    for (int i = 0; i < g.size(); ++i) {
        if (!visited[i]) {
            print(Color::YELLOW, "Component ", ++components, ": ");
            depthFirstSearch(g, g.name(i), visited);
        }
    }

    return components;
}

template<typename T>
int findComponentLargest(Graph<T>& g) {
    if (g.directed()) {
        auto undirected = g.undirected();
        printInfo("Current graph is directed, transforming to undirected for component counting");
        return findComponentCount(undirected);
    }

    int largest = 0;
    std::vector<char> visited(g.size(), false);

    for (int i = 0; i < g.size(); ++i) {
        if (!visited[i]) {
            int current = depthFirstSearch(g, g.name(i), visited);
            largest = std::max(largest, current);
        }
    }

    return largest;
}

inline int findIslandCount(Grid& g) {
    int islands = 0;
    std::vector<char> visited(g.size(), false);

    for (int i = 0; i < g.size(); i++) {
        if (!visited[i] && g.at(i)) {
            islands++;

            std::stack<int> dfs;
            dfs.push(i);
            visited[i] = true;
            while (!dfs.empty()) {
                int current = dfs.top();
                dfs.pop();

                for (auto neighbor : g.neighbors(current)) {
                    if (!visited[neighbor] && g.at(neighbor)) {
                        visited[neighbor] = true;
                        dfs.push(neighbor);
                    }
                }
            }
        }
    }

    return islands;
}