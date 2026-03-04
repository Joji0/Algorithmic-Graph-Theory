#include "program.hpp"
#include "graph.hpp"
#include "printer.hpp"

#include <filesystem>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <variant>
#include <vector>


bool parseInt(const std::string& token, int& value) {
    try {
        size_t idx = 0;
        value = std::stoi(token, &idx);
        return idx == token.size();
    } catch (const std::exception&) {
        return false;
    }
}

void Program::parseGraph() {
    std::string nodeToken, edgeToken, directedToken;
    bool directed = false;
    int nodes = 0, edges = 0;

    print(Color::CYAN, "[Is the graph directed? (y/n)] > ");
    std::getline(std::cin, directedToken);
    print(Color::CYAN, "[Enter the number of nodes] > ");
    std::getline(std::cin, nodeToken);
    print(Color::CYAN, "[Enter the number of edges] > ");
    std::getline(std::cin, edgeToken);

    try {
        if (directedToken != "y" && directedToken != "Y" && directedToken != "n" && directedToken != "N") {
            throw std::runtime_error("Please enter 'y' or 'n' for directed input.");
        }

        directed = (directedToken == "y" || directedToken == "Y");
        nodes = std::stoi(nodeToken);
        edges = std::stoi(edgeToken);

        if (nodes < 0 || edges < 0) {
            throw std::runtime_error("Number of nodes and edges must be non-negative integers.");
        }
    } catch (const std::exception& e) {
        printError("Invalid configuration input: ", e.what());
        return;
    }

    std::vector<std::string> nodeLabels;
    std::vector<std::pair<std::string, std::string>> edgeList;

    try {
        println(Color::BLUE, "\nEnter label for each node.");
        println(Color::WHITE,"Example: A, 1, Node1, etc.\n");
        for (int i = 0; i < nodes; ++i) {
            print(Color::CYAN, "[Node ", i + 1, "] > ");
            nodeLabels.emplace_back(std::string());
            std::getline(std::cin, nodeLabels.back());
        }

        println(Color::BLUE, "\nEnter edges for each edge:");
        println(Color::WHITE, "Example: A B, 1 2, Node1 Node2, etc.\n");
        for (int i = 0; i < edges; ++i) {
            print(Color::CYAN, "[Edge ", i + 1, "] > ");
            std::string line;
            std::getline(std::cin, line);

            std::istringstream stream(line);
            std::string from, to, extra;
            if (!(stream >> from >> to) || (stream >> extra)) {
                throw std::runtime_error("Each edge must contain exactly two node labels.");
            }

            edgeList.emplace_back(from, to);
        }
    } catch (const std::exception& e) {
        printError(e.what());
        return;
    }

    bool intGraph = !nodeLabels.empty();
    std::vector<int> parsedNodes;
    parsedNodes.reserve(nodeLabels.size());

    for (const auto& label : nodeLabels) {
        int value = 0;
        if (!parseInt(label, value)) {
            intGraph = false;
            break;
        }
        parsedNodes.emplace_back(value);
    }

    if (intGraph) {
        Graph<int> graph(directed);
        for (int node : parsedNodes) graph.addNode(node);

        for (const auto& [fromToken, toToken] : edgeList) {
            int from = 0;
            int to = 0;
            if (!parseInt(fromToken, from) || !parseInt(toToken, to)) {
                printError("All node labels and edges must be integers for an integer graph.");
                return;
            }
            graph.addEdge(from, to);
        }

        intGraph_ = graph;
        stringGraph_ = Graph<std::string>{};
        printInfo("Successfully read a ", (intGraph_.directed() ? "directed" : "undirected"), " graph of type 'int' with ", intGraph_.size(), " nodes.");
        return;
    }

    Graph<std::string> graph(directed);
    for (const auto& label : nodeLabels) graph.addNode(label);
    for (const auto& [from, to] : edgeList) graph.addEdge(from, to);

    stringGraph_ = graph;
    intGraph_ = Graph<int>{};
    printInfo("Successfully read a ", (stringGraph_.directed() ? "directed" : "undirected"), " graph of type 'string' with ", stringGraph_.size(), " nodes.");
}

void Program::parseGrid() {
    std::string rowToken, columnToken;
    int rows = 0, cols = 0;

    print(Color::CYAN, "[Enter the number of rows] > ");
    std::getline(std::cin, rowToken);
    print(Color::CYAN, "[Enter the number of columns] > ");
    std::getline(std::cin, columnToken);

    try {
        rows = std::stoi(rowToken);
        cols = std::stoi(columnToken);

        if (rows <= 0 || cols <= 0) {
            throw std::runtime_error("Number of rows and columns must be positive integers.");
        }
    } catch (const std::exception& e) {
        printError("Invalid configuration input: ", e.what());
        return;
    }

    Grid grid(rows, cols);
    println(Color::BLUE, "\nEnter each grid row as a string of 0/1 without spaces.");
    println(Color::WHITE, "Example for a 2x3 grid:\n101\n100\n");
    for (int row = 0; row < rows; ++row) {
        print(Color::CYAN, "[Row ", row + 1, "] > ");
        std::string line;
        std::getline(std::cin, line);

        if (static_cast<int>(line.size()) != cols) {
            printError("Each row must contain exactly ", cols, " characters.");
            return;
        }

        for (int col = 0; col < cols; ++col) {
            if (line[col] != '0' && line[col] != '1') {
                printError("Grid rows may only contain '0' and '1'.");
                return;
            }
            grid.at(row, col) = static_cast<char>(line[col] == '1');
        }
    }

    gridGraph_ = grid;
    printInfo("Successfully read a grid graph with ", gridGraph_.rows(), " rows and ", gridGraph_.cols(), " cols.");
}

void Program::readInteractive() {
    printTitle("READ FROM STANDARD INPUT");
    println(Color::BLUE, "Select an option:");
    println(Color::WHITE, "[1] Read a standard graph");
    println(Color::WHITE, "[2] Read a grid graph\n");
    print(Color::CYAN, "[Choose a number (1-2)] > ");

    std::string input;
    std::getline(std::cin, input);
    try {
        int option = std::stoi(input);
        switch (option) {
            case 1: return parseGraph();
            case 2: return parseGrid();
        default:
            printError("Invalid option. Please select a number between 1 and 2.");
            return;
        }
    } catch (const std::exception&) {
        printError("Invalid input. Please enter a number.");
        return;
    }

}