#pragma once

#include <vector>
#include <algorithm>
#include <unordered_map>
#include <stdexcept>

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

    void addNode(const T& node) {
        auto [it, inserted] = id_.emplace(node, id_.size());
        if (inserted) {
            name_.push_back(node);
            adjList_.emplace_back();
        }
    }

    void addEdge(const T& from, const T& to) {
        addNode(from);
        addNode(to);

        adjList_[id_[from]].push_back(id_[to]);
        if (!directed_) adjList_[id_[to]].push_back(id_[from]);
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
        if (id_.find(from) == id_.end() || id_.find(to) == id_.end()) {
            throw std::out_of_range("The requested nodes do not exist in the graph.");
        }

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