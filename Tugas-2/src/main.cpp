#include "program.hpp"

int main() {
    Program program;
    while (!program.exit()) {
        Program::Menu menu = program.select();
        program.execute(menu);
    }
}