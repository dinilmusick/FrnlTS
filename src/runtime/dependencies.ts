export interface DependencyNode {
  readonly id: string;
  readonly requires?: readonly string[];
  readonly provides?: readonly string[];
}

export class DependencyGraph {
  private readonly nodes = new Map<string, DependencyNode>();

  register(node: DependencyNode): void {
    if (!node || !node.id || typeof node.id !== 'string') {
      throw new TypeError('Invalid dependency node: id must be a non-empty string');
    }
    if (this.nodes.has(node.id)) {
      throw new Error(`Duplicate dependency node: ${node.id}`);
    }
    this.nodes.set(node.id, Object.freeze({ ...node }));
  }

  get(id: string): DependencyNode | undefined {
    return this.nodes.get(id);
  }

  list(): readonly DependencyNode[] {
    return [...this.nodes.values()];
  }

  validate(): string[] {
    const errors: string[] = [];
    for (const node of this.nodes.values()) {
      for (const req of node.requires ?? []) {
        if (!this.nodes.has(req)) {
          errors.push(`${node.id} requires missing dependency ${req}`);
        }
      }
    }
    return errors;
  }

  topologicalOrder(): string[] {
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (id: string, path: string[] = []) => {
      if (visiting.has(id)) {
        const cycle = [...path, id].join(' -> ');
        throw new Error(`Dependency cycle detected at ${id}: ${cycle}`);
      }
      if (visited.has(id)) {
        return;
      }

      visiting.add(id);
      const node = this.nodes.get(id);
      for (const dep of node?.requires ?? []) {
        if (this.nodes.has(dep)) {
          visit(dep, [...path, id]);
        }
      }
      visiting.delete(id);
      visited.add(id);
      result.push(id);
    };

    for (const id of this.nodes.keys()) {
      visit(id);
    }

    return result;
  }

  clear(): void {
    this.nodes.clear();
  }
}