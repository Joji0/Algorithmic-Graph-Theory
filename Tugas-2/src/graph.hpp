#pragma once

#include <vector>
#include <algorithm>
#include <unordered_map>

template<typename T>
class Graph {
    public:
    explicit Graph(bool directed = false) : directed_(directed) {}

    const auto& directed() const { return directed_; }

    const auto size() const { return id_.size(); }

    const bool empty() const { return id_.empty(); }

    const auto& id() const { return id_; }
    const int id(const T& node) const { return id_.at(node); }

    const auto& name() const { return name_; }
    const T& name(int id) const { return name_.at(id); }

    const auto& adjList() const { return adjList_; }
    const auto& adjList(int id) const { return adjList_.at(id); }

    void addNode(const T& node) {
        auto [it, inserted] = id_.emplace(node, id_.size());
        if (inserted) {
            name_.emplace_back(node);
            adjList_.emplace_back();
        }
    }

    void addEdge(const T& from, const T& to) {
        addNode(from);
        addNode(to);

        adjList_[id_[from]].emplace_back(id_[to]);
        if (!directed_) adjList_[id_[to]].emplace_back(id_[from]);
    }

    void removeNode(const T& node) {
        if (id_.find(node) == id_.end()) return;

        int nodeId = id_[node];
        id_.erase(node);
        name_.erase(name_.begin() + nodeId);
        adjList_.erase(adjList_.begin() + nodeId);

        for (auto& [_, id] : id_) {
            if (id > nodeId) --id;
        }

        for (auto& neighbors : adjList_) {
            neighbors.erase(std::remove(neighbors.begin(), neighbors.end(), nodeId), neighbors.end());
            for (auto& neighbor : neighbors) {
                if (neighbor > nodeId) --neighbor;
            }
        }
    }

    void removeEdge(const T& from, const T& to) {
        if (id_.find(from) == id_.end() || id_.find(to) == id_.end()) return;

        auto& fromAdjList = adjList_[id_[from]];
        fromAdjList.erase(std::remove(fromAdjList.begin(), fromAdjList.end(), id_[to]), fromAdjList.end());

        if (!directed_) {
            auto& toAdjList = adjList_[id_[to]];
            toAdjList.erase(std::remove(toAdjList.begin(), toAdjList.end(), id_[from]), toAdjList.end());
        }
    }
    
    private:
    bool directed_;
    std::unordered_map<T, int> id_;
    std::vector<T> name_;
    std::vector<std::vector<int>> adjList_;
};

class Grid {
    public:
    Grid(int rows, int cols) : rows_(rows), cols_(cols), grid_(rows * cols, false) {}

    const auto size() const { return grid_.size(); }
    const int rows() const { return rows_; }
    const int cols() const { return cols_; }

    const auto& at(int index) const { return grid_.at(index); }
    auto& at(int index) { return grid_.at(index); }

    const auto& at(int row, int col) const { return grid_.at(row * cols_ + col); }
    auto& at(int row, int col) { return grid_.at(row * cols_ + col); }

    auto neighbors(int index) const {
        std::vector<int> result;
        int row = index / cols_;
        int col = index % cols_;

        if (row > 0) result.emplace_back((row - 1) * cols_ + col);
        if (row < rows_ - 1) result.emplace_back((row + 1) * cols_ + col);
        if (col > 0) result.emplace_back(row * cols_ + (col - 1));
        if (col < cols_ - 1) result.emplace_back(row * cols_ + (col + 1));

        return result;
    }

    auto neighbors(int row, int col) const {
        return neighbors(row * cols_ + col);
    }

    private:
    int rows_;
    int cols_;
    std::vector<char> grid_;
};