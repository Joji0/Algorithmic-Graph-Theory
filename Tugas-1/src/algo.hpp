#pragma once

#include "graph.hpp"

namespace algo {
    template<typename T>
    void depthFirstSearch(const Graph<T>& g, const T& start);

    template<typename T>
    void breadthFirstSearch(const Graph<T>& g, const T& start);

    template<typename T>
    bool pathExist(const Graph<T>& g, const T& from, const T& to);

    template<typename T>
    bool isConnected(const Graph<T>& g, bool strongly = false);

} // namespace algo