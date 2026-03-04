#include "program.hpp"
#include "algo.hpp"
#include "graph.hpp"
#include "printer.hpp"

#include <stdexcept>
#include <string>
#include <vector>

Program::Menu Program::select() {
    printTitle("MAIN MENU");
    println(Color::BLUE, "Select an option:");
    println(Color::WHITE, "[1] Read graph from file");
    println(Color::WHITE, "[2] Read graph from standard input");
    println(Color::WHITE, "[3] Find number of connected components");
    println(Color::WHITE, "[4] Find largest connected component");
    println(Color::WHITE, "[5] Find number of islands in grid");
    println(Color::WHITE, "[6] Exit program\n");

    print(Color::CYAN, "[Choose a number (1-6)] > ");
    std::string input;
    std::getline(std::cin, input);
    try {
        int option = std::stoi(input);
        switch (option) {
            case 1: return READ_FILE;
            case 2: return READ_INTERACTIVE;
            case 3: return FIND_COMPONENT;
            case 4: return FIND_COMPONENT_LARGEST;
            case 5: return FIND_ISLANDS;
            case 6: return EXIT_PROGRAM;
        default:
            printError("Invalid option. Please select a number between 1 and 6.");
            return IDLE;
        }
    } catch (const std::exception&) {
        printError("Invalid input. Please enter a number.");
        return IDLE;
    }
}

void Program::execute(Menu menu) {
    switch (menu) {
        case READ_FILE: return readFile();
        case READ_INTERACTIVE: return readInteractive();
        case FIND_COMPONENT: return findComponent();
        case FIND_COMPONENT_LARGEST: return findLargestComponent();
        case FIND_ISLANDS: return findIslands();
        case EXIT_PROGRAM:
            printInfo("Exiting program...");
            exit_ = true;
            return;
        default:
            printError("Invalid menu option selected.");
    }
}

void Program::findComponent() {
    printTitle("FIND NUMBER OF COMPONENTS IN GRAPH");
    if (!intGraph_.empty()) {
        printInfo("Connected components: ", findComponentCount(intGraph_));
        return;
    }

    if (!stringGraph_.empty()) {
        printInfo("Connected components: ", findComponentCount(stringGraph_));
        return;
    }

    printError("No standard graph is loaded. Please read a graph first.");
}

void Program::findLargestComponent() {
    printTitle("FIND LARGEST COMPONENT IN GRAPH");
    if (!intGraph_.empty()) {
        printInfo("Largest component size: ", findComponentLargest(intGraph_));
        return;
    }

    if (!stringGraph_.empty()) {
        printInfo("Largest component size: ", findComponentLargest(stringGraph_));
        return;
    }

    printError("No standard graph is loaded. Please read a graph first.");
}

void Program::findIslands() {
    printTitle("FIND NUMBER OF ISLANDS IN GRID GRAPH");
    if (gridGraph_.size() == 0 || gridGraph_.rows() == 0 || gridGraph_.cols() == 0) {
        printError("No grid graph is loaded. Please read a grid first.");
        return;
    }

    printInfo("Number of islands: ", findIslandCount(gridGraph_));
}