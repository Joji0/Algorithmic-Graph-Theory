#include "program.hpp"
#include "graph.hpp"
#include "json.hpp"
#include "printer.hpp"

#include <filesystem>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <variant>
#include <vector>

using json = nlohmann::json;
using ReturnType = std::variant<Graph<std::string>, Graph<int>, Grid>;

template<typename T>
Graph<T> parseGraphFromJson(const json& data) {
    if (!data.is_object()) {
        throw std::runtime_error("Graph data must be a JSON object.");
    }

    const bool directed = data.at("directed").get<bool>();
    Graph<T> graph(directed);

    for (const auto& node : data.at("nodes")) {
        graph.addNode(node.get<T>());
    }

    for (const auto& edge : data.at("edges")) {
        if (!edge.is_array() || edge.size() != 2) {
            throw std::runtime_error("Each edge must be an array of two nodes.");
        }
        graph.addEdge(edge.at(0).get<T>(), edge.at(1).get<T>());
    }

    return graph;
}

Grid parseGridFromJson(const json& data) {
    if (!data.is_object()) {
        throw std::runtime_error("Grid data must be a JSON object.");
    }

    const int rows = data.at("rows").get<int>();
    const int cols = data.at("cols").get<int>();
    const auto& gridData = data.at("grid");

    if (rows <= 0 || cols <= 0) {
        throw std::runtime_error("Grid rows and cols must be positive integers.");
    }

    if (!gridData.is_array() || static_cast<int>(gridData.size()) != rows) {
        throw std::runtime_error("Grid data row count does not match 'rows'.");
    }

    Grid grid(rows, cols);

    for (int row = 0; row < rows; row++) {
        const auto& rowData = gridData.at(row);
        if (!rowData.is_array() || static_cast<int>(rowData.size()) != cols) {
            throw std::runtime_error("Grid data column count does not match 'cols'.");
        }

        for (int col = 0; col < cols; col++) {
            grid.at(row, col) = static_cast<char>(rowData.at(col).get<int>() != 0);
        }
    }

    return grid;
}

ReturnType parseFile(const std::string& path) {
    std::filesystem::path cwd = std::filesystem::current_path();
    std::filesystem::path filePath = cwd / path;

    printInfo("Reading from ", filePath.string());

    if (!std::filesystem::exists(filePath)) {
        throw std::runtime_error("File not found: " + filePath.string());
    }

    std::ifstream file(filePath);
    if (!file.is_open()) {
        throw std::runtime_error("Failed to open file: " + filePath.string());
    }

    json input;

    try {
        file >> input;
        const std::string type = input.at("type").get<std::string>();

        if (type == "grid") {
            const auto& data = input.at("data");

            if (data.is_object()) {
                if (data.contains("rows") && data.contains("cols") && data.contains("grid")) {
                    return parseGridFromJson(data);
                }

                if (!data.contains("nodes") || !data.at("nodes").is_array() || data.at("nodes").empty()) {
                    throw std::runtime_error("Graph data must contain a non-empty 'nodes' array.");
                }

                if (data.at("nodes").at(0).is_number_integer()) {
                    return parseGraphFromJson<int>(data);
                }

                if (data.at("nodes").at(0).is_string()) {
                    return parseGraphFromJson<std::string>(data);
                }

                throw std::runtime_error("Node type must be integer or string.");
            }

            throw std::runtime_error("Invalid 'data' format for type 'grid'.");
        }

        if (type == "graph") {
            const auto& data = input.at("data");
            if (!data.contains("directed")) {
                throw std::runtime_error("Graph JSON must contain a 'directed' boolean field.");
            }

            if (!data.contains("nodes") || !data.at("nodes").is_array() || data.at("nodes").empty()) {
                throw std::runtime_error("Graph JSON must contain a non-empty 'nodes' array.");
            }

            if (data.at("nodes").at(0).is_number_integer()) {
                return parseGraphFromJson<int>(data);
            }

            if (data.at("nodes").at(0).is_string()) {
                return parseGraphFromJson<std::string>(data);
            }

            throw std::runtime_error("Node type must be integer or string.");
        }
        throw std::runtime_error("Invalid input type in JSON: " + type);
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse JSON from file: " + std::string(e.what()));
    }
}

void Program::readFile() {
    printTitle("READ FROM FILE\n");
    print(Color::CYAN, "[Enter JSON file path] > ");
    
    std::string path;
    std::getline(std::cin, path);

    try {
        ReturnType parsed = parseFile(path);
        if (std::holds_alternative<Graph<int>>(parsed)) {
            intGraph_ = std::get<Graph<int>>(parsed);
            stringGraph_ = Graph<std::string>{};
            gridGraph_ = Grid(0, 0);
            printInfo("Successfully read a ", (intGraph_.directed() ? "directed" : "undirected"), " graph of type 'int' with ", intGraph_.size(), " nodes.");
        } else if (std::holds_alternative<Graph<std::string>>(parsed)) {
            stringGraph_ = std::get<Graph<std::string>>(parsed);
            intGraph_ = Graph<int>{};
            gridGraph_ = Grid(0, 0);
            printInfo("Successfully read a ", (stringGraph_.directed() ? "directed" : "undirected"), " graph of type 'string' with ", stringGraph_.size(), " nodes.");
        } else {
            gridGraph_ = std::get<Grid>(parsed);
            intGraph_ = Graph<int>{};
            stringGraph_ = Graph<std::string>{};
            printInfo("Successfully read a grid graph with ", gridGraph_.rows(), " rows and ", gridGraph_.cols(), " cols.");
        }
    } catch (const std::exception& e) {
        printError(e.what());
    }
}