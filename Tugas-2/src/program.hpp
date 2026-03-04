#pragma once

#include "graph.hpp"
#include <string>

class Program {
    public:
    enum Menu {
        READ_FILE,
        READ_INTERACTIVE,
        FIND_COMPONENT,
        FIND_COMPONENT_LARGEST,
        FIND_ISLANDS,
        EXIT_PROGRAM,
        IDLE
    };

    Menu select();
    void execute(Menu menu);
    const bool exit() const { return exit_; }

    private:
    void readFile();
    void readInteractive();
    void findComponent();
    void findLargestComponent();
    void findIslands();
    void parseGraph();
    void parseGrid();

    Graph<std::string> stringGraph_{};
    Graph<int> intGraph_{};
    Grid gridGraph_{0, 0};

    bool exit_ = false;
};

