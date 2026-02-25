#pragma once

#include <unordered_map>
#include <vector>

template<typename T>
class Graph {
    public:
    explicit Graph(bool directed = false) : directed_(directed) {}

    const auto& directed() const { return directed_; }

    const auto& id() const { return id_; }
    const int id(const T& node) const { return id_.at(node); }

    const auto& name() const { return name_; }
    const T& name(int id) const { return name_.at(id); }
    
    const auto& adjList() const { return adjList_; }
    const auto& adjList(int id) const { return adjList_.at(id); }

    void addNode(const T &node) {
        auto [it, inserted] = id_.emplace(node, id_.size());
        if (inserted) {
            name_.push_back(node);
            adjList_.emplace_back();
        }
    }

    void addEdge(const T &from, const T &to) {
        addNode(from);
        addNode(to);

        adjList_[id_[from]].push_back(id_[to]);
        if (!directed_) adjList_[id_[to]].push_back(id_[from]);
    }
    
    private:
    bool directed_;
    std::unordered_map<T, int> id_;
    std::vector<T> name_;
    std::vector<std::vector<int>> adjList_;
};