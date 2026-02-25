#include <bits/stdc++.h>
using namespace std;

const string RESET = "\033[0m";
const string CYAN = "\033[1;36m";
const string GREEN = "\033[1;32m";
const string YELLOW = "\033[1;33m";
const string RED = "\033[1;31m";
const string BOLD = "\033[1m";

void dfs(int u, vector<vector<int>> &adj, vector<bool> &vis) {
        vis[u] = true;
        cout << GREEN << u << " " << RESET;
        for (int v : adj[u]) {
                if (!vis[v]) {
                        dfs(v, adj, vis);
                }
        }
}

int main() {
        int isDirected;
        cout << CYAN << "==================================================\n";
        cout << "             GRAPH ALGORITHMS EXPLORER            \n";
        cout << "==================================================\n" << RESET;

        cout << BOLD << "[SETUP] " << RESET << "Is the graph Undirected(0) or Directed (1)? ";
        cin >> isDirected;

        int n, m;
        cout << BOLD << "[SETUP] " << RESET << "Enter the number of Vertices (V) and Edges (E): ";
        cin >> n >> m;

        vector<vector<int>> adj(n + 1);

        cout << YELLOW << "\nPlease enter " << m << " edges (u v).\n";
        if (isDirected) {
                cout << "Note: For a directed graph, (u v) means an edge FROM u TO v.\n";
        }
        cout << "Note: Use 1-based indexing [1 to " << n << "]:\n" << RESET;

        for (int i = 0; i < m; i++) {
                int u, v;
                cin >> u >> v;

                if (u < 1 || u > n || v < 1 || v > n) {
                        cout << RED << "Error: Invalid edge! Vertices must be between 1 and " << n << ".\n" << RESET;
                        i--;
                        continue;
                }

                adj[u].push_back(v);
                if (!isDirected) {
                        adj[v].push_back(u);
                }
        }

        while (true) {
                cout << CYAN << "\n=================== MAIN MENU ====================\n" << RESET;
                cout << "  1. Graph Traversal (DFS / BFS)\n";
                cout << "  2. Path Existence Check (A to B)\n";
                cout << "  3. Graph Connectivity Check\n";
                cout << "  4. Exit Program\n";
                cout << CYAN << "--------------------------------------------------\n" << RESET;
                cout << BOLD << "Select an option (1-4): " << RESET;

                int choice;
                cin >> choice;

                if (choice == 1) {
                        int startNode, method;
                        cout << "Enter the starting vertex: ";
                        cin >> startNode;
                        cout << "Choose method - DFS (1) or BFS (2): ";
                        cin >> method;

                        if (startNode < 1 || startNode > n) {
                                cout << RED << "[!] Invalid vertex. Please enter a number between 1 and " << n << ".\n"
                                     << RESET;
                                continue;
                        }

                        if (method == 1) {
                                vector<bool> vis(n + 1, false);
                                cout << BOLD << "\n[RESULT] DFS Traversal: " << RESET;
                                dfs(startNode, adj, vis);
                                cout << "\n";
                        } else if (method == 2) {
                                vector<bool> vis(n + 1, false);
                                queue<int> q;

                                q.push(startNode);
                                vis[startNode] = true;

                                cout << BOLD << "\n[RESULT] BFS Traversal: " << RESET;
                                while (!q.empty()) {
                                        int u = q.front();
                                        q.pop();
                                        cout << GREEN << u << " " << RESET;

                                        for (int v : adj[u]) {
                                                if (!vis[v]) {
                                                        vis[v] = true;
                                                        q.push(v);
                                                }
                                        }
                                }
                                cout << "\n";
                        } else {
                                cout << RED << "[!] Invalid method selected.\n" << RESET;
                        }

                } else if (choice == 2) {
                        int a, b;
                        cout << "Enter source vertex (A) and destination vertex (B): ";
                        cin >> a >> b;

                        if (a < 1 || a > n || b < 1 || b > n) {
                                cout << RED << "[!] Invalid vertices. Please try again.\n" << RESET;
                                continue;
                        }

                        vector<bool> vis(n + 1, false);
                        queue<int> q;
                        bool found = false;

                        q.push(a);
                        vis[a] = true;

                        while (!q.empty()) {
                                int u = q.front();
                                q.pop();

                                if (u == b) {
                                        found = true;
                                        break;
                                }

                                for (int v : adj[u]) {
                                        if (!vis[v]) {
                                                vis[v] = true;
                                                q.push(v);
                                        }
                                }
                        }

                        if (found) {
                                cout << GREEN << "\n[RESULT] Yes! A path exists from vertex " << a << " to vertex " << b
                                     << ".\n"
                                     << RESET;
                        } else {
                                cout << YELLOW << "\n[RESULT] No path exists from vertex " << a << " to vertex " << b
                                     << ".\n"
                                     << RESET;
                        }

                } else if (choice == 3) {
                        if (!isDirected) {
                                vector<bool> vis(n + 1, false);
                                queue<int> q;
                                int visitedCount = 0;

                                q.push(1);
                                vis[1] = true;

                                while (!q.empty()) {
                                        int u = q.front();
                                        q.pop();
                                        visitedCount++;

                                        for (int v : adj[u]) {
                                                if (!vis[v]) {
                                                        vis[v] = true;
                                                        q.push(v);
                                                }
                                        }
                                }

                                cout << "\n[RESULT] ";
                                if (visitedCount == n) {
                                        cout << GREEN << "Graph is Connected.\n" << RESET;
                                } else {
                                        cout << RED << "Graph is Disconnected.\n" << RESET;
                                }

                        } else {
                                int subChoice;
                                cout << CYAN << "\n--- Directed Graph Connectivity Options ---\n" << RESET;
                                cout << "  1. Check reachability from a specific vertex\n";
                                cout << "  2. Check if the graph is Strongly Connected\n";
                                cout << BOLD << "Select an option (1-2): " << RESET;
                                cin >> subChoice;

                                if (subChoice == 1) {
                                        int startNode;
                                        cout << "Enter the vertex to check from: ";
                                        cin >> startNode;

                                        if (startNode < 1 || startNode > n) {
                                                cout << RED
                                                     << "[!] Invalid vertex. Please enter a number between 1 and " << n
                                                     << ".\n"
                                                     << RESET;
                                                continue;
                                        }

                                        vector<bool> vis(n + 1, false);
                                        queue<int> q;
                                        int visitedCount = 0;

                                        q.push(startNode);
                                        vis[startNode] = true;

                                        while (!q.empty()) {
                                                int u = q.front();
                                                q.pop();
                                                visitedCount++;

                                                for (int v : adj[u]) {
                                                        if (!vis[v]) {
                                                                vis[v] = true;
                                                                q.push(v);
                                                        }
                                                }
                                        }

                                        cout << "\n[RESULT] ";
                                        if (visitedCount == n) {
                                                cout << GREEN << "Yes! All vertices are reachable from vertex "
                                                     << startNode << ".\n"
                                                     << RESET;
                                        } else {
                                                cout << YELLOW << "No. Only " << visitedCount << " out of " << n
                                                     << " vertices are reachable from vertex " << startNode << ".\n"
                                                     << RESET;
                                        }

                                } else if (subChoice == 2) {
                                        bool isStronglyConnected = true;

                                        for (int i = 1; i <= n; i++) {
                                                vector<bool> vis(n + 1, false);
                                                queue<int> q;
                                                int visitedCount = 0;

                                                q.push(i);
                                                vis[i] = true;

                                                while (!q.empty()) {
                                                        int u = q.front();
                                                        q.pop();
                                                        visitedCount++;

                                                        for (int v : adj[u]) {
                                                                if (!vis[v]) {
                                                                        vis[v] = true;
                                                                        q.push(v);
                                                                }
                                                        }
                                                }

                                                if (visitedCount < n) {
                                                        isStronglyConnected = false;
                                                        break;
                                                }
                                        }

                                        cout << "\n[RESULT] ";
                                        if (isStronglyConnected) {
                                                cout << GREEN << "Graph is Strongly Connected.\n" << RESET;
                                        } else {
                                                cout << RED << "Graph is Not Strongly Connected.\n" << RESET;
                                        }

                                } else {
                                        cout << RED << "[!] Invalid option. Returning to Main Menu.\n" << RESET;
                                }
                        }

                } else if (choice == 4) {
                        cout << CYAN << "\nTerminating program. Thank you!\n" << RESET;
                        break;
                } else {
                        cout << RED << "[!] Invalid option. Please select a number between 1 and 4.\n" << RESET;
                }
        }
}