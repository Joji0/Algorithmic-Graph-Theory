cmake_minimum_required(VERSION 3.16)

project(Tugas_2 VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(Tugas_2
    src/main.cpp
    src/program.cpp
    src/file_reader.cpp
    src/interactive_reader.cpp
)