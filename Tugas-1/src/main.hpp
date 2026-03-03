#pragma once

#include "graph.hpp"
#include <string>

namespace tugas_1 {

void printBanner();

void selectMenu(Graph<std::string>& graph);

bool setupGraph(Graph<std::string>& graph);

bool loadFile(Graph<std::string>& graph);

bool loadInteractive(Graph<std::string>& graph);

void graphTraversal(const Graph<std::string>& graph);

void performDFS(const Graph<std::string>& graph);

void performBFS(const Graph<std::string>& graph);

void pathExistenceCheck(const Graph<std::string>& graph);

void connectivityCheck(const Graph<std::string>& graph);

} // namespace tugas_1