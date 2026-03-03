#include "algo.hpp"
#include "graph.hpp"
#include "json.hpp"
#include "printer.hpp"
#include "main.hpp"

#include <fstream>
#include <string>

namespace tugas_1 {

void printBanner() {
    println(Color::BOLD, "Tugas 1: Graph Algorithms Explorer");
    println(Color::BOLD, "-----------------------------------\n");
}

void selectMenu(Graph<std::string>& graph) {
    println(Color::BOLD, "\nMain Menu\n---------");
    println(Color::WHITE, "0. Setup Graph");
    println(Color::WHITE, "1. Graph Traversal (DFS / BFS)");
    println(Color::WHITE, "2. Path Existence Check (A to B)");
    println(Color::WHITE, "3. Graph Connectivity Check");
    println(Color::WHITE, "4. Exit Program");
    print(Color::BOLD, "Select an option (0-4) \n> ");

    std::string input;
    std::getline(std::cin, input);
    try {
        int option = std::stoi(input);
        switch (option) {
            case 0: 
                setupGraph(graph);
                break;
            case 1:
                graphTraversal(graph);
                break;
            case 2:
                pathExistenceCheck(graph);
                break;
            case 3:
                connectivityCheck(graph);
                break;
            case 4:
                printInfo("Exiting program. Goodbye!");
                exit(0);
            default:
                printError("Invalid option. Please select a number between 0 and 4.");
                break;
        }
    } catch (const std::exception&) {
        printError("Invalid input. Please enter a number.");
        return;
    }
}

bool setupGraph(Graph<std::string>& graph) {
    println(Color::BOLD, "\nGraph Setup\n----------");
    println(Color::WHITE, "1. From File");
    println(Color::WHITE, "2. Interactive Input");
    print(Color::BOLD, "Select an option (1-2) \n> ");
    std::string input;
    std::getline(std::cin, input);
    try {
        int option = std::stoi(input);
        switch (option) {
            case 1: return loadFile(graph);
            case 2: return loadInteractive(graph);
            default:
                printError("Invalid option. Please select 1 or 2.");
                return false;
        }
    } catch (const std::exception&) {
        printError("Invalid input. Please enter a number.");
        return false;
    }
}

bool loadFile(Graph<std::string>& graph) {
    print(Color::BOLD, "Enter file path: \n> ");
    std::string filePath;
    std::getline(std::cin, filePath);
    
    std::ifstream file(filePath);
    if (!file.is_open()) {
        printError("Failed to open file: ", filePath);
        return false;
    }

    using json = nlohmann::json;
    json input;
    try {
        file >> input;

        graph = Graph<std::string>(input["directed"].get<bool>());

        int nodeCount = 0;
        for (const auto& node : input["nodes"]) {
            graph.addNode(node.get<std::string>());
            nodeCount++;
        }

        int edgeCount = 0;
        for (const auto& edge : input["edges"]) {
            graph.addEdge(edge[0].get<std::string>(), edge[1].get<std::string>());
            edgeCount++;
        }

        printInfo((graph.directed() ? "Directed" : "Undirected"), " graph loaded successfully with ", nodeCount, " nodes and ", edgeCount, " edges from file: ", filePath);
        return true;
    } catch (const std::exception& e) {
        printError("Failed to parse graph from file: ", e.what());
        return false;
    }   
}

bool loadInteractive(Graph<std::string>& graph) {
    print(Color::BOLD, "Is the graph Directed (1) or Undirected (0)? \n> ");
    std::string directedToken;
    std::getline(std::cin, directedToken);
    try {
        int directedFlag = std::stoi(directedToken);
        if (directedFlag != 0 && directedFlag != 1) {
            printError("Invalid input. Please enter 1 for Directed or 0 for Undirected.");
            return false;
        }
        graph = Graph<std::string>(directedFlag == 1);
    } catch (const std::exception&) {
        printError("Invalid input. Please enter a number.");
        return false;
    }

    print(Color::BOLD, "Enter number of vertices (V) and edges (E): \n> ");
    std::string nodeCountToken, edgeCountToken;
    std::getline(std::cin, nodeCountToken);
    try {
        int nodeCount = std::stoi(nodeCountToken);
        if (nodeCount < 0) {
            printError("Node count must be a non-negative integer.");
            return false;
        }

        std::getline(std::cin, edgeCountToken);
        int edgeCount = std::stoi(edgeCountToken);
        if (edgeCount < 0) {
            printError("Edge count must be a non-negative integer.");
            return false;
        }

        for (int i = 0; i < nodeCount; ++i) {
            print(Color::BOLD, "Enter label for node ", i + 1, ":\n> ");
            std::string label;
            std::getline(std::cin, label);
            graph.addNode(label);
        }

        for (int i = 0; i < edgeCount; ++i) {
            print(Color::BOLD, "Enter edge ", i + 1, " (from to): \n> ");
            std::string from, to;
            std::getline(std::cin, from);
            std::getline(std::cin, to);
            graph.addEdge(from, to);
        }

        printInfo((graph.directed() ? "Directed" : "Undirected"), " graph loaded successfully with ", nodeCount, " nodes and ", edgeCount, " edges from interactive input.");
        return true;
    } catch (const std::exception&) {
        printError("Invalid input. Please enter valid numbers for node and edge counts.");
        return false;
    }
}

void graphTraversal(const Graph<std::string>& graph) {
    println(Color::BOLD, "\nGraph Traversal\n---------------");
    println(Color::WHITE, "1. Depth-First Search (DFS)");
    println(Color::WHITE, "2. Breadth-First Search (BFS)");
    print(Color::BOLD, "Select an option (1-2) \n> ");
    std::string input;
    std::getline(std::cin, input);
    try {
        int option = std::stoi(input);
        switch (option) {
            case 1: 
                performDFS(graph);
                break;
            case 2:
                performBFS(graph);
                break;
            default:
                printError("Invalid option. Please select 1 or 2.");
                break;
        }
     } catch (const std::exception&) {
        printError("Invalid input. Please enter a number.");
        return;
     }
}

void performDFS(const Graph<std::string>& graph) {
    print(Color::BOLD, "Enter starting node for DFS: \n> ");
    std::string startNode;
    std::getline(std::cin, startNode);
    printInfo("DFS Traversal Order: ");
    try {
        depthFirstSearch(graph, startNode);
    } catch (const std::exception& e) {
        printError("Error during DFS traversal: ", e.what());
    }
}

void performBFS(const Graph<std::string>& graph) {
    print(Color::BOLD, "Enter starting node for BFS: \n> ");
    std::string startNode;
    std::getline(std::cin, startNode);
    printInfo("BFS Traversal Order: ");
    try {
        breadthFirstSearch(graph, startNode);
    } catch (const std::exception& e) {
        printError("Error during BFS traversal: ", e.what());
    }
}

void pathExistenceCheck(const Graph<std::string>& graph) {
    print(Color::BOLD, "Enter source node: \n> ");
    std::string source;
    std::getline(std::cin, source);
    print(Color::BOLD, "Enter destination node: \n> ");
    std::string destination;
    std::getline(std::cin, destination);
    try {
        bool exists = pathExist(graph, source, destination);
        if (exists) {
            printInfo("A path exists from ", source, " to ", destination, ".");
        } else {
            printInfo("No path exists from ", source, " to ", destination, ".");
        }
    } catch (const std::exception& e) {
        printError("Error during path existence check: ", e.what());
    }
}

void connectivityCheck(const Graph<std::string>& graph) {
    print(Color::BOLD, "Enforce strong connectivity check (1 = true, 0 = false)\n> ");
    std::string input;
    std::getline(std::cin, input);
    try {
        int enforceStrongFlag = std::stoi(input);
        if (enforceStrongFlag != 0 && enforceStrongFlag != 1) {
            printError("Invalid input. Please enter 1 for true or 0 for false.");
            return;
        }
        bool enforceStrong = enforceStrongFlag == 1;
        bool connected = isConnected(graph, enforceStrong);
        if (connected) {
            printInfo("The graph is ", (enforceStrong ? "strongly " : ""), "connected.");
        } else {
            printInfo("The graph is not ", (enforceStrong ? "strongly " : ""), "connected.");
        }
    } catch (const std::exception&) {
        printError("Invalid input. Please enter a number.");
    }
}

} // namespace tugas_1

using namespace tugas_1;

int main() {
    printBanner();
    Graph<std::string> graph;

    while (true) {
        selectMenu(graph);
    }

    return 0;
}