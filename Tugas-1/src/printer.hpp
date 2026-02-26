#pragma once

#include <iostream>
#include <string>

namespace Color {
    const std::string RESET   = "\033[0m";
    const std::string BLACK   = "\033[30m";
    const std::string RED     = "\033[31m";
    const std::string GREEN   = "\033[32m";
    const std::string YELLOW  = "\033[33m";
    const std::string BLUE    = "\033[34m";
    const std::string MAGENTA = "\033[35m";
    const std::string CYAN    = "\033[36m";
    const std::string WHITE   = "\033[37m";
    const std::string BOLD    = "\033[1m";
}

template <typename... Args>
void println(const std::string& color, Args&&... args) {
    std::cout << color;
    (std::cout << ... << std::forward<Args>(args));
    std::cout << Color::RESET << '\n';
}

template <typename... Args>
void print(const std::string& color, Args&&... args) {
    std::cout << color;
    (std::cout << ... << std::forward<Args>(args));
    std::cout << Color::RESET;
}

template <typename... Args>
void printInfo(Args&&... args) {
    println(Color::CYAN, "[INFO] ", std::forward<Args>(args)...);
}

template <typename... Args>
void printError(Args&&... args) {
    println(Color::RED, "[ERROR] ", std::forward<Args>(args)...);
}

template <typename... Args>
void printWarning(Args&&... args) {
    println(Color::YELLOW, "[WARNING] ", std::forward<Args>(args)...);
}

template <typename... Args>
void printBold(Args&&... args) {
    println(Color::BOLD, "[INSTRUCTION] ", std::forward<Args>(args)...);
}